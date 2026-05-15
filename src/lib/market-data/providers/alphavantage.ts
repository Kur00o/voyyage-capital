import type { CandleDTO, QuoteDTO } from "../types";
import { fetchJson } from "../http";

const BASE = "https://www.alphavantage.co/query";

export async function alphaVantageQuote(apiKey: string, symbol: string): Promise<QuoteDTO | null> {
  const url = `${BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  type Q = {
    "Global Quote"?: {
      "05. price": string;
      "09. change": string;
      "10. change percent": string;
      "03. high": string;
      "04. low": string;
      "02. open": string;
      "08. previous close": string;
      "07. latest trading day": string;
    };
  };
  const d = await fetchJson<Q>(url);
  const g = d["Global Quote"];
  if (!g) return null;
  const price = Number(g["05. price"]);
  if (!Number.isFinite(price)) return null;
  const change = Number(g["09. change"]);
  const pctRaw = g["10. change percent"]?.replace("%", "") ?? "0";
  const changePercent = Number(pctRaw);
  return {
    symbol,
    price,
    change,
    changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    high: Number(g["03. high"]),
    low: Number(g["04. low"]),
    open: Number(g["02. open"]),
    prevClose: Number(g["08. previous close"]),
    timestamp: Date.now(),
    source: "alphavantage",
  };
}

export async function alphaVantageDailyAdjusted(
  apiKey: string,
  symbol: string,
  outputsize: "compact" | "full" = "compact",
): Promise<CandleDTO[]> {
  const url = `${BASE}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}&apikey=${encodeURIComponent(apiKey)}`;
  type Row = {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "6. volume": string;
  };
  type T = { "Time Series (Daily)"?: Record<string, Row> };
  const d = await fetchJson<T>(url);
  const series = d["Time Series (Daily)"];
  if (!series) return [];
  return Object.entries(series)
    .map(([date, row]) => ({
      time: Math.floor(new Date(date + "T12:00:00Z").getTime() / 1000),
      open: Number(row["1. open"]),
      high: Number(row["2. high"]),
      low: Number(row["3. low"]),
      close: Number(row["4. close"]),
      volume: Number(row["6. volume"]),
    }))
    .sort((a, b) => a.time - b.time);
}
