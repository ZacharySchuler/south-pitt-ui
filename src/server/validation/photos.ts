import type { ValidationResult } from "./memory";

export const MAX_PHOTOS_PER_MEMORY = 10;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MiB

const ALLOWED_MIME_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([
	".jpg",
	".jpeg",
	".png",
	".webp",
	".gif",
]);

export function validatePhotos(files: File[]): ValidationResult<File[]> {
	if (files.length > MAX_PHOTOS_PER_MEMORY) {
		return {
			ok: false,
			error: `At most ${MAX_PHOTOS_PER_MEMORY} photos are allowed per memory`,
		};
	}

	const accepted: File[] = [];

	for (const [index, file] of files.entries()) {
		const label = `photo ${index + 1}`;

		if (!(file instanceof File)) {
			return { ok: false, error: `${label} is not a file` };
		}
		if (file.size <= 0) {
			return { ok: false, error: `${label} is empty` };
		}
		if (file.size > MAX_PHOTO_BYTES) {
			return {
				ok: false,
				error: `${label} exceeds the ${MAX_PHOTO_BYTES / (1024 * 1024)} MiB limit`,
			};
		}

		const mime = (file.type || "").toLowerCase();
		const extension = extensionOf(file.name);
		const mimeOk = ALLOWED_MIME_TYPES.has(mime);
		const extOk = extension !== null && ALLOWED_EXTENSIONS.has(extension);

		if (!mimeOk && !extOk) {
			return {
				ok: false,
				error: `${label} must be a JPEG, PNG, WebP, or GIF image`,
			};
		}

		if (mimeOk && extOk && !extensionMatchesMime(extension!, mime)) {
			return {
				ok: false,
				error: `${label} file extension does not match its content type`,
			};
		}

		accepted.push(file);
	}

	return { ok: true, value: accepted };
}

function extensionOf(filename: string): string | null {
	const base = filename.split(/[/\\]/).pop() ?? "";
	const dot = base.lastIndexOf(".");
	if (dot <= 0) {
		return null;
	}
	return base.slice(dot).toLowerCase();
}

function extensionMatchesMime(extension: string, mime: string): boolean {
	switch (mime) {
		case "image/jpeg":
			return extension === ".jpg" || extension === ".jpeg";
		case "image/png":
			return extension === ".png";
		case "image/webp":
			return extension === ".webp";
		case "image/gif":
			return extension === ".gif";
		default:
			return false;
	}
}
