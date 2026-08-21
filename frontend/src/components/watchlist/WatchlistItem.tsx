import React from 'react';
import { Plus } from 'lucide-react';
import type { InstrumentItem } from '../../types';

interface WatchlistItemProps {
  item: InstrumentItem;
  isActive: boolean;
  onSelect: (symbol: string) => void;
  onAddToCompare?: (symbol: string) => void;
}

export const WatchlistItem: React.FC<WatchlistItemProps> = ({
  item,
  isActive,
  onSelect,
  onAddToCompare,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/market-symbol', item.symbol);
    e.dataTransfer.setData('text/plain', item.symbol);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <div
      className={`watchlist-row ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(item.symbol)}
      draggable
      onDragStart={handleDragStart}
      title={`Arrastra ${item.symbol} hacia el gráfico o comparador`}
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
        {onAddToCompare ? (
          <button
            className="watchlist-add-compare-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCompare(item.symbol);
            }}
            title={`Agregar ${item.symbol} al Comparador de Funding`}
          >
            <Plus size={12} />
          </button>
        ) : (
          <span className="badge-tag badge-cat">{item.category}</span>
        )}
      </div>
    </div>
  );
};
