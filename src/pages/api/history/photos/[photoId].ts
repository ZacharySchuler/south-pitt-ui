import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Photo bytes are served from public R2 URLs, not this Worker route.
 * Kept as an explicit 410 so old clients fail clearly.
 */
export const GET: APIRoute = async () => {
	return Response.json(
		{
			error: "gone",
			message:
				"Photos are served from public R2 URLs. Use the url field on each photo in GET /api/history/memories.",
		},
		{ status: 410 },
	);
};
