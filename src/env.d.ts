/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

interface Env {
	DB: D1Database;
	ASSETS: Fetcher;
	HISTORY_PHOTOS?: R2Bucket;

	/** Public base URL for R2 objects, e.g. https://history-photos.southpittrugby.com */
	R2_PUBLIC_BASE_URL?: string;

	/** Shared team password (or hash) for History Book login — Step 12 */
	HISTORY_PASSWORD?: string;
	/** Secret used to sign History Book session cookies — Step 12 */
	HISTORY_SESSION_SECRET?: string;

	DISCORD_APPLICATION_ID?: string;
	DISCORD_PUBLIC_KEY?: string;
	DISCORD_GUILD_ID?: string;
}
