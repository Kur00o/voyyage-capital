import type { SessionConfig } from "@tanstack/start-server-core";

/** Encrypted session cookie for portfolio state (TanStack Start built-in session). */
export function getAnalyticsSessionConfig(): SessionConfig {
  const raw =
    process.env.ANALYTICS_SESSION_PASSWORD ?? process.env.SESSION_SECRET ?? "dev-only-analytics-session-secret-key";
  let password = raw;
  if (password.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ANALYTICS_SESSION_PASSWORD (or SESSION_SECRET) must be at least 32 characters.");
    }
    password = password.padEnd(32, "0");
  }
  return {
    name: "vv-analytics",
    password,
    maxAge: 60 * 60 * 24 * 400,
    cookie: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  };
}
