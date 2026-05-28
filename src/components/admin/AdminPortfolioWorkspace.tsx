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
  bookWeightPct,
  normalizePositions,
  positionBookValue,
  qtyFromTargetWeight,
  syncTargetWeights,
  totalBookValue,
} from "@/lib/analytics-terminal/admin-portfolio-math";
import type { AnalyticsSessionData, PortfolioEntity, PortfolioPosition } from "@/lib/analytics-terminal/portfolio-schema";
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
    positions: normalizePositions([...portfolio.positions]),
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
    const normalized = {
      ...draft,
      name: draft.name.trim() || "Untitled portfolio",
      positions: normalizePositions(draft.positions),
    };
    const portfolios = (data?.portfolios ?? []).map((p) => (p.id === activeId ? normalized : p));
    await persistAll(portfolios);
    setDraft(normalized);
  };

  const createPortfolio = async () => {
    const name = newPortfolioName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    const portfolio: PortfolioEntity = { id, name, positions: [], description: "" };
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
            weight; aim for weights near 100%. Cash and rebalancing are not simulated here; this is the published
            model allocation.
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

export function AdminPortfolioWorkspace() {
  const [authed, setAuthed] = useState<boolean | null>(null);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {authed ? <AdminEditor /> : <AdminLogin onSuccess={() => setAuthed(true)} />}
      </div>
    </div>
  );
}
