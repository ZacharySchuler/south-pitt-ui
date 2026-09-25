/**
 * Shared-password History Book auth.
 *
 * TODO(history-auth): Implement Steps 12–13.
 * - Validate password against env.HISTORY_PASSWORD (prefer a hash, not plaintext compare in logs)
 * - Sign HttpOnly/Secure/SameSite=Lax session cookies with env.HISTORY_SESSION_SECRET
 * - Use a reasonably long session TTL for this low-risk club archive
 * - Expose helpers used by middleware / page guards for /history and /api/history/*
 */

export type HistorySession = {
	authenticated: boolean;
};

// TODO(history-auth): Return success + Set-Cookie headers on valid password.
export async function loginWithTeamPassword(
	_password: string,
	_env: Env,
): Promise<{ ok: false; reason: "not_implemented" }> {
	return { ok: false, reason: "not_implemented" };
}

// TODO(history-auth): Clear the signed history session cookie (Step 13).
export async function clearHistorySession(): Promise<void> {
	// Step 13: clear signed session cookie
}

// TODO(history-auth): Verify signed session cookie on the request.
export function isAuthenticated(_request: Request, _env: Env): boolean {
	return false;
}
