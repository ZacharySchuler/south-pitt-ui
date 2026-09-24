export type StoredPhoto = {
	provider: string;
	id: string;
};

export type PhotoUploadMetadata = {
	filename?: string;
	contentType?: string;
	year?: number;
};

export interface PhotoStorage {
	upload(file: File, metadata?: PhotoUploadMetadata): Promise<StoredPhoto>;
	download(id: string): Promise<Response>;
	delete(id: string): Promise<void>;
}
