import React, { useState } from 'react';
import { TopBar, type ActiveTabMode } from './components/common/TopBar';
import { SearchModal } from './components/common/SearchModal';
import { CandleChart } from './components/chart/CandleChart';
import { SubChartPane } from './components/chart/SubChartPane';
import { Watchlist } from './components/watchlist/Watchlist';
import { FundingScanner } from './components/scanner/FundingScanner';
import { FundingComparator } from './components/compare/FundingComparator';
import { useInstruments } from './hooks/useInstruments';
import { useKlines } from './hooks/useKlines';
import { useFundingRates } from './hooks/useFundingRates';
import type { Timeframe } from './types';

const DEFAULT_COMPARE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'MARAUSDT', 'BITOUSDT'];

export const App: React.FC = () => {
  // Navigation & Active Symbol State
  const [currentSymbol, setCurrentSymbol] = useState<string>('BTCUSDT');
  const [category] = useState<string>('linear');
  const [timeframe, setTimeframe] = useState<Timeframe>('1');
  const [activeTab, setActiveTab] = useState<ActiveTabMode>('chart');

  // Persistent Comparison Symbols State
  const [compareSymbols, setCompareSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('market_compare_symbols');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading saved compare symbols:', e);
    }
    return DEFAULT_COMPARE_SYMBOLS;
  });

  const handleCompareSymbolsChange = (symbols: string[]) => {
    setCompareSymbols(symbols);
    try {
      localStorage.setItem('market_compare_symbols', JSON.stringify(symbols));
    } catch (e) {
      console.error('Error saving compare symbols:', e);
    }
  };

  // UI Panels State
  const [showSubChart, setShowSubChart] = useState<boolean>(true);
  const [subChartHeight, setSubChartHeight] = useState<number>(190);
  const [showWatchlist, setShowWatchlist] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Custom Hooks for Data Fetching & Lifecycle
  const { instruments, loading: loadingInstruments } = useInstruments('linear');
  const { klines, loading: loadingKlines } = useKlines(currentSymbol, timeframe, 'linear');
  const { fundingRates, loading: loadingFunding } = useFundingRates(
    currentSymbol,
    'linear',
    showSubChart
  );

  // Find active instrument metadata
  const activeInstrument =
    instruments.find((inst) => inst.symbol.toUpperCase() === currentSymbol.toUpperCase()) || null;

  const handleSelectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol.toUpperCase());
    if (activeTab === 'scanner') {
      setActiveTab('chart');
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Header */}
      <TopBar
        currentSymbol={currentSymbol}
        category={category}
        symbolType={activeInstrument?.symbol_type}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onOpenSearch={() => setIsSearchOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showSubChart={showSubChart}
        onToggleSubChart={() => setShowSubChart((prev) => !prev)}
        showWatchlist={showWatchlist}
        onToggleWatchlist={() => setShowWatchlist((prev) => !prev)}
      />

      {/* Main Workspace Layout */}
      <div className="workspace-layout">
        {activeTab === 'chart' && (
          <main className="main-chart-area">
            {/* Primary Candlestick Chart */}
            <CandleChart
              symbol={currentSymbol}
              category={category}
              timeframe={timeframe}
              data={klines}
              loading={loadingKlines}
            />

            {/* Sub-panel: Synchronized Funding Rate Chart (Resizable & Weekend Coloring) */}
            {showSubChart && (
              <SubChartPane
                symbol={currentSymbol}
                data={fundingRates}
                loading={loadingFunding}
                onClose={() => setShowSubChart(false)}
                height={subChartHeight}
                onHeightChange={setSubChartHeight}
              />
            )}
          </main>
        )}

        {activeTab === 'compare' && (
          <FundingComparator
            instruments={instruments}
            selectedSymbols={compareSymbols}
            onSymbolsChange={handleCompareSymbolsChange}
            onSelectSymbolForChart={handleSelectSymbol}
          />
        )}

        {activeTab === 'scanner' && (
          <FundingScanner onSelectSymbol={handleSelectSymbol} />
        )}

        {/* Right Watchlist Sidebar (with ETF support & non-clipping flexbox) */}
        {showWatchlist && (
          <Watchlist
            instruments={instruments}
            selectedSymbol={currentSymbol}
            onSelectSymbol={handleSelectSymbol}
            activeInstrument={activeInstrument}
            loading={loadingInstruments}
            onClose={() => setShowWatchlist(false)}
          />
        )}
      </div>

      {/* Global Quick Search Modal (Ctrl + K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={handleSelectSymbol}
        instruments={instruments}
      />
    </div>
  );
};

export default App;
