/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

interface Env {
	DB: D1Database;
	ASSETS: Fetcher;

	/** Shared team password (or hash) for History Book login — Step 12 */
	HISTORY_PASSWORD?: string;
	/** Secret used to sign History Book session cookies — Step 12 */
	HISTORY_SESSION_SECRET?: string;

	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	GOOGLE_REFRESH_TOKEN?: string;
	GOOGLE_DRIVE_ROOT_FOLDER_ID?: string;

	DISCORD_APPLICATION_ID?: string;
	DISCORD_PUBLIC_KEY?: string;
	DISCORD_GUILD_ID?: string;
}
