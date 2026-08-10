import type { APIRoute } from "astro";
import { loginWithTeamPassword } from "../../../server/services/auth-service";
import { getEnv } from "../../../server/env";

export const prerender = false;

/** POST /api/history/login — implemented in Step 12. */
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
