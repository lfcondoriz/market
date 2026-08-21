import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  createSeriesMarkers,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
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
  Clock,
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { useMultiFundingRates } from '../../hooks/useMultiFundingRates';
import {
  formatFundingPct,
  formatAprPct,
  formatDateTimeUTC,
  isWeekendTimestamp,
} from '../../utils/formatters';

type ScaleMode = 'nominal' | 'apr';
type TimeRangePreset = '7D' | '30D' | '90D' | '180D' | '1Y' | 'ALL';

const TIME_RANGES: { id: TimeRangePreset; label: string; days: number | null }[] = [
  { id: '7D', label: '7D', days: 7 },
  { id: '30D', label: '30D', days: 30 },
  { id: '90D', label: '90D', days: 90 },
  { id: '180D', label: '180D', days: 180 },
  { id: '1Y', label: '1A', days: 365 },
  { id: 'ALL', label: 'Todo', days: null },
];

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

  // Display & UI state
  const [scaleMode, setScaleMode] = useState<ScaleMode>('nominal');
  const [activeRange, setActiveRange] = useState<TimeRangePreset>('ALL');
  const [searchPicker, setSearchPicker] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [showWeekendDots, setShowWeekendDots] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Crosshair synchronized values state
  const [hoverTimestamp, setHoverTimestamp] = useState<number | null>(null);
  const [hoverValues, setHoverValues] = useState<Map<string, number>>(new Map());

  const { seriesList, loading } = useMultiFundingRates(compareItems, 'linear');

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const markersMapRef = useRef<Map<string, any>>(new Map());
  const zeroBaselineRef = useRef<IPriceLine | null>(null);

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

    // Crosshair Hover Synchronization Listener (#2)
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData || param.point === undefined) {
        setHoverTimestamp(null);
        setHoverValues(new Map());
        return;
      }

      setHoverTimestamp(param.time as number);
      const newHoverMap = new Map<string, number>();

      for (const [sym, series] of lineSeriesMapRef.current.entries()) {
        const pointData = param.seriesData.get(series) as { value: number } | undefined;
        if (pointData !== undefined && pointData.value !== undefined) {
          newHoverMap.set(sym, pointData.value);
        }
      }

      setHoverValues(newHoverMap);
    });

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
      zeroBaselineRef.current = null;
    };
  }, []);

  // Update Series when data, scaleMode, focus, or weekend dots change
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
            formatter: (val: number) =>
              scaleMode === 'apr' ? `${val.toFixed(2)}% APR` : `${val.toFixed(4)}%`,
          },
        });
        markers = createSeriesMarkers(series);
        currentMap.set(item.symbol, series);
        currentMarkersMap.set(item.symbol, markers);
      } else {
        // Update format options when scaleMode changes (#6)
        series.applyOptions({
          visible: item.visible,
          color: item.color,
          lineWidth: isFocused ? 4 : 2,
          priceFormat: {
            type: 'custom',
            formatter: (val: number) =>
              scaleMode === 'apr' ? `${val.toFixed(2)}% APR` : `${val.toFixed(4)}%`,
          },
        });
      }

      // Convert values based on scaleMode (% nominal vs % APR)
      const formattedData = item.data.map((d) => ({
        time: d.time as any,
        value:
          scaleMode === 'apr'
            ? d.funding_rate_percentage * 3 * 365
            : d.funding_rate_percentage,
      }));

      series.setData(formattedData);

      // Weekend Markers matching curve color
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

    // 3. Zero Baseline (0.00%) (#3)
    const activeSeriesList = Array.from(currentMap.values());
    if (activeSeriesList.length > 0 && !zeroBaselineRef.current) {
      zeroBaselineRef.current = activeSeriesList[0].createPriceLine({
        price: 0,
        color: 'rgba(120, 123, 134, 0.45)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '0.00%',
      });
    }

    if (activeRange === 'ALL') {
      chart.timeScale().fitContent();
    }
  }, [seriesList, compareItems, focusedSymbol, showWeekendDots, scaleMode]);

  // Apply Time Range Preset (#4)
  const applyTimeRange = useCallback(
    (rangeId: TimeRangePreset) => {
      setActiveRange(rangeId);
      const chart = chartRef.current;
      if (!chart) return;

      if (rangeId === 'ALL') {
        chart.timeScale().fitContent();
        return;
      }

      const preset = TIME_RANGES.find((r) => r.id === rangeId);
      if (!preset || !preset.days) return;

      // Find highest timestamp across all series
      let maxTime = 0;
      seriesList.forEach((s) => {
        if (s.data && s.data.length > 0) {
          const last = s.data[s.data.length - 1].time;
          if (last > maxTime) maxTime = last;
        }
      });

      if (maxTime === 0) maxTime = Math.floor(Date.now() / 1000);

      const fromTime = maxTime - preset.days * 86400;

      try {
        chart.timeScale().setVisibleRange({
          from: fromTime as any,
          to: maxTime as any,
        });
      } catch (e) {
        console.error('Error applying visible range:', e);
      }
    },
    [seriesList]
  );

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

            {/* Synchronized Hover Date Badge (#2) */}
            {hoverTimestamp ? (
              <span className="hover-time-badge">
                <Clock size={11} />
                <span>{formatDateTimeUTC(hoverTimestamp)}</span>
              </span>
            ) : (
              compareItems.length > 1 &&
              focusedSymbol && (
                <span className="focused-symbol-badge">
                  <Sparkles size={11} />
                  <span>Enfocado: {focusedSymbol}</span>
                </span>
              )
            )}
          </div>

          <div className="compare-actions">
            {/* Quick Time Range Presets (#4) */}
            <div className="range-preset-group">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  className={`range-btn ${activeRange === range.id ? 'active' : ''}`}
                  onClick={() => applyTimeRange(range.id)}
                  title={`Ver histórico de ${range.label}`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div className="topbar-divider" />

            {/* Scale Mode Selector: % Nominal vs % APR (#6) */}
            <div className="scale-mode-toggle">
              <button
                className={`scale-toggle-btn ${scaleMode === 'nominal' ? 'active' : ''}`}
                onClick={() => setScaleMode('nominal')}
                title="Mostrar tasa nominal por intervalo de 8 horas (ej. +0.0100%)"
              >
                % 8h Nominal
              </button>
              <button
                className={`scale-toggle-btn ${scaleMode === 'apr' ? 'active' : ''}`}
                onClick={() => setScaleMode('apr')}
                title="Mostrar tasa anualizada estimada APR (ej. +10.95% APR)"
              >
                % APR Anual
              </button>
            </div>

            <div className="topbar-divider" />

            {/* Category Presets */}
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

            {/* Mass visibility toggle */}
            <button
              className="chip-btn"
              onClick={() => setAllCompareVisibility(!allVisible)}
              title={allVisible ? 'Ocultar todas las líneas' : 'Mostrar todas las líneas'}
            >
              {allVisible ? <Square size={13} /> : <CheckSquare size={13} />}
              <span>{allVisible ? 'Ocultar' : 'Mostrar Todo'}</span>
            </button>

            {/* Toggle Weekend Dot Markers */}
            <button
              className={`chip-btn ${showWeekendDots ? 'active' : ''}`}
              onClick={() => setShowWeekendDots((prev) => !prev)}
              title="Resaltar registros de fin de semana con puntos del color de cada curva (Sábado y Domingo)"
            >
              <Calendar size={13} />
              <span>Fines de Semana (●)</span>
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

        {/* Multi-Asset Legend Chips with Synchronized Hover Values (#2) */}
        <div className="compare-legend-chips">
          {seriesList.map((item) => {
            const isFocused = focusedSymbol === item.symbol;

            // Use synchronized hover value if mouse is over chart (#2)
            const hasHover = hoverTimestamp !== null && hoverValues.has(item.symbol);
            const displayRawValue = hasHover
              ? hoverValues.get(item.symbol)!
              : scaleMode === 'apr'
              ? (item.latestPct || 0) * 3 * 365
              : item.latestPct || 0;

            const displayPct =
              scaleMode === 'apr'
                ? displayRawValue / (3 * 365)
                : displayRawValue;
            const displayApr =
              scaleMode === 'apr'
                ? displayRawValue
                : displayRawValue * 3 * 365;

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
                  {scaleMode === 'nominal' ? (
                    <>
                      <span
                        className="legend-pct"
                        style={{
                          color: !item.visible
                            ? 'var(--text-muted)'
                            : displayPct >= 0
                            ? 'var(--bull-green)'
                            : 'var(--bear-red)',
                        }}
                      >
                        {formatFundingPct(displayPct)}
                      </span>
                      <span className="legend-apr">
                        APR: {displayApr.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className="legend-pct"
                        style={{
                          color: !item.visible
                            ? 'var(--text-muted)'
                            : displayApr >= 0
                            ? 'var(--bull-green)'
                            : 'var(--bear-red)',
                        }}
                      >
                        {formatAprPct(displayApr)}
                      </span>
                      <span className="legend-apr">
                        8h: {formatFundingPct(displayPct)}
                      </span>
                    </>
                  )}
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
              <span>Soltar para superponer y comparar activo</span>
            </div>
          </div>
        )}

        <div ref={containerRef} className="chart-canvas" />
      </div>
    </div>
  );
};
