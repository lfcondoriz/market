import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type LogicalRange,
} from 'lightweight-charts';
import { AlertCircle } from 'lucide-react';
import type { KlinePoint, Timeframe } from '../types';

interface CandleChartProps {
  symbol: string;
  category: string;
  timeframe: Timeframe;
  data: KlinePoint[];
  loading: boolean;
  onLogicalRangeChange?: (range: LogicalRange | null) => void;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  symbol,
  category,
  timeframe,
  data,
  loading,
  onLogicalRangeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Floating OHLC Legend State
  const [legendData, setLegendData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePct: number;
  } | null>(null);

  // Initialize Chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#787b86',
        fontSize: 11,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.4)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.4)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
    });

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#f23645',
      borderVisible: false,
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });

    // Volume Histogram Series (overlay at bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Crosshair move handler for floating legend
    chart.subscribeCrosshairMove((param) => {
      if (
        !param ||
        !param.time ||
        !param.seriesData ||
        !candleSeriesRef.current ||
        !volumeSeriesRef.current
      ) {
        return;
      }

      const candleData = param.seriesData.get(candleSeriesRef.current) as {
        open: number;
        high: number;
        low: number;
        close: number;
      } | undefined;

      const volData = param.seriesData.get(volumeSeriesRef.current) as {
        value: number;
      } | undefined;

      if (candleData) {
        const change = candleData.close - candleData.open;
        const changePct = candleData.open !== 0 ? (change / candleData.open) * 100 : 0;
        setLegendData({
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData?.value || 0,
          change,
          changePct,
        });
      }
    });

    // Sync time range if needed
    if (onLogicalRangeChange) {
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        onLogicalRangeChange(range);
      });
    }

    // Resize Observer for fluid responsiveness
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

  // Update Series Data when data prop changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    if (!data || data.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      setLegendData(null);
      return;
    }

    // Format Candlestick Data
    const formattedCandles = data.map((d) => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    // Format Volume Data with dynamic color matching candle
    const formattedVolume = data.map((d) => ({
      time: d.time as any,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(8, 153, 129, 0.45)' : 'rgba(242, 54, 69, 0.45)',
    }));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current.setData(formattedVolume);

    // Default legend to latest candle
    const last = data[data.length - 1];
    if (last) {
      const change = last.close - last.open;
      const changePct = last.open !== 0 ? (change / last.open) * 100 : 0;
      setLegendData({
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
        volume: last.volume,
        change,
        changePct,
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="chart-viewport-container">
      {/* Floating TradingView-style Legend */}
      <div className="chart-legend">
        <div className="legend-title">
          <span className="legend-symbol">{symbol}</span>
          <span className="legend-desc">{timeframe} • Bybit</span>
        </div>

        {legendData && (
          <div className="legend-ohlc">
            <span className="ohlc-item">
              O: <span className="ohlc-val">{legendData.open.toLocaleString()}</span>
            </span>
            <span className="ohlc-item">
              H: <span className="ohlc-val">{legendData.high.toLocaleString()}</span>
            </span>
            <span className="ohlc-item">
              L: <span className="ohlc-val">{legendData.low.toLocaleString()}</span>
            </span>
            <span className="ohlc-item">
              C: <span className={`ohlc-val ${legendData.change >= 0 ? 'price-up' : 'price-down'}`}>
                {legendData.close.toLocaleString()}
              </span>
            </span>
            <span className={`ohlc-change ${legendData.change >= 0 ? 'price-up' : 'price-down'}`}>
              {legendData.change >= 0 ? '+' : ''}
              {legendData.change.toFixed(2)} ({legendData.changePct.toFixed(2)}%)
            </span>
            <span className="ohlc-item" style={{ marginLeft: 8 }}>
              Vol: <span className="ohlc-val">{legendData.volume.toLocaleString()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(19, 23, 34, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
          }}
        >
          <div className="spinner" />
        </div>
      )}

      {/* Empty Data Banner */}
      {!loading && (!data || data.length === 0) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(19, 23, 34, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 14,
            gap: '12px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={36} color="var(--accent-amber)" />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-bright)' }}>
            No hay velas almacenadas para {symbol} (Intervalo: {timeframe})
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            Para descargar este histórico en tu base de datos, ejecuta en la terminal:
          </div>
          <code
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              padding: '8px 16px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--accent-cyan)',
            }}
          >
            uv run market klines --category {category} --symbol {symbol} --interval {timeframe}
          </code>
        </div>
      )}

      {/* Chart Canvas Mount Point */}
      <div ref={containerRef} className="chart-canvas" />
    </div>
  );
};
