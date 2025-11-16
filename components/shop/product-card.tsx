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
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    onClick?.()
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Image/Thumbnail */}
      <div className="relative w-full h-48 bg-gradient-to-br from-purple-50 to-indigo-50 flex-shrink-0">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="h-16 w-16 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {product.is_purchased && (
            <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full shadow-sm">
              ✓ Comprado
            </span>
          )}
        </div>

        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-full shadow-sm">
            Bundle
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
            {product.title}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* File count */}
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-gray-50 rounded-lg">
          <svg className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {product.attachment_count} {product.attachment_count === 1 ? 'arquivo' : 'arquivos'}
          </span>
        </div>

        {/* Price and Button */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price * 100)}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <BuyButton
                productId={product.id}
                productType="bundle"
                isPurchased={product.is_purchased}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
