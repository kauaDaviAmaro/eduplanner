'use client'

import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/stripe/config'
import type { FileProductWithPurchaseStatus } from '@/lib/queries/file-products'
import { BuyButton } from './buy-button'

interface FileProductCardProps {
  product: FileProductWithPurchaseStatus
  isAuthenticated: boolean
}

export function FileProductCard({ product, isAuthenticated }: FileProductCardProps) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the buy button
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    router.push(`/loja/${product.id}`)
  }
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
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Thumbnail or File Icon */}
      {product.thumbnail_url ? (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="w-full h-48 object-cover"
          />
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          {getFileIcon(product.file_type)}
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.title}</h3>
          <p className="text-sm text-gray-500">{product.file_name}</p>
        </div>
        {product.is_purchased && (
          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full ml-2 flex-shrink-0">
            Comprado
          </span>
        )}
      </div>

      {/* Video indicator */}
      {product.video_url && (
        <div className="mb-3 flex items-center text-sm text-purple-600">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          <span>Vídeo disponível</span>
        </div>
      )}

      {product.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {product.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full"
            >
              {tag}
            </span>
          ))}
          {product.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">+{product.tags.length - 3}</span>
          )}
        </div>
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

