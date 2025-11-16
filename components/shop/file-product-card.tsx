'use client'

import { formatPrice } from '@/lib/stripe/config'
import type { FileProductWithPurchaseStatus } from '@/lib/queries/file-products'
import { BuyButton } from './buy-button'

interface FileProductCardProps {
  product: FileProductWithPurchaseStatus
  isAuthenticated: boolean
}

export function FileProductCard({ product, isAuthenticated }: FileProductCardProps) {
  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase()
    if (type.includes('PDF')) {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      )
    }
    if (type.includes('DOC') || type.includes('WORD')) {
      return (
        <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      )
    }
    if (type.includes('PPT') || type.includes('POWERPOINT')) {
      return (
        <svg className="h-8 w-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      )
    }
    return (
      <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getFileIcon(product.file_type)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
            <p className="text-sm text-gray-500">{product.file_name}</p>
          </div>
        </div>
        {product.is_purchased && (
          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            Comprado
          </span>
        )}
      </div>

      {product.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(product.price * 100)}
        </div>
        <BuyButton
          productId={product.id}
          productType="file"
          isPurchased={product.is_purchased}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  )
}

