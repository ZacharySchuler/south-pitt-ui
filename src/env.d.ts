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

	/** TODO(history-auth): Shared team password (or hash) for History Book login — Step 12 */
	HISTORY_PASSWORD?: string;
	/** TODO(history-auth): Secret used to sign History Book session cookies — Step 12 */
	HISTORY_SESSION_SECRET?: string;

	/** TODO(history-discord): Discord application id — Steps 14–18 */
	DISCORD_APPLICATION_ID?: string;
	/** TODO(history-discord): Discord interactions public key — Steps 15+ */
	DISCORD_PUBLIC_KEY?: string;
	/** TODO(history-discord): Club Discord guild/server id — Steps 15+ */
	DISCORD_GUILD_ID?: string;
}

interface ImportMetaEnv {
	readonly PUBLIC_GA_MEASUREMENT_ID?: string;
	readonly PUBLIC_META_PIXEL_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface Window {
	dataLayer?: unknown[];
	gtag?: (...args: unknown[]) => void;
	fbq?: (...args: unknown[]) => void;
}
