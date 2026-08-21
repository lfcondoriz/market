import React, { useState } from 'react';
import { Search, Bookmark, X } from 'lucide-react';
import { CATEGORY_FILTERS, type AssetCategoryFilter } from '../../constants/categories';
import { useMarket } from '../../context/MarketContext';
import { WatchlistItem } from './WatchlistItem';
import { AssetDetailsCard } from './AssetDetailsCard';

export const Watchlist: React.FC = () => {
  const {
    activeSymbol,
    activeInstrument,
    setActiveSymbol,
    filterInstruments,
    loadingInstruments,
    toggleWatchlist,
    addCompareSymbol,
  } = useMarket();

  const [filterType, setFilterType] = useState<AssetCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = filterInstruments(searchQuery, filterType);

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
            <button
              className="icon-btn"
              onClick={toggleWatchlist}
              title="Ocultar barra lateral"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="watchlist-search-box">
          <Search size={14} color="var(--text-secondary)" />
          <input
            type="text"
            className="watchlist-search-input"
            placeholder="Filtrar activos (ej. BTC, MARA, ARKK)..."
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
        <span className="text-right">ACCIÓN</span>
      </div>

      {/* Symbol List */}
      <div className="watchlist-list">
        {loadingInstruments ? (
          <div className="state-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-message">No se encontraron activos</div>
        ) : (
          filtered.map((item) => (
            <WatchlistItem
              key={item.symbol}
              item={item}
              isActive={item.symbol === activeSymbol}
              onSelect={setActiveSymbol}
              onAddToCompare={addCompareSymbol}
            />
          ))
        )}
      </div>

      {/* Bottom Selected Asset Details */}
      <AssetDetailsCard instrument={activeInstrument} currentSymbol={activeSymbol} />
    </aside>
  );
};
