import type {
  BybitCategory,
  FundingRateHistoryResponse,
  InstrumentItem,
  KlineResponse,
  MarketSummaryResponse,
  Timeframe,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function fetchInstruments(
  category: BybitCategory = 'linear',
  search?: string,
  symbolType?: string,
  limit: number = 2000
): Promise<InstrumentItem[]> {
  const params = new URLSearchParams({
    category,
    limit: limit.toString(),
  });
  if (search) params.append('search', search);
  if (symbolType && symbolType !== 'all') params.append('symbol_type', symbolType);

  const res = await fetch(`${API_BASE_URL}/instruments?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error fetching instruments: ${res.statusText}`);
  }
  const data = await res.json();
  // Backend returns PaginatedResponse with 'items'
  return data.items || data.data || [];
}

export async function fetchInstrumentDetail(symbol: string): Promise<InstrumentItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/instruments/${symbol}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching instrument detail:', err);
    return null;
  }
}

export async function fetchKlines(
  symbol: string,
  interval: Timeframe = '1',
  category: BybitCategory = 'linear',
  limit: number = 1000
): Promise<KlineResponse> {
  const params = new URLSearchParams({
    category,
    interval,
    limit: limit.toString(),
    ascending: 'true',
  });

  const res = await fetch(`${API_BASE_URL}/klines/${symbol}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error fetching klines: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchFundingRateHistory(
  symbol: string,
  category: BybitCategory = 'linear',
  limit: number = 1000
): Promise<FundingRateHistoryResponse> {
  const params = new URLSearchParams({
    category,
    limit: limit.toString(),
  });

  const res = await fetch(`${API_BASE_URL}/funding-rates/${symbol}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error fetching funding rates: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchMarketSummary(
  category: BybitCategory = 'linear'
): Promise<MarketSummaryResponse> {
  const params = new URLSearchParams({ category });
  const res = await fetch(`${API_BASE_URL}/funding-rates/summary?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error fetching market summary: ${res.statusText}`);
  }
  return await res.json();
}
