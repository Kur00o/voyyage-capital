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
import {
  INDIAN_DEFAULT_WATCHLIST,
  INDIAN_INDEX_SYMBOLS,
  INDIAN_SECTOR_SYMBOLS,
  quoteLastPrice,
  rankIndianMovers,
} from "@/lib/market-data/india";
import { yahooSearch } from "@/lib/market-data/providers/yahoo";
import {
  getBestQuote,
  getCandles,
  getQuotesForSymbols,
  type ChartRange,
} from "@/lib/market-data/service";
import { computePortfolioCashRealized } from "./admin-portfolio-math";
import { enrichPortfolioEntity } from "./enrich-portfolio";
import { readModelPortfolios } from "./portfolio-store";
import { getSubscriberAccess, requireSubscriber, setPremiumAccessCookie } from "./subscriber";
import { verifyTerminalLogin } from "./terminal-auth";

function parseSymbolList(envName: string, fallback: string): string[] {
  const raw = process.env[envName] ?? fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function useFinnhubForAnalytics(): boolean {
  return (process.env.ANALYTICS_ENABLE_FINNHUB ?? "").trim().toLowerCase() === "true";
}

export const checkSubscriberAccess = createServerFn({ method: "GET" }).handler(() => {
  return getSubscriberAccess();
});

const terminalLoginInput = z.object({
  email: z.string().email().max(256),
  password: z.string().min(1).max(256),
});

export const terminalLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => terminalLoginInput.parse(d))
  .handler(async ({ data }) => {
    const result = await verifyTerminalLogin(data.email, data.password);
    if (!result.ok) {
      return { ok: false as const, reason: "invalid_credentials" as const };
    }
    try {
      setPremiumAccessCookie(result.tier);
    } catch {
      return { ok: false as const, reason: "not_configured" as const };
    }
    return { ok: true as const };
  });

const dashboardInput = z.object({
  watchlist: z.array(z.string().max(32)).max(40).optional(),
});

export const getDashboardBundle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => dashboardInput.parse(d))
  .handler(async ({ data }) => {
    requireSubscriber();
    const finnhubKey = process.env.FINNHUB_API_KEY?.trim();
    const canUseFinnhub = Boolean(finnhubKey) && useFinnhubForAnalytics();

    const indexSymbols = parseSymbolList("ANALYTICS_INDEX_SYMBOLS", INDIAN_INDEX_SYMBOLS);
    const defaultWatch = parseSymbolList("ANALYTICS_DEFAULT_WATCHLIST", INDIAN_DEFAULT_WATCHLIST);
    const sectorSymbols = parseSymbolList("ANALYTICS_SECTOR_SYMBOLS", INDIAN_SECTOR_SYMBOLS);
    const watchlist = [...new Set([...(data.watchlist ?? []), ...defaultWatch])].slice(0, 40);

    const sessionData = await readModelPortfolios();
    const portfolioSymbols = sessionData.portfolios.flatMap((p) =>
      p.positions.map((x) => x.symbol),
    );
    const quoteKeys = [
      ...new Set([...indexSymbols, ...watchlist, ...sectorSymbols, ...portfolioSymbols]),
    ];
    const quotes = await getQuotesForSymbols(quoteKeys);

    let news: Awaited<ReturnType<typeof finnhubMarketNews>> = [];
    if (canUseFinnhub) {
      try {
        news = await finnhubMarketNews(finnhubKey);
      } catch {
        news = [];
      }
    }

    const moverSymbols = [...new Set([...defaultWatch, ...(data.watchlist ?? [])])].slice(0, 40);
    const { gainers, losers } = rankIndianMovers(moverSymbols, quotes);

    const pq = quotes;
    let totalValue = 0;
    let totalCost = 0;
    let totalCash = 0;
    let realizedPnl = 0;
    for (const port of sessionData.portfolios) {
      for (const pos of port.positions) {
        const px = quoteLastPrice(pq[pos.symbol]) ?? 0;
        totalValue += px * pos.qty;
        totalCost += pos.avgCost * pos.qty;
      }
      const { cash, realized } = computePortfolioCashRealized(port);
      totalCash += cash;
      realizedPnl += realized;
    }

    let dayPnlFromQuotes = 0;
    for (const port of sessionData.portfolios) {
      for (const pos of port.positions) {
        const q = pq[pos.symbol];
        const last = quoteLastPrice(q);
        if (q && last != null && typeof q.prevClose === "number" && q.prevClose > 0) {
          dayPnlFromQuotes += (last - q.prevClose) * pos.qty;
        }
      }
    }

    const bucket: Record<string, number> = {};
    for (const port of sessionData.portfolios) {
      for (const pos of port.positions) {
        const px = quoteLastPrice(pq[pos.symbol]) ?? 0;
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
        cash: totalCash,
        unrealizedPnl: totalValue - totalCost,
        unrealizedPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
        realizedPnl,
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
    const results = await yahooSearch(data.q);
    if (results.length > 0) return { results };
    const finnhubKey = process.env.FINNHUB_API_KEY?.trim();
    if (!finnhubKey || !useFinnhubForAnalytics()) return { results: [] };
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
    const finnhubKey = process.env.FINNHUB_API_KEY?.trim();
    const canUseFinnhub = Boolean(finnhubKey) && useFinnhubForAnalytics();
    const symbol = data.symbol;
    const [quote, profile, recommendations, insider, news, metrics] = await Promise.all([
      getBestQuote(symbol),
      canUseFinnhub ? finnhubProfile(finnhubKey!, symbol) : Promise.resolve(null),
      canUseFinnhub ? finnhubRecommendations(finnhubKey!, symbol) : Promise.resolve([]),
      canUseFinnhub ? finnhubInsider(finnhubKey!, symbol) : Promise.resolve([]),
      canUseFinnhub ? finnhubCompanyNews(finnhubKey!, symbol) : Promise.resolve([]),
      canUseFinnhub ? finnhubStockMetrics(finnhubKey!, symbol) : Promise.resolve({}),
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

export const getSubscriberHistory = createServerFn({ method: "GET" }).handler(async () => {
  requireSubscriber();
  const sd = await readModelPortfolios();
  const rows = sd.portfolios.flatMap((p) =>
    (p.transactions ?? []).map((t) => ({
      ...t,
      portfolioId: p.id,
      portfolioName: p.name,
    })),
  );
  rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return { rows: rows.slice(0, 300) };
});

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
          r.strategy,
        ].join(","),
      )
      .join("\n");
    return {
      ok: true as const,
      filename: `portfolio-${data.portfolioId}.csv`,
      csv: `${header}\n${body}`,
    };
  });
