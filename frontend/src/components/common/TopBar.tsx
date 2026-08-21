import React from 'react';
import {
  Search,
  CandlestickChart,
  TableProperties,
  LineChart,
  PanelRightClose,
  PanelRightOpen,
  Activity,
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { TIMEFRAME_OPTIONS } from '../../constants/timeframes';

export const TopBar: React.FC = () => {
  const {
    activeSymbol,
    category,
    activeInstrument,
    timeframe,
    setTimeframe,
    activeTab,
    setActiveTab,
    showSubChart,
    toggleSubChart,
    showWatchlist,
    toggleWatchlist,
    openSearch,
  } = useMarket();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Symbol Search Trigger Button */}
        <button className="symbol-button" onClick={openSearch} title="Buscar activo (Ctrl + K)">
          <Search size={15} color="var(--text-secondary)" />
          <span className="symbol-name">{activeSymbol}</span>
          <span className="symbol-category-badge">{category}</span>
          {activeInstrument?.symbol_type && activeInstrument.symbol_type !== 'uncategorized' && (
            <span className={`badge-type-label ${activeInstrument.symbol_type.toLowerCase()}`}>
              {activeInstrument.symbol_type}
            </span>
          )}
        </button>

        <div className="topbar-divider" />

        {/* Timeframe Selector Group (Shown in chart mode) */}
        {activeTab === 'chart' && (
          <div className="timeframe-group">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.value}
                className={`tf-btn ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
                title={tf.description}
              >
                {tf.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'chart' && <div className="topbar-divider" />}

        {/* Indicators / Sub-pane Toggle */}
        {activeTab === 'chart' && (
          <button
            className={`tab-btn ${showSubChart ? 'active' : ''}`}
            onClick={toggleSubChart}
            title="Mostrar / Ocultar Subgráfico de Funding Rate"
          >
            <Activity size={14} color={showSubChart ? 'var(--accent-blue)' : 'var(--text-secondary)'} />
            <span>Funding Rate Subpanel</span>
          </button>
        )}
      </div>

      {/* Center/Right Tabs & Watchlist Toggle */}
      <div className="topbar-right">
        <nav className="topbar-tabs">
          <button
            className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            <CandlestickChart size={14} />
            <span>Gráfico</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
            title="Superponer y comparar Funding Rates entre varios activos"
          >
            <LineChart size={14} />
            <span>Comparador Funding</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
            title="Escáner de oportunidades de Funding Rate y APR"
          >
            <TableProperties size={14} />
            <span>Funding Scanner</span>
          </button>
        </nav>

        <button
          onClick={toggleWatchlist}
          className={`tab-btn ${showWatchlist ? 'active' : ''}`}
          title={showWatchlist ? 'Ocultar Watchlist' : 'Mostrar Watchlist'}
        >
          {showWatchlist ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          <span>Watchlist</span>
        </button>
      </div>
    </header>
  );
};
