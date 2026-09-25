export type StoredPhoto = {
	provider: string;
	id: string;
};

export type PhotoUploadMetadata = {
	filename?: string;
	contentType?: string;
	year?: number;
	memoryId?: number;
};

export interface PhotoStorage {
	upload(file: File, metadata?: PhotoUploadMetadata): Promise<StoredPhoto>;
	delete(id: string): Promise<void>;
	publicUrl(id: string): string;
}
