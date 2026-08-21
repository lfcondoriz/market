import React, { useEffect, useRef, useState } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { CATEGORY_FILTERS, type AssetCategoryFilter } from '../../constants/categories';
import type { InstrumentItem } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
  instruments: InstrumentItem[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSymbol,
  instruments,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategoryFilter('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = instruments
    .filter((inst) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inst.symbol.toLowerCase().includes(q) ||
        (inst.base_coin && inst.base_coin.toLowerCase().includes(q)) ||
        (inst.display_name && inst.display_name.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      const symType = inst.symbol_type?.toLowerCase() || '';
      switch (categoryFilter) {
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
    })
    .slice(0, 40);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelectSymbol(filtered[selectedIndex].symbol);
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
          <button className="icon-btn" onClick={onClose} title="Cerrar (Esc)">
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
                  onSelectSymbol(inst.symbol);
                  onClose();
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
                    <span className="badge-tag badge-type">{inst.symbol_type}</span>
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
