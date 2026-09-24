import type { APIRoute } from "astro";
import { getEnv } from "../../../server/env";
import { createMemoryService } from "../../../server/services/memory-service";

export const prerender = false;

/**
 * POST /api/discord/interactions
 * Discord slash-command endpoint — implemented in Steps 15–18.
 * Will call the same createMemory() path as the website.
 */
export const POST: APIRoute = async ({ locals }) => {
	void createMemoryService;
	void getEnv(locals);

	return Response.json(
		{
			error: "not_implemented",
			message:
				"POST /api/discord/interactions will be implemented in Steps 15–18",
		},
		{ status: 501 },
	);
};
