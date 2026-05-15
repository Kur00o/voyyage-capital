import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  finnhubCompanyNews,
  finnhubInsider,
  finnhubMarketNews,
  finnhubProfile,
  finnhubRecommendations,
  finnhubSearch,
  finnhubStockMetrics,
} from "@/lib/market-data/providers/finnhub";
import { fetchJson } from "@/lib/market-data/http";
import { getBestQuote, getCandles, getQuotesForSymbols, type ChartRange } from "@/lib/market-data/service";
import { enrichPortfolioEntity } from "./enrich-portfolio";
import { readModelPortfolios } from "./portfolio-store";
import { getSubscriberAccess, requireSubscriber } from "./subscriber";

function parseSymbolList(envName: string, fallback: string): string[] {
  const raw = process.env[envName] ?? fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export const checkSubscriberAccess = createServerFn({ method: "GET" }).handler(() => {
  return getSubscriberAccess();
});

const dashboardInput = z.object({
  watchlist: z.array(z.string().max(32)).max(40).optional(),
});

export const getDashboardBundle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => dashboardInput.parse(d))
  .handler(async ({ data }) => {
    requireSubscriber();
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const polygonKey = process.env.POLYGON_API_KEY;

    const indexSymbols = parseSymbolList("ANALYTICS_INDEX_SYMBOLS", "SPY,QQQ,DIA");
    const defaultWatch = parseSymbolList("ANALYTICS_DEFAULT_WATCHLIST", "AAPL,MSFT,GOOGL");
    const sectorSymbols = parseSymbolList("ANALYTICS_SECTOR_ETFS", "XLK,XLF,XLE,XLV,XLY,XLP,XLI,XLB,XLRE,XLU");
    const watchlist = [...new Set([...(data.watchlist ?? []), ...defaultWatch])].slice(0, 40);

    const quoteKeys = [...new Set([...indexSymbols, ...watchlist, ...sectorSymbols])];
    const quotes = await getQuotesForSymbols(quoteKeys);

    let news: Awaited<ReturnType<typeof finnhubMarketNews>> = [];
    if (finnhubKey) {
      try {
        news = await finnhubMarketNews(finnhubKey);
      } catch {
        news = [];
      }
    }

    let gainers: { symbol: string; changePercent: number }[] = [];
    let losers: { symbol: string; changePercent: number }[] = [];
    if (polygonKey) {
      try {
        type Snap = { tickers?: { ticker: string; todaysChangePerc?: number }[] };
        const [g, l] = await Promise.all([
          fetchJson<Snap>(
            `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${encodeURIComponent(polygonKey)}`,
          ),
          fetchJson<Snap>(
            `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/losers?apiKey=${encodeURIComponent(polygonKey)}`,
          ),
        ]);
        gainers =
          g.tickers?.slice(0, 8).map((t) => ({
            symbol: t.ticker,
            changePercent: t.todaysChangePerc ?? 0,
          })) ?? [];
        losers =
          l.tickers?.slice(0, 8).map((t) => ({
            symbol: t.ticker,
            changePercent: t.todaysChangePerc ?? 0,
          })) ?? [];
      } catch {
        gainers = [];
        losers = [];
      }
    }

    const sessionData = await readModelPortfolios();

    const portfolioSymbols = sessionData.portfolios.flatMap((p) => p.positions.map((x) => x.symbol));
    const pq = await getQuotesForSymbols(portfolioSymbols);
    let totalValue = 0;
    let totalCost = 0;
    for (const port of sessionData.portfolios) {
      for (const pos of port.positions) {
        const q = pq[pos.symbol];
        const px = q?.price ?? 0;
        totalValue += px * pos.qty;
        totalCost += pos.avgCost * pos.qty;
      }
    }

    let dayPnlFromQuotes = 0;
    for (const port of sessionData.portfolios) {
      for (const pos of port.positions) {
        const q = pq[pos.symbol];
        if (q && typeof q.prevClose === "number" && q.prevClose > 0) {
          dayPnlFromQuotes += (q.price - q.prevClose) * pos.qty;
        }
      }
    }

    const bucket: Record<string, number> = {};
    for (const port of sessionData.portfolios) {
      for (const pos of port.positions) {
        const px = pq[pos.symbol]?.price ?? 0;
        bucket[pos.symbol] = (bucket[pos.symbol] ?? 0) + px * pos.qty;
      }
    }
    const allocTotal = Object.values(bucket).reduce((a, b) => a + b, 0);
    const allocationBreakdown = Object.entries(bucket)
      .map(([symbol, value]) => ({
        symbol,
        value,
        pct: allocTotal > 0 ? (value / allocTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      fetchedAt: Date.now(),
      indices: indexSymbols.map((s) => ({ symbol: s, quote: quotes[s] ?? null })),
      watchlist: watchlist.map((s) => ({ symbol: s, quote: quotes[s] ?? null })),
      sectors: sectorSymbols.map((s) => ({ symbol: s, quote: quotes[s] ?? null })),
      news,
      gainers,
      losers,
      allocationBreakdown,
      portfolioSummary: {
        totalValue,
        totalCost,
        unrealizedPnl: totalValue - totalCost,
        unrealizedPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
        dayPnlEstimate: dayPnlFromQuotes,
      },
    };
  });

const chartInput = z.object({
  symbol: z.string().min(1).max(32),
  range: z.enum(["1D", "1W", "1M", "1Y", "MAX"]),
});

export const getChartCandles = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => chartInput.parse(d))
  .handler(async ({ data }) => {
    requireSubscriber();
    const { candles, source } = await getCandles(data.symbol, data.range as ChartRange);
    return { symbol: data.symbol, range: data.range, candles, source };
  });

const searchInput = z.object({ q: z.string().min(1).max(64) });

export const symbolSearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => searchInput.parse(d))
  .handler(async ({ data }) => {
    requireSubscriber();
    const finnhubKey = process.env.FINNHUB_API_KEY;
    if (!finnhubKey) return { results: [] as { symbol: string; description: string }[] };
    return { results: await finnhubSearch(finnhubKey, data.q) };
  });

/** Read-only model portfolios for subscribers (managed in /admin). */
export const getPortfolioSession = createServerFn({ method: "GET" }).handler(async () => {
  requireSubscriber();
  return readModelPortfolios();
});

const holdingInput = z.object({ symbol: z.string().min(1).max(32) });

export const getHoldingDetail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => holdingInput.parse(d))
  .handler(async ({ data }) => {
    requireSubscriber();
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const symbol = data.symbol;
    const [quote, profile, recommendations, insider, news, metrics] = await Promise.all([
      getBestQuote(symbol),
      finnhubKey ? finnhubProfile(finnhubKey, symbol) : Promise.resolve(null),
      finnhubKey ? finnhubRecommendations(finnhubKey, symbol) : Promise.resolve([]),
      finnhubKey ? finnhubInsider(finnhubKey, symbol) : Promise.resolve([]),
      finnhubKey ? finnhubCompanyNews(finnhubKey, symbol) : Promise.resolve([]),
      finnhubKey ? finnhubStockMetrics(finnhubKey, symbol) : Promise.resolve({}),
    ]);
    const pe =
      metrics.peNormalizedAnnual ??
      metrics.peBasicExclExtraTTM ??
      metrics.peTTM ??
      metrics.peExclExtraTTM;
    const eps = metrics.epsNormalizedAnnual ?? metrics.epsTTM;
    return { symbol, quote, profile, recommendations, insider, news, metrics, pe, eps };
  });

