import type {
	PhotoStorage,
	PhotoUploadMetadata,
	StoredPhoto,
} from "../services/photo-storage";
import {
	getGoogleAccessToken,
	type GoogleDriveCredentials,
} from "./google-drive-auth";

const PROVIDER = "google_drive";

/**
 * Google Drive photo storage. Files stay private; the Worker serves bytes.
 */
export class GoogleDrivePhotoStorage implements PhotoStorage {
	constructor(private readonly credentials: GoogleDriveCredentials) {}

	async upload(
		file: File,
		metadata?: PhotoUploadMetadata,
	): Promise<StoredPhoto> {
		const accessToken = await getGoogleAccessToken(this.credentials);
		const filename =
			sanitizeDriveFilename(metadata?.filename ?? file.name) ||
			`photo-${Date.now()}`;
		const contentType =
			metadata?.contentType || file.type || "application/octet-stream";

		const metadataJson = JSON.stringify({
			name: filename,
			parents: [this.credentials.rootFolderId],
		});

		const boundary = `historybook_${crypto.randomUUID().replace(/-/g, "")}`;
		const encoder = new TextEncoder();
		const fileBytes = new Uint8Array(await file.arrayBuffer());

		const preamble = encoder.encode(
			`--${boundary}\r\n` +
				`Content-Type: application/json; charset=UTF-8\r\n\r\n` +
				`${metadataJson}\r\n` +
				`--${boundary}\r\n` +
				`Content-Type: ${contentType}\r\n\r\n`,
		);
		const closing = encoder.encode(`\r\n--${boundary}--`);

		const body = new Uint8Array(
			preamble.length + fileBytes.length + closing.length,
		);
		body.set(preamble, 0);
		body.set(fileBytes, preamble.length);
		body.set(closing, preamble.length + fileBytes.length);

		const response = await fetch(
			"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": `multipart/related; boundary=${boundary}`,
				},
				body,
			},
		);

		if (!response.ok) {
			const detail = await response.text();
			throw new Error(
				`Google Drive upload failed (${response.status}): ${detail}`,
			);
		}

		const json = (await response.json()) as { id?: string };
		if (!json.id) {
			throw new Error("Google Drive upload response missing file id");
		}

		return { provider: PROVIDER, id: json.id };
	}

	async download(id: string): Promise<Response> {
		const accessToken = await getGoogleAccessToken(this.credentials);
		const response = await fetch(
			`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);

		if (!response.ok) {
			const detail = await response.text();
			throw new Error(
				`Google Drive download failed (${response.status}): ${detail}`,
			);
		}

		const headers = new Headers();
		const contentType = response.headers.get("Content-Type");
		const contentLength = response.headers.get("Content-Length");
		if (contentType) {
			headers.set("Content-Type", contentType);
		}
		if (contentLength) {
			headers.set("Content-Length", contentLength);
		}
		headers.set("Cache-Control", "private, max-age=3600");

		return new Response(response.body, {
			status: 200,
			headers,
		});
	}

	async delete(id: string): Promise<void> {
		const accessToken = await getGoogleAccessToken(this.credentials);
		const response = await fetch(
			`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`,
			{
				method: "DELETE",
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);

		// 404 means already gone — treat as success for cleanup paths.
		if (!response.ok && response.status !== 404) {
			const detail = await response.text();
			throw new Error(
				`Google Drive delete failed (${response.status}): ${detail}`,
			);
		}
	}
}

function sanitizeDriveFilename(name: string): string {
	const base = name.split(/[/\\]/).pop() ?? "";
	return base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180);
}
