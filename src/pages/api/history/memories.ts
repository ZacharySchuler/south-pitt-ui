import type { APIRoute } from "astro";
import { toMemoryResponse } from "../../../server/api/memory-response";
import { getEnv } from "../../../server/env";
import { createMemoryService } from "../../../server/services/memory-service";
import { validateCreateMemoryBody } from "../../../server/validation/memory";

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
 * Creates a text-only memory in D1. Photo uploads are not supported yet.
 */
export const POST: APIRoute = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json(
			{ error: "invalid_json", message: "Request body must be valid JSON" },
			{ status: 400 },
		);
	}

	const validated = validateCreateMemoryBody(body);
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
		const message = error instanceof Error ? error.message : "Failed to create memory";
		if (message.includes("Photo uploads are not implemented")) {
			return Response.json(
				{ error: "not_supported", message },
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
