import { MemoryRepository } from "../repositories/memory-repository";
import { requireGoogleDriveCredentials } from "../storage/google-drive-auth";
import { GoogleDrivePhotoStorage } from "../storage/google-drive-storage";
import { validatePhotos } from "../validation/photos";
import type { PhotoStorage, StoredPhoto } from "./photo-storage";

export type MemoryPhoto = {
	id: number;
	storageProvider: string;
	storageId: string;
	originalFilename: string | null;
	sortOrder: number;
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
 * 1. Upload all photos to Drive first.
 * 2. Insert memory + photo rows in D1.
 * 3. If D1 fails after uploads, best-effort delete the uploaded Drive files
 *    to avoid orphans. If delete cleanup fails, log and surface the original error.
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

		const uploaded: StoredPhoto[] = [];
		try {
			for (const file of photos) {
				const stored = await this.photoStorage.upload(file, {
					filename: file.name,
					contentType: file.type,
					year: input.year,
				});
				uploaded.push(stored);
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

			const memoryPhotos: MemoryPhoto[] = [];
			for (const [sortOrder, stored] of uploaded.entries()) {
				const photoRow = await this.repository.insertPhoto({
					memoryId: row.id,
					storageProvider: stored.provider,
					storageId: stored.id,
					originalFilename: photos[sortOrder]?.name ?? null,
					sortOrder,
				});
				memoryPhotos.push({
					id: photoRow.id,
					storageProvider: photoRow.storage_provider,
					storageId: photoRow.storage_id,
					originalFilename: photoRow.original_filename,
					sortOrder: photoRow.sort_order,
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

	async getPhotoDownload(photoId: number): Promise<Response | null> {
		const photo = await this.repository.getPhotoById(photoId);
		if (!photo) {
			return null;
		}

		const driveResponse = await this.photoStorage.download(photo.storage_id);
		const headers = new Headers(driveResponse.headers);
		if (photo.original_filename) {
			headers.set(
				"Content-Disposition",
				`inline; filename="${photo.original_filename.replace(/"/g, "")}"`,
			);
		}

		return new Response(driveResponse.body, {
			status: driveResponse.status,
			headers,
		});
	}

	private async cleanupUploadedPhotos(uploaded: StoredPhoto[]): Promise<void> {
		for (const stored of uploaded) {
			try {
				await this.photoStorage.delete(stored.id);
			} catch (cleanupError) {
				console.error(
					`Failed to clean up Drive file ${stored.id} after memory create failure`,
					cleanupError,
				);
			}
		}
	}
}

/**
 * Shared factory for website and Discord entry points.
 * Text-only create/list work without Google secrets; photo upload/serve require them.
 */
export function createMemoryService(env: Env): MemoryService {
	let photoStorage: PhotoStorage;
	try {
		photoStorage = new GoogleDrivePhotoStorage(requireGoogleDriveCredentials(env));
	} catch {
		photoStorage = new UnavailablePhotoStorage();
	}

	return new MemoryService(new MemoryRepository(env.DB), photoStorage);
}

class UnavailablePhotoStorage implements PhotoStorage {
	async upload(): Promise<StoredPhoto> {
		throw new Error(
			"Google Drive is not configured. Set GOOGLE_* secrets before uploading photos.",
		);
	}

	async download(): Promise<Response> {
		throw new Error(
			"Google Drive is not configured. Set GOOGLE_* secrets before serving photos.",
		);
	}

	async delete(): Promise<void> {
		throw new Error(
			"Google Drive is not configured. Set GOOGLE_* secrets before deleting photos.",
		);
	}
}
