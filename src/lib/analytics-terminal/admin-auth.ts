import { createHmac, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "vv_admin";
const TOKEN_SALT = "voyyage-admin-v1";

export type AdminAccess = { ok: true } | { ok: false; reason: string };

function adminToken(): string | null {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.length < 8) return null;
  return createHmac("sha256", pwd).update(TOKEN_SALT).digest("base64url");
}

export function getAdminAccess(): AdminAccess {
  if (process.env.VOYYAGE_ADMIN_DEV === "1") return { ok: true };
  const expected = adminToken();
  if (!expected) return { ok: false, reason: "ADMIN_PASSWORD not configured" };
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return { ok: false, reason: "not_authenticated" };
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(raw);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "invalid_session" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid_session" };
  }
}

export function requireAdmin(): void {
  const a = getAdminAccess();
  if (!a.ok) throw new Error(`ADMIN_FORBIDDEN:${a.reason}`);
}

export function setAdminSessionCookie(): void {
  const token = adminToken();
  if (!token) throw new Error("ADMIN_PASSWORD not configured");
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAdminSessionCookie(): void {
  deleteCookie(COOKIE_NAME, { path: "/" });
}

export function verifyAdminPassword(password: string): boolean {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || pwd.length < 8) return false;
  const a = Buffer.from(pwd);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
