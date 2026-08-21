import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { fetchInstruments, fetchInstrumentDetail } from '../services/api';
import { OVERLAY_LINE_COLORS } from '../constants/theme';
import type { AssetCategoryFilter } from '../constants/categories';
import type {
  ActiveTabMode,
  BybitCategory,
  CompareItemState,
  InstrumentItem,
  Timeframe,
} from '../types';

interface MarketContextType {
  // Active Navigation & Market
  activeSymbol: string;
  category: BybitCategory;
  timeframe: Timeframe;
  activeTab: ActiveTabMode;
  activeInstrument: InstrumentItem | null;
  instruments: InstrumentItem[];
  loadingInstruments: boolean;

  // UI Panels
  showSubChart: boolean;
  subChartHeight: number;
  showWatchlist: boolean;
  isSearchOpen: boolean;

  // Actions
  setActiveSymbol: (symbol: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setActiveTab: (tab: ActiveTabMode) => void;
  setShowSubChart: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSubChart: () => void;
  setSubChartHeight: (height: number) => void;
  setShowWatchlist: React.Dispatch<React.SetStateAction<boolean>>;
  toggleWatchlist: () => void;
  openSearch: () => void;
  closeSearch: () => void;

  // Filter Catalog Helper
  filterInstruments: (query: string, filterType: AssetCategoryFilter) => InstrumentItem[];

  // Comparison State & Actions
  compareItems: CompareItemState[];
  addCompareSymbol: (symbol: string) => void;
  removeCompareSymbol: (symbol: string) => void;
  toggleCompareVisibility: (symbol: string) => void;
  setAllCompareVisibility: (visible: boolean) => void;
  applyCategoryPreset: (category: 'crypto' | 'stock' | 'etf' | 'all') => void;
  clearCompare: () => void;
}

const DEFAULT_COMPARE_LIST: CompareItemState[] = [
  { symbol: 'BTCUSDT', color: OVERLAY_LINE_COLORS[0], visible: true },
  { symbol: 'ETHUSDT', color: OVERLAY_LINE_COLORS[1], visible: true },
  { symbol: 'MARAUSDT', color: OVERLAY_LINE_COLORS[2], visible: true },
  { symbol: 'BITOUSDT', color: OVERLAY_LINE_COLORS[3], visible: true },
];

const MarketContext = createContext<MarketContextType | null>(null);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Active Asset & Navigation
  const [activeSymbol, setActiveSymbolState] = useState<string>('BTCUSDT');
  const [category] = useState<BybitCategory>('linear');
  const [timeframe, setTimeframe] = useState<Timeframe>('1');
  const [activeTab, setActiveTab] = useState<ActiveTabMode>('chart');

  // UI Panels
  const [showSubChart, setShowSubChart] = useState<boolean>(true);
  const [subChartHeight, setSubChartHeight] = useState<number>(190);
  const [showWatchlist, setShowWatchlist] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Catalog State
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [activeInstrument, setActiveInstrument] = useState<InstrumentItem | null>(null);
  const [loadingInstruments, setLoadingInstruments] = useState<boolean>(true);

  // Persistent Comparison State
  const [compareItems, setCompareItems] = useState<CompareItemState[]>(() => {
    try {
      const saved = localStorage.getItem('market_compare_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved compare items:', e);
    }
    return DEFAULT_COMPARE_LIST;
  });

  const persistCompareItems = (items: CompareItemState[]) => {
    setCompareItems(items);
    try {
      localStorage.setItem('market_compare_items', JSON.stringify(items));
    } catch (e) {
      console.error('Error persisting compare items:', e);
    }
  };

