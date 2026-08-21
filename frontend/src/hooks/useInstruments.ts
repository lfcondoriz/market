import { useState, useEffect, useCallback } from 'react';
import { fetchInstruments } from '../services/api';
import type { BybitCategory, InstrumentItem } from '../types';
import type { AssetCategoryFilter } from '../constants/categories';

export function useInstruments(category: BybitCategory = 'linear') {
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadInstruments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchInstruments(category, undefined, undefined, 2000);
      setInstruments(list);
    } catch (err: any) {
      console.error('Error in useInstruments:', err);
      setError(err.message || 'Error al cargar catálogo de instrumentos');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadInstruments();
  }, [loadInstruments]);

  /**
   * Helper function to filter instruments by search query and category (Crypto, Stock, ETF, Commodity).
   */
  const filterInstruments = useCallback(
    (query: string, filterType: AssetCategoryFilter = 'all'): InstrumentItem[] => {
      const q = query.toLowerCase().trim();

      return instruments.filter((item) => {
        const matchesQuery =
          !q ||
          item.symbol.toLowerCase().includes(q) ||
          (item.base_coin && item.base_coin.toLowerCase().includes(q)) ||
          (item.display_name && item.display_name.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        const symType = item.symbol_type?.toLowerCase() || '';

        switch (filterType) {
          case 'crypto':
            return !symType || symType === 'uncategorized' || symType === 'innovation';
          case 'stock':
            return symType === 'stock';
          case 'etf':
            return symType === 'etf';
          case 'commodity':
            return symType === 'commodity';
          case 'all':
          default:
            return true;
        }
      });
    },
    [instruments]
  );

  return {
    instruments,
    loading,
    error,
    reload: loadInstruments,
    filterInstruments,
  };
}
