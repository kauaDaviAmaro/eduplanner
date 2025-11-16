'use client'

import type { FilterState } from './filters-panel'

interface ActiveFiltersProps {
  filters: FilterState
  onRemoveFilter: (key: keyof FilterState, value?: any) => void
  onClearAll: () => void
  priceRange: { min: number; max: number }
}

export function ActiveFilters({ filters, onRemoveFilter, onClearAll, priceRange }: ActiveFiltersProps) {
  const activeFilters: Array<{ key: keyof FilterState; label: string; value: any }> = []

  if (filters.type !== 'all') {
    activeFilters.push({
      key: 'type',
      label: 'Tipo',
      value: filters.type === 'files' ? 'Arquivos' : 'Bundles',
    })
  }

  if (filters.minPrice !== priceRange.min || filters.maxPrice !== priceRange.max) {
    activeFilters.push({
      key: 'minPrice' as keyof FilterState,
      label: 'Preço',
      value: `R$ ${filters.minPrice.toFixed(2)} - R$ ${filters.maxPrice.toFixed(2)}`,
    })
  }

  if (filters.tags.length > 0) {
    filters.tags.forEach((tag) => {
      activeFilters.push({
        key: 'tags',
        label: 'Tag',
        value: tag,
      })
    })
  }

  if (filters.purchasedOnly) {
    activeFilters.push({
      key: 'purchasedOnly',
      label: 'Comprados',
      value: true,
    })
  }

  if (filters.sortBy !== 'newest') {
    const sortLabels: Record<string, string> = {
      'price-asc': 'Preço: menor para maior',
      'price-desc': 'Preço: maior para menor',
      'name-asc': 'Nome: A-Z',
      'name-desc': 'Nome: Z-A',
    }
    activeFilters.push({
      key: 'sortBy',
      label: 'Ordenação',
      value: sortLabels[filters.sortBy] || filters.sortBy,
    })
  }

  if (activeFilters.length === 0) {
    return null
  }

  const handleRemoveFilter = (filter: { key: keyof FilterState; label: string; value: any }) => {
    if (filter.key === 'tags' && filter.value) {
      onRemoveFilter('tags', filter.value)
    } else if (filter.key === 'minPrice' || filter.label === 'Preço') {
      // Special handling for price filter
      onRemoveFilter('minPrice', priceRange.min)
      onRemoveFilter('maxPrice', priceRange.max)
    } else {
      onRemoveFilter(filter.key)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>
      {activeFilters.map((filter, index) => (
        <button
          key={`${filter.key}-${index}`}
          onClick={() => handleRemoveFilter(filter)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
        >
          <span>
            {filter.label}: {typeof filter.value === 'boolean' ? 'Sim' : filter.value}
          </span>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-sm text-purple-600 hover:text-purple-700 font-medium underline"
      >
        Limpar todos
      </button>
    </div>
  )
}

