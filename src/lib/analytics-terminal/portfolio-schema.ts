import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().min(1).max(64),
  symbol: z.string().min(1).max(32),
  side: z.enum(["buy", "sell", "dividend"]),
  qty: z.number().positive().optional(),
  price: z.number().nonnegative().optional(),
  amount: z.number().optional(),
  at: z.string().min(1),
  note: z.string().max(500).optional(),
});

export const positionSchema = z.object({
  symbol: z.string().min(1).max(32),
  qty: z.number().positive(),
  avgCost: z.number().nonnegative(),
  /** Target allocation % (model book); stored for subscriber-facing guidance. */
  targetWeightPct: z.number().min(0).max(100).optional(),
  openedAt: z.string().optional(),
});

export const portfolioSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  positions: z.array(positionSchema).max(200),
  transactions: z.array(transactionSchema).max(2000).optional(),
});

export const analyticsSessionDataSchema = z.object({
  portfolios: z.array(portfolioSchema).max(25),
});

export type AnalyticsSessionData = z.infer<typeof analyticsSessionDataSchema>;
export type PortfolioPosition = z.infer<typeof positionSchema>;
export type PortfolioEntity = z.infer<typeof portfolioSchema>;
export type PortfolioTransaction = z.infer<typeof transactionSchema>;

export function emptySessionData(): AnalyticsSessionData {
  return { portfolios: [] };
}
