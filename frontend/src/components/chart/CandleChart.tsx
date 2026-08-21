import React, { useEffect, useRef, useState } from 'react';
import {
  CandlestickSeries,
  HistogramSeries,
  type ISeriesApi,
  type LogicalRange,
} from 'lightweight-charts';
import { AlertCircle } from 'lucide-react';
import { useLightweightChart } from '../../hooks/useLightweightChart';
import { useMarket } from '../../context/MarketContext';
import { formatPrice, formatCompactVolume } from '../../utils/formatters';
import type { KlinePoint } from '../../types';

interface CandleChartProps {
  data: KlinePoint[];
  loading: boolean;
  onLogicalRangeChange?: (range: LogicalRange | null) => void;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  data,
  loading,
  onLogicalRangeChange,
}) => {
  const { activeSymbol, category, timeframe, setActiveSymbol } = useMarket();
  const [isDragOver, setIsDragOver] = useState(false);

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

  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const { containerRef, chartRef, isReady, fitContent } = useLightweightChart({
    customOptions: {
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.2 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
      },
    },
    onLogicalRangeChange,
  });

  // Attach Candlestick & Volume series when chart is ready
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !isReady) return;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#f23645',
      borderVisible: false,
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) return;

      const cData = param.seriesData.get(candleSeries) as {
        open: number;
        high: number;
        low: number;
        close: number;
      } | undefined;

      const vData = param.seriesData.get(volumeSeries) as { value: number } | undefined;

      if (cData) {
        const change = cData.close - cData.open;
        const changePct = cData.open !== 0 ? (change / cData.open) * 100 : 0;
        setLegendData({
          open: cData.open,
          high: cData.high,
          low: cData.low,
          close: cData.close,
          volume: vData?.value || 0,
          change,
          changePct,
        });
      }
    });

    return () => {
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [isReady]);

  // Update Data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    if (!data || data.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      setLegendData(null);
      return;
    }

    const formattedCandles = data.map((d) => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const formattedVolume = data.map((d) => ({
      time: d.time as any,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(8, 153, 129, 0.45)' : 'rgba(242, 54, 69, 0.45)',
    }));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current.setData(formattedVolume);

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

    fitContent();
  }, [data, fitContent]);

  // Drag and Drop Handling (Dropping an asset onto the chart switches the symbol)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedSymbol =
      e.dataTransfer.getData('application/market-symbol') ||
      e.dataTransfer.getData('text/plain');
    if (droppedSymbol) {
      setActiveSymbol(droppedSymbol.trim());
    }
  };

  return (
    <div
      className={`chart-viewport-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Floating TradingView-style Legend */}
      <div className="chart-legend">
        <div className="legend-title">
          <span className="legend-symbol">{activeSymbol}</span>
          <span className="legend-desc">{timeframe} • Bybit</span>
        </div>

        {legendData && (
          <div className="legend-ohlc">
            <span className="ohlc-item">
              O: <span className="ohlc-val">{formatPrice(legendData.open)}</span>
            </span>
            <span className="ohlc-item">
              H: <span className="ohlc-val">{formatPrice(legendData.high)}</span>
            </span>
            <span className="ohlc-item">
              L: <span className="ohlc-val">{formatPrice(legendData.low)}</span>
            </span>
            <span className="ohlc-item">
              C:{' '}
              <span className={`ohlc-val ${legendData.change >= 0 ? 'price-up' : 'price-down'}`}>
                {formatPrice(legendData.close)}
              </span>
            </span>
            <span className={`ohlc-change ${legendData.change >= 0 ? 'price-up' : 'price-down'}`}>
              {legendData.change >= 0 ? '+' : ''}
              {formatPrice(legendData.change)} ({legendData.changePct.toFixed(2)}%)
            </span>
            <span className="ohlc-item ohlc-vol">
              Vol: <span className="ohlc-val">{formatCompactVolume(legendData.volume)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="chart-loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Drag & Drop Visual Indicator */}
      {isDragOver && (
        <div className="chart-drop-overlay">
          <div className="drop-indicator-badge">Soltar para abrir {activeSymbol}</div>
        </div>
      )}

      {/* Empty Data Banner */}
      {!loading && (!data || data.length === 0) && (
        <div className="empty-chart-banner">
          <AlertCircle size={36} color="var(--accent-amber)" />
          <div className="empty-chart-title">
            No hay velas almacenadas para {activeSymbol} (Intervalo: {timeframe})
          </div>
          <div className="empty-chart-subtitle">
            Para sincronizar este activo en tu base de datos local, ejecuta:
          </div>
          <code className="empty-chart-command">
            uv run market klines --category {category} --symbol {activeSymbol} --interval {timeframe}
          </code>
        </div>
      )}

      {/* Chart Canvas Mount Point */}
      <div ref={containerRef} className="chart-canvas" />
    </div>
  );
};
