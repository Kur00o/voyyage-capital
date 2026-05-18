import type {
  AnalystRecommendationDTO,
  CandleDTO,
  CompanyProfileDTO,
  InsiderTransactionDTO,
  NewsItemDTO,
  QuoteDTO,
  SymbolSearchResultDTO,
} from "../types";
import { fetchJson } from "../http";
import { isIndianSymbol } from "../india";

const BASE = "https://finnhub.io/api/v1";

export async function finnhubQuote(token: string, symbol: string): Promise<QuoteDTO | null> {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
  type Q = { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number };
  const q = await fetchJson<Q>(url);
  if (!q || q.c === 0) return null;
  return {
    symbol,
    price: q.c,
    change: q.d,
    changePercent: q.dp,
    high: q.h,
    low: q.l,
    open: q.o,
    prevClose: q.pc,
    timestamp: (q.t || 0) * 1000 || Date.now(),
    currency: isIndianSymbol(symbol) ? "INR" : undefined,
    source: "finnhub",
  };
}

export async function finnhubCandles(
  token: string,
  symbol: string,
  resolution: string,
  fromSec: number,
  toSec: number,
): Promise<CandleDTO[]> {
  const url = `${BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${fromSec}&to=${toSec}&token=${encodeURIComponent(token)}`;
  type C = { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] };
  const d = await fetchJson<C>(url);
  if (d.s !== "ok" || !d.t?.length) return [];
  return d.t.map((t, i) => ({
    time: t,
    open: d.o[i],
    high: d.h[i],
    low: d.l[i],
    close: d.c[i],
    volume: d.v[i] ?? 0,
  }));
}

export async function finnhubMarketNews(token: string): Promise<NewsItemDTO[]> {
  const url = `${BASE}/news?category=general&token=${encodeURIComponent(token)}`;
  type N = { id: number; headline: string; source: string; url: string; datetime: number; related?: string }[];
  const rows = await fetchJson<N>(url);
  return rows.slice(0, 24).map((n) => ({
    id: String(n.id),
    headline: n.headline,
    source: n.source,
    url: n.url,
    datetime: n.datetime * 1000,
    related: n.related,
  }));
}

export async function finnhubCompanyNews(token: string, symbol: string): Promise<NewsItemDTO[]> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 24 * 14;
  const url = `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${new Date(from * 1000).toISOString().slice(0, 10)}&to=${new Date(to * 1000).toISOString().slice(0, 10)}&token=${encodeURIComponent(token)}`;
  type N = { id: number; headline: string; source: string; url: string; datetime: number }[];
  const rows = await fetchJson<N>(url);
  return rows.slice(0, 20).map((n) => ({
    id: String(n.id),
    headline: n.headline,
    source: n.source,
    url: n.url,
    datetime: n.datetime * 1000,
  }));
}

export async function finnhubSearch(token: string, q: string): Promise<SymbolSearchResultDTO[]> {
  const url = `${BASE}/search?q=${encodeURIComponent(q)}&token=${encodeURIComponent(token)}`;
  type S = { result?: { description: string; displaySymbol: string; symbol: string; type: string }[] };
  const d = await fetchJson<S>(url);
  return (d.result ?? []).slice(0, 20).map((r) => ({
    symbol: r.symbol,
    description: r.description,
    type: r.type,
    exchange: r.displaySymbol,
  }));
}

export async function finnhubProfile(token: string, symbol: string): Promise<CompanyProfileDTO | null> {
  const url = `${BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
  type P = {
    ticker?: string;
    name?: string;
    exchange?: string;
    finnhubIndustry?: string;
    ipo?: string;
    marketCapitalization?: number;
    shareOutstanding?: number;
    weburl?: string;
    logo?: string;
  };
  const p = await fetchJson<P>(url);
  if (!p.ticker) return null;
  return {
    symbol: p.ticker,
    name: p.name ?? p.ticker,
    exchange: p.exchange,
    industry: p.finnhubIndustry,
    ipo: p.ipo,
    marketCapitalization: p.marketCapitalization,
    shareOutstanding: p.shareOutstanding,
    weburl: p.weburl,
    logo: p.logo,
  };
}

export async function finnhubRecommendations(
  token: string,
  symbol: string,
): Promise<AnalystRecommendationDTO[]> {
  const url = `${BASE}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
  type R = {
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  }[];
  return await fetchJson<R>(url);
}

export async function finnhubInsider(token: string, symbol: string): Promise<InsiderTransactionDTO[]> {
  const from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const url = `${BASE}/stock/insider-transactions?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${encodeURIComponent(token)}`;
  type Row = { name: string; share: number; change: number; filingDate: string; transactionCode?: string };
  type I = Row[] | { data?: Row[] };
  const raw = await fetchJson<I>(url);
  const rows = Array.isArray(raw) ? raw : raw.data ?? [];
  return rows.slice(0, 15);
}

/** Annual dividend yield when available (Finnhub metric endpoint). */
export async function finnhubMetricYield(token: string, symbol: string): Promise<number | null> {
  const url = `${BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${encodeURIComponent(token)}`;
  type M = { metric?: { dividendYieldIndicatedAnnual?: number } };
  const d = await fetchJson<M>(url);
  const y = d.metric?.dividendYieldIndicatedAnnual;
  return typeof y === "number" && Number.isFinite(y) ? y : null;
}

/** Key valuation / earnings metrics (numeric fields only). */
export async function finnhubStockMetrics(
  token: string,
  symbol: string,
): Promise<Record<string, number | undefined>> {
  const url = `${BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${encodeURIComponent(token)}`;
  type M = { metric?: Record<string, number | string | null> };
  const d = await fetchJson<M>(url);
  const m = d.metric ?? {};
  const out: Record<string, number | undefined> = {};
  for (const [k, v] of Object.entries(m)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}
