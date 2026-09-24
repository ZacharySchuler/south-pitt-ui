export type GoogleDriveCredentials = {
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	rootFolderId: string;
};

export function requireGoogleDriveCredentials(
	env: Env,
): GoogleDriveCredentials {
	const clientId = env.GOOGLE_CLIENT_ID?.trim();
	const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
	const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim();
	const rootFolderId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim();

	if (!clientId || !clientSecret || !refreshToken || !rootFolderId) {
		throw new Error(
			"Google Drive is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GOOGLE_DRIVE_ROOT_FOLDER_ID.",
		);
	}

	return { clientId, clientSecret, refreshToken, rootFolderId };
}

type TokenCache = {
	accessToken: string;
	expiresAtMs: number;
};

let tokenCache: TokenCache | null = null;

export async function getGoogleAccessToken(
	credentials: Pick<
		GoogleDriveCredentials,
		"clientId" | "clientSecret" | "refreshToken"
	>,
): Promise<string> {
	const now = Date.now();
	if (tokenCache && tokenCache.expiresAtMs > now + 60_000) {
		return tokenCache.accessToken;
	}

	const body = new URLSearchParams({
		client_id: credentials.clientId,
		client_secret: credentials.clientSecret,
		refresh_token: credentials.refreshToken,
		grant_type: "refresh_token",
	});

	const response = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(
			`Failed to refresh Google access token (${response.status}): ${detail}`,
		);
	}

	const json = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
	};

	if (!json.access_token) {
		throw new Error("Google token response missing access_token");
	}

	tokenCache = {
		accessToken: json.access_token,
		expiresAtMs: now + (json.expires_in ?? 3600) * 1000,
	};

	return json.access_token;
}
