import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchMarketSummary } from '../../services/api';
import { formatFundingPct } from '../../utils/formatters';
import type { MarketSummaryResponse } from '../../types';

interface FundingScannerProps {
  onSelectSymbol: (symbol: string) => void;
}

export const FundingScanner: React.FC<FundingScannerProps> = ({ onSelectSymbol }) => {
  const [summary, setSummary] = useState<MarketSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMarketSummary('linear');
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando resumen de funding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="scanner-workspace">
      <div className="scanner-container">
        {/* Header */}
        <div className="scanner-header-row">
          <div>
            <h2 className="scanner-title">
              Funding Rates Screener & Market Opportunities
            </h2>
            <p className="scanner-subtitle">
              Comparativa de tasas de fondeo anualizadas (APR) en contratos lineales de Bybit (Crypto, Stocks, ETFs).
            </p>
          </div>

          <button className="chip-btn active" onClick={loadData} title="Actualizar datos">
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        {error ? (
          <div className="scanner-error-card">{error}</div>
        ) : loading || !summary ? (
          <div className="state-center" style={{ minHeight: '320px' }}>
            <div className="spinner" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Analizando tasas de mercado...
            </span>
          </div>
        ) : (
          <div className="scanner-grid">
            {/* Top Positive Rates Card */}
            <div className="scanner-card">
              <div className="scanner-card-header">
                <div className="scanner-card-icon icon-bull">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="scanner-card-title">
                    Mayores Tasas Positivas (Longs pagan a Shorts)
                  </h3>
                  <span className="scanner-card-desc">
                    Oportunidades para estrategias de *Carry Trade* / Fondeo
                  </span>
                </div>
              </div>

              <div className="scanner-table">
                <div className="scanner-table-header">
                  <span>SÍMBOLO</span>
                  <span className="text-right">TASA 8H</span>
                  <span className="text-right">APR % EST.</span>
                  <span></span>
                </div>

                {summary.top_positive.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item.symbol)}
                    className="scanner-table-row"
                  >
                    <span className="scanner-row-symbol">{item.symbol}</span>
                    <span className="scanner-row-rate price-up">
                      {formatFundingPct(item.latest_funding_rate_pct)}
                    </span>
                    <span className="scanner-row-apr price-up">
                      +{item.annualized_apr_pct.toFixed(2)}%
                    </span>
                    <div className="scanner-row-action">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Negative Rates Card */}
            <div className="scanner-card">
              <div className="scanner-card-header">
                <div className="scanner-card-icon icon-bear">
                  <TrendingDown size={16} />
                </div>
                <div>
                  <h3 className="scanner-card-title">
                    Mayores Tasas Negativas (Shorts pagan a Longs)
                  </h3>
                  <span className="scanner-card-desc">
                    Mercados con fuerte presión bajista en derivados
                  </span>
                </div>
              </div>

              <div className="scanner-table">
                <div className="scanner-table-header">
                  <span>SÍMBOLO</span>
                  <span className="text-right">TASA 8H</span>
                  <span className="text-right">APR % EST.</span>
                  <span></span>
                </div>

                {summary.top_negative.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item.symbol)}
                    className="scanner-table-row"
                  >
                    <span className="scanner-row-symbol">{item.symbol}</span>
                    <span className="scanner-row-rate price-down">
                      {formatFundingPct(item.latest_funding_rate_pct)}
                    </span>
                    <span className="scanner-row-apr price-down">
                      {item.annualized_apr_pct.toFixed(2)}%
                    </span>
                    <div className="scanner-row-action">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
