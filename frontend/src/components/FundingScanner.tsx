import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchMarketSummary } from '../services/api';
import type { MarketSummaryResponse } from '../types';

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
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '24px', backgroundColor: 'var(--bg-root)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-bright)' }}>
              Funding Rates Screener & Market Opportunities
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Comparativa de tasas de fondeo anualizadas (APR) en contratos lineales de Bybit.
            </p>
          </div>

          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '8px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '12px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        {error ? (
          <div style={{ padding: '20px', backgroundColor: 'var(--bear-red-bg)', color: 'var(--bear-red)', borderRadius: '6px' }}>
            {error}
          </div>
        ) : loading || !summary ? (
          <div className="state-center" style={{ minHeight: '300px' }}>
            <div className="spinner" />
            <span>Analizando tasas de mercado...</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Top Positive Rates Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    backgroundColor: 'var(--bull-green-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--bull-green)',
                  }}
                >
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                    Mayores Tasas Positivas (Longs pagan a Shorts)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Oportunidades para estrategias de *Carry Trade* / Fondeo
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 100px 40px',
                    padding: '8px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span>SÍMBOLO</span>
                  <span style={{ textAlign: 'right' }}>TASA 8H</span>
                  <span style={{ textAlign: 'right' }}>APR % EST.</span>
                  <span></span>
                </div>

                {summary.top_positive.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item.symbol)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 100px 40px',
                      padding: '10px 8px',
                      borderBottom: '1px solid rgba(42, 46, 57, 0.2)',
                      cursor: 'pointer',
                      alignItems: 'center',
                      transition: 'background-color 0.12s ease',
                    }}
                    className="hover-row"
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{item.symbol}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--bull-green)', fontWeight: 600 }}>
                      +{item.latest_funding_rate_pct.toFixed(4)}%
                    </span>
                    <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--bull-green)', fontWeight: 700 }}>
                      +{item.annualized_apr_pct.toFixed(2)}%
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Negative Rates Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    backgroundColor: 'var(--bear-red-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--bear-red)',
                  }}
                >
                  <TrendingDown size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                    Mayores Tasas Negativas (Shorts pagan a Longs)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Mercados con fuerte presión bajista en derivados
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 100px 40px',
                    padding: '8px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span>SÍMBOLO</span>
                  <span style={{ textAlign: 'right' }}>TASA 8H</span>
                  <span style={{ textAlign: 'right' }}>APR % EST.</span>
                  <span></span>
                </div>

                {summary.top_negative.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item.symbol)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 100px 40px',
                      padding: '10px 8px',
                      borderBottom: '1px solid rgba(42, 46, 57, 0.2)',
                      cursor: 'pointer',
                      alignItems: 'center',
                      transition: 'background-color 0.12s ease',
                    }}
                    className="hover-row"
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{item.symbol}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--bear-red)', fontWeight: 600 }}>
                      {item.latest_funding_rate_pct.toFixed(4)}%
                    </span>
                    <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--bear-red)', fontWeight: 700 }}>
                      {item.annualized_apr_pct.toFixed(2)}%
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
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
