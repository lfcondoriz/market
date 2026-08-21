import React, { useEffect, useRef } from 'react';
import {
  createChart,
  AreaSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { X, TrendingUp } from 'lucide-react';
import type { FundingRatePoint } from '../types';

interface SubChartPaneProps {
  symbol: string;
  data: FundingRatePoint[];
  loading: boolean;
  onClose: () => void;
}

export const SubChartPane: React.FC<SubChartPaneProps> = ({
  symbol,
  data,
  loading,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#787b86',
        fontSize: 10,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.25)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.25)' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(8, 153, 129, 0.35)',
      bottomColor: 'rgba(41, 98, 255, 0.02)',
      lineColor: '#2962ff',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (val: number) => `${val.toFixed(4)}%`,
      },
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;

    // Map funding rate percentage values
    const formattedData = data.map((d) => ({
      time: d.time as any,
      value: d.funding_rate_percentage,
    }));

    seriesRef.current.setData(formattedData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  const latestRate = data.length > 0 ? data[data.length - 1] : null;
  const latestPct = latestRate ? latestRate.funding_rate_percentage : 0;
  const aprEstimate = latestPct * 3 * 365;

  return (
    <div className="subpane-container">
      <div className="subpane-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={13} color="var(--accent-blue)" />
          <span>Funding Rate ({symbol})</span>
          {latestRate && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: latestPct >= 0 ? 'var(--bull-green)' : 'var(--bear-red)',
                fontWeight: 600,
              }}
            >
              {latestPct >= 0 ? '+' : ''}
              {latestPct.toFixed(4)}% (Est. APR: {aprEstimate.toFixed(2)}%)
            </span>
          )}
        </div>

        <div className="subpane-actions">
          <button className="subpane-btn" onClick={onClose} title="Cerrar subpanel">
            <X size={14} />
          </button>
        </div>
      </div>

      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(19, 23, 34, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div className="spinner" />
        </div>
      )}

      <div ref={containerRef} className="subpane-canvas" />
    </div>
  );
};
