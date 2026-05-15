import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  clearAdminSessionCookie,
  getAdminAccess,
  requireAdmin,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "./admin-auth";
import { readModelPortfolios, writeModelPortfolios } from "./portfolio-store";
import { analyticsSessionDataSchema, portfolioSchema } from "./portfolio-schema";

export const checkAdminAccess = createServerFn({ method: "GET" }).handler(() => getAdminAccess());

const loginInput = z.object({ password: z.string().min(1).max(256) });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loginInput.parse(d))
  .handler(({ data }) => {
    if (!verifyAdminPassword(data.password)) {
      return { ok: false as const, reason: "invalid_password" as const };
    }
    setAdminSessionCookie();
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(() => {
  clearAdminSessionCookie();
  return { ok: true as const };
});

export const getAdminPortfolios = createServerFn({ method: "GET" }).handler(async () => {
  requireAdmin();
  return readModelPortfolios();
});

const savePortfoliosInput = z.object({
  portfolios: z.array(portfolioSchema).max(25),
});

export const saveAdminPortfolios = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => savePortfoliosInput.parse(d))
  .handler(async ({ data }) => {
    requireAdmin();
    const next = analyticsSessionDataSchema.parse({ portfolios: data.portfolios });
    await writeModelPortfolios(next);
    return { ok: true as const };
  });
