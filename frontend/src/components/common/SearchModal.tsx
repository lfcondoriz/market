import React, { useEffect, useRef, useState } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { CATEGORY_FILTERS, type AssetCategoryFilter } from '../../constants/categories';
import { useMarket } from '../../context/MarketContext';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch, setActiveSymbol, filterInstruments } = useMarket();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setCategoryFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = filterInstruments(query, categoryFilter).slice(0, 40);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        setActiveSymbol(filtered[selectedIndex].symbol);
        closeSearch();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={closeSearch}>
      <div
        className="search-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="search-modal-header">
          <Search size={18} color="var(--text-secondary)" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Buscar activo por ticker o nombre (ej. BTC, AAL, MARA, ARKK)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button className="icon-btn" onClick={closeSearch} title="Cerrar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Filter chips inside search modal */}
        <div className="search-modal-categories">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              className={`chip-btn ${categoryFilter === cat.id ? 'active' : ''}`}
              onClick={() => {
                setCategoryFilter(cat.id);
                setSelectedIndex(0);
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="search-modal-results">
          {filtered.length === 0 ? (
            <div className="empty-state-message">
              No se encontraron instrumentos para "{query}"
            </div>
          ) : (
            filtered.map((inst, index) => (
              <div
                key={inst.symbol}
                className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  setActiveSymbol(inst.symbol);
                  closeSearch();
                }}
              >
                <div className="search-item-info">
                  <div className="search-item-icon">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div className="search-item-symbol">{inst.symbol}</div>
                    <div className="search-item-name">
                      {inst.display_name || `${inst.base_coin} / ${inst.quote_coin}`}
                    </div>
                  </div>
                </div>

                <div className="search-item-tags">
                  {inst.symbol_type && (
                    <span className={`badge-type-label ${inst.symbol_type.toLowerCase()}`}>
                      {inst.symbol_type}
                    </span>
                  )}
                  <span className="badge-tag badge-cat">{inst.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
