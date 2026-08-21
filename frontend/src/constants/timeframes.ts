import type { Timeframe } from '../types';

export interface TimeframeOption {
  label: string;
  value: Timeframe;
  description: string;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: '1m', value: '1', description: '1 Minuto' },
  { label: '3m', value: '3', description: '3 Minutos' },
  { label: '5m', value: '5', description: '5 Minutos' },
  { label: '15m', value: '15', description: '15 Minutos' },
  { label: '30m', value: '30', description: '30 Minutos' },
  { label: '1h', value: '60', description: '1 Hora' },
  { label: '2h', value: '120', description: '2 Horas' },
  { label: '4h', value: '240', description: '4 Horas' },
  { label: '1D', value: 'D', description: '1 Día' },
  { label: '1W', value: 'W', description: '1 Semana' },
  { label: '1M', value: 'M', description: '1 Mes' },
];

export const DEFAULT_TIMEFRAME: Timeframe = '1';
