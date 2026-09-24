import type { APIRoute } from "astro";
import { toMemoryResponse } from "../../../server/api/memory-response";
import { getEnv } from "../../../server/env";
import { createMemoryService } from "../../../server/services/memory-service";
import {
	validateCreateMemoryBody,
	validateCreateMemoryForm,
} from "../../../server/validation/memory";

export const prerender = false;

/**
 * GET /api/history/memories
 * Returns memories ordered by year DESC, event_date DESC, created_at DESC.
 */
export const GET: APIRoute = async ({ locals }) => {
	try {
		const service = createMemoryService(getEnv(locals));
		const memories = await service.listMemories();
		return Response.json(memories.map(toMemoryResponse));
	} catch (error) {
		console.error("GET /api/history/memories failed", error);
		return Response.json(
			{ error: "internal_error", message: "Failed to list memories" },
			{ status: 500 },
		);
	}
};

/**
 * POST /api/history/memories
 * Accepts JSON (text-only) or multipart/form-data (optional photos).
 */
export const POST: APIRoute = async ({ request, locals }) => {
	const contentType = request.headers.get("content-type") ?? "";

	let validated;
	try {
		if (contentType.includes("multipart/form-data")) {
			const form = await request.formData();
			validated = validateCreateMemoryForm(form);
		} else {
			let body: unknown;
			try {
				body = await request.json();
			} catch {
				return Response.json(
					{ error: "invalid_json", message: "Request body must be valid JSON" },
					{ status: 400 },
				);
			}
			validated = validateCreateMemoryBody(body);
		}
	} catch (error) {
		console.error("POST /api/history/memories parse failed", error);
		return Response.json(
			{ error: "invalid_request", message: "Could not parse request body" },
			{ status: 400 },
		);
	}

	if (!validated.ok) {
		return Response.json(
			{ error: "validation_error", message: validated.error },
			{ status: 400 },
		);
	}

	try {
		const service = createMemoryService(getEnv(locals));
		const memory = await service.createMemory(validated.value);
		return Response.json(toMemoryResponse(memory), { status: 201 });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to create memory";
		if (
			message.includes("Google Drive is not configured") ||
			message.includes("At most") ||
			message.includes("must be a JPEG") ||
			message.includes("exceeds the")
		) {
			return Response.json(
				{ error: "validation_error", message },
				{ status: 400 },
			);
		}
		console.error("POST /api/history/memories failed", error);
		return Response.json(
			{ error: "internal_error", message: "Failed to create memory" },
			{ status: 500 },
		);
	}
};
