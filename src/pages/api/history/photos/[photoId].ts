import type { APIRoute } from "astro";
import { getEnv } from "../../../../server/env";
import { createMemoryService } from "../../../../server/services/memory-service";

export const prerender = false;

/** GET /api/history/photos/:photoId — streams a private Drive file through the Worker. */
export const GET: APIRoute = async ({ params, locals }) => {
	const rawId = params.photoId;
	const photoId = rawId ? Number(rawId) : NaN;
	if (!Number.isInteger(photoId) || photoId <= 0) {
		return Response.json(
			{ error: "invalid_id", message: "photoId must be a positive integer" },
			{ status: 400 },
		);
	}

	try {
		const service = createMemoryService(getEnv(locals));
		const response = await service.getPhotoDownload(photoId);
		if (!response) {
			return Response.json(
				{ error: "not_found", message: "Photo not found" },
				{ status: 404 },
			);
		}
		return response;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to load photo";
		if (message.includes("Google Drive is not configured")) {
			return Response.json(
				{ error: "misconfigured", message },
				{ status: 503 },
			);
		}
		console.error("GET /api/history/photos/:photoId failed", error);
		return Response.json(
			{ error: "internal_error", message: "Failed to load photo" },
			{ status: 500 },
		);
	}
};