const portfolioIdInput = z.object({ portfolioId: z.string().min(1).max(64) });

export const getPortfoliosEnriched = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => portfolioIdInput.parse(d))
  .handler(async ({ data }) => {
    requireSubscriber();
    const sd = await readModelPortfolios();
    const portfolio = sd.portfolios.find((p) => p.id === data.portfolioId);
    if (!portfolio) return { ok: false as const, reason: "not_found" as const };
    const enriched = await enrichPortfolioEntity(portfolio);
    return { ok: true as const, portfolio: enriched };
  });

export const exportPortfolioCsv = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => portfolioIdInput.parse(d))
  .handler(async ({ data }) => {
    requireSubscriber();
    const sd = await readModelPortfolios();
    const portfolio = sd.portfolios.find((p) => p.id === data.portfolioId);
    if (!portfolio) return { ok: false as const };
    const enriched = await enrichPortfolioEntity(portfolio);
    const header = [
      "symbol",
      "qty",
      "avgCost",
      "last",
      "marketValue",
      "unrealized",
      "unrealizedPct",
      "allocationPct",
      "divYield",
      "strategy",
    ].join(",");
    const body = enriched.rows
      .map((r) =>
        [
          r.symbol,
          r.qty,
          r.avgCost,
          r.last,
          r.marketValue,
          r.unrealized,
          r.unrealizedPct.toFixed(4),
          r.allocationPct.toFixed(4),
          r.dividendYieldAnnual ?? "",
          r.strategy,
        ].join(","),
      )
      .join("\n");
    return { ok: true as const, filename: `portfolio-${data.portfolioId}.csv`, csv: `${header}\n${body}` };
  });
