"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, LogOut, Plus, Trash2, Wallet } from "lucide-react";
import {
  adminLogin,
  adminLogout,
  checkAdminAccess,
  getAdminPortfolios,
  saveAdminPortfolios,
} from "@/lib/analytics-terminal/admin-fns";
import type { AnalyticsSessionData } from "@/lib/analytics-terminal/portfolio-schema";
import { normalizeIndianSymbol } from "@/lib/market-data/india";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function AdminEditor() {
  const [data, setData] = useState<AnalyticsSessionData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const s = await getAdminPortfolios();
    setData(s);
    setActiveId((prev) => prev ?? s.portfolios[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (next: AnalyticsSessionData) => {
    setSaving(true);
    setStatus("");
    await saveAdminPortfolios({ data: { portfolios: next.portfolios } });
    setData(next);
    setSaving(false);
    setStatus("Saved.");
  };

  const createPortfolio = async () => {
    const name = window.prompt("Portfolio name?");
    if (!name?.trim()) return;
    const id = crypto.randomUUID();
    const next: AnalyticsSessionData = {
      portfolios: [...(data?.portfolios ?? []), { id, name: name.trim(), positions: [] }],
    };
    await persist(next);
    setActiveId(id);
  };

  const deletePortfolio = async () => {
    if (!activeId) return;
    if (!window.confirm("Delete this portfolio and all positions?")) return;
    const next: AnalyticsSessionData = {
      portfolios: (data?.portfolios ?? []).filter((p) => p.id !== activeId),
    };
    await persist(next);
    setActiveId(next.portfolios[0]?.id ?? null);
  };

  const addPosition = async () => {
    if (!activeId) return;
    const symbol = window.prompt("NSE symbol (e.g. RELIANCE or RELIANCE.NS)?");
    if (!symbol?.trim()) return;
    const normalized = normalizeIndianSymbol(symbol);
    const qty = Number(window.prompt("Quantity?") ?? "0");
    const avgCost = Number(window.prompt("Average cost per share?") ?? "0");
    if (!qty || qty <= 0 || avgCost < 0) return;
    const next: AnalyticsSessionData = {
      portfolios: (data?.portfolios ?? []).map((p) =>
        p.id === activeId
          ? {
              ...p,
              positions: [
                ...p.positions,
                { symbol: normalized, qty, avgCost },
              ],
            }
          : p,
      ),
    };
    await persist(next);
  };

  const removePosition = async (symbol: string) => {
    if (!activeId) return;
    if (!window.confirm(`Remove ${symbol} from this portfolio?`)) return;
    const next: AnalyticsSessionData = {
      portfolios: (data?.portfolios ?? []).map((p) =>
        p.id === activeId
          ? { ...p, positions: p.positions.filter((pos) => pos.symbol !== symbol) }
          : p,
      ),
    };
    await persist(next);
  };

  const active = data?.portfolios.find((p) => p.id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-light">Model portfolios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes apply to all subscribers on the Terminal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void adminLogout().then(() => window.location.reload());
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void createPortfolio()} className="gap-2" disabled={saving}>
          <Plus className="h-4 w-4" /> New portfolio
        </Button>
        <Button type="button" variant="outline" onClick={() => void addPosition()} disabled={!activeId || saving}>
          Add position
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void deletePortfolio()}
          disabled={!activeId || saving}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" /> Delete portfolio
        </Button>
        {saving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        {status ? <span className="text-sm text-emerald-500">{status}</span> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(data?.portfolios ?? []).map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={activeId === p.id ? "default" : "secondary"}
            onClick={() => setActiveId(p.id)}
          >
            <Wallet className="h-3.5 w-3.5 mr-1" />
            {p.name}
          </Button>
        ))}
        {!data?.portfolios.length ? (
          <p className="text-sm text-muted-foreground">No portfolios yet. Create one above.</p>
        ) : null}
      </div>

      {active ? (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Avg cost</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {active.positions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      No positions. Use Add position.
                    </td>
                  </tr>
                ) : null}
                {active.positions.map((pos) => (
                  <tr key={pos.symbol} className="border-t border-border/50">
                    <td className="px-3 py-2 font-medium">{pos.symbol}</td>
                    <td className="px-3 py-2">{pos.qty}</td>
                    <td className="px-3 py-2">{pos.avgCost}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void removePosition(pos.symbol)}
                        disabled={saving}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
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
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        {authed ? <AdminEditor /> : <AdminLogin onSuccess={() => setAuthed(true)} />}
      </div>
    </div>
  );
}
