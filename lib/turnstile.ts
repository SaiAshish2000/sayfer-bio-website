import "server-only";

/**
 * Cloudflare Turnstile, verified server-side.
 *
 * The browser widget's success callback is a convenience, not evidence: anything
 * that can POST to the endpoint can also claim to have passed. The token is only
 * meaningful once Cloudflare has confirmed it against the secret key, which is
 * why this module is server-only and the secret never reaches the client.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "rejected" | "unreachable" };

/** Whether the server has what it needs to verify a token at all. */
export function turnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Deliberately fails closed. An unconfigured deployment must refuse to accept
  // submissions rather than quietly accept every one of them.
  if (!secret) return { ok: false, reason: "unconfigured" };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      // Cloudflare is fast; a hung verify should surface as an error, not a hang.
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, reason: "unreachable" };
    const data = (await res.json()) as { success?: boolean };
    return data.success === true ? { ok: true } : { ok: false, reason: "rejected" };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
