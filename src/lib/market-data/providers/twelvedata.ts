import type { CandleDTO, QuoteDTO } from "../types";
import { fetchJson } from "../http";

const BASE = "https://api.twelvedata.com";

export async function twelveDataQuote(apiKey: string, symbol: string): Promise<QuoteDTO | null> {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  type Q = {
    symbol: string;
    close?: string;
    change?: string;
    percent_change?: string;
    high?: string;
    low?: string;
    open?: string;
    previous_close?: string;
    timestamp?: string;
    currency?: string;
  };
  const q = await fetchJson<Q>(url);
  if (!q.close) return null;
  const price = Number(q.close);
  return {
    symbol: q.symbol,
    price,
    change: Number(q.change ?? 0),
    changePercent: Number(q.percent_change ?? 0),
    high: q.high ? Number(q.high) : undefined,
    low: q.low ? Number(q.low) : undefined,
    open: q.open ? Number(q.open) : undefined,
    prevClose: q.previous_close ? Number(q.previous_close) : undefined,
    currency: q.currency,
    timestamp: q.timestamp ? Number(q.timestamp) * 1000 : Date.now(),
    source: "twelvedata",
  };
}

export async function twelveDataTimeSeries(
  apiKey: string,
  symbol: string,
  interval: "1day" | "1week" | "1month",
  outputsize: number,
): Promise<CandleDTO[]> {
  const url = `${BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&order=ASC&apikey=${encodeURIComponent(apiKey)}`;
  type V = { datetime: string; open: string; high: string; low: string; close: string; volume?: string }[];
  type T = { values?: V };
  const d = await fetchJson<T>(url);
  if (!d.values?.length) return [];
  return d.values.map((v) => ({
    time: Math.floor(new Date(v.datetime).getTime() / 1000),
    open: Number(v.open),
    high: Number(v.high),
    low: Number(v.low),
    close: Number(v.close),
    volume: v.volume ? Number(v.volume) : 0,
  }));
}
