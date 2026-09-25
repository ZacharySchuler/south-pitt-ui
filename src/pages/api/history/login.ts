import type { APIRoute } from "astro";
import { loginWithTeamPassword } from "../../../server/services/auth-service";
import { getEnv } from "../../../server/env";

export const prerender = false;

/**
 * POST /api/history/login
 *
 * TODO(history-auth): Implement Step 12.
 * - Parse password from JSON or form body
 * - Call loginWithTeamPassword()
 * - On success, return 200 and set the session cookie
 * - On failure, return 401 (do not leak whether the password store is configured)
 */
export const POST: APIRoute = async ({ request, locals }) => {
	void request;
	void loginWithTeamPassword;
	void getEnv(locals);

	return Response.json(
		{
			error: "not_implemented",
			message: "POST /api/history/login will be implemented in Step 12",
		},
		{ status: 501 },
	);
};
