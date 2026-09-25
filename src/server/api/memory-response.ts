import type { Memory, MemoryPhoto } from "../services/memory-service";

/** Public photo shape for JSON responses. */
export type MemoryPhotoResponse = {
	id: number;
	url: string;
	originalFilename: string | null;
	sortOrder: number;
};

/** Clean API model for history memories. */
export type MemoryResponse = {
	id: number;
	year: number;
	eventDate: string | null;
	title: string | null;
	caption: string;
	source: string;
	submittedBy: string | null;
	createdAt: string;
	photos: MemoryPhotoResponse[];
};

function toPhotoResponse(photo: MemoryPhoto): MemoryPhotoResponse {
	return {
		id: photo.id,
		url: photo.url,
		originalFilename: photo.originalFilename,
		sortOrder: photo.sortOrder,
	};
}

export function toMemoryResponse(memory: Memory): MemoryResponse {
	return {
		id: memory.id,
		year: memory.year,
		eventDate: memory.eventDate,
		title: memory.title,
		caption: memory.caption,
		source: memory.source,
		submittedBy: memory.submittedBy,
		createdAt: memory.createdAt,
		photos: memory.photos.map(toPhotoResponse),
	};
}
