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
import { TIMEFRAME_OPTIONS } from '../../constants/timeframes';
import type { Timeframe } from '../../types';

export type ActiveTabMode = 'chart' | 'compare' | 'scanner';

interface TopBarProps {
  currentSymbol: string;
  category: string;
  symbolType?: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onOpenSearch: () => void;
  activeTab: ActiveTabMode;
  onTabChange: (tab: ActiveTabMode) => void;
  showSubChart: boolean;
  onToggleSubChart: () => void;
  showWatchlist: boolean;
  onToggleWatchlist: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentSymbol,
  category,
  symbolType,
  timeframe,
  onTimeframeChange,
  onOpenSearch,
  activeTab,
  onTabChange,
  showSubChart,
  onToggleSubChart,
  showWatchlist,
  onToggleWatchlist,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Symbol Search Trigger Button */}
        <button className="symbol-button" onClick={onOpenSearch} title="Buscar activo (Ctrl + K)">
          <Search size={15} color="var(--text-secondary)" />
          <span className="symbol-name">{currentSymbol}</span>
          <span className="symbol-category-badge">{category}</span>
          {symbolType && symbolType !== 'uncategorized' && (
            <span className="symbol-type-badge">{symbolType}</span>
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
                onClick={() => onTimeframeChange(tf.value)}
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
            onClick={onToggleSubChart}
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
            onClick={() => onTabChange('chart')}
          >
            <CandlestickChart size={14} />
            <span>Gráfico</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => onTabChange('compare')}
            title="Superponer y comparar Funding Rates entre varios activos"
          >
            <LineChart size={14} />
            <span>Comparador Funding</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => onTabChange('scanner')}
            title="Escaner de oportunidades de Funding Rate y APR"
          >
            <TableProperties size={14} />
            <span>Funding Scanner</span>
          </button>
        </nav>

        <button
          onClick={onToggleWatchlist}
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
