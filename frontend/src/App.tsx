import React from 'react';
import { MarketProvider, useMarket } from './context/MarketContext';
import { TopBar } from './components/common/TopBar';
import { SearchModal } from './components/common/SearchModal';
import { CandleChart } from './components/chart/CandleChart';
import { SubChartPane } from './components/chart/SubChartPane';
import { Watchlist } from './components/watchlist/Watchlist';
import { FundingScanner } from './components/scanner/FundingScanner';
import { FundingComparator } from './components/compare/FundingComparator';
import { useKlines } from './hooks/useKlines';
import { useFundingRates } from './hooks/useFundingRates';

const MainWorkspace: React.FC = () => {
  const {
    activeSymbol,
    timeframe,
    category,
    activeTab,
    showSubChart,
    showWatchlist,
  } = useMarket();

  // Data fetching hooks for active symbol
  const { klines, loading: loadingKlines } = useKlines(activeSymbol, timeframe, category);
  const { fundingRates, loading: loadingFunding } = useFundingRates(
    activeSymbol,
    category,
    showSubChart
  );

  return (
    <div className="app-container">
      {/* Top Header Bar */}
      <TopBar />

      {/* Main Workspace Layout */}
      <div className="workspace-layout">
        {activeTab === 'chart' && (
          <main className="main-chart-area">
            {/* Primary Candlestick Chart with Volume & Drag-and-Drop */}
            <CandleChart data={klines} loading={loadingKlines} />

            {/* Sub-panel: Resizable Funding Rate with Weekend Dot Markers */}
            {showSubChart && (
              <SubChartPane data={fundingRates} loading={loadingFunding} />
            )}
          </main>
        )}

        {/* Multi-Asset Superimposed Funding Comparator */}
        {activeTab === 'compare' && <FundingComparator />}

        {/* Market Screener View */}
        {activeTab === 'scanner' && <FundingScanner />}

        {/* Right Watchlist Sidebar (with ETF support, quick add, & drag-and-drop) */}
        {showWatchlist && <Watchlist />}
      </div>

      {/* Global Quick Search Modal */}
      <SearchModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MarketProvider>
      <MainWorkspace />
    </MarketProvider>
  );
};

export default App;
