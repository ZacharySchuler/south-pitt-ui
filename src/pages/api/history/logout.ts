import type { APIRoute } from "astro";
import { clearHistorySession } from "../../../server/services/auth-service";

export const prerender = false;

/**
 * POST /api/history/logout
 *
 * TODO(history-auth): Implement Step 13.
 * - Clear the history session cookie via clearHistorySession()
 * - Return 200 / redirect-friendly JSON
 */
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
