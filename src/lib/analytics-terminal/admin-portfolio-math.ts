import type { PortfolioPosition } from "./portfolio-schema";

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
