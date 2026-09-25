export type MemoryRow = {
	id: number;
	year: number;
	event_date: string | null;
	title: string | null;
	caption: string;
	source: string;
	submitted_by: string | null;
	created_at: string;
};

export type MemoryPhotoRow = {
	id: number;
	memory_id: number;
	storage_provider: string;
	storage_id: string;
	original_filename: string | null;
	sort_order: number;
};

export type InsertMemoryRecord = {
	year: number;
	eventDate?: string | null;
	title?: string | null;
	caption: string;
	source: string;
	submittedBy?: string | null;
	createdAt: string;
};

export type InsertPhotoRecord = {
	memoryId: number;
	storageProvider: string;
	storageId: string;
	originalFilename?: string | null;
	sortOrder: number;
};

export class MemoryRepository {
	constructor(private readonly db: D1Database) {}

	async insertMemory(record: InsertMemoryRecord): Promise<MemoryRow> {
		const result = await this.db
			.prepare(
				`INSERT INTO memories (year, event_date, title, caption, source, submitted_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING id, year, event_date, title, caption, source, submitted_by, created_at`,
			)
			.bind(
				record.year,
				record.eventDate ?? null,
				record.title ?? null,
				record.caption,
				record.source,
				record.submittedBy ?? null,
				record.createdAt,
			)
			.first<MemoryRow>();

		if (!result) {
			throw new Error("Failed to insert memory");
		}

		return result;
	}

	async listMemories(): Promise<MemoryRow[]> {
		const { results } = await this.db
			.prepare(
				`SELECT id, year, event_date, title, caption, source, submitted_by, created_at
         FROM memories
         ORDER BY year DESC, event_date DESC, created_at DESC`,
			)
			.all<MemoryRow>();

		return results ?? [];
	}

	async insertPhoto(record: InsertPhotoRecord): Promise<MemoryPhotoRow> {
		const result = await this.db
			.prepare(
				`INSERT INTO memory_photos (memory_id, storage_provider, storage_id, original_filename, sort_order)
         VALUES (?, ?, ?, ?, ?)
         RETURNING id, memory_id, storage_provider, storage_id, original_filename, sort_order`,
			)
			.bind(
				record.memoryId,
				record.storageProvider,
				record.storageId,
				record.originalFilename ?? null,
				record.sortOrder,
			)
			.first<MemoryPhotoRow>();

		if (!result) {
			throw new Error("Failed to insert memory photo");
		}

		return result;
	}

	async listPhotosForMemories(
		memoryIds: number[],
	): Promise<MemoryPhotoRow[]> {
		if (memoryIds.length === 0) {
			return [];
		}

		const placeholders = memoryIds.map(() => "?").join(", ");
		const { results } = await this.db
			.prepare(
				`SELECT id, memory_id, storage_provider, storage_id, original_filename, sort_order
         FROM memory_photos
         WHERE memory_id IN (${placeholders})
         ORDER BY memory_id ASC, sort_order ASC, id ASC`,
			)
			.bind(...memoryIds)
			.all<MemoryPhotoRow>();

		return results ?? [];
	}

	async getPhotoById(photoId: number): Promise<MemoryPhotoRow | null> {
		return this.db
			.prepare(
				`SELECT id, memory_id, storage_provider, storage_id, original_filename, sort_order
         FROM memory_photos
         WHERE id = ?`,
			)
			.bind(photoId)
			.first<MemoryPhotoRow>();
	}
}
