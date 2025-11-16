'use client'

import { useState } from 'react'

export type ProductType = 'all' | 'files' | 'bundles'
export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest'

export interface FilterState {
  type: ProductType
  minPrice: number
  maxPrice: number
  tags: string[]
  purchasedOnly: boolean
  sortBy: SortOption
}

interface FiltersPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableTags: string[]
  priceRange: { min: number; max: number }
  resultCount: number
}

export function FiltersPanel({
  filters,
  onChange,
  availableTags,
  priceRange,
  resultCount,
}: FiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    updateFilter('tags', newTags)
  }

  const clearFilters = () => {
    onChange({
      type: 'all',
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      tags: [],
      purchasedOnly: false,
      sortBy: 'newest',
    })
  }

  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.minPrice !== priceRange.min ||
    filters.maxPrice !== priceRange.max ||
    filters.tags.length > 0 ||
    filters.purchasedOnly ||
    filters.sortBy !== 'newest'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <p className="text-sm text-gray-500 mt-1">
            {resultCount} {resultCount === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Limpar
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            aria-label={isOpen ? 'Fechar filtros' : 'Abrir filtros'}
          >
            <svg
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters Content */}
      <div className={`space-y-6 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        {/* Product Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'files', 'bundles'] as ProductType[]).map((type) => (
              <button
                key={type}
                onClick={() => updateFilter('type', type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  filters.type === type
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filters.type === type}
              >
                {type === 'all' ? 'Todos' : type === 'files' ? 'Arquivos' : 'Bundles'}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preço: {filters.minPrice === priceRange.min && filters.maxPrice === priceRange.max
              ? 'Todos'
              : `R$ ${filters.minPrice.toFixed(2)} - R$ ${filters.maxPrice.toFixed(2)}`}
          </label>
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                <input
                  type="number"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', Math.max(priceRange.min, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                <input
                  type="number"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', Math.min(priceRange.max, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filters.tags.includes(tag)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Purchased Only */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.purchasedOnly}
              onChange={(e) => updateFilter('purchasedOnly', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">Apenas produtos comprados</span>
          </label>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Ordenar por</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="newest">Mais recente</option>
            <option value="price-asc">Preço: menor para maior</option>
            <option value="price-desc">Preço: maior para menor</option>
            <option value="name-asc">Nome: A-Z</option>
            <option value="name-desc">Nome: Z-A</option>
          </select>
        </div>
      </div>
    </div>
  )
}

