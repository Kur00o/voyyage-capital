import type { CandleDTO, MarketProviderId, QuoteDTO } from "./types";
import { alphaVantageDailyAdjusted, alphaVantageQuote } from "./providers/alphavantage";
import { finnhubCandles, finnhubQuote } from "./providers/finnhub";
import { polygonAggregates, polygonQuote } from "./providers/polygon";
import { twelveDataQuote, twelveDataTimeSeries } from "./providers/twelvedata";
import { INDIAN_MARKET_DATA_PRIORITY, isIndianSymbol, symbolForTwelveData } from "./india";

function parsePriority(): MarketProviderId[] {
  const raw = process.env.MARKET_DATA_PRIORITY ?? INDIAN_MARKET_DATA_PRIORITY;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is MarketProviderId =>
      ["polygon", "finnhub", "twelvedata", "alphavantage"].includes(s),
    );
}

export async function getBestQuote(symbol: string): Promise<QuoteDTO | null> {
  const priority = parsePriority();
  const polygonKey = process.env.POLYGON_API_KEY?.trim();
  const finnhubKey = process.env.FINNHUB_API_KEY?.trim();
  const twelveKey = process.env.TWELVE_DATA_API_KEY?.trim();
  const avKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();
  const skipPolygon = isIndianSymbol(symbol);

  for (const p of priority) {
    try {
      if (p === "polygon" && polygonKey && !skipPolygon) {
        const q = await polygonQuote(polygonKey, symbol);
        if (q) return q;
      }
      if (p === "finnhub" && finnhubKey) {
        const q = await finnhubQuote(finnhubKey, symbol);
        if (q) return q;
      }
      if (p === "twelvedata" && twelveKey) {
        const q = await twelveDataQuote(twelveKey, symbolForTwelveData(symbol));
        if (q) return q;
      }
      if (p === "alphavantage" && avKey) {
        const q = await alphaVantageQuote(avKey, symbol);
        if (q) return q;
      }
    } catch {
      /* try next provider */
    }
  }
  return null;
}

export type ChartRange = "1D" | "1W" | "1M" | "1Y" | "MAX";

function rangeToFinnhubResolution(range: ChartRange): string {
  switch (range) {
    case "1D":
      return "5";
    case "1W":
      return "60";
    case "1M":
      return "D";
    case "1Y":
      return "D";
    case "MAX":
      return "W";
    default:
      return "D";
  }
}

function rangeToWindowSec(range: ChartRange): number {
  const now = Math.floor(Date.now() / 1000);
  switch (range) {
    case "1D":
      return now - 24 * 60 * 60;
    case "1W":
      return now - 7 * 24 * 60 * 60;
    case "1M":
      return now - 30 * 24 * 60 * 60;
    case "1Y":
      return now - 365 * 24 * 60 * 60;
    case "MAX":
      return now - 10 * 365 * 24 * 60 * 60;
    default:
      return now - 365 * 24 * 60 * 60;
  }
}

function toYmd(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

export async function getCandles(symbol: string, range: ChartRange): Promise<{ candles: CandleDTO[]; source: MarketProviderId }> {
  const polygonKey = process.env.POLYGON_API_KEY?.trim();
  const finnhubKey = process.env.FINNHUB_API_KEY?.trim();
  const twelveKey = process.env.TWELVE_DATA_API_KEY?.trim();
  const avKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();
  const now = Math.floor(Date.now() / 1000);
  const from = rangeToWindowSec(range);
  const skipPolygon = isIndianSymbol(symbol);

  if (finnhubKey) {
    try {
      const res = rangeToFinnhubResolution(range);
      const candles = await finnhubCandles(finnhubKey, symbol, res, from, now);
      if (candles.length) return { candles, source: "finnhub" };
    } catch {
      /* fall through */
    }
  }

  if (twelveKey) {
    try {
      const interval = range === "1W" ? "1week" : range === "MAX" ? "1month" : "1day";
      const size = range === "MAX" ? 500 : range === "1Y" ? 400 : 120;
      const candles = await twelveDataTimeSeries(twelveKey, symbolForTwelveData(symbol), interval, size);
      if (candles.length) return { candles, source: "twelvedata" };
    } catch {
      /* fall through */
    }
  }

  if (avKey) {
    try {
      const candles = await alphaVantageDailyAdjusted(avKey, symbol, range === "MAX" ? "full" : "compact");
      if (candles.length) return { candles, source: "alphavantage" };
    } catch {
      /* fall through */
    }
  }

  if (polygonKey && !skipPolygon) {
    try {
      const { mult, span } =
        range === "1D"
          ? { mult: 5, span: "minute" as const }
          : range === "1W"
            ? { mult: 1, span: "hour" as const }
            : range === "1M" || range === "1Y"
              ? { mult: 1, span: "day" as const }
              : { mult: 1, span: "week" as const };
      const candles = await polygonAggregates(polygonKey, symbol, mult, span, toYmd(from), toYmd(now));
      if (candles.length) return { candles, source: "polygon" };
    } catch {
      /* fall through */
    }
  }

  return { candles: [], source: "finnhub" };
}

export async function getQuotesForSymbols(symbols: string[]): Promise<Record<string, QuoteDTO | null>> {
  const unique = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))];
  const out: Record<string, QuoteDTO | null> = {};
  await Promise.all(
    unique.map(async (sym) => {
      out[sym] = await getBestQuote(sym);
    }),
  );
  return out;
}
