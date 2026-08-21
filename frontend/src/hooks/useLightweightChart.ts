import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  type DeepPartial,
  type ChartOptions,
  type IChartApi,
} from 'lightweight-charts';

export interface UseLightweightChartOptions {
  customOptions?: DeepPartial<ChartOptions>;
  onLogicalRangeChange?: (range: any) => void;
  onCrosshairMove?: (param: any) => void;
}

export function useLightweightChart(options: UseLightweightChartOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Standard TradingView dark theme setup
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#787b86',
        fontSize: 11,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
        autoScale: true,
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      ...options.customOptions,
    });

    chartRef.current = chart;
    setIsReady(true);

    if (options.onCrosshairMove) {
      chart.subscribeCrosshairMove(options.onCrosshairMove);
    }

    if (options.onLogicalRangeChange) {
      chart.timeScale().subscribeVisibleLogicalRangeChange(options.onLogicalRangeChange);
    }

    // Auto-resize observer
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
      setIsReady(false);
    };
  }, []);

  const fitContent = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  return {
    containerRef,
    chartRef,
    isReady,
    fitContent,
  };
}
