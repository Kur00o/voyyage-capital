import type { PortfolioEntity, PortfolioPosition, PortfolioTransaction } from "./portfolio-schema";

export const DEFAULT_MODEL_NOTIONAL = 1_000_000;

export function getModelNotional(): number {
  const n = Number(process.env.ADMIN_MODEL_NOTIONAL);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MODEL_NOTIONAL;
}

export function positionBookValue(pos: Pick<PortfolioPosition, "qty" | "avgCost">): number {
  return pos.qty * pos.avgCost;
}

export function totalBookValue(positions: Pick<PortfolioPosition, "qty" | "avgCost">[]): number {
  return positions.reduce((s, p) => s + positionBookValue(p), 0);
}

export function bookWeightPct(
  pos: Pick<PortfolioPosition, "qty" | "avgCost">,
  positions: Pick<PortfolioPosition, "qty" | "avgCost">[],
): number {
  const total = totalBookValue(positions);
  return total > 0 ? (positionBookValue(pos) / total) * 100 : 0;
}

export function qtyFromTargetWeight(targetWeightPct: number, avgCost: number, notional: number): number {
  if (avgCost <= 0 || targetWeightPct <= 0) return 1;
  return Math.max(1, Math.round(((targetWeightPct / 100) * notional) / avgCost));
}

export function syncTargetWeights(positions: PortfolioPosition[]): PortfolioPosition[] {
  return positions.map((p) => ({
    ...p,
    targetWeightPct: Math.round(bookWeightPct(p, positions) * 100) / 100,
  }));
}

export function normalizePositions(positions: PortfolioPosition[]): PortfolioPosition[] {
  const seen = new Set<string>();
  const out: PortfolioPosition[] = [];
  for (const p of positions) {
    const symbol = p.symbol.trim().toUpperCase();
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    out.push({
      ...p,
      symbol,
      qty: Math.max(1, Math.round(p.qty)),
      avgCost: Math.max(0, Number(p.avgCost) || 0),
    });
  }
  return syncTargetWeights(out);
}

export function normalizeTransactions(transactions: PortfolioTransaction[]): PortfolioTransaction[] {
  return [...transactions]
    .map((t) => {
      const symbol = t.symbol.trim().toUpperCase();
      const qty = t.qty != null ? Math.max(0, Number(t.qty) || 0) : undefined;
      const price = t.price != null ? Math.max(0, Number(t.price) || 0) : undefined;
      const amount = t.amount != null ? Number(t.amount) : undefined;
      return {
        ...t,
        symbol,
        ...(qty != null ? { qty } : {}),
        ...(price != null ? { price } : {}),
        ...(amount != null && Number.isFinite(amount) ? { amount } : {}),
      };
    })
    .filter((t) => t.symbol.length > 0)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/** Cost basis per share for a symbol: prefer the current stored position, else
 *  derive a weighted average from this book's buy transactions (for symbols that
 *  have been fully sold and no longer appear in positions). */
export function avgCostForSymbol(portfolio: PortfolioEntity, symbol: string): number {
  const pos = portfolio.positions.find((p) => p.symbol === symbol);
  if (pos) return pos.avgCost;
  let qty = 0;
  let cost = 0;
  for (const t of portfolio.transactions ?? []) {
    if (t.side !== "buy" || t.symbol !== symbol) continue;
    qty += t.qty ?? 0;
    cost += t.amount ?? (t.qty != null && t.price != null ? t.qty * t.price : 0);
  }
  return qty > 0 ? cost / qty : 0;
}

/** True realized P&L from the ledger: gains booked on sells (sell price − avg
 *  cost) plus dividends received. */
export function realizedPnlFromTransactions(portfolio: PortfolioEntity): number {
  let realized = 0;
  for (const t of portfolio.transactions ?? []) {
    if (t.side === "dividend") {
      realized += t.amount ?? 0;
    } else if (t.side === "sell" && t.qty != null) {
      const proceeds = t.price != null ? t.price * t.qty : t.amount ?? 0;
      realized += proceeds - avgCostForSymbol(portfolio, t.symbol) * t.qty;
    }
  }
  return realized;
}

/**
 * Cash and realized P&L for a book — the single source of truth shared by the
 * admin editor and the subscriber Terminal.
 *
 * Cash inventory is the capital not currently deployed into holdings:
 *   cash = initialCapital − (cost basis of current holdings) + realized gains.
 * This stays correct whether holdings were built via buy transactions or added
 * directly to the book, because current positions are the source of truth.
 */
export function computePortfolioCashRealized(portfolio: PortfolioEntity): {
  cash: number;
  realized: number;
  totalCost: number;
  initialCapital: number;
} {
  const realized = realizedPnlFromTransactions(portfolio);
  const totalCost = totalBookValue(portfolio.positions);
  const initialCapital = portfolio.initialCapital ?? 0;
  return { cash: initialCapital - totalCost + realized, realized, totalCost, initialCapital };
}

type LotState = { qty: number; avgCost: number; openedAt?: string };

/** Build holdings from ledger in FIFO-safe manner for admin model books. */
export function positionsFromTransactions(
  transactions: PortfolioTransaction[],
  existing: PortfolioPosition[] = [],
): { positions: PortfolioPosition[]; warnings: string[] } {
  const txs = normalizeTransactions(transactions);
  const lots = new Map<string, LotState>();
  const warnings: string[] = [];
  const existingWeights = new Map(existing.map((p) => [p.symbol.toUpperCase(), p.targetWeightPct]));

  for (const tx of txs) {
    if (tx.side === "dividend") continue;
    const symbol = tx.symbol.toUpperCase();
    const state = lots.get(symbol) ?? { qty: 0, avgCost: 0 };
    if (tx.side === "buy") {
      const qty = tx.qty ?? 0;
      const price = tx.price ?? 0;
      if (qty <= 0 || price < 0) continue;
      const newQty = state.qty + qty;
      const newAvg = newQty > 0 ? (state.qty * state.avgCost + qty * price) / newQty : 0;
      lots.set(symbol, {
        qty: newQty,
        avgCost: newAvg,
        openedAt: state.openedAt ?? tx.at,
      });
      continue;
    }

    const sellQty = tx.qty ?? 0;
    if (sellQty <= 0) continue;
    if (state.qty <= 0) {
      warnings.push(`Sell ignored for ${symbol} on ${tx.at}: no holdings.`);
      continue;
    }
    if (sellQty > state.qty) {
      warnings.push(`Sell clipped for ${symbol} on ${tx.at}: sold ${sellQty}, available ${state.qty}.`);
    }
    const remaining = Math.max(0, state.qty - sellQty);
    if (remaining <= 0) {
      lots.delete(symbol);
    } else {
      lots.set(symbol, {
        qty: remaining,
        avgCost: state.avgCost,
        openedAt: state.openedAt,
      });
    }
  }

  const positions = normalizePositions(
    [...lots.entries()].map(([symbol, s]) => ({
      symbol,
      qty: s.qty,
      avgCost: s.avgCost,
      ...(s.openedAt ? { openedAt: s.openedAt } : {}),
      ...(existingWeights.get(symbol) != null ? { targetWeightPct: existingWeights.get(symbol) } : {}),
    })),
  );
  return { positions, warnings };
}
