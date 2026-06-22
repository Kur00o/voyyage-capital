"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  adminLogin,
  adminLogout,
  checkAdminAccess,
  getAdminPortfolios,
  previewAdminQuotes,
  saveAdminPortfolios,
} from "@/lib/analytics-terminal/admin-fns";
import {
  getGrievanceData,
  saveGrievanceData,
} from "@/lib/analytics-terminal/grievance-fns";
import type {
  GrievanceState,
  MonthlyComplaintRow,
  MonthlyTrendRow,
  AnnualTrendRow,
} from "@/lib/analytics-terminal/grievance-store";
import {
  bookWeightPct,
  computePortfolioCashRealized,
  normalizePositions,
  normalizeTransactions,
  positionBookValue,
  positionsFromTransactions,
  qtyFromTargetWeight,
  syncTargetWeights,
  totalBookValue,
} from "@/lib/analytics-terminal/admin-portfolio-math";
import type {
  AnalyticsSessionData,
  PortfolioEntity,
  PortfolioPosition,
  PortfolioTransaction,
} from "@/lib/analytics-terminal/portfolio-schema";
import { displaySymbol, normalizeIndianSymbol } from "@/lib/market-data/india";
import { fmtINR, fmtPct } from "@/lib/format-money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await adminLogin({ data: { password } });
    setLoading(false);
    if (!res.ok) {
      setError("Invalid password.");
      return;
    }
    onSuccess();
  };

  return (
    <div className="mx-auto max-w-sm w-full rounded-lg border border-border/60 bg-card/40 p-8">
      <h1 className="font-display text-2xl font-light">Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage model portfolios.</p>
      <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function emptyDraft(portfolio: PortfolioEntity): PortfolioEntity {
  return {
    ...portfolio,
    ...(typeof portfolio.initialCapital === "number" ? {} : { initialCapital: 50_000 }),
    positions: normalizePositions([...portfolio.positions]),
    transactions: normalizeTransactions([...(portfolio.transactions ?? [])]),
  };
}

function AdminEditor() {
  const [data, setData] = useState<AnalyticsSessionData | null>(null);
  const [modelNotional, setModelNotional] = useState(1_000_000);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PortfolioEntity | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);

  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [addHoldingOpen, setAddHoldingOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [addAvg, setAddAvg] = useState("");
  const [addWeight, setAddWeight] = useState("");
  const [deletePortfolioOpen, setDeletePortfolioOpen] = useState(false);
  const [removeSymbol, setRemoveSymbol] = useState<string | null>(null);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [txSymbol, setTxSymbol] = useState("");
  const [txSide, setTxSide] = useState<PortfolioTransaction["side"]>("buy");
  const [txQty, setTxQty] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txAt, setTxAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [txNote, setTxNote] = useState("");
  const [txFormError, setTxFormError] = useState("");

  const load = useCallback(async () => {
    const s = await getAdminPortfolios();
    setData({ portfolios: s.portfolios });
    setModelNotional(s.modelNotional);
    const id = activeId ?? s.portfolios[0]?.id ?? null;
    setActiveId(id);
    const active = s.portfolios.find((p) => p.id === id);
    if (active) setDraft(emptyDraft(active));
  }, [activeId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const refreshQuotes = useCallback(async (symbols: string[]) => {
    if (!symbols.length) {
      setPrices({});
      return;
    }
    setQuotesLoading(true);
    try {
      const res = await previewAdminQuotes({ data: { symbols } });
      setPrices(res.prices);
    } catch {
      setPrices({});
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!draft?.positions.length) {
      setPrices({});
      return;
    }
    const syms = draft.positions.map((p) => p.symbol);
    const t = window.setTimeout(() => void refreshQuotes(syms), 400);
    return () => window.clearTimeout(t);
  }, [draft?.positions, refreshQuotes]);

  const selectPortfolio = (id: string) => {
    if (dirty && !window.confirm("Discard unsaved changes for this portfolio?")) return;
    setActiveId(id);
    setDirty(false);
    setStatus("");
    setError("");
    const p = data?.portfolios.find((x) => x.id === id);
    if (p) setDraft(emptyDraft(p));
  };

  const persistAll = async (portfolios: PortfolioEntity[]) => {
    setSaving(true);
    setStatus("");
    setError("");
    try {
      await saveAdminPortfolios({ data: { portfolios } });
      setData({ portfolios });
      setDirty(false);
      setStatus("Saved — subscribers will see updates on the Terminal.");
    } catch {
      setError("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!draft || !activeId) return;
    const txs = normalizeTransactions(draft.transactions ?? []);
    const rebuilt = txs.length > 0 ? positionsFromTransactions(txs, draft.positions).positions : draft.positions;
    const normalized = {
      ...draft,
      name: draft.name.trim() || "Untitled portfolio",
      initialCapital: Math.max(0, Number(draft.initialCapital) || 0),
      transactions: txs,
      positions: normalizePositions(rebuilt),
    };
    const portfolios = (data?.portfolios ?? []).map((p) => (p.id === activeId ? normalized : p));
    await persistAll(portfolios);
    setDraft(normalized);
  };

  const createPortfolio = async () => {
    const name = newPortfolioName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    const portfolio: PortfolioEntity = { id, name, positions: [], description: "", transactions: [], initialCapital: 50_000 };
    const portfolios = [...(data?.portfolios ?? []), portfolio];
    await persistAll(portfolios);
    setNewPortfolioOpen(false);
    setNewPortfolioName("");
    setActiveId(id);
    setDraft(emptyDraft(portfolio));
    setDirty(false);
  };

  const deletePortfolio = async () => {
    if (!activeId) return;
    const portfolios = (data?.portfolios ?? []).filter((p) => p.id !== activeId);
    await persistAll(portfolios);
    setDeletePortfolioOpen(false);
    const nextId = portfolios[0]?.id ?? null;
    setActiveId(nextId);
    setDraft(nextId ? emptyDraft(portfolios[0]) : null);
    setDirty(false);
  };

  const patchPosition = (index: number, patch: Partial<PortfolioPosition>) => {
    setDraft((d) => {
      if (!d) return d;
      const positions = [...d.positions];
      const current = { ...positions[index], ...patch };
      if (patch.symbol != null) current.symbol = normalizeIndianSymbol(patch.symbol);
      if (patch.qty != null) current.qty = Math.max(1, Math.round(patch.qty));
      if (patch.avgCost != null) current.avgCost = Math.max(0, patch.avgCost);
      positions[index] = current;
      return { ...d, positions: syncTargetWeights(positions) };
    });
    setDirty(true);
  };

  const patchWeight = (index: number, weightPct: number) => {
    const w = Math.min(100, Math.max(0, weightPct));
    setDraft((d) => {
      if (!d) return d;
      const positions = [...d.positions];
      const pos = positions[index];
      positions[index] = {
        ...pos,
        targetWeightPct: w,
        qty: qtyFromTargetWeight(w, pos.avgCost, modelNotional),
      };
      return { ...d, positions: syncTargetWeights(positions) };
    });
    setDirty(true);
  };

  const removePosition = (symbol: string) => {
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        positions: normalizePositions(d.positions.filter((p) => p.symbol !== symbol)),
      };
    });
    setDirty(true);
    setRemoveSymbol(null);
  };

  const submitAddHolding = () => {
    const symbol = normalizeIndianSymbol(addSymbol);
    if (!symbol) return;
    let qty = Math.max(1, Math.round(Number(addQty) || 1));
    const avgCost = Math.max(0, Number(addAvg) || 0);
    const w = Number(addWeight);
    if (Number.isFinite(w) && w > 0 && avgCost > 0) {
      qty = qtyFromTargetWeight(w, avgCost, modelNotional);
    }
    setDraft((d) => {
      if (!d) return d;
      const without = d.positions.filter((p) => p.symbol !== symbol);
      const next = [
        ...without,
        {
          symbol,
          qty,
          avgCost,
          ...(Number.isFinite(w) && w > 0 ? { targetWeightPct: w } : {}),
        },
      ];
      return { ...d, positions: normalizePositions(next) };
    });
    setDirty(true);
    setAddHoldingOpen(false);
    setAddSymbol("");
    setAddQty("1");
    setAddAvg("");
    setAddWeight("");
  };

  const submitAddTransaction = () => {
    if (!draft) {
      setTxFormError("No active portfolio selected.");
      return;
    }
    const symbol = normalizeIndianSymbol(txSymbol);
    if (!symbol) {
      setTxFormError("Symbol is required.");
      return;
    }
    const qty = Number(txQty);
    const price = Number(txPrice);
    const amountInput = txAmount.trim();
    let amount = amountInput ? Number(amountInput) : Number.NaN;
    const nextSide = txSide;

    setError("");
    setStatus("");
    setTxFormError("");

    if (nextSide !== "dividend") {
      if (!Number.isFinite(qty) || qty <= 0) {
        setTxFormError("Quantity must be greater than 0 for buy/sell.");
        return;
      }
      if (!Number.isFinite(price) || price <= 0) {
        setTxFormError("Price must be greater than 0 for buy/sell.");
        return;
      }
      amount = qty * price;
    } else if (!Number.isFinite(amount)) {
      setTxFormError("Enter a valid amount for dividend transactions.");
      return;
    }

    const entry: PortfolioTransaction = {
      id: crypto.randomUUID(),
      symbol,
      side: nextSide,
      at: txAt || new Date().toISOString().slice(0, 10),
      ...(nextSide !== "dividend" && qty > 0 ? { qty } : {}),
      ...(nextSide !== "dividend" && price >= 0 ? { price } : {}),
      ...(Number.isFinite(amount) ? { amount } : {}),
      ...(txNote.trim() ? { note: txNote.trim() } : {}),
    };
    const txs = normalizeTransactions([...(draft.transactions ?? []), entry]);
    const rebuilt = positionsFromTransactions(txs, draft.positions);
    setDraft((d) => (d ? { ...d, transactions: txs, positions: rebuilt.positions } : d));
    setDirty(true);
    setStatus(rebuilt.warnings[0] ?? "Transaction added to draft. Click Save changes to publish.");
    setAddTxOpen(false);
    setTxSymbol("");
    setTxQty("");
    setTxPrice("");
    setTxAmount("");
    setTxNote("");
  };

  const removeTransaction = (id: string) => {
    setDraft((d) => {
      if (!d) return d;
      const txs = normalizeTransactions((d.transactions ?? []).filter((t) => t.id !== id));
      const rebuilt = positionsFromTransactions(txs, d.positions);
      return { ...d, transactions: txs, positions: rebuilt.positions };
    });
    setDirty(true);
  };

  const rebalanceFromWeights = () => {
    setDraft((d) => {
      if (!d) return d;
      const positions = d.positions.map((p) => {
        const w = p.targetWeightPct ?? bookWeightPct(p, d.positions);
        return {
          ...p,
          qty: qtyFromTargetWeight(w, p.avgCost, modelNotional),
          targetWeightPct: w,
        };
      });
      return { ...d, positions: syncTargetWeights(positions) };
    });
    setDirty(true);
  };

  const weightSum = useMemo(() => {
    if (!draft) return 0;
    return draft.positions.reduce((s, p) => s + (p.targetWeightPct ?? bookWeightPct(p, draft.positions)), 0);
  }, [draft]);

  const bookTotal = draft ? totalBookValue(draft.positions) : 0;

  // Live subscriber-facing summary, computed from the draft with the same math
  // the Terminal uses — so admin sees exactly what subscribers will see.
  const bookSummary = useMemo(() => {
    if (!draft) return null;
    const { cash, realized, totalCost, initialCapital } = computePortfolioCashRealized(draft);
    let marketValue = 0;
    let unrealized = 0;
    let priced = 0;
    for (const pos of draft.positions) {
      const ltp = prices[pos.symbol];
      if (ltp == null) continue;
      marketValue += ltp * pos.qty;
      unrealized += (ltp - pos.avgCost) * pos.qty;
      priced += 1;
    }
    return {
      cash,
      realized,
      totalCost,
      initialCapital,
      marketValue,
      unrealized,
      priced,
      totalPositions: draft.positions.length,
      accountValue: cash + marketValue,
    };
  }, [draft, prices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light">Model portfolios</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Define allocation, quantities, and cost basis for each model book. Subscribers see live marks on the
            Terminal — you control the model only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/analytics">Open Terminal</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => void adminLogout().then(() => window.location.reload())}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      <Card className="border-border/60 bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">How model books work</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Each row is a holding: NSE symbol, quantity, and average cost (INR). Target weight drives suggested
            quantity against a {fmtINR(modelNotional, { maximumFractionDigits: 0 })} reference book — adjust qty or
            weight; aim for weights near 100%. Set the book&apos;s <strong>initial capital</strong> and the Book
            summary below shows the live cash, unrealised and realised P&amp;L exactly as subscribers see them on the
            Terminal — cash is initial capital minus the cost of holdings plus realised gains.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => setNewPortfolioOpen(true)} className="gap-2" disabled={saving}>
          <Plus className="h-4 w-4" /> New portfolio
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setAddHoldingOpen(true)}
          disabled={!draft || saving}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add holding
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (!draft) {
              setError("Select or create a portfolio first.");
              return;
            }
            setTxFormError("");
            setAddTxOpen(true);
          }}
          disabled={saving}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
        <Button
          type="button"
          onClick={() => void saveDraft()}
          disabled={!dirty || saving || !draft}
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!draft?.positions.length || saving}
          onClick={() => void refreshQuotes(draft?.positions.map((p) => p.symbol) ?? [])}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${quotesLoading ? "animate-spin" : ""}`} />
          Refresh prices
        </Button>
        {dirty ? (
          <span className="text-xs text-amber-500">Unsaved changes</span>
        ) : status ? (
          <span className="text-sm text-emerald-500">{status}</span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">Portfolios</p>
          {(data?.portfolios ?? []).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPortfolio(p.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeId === p.id ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
              }`}
            >
              <Wallet className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto text-xs opacity-70">{p.positions.length}</span>
            </button>
          ))}
          {!data?.portfolios.length ? (
            <p className="px-1 text-sm text-muted-foreground">Create a portfolio to begin.</p>
          ) : null}
        </aside>

        {draft ? (
          <div className="space-y-4 min-w-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="pf-name">Portfolio name</Label>
                <Input
                  id="pf-name"
                  value={draft.name}
                  onChange={(e) => {
                    setDraft((d) => (d ? { ...d, name: e.target.value } : d));
                    setDirty(true);
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pf-capital">Initial capital (INR)</Label>
                <Input
                  id="pf-capital"
                  type="number"
                  min={0}
                  value={draft.initialCapital ?? 0}
                  onChange={(e) => {
                    setDraft((d) => (d ? { ...d, initialCapital: Math.max(0, Number(e.target.value) || 0) } : d));
                    setDirty(true);
                  }}
                  className="mt-1"
                />
              </div>
              <div className="flex flex-wrap items-end gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={rebalanceFromWeights}
                  disabled={!draft.positions.length || saving}
                >
                  Recalc qty from weights
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setDeletePortfolioOpen(true)}
                  disabled={saving}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete portfolio
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="pf-desc">Description (shown to subscribers)</Label>
              <Textarea
                id="pf-desc"
                value={draft.description ?? ""}
                onChange={(e) => {
                  setDraft((d) => (d ? { ...d, description: e.target.value } : d));
                  setDirty(true);
                }}
                placeholder="e.g. Large-cap quality tilt, quarterly rebalance…"
                className="mt-1 min-h-[72px]"
              />
            </div>

            {bookSummary ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Book summary <span className="normal-case opacity-70">(what subscribers see)</span>
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    Account value <strong className="text-foreground">{fmtINR(bookSummary.accountValue)}</strong>
                    {" · "}
                    {bookSummary.priced < bookSummary.totalPositions
                      ? `${bookSummary.priced}/${bookSummary.totalPositions} marks loaded`
                      : "live marks"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Portfolio value</div>
                    <div className="mt-1.5 font-display text-2xl font-light">{fmtINR(bookSummary.marketValue)}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Market value of holdings</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Cash</div>
                    <div className={`mt-1.5 font-display text-2xl font-light ${bookSummary.cash < 0 ? "text-red-400" : ""}`}>
                      {fmtINR(bookSummary.cash)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Capital − holdings cost + realized</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Unrealized P&amp;L</div>
                    <div
                      className={`mt-1.5 font-display text-2xl font-light ${bookSummary.unrealized < 0 ? "text-red-400" : "text-emerald-500"}`}
                    >
                      {fmtINR(bookSummary.unrealized)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Live mark vs avg cost</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Realized P&amp;L</div>
                    <div
                      className={`mt-1.5 font-display text-2xl font-light ${bookSummary.realized < 0 ? "text-red-400" : "text-emerald-500"}`}
                    >
                      {fmtINR(bookSummary.realized)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Booked from sells &amp; dividends</div>
                  </div>
                </div>
                {bookSummary.cash < 0 ? (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Holdings cost ({fmtINR(bookSummary.totalCost)}) exceeds initial capital plus realized gains, so
                      cash is negative. Raise initial capital or trim holdings to keep the book funded.
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-lg border border-border/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Transaction ledger</p>
                <p className="text-xs text-muted-foreground">{(draft.transactions ?? []).length} entries</p>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-1 pr-2">Date</th>
                      <th className="py-1 pr-2">Side</th>
                      <th className="py-1 pr-2">Symbol</th>
                      <th className="py-1 pr-2">Qty</th>
                      <th className="py-1 pr-2">Price</th>
                      <th className="py-1 pr-2">Amount</th>
                      <th className="py-1 pr-2">Note</th>
                      <th className="py-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {(draft.transactions ?? []).map((t) => (
                      <tr key={t.id} className="border-b border-border/40">
                        <td className="py-1 pr-2 whitespace-nowrap">{t.at}</td>
                        <td className="py-1 pr-2 capitalize">{t.side}</td>
                        <td className="py-1 pr-2">{displaySymbol(t.symbol)}</td>
                        <td className="py-1 pr-2">{t.qty ?? "—"}</td>
                        <td className="py-1 pr-2">{typeof t.price === "number" ? fmtINR(t.price) : "—"}</td>
                        <td className="py-1 pr-2">{typeof t.amount === "number" ? fmtINR(t.amount) : "—"}</td>
                        <td className="py-1 pr-2 truncate max-w-[220px]">{t.note ?? "—"}</td>
                        <td className="py-1 text-right">
                          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeTransaction(t.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-md border border-border/60 bg-muted/30 px-3 py-1.5">
                Holdings: <strong>{draft.positions.length}</strong>
              </span>
              <span className="rounded-md border border-border/60 bg-muted/30 px-3 py-1.5">
                Model book: <strong>{fmtINR(bookTotal)}</strong>
              </span>
              <span
                className={`rounded-md border px-3 py-1.5 flex items-center gap-1.5 ${
                  Math.abs(weightSum - 100) <= 0.5
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-amber-500/40 bg-amber-500/10"
                }`}
              >
                {Math.abs(weightSum - 100) > 0.5 ? (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : null}
                Target weights: <strong>{weightSum.toFixed(1)}%</strong>
                {Math.abs(weightSum - 100) > 0.5 ? (
                  <span className="text-muted-foreground">(aim for 100%)</span>
                ) : null}
              </span>
            </div>

            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 min-w-[120px]">Symbol</th>
                      <th className="px-2 py-2 w-20">Qty</th>
                      <th className="px-2 py-2 min-w-[100px]">Avg cost</th>
                      <th className="px-2 py-2 w-20">Target %</th>
                      <th className="px-2 py-2 hidden md:table-cell">Book</th>
                      <th className="px-2 py-2 hidden lg:table-cell">LTP</th>
                      <th className="px-2 py-2 hidden lg:table-cell">vs cost</th>
                      <th className="px-2 py-2 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.positions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                          No holdings yet. Add a position to build this model.
                        </td>
                      </tr>
                    ) : null}
                    {draft.positions.map((pos, idx) => {
                      const ltp = prices[pos.symbol];
                      const book = positionBookValue(pos);
                      const pnlPct =
                        ltp != null && pos.avgCost > 0 ? ((ltp - pos.avgCost) / pos.avgCost) * 100 : null;
                      const weight = pos.targetWeightPct ?? bookWeightPct(pos, draft.positions);
                      return (
                        <tr key={pos.symbol} className="border-t border-border/50 align-middle">
                          <td className="px-2 py-1.5">
                            <Input
                              value={pos.symbol}
                              onChange={(e) => patchPosition(idx, { symbol: e.target.value })}
                              className="h-8 font-mono text-xs"
                              aria-label="Symbol"
                            />
                            <span className="text-[10px] text-muted-foreground pl-1">
                              {displaySymbol(pos.symbol)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={pos.qty}
                              onChange={(e) => patchPosition(idx, { qty: Number(e.target.value) })}
                              className="h-8 w-20"
                              aria-label="Quantity"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min={0}
                              step={0.05}
                              value={pos.avgCost || ""}
                              onChange={(e) => patchPosition(idx, { avgCost: Number(e.target.value) })}
                              className="h-8 min-w-[96px]"
                              aria-label="Average cost"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={weight.toFixed(1)}
                              onChange={(e) => patchWeight(idx, Number(e.target.value))}
                              className="h-8 w-20"
                              aria-label="Target weight percent"
                            />
                          </td>
                          <td className="px-2 py-2 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                            {fmtINR(book)}
                          </td>
                          <td className="px-2 py-2 hidden lg:table-cell whitespace-nowrap">
                            {ltp != null ? fmtINR(ltp) : quotesLoading ? "…" : "—"}
                          </td>
                          <td
                            className={`px-2 py-2 hidden lg:table-cell whitespace-nowrap ${
                              pnlPct == null ? "" : pnlPct >= 0 ? "text-emerald-500" : "text-red-400"
                            }`}
                          >
                            {pnlPct != null ? fmtPct(pnlPct) : "—"}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setRemoveSymbol(pos.symbol)}
                              aria-label={`Remove ${pos.symbol}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select or create a portfolio.</p>
        )}
      </div>

      <Dialog open={newPortfolioOpen} onOpenChange={setNewPortfolioOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New model portfolio</DialogTitle>
            <DialogDescription>
              e.g. Voyyage Core, Voyyage Momentum — a separate book for subscribers.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="new-pf-name">Name</Label>
            <Input
              id="new-pf-name"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="Voyyage Core"
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewPortfolioOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void createPortfolio()} disabled={!newPortfolioName.trim() || saving}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addHoldingOpen} onOpenChange={setAddHoldingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add holding</DialogTitle>
            <DialogDescription>
              NSE symbol (RELIANCE or RELIANCE.NS). Optional target % will size quantity on the model book.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="add-symbol">Symbol</Label>
              <Input
                id="add-symbol"
                value={addSymbol}
                onChange={(e) => setAddSymbol(e.target.value)}
                placeholder="RELIANCE"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-qty">Quantity</Label>
              <Input
                id="add-qty"
                type="number"
                min={1}
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-avg">Avg cost (INR)</Label>
              <Input
                id="add-avg"
                type="number"
                min={0}
                value={addAvg}
                onChange={(e) => setAddAvg(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="add-weight">Target weight % (optional)</Label>
              <Input
                id="add-weight"
                type="number"
                min={0}
                max={100}
                value={addWeight}
                onChange={(e) => setAddWeight(e.target.value)}
                placeholder="e.g. 12.5"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddHoldingOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitAddHolding} disabled={!addSymbol.trim()}>
              Add to draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addTxOpen} onOpenChange={setAddTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
            <DialogDescription>Record buys/sells/dividends; holdings auto-update from this ledger.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitAddTransaction();
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="tx-date">Date</Label>
                <Input id="tx-date" value={txAt} onChange={(e) => setTxAt(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tx-side">Side</Label>
                <select
                  id="tx-side"
                  value={txSide}
                  onChange={(e) => setTxSide(e.target.value as PortfolioTransaction["side"])}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="dividend">Dividend</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="tx-symbol">Symbol</Label>
                <Input id="tx-symbol" value={txSymbol} onChange={(e) => setTxSymbol(e.target.value)} placeholder="ABCAPITAL" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tx-qty">Qty</Label>
                <Input id="tx-qty" type="number" min={0} value={txQty} onChange={(e) => setTxQty(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tx-price">Price (INR)</Label>
                <Input id="tx-price" type="number" min={0} value={txPrice} onChange={(e) => setTxPrice(e.target.value)} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="tx-amount">Amount (optional; auto for buy/sell)</Label>
                <Input id="tx-amount" type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="tx-note">Note</Label>
                <Input id="tx-note" value={txNote} onChange={(e) => setTxNote(e.target.value)} className="mt-1" placeholder="Optional" />
              </div>
              {txFormError ? <p className="sm:col-span-2 text-sm text-destructive">{txFormError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddTxOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  submitAddTransaction();
                }}
              >
                Add transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletePortfolioOpen} onOpenChange={setDeletePortfolioOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{draft?.name}&quot; and all holdings for every subscriber. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void deletePortfolio()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!removeSymbol} onOpenChange={(o) => !o && setRemoveSymbol(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeSymbol}?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes this holding from the model. Save changes to publish to the Terminal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeSymbol && removePosition(removeSymbol)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminGrievanceEditor() {
  const [state, setState] = useState<GrievanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getGrievanceData();
      setState(d);
    } catch {
      setError("Failed to load grievance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateComplaint = (idx: number, field: keyof MonthlyComplaintRow, val: string) => {
    setState((s) => {
      if (!s) return null;
      const monthlyComplaints = [...s.monthlyComplaints];
      monthlyComplaints[idx] = { ...monthlyComplaints[idx], [field]: val };
      return { ...s, monthlyComplaints };
    });
  };

  const updateMonthlyTrend = (idx: number, field: keyof MonthlyTrendRow, val: string) => {
    setState((s) => {
      if (!s) return null;
      const monthlyTrends = [...s.monthlyTrends];
      monthlyTrends[idx] = { ...monthlyTrends[idx], [field]: val };
      return { ...s, monthlyTrends };
    });
  };

  const addMonthlyTrend = () => {
    setState((s) => {
      if (!s) return null;
      return {
        ...s,
        monthlyTrends: [
          ...s.monthlyTrends,
          { month: "New Month 202X", carriedForward: "0", received: "0", resolved: "0", pending: "0" },
        ],
      };
    });
  };

  const removeMonthlyTrend = (idx: number) => {
    setState((s) => {
      if (!s) return null;
      return {
        ...s,
        monthlyTrends: s.monthlyTrends.filter((_, i) => i !== idx),
      };
    });
  };

  const updateAnnualTrend = (idx: number, field: keyof AnnualTrendRow, val: string) => {
    setState((s) => {
      if (!s) return null;
      const annualTrends = [...s.annualTrends];
      annualTrends[idx] = { ...annualTrends[idx], [field]: val };
      return { ...s, annualTrends };
    });
  };

  const addAnnualTrend = () => {
    setState((s) => {
      if (!s) return null;
      return {
        ...s,
        annualTrends: [
          ...s.annualTrends,
          { year: "202X–XX", carriedForward: "0", received: "0", resolved: "0", pending: "0" },
        ],
      };
    });
  };

  const removeAnnualTrend = (idx: number) => {
    setState((s) => {
      if (!s) return null;
      return {
        ...s,
        annualTrends: s.annualTrends.filter((_, i) => i !== idx),
      };
    });
  };

  const save = async () => {
    if (!state) return;
    setSaving(true);
    setStatus("");
    setError("");
    try {
      await saveGrievanceData({ data: state });
      setStatus("Grievance tables successfully updated and published.");
    } catch {
      setError("Failed to save changes. Make sure you are authenticated.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium">Edit Investor Grievance Data</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Update the complaint tables. Changes take effect on the public page immediately in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Grievance Data
          </Button>
          {status ? <span className="text-xs text-emerald-500 font-medium">{status}</span> : null}
          {error ? <span className="text-xs text-destructive font-medium">{error}</span> : null}
        </div>
      </div>

      {/* Date config */}
      <div className="bg-card/40 border border-border/60 p-4 rounded-lg max-w-sm">
        <Label htmlFor="month-ending">Data Ending Month/Date</Label>
        <Input
          id="month-ending"
          value={state.monthEnding}
          onChange={(e) => setState((s) => (s ? { ...s, monthEnding: e.target.value } : null))}
          placeholder="e.g. May 31, 2026"
          className="mt-1.5"
        />
      </div>

      {/* Table 1: Complaints */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase font-semibold text-muted-foreground">1. Monthly Complaint Data</CardTitle>
          <CardDescription className="text-xs">
            Edit the complaint data for each category. Totals are automatically computed dynamically.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2">Received From</th>
                <th className="px-3 py-2 w-28 text-center">Pending Last Month</th>
                <th className="px-3 py-2 w-24 text-center">Received</th>
                <th className="px-3 py-2 w-24 text-center">Resolved</th>
                <th className="px-3 py-2 w-28 text-center">Total Pending</th>
                <th className="px-3 py-2 w-28 text-center">Pending &gt; 3 Months</th>
                <th className="px-3 py-2 w-32 text-center">Avg Resolution Time (Days)</th>
              </tr>
            </thead>
            <tbody>
              {state.monthlyComplaints.map((row, idx) => (
                <tr key={idx} className="border-b border-border/40">
                  <td className="px-3 py-2 font-medium text-gray-700">{row.category}</td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.pendingLastMonth}
                      onChange={(e) => updateComplaint(idx, "pendingLastMonth", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Pending Last Month"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.received}
                      onChange={(e) => updateComplaint(idx, "received", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Received"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.resolved}
                      onChange={(e) => updateComplaint(idx, "resolved", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Resolved"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.totalPending}
                      onChange={(e) => updateComplaint(idx, "totalPending", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Total Pending"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.pendingOver3Months}
                      onChange={(e) => updateComplaint(idx, "pendingOver3Months", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Pending over 3 months"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.avgResolutionTime}
                      onChange={(e) => updateComplaint(idx, "avgResolutionTime", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Average resolution time"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Table 2: Monthly Trend */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm uppercase font-semibold text-muted-foreground">2. Trend of Monthly Disposal</CardTitle>
            <CardDescription className="text-xs">Manage month-by-month disposal logs.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMonthlyTrend} className="gap-1.5">
            <Plus className="h-3 w-3" /> Add Month
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2 w-36 text-center">Carried Forward</th>
                <th className="px-3 py-2 w-32 text-center">Received</th>
                <th className="px-3 py-2 w-32 text-center">Resolved</th>
                <th className="px-3 py-2 w-36 text-center">Pending</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {state.monthlyTrends.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No monthly trends defined.</td>
                </tr>
              ) : null}
              {state.monthlyTrends.map((row, idx) => (
                <tr key={idx} className="border-b border-border/40">
                  <td className="px-2 py-1">
                    <Input
                      value={row.month}
                      onChange={(e) => updateMonthlyTrend(idx, "month", e.target.value)}
                      className="h-8 text-xs font-medium"
                      aria-label="Month"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.carriedForward}
                      onChange={(e) => updateMonthlyTrend(idx, "carriedForward", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Carried Forward"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.received}
                      onChange={(e) => updateMonthlyTrend(idx, "received", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Received"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.resolved}
                      onChange={(e) => updateMonthlyTrend(idx, "resolved", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Resolved"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.pending}
                      onChange={(e) => updateMonthlyTrend(idx, "pending", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Pending"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeMonthlyTrend(idx)}
                      aria-label="Delete month"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Table 3: Annual Trend */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm uppercase font-semibold text-muted-foreground">3. Trend of Annual Disposal</CardTitle>
            <CardDescription className="text-xs">Manage year-by-year disposal logs.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addAnnualTrend} className="gap-1.5">
            <Plus className="h-3 w-3" /> Add Year
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2 w-36 text-center">Carried Forward</th>
                <th className="px-3 py-2 w-32 text-center">Received</th>
                <th className="px-3 py-2 w-32 text-center">Resolved</th>
                <th className="px-3 py-2 w-36 text-center">Pending</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {state.annualTrends.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No annual trends defined.</td>
                </tr>
              ) : null}
              {state.annualTrends.map((row, idx) => (
                <tr key={idx} className="border-b border-border/40">
                  <td className="px-2 py-1">
                    <Input
                      value={row.year}
                      onChange={(e) => updateAnnualTrend(idx, "year", e.target.value)}
                      className="h-8 text-xs font-medium"
                      aria-label="Year"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.carriedForward}
                      onChange={(e) => updateAnnualTrend(idx, "carriedForward", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Carried Forward"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.received}
                      onChange={(e) => updateAnnualTrend(idx, "received", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Received"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.resolved}
                      onChange={(e) => updateAnnualTrend(idx, "resolved", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Resolved"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={row.pending}
                      onChange={(e) => updateAnnualTrend(idx, "pending", e.target.value)}
                      className="h-8 text-center text-xs"
                      aria-label="Pending"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeAnnualTrend(idx)}
                      aria-label="Delete year"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPortfolioWorkspace() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"portfolios" | "grievance">("portfolios");

  useEffect(() => {
    void checkAdminAccess().then((a) => setAuthed(a.ok));
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-full max-w-sm px-4">
          <AdminLogin onSuccess={() => setAuthed(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 space-y-6">
        {/* Tab Switcher */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("portfolios")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "portfolios"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Model Portfolios
          </button>
          <button
            type="button"
            onClick={() => setTab("grievance")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "grievance"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Investor Grievance (Annexure B)
          </button>
        </div>

        {tab === "portfolios" ? <AdminEditor /> : <AdminGrievanceEditor />}
      </div>
    </div>
  );
}
