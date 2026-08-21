export type AssetCategoryFilter = 'all' | 'crypto' | 'stock' | 'etf' | 'commodity';

export interface CategoryFilterOption {
  id: AssetCategoryFilter;
  label: string;
  badgeColor?: string;
}

export const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { id: 'all', label: 'Todos' },
  { id: 'crypto', label: 'Crypto', badgeColor: 'var(--accent-blue)' },
  { id: 'stock', label: 'Stocks', badgeColor: 'var(--accent-cyan)' },
  { id: 'etf', label: 'ETFs', badgeColor: 'var(--accent-purple)' },
  { id: 'commodity', label: 'Commodities', badgeColor: 'var(--accent-amber)' },
];
