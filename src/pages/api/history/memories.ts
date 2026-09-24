import type { APIRoute } from "astro";
import { getEnv } from "../../../server/env";
import { createMemoryService } from "../../../server/services/memory-service";

export const prerender = false;

/**
 * GET/POST /api/history/memories
 * Wired to MemoryService in Steps 4–5. Stubbed for Steps 1–3.
 */
export const GET: APIRoute = async ({ locals }) => {
	// Ensure the service factory is reachable from this route.
	void createMemoryService;
	void getEnv(locals);

	return Response.json(
		{
			error: "not_implemented",
			message: "GET /api/history/memories will be implemented in Step 5",
		},
		{ status: 501 },
	);
};

export const POST: APIRoute = async ({ locals }) => {
	void createMemoryService;
	void getEnv(locals);

	return Response.json(
		{
			error: "not_implemented",
			message: "POST /api/history/memories will be implemented in Step 4",
		},
		{ status: 501 },
	);
};
