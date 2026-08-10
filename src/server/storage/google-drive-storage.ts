import type {
	PhotoStorage,
	PhotoUploadMetadata,
	StoredPhoto,
} from "../services/photo-storage";

/**
 * Google Drive photo storage. Implemented in Step 8.
 * Until then, all methods throw NotImplemented.
 */
export class GoogleDrivePhotoStorage implements PhotoStorage {
	async upload(
		_file: File,
		_metadata?: PhotoUploadMetadata,
	): Promise<StoredPhoto> {
		throw new Error("NotImplemented: GoogleDrivePhotoStorage.upload");
	}

	async download(_id: string): Promise<Response> {
		throw new Error("NotImplemented: GoogleDrivePhotoStorage.download");
	}

	async delete(_id: string): Promise<void> {
		throw new Error("NotImplemented: GoogleDrivePhotoStorage.delete");
	}
}
