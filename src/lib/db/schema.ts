import { relations } from "drizzle-orm";
import { doublePrecision, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const transactionSideEnum = pgEnum("transaction_side", ["buy", "sell", "dividend"]);

export const modelPortfolios = pgTable("model_portfolios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const modelPositions = pgTable(
  "model_positions",
  {
    portfolioId: text("portfolio_id")
      .notNull()
      .references(() => modelPortfolios.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
  qty: doublePrecision("qty").notNull(),
  avgCost: doublePrecision("avg_cost").notNull(),
  targetWeightPct: doublePrecision("target_weight_pct"),
    openedAt: text("opened_at"),
  },
  (t) => [uniqueIndex("model_positions_portfolio_symbol_idx").on(t.portfolioId, t.symbol)],
);

export const modelTransactions = pgTable("model_transactions", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id")
    .notNull()
    .references(() => modelPortfolios.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  side: transactionSideEnum("side").notNull(),
  qty: doublePrecision("qty"),
  price: doublePrecision("price"),
  amount: doublePrecision("amount"),
  at: text("at").notNull(),
  note: text("note"),
});

export const modelPortfoliosRelations = relations(modelPortfolios, ({ many }) => ({
  positions: many(modelPositions),
  transactions: many(modelTransactions),
}));

export const modelPositionsRelations = relations(modelPositions, ({ one }) => ({
  portfolio: one(modelPortfolios, {
    fields: [modelPositions.portfolioId],
    references: [modelPortfolios.id],
  }),
}));

export const modelTransactionsRelations = relations(modelTransactions, ({ one }) => ({
  portfolio: one(modelPortfolios, {
    fields: [modelTransactions.portfolioId],
    references: [modelPortfolios.id],
  }),
}));
