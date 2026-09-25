import type {
	PhotoStorage,
	PhotoUploadMetadata,
	StoredPhoto,
} from "../services/photo-storage";

const PROVIDER = "r2";

export type R2PhotoStorageOptions = {
	bucket: R2Bucket;
	publicBaseUrl: string;
};

/**
 * Cloudflare R2 photo storage.
 * Uploads via Worker binding; browsers read via public R2 URLs.
 */
export class R2PhotoStorage implements PhotoStorage {
	constructor(private readonly options: R2PhotoStorageOptions) {}

	async upload(
		file: File,
		metadata?: PhotoUploadMetadata,
	): Promise<StoredPhoto> {
		const filename =
			sanitizeFilename(metadata?.filename ?? file.name) || `photo-${Date.now()}`;
		const contentType =
			metadata?.contentType || file.type || "application/octet-stream";
		const key = buildObjectKey(filename, metadata?.memoryId);

		await this.options.bucket.put(key, await file.arrayBuffer(), {
			httpMetadata: {
				contentType,
				cacheControl: "public, max-age=31536000, immutable",
			},
			customMetadata: {
				originalFilename: filename,
			},
		});

		return { provider: PROVIDER, id: key };
	}

	async delete(id: string): Promise<void> {
		await this.options.bucket.delete(id);
	}

	publicUrl(id: string): string {
		const base = this.options.publicBaseUrl.replace(/\/+$/, "");
		const key = id.replace(/^\/+/, "");
		return `${base}/${key}`;
	}
}

function buildObjectKey(filename: string, memoryId?: number): string {
	const uuid = crypto.randomUUID();
	if (typeof memoryId === "number" && Number.isInteger(memoryId) && memoryId > 0) {
		return `memories/${memoryId}/${uuid}-${filename}`;
	}
	return `photos/${uuid}-${filename}`;
}

function sanitizeFilename(name: string): string {
	const base = name.split(/[/\\]/).pop() ?? "";
	return base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 120);
}
