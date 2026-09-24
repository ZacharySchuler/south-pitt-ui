import type { APIRoute } from "astro";
import { getEnv } from "../../../../server/env";

export const prerender = false;

/** GET /api/history/photos/:photoId — implemented in Step 11. */
export const GET: APIRoute = async ({ params, locals }) => {
	void params.photoId;
	void getEnv(locals);

	return Response.json(
		{
			error: "not_implemented",
			message:
				"GET /api/history/photos/:photoId will be implemented in Step 11",
		},
		{ status: 501 },
	);
};
