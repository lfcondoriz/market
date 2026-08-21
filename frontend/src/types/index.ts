export type BybitCategory = 'linear' | 'spot' | 'inverse';

export type Timeframe = '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | 'D' | 'W' | 'M';

export interface InstrumentItem {
  symbol: string;
  category: string;
  contract_type: string;
  status: string;
  base_coin: string;
  quote_coin: string;
  symbol_type?: string;
  display_name?: string;
  min_price?: string;
  max_price?: string;
  tick_size?: string;
  funding_interval?: number;
}

export interface KlinePoint {
  time: number; // Unix timestamp in seconds
  timestamp_iso: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover?: number | null;
}

export interface KlineResponse {
  category: string;
  symbol: string;
  interval: string;
  count: number;
  data: KlinePoint[];
}

export interface FundingRatePoint {
  time: number; // Unix timestamp in seconds
  timestamp_iso: string;
  value: number;
  funding_rate_percentage: number;
}

export interface FundingRateHistoryResponse {
  category: string;
  symbol: string;
  count: number;
  data: FundingRatePoint[];
}

export interface FundingRateSummaryItem {
  symbol: string;
  category: string;
  latest_funding_rate: number;
  latest_funding_rate_pct: number;
  annualized_apr_pct: number;
  last_updated: string;
}

export interface MarketSummaryResponse {
  total_symbols: number;
  top_positive: FundingRateSummaryItem[];
  top_negative: FundingRateSummaryItem[];
}

export interface CompareItemState {
  symbol: string;
  color: string;
  visible: boolean;
}

export interface CompareSeriesItem {
  symbol: string;
  color: string;
  visible: boolean;
  data: FundingRatePoint[];
  loading: boolean;
  latestPct?: number;
  latestApr?: number;
}

export type ActiveTabMode = 'chart' | 'compare' | 'scanner';
