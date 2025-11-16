'use client'

import { formatPrice } from '@/lib/stripe/config'
import type { ProductWithDetails } from '@/lib/queries/products'
import { BuyButton } from './buy-button'
import Image from 'next/image'

interface ProductCardProps {
  product: ProductWithDetails
  isAuthenticated: boolean
  onClick?: () => void
}

export function ProductCard({ product, isAuthenticated, onClick }: ProductCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the buy button
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    onClick?.()
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {product.thumbnail_url ? (
        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
          <svg
            className="h-16 w-16 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{product.title}</h3>
          {product.is_purchased && (
            <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
              Comprado
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {product.attachment_count} {product.attachment_count === 1 ? 'arquivo' : 'arquivos'}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(product.price * 100)}
          </div>
        </div>

        <BuyButton
          productId={product.id}
          productType="bundle"
          isPurchased={product.is_purchased}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}

