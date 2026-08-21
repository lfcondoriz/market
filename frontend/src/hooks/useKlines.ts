import { useState, useEffect } from 'react';
import { fetchKlines } from '../services/api';
import type { BybitCategory, KlinePoint, Timeframe } from '../types';

export function useKlines(
  symbol: string,
  timeframe: Timeframe = '1',
  category: BybitCategory = 'linear'
) {
  const [klines, setKlines] = useState<KlinePoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;

    const loadKlines = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchKlines(symbol, timeframe, category, 1000);
        if (isMounted) {
          setKlines(res.data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(`Error loading klines for ${symbol}:`, err);
          setError(err.message || 'Error cargando velas');
          setKlines([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadKlines();

    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe, category]);

  return { klines, loading, error };
}
