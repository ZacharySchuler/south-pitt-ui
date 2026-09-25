import { MemoryRepository } from "../repositories/memory-repository";
import { R2PhotoStorage } from "../storage/r2-photo-storage";
import { validatePhotos } from "../validation/photos";
import type { PhotoStorage, StoredPhoto } from "./photo-storage";

export type MemoryPhoto = {
	id: number;
	storageProvider: string;
	storageId: string;
	originalFilename: string | null;
	sortOrder: number;
	url: string;
};

export type Memory = {
	id: number;
	year: number;
	eventDate: string | null;
	title: string | null;
	caption: string;
	source: string;
	submittedBy: string | null;
	createdAt: string;
	photos: MemoryPhoto[];
};

export type CreateMemoryInput = {
	year: number;
	eventDate?: string | null;
	title?: string | null;
	caption: string;
	source: string;
	submittedBy?: string | null;
	photos?: File[];
};

/**
 * Failure strategy:
 * 1. Insert the memory row in D1 first.
 * 2. Upload photos to R2 using memories/<id>/… keys.
 * 3. Insert memory_photos rows.
 * 4. If photo upload/metadata fails after some R2 puts, best-effort delete
 *    those objects. The text memory row is left in place.
 */
export class MemoryService {
	constructor(
		private readonly repository: MemoryRepository,
		private readonly photoStorage: PhotoStorage,
	) {}

	async createMemory(input: CreateMemoryInput): Promise<Memory> {
		const photos = input.photos ?? [];
		if (photos.length > 0) {
			const photoCheck = validatePhotos(photos);
			if (!photoCheck.ok) {
				throw new Error(photoCheck.error);
			}
		}

		const createdAt = new Date().toISOString();
		const row = await this.repository.insertMemory({
			year: input.year,
			eventDate: input.eventDate ?? null,
			title: input.title ?? null,
			caption: input.caption,
			source: input.source,
			submittedBy: input.submittedBy ?? null,
			createdAt,
		});

		const uploaded: StoredPhoto[] = [];
		try {
			const memoryPhotos: MemoryPhoto[] = [];

			for (const [sortOrder, file] of photos.entries()) {
				const stored = await this.photoStorage.upload(file, {
					filename: file.name,
					contentType: file.type,
					year: input.year,
					memoryId: row.id,
				});
				uploaded.push(stored);

				const photoRow = await this.repository.insertPhoto({
					memoryId: row.id,
					storageProvider: stored.provider,
					storageId: stored.id,
					originalFilename: file.name,
					sortOrder,
				});

				memoryPhotos.push({
					id: photoRow.id,
					storageProvider: photoRow.storage_provider,
					storageId: photoRow.storage_id,
					originalFilename: photoRow.original_filename,
					sortOrder: photoRow.sort_order,
					url: this.photoStorage.publicUrl(photoRow.storage_id),
				});
			}

			return {
				id: row.id,
				year: row.year,
				eventDate: row.event_date,
				title: row.title,
				caption: row.caption,
				source: row.source,
				submittedBy: row.submitted_by,
				createdAt: row.created_at,
				photos: memoryPhotos,
			};
		} catch (error) {
			await this.cleanupUploadedPhotos(uploaded);
			throw error;
		}
	}

	async listMemories(): Promise<Memory[]> {
		const rows = await this.repository.listMemories();
		const photos = await this.repository.listPhotosForMemories(
			rows.map((row) => row.id),
		);

		const photosByMemory = new Map<number, MemoryPhoto[]>();
		for (const photo of photos) {
			const list = photosByMemory.get(photo.memory_id) ?? [];
			list.push({
				id: photo.id,
				storageProvider: photo.storage_provider,
				storageId: photo.storage_id,
				originalFilename: photo.original_filename,
				sortOrder: photo.sort_order,
				url: this.photoStorage.publicUrl(photo.storage_id),
			});
			photosByMemory.set(photo.memory_id, list);
		}

		return rows.map((row) => ({
			id: row.id,
			year: row.year,
			eventDate: row.event_date,
			title: row.title,
			caption: row.caption,
			source: row.source,
			submittedBy: row.submitted_by,
			createdAt: row.created_at,
			photos: photosByMemory.get(row.id) ?? [],
		}));
	}

	private async cleanupUploadedPhotos(uploaded: StoredPhoto[]): Promise<void> {
		for (const stored of uploaded) {
			try {
				await this.photoStorage.delete(stored.id);
			} catch (cleanupError) {
				console.error(
					`Failed to clean up R2 object ${stored.id} after memory create failure`,
					cleanupError,
				);
			}
		}
	}
}

/** Shared factory for website and Discord entry points. */
export function createMemoryService(env: Env): MemoryService {
	return new MemoryService(
		new MemoryRepository(env.DB),
		createPhotoStorage(env),
	);
}

function createPhotoStorage(env: Env): PhotoStorage {
	const publicBaseUrl = env.R2_PUBLIC_BASE_URL?.trim();
	if (!env.HISTORY_PHOTOS || !publicBaseUrl) {
		return new UnavailablePhotoStorage(publicBaseUrl);
	}

	return new R2PhotoStorage({
		bucket: env.HISTORY_PHOTOS,
		publicBaseUrl,
	});
}

class UnavailablePhotoStorage implements PhotoStorage {
	constructor(private readonly publicBaseUrl?: string) {}

	async upload(): Promise<StoredPhoto> {
		throw new Error(
			"R2 photo storage is not configured. Set the HISTORY_PHOTOS binding and R2_PUBLIC_BASE_URL.",
		);
	}

	async delete(): Promise<void> {
		throw new Error(
			"R2 photo storage is not configured. Set the HISTORY_PHOTOS binding and R2_PUBLIC_BASE_URL.",
		);
	}

	publicUrl(id: string): string {
		if (!this.publicBaseUrl) {
			return "";
		}
		const base = this.publicBaseUrl.replace(/\/+$/, "");
		return `${base}/${id.replace(/^\/+/, "")}`;
	}
}
