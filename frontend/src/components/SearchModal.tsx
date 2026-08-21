import React, { useEffect, useRef, useState } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import type { InstrumentItem } from '../types';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = instruments.filter(
    (inst) =>
      inst.symbol.toLowerCase().includes(query.toLowerCase()) ||
      (inst.base_coin && inst.base_coin.toLowerCase().includes(query.toLowerCase())) ||
      (inst.display_name && inst.display_name.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 30);

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
      <div className="search-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="search-modal-header">
          <Search size={18} color="var(--text-secondary)" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Buscar símbolo (ej. BTC, ETH, AAL, MARA)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="search-modal-results">
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      backgroundColor: 'rgba(41, 98, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-blue)',
                    }}
                  >
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '13px' }}>
                      {inst.symbol}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {inst.display_name || `${inst.base_coin} / ${inst.quote_coin}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {inst.symbol_type && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {inst.symbol_type}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: 3,
                      backgroundColor: 'rgba(41, 98, 255, 0.15)',
                      color: 'var(--accent-blue)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {inst.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
