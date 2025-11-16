'use client'

import { FileProductCard } from './file-product-card'
import { ProductCard } from './product-card'
import type { FileProductWithPurchaseStatus } from '@/lib/queries/file-products'
import type { ProductWithDetails } from '@/lib/queries/products'

interface ProductsGridProps {
  fileProducts: FileProductWithPurchaseStatus[]
  products: ProductWithDetails[]
  isAuthenticated: boolean
}

export function ProductsGrid({ fileProducts, products, isAuthenticated }: ProductsGridProps) {
  return (
    <div className="space-y-12">
      {/* File Products Section */}
      {fileProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Arquivos Individuais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fileProducts.map((product) => (
              <FileProductCard
                key={product.id}
                product={product}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bundles Section */}
      {products.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bundles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {fileProducts.length === 0 && products.length === 0 && (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum produto disponível</h3>
          <p className="mt-2 text-sm text-gray-600">
            Não há produtos disponíveis no momento. Volte em breve!
          </p>
        </div>
      )}
    </div>
  )
}

