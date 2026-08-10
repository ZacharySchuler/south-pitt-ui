/**
 * Shared-password History Book auth. Implemented in Step 12.
 */

export type HistorySession = {
	authenticated: boolean;
};

export async function loginWithTeamPassword(
	_password: string,
	_env: Env,
): Promise<{ ok: false; reason: "not_implemented" }> {
	return { ok: false, reason: "not_implemented" };
}

export async function clearHistorySession(): Promise<void> {
	// Step 13: clear signed session cookie
}

export function isAuthenticated(_request: Request, _env: Env): boolean {
	return false;
}
