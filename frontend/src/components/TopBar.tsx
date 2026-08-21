import React from 'react';
import {
  Search,
  CandlestickChart,
  TableProperties,
  PanelRightClose,
  PanelRightOpen,
  Activity,
} from 'lucide-react';
import type { Timeframe } from '../types';

interface TopBarProps {
  currentSymbol: string;
  category: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onOpenSearch: () => void;
  activeTab: 'chart' | 'scanner';
  onTabChange: (tab: 'chart' | 'scanner') => void;
  showSubChart: boolean;
  onToggleSubChart: () => void;
  showWatchlist: boolean;
  onToggleWatchlist: () => void;
}

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentSymbol,
  category,
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
        <button className="symbol-button" onClick={onOpenSearch}>
          <Search size={15} color="var(--text-secondary)" />
          <span>{currentSymbol}</span>
          <span className="symbol-category-badge">{category}</span>
        </button>

        <div className="topbar-divider" />

        {/* Timeframe Selector Group */}
        {activeTab === 'chart' && (
          <div className="timeframe-group">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                className={`tf-btn ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => onTimeframeChange(tf.value)}
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
            style={{ padding: '5px 9px' }}
          >
            <Activity size={14} color={showSubChart ? 'var(--accent-blue)' : 'var(--text-secondary)'} />
            <span>Funding Rate Subpanel</span>
          </button>
        )}
      </div>

      {/* Center/Right Tabs & Watchlist Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="topbar-tabs">
          <button
            className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => onTabChange('chart')}
          >
            <CandlestickChart size={14} />
            <span>Gráfico</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => onTabChange('scanner')}
          >
            <TableProperties size={14} />
            <span>Funding Scanner</span>
          </button>
        </div>

        <button
          onClick={onToggleWatchlist}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title={showWatchlist ? 'Ocultar Watchlist' : 'Mostrar Watchlist'}
        >
          {showWatchlist ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>
    </header>
  );
};
