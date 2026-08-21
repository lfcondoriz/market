import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  AreaSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { X, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import type { FundingRatePoint } from '../types';

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
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const prevHeightRef = useRef(height);

  // Resize Drag Handling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startY = e.clientY;
      const startHeight = height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = startY - moveEvent.clientY; // Dragging UP increases height
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

  // Touch Support for Mobile / Touchscreens
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

  // Double Click handle to reset height
  const handleDoubleClick = () => {
    if (onHeightChange) {
      onHeightChange(DEFAULT_HEIGHT);
    }
  };

  // 1-Click Expand / Minimize Toggle
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

  // Initialize Lightweight Chart
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

  // Update Data
  useEffect(() => {
    if (!seriesRef.current) return;

    if (!data || data.length === 0) {
      seriesRef.current.setData([]);
      return;
    }

    const formattedData = data.map((d) => ({
      time: d.time as any,
      value: d.funding_rate_percentage,
    }));

    seriesRef.current.setData(formattedData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

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
