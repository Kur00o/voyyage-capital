import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  clearAdminSessionCookie,
  getAdminAccess,
  requireAdmin,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "./admin-auth";
import { getModelNotional, normalizePositions } from "./admin-portfolio-math";
import { readModelPortfolios, writeModelPortfolios } from "./portfolio-store";
import { analyticsSessionDataSchema, portfolioSchema } from "./portfolio-schema";
import { getQuotesForSymbols } from "@/lib/market-data/service";
import { quoteLastPrice } from "@/lib/market-data/india";

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
  const data = await readModelPortfolios();
  return { ...data, modelNotional: getModelNotional() };
});

const previewQuotesInput = z.object({ symbols: z.array(z.string().max(32)).max(80) });

export const previewAdminQuotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => previewQuotesInput.parse(d))
  .handler(async ({ data }) => {
    requireAdmin();
    const quotes = await getQuotesForSymbols(data.symbols);
    const prices: Record<string, number | null> = {};
    for (const sym of data.symbols) {
      prices[sym] = quoteLastPrice(quotes[sym]);
    }
    return { prices };
  });

const savePortfoliosInput = z.object({
  portfolios: z.array(portfolioSchema).max(25),
});

export const saveAdminPortfolios = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => savePortfoliosInput.parse(d))
  .handler(async ({ data }) => {
    requireAdmin();
    const portfolios = data.portfolios.map((p) => ({
      ...p,
      positions: normalizePositions(p.positions),
    }));
    const next = analyticsSessionDataSchema.parse({ portfolios });
    await writeModelPortfolios(next);
    return { ok: true as const };
  });
