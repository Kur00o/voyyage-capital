"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CandlestickSeries, ColorType, createChart, LineSeries } from "lightweight-charts";
import type { Time } from "lightweight-charts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  LineChart,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Wallet,
} from "lucide-react";
import {
  exportPortfolioCsv,
  getChartCandles,
  getDashboardBundle,
  getHoldingDetail,
  getPortfolioSession,
  getPortfoliosEnriched,
  symbolSearch,
} from "@/lib/analytics-terminal/analytics-fns";
import type { AnalyticsSessionData } from "@/lib/analytics-terminal/portfolio-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtINR, fmtPct } from "@/lib/format-money";
import { displaySymbol, INDIAN_DEFAULT_CHART_SYMBOL, quoteLastPrice } from "@/lib/market-data/india";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type ChartRange = "1D" | "1W" | "1M" | "1Y" | "MAX";

function smaFromCloses(candles: { time: number; close: number }[], period: number): { time: Time; value: number }[] {
  const out: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += candles[i - j].close;
    out.push({ time: candles[i].time as Time, value: sum / period });
  }
  return out;
}

function CandlePanel({ symbol, range, dark }: { symbol: string; range: ChartRange; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics-candles", symbol, range],
    queryFn: () => getChartCandles({ data: { symbol, range } }),
    enabled: Boolean(symbol),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!ref.current || !data?.candles?.length) return;
    const el = ref.current;
    chartRef.current?.remove();
    const chart = createChart(el, {
      width: el.clientWidth,
      height: 360,
      layout: {
        background: { type: ColorType.Solid, color: dark ? "#0b1220" : "#ffffff" },
        textColor: dark ? "#d1d5db" : "#1f2937",
      },
      grid: {
        vertLines: { color: dark ? "#1f2937" : "#e5e7eb" },
        horzLines: { color: dark ? "#1f2937" : "#e5e7eb" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: 1 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#c9a96e",
      downColor: "#7c6a4a",
      borderVisible: false,
      wickUpColor: "#c9a96e",
      wickDownColor: "#7c6a4a",
    });
    const candleData = data.candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(candleData);
    const ma = smaFromCloses(
      data.candles.map((c) => ({ time: c.time, close: c.close })),
      data.candles.length >= 30 ? 20 : data.candles.length >= 15 ? 10 : 5,
    );
    if (ma.length > 1) {
      const maSeries = chart.addSeries(LineSeries, {
        color: dark ? "#94a3b8" : "#64748b",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      maSeries.setData(ma);
    }
    chart.timeScale().fitContent();
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, dark, symbol, range]);

  return (
    <div className="rounded-lg border border-border bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {displaySymbol(symbol)} · {range}
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} aria-label="Refresh chart">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative min-h-[360px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : null}
        {error ? <div className="p-4 text-sm text-destructive">{(error as Error).message}</div> : null}
        {!isLoading && data && !data.candles.length ? (
          <div className="p-6 text-sm text-muted-foreground">No OHLC data for this range.</div>
        ) : null}
        <div ref={ref} className="w-full" />
      </div>
    </div>
  );
}

function DashboardTab({
  dark,
  chartSymbol,
  setChartSymbol,
}: {
  dark: boolean;
  chartSymbol: string;
  setChartSymbol: (s: string) => void;
}) {
  const [watchExtras, setWatchExtras] = useState<string[]>([]);
  const [range, setRange] = useState<ChartRange>("1M");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const searchQ = useQuery({
    queryKey: ["sym-search", q],
    queryFn: () => symbolSearch({ data: { q } }),
    enabled: q.length >= 2,
  });

  const dash = useQuery({
    queryKey: ["dashboard", watchExtras],
    queryFn: () => getDashboardBundle({ data: { watchlist: watchExtras } }),
    refetchInterval: 25_000,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const summary = dash.data?.portfolioSummary;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Portfolio value</div>
          <div className="mt-2 font-display text-3xl font-light">{summary ? fmtINR(summary.totalValue) : "—"}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Unrealized P&amp;L</div>
          <div
            className={`mt-2 font-display text-3xl font-light ${summary && summary.unrealizedPnl < 0 ? "text-rose-400" : "text-emerald-400"}`}
          >
            {summary ? fmtINR(summary.unrealizedPnl) : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{summary ? fmtPct(summary.unrealizedPct) : ""}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Day P&amp;L (est.)</div>
          <div
            className={`mt-2 font-display text-3xl font-light ${summary && summary.dayPnlEstimate < 0 ? "text-rose-400" : "text-emerald-400"}`}
          >
            {summary ? fmtINR(summary.dayPnlEstimate) : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Last refresh</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {dash.data?.fetchedAt ? new Date(dash.data.fetchedAt).toLocaleTimeString() : "—"}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => dash.refetch()}>
            Refresh now
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/30 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">NSE sector indices</div>
          <div className="flex flex-wrap gap-2">
            {(dash.data?.sectors ?? []).map((s) => (
              <button
                type="button"
                key={s.symbol}
                onClick={() => setChartSymbol(s.symbol)}
                className="rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-left text-xs hover:border-gold/50 transition-colors"
              >
                <div className="font-semibold">{displaySymbol(s.symbol)}</div>
                <div className={s.quote && s.quote.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {s.quote ? fmtPct(s.quote.changePercent) : "—"}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card/30 p-4 min-h-[220px]">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Book allocation (all portfolios)</div>
          {(() => {
            const alloc = dash.data?.allocationBreakdown?.slice(0, 12) ?? [];
            if (alloc.length === 0) {
              return (
                <p className="text-sm text-muted-foreground py-8 text-center">Model portfolios will appear here once published by Voyyage.</p>
              );
            }
            const fills = ["#c9a96e", "#1b2b4b", "#64748b", "#94a3b8", "#334155", "#475569", "#78716c", "#a8a29e", "#d6d3d1", "#e7e5e4", "#f5f5f4", "#fafaf9"];
            return (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={alloc.map((a) => ({ name: a.symbol, value: a.value }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {alloc.map((_, i) => (
                      <Cell key={alloc[i].symbol} fill={fills[i % fills.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search NSE symbol (e.g. RELIANCE)…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
              />
              {searchOpen && q.length >= 2 && searchQ.data?.results?.length ? (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
                  {searchQ.data.results.map((r) => (
                    <button
                      type="button"
                      key={r.symbol}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent/40"
                      onClick={() => {
                        setChartSymbol(r.symbol);
                        if (!watchExtras.includes(r.symbol)) setWatchExtras((w) => [...w, r.symbol].slice(0, 30));
                        setSearchOpen(false);
                        setQ("");
                      }}
                    >
                      <span className="font-medium">{r.symbol}</span>
                      <span className="text-xs text-muted-foreground">{r.description}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1">
              {(["1D", "1W", "1M", "1Y", "MAX"] as ChartRange[]).map((r) => (
                <Button key={r} type="button" size="sm" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <CandlePanel symbol={chartSymbol} range={range} dark={dark} />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card/30 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Nifty &amp; NSE watchlist</div>
            <div className="space-y-2 max-h-48 overflow-auto pr-1">
              {(dash.data?.indices ?? []).concat(dash.data?.watchlist ?? []).map((row) => (
                <button
                  type="button"
                  key={row.symbol}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/30"
                  onClick={() => setChartSymbol(row.symbol)}
                >
                  <span className="font-medium">{displaySymbol(row.symbol)}</span>
                  <span className={row.quote && row.quote.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {quoteLastPrice(row.quote) != null ? fmtINR(quoteLastPrice(row.quote)!) : "—"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card/30 p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> NSE gainers
              </div>
              <ul className="space-y-1 text-sm">
                {(dash.data?.gainers ?? []).map((g) => (
                  <li key={g.symbol} className="flex justify-between gap-2">
                    <button type="button" className="truncate hover:underline" onClick={() => setChartSymbol(g.symbol)}>
                      {displaySymbol(g.symbol)}
                    </button>
                    <span className="text-emerald-400 shrink-0">{fmtPct(g.changePercent)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card/30 p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" /> NSE losers
              </div>
              <ul className="space-y-1 text-sm">
                {(dash.data?.losers ?? []).map((g) => (
                  <li key={g.symbol} className="flex justify-between gap-2">
                    <button type="button" className="truncate hover:underline" onClick={() => setChartSymbol(g.symbol)}>
                      {displaySymbol(g.symbol)}
                    </button>
                    <span className="text-rose-400 shrink-0">{fmtPct(g.changePercent)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card/30 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">India market news</div>
            <ScrollArea className="h-64 pr-3">
              <ul className="space-y-3 text-sm">
                {(dash.data?.news ?? []).map((n) => (
                  <li key={n.id}>
                    <a href={n.url} target="_blank" rel="noreferrer" className="font-medium hover:text-gold leading-snug">
                      {n.headline}
                    </a>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {n.source} · {new Date(n.datetime).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </div>
      </div>

      {dash.isError ? <div className="text-sm text-destructive">{(dash.error as Error).message}</div> : null}
    </div>
  );
}

function PortfoliosTab({ dark }: { dark: boolean }) {
  const [session, setSession] = useState<AnalyticsSessionData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetSymbol, setSheetSymbol] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"symbol" | "marketValue" | "unrealized">("marketValue");

  const detail = useQuery({
    queryKey: ["holding", sheetSymbol],
    queryFn: () => getHoldingDetail({ data: { symbol: sheetSymbol! } }),
    enabled: Boolean(sheetSymbol),
  });

  const load = async () => {
    const s = await getPortfolioSession();
    setSession(s);
    if (!activeId && s.portfolios[0]) setActiveId(s.portfolios[0].id);
  };

  useEffect(() => {
    void load();
  }, []);

  const enriched = useQuery({
    queryKey: ["enriched", activeId, session?.portfolios.length],
    queryFn: () => getPortfoliosEnriched({ data: { portfolioId: activeId! } }),
    enabled: Boolean(activeId),
    refetchInterval: 90_000,
    refetchOnWindowFocus: false,
  });

  const exportCsv = async () => {
    if (!activeId) return;
    const res = await exportPortfolioCsv({ data: { portfolioId: activeId } });
    if (!res.ok) return;
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const rowsRaw = enriched.data?.ok ? enriched.data.portfolio.rows : [];
  const realizedLedger =
    enriched.data?.ok && "realizedPnlFromLedger" in enriched.data.portfolio
      ? (enriched.data.portfolio as { realizedPnlFromLedger?: number }).realizedPnlFromLedger ?? 0
      : 0;

  const rows = useMemo(() => {
    const copy = [...rowsRaw];
    copy.sort((a, b) => {
      if (sortKey === "symbol") return a.symbol.localeCompare(b.symbol);
      if (sortKey === "marketValue") return b.marketValue - a.marketValue;
      return b.unrealized - a.unrealized;
    });
    return copy;
  }, [rowsRaw, sortKey]);

  const activePortfolio = session?.portfolios.find((p) => p.id === activeId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground mr-auto">Voyyage model portfolios (read-only).</p>
        <Button type="button" variant="outline" onClick={() => void exportCsv()} disabled={!activeId}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(session?.portfolios ?? []).map((p) => (
          <Button key={p.id} type="button" size="sm" variant={activeId === p.id ? "default" : "secondary"} onClick={() => setActiveId(p.id)}>
            {p.name}
          </Button>
        ))}
        {!session?.portfolios.length ? (
          <p className="text-sm text-muted-foreground">No model portfolios published yet.</p>
        ) : null}
      </div>

      {activePortfolio?.description?.trim() ? (
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{activePortfolio.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {enriched.data?.ok ? (
            <>
              Realized (from ledger):{" "}
              <span className={realizedLedger >= 0 ? "text-emerald-400" : "text-rose-400"}>{fmtINR(realizedLedger)}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground uppercase tracking-wider">Sort</span>
          <Button type="button" size="sm" variant={sortKey === "marketValue" ? "default" : "outline"} onClick={() => setSortKey("marketValue")}>
            Value
          </Button>
          <Button type="button" size="sm" variant={sortKey === "unrealized" ? "default" : "outline"} onClick={() => setSortKey("unrealized")}>
            uPnL
          </Button>
          <Button type="button" size="sm" variant={sortKey === "symbol" ? "default" : "outline"} onClick={() => setSortKey("symbol")}>
            A–Z
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Avg</th>
                <th className="px-3 py-2">Last</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Alloc %</th>
                <th className="px-3 py-2">uPnL</th>
                <th className="px-3 py-2">Signal</th>
              </tr>
            </thead>
            <tbody>
              {enriched.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    <Loader2 className="inline h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : null}
              {rows.map((r) => (
                <tr key={`${r.symbol}-${r.qty}`} className="border-t border-border hover:bg-accent/20">
                  <td className="px-3 py-2">
                    <button type="button" className="font-medium text-gold hover:underline" onClick={() => setSheetSymbol(r.symbol)}>
                      {displaySymbol(r.symbol)}
                    </button>
                  </td>
                  <td className="px-3 py-2">{r.qty}</td>
                  <td className="px-3 py-2">{fmtINR(r.avgCost)}</td>
                  <td className="px-3 py-2">
                    {r.last != null ? fmtINR(r.last) : "—"}
                  </td>
                  <td className="px-3 py-2">{r.last != null ? fmtINR(r.marketValue) : "—"}</td>
                  <td className="px-3 py-2">{r.last != null ? `${r.allocationPct.toFixed(1)}%` : "—"}</td>
                  <td className={`px-3 py-2 ${r.unrealized >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtINR(r.unrealized)}</td>
                  <td className="px-3 py-2 capitalize text-xs">{r.strategy.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activePortfolio?.transactions?.length ? (
        <div className="rounded-lg border border-border p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Transaction history</div>
          <div className="overflow-x-auto max-h-48 text-xs">
            <table className="w-full">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-1 pr-2">Date</th>
                  <th className="py-1 pr-2">Side</th>
                  <th className="py-1 pr-2">Symbol</th>
                  <th className="py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {activePortfolio.transactions
                  .slice()
                  .reverse()
                  .slice(0, 40)
                  .map((t) => (
                    <tr key={t.id} className="border-b border-border">
                      <td className="py-1 pr-2 whitespace-nowrap">{t.at}</td>
                      <td className="py-1 pr-2 capitalize">{t.side}</td>
                      <td className="py-1 pr-2">{t.symbol}</td>
                      <td className="py-1">{typeof t.amount === "number" ? fmtINR(t.amount) : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Sheet open={Boolean(sheetSymbol)} onOpenChange={(o) => !o && setSheetSymbol(null)}>
        <SheetContent className={dark ? "dark sm:max-w-lg" : "sm:max-w-lg"} side="right">
          <SheetHeader>
            <SheetTitle>{sheetSymbol}</SheetTitle>
          </SheetHeader>
          {detail.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : null}
          {detail.data ? (
            <ScrollArea className="h-[calc(100vh-8rem)] pr-3 mt-4">
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-widest">Quote</div>
                  <div className="text-2xl font-display mt-1">
                    {quoteLastPrice(detail.data.quote) != null ? fmtINR(quoteLastPrice(detail.data.quote)!) : "—"}
                  </div>
                  {detail.data.quote ? (
                    <div className={detail.data.quote.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {fmtPct(detail.data.quote.changePercent)}
                    </div>
                  ) : null}
                </div>
                {detail.data.profile ? (
                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-widest">Company</div>
                    <p className="mt-1">{detail.data.profile.name}</p>
                    <p className="text-muted-foreground text-xs">{detail.data.profile.industry}</p>
                    <p className="text-muted-foreground text-xs">Mkt cap: {detail.data.profile.marketCapitalization?.toLocaleString() ?? "—"}</p>
                    {detail.data.pe != null ? (
                      <p className="text-muted-foreground text-xs mt-1">P/E (where available): {detail.data.pe.toFixed(2)}</p>
                    ) : null}
                    {detail.data.eps != null ? (
                      <p className="text-muted-foreground text-xs">EPS: {detail.data.eps.toFixed(2)}</p>
                    ) : null}
                  </div>
                ) : null}
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Analyst sentiment</div>
                  <ul className="space-y-1">
                    {detail.data.recommendations?.slice(0, 4).map((rec) => (
                      <li key={rec.period} className="flex justify-between gap-2 border-b border-border py-1">
                        <span>{rec.period}</span>
                        <span className="text-xs">
                          SB {rec.strongBuy} · B {rec.buy} · H {rec.hold} · S {rec.sell}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Insider (recent)</div>
                  <ul className="space-y-1 text-xs">
                    {detail.data.insider?.slice(0, 8).map((i, idx) => (
                      <li key={`${i.name}-${idx}`} className="flex justify-between gap-2">
                        <span className="truncate">{i.name}</span>
                        <span>{i.change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-widest mb-1">News</div>
                  <ul className="space-y-2">
                    {detail.data.news?.slice(0, 8).map((n) => (
                      <li key={n.id}>
                        <a className="hover:text-gold" href={n.url} target="_blank" rel="noreferrer">
                          {n.headline}
                        </a>
                        <div className="text-xs text-muted-foreground">{n.source}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AnalyticsWorkspace() {
  const [dark, setDark] = useState(true);
  const [chartSymbol, setChartSymbol] = useState(INDIAN_DEFAULT_CHART_SYMBOL);

  const shellClass = useMemo(
    () =>
      `terminal-shell min-h-screen flex flex-col bg-background text-foreground ${dark ? "dark" : ""} font-sans antialiased`,
    [dark],
  );

  return (
    <div className={shellClass}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-display text-lg text-gold hover:opacity-90">
              Voyyage
            </Link>
            <span className="text-muted-foreground text-sm hidden sm:inline">Terminal</span>
          </div>
          <Button type="button" size="icon" variant="outline" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-6 md:px-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight">Terminal</h1>
        </div>

        <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="dashboard" className="gap-2">
              <LineChart className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="portfolios" className="gap-2">
              <Wallet className="h-4 w-4" /> Portfolios
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardTab dark={dark} chartSymbol={chartSymbol} setChartSymbol={setChartSymbol} />
          </TabsContent>
          <TabsContent value="portfolios">
            <PortfoliosTab dark={dark} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
