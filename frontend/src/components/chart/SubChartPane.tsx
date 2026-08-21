import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  AreaSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { X, TrendingUp, Maximize2, Minimize2, Calendar } from 'lucide-react';
import { isWeekendTimestamp, formatFundingPct } from '../../utils/formatters';
import type { FundingRatePoint } from '../../types';

interface SubChartPaneProps {
  symbol: string;
  data: FundingRatePoint[];
  loading: boolean;
  onClose: () => void;
  height?: number;
  onHeightChange?: (height: number) => void;
}

const DEFAULT_HEIGHT = 190;
const MIN_HEIGHT = 90;

export const SubChartPane: React.FC<SubChartPaneProps> = ({
  symbol,
  data,
  loading,
  onClose,
  height = DEFAULT_HEIGHT,
  onHeightChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlightWeekends, setHighlightWeekends] = useState(true);
  const prevHeightRef = useRef(height);

  // Resize Drag Handling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startY = e.clientY;
      const startHeight = height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = startY - moveEvent.clientY;
        const maxHeight = window.innerHeight * 0.75;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeight + deltaY));
        if (onHeightChange) {
          onHeightChange(newHeight);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [height, onHeightChange]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const startY = e.touches[0].clientY;
      const startHeight = height;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        const deltaY = startY - moveEvent.touches[0].clientY;
        const maxHeight = window.innerHeight * 0.75;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startHeight + deltaY));
        if (onHeightChange) {
          onHeightChange(newHeight);
        }
      };

      const handleTouchEnd = () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };

      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    },
    [height, onHeightChange]
  );

  const handleDoubleClick = () => {
    if (onHeightChange) {
      onHeightChange(DEFAULT_HEIGHT);
    }
  };

  const toggleExpand = () => {
    if (!onHeightChange) return;
    if (isExpanded) {
      onHeightChange(prevHeightRef.current || DEFAULT_HEIGHT);
      setIsExpanded(false);
    } else {
      prevHeightRef.current = height;
      onHeightChange(Math.min(window.innerHeight * 0.5, 360));
      setIsExpanded(true);
    }
  };

  // Initialize Chart
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

    // Main continuous line/area series
    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(41, 98, 255, 0.25)',
      bottomColor: 'rgba(41, 98, 255, 0.01)',
      lineColor: '#2962ff',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (val: number) => `${val.toFixed(4)}%`,
      },
    });

    // Histogram series for weekend / weekday color bars
    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'custom',
        formatter: (val: number) => `${val.toFixed(4)}%`,
      },
    });

    chartRef.current = chart;
    areaSeriesRef.current = areaSeries;
    histogramSeriesRef.current = histogramSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height: currentH } = entries[0].contentRect;
      chart.applyOptions({ width, height: currentH });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update Data & Weekend Highlight Colors
  useEffect(() => {
    if (!areaSeriesRef.current || !histogramSeriesRef.current) return;

    if (!data || data.length === 0) {
      areaSeriesRef.current.setData([]);
      histogramSeriesRef.current.setData([]);
      return;
    }

    const areaData = data.map((d) => ({
      time: d.time as any,
      value: d.funding_rate_percentage,
    }));

    areaSeriesRef.current.setData(areaData);

    if (highlightWeekends) {
      // Color-code bars: Amber/Orange for weekend (Sat/Sun), Blue/Green/Red for weekdays
      const barData = data.map((d) => {
        const isWeekend = isWeekendTimestamp(d.time);
        let barColor = 'rgba(41, 98, 255, 0.4)'; // Weekday standard blue

        if (isWeekend) {
          barColor = 'rgba(255, 152, 0, 0.85)'; // Weekend Amber highlight
        } else if (d.funding_rate_percentage > 0.05) {
          barColor = 'rgba(8, 153, 129, 0.6)'; // High positive green
        } else if (d.funding_rate_percentage < -0.05) {
          barColor = 'rgba(242, 54, 69, 0.6)'; // High negative red
        }

        return {
          time: d.time as any,
          value: d.funding_rate_percentage,
          color: barColor,
        };
      });

      histogramSeriesRef.current.setData(barData);
    } else {
      histogramSeriesRef.current.setData([]);
    }

    chartRef.current?.timeScale().fitContent();
  }, [data, highlightWeekends]);

  const latestRate = data && data.length > 0 ? data[data.length - 1] : null;
  const latestPct = latestRate ? latestRate.funding_rate_percentage : 0;
  const aprEstimate = latestPct * 3 * 365;

  return (
    <div
      className="subpane-container"
      style={{ height: `${height}px`, minHeight: `${MIN_HEIGHT}px` }}
    >
      {/* Draggable Splitter Handle */}
      <div
        className={`subpane-resize-handle ${isDragging ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        title="Arrastra arriba/abajo para cambiar el tamaño (Doble clic para reiniciar)"
      >
        <div className="subpane-resize-handle-grip" />
      </div>

      {/* Subpane Toolbar Header */}
      <div className="subpane-header">
        <div className="subpane-title-group">
          <TrendingUp size={13} color="var(--accent-blue)" />
          <span className="subpane-title">Funding Rate ({symbol})</span>
          {latestRate && (
            <span
              className={`subpane-rate-badge ${latestPct >= 0 ? 'price-up' : 'price-down'}`}
            >
              {formatFundingPct(latestPct)} (Est. APR: {aprEstimate.toFixed(2)}%)
            </span>
          )}
        </div>

        <div className="subpane-actions">
          {/* Toggle Weekend Coloring */}
          <button
            className={`subpane-pill-btn ${highlightWeekends ? 'active' : ''}`}
            onClick={() => setHighlightWeekends((prev) => !prev)}
            title="Diferenciar tasas de fines de semana (Sábado y Domingo en Naranja)"
          >
            <Calendar size={12} />
            <span>Fines de Semana</span>
          </button>

          <button
            className="subpane-btn"
            onClick={toggleExpand}
            title={isExpanded ? 'Restaurar tamaño' : 'Maximizar panel'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button className="subpane-btn" onClick={onClose} title="Cerrar subpanel">
            <X size={14} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="chart-loading-overlay">
          <div className="spinner" />
        </div>
      )}

      <div ref={containerRef} className="subpane-canvas" />
    </div>
  );
};
