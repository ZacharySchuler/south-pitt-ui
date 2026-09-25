import type { APIRoute } from "astro";
import { getEnv } from "../../../server/env";
import { createMemoryService } from "../../../server/services/memory-service";

export const prerender = false;

/**
 * POST /api/discord/interactions
 *
 * TODO(history-discord): Implement Steps 14–18.
 * - Verify Discord request signature with env.DISCORD_PUBLIC_KEY; reject invalid requests
 * - Confirm guild matches env.DISCORD_GUILD_ID
 * - Handle Discord ping (type URL verification) and /yearbook slash command
 * - Download attachment(s), then call createMemoryService(env).createMemory({
 *     source: "discord",
 *     submittedBy: discordUserId,
 *     ...
 *   })
 * - Return an ephemeral success/error response
 * Do not put R2/D1 logic directly in this route — reuse createMemory().
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
