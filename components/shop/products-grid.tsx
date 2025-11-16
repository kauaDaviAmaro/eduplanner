'use client'

import { useState, useMemo } from 'react'
import { FileProductCard } from './file-product-card'
import { ProductCard } from './product-card'
import { ProductDetailModal } from './product-detail-modal'
import { EmptyState } from './empty-state'
import { ProductSkeleton, FileProductSkeleton } from './product-skeleton'
import type { FileProductWithPurchaseStatus } from '@/lib/queries/file-products'
import type { ProductWithDetails } from '@/lib/queries/products'
import type { FilterState, ProductType, SortOption } from './filters-panel'

interface ProductsGridProps {
  fileProducts: FileProductWithPurchaseStatus[]
  products: ProductWithDetails[]
  isAuthenticated: boolean
  searchQuery: string
  filters: FilterState
  activeCategory: ProductType
  isLoading?: boolean
  onClearFilters?: () => void
}

export function ProductsGrid({
  fileProducts,
  products,
  isAuthenticated,
  searchQuery,
  filters,
  activeCategory,
  isLoading = false,
  onClearFilters,
}: ProductsGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered: Array<FileProductWithPurchaseStatus | ProductWithDetails> = []

    // Combine all products based on category
    if (activeCategory === 'all' || activeCategory === 'files') {
      filtered = [...filtered, ...fileProducts]
    }
    if (activeCategory === 'all' || activeCategory === 'bundles') {
      filtered = [...filtered, ...products]
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => {
        const title = 'title' in item ? item.title.toLowerCase() : ''
        const description = 'description' in item ? item.description?.toLowerCase() || '' : ''
        return title.includes(query) || description.includes(query)
      })
    }

    // Apply type filter (if not already filtered by category)
    if (filters.type !== 'all') {
      if (filters.type === 'files') {
        filtered = filtered.filter((item) => 'file_name' in item)
      } else {
        filtered = filtered.filter((item) => 'attachment_count' in item)
      }
    }

    // Apply price filter
    filtered = filtered.filter((item) => {
      const price = 'price' in item ? item.price : 0
      return price >= filters.minPrice && price <= filters.maxPrice
    })

    // Apply tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((item) => {
        if ('tags' in item && item.tags) {
          return filters.tags.some((tag) => item.tags?.includes(tag))
        }
        return false
      })
    }

    // Apply purchased filter
    if (filters.purchasedOnly) {
      filtered = filtered.filter((item) => item.is_purchased)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0)
        case 'price-desc':
          return (b.price || 0) - (a.price || 0)
        case 'name-asc':
          return (a.title || '').localeCompare(b.title || '')
        case 'name-desc':
          return (b.title || '').localeCompare(a.title || '')
        case 'newest':
        default:
          return (
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
      }
    })

    return sorted
  }, [fileProducts, products, searchQuery, filters, activeCategory])

  // Separate filtered products
  const filteredFileProducts = filteredProducts.filter(
    (item) => 'file_name' in item
  ) as FileProductWithPurchaseStatus[]
  const filteredBundles = filteredProducts.filter(
    (item) => 'attachment_count' in item
  ) as ProductWithDetails[]

  const handleProductClick = (product: ProductWithDetails) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filters.type !== 'all' ||
    filters.tags.length > 0 ||
    filters.purchasedOnly ||
    filters.sortBy !== 'newest'

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i}>{i % 2 === 0 ? <FileProductSkeleton /> : <ProductSkeleton />}</div>
        ))}
      </div>
    )
  }

  return (
    <>
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isAuthenticated={isAuthenticated}
      />

      {filteredProducts.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          searchQuery={searchQuery}
          onClearFilters={onClearFilters}
        />
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          style={{
            animation: 'fadeIn 0.5s ease-in',
          }}
        >
          {filteredFileProducts.map((product, index) => (
            <div
              key={product.id}
              style={{
                animationDelay: `${index * 0.05}s`,
                animation: 'slideUp 0.4s ease-out forwards',
                opacity: 0,
              }}
            >
              <FileProductCard product={product} isAuthenticated={isAuthenticated} />
            </div>
          ))}
          {filteredBundles.map((product, index) => (
            <div
              key={product.id}
              style={{
                animationDelay: `${(filteredFileProducts.length + index) * 0.05}s`,
                animation: 'slideUp 0.4s ease-out forwards',
                opacity: 0,
              }}
            >
              <ProductCard
                product={product}
                isAuthenticated={isAuthenticated}
                onClick={() => handleProductClick(product)}
              />
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

