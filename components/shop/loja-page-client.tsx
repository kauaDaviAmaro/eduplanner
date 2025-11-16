'use client'

import { useState, useMemo } from 'react'
import { ProductsGrid } from './products-grid'
import { SearchBar } from './search-bar'
import { FiltersPanel, type FilterState, type ProductType } from './filters-panel'
import { ActiveFilters } from './active-filters'
import { CategoryTabs } from './category-tabs'
import Link from 'next/link'
import type { FileProductWithPurchaseStatus } from '@/lib/queries/file-products'
import type { ProductWithDetails } from '@/lib/queries/products'

interface LojaPageClientProps {
  fileProducts: FileProductWithPurchaseStatus[]
  products: ProductWithDetails[]
  isAuthenticated: boolean
  canceled: boolean
  error: string | undefined
  priceRange: { min: number; max: number }
  availableTags: string[]
}

export function LojaPageClient({
  fileProducts,
  products,
  isAuthenticated,
  canceled,
  error,
  priceRange,
  availableTags,
}: LojaPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ProductType>('all')
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    tags: [],
    purchasedOnly: false,
    sortBy: 'newest',
  })

  // Update filters when category changes
  const handleCategoryChange = (category: ProductType) => {
    setActiveCategory(category)
    setFilters((prev) => ({ ...prev, type: category === 'all' ? 'all' : category }))
  }

  const handleRemoveFilter = (key: keyof FilterState, value?: any) => {
    if (key === 'tags' && value) {
      setFilters((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t !== value),
      }))
    } else if (key === 'minPrice') {
      setFilters((prev) => ({ ...prev, minPrice: priceRange.min }))
    } else if (key === 'maxPrice') {
      setFilters((prev) => ({ ...prev, maxPrice: priceRange.max }))
    } else {
      setFilters((prev) => {
        const defaults: FilterState = {
          type: 'all',
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          tags: [],
          purchasedOnly: false,
          sortBy: 'newest',
        }
        return { ...prev, [key]: defaults[key] }
      })
    }
  }

  const handleClearAllFilters = () => {
    setSearchQuery('')
    setActiveCategory('all')
    setFilters({
      type: 'all',
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      tags: [],
      purchasedOnly: false,
      sortBy: 'newest',
    })
  }

  // Calculate counts
  const categoryCounts = useMemo(() => {
    return {
      all: fileProducts.length + products.length,
      files: fileProducts.length,
      bundles: products.length,
    }
  }, [fileProducts.length, products.length])

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Loja de Jogos e Arquivos
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-8">
              Compre arquivos individuais ou bundles completos. Acesso permanente após a compra.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{categoryCounts.all}</div>
                <div className="text-sm text-purple-200">Produtos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{categoryCounts.files}</div>
                <div className="text-sm text-purple-200">Arquivos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{categoryCounts.bundles}</div>
                <div className="text-sm text-purple-200">Bundles</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Messages */}
        {canceled && (
          <div className="mb-8 rounded-xl bg-yellow-50 border-2 border-yellow-200 p-4 shadow-sm">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm font-medium text-yellow-800">
                Compra cancelada. Nenhuma cobrança foi realizada.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-xl bg-red-50 border-2 border-red-200 p-4 shadow-sm">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-600 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">
                {error === 'missing_file_product' && 'Produto não especificado.'}
                {error === 'file_product_not_found' && 'Produto não encontrado.'}
                {error === 'file_product_unavailable' && 'Produto não está disponível.'}
                {error === 'missing_product' && 'Bundle não especificado.'}
                {error === 'product_not_found' && 'Bundle não encontrado.'}
                {error === 'product_unavailable' && 'Bundle não está disponível.'}
                {error === 'already_purchased' && 'Você já comprou este produto.'}
                {error === 'checkout_failed' && 'Erro ao processar checkout. Tente novamente.'}
                {!['missing_file_product', 'file_product_not_found', 'file_product_unavailable', 'missing_product', 'product_not_found', 'product_unavailable', 'already_purchased', 'checkout_failed'].includes(error) && `Erro: ${error}`}
              </p>
            </div>
          </div>
        )}

        {/* Login CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 text-center shadow-sm">
            <p className="text-base text-blue-900 mb-4 font-medium">
              Faça login para comprar produtos e ter acesso permanente aos arquivos!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href={`/login?redirect=/loja`}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Fazer Login
              </Link>
              <Link
                href={`/signup?redirect=/loja`}
                className="rounded-lg border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mb-8">
          <CategoryTabs
            activeTab={activeCategory}
            onTabChange={handleCategoryChange}
            counts={categoryCounts}
          />
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              availableTags={availableTags}
              priceRange={priceRange}
              resultCount={
                activeCategory === 'all'
                  ? categoryCounts.all
                  : activeCategory === 'files'
                    ? categoryCounts.files
                    : categoryCounts.bundles
              }
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Active Filters */}
            <div className="mb-6">
              <ActiveFilters
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                priceRange={priceRange}
              />
            </div>

            {/* Products Grid */}
            <ProductsGrid
              fileProducts={fileProducts}
              products={products}
              isAuthenticated={isAuthenticated}
              searchQuery={searchQuery}
              filters={filters}
              activeCategory={activeCategory}
              onClearFilters={handleClearAllFilters}
            />
          </div>
        </div>
      </div>
    </>
  )
}

