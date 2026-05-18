/** Defaults and helpers for NSE/BSE–focused market data. */

export const INDIAN_INDEX_SYMBOLS = "^NSEI,^NSEBANK";
export const INDIAN_DEFAULT_WATCHLIST =
  "RELIANCE.NS,INFY.NS,TCS.NS,HDFCBANK.NS,ITC.NS,SBIN.NS,BHARTIARTL.NS";
export const INDIAN_SECTOR_SYMBOLS = "NIFTYIT,NIFTYPHARMA,NIFTYAUTO,NIFTYFMCG,NIFTYMETAL,NIFTYREALTY";
export const INDIAN_DEFAULT_CHART_SYMBOL = "RELIANCE.NS";
export const INDIAN_MARKET_DATA_PRIORITY = "finnhub,twelvedata,alphavantage,polygon";

const INDEX_LABELS: Record<string, string> = {
  "^NSEI": "Nifty 50",
  "^NSEBANK": "Nifty Bank",
  "^BSESN": "Sensex",
};

export function isIndianSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  return (
    s.endsWith(".NS") ||
    s.endsWith(".BO") ||
    s.startsWith("^") ||
    /:(NSE|BSE)$/.test(s) ||
    s.startsWith("NIFTY") ||
    s.startsWith("SENSEX")
  );
}

/** Normalize user/admin input to Finnhub-style NSE tickers when no exchange suffix is given. */
export function normalizeIndianSymbol(symbol: string): string {
  const raw = symbol.trim().toUpperCase();
  if (!raw) return raw;
  if (raw.startsWith("^") || /\.(NS|BO)$/.test(raw) || /:(NSE|BSE)$/.test(raw)) return raw;
  return `${raw}.NS`;
}

export function symbolForTwelveData(symbol: string): string {
  if (symbol.includes(":")) return symbol;
  if (symbol.endsWith(".NS")) return `${symbol.slice(0, -3)}:NSE`;
  if (symbol.endsWith(".BO")) return `${symbol.slice(0, -3)}:BSE`;
  return symbol;
}

export function displaySymbol(symbol: string): string {
  const label = INDEX_LABELS[symbol.toUpperCase()];
  if (label) return label;
  return symbol.replace(/\.(NS|BO)$/i, "").replace(/:NSE$|:BSE$/i, "");
}

export function rankIndianMovers(
  symbols: string[],
  quotes: Record<string, { changePercent: number } | null | undefined>,
  limit = 8,
): { gainers: { symbol: string; changePercent: number }[]; losers: { symbol: string; changePercent: number }[] } {
  const rows = symbols
    .map((symbol) => ({
      symbol,
      changePercent: quotes[symbol]?.changePercent ?? 0,
    }))
    .filter((r) => quotes[r.symbol] != null);

  const gainers = [...rows]
    .filter((r) => r.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, limit);

  const losers = [...rows]
    .filter((r) => r.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, limit);

  return { gainers, losers };
}