  // Load instruments catalog
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingInstruments(true);
        const list = await fetchInstruments(category, undefined, undefined, 2000);
        if (isMounted) setInstruments(list);
      } catch (err) {
        console.error('Error loading instruments:', err);
      } finally {
        if (isMounted) setLoadingInstruments(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [category]);

  // Load active instrument detail
  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      const detail = await fetchInstrumentDetail(activeSymbol);
      if (isMounted) setActiveInstrument(detail);
    };
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [activeSymbol]);

  const setActiveSymbol = useCallback((symbol: string) => {
    setActiveSymbolState(symbol.toUpperCase());
    if (activeTab === 'scanner') {
      setActiveTab('chart');
    }
  }, [activeTab]);

  const toggleSubChart = useCallback(() => setShowSubChart((prev) => !prev), []);
  const toggleWatchlist = useCallback(() => setShowWatchlist((prev) => !prev), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  // Filter Catalog Helper
  const filterInstruments = useCallback(
    (query: string, filterType: AssetCategoryFilter): InstrumentItem[] => {
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

  // Comparison Actions
  const addCompareSymbol = useCallback(
    (symbol: string) => {
      const sym = symbol.toUpperCase();
      if (compareItems.some((item) => item.symbol === sym)) {
        // If already in list but hidden, make it visible
        persistCompareItems(
          compareItems.map((item) =>
            item.symbol === sym ? { ...item, visible: true } : item
          )
        );
        return;
      }
      const nextColor =
        OVERLAY_LINE_COLORS[compareItems.length % OVERLAY_LINE_COLORS.length];
      const newItem: CompareItemState = {
        symbol: sym,
        color: nextColor,
        visible: true,
      };
      persistCompareItems([...compareItems, newItem]);
    },
    [compareItems]
  );

  const removeCompareSymbol = useCallback(
    (symbol: string) => {
      persistCompareItems(compareItems.filter((item) => item.symbol !== symbol.toUpperCase()));
    },
    [compareItems]
  );

  const toggleCompareVisibility = useCallback(
    (symbol: string) => {
      persistCompareItems(
        compareItems.map((item) =>
          item.symbol === symbol.toUpperCase()
            ? { ...item, visible: !item.visible }
            : item
        )
      );
    },
    [compareItems]
  );

  const setAllCompareVisibility = useCallback(
    (visible: boolean) => {
      persistCompareItems(compareItems.map((item) => ({ ...item, visible })));
    },
    [compareItems]
  );

  const applyCategoryPreset = useCallback(
    (group: 'crypto' | 'stock' | 'etf' | 'all') => {
      const filtered = instruments.filter((item) => {
        const symType = item.symbol_type?.toLowerCase() || '';
        switch (group) {
          case 'crypto':
            return !symType || symType === 'uncategorized' || symType === 'innovation';
          case 'stock':
            return symType === 'stock';
          case 'etf':
            return symType === 'etf';
          case 'all':
          default:
            return true;
        }
      });

      // Take top 15 symbols for high performance
      const selected = filtered.slice(0, 15).map((inst, index) => ({
        symbol: inst.symbol,
        color: OVERLAY_LINE_COLORS[index % OVERLAY_LINE_COLORS.length],
        visible: true,
      }));

      persistCompareItems(selected);
    },
    [instruments]
  );

  const clearCompare = useCallback(() => {
    persistCompareItems([]);
  }, []);

  const value = useMemo(
    () => ({
      activeSymbol,
      category,
      timeframe,
      activeTab,
      activeInstrument,
      instruments,
      loadingInstruments,

      showSubChart,
      subChartHeight,
      showWatchlist,
      isSearchOpen,

      setActiveSymbol,
      setTimeframe,
      setActiveTab,
      setShowSubChart,
      toggleSubChart,
      setSubChartHeight,
      setShowWatchlist,
      toggleWatchlist,
      openSearch,
      closeSearch,

      filterInstruments,

      compareItems,
      addCompareSymbol,
      removeCompareSymbol,
      toggleCompareVisibility,
      setAllCompareVisibility,
      applyCategoryPreset,
      clearCompare,
    }),
    [
      activeSymbol,
      category,
      timeframe,
      activeTab,
      activeInstrument,
      instruments,
      loadingInstruments,
      showSubChart,
      subChartHeight,
      showWatchlist,
      isSearchOpen,
      setActiveSymbol,
      setTimeframe,
      setActiveTab,
      toggleSubChart,
      toggleWatchlist,
      openSearch,
      closeSearch,
      filterInstruments,
      compareItems,
      addCompareSymbol,
      removeCompareSymbol,
      toggleCompareVisibility,
      setAllCompareVisibility,
      applyCategoryPreset,
      clearCompare,
    ]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

export function useMarket(): MarketContextType {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
