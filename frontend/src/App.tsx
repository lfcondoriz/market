import React, { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { SearchModal } from './components/SearchModal';
import { CandleChart } from './components/CandleChart';
import { SubChartPane } from './components/SubChartPane';
import { Watchlist } from './components/Watchlist';
import { FundingScanner } from './components/FundingScanner';
import {
  fetchFundingRateHistory,
  fetchInstrumentDetail,
  fetchInstruments,
  fetchKlines,
} from './services/api';
import type {
  FundingRatePoint,
  InstrumentItem,
  KlinePoint,
  Timeframe,
} from './types';

export const App: React.FC = () => {
  // State
  const [currentSymbol, setCurrentSymbol] = useState<string>('BTCUSDT');
  const [category] = useState<string>('linear');
  const [timeframe, setTimeframe] = useState<Timeframe>('1');
  const [activeTab, setActiveTab] = useState<'chart' | 'scanner'>('chart');
  const [showSubChart, setShowSubChart] = useState<boolean>(true);
  const [showWatchlist, setShowWatchlist] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Data State
  const [instruments, setInstruments] = useState<InstrumentItem[]>([]);
  const [activeInstrument, setActiveInstrument] = useState<InstrumentItem | null>(null);
  const [klines, setKlines] = useState<KlinePoint[]>([]);
  const [fundingRates, setFundingRates] = useState<FundingRatePoint[]>([]);

  // Loading & Error states
  const [loadingKlines, setLoadingKlines] = useState<boolean>(false);
  const [loadingFunding, setLoadingFunding] = useState<boolean>(false);
  const [loadingInstruments, setLoadingInstruments] = useState<boolean>(true);

  // 1. Load instruments catalog on mount
  useEffect(() => {
    const loadInstruments = async () => {
      try {
        setLoadingInstruments(true);
        const list = await fetchInstruments('linear');
        setInstruments(list);
      } catch (err) {
        console.error('Error loading instruments:', err);
      } finally {
        setLoadingInstruments(false);
      }
    };
    loadInstruments();
  }, []);

  // 2. Load active instrument metadata
  useEffect(() => {
    const loadDetail = async () => {
      const detail = await fetchInstrumentDetail(currentSymbol);
      setActiveInstrument(detail);
    };
    loadDetail();
  }, [currentSymbol]);

  // 3. Load Klines for current symbol & timeframe
  useEffect(() => {
    const loadKlines = async () => {
      try {
        setLoadingKlines(true);
        const res = await fetchKlines(currentSymbol, timeframe, 'linear', 1000);
        setKlines(res.data || []);
      } catch (err) {
        console.error(`Error loading klines for ${currentSymbol}:`, err);
        setKlines([]);
      } finally {
        setLoadingKlines(false);
      }
    };
    loadKlines();
  }, [currentSymbol, timeframe]);

  // 4. Load Funding Rate History for sub-chart
  useEffect(() => {
    if (!showSubChart) return;

    const loadFunding = async () => {
      try {
        setLoadingFunding(true);
        const res = await fetchFundingRateHistory(currentSymbol, 'linear', 500);
        setFundingRates(res.data || []);
      } catch (err) {
        console.error(`Error loading funding rates for ${currentSymbol}:`, err);
        setFundingRates([]);
      } finally {
        setLoadingFunding(false);
      }
    };
    loadFunding();
  }, [currentSymbol, showSubChart]);

  const handleSelectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol.toUpperCase());
    if (activeTab === 'scanner') {
      setActiveTab('chart');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header Bar */}
      <TopBar
        currentSymbol={currentSymbol}
        category={category}
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
        {activeTab === 'chart' ? (
          <main className="main-chart-area">
            {/* Primary Candlestick Chart */}
            <CandleChart
              symbol={currentSymbol}
              category={category}
              timeframe={timeframe}
              data={klines}
              loading={loadingKlines}
            />

            {/* Sub-panel: Synchronized Funding Rate Chart */}
            {showSubChart && (
              <SubChartPane
                symbol={currentSymbol}
                data={fundingRates}
                loading={loadingFunding}
                onClose={() => setShowSubChart(false)}
              />
            )}
          </main>
        ) : (
          /* Market Overview / Funding Scanner View */
          <FundingScanner onSelectSymbol={handleSelectSymbol} />
        )}

        {/* Right Watchlist Sidebar */}
        {showWatchlist && (
          <Watchlist
            instruments={instruments}
            selectedSymbol={currentSymbol}
            onSelectSymbol={handleSelectSymbol}
            activeInstrument={activeInstrument}
            loading={loadingInstruments}
          />
        )}
      </div>

      {/* Global Quick Search Modal */}
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
