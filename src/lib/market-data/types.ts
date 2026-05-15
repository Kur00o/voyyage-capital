/** Shared DTOs for market data providers (API-agnostic). */

export type MarketProviderId = "polygon" | "finnhub" | "alphavantage" | "twelvedata";

export type QuoteDTO = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
  timestamp: number;
  source: MarketProviderId;
};

export type CandleDTO = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type NewsItemDTO = {
  id: string;
  headline: string;
  source: string;
  url: string;
  datetime: number;
  related?: string;
};

export type SymbolSearchResultDTO = {
  symbol: string;
  description: string;
  type?: string;
  exchange?: string;
};

export type CompanyProfileDTO = {
  symbol: string;
  name: string;
  exchange?: string;
  industry?: string;
  ipo?: string;
  marketCapitalization?: number;
  shareOutstanding?: number;
  weburl?: string;
  logo?: string;
};

export type AnalystRecommendationDTO = {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

export type InsiderTransactionDTO = {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionCode?: string;
};
