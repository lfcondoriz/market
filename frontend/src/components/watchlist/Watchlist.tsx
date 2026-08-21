import React, { useState } from 'react';
import { Search, Bookmark, X } from 'lucide-react';
import { CATEGORY_FILTERS, type AssetCategoryFilter } from '../../constants/categories';
import type { InstrumentItem } from '../../types';
import { AssetDetailsCard } from './AssetDetailsCard';

interface WatchlistProps {
  instruments: InstrumentItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  activeInstrument: InstrumentItem | null;
  loading: boolean;
  onClose?: () => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  instruments,
  selectedSymbol,
  onSelectSymbol,
  activeInstrument,
  loading,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<AssetCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = instruments.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.symbol.toLowerCase().includes(q) ||
      (item.base_coin && item.base_coin.toLowerCase().includes(q)) ||
      (item.display_name && item.display_name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

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

  return (
    <aside className="watchlist-sidebar">
      <div className="watchlist-header">
        <div className="watchlist-title-row">
          <div className="watchlist-title">
            <Bookmark size={15} color="var(--accent-blue)" />
            <span>Lista de Seguimiento</span>
          </div>
          <div className="watchlist-header-actions">
            <span className="watchlist-count">{filtered.length} activos</span>
            {onClose && (
              <button className="icon-btn" onClick={onClose} title="Ocultar barra lateral">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="watchlist-search-box">
          <Search size={14} color="var(--text-secondary)" />
          <input
            type="text"
            className="watchlist-search-input"
            placeholder="Filtrar activos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter Chips including ETF */}
        <div className="category-filter-chips">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              className={`chip-btn ${filterType === cat.id ? 'active' : ''}`}
              onClick={() => setFilterType(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="watchlist-table-header">
        <span>SÍMBOLO</span>
        <span className="text-right">TIPO</span>
        <span className="text-right">CAT</span>
      </div>

      {/* Symbol List */}
      <div className="watchlist-list">
        {loading ? (
          <div className="state-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-message">No se encontraron activos</div>
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
                  <span className={`badge-type-label ${item.symbol_type ? item.symbol_type.toLowerCase() : ''}`}>
                    {item.symbol_type || 'Crypto'}
                  </span>
                </div>

                <div className="col-change">
                  <span className="badge-tag badge-cat">{item.category}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Selected Asset Details */}
      <AssetDetailsCard instrument={activeInstrument} currentSymbol={selectedSymbol} />
    </aside>
  );
};
