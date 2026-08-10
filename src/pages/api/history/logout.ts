import type { APIRoute } from "astro";
import { clearHistorySession } from "../../../server/services/auth-service";

export const prerender = false;

/** POST /api/history/logout — implemented in Step 13. */
export const POST: APIRoute = async () => {
	void clearHistorySession;

	return Response.json(
		{
			error: "not_implemented",
			message: "POST /api/history/logout will be implemented in Step 13",
		},
		{ status: 501 },
	);
};
