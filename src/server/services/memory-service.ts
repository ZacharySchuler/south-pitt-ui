import { MemoryRepository } from "../repositories/memory-repository";
import { GoogleDrivePhotoStorage } from "../storage/google-drive-storage";
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
	/** Accepted in the type for later steps; photo uploads are not wired yet. */
	photos?: File[];
};

export class MemoryService {
	constructor(
		private readonly repository: MemoryRepository,
		private readonly photoStorage: PhotoStorage,
	) {}

	async createMemory(input: CreateMemoryInput): Promise<Memory> {
		if (input.photos && input.photos.length > 0) {
			throw new Error(
				"Photo uploads are not implemented yet. Submit text-only memories for now.",
			);
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

		return {
			id: row.id,
			year: row.year,
			eventDate: row.event_date,
			title: row.title,
			caption: row.caption,
			source: row.source,
			submittedBy: row.submitted_by,
			createdAt: row.created_at,
			photos: [],
		};
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

	/** Reserved for later photo upload orchestration (Steps 8–10). */
	async uploadPhoto(file: File): Promise<StoredPhoto> {
		return this.photoStorage.upload(file);
	}
}

/** Shared factory for website and Discord entry points. */
export function createMemoryService(env: Env): MemoryService {
	return new MemoryService(
		new MemoryRepository(env.DB),
		new GoogleDrivePhotoStorage(),
	);
}
