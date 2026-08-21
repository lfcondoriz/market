import React, { useState } from 'react';
import { Search, Bookmark } from 'lucide-react';
import type { InstrumentItem } from '../types';
import { AssetDetailsCard } from './AssetDetailsCard';

interface WatchlistProps {
  instruments: InstrumentItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  activeInstrument: InstrumentItem | null;
  loading: boolean;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  instruments,
  selectedSymbol,
  onSelectSymbol,
  activeInstrument,
  loading,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'crypto' | 'stock' | 'commodity'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = instruments.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.symbol.toLowerCase().includes(q) ||
      (item.base_coin && item.base_coin.toLowerCase().includes(q)) ||
      (item.display_name && item.display_name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterType === 'crypto') {
      return (
        !item.symbol_type ||
        item.symbol_type === '' ||
        item.symbol_type === 'uncategorized' ||
        item.symbol_type === 'innovation'
      );
    }
    if (filterType === 'stock') {
      return item.symbol_type === 'stock';
    }
    if (filterType === 'commodity') {
      return item.symbol_type === 'commodity';
    }
    return true;
  });

  return (
    <aside className="watchlist-sidebar">
      <div className="watchlist-header">
        <div className="watchlist-title-row">
          <div className="watchlist-title">
            <Bookmark size={15} color="var(--accent-blue)" />
            <span>Lista de Seguimiento</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {filtered.length} activos
          </span>
        </div>

        {/* Search input */}
        <div className="watchlist-search-box">
          <Search size={14} color="var(--text-secondary)" />
          <input
            type="text"
            className="watchlist-search-input"
            placeholder="Filtrar por símbolo (ej. BTC, AAL, MARA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter Chips */}
        <div className="category-filter-chips">
          <button
            className={`chip-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Todos
          </button>
          <button
            className={`chip-btn ${filterType === 'crypto' ? 'active' : ''}`}
            onClick={() => setFilterType('crypto')}
          >
            Crypto
          </button>
          <button
            className={`chip-btn ${filterType === 'stock' ? 'active' : ''}`}
            onClick={() => setFilterType('stock')}
          >
            Stocks
          </button>
          <button
            className={`chip-btn ${filterType === 'commodity' ? 'active' : ''}`}
            onClick={() => setFilterType('commodity')}
          >
            Commodities
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="watchlist-table-header">
        <span>SÍMBOLO</span>
        <span style={{ textAlign: 'right' }}>TIPO</span>
        <span style={{ textAlign: 'right' }}>CAT</span>
      </div>

      {/* Symbol List */}
      <div className="watchlist-list">
        {loading ? (
          <div className="state-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-center" style={{ padding: '20px' }}>
            <span>No se encontraron activos</span>
          </div>
        ) : (
          filtered.map((item) => {
            const isActive = item.symbol === selectedSymbol;
            return (
              <div
                key={item.symbol}
                className={`watchlist-row ${isActive ? 'active' : ''}`}
                onClick={() => onSelectSymbol(item.symbol)}
              >
                <div className="col-symbol">
                  <span className="sym-name">{item.symbol}</span>
                  <span className="sym-type">{item.display_name || item.base_coin}</span>
                </div>

                <div className="col-price">
                  <span
                    style={{
                      fontSize: '11px',
                      color: item.symbol_type === 'stock' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    }}
                  >
                    {item.symbol_type || 'Crypto'}
                  </span>
                </div>

                <div className="col-change">
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 5px',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Selected Asset Details */}
      <AssetDetailsCard
        instrument={activeInstrument}
        currentSymbol={selectedSymbol}
      />
    </aside>
  );
};
