import { useState, useEffect } from 'react';
import { fetchFundingRateHistory } from '../services/api';
import { OVERLAY_LINE_COLORS } from '../constants/theme';
import type { BybitCategory, CompareSeriesItem } from '../types';

export function useMultiFundingRates(
  symbols: string[],
  category: BybitCategory = 'linear'
) {
  const [seriesList, setSeriesList] = useState<CompareSeriesItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!symbols || symbols.length === 0) {
      setSeriesList([]);
      return;
    }

    let isMounted = true;

    const loadAll = async () => {
      setLoading(true);

      const promises = symbols.map(async (symbol, index) => {
        const color = OVERLAY_LINE_COLORS[index % OVERLAY_LINE_COLORS.length];
        try {
          const res = await fetchFundingRateHistory(symbol, category, 1000);
          const data = res.data || [];
          const lastPoint = data.length > 0 ? data[data.length - 1] : null;
          const latestPct = lastPoint ? lastPoint.funding_rate_percentage : 0;
          const latestApr = latestPct * 3 * 365;

          return {
            symbol,
            color,
            data,
            loading: false,
            latestPct,
            latestApr,
          } as CompareSeriesItem;
        } catch (err) {
          console.error(`Error loading comparison for ${symbol}:`, err);
          return {
            symbol,
            color,
            data: [],
            loading: false,
          } as CompareSeriesItem;
        }
      });

      const results = await Promise.all(promises);
      if (isMounted) {
        setSeriesList(results);
        setLoading(false);
      }
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [symbols, category]);

  return { seriesList, loading };
}
