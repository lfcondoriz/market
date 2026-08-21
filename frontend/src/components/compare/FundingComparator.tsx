import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  createSeriesMarkers,
  LineSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { Plus, X, LineChart, Calendar } from 'lucide-react';
import { useMultiFundingRates } from '../../hooks/useMultiFundingRates';
import { formatFundingPct, isWeekendTimestamp } from '../../utils/formatters';
import type { InstrumentItem } from '../../types';

interface FundingComparatorProps {
  instruments: InstrumentItem[];
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
  onSelectSymbolForChart: (symbol: string) => void;
}

export const FundingComparator: React.FC<FundingComparatorProps> = ({
  instruments,
  selectedSymbols,
  onSymbolsChange,
}) => {
  const [searchPicker, setSearchPicker] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [showWeekendDots, setShowWeekendDots] = useState<boolean>(true);

  const { seriesList, loading } = useMultiFundingRates(selectedSymbols, 'linear');

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const markersMapRef = useRef<Map<string, any>>(new Map());

  // Initialize Multi-Line Chart
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
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

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
      lineSeriesMapRef.current.clear();
      markersMapRef.current.clear();
    };
  }, []);

  // Update Series when multi-funding data or weekend toggle updates
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const currentMap = lineSeriesMapRef.current;
    const currentMarkersMap = markersMapRef.current;

    // 1. Remove series that are no longer in selectedSymbols
    const activeSet = new Set(selectedSymbols);
    for (const [sym, series] of currentMap.entries()) {
      if (!activeSet.has(sym)) {
        chart.removeSeries(series);
        currentMap.delete(sym);
        currentMarkersMap.delete(sym);
      }
    }

    // 2. Add or update series for each selected item
    seriesList.forEach((item) => {
      let series = currentMap.get(item.symbol);
      let markers = currentMarkersMap.get(item.symbol);

      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: item.color,
          lineWidth: 2,
          priceFormat: {
            type: 'custom',
            formatter: (val: number) => `${val.toFixed(4)}%`,
          },
        });
        markers = createSeriesMarkers(series);
        currentMap.set(item.symbol, series);
        currentMarkersMap.set(item.symbol, markers);
      }

      const formattedData = item.data.map((d) => ({
        time: d.time as any,
        value: d.funding_rate_percentage,
      }));

      series.setData(formattedData);

      // Clean, un-cluttered Weekend Markers (Orange dots on weekend data points)
      if (showWeekendDots && item.data.length > 0 && markers) {
        const weekendMarkers = item.data
          .filter((d) => isWeekendTimestamp(d.time))
          .map((d) => ({
            time: d.time as any,
            position: 'inBar' as const,
            shape: 'circle' as const,
            color: '#ff9800',
            size: 1,
          }));
        markers.setMarkers(weekendMarkers);
      } else if (markers) {
        markers.setMarkers([]);
      }
    });

    chart.timeScale().fitContent();
  }, [seriesList, selectedSymbols, showWeekendDots]);

  const handleAddSymbol = (symbol: string) => {
    if (!selectedSymbols.includes(symbol)) {
      onSymbolsChange([...selectedSymbols, symbol]);
    }
    setIsPickerOpen(false);
    setSearchPicker('');
  };

  const handleRemoveSymbol = (symbol: string) => {
    onSymbolsChange(selectedSymbols.filter((s) => s !== symbol));
  };

  const availableInstruments = instruments
    .filter(
      (inst) =>
        !selectedSymbols.includes(inst.symbol) &&
        (inst.symbol.toLowerCase().includes(searchPicker.toLowerCase()) ||
          (inst.display_name && inst.display_name.toLowerCase().includes(searchPicker.toLowerCase())))
    )
    .slice(0, 20);

  return (
    <div className="compare-workspace">
      {/* Top Controls & Legend Bar */}
      <div className="compare-header">
        <div className="compare-title-row">
          <div className="compare-title">
            <LineChart size={16} color="var(--accent-blue)" />
            <span>Comparador Superpuesto de Funding Rates</span>
          </div>

          <div className="compare-actions">
            {/* Toggle Weekend Dot Markers */}
            <button
              className={`chip-btn ${showWeekendDots ? 'active' : ''}`}
              onClick={() => setShowWeekendDots((prev) => !prev)}
              title="Resaltar registros de fin de semana con puntos ámbar discretos (Sábado y Domingo)"
            >
              <Calendar size={13} />
              <span>Fines de Semana (● Naranja)</span>
            </button>

            {/* Add symbol picker trigger */}
            <div className="picker-wrapper">
              <button
                className="chip-btn active"
                onClick={() => setIsPickerOpen((prev) => !prev)}
                title="Agregar activo a la comparación"
              >
                <Plus size={14} />
                <span>Agregar Activo</span>
              </button>

              {isPickerOpen && (
                <div className="picker-dropdown">
                  <input
                    type="text"
                    className="picker-search-input"
                    placeholder="Buscar activo (ej. BTC, ARKK, AAL)..."
                    value={searchPicker}
                    onChange={(e) => setSearchPicker(e.target.value)}
                    autoFocus
                  />
                  <div className="picker-list">
                    {availableInstruments.length === 0 ? (
                      <div className="picker-empty">No se encontraron activos</div>
                    ) : (
                      availableInstruments.map((inst) => (
                        <div
                          key={inst.symbol}
                          className="picker-item"
                          onClick={() => handleAddSymbol(inst.symbol)}
                        >
                          <span className="picker-item-sym">{inst.symbol}</span>
                          <span className={`badge-type-label ${inst.symbol_type ? inst.symbol_type.toLowerCase() : ''}`}>
                            {inst.symbol_type || 'Crypto'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Asset Legend Chips */}
        <div className="compare-legend-chips">
          {seriesList.map((item) => (
            <div
              key={item.symbol}
              className="compare-legend-card"
              style={{ borderLeft: `3px solid ${item.color}` }}
            >
              <div className="legend-sym-row">
                <span className="legend-sym-name">{item.symbol}</span>
                <button
                  className="legend-remove-btn"
                  onClick={() => handleRemoveSymbol(item.symbol)}
                  title="Quitar activo de la comparación"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="legend-stats-row">
                <span
                  className="legend-pct"
                  style={{
                    color: (item.latestPct || 0) >= 0 ? 'var(--bull-green)' : 'var(--bear-red)',
                  }}
                >
                  {formatFundingPct(item.latestPct)}
                </span>
                <span className="legend-apr">
                  APR: {(item.latestApr || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="compare-chart-container">
        {loading && (
          <div className="chart-loading-overlay">
            <div className="spinner" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Superponiendo curvas de funding...
            </span>
          </div>
        )}

        <div ref={containerRef} className="chart-canvas" />
      </div>
    </div>
  );
};
