import { useState, useEffect } from 'react';
import { fetchFundingRateHistory } from '../services/api';
import type { BybitCategory, FundingRatePoint } from '../types';

export function useFundingRates(
  symbol: string,
  category: BybitCategory = 'linear',
  enabled: boolean = true
) {
  const [fundingRates, setFundingRates] = useState<FundingRatePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) return;

    let isMounted = true;

    const loadFunding = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchFundingRateHistory(symbol, category, 1000);
        if (isMounted) {
          setFundingRates(res.data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(`Error loading funding rates for ${symbol}:`, err);
          setError(err.message || 'Error cargando tasas de fondeo');
          setFundingRates([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFunding();

    return () => {
      isMounted = false;
    };
  }, [symbol, category, enabled]);

  return { fundingRates, loading, error };
}
