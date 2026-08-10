import type { APIContext } from "astro";

/** Resolve Cloudflare bindings from an Astro API/page context. */
export function getEnv(locals: APIContext["locals"]): Env {
	return locals.runtime.env;
}
