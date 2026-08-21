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
import {
  Plus,
  X,
  LineChart,
  Calendar,
  Eye,
  EyeOff,
  Layers,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { useMultiFundingRates } from '../../hooks/useMultiFundingRates';
import { formatFundingPct, isWeekendTimestamp } from '../../utils/formatters';

export const FundingComparator: React.FC = () => {
  const {
    compareItems,
    focusedSymbol,
    setFocusedSymbol,
    addCompareSymbol,
    removeCompareSymbol,
    toggleCompareVisibility,
    setAllCompareVisibility,
    applyCategoryPreset,
    clearCompare,
    filterInstruments,
  } = useMarket();

  const [searchPicker, setSearchPicker] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [showWeekendDots, setShowWeekendDots] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const { seriesList, loading } = useMultiFundingRates(compareItems, 'linear');

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
        scaleMargins: { top: 0.1, bottom: 0.1 },
        autoScale: true,
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

  // Update Series when multi-funding data, visibility, focus, or weekend toggle updates
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const currentMap = lineSeriesMapRef.current;
    const currentMarkersMap = markersMapRef.current;

    // 1. Remove series that are no longer in compareItems
    const activeSymbols = new Set(compareItems.map((i) => i.symbol));
    for (const [sym, series] of currentMap.entries()) {
      if (!activeSymbols.has(sym)) {
        chart.removeSeries(series);
        currentMap.delete(sym);
        currentMarkersMap.delete(sym);
      }
    }

    // 2. Add or update series for each item
    seriesList.forEach((item) => {
      let series = currentMap.get(item.symbol);
      let markers = currentMarkersMap.get(item.symbol);

      const isFocused = focusedSymbol === item.symbol;

      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: item.color,
          lineWidth: isFocused ? 4 : 2,
          priceFormat: {
            type: 'custom',
            formatter: (val: number) => `${val.toFixed(4)}%`,
          },
        });
        markers = createSeriesMarkers(series);
        currentMap.set(item.symbol, series);
        currentMarkersMap.set(item.symbol, markers);
      }

      // Dynamic Visibility and Line Thickness Toggle based on Focus
      series.applyOptions({
        visible: item.visible,
        color: item.color,
        lineWidth: isFocused ? 4 : 2,
      });

      const formattedData = item.data.map((d) => ({
        time: d.time as any,
        value: d.funding_rate_percentage,
      }));

      series.setData(formattedData);

      // Clean Weekend Markers (matching each curve's color)
      if (item.visible && showWeekendDots && item.data.length > 0 && markers) {
        const weekendMarkers = item.data
          .filter((d) => isWeekendTimestamp(d.time))
          .map((d) => ({
            time: d.time as any,
            position: 'inBar' as const,
            shape: 'circle' as const,
            color: item.color,
            size: isFocused ? 2 : 1,
          }));
        markers.setMarkers(weekendMarkers);
      } else if (markers) {
        markers.setMarkers([]);
      }
    });

    chart.timeScale().fitContent();
  }, [seriesList, compareItems, focusedSymbol, showWeekendDots]);

  // Drag and Drop (Dropping an asset into the comparator adds it)
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
      addCompareSymbol(droppedSymbol.trim());
    }
  };

  const availableInstruments = filterInstruments(searchPicker, 'all')
    .filter((inst) => !compareItems.some((i) => i.symbol === inst.symbol))
    .slice(0, 20);

  const allVisible = compareItems.length > 0 && compareItems.every((i) => i.visible);

  return (
    <div
      className={`compare-workspace ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Controls & Legend Bar */}
      <div className="compare-header">
        <div className="compare-title-row">
          <div className="compare-title">
            <LineChart size={16} color="var(--accent-blue)" />
            <span>
              {compareItems.length === 1
                ? `Funding Rate (${compareItems[0].symbol})`
                : `Comparativa de Funding (${compareItems.length} activos superpuestos)`}
            </span>
            {compareItems.length > 1 && focusedSymbol && (
              <span className="focused-symbol-badge">
                <Sparkles size={11} />
                <span>Enfocado: {focusedSymbol}</span>
              </span>
            )}
          </div>

          <div className="compare-actions">
            {/* Presets dropdown / group */}
            <div className="preset-group">
              <span className="preset-label">Presets:</span>
              <button
                className="chip-btn"
                onClick={() => applyCategoryPreset('crypto')}
                title="Cargar principales criptomonedas"
              >
                Top Crypto
              </button>
              <button
                className="chip-btn"
                onClick={() => applyCategoryPreset('etf')}
                title="Cargar todos los ETFs"
              >
                Todos los ETFs
              </button>
              <button
                className="chip-btn"
                onClick={() => applyCategoryPreset('stock')}
                title="Cargar acciones (Stocks)"
              >
                Stocks
              </button>
            </div>

            {/* Mass visibility toggles */}
            <button
              className="chip-btn"
              onClick={() => setAllCompareVisibility(!allVisible)}
              title={allVisible ? 'Ocultar todas las líneas' : 'Mostrar todas las líneas'}
            >
              {allVisible ? <Square size={13} /> : <CheckSquare size={13} />}
              <span>{allVisible ? 'Ocultar Todo' : 'Mostrar Todo'}</span>
            </button>

            {/* Toggle Weekend Dot Markers */}
            <button
              className={`chip-btn ${showWeekendDots ? 'active' : ''}`}
              onClick={() => setShowWeekendDots((prev) => !prev)}
              title="Resaltar registros de fin de semana con puntos del color de cada curva (Sábado y Domingo)"
            >
              <Calendar size={13} />
              <span>Marcadores Fin de Semana (●)</span>
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
                          onClick={() => {
                            addCompareSymbol(inst.symbol);
                            setIsPickerOpen(false);
                            setSearchPicker('');
                          }}
                        >
                          <span className="picker-item-sym">{inst.symbol}</span>
                          <span
                            className={`badge-type-label ${
                              inst.symbol_type ? inst.symbol_type.toLowerCase() : ''
                            }`}
                          >
                            {inst.symbol_type || 'Crypto'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {compareItems.length > 0 && (
              <button
                className="icon-btn"
                onClick={clearCompare}
                title="Limpiar todos los activos de la comparación"
                style={{ padding: '6px' }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Multi-Asset Legend Chips with Visibility Toggles & Focus */}
        <div className="compare-legend-chips">
          {seriesList.map((item) => {
            const isFocused = focusedSymbol === item.symbol;
            return (
              <div
                key={item.symbol}
                className={`compare-legend-card ${!item.visible ? 'dimmed' : ''} ${
                  isFocused ? 'focused' : ''
                }`}
                style={{
                  borderLeft: `3px solid ${item.visible ? item.color : 'var(--text-muted)'}`,
                }}
                onClick={() => setFocusedSymbol(isFocused ? null : item.symbol)}
                title={isFocused ? 'Activo enfocado (clic para desenfocar)' : 'Clic para enfocar esta línea'}
              >
                <div className="legend-sym-row">
                  <div className="legend-sym-info">
                    <button
                      className="legend-eye-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareVisibility(item.symbol);
                      }}
                      title={item.visible ? 'Ocultar curva en el gráfico' : 'Mostrar curva en el gráfico'}
                    >
                      {item.visible ? (
                        <Eye size={13} color={item.color} />
                      ) : (
                        <EyeOff size={13} color="var(--text-muted)" />
                      )}
                    </button>
                    <span
                      className="legend-sym-name"
                      style={{ color: item.visible ? 'var(--text-bright)' : 'var(--text-muted)' }}
                    >
                      {item.symbol}
                    </span>
                    {isFocused && (
                      <span className="focused-indicator-dot" style={{ backgroundColor: item.color }} />
                    )}
                  </div>

                  <button
                    className="legend-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCompareSymbol(item.symbol);
                    }}
                    title="Quitar de la comparativa"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="legend-stats-row">
                  <span
                    className="legend-pct"
                    style={{
                      color: !item.visible
                        ? 'var(--text-muted)'
                        : (item.latestPct || 0) >= 0
                        ? 'var(--bull-green)'
                        : 'var(--bear-red)',
                    }}
                  >
                    {formatFundingPct(item.latestPct)}
                  </span>
                  <span className="legend-apr">
                    APR: {(item.latestApr || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
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

        {isDragOver && (
          <div className="chart-drop-overlay">
            <div className="drop-indicator-badge">
              <Layers size={16} />
              <span>Soltar para superponer activo</span>
            </div>
          </div>
        )}

        <div ref={containerRef} className="chart-canvas" />
      </div>
    </div>
  );
};
