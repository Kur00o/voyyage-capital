import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { modelPortfolios, modelPositions, modelTransactions } from "@/lib/db/schema";
import {
  analyticsSessionDataSchema,
  emptySessionData,
  type AnalyticsSessionData,
  type PortfolioEntity,
} from "./portfolio-schema";

let schemaChecked = false;

async function ensurePortfolioSchemaColumns(): Promise<void> {
  if (schemaChecked) return;
  const db = getDb();
  await db.execute(sql`ALTER TABLE "model_portfolios" ADD COLUMN IF NOT EXISTS "description" text`);
  await db.execute(sql`ALTER TABLE "model_positions" ADD COLUMN IF NOT EXISTS "target_weight_pct" double precision`);
  schemaChecked = true;
}

/** Global model portfolios (admin-managed; shared by all subscribers). */
export async function readModelPortfolios(): Promise<AnalyticsSessionData> {
  await ensurePortfolioSchemaColumns();
  const db = getDb();

  const portfolioRows = await db.select().from(modelPortfolios).orderBy(modelPortfolios.name);
  if (portfolioRows.length === 0) return emptySessionData();

  const positionRows = await db.select().from(modelPositions);
  const transactionRows = await db.select().from(modelTransactions);

  const positionsByPortfolio = new Map<string, PortfolioEntity["positions"]>();
  for (const row of positionRows) {
    const list = positionsByPortfolio.get(row.portfolioId) ?? [];
    list.push({
      symbol: row.symbol,
      qty: row.qty,
      avgCost: row.avgCost,
      ...(row.targetWeightPct != null ? { targetWeightPct: row.targetWeightPct } : {}),
      ...(row.openedAt ? { openedAt: row.openedAt } : {}),
    });
    positionsByPortfolio.set(row.portfolioId, list);
  }

  const transactionsByPortfolio = new Map<string, NonNullable<PortfolioEntity["transactions"]>>();
  for (const row of transactionRows) {
    const list = transactionsByPortfolio.get(row.portfolioId) ?? [];
    list.push({
      id: row.id,
      symbol: row.symbol,
      side: row.side,
      at: row.at,
      ...(row.qty != null ? { qty: row.qty } : {}),
      ...(row.price != null ? { price: row.price } : {}),
      ...(row.amount != null ? { amount: row.amount } : {}),
      ...(row.note ? { note: row.note } : {}),
    });
    transactionsByPortfolio.set(row.portfolioId, list);
  }

  const portfolios: PortfolioEntity[] = portfolioRows.map((p) => ({
    id: p.id,
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    positions: positionsByPortfolio.get(p.id) ?? [],
    transactions: transactionsByPortfolio.get(p.id),
  }));

  const parsed = analyticsSessionDataSchema.safeParse({ portfolios });
  return parsed.success ? parsed.data : emptySessionData();
}

export async function writeModelPortfolios(data: AnalyticsSessionData): Promise<void> {
  const validated = analyticsSessionDataSchema.parse(data);
  await ensurePortfolioSchemaColumns();
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.delete(modelTransactions);
    await tx.delete(modelPositions);
    await tx.delete(modelPortfolios);

    for (const portfolio of validated.portfolios) {
      await tx.insert(modelPortfolios).values({
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description ?? null,
        createdAt: now,
        updatedAt: now,
      });

      if (portfolio.positions.length > 0) {
        await tx.insert(modelPositions).values(
          portfolio.positions.map((pos) => ({
            portfolioId: portfolio.id,
            symbol: pos.symbol,
            qty: pos.qty,
            avgCost: pos.avgCost,
            targetWeightPct: pos.targetWeightPct ?? null,
            openedAt: pos.openedAt ?? null,
          })),
        );
      }

      const txs = portfolio.transactions ?? [];
      if (txs.length > 0) {
        await tx.insert(modelTransactions).values(
          txs.map((t) => ({
            id: t.id,
            portfolioId: portfolio.id,
            symbol: t.symbol,
            side: t.side,
            qty: t.qty ?? null,
            price: t.price ?? null,
            amount: t.amount ?? null,
            at: t.at,
            note: t.note ?? null,
          })),
        );
      }
    }
  });
}
