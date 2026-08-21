import { useState, useEffect, useRef } from 'react';
import { fetchFundingRateHistory } from '../services/api';
import type { BybitCategory, CompareItemState, CompareSeriesItem, FundingRatePoint } from '../types';

export function useMultiFundingRates(
  items: CompareItemState[],
  category: BybitCategory = 'linear'
) {
  const [seriesList, setSeriesList] = useState<CompareSeriesItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const cacheRef = useRef<Map<string, FundingRatePoint[]>>(new Map());

  useEffect(() => {
    if (!items || items.length === 0) {
      setSeriesList([]);
      return;
    }

    let isMounted = true;

    const loadAll = async () => {
      // Find items not in cache
      const uncached = items.filter((item) => !cacheRef.current.has(item.symbol));

      if (uncached.length > 0) {
        setLoading(true);
        const fetchPromises = uncached.map(async (item) => {
          try {
            const res = await fetchFundingRateHistory(item.symbol, category, 1000);
            cacheRef.current.set(item.symbol, res.data || []);
          } catch (err) {
            console.error(`Error loading funding for ${item.symbol}:`, err);
            cacheRef.current.set(item.symbol, []);
          }
        });
        await Promise.all(fetchPromises);
      }

      if (!isMounted) return;

      const builtList: CompareSeriesItem[] = items.map((item) => {
        const data = cacheRef.current.get(item.symbol) || [];
        const lastPoint = data.length > 0 ? data[data.length - 1] : null;
        const latestPct = lastPoint ? lastPoint.funding_rate_percentage : 0;
        const latestApr = latestPct * 3 * 365;

        return {
          symbol: item.symbol,
          color: item.color,
          visible: item.visible,
          data,
          loading: false,
          latestPct,
          latestApr,
        };
      });

      setSeriesList(builtList);
      setLoading(false);
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [items, category]);

  return { seriesList, loading };
}
