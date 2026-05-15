import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "vv_premium_access";

export type SubscriberAccess = { ok: true; tier: string } | { ok: false; reason: string };

/**
 * Premium analytics access:
 * - Production: signed cookie `vv_premium_access` = base64url(payload).hmac (see env.example)
 * - Or set VOYYAGE_ANALYTICS_DEV=1 for local development only.
 */
export function getSubscriberAccess(): SubscriberAccess {
  if (process.env.VOYYAGE_ANALYTICS_DEV === "1") {
    return { ok: true, tier: "development" };
  }
  const secret = process.env.PREMIUM_ACCESS_SECRET;
  if (!secret || secret.length < 16) {
    return { ok: false, reason: "PREMIUM_ACCESS_SECRET not configured" };
  }
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return { ok: false, reason: "missing_premium_cookie" };
  try {
    const decoded = decodeURIComponent(raw);
    const dot = decoded.lastIndexOf(".");
    if (dot <= 0) return { ok: false, reason: "invalid_token" };
    const payloadB64 = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = createHmac("sha256", secret).update(payloadB64).digest("base64url");
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      tier?: string;
      exp?: number;
    };
    if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      return { ok: false, reason: "token_expired" };
    }
    return { ok: true, tier: String(payload.tier ?? "paid") };
  } catch {
    return { ok: false, reason: "parse_error" };
  }
}

export function requireSubscriber(): void {
  const a = getSubscriberAccess();
  if (!a.ok) throw new Error(`ANALYTICS_FORBIDDEN:${a.reason}`);
}
