import type { CandleDTO, QuoteDTO } from "../types";
import { fetchJson } from "../http";

const BASE = "https://api.polygon.io";

function normalizeSymbolForPolygon(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (s.includes(":")) return s.split(":").pop() ?? s;
  return s;
}

export async function polygonQuote(apiKey: string, symbol: string): Promise<QuoteDTO | null> {
  const sym = normalizeSymbolForPolygon(symbol);
  const url = `${BASE}/v2/aggs/ticker/${encodeURIComponent(sym)}/prev?adjusted=true&apiKey=${encodeURIComponent(apiKey)}`;
  type PrevAgg = {
    results?: Array<{
      T: number;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
      vw?: number;
    }>;
    ticker?: string;
  };
  const data = await fetchJson<PrevAgg>(url);
  const r = data.results?.[0];
  if (!r) return null;
  const prevClose = r.o;
  const change = r.c - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;
  return {
    symbol: data.ticker ?? sym,
    price: r.c,
    change,
    changePercent,
    high: r.h,
    low: r.l,
    open: r.o,
    prevClose,
    timestamp: r.T,
    source: "polygon",
  };
}

export async function polygonAggregates(
  apiKey: string,
  symbol: string,
  multiplier: number,
  timespan: "minute" | "hour" | "day" | "week" | "month",
  from: string,
  to: string,
): Promise<CandleDTO[]> {
  const sym = normalizeSymbolForPolygon(symbol);
  const url = `${BASE}/v2/aggs/ticker/${encodeURIComponent(sym)}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`;
  type Agg = { t: number; o: number; h: number; l: number; c: number; v: number };
  type AggRes = { results?: Agg[] };
  const data = await fetchJson<AggRes>(url);
  if (!data.results?.length) return [];
  return data.results.map((b) => ({
    time: Math.floor(b.t / 1000),
    open: b.o,
    high: b.h,
    low: b.l,
    close: b.c,
    volume: b.v,
  }));
}
