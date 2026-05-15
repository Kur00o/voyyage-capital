import { getQuotesForSymbols } from "@/lib/market-data/service";
import type { QuoteDTO } from "@/lib/market-data/types";
import { finnhubMetricYield } from "@/lib/market-data/providers/finnhub";
import type { PortfolioEntity } from "./portfolio-schema";

export type StrategySignal = "hold" | "buy_more" | "reduce" | "rebalance";

function strategyFromPnl(unrealizedPct: number): StrategySignal {
  if (unrealizedPct > 28) return "reduce";
  if (unrealizedPct < -22) return "buy_more";
  if (unrealizedPct < -10) return "rebalance";
  return "hold";
}

function realizedFromTx(portfolio: PortfolioEntity): number {
  const txs = portfolio.transactions ?? [];
  let realized = 0;
  for (const t of txs) {
    if (t.side === "dividend" && typeof t.amount === "number") realized += t.amount;
    if (t.side === "sell" && typeof t.amount === "number") realized += t.amount;
    if (t.side === "buy" && typeof t.amount === "number") realized -= t.amount;
  }
  return realized;
}

export type EnrichedRow = PortfolioEntity["positions"][number] & {
  last: number;
  marketValue: number;
  cost: number;
  unrealized: number;
  unrealizedPct: number;
  allocationPct: number;
  strategy: StrategySignal;
  quote: QuoteDTO | null;
  dividendYieldAnnual: number | null;
};

export async function enrichPortfolioEntity(portfolio: PortfolioEntity) {
  const finnhubKey = process.env.FINNHUB_API_KEY;

  const syms = portfolio.positions.map((p) => p.symbol);
  const quotes = await getQuotesForSymbols(syms);
  const realized = realizedFromTx(portfolio);

  const base = await Promise.all(
    portfolio.positions.map(async (pos) => {
      const q = quotes[pos.symbol];
      const last = q?.price ?? 0;
      const marketValue = last * pos.qty;
      const cost = pos.avgCost * pos.qty;
      const unrealized = marketValue - cost;
      const unrealizedPct = cost > 0 ? (unrealized / cost) * 100 : 0;
      let dividendYieldAnnual: number | null = null;
      if (finnhubKey) {
        try {
          dividendYieldAnnual = await finnhubMetricYield(finnhubKey, pos.symbol);
        } catch {
          dividendYieldAnnual = null;
        }
      }
      return {
        ...pos,
        last,
        marketValue,
        cost,
        unrealized,
        unrealizedPct,
        allocationPct: 0,
        strategy: strategyFromPnl(unrealizedPct),
        quote: q ?? null,
        dividendYieldAnnual,
      };
    }),
  );

  const totalMv = base.reduce((s, r) => s + r.marketValue, 0);
  const rows: EnrichedRow[] = base.map((r) => ({
    ...r,
    allocationPct: totalMv > 0 ? (r.marketValue / totalMv) * 100 : 0,
  }));

  return { ...portfolio, rows, realizedPnlFromLedger: realized };
}
