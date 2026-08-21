import React from 'react';
import type { InstrumentItem } from '../types';

interface AssetDetailsCardProps {
  instrument: InstrumentItem | null;
  currentSymbol: string;
}

export const AssetDetailsCard: React.FC<AssetDetailsCardProps> = ({
  instrument,
  currentSymbol,
}) => {
  return (
    <div className="asset-details-card">
      <div className="card-header-row">
        <span className="card-symbol">{currentSymbol}</span>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '3px',
            backgroundColor: 'rgba(8, 153, 129, 0.15)',
            color: 'var(--bull-green)',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {instrument?.status || 'TRADING'}
        </span>
      </div>

      <div className="card-metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Tipo</span>
          <span className="metric-value">{instrument?.symbol_type || 'Crypto'}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Categoría</span>
          <span className="metric-value">{instrument?.category || 'Linear'}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Moneda Base</span>
          <span className="metric-value">{instrument?.base_coin || '-'}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Cotización</span>
          <span className="metric-value">{instrument?.quote_coin || 'USDT'}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Tick Size</span>
          <span className="metric-value">{instrument?.tick_size || '0.1'}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Fondeo Intervalo</span>
          <span className="metric-value">
            {instrument?.funding_interval ? `${instrument.funding_interval / 60}h` : '8h'}
          </span>
        </div>
      </div>
    </div>
  );
};
