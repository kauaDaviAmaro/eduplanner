'use client'

import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/stripe/config'
import type { FileProductWithPurchaseStatus } from '@/lib/queries/file-products'
import { BuyButton } from './buy-button'
import Image from 'next/image'

interface FileProductCardProps {
  product: FileProductWithPurchaseStatus
  isAuthenticated: boolean
}

export function FileProductCard({ product, isAuthenticated }: FileProductCardProps) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    router.push(`/loja/${product.id}`)
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase()
    if (type.includes('PDF')) {
      return (
        <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      )
    }
    if (type.includes('DOC') || type.includes('WORD')) {
      return (
        <svg className="h-12 w-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      )
    }
    if (type.includes('PPT') || type.includes('POWERPOINT')) {
      return (
        <svg className="h-12 w-12 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      )
    }
    return (
      <svg className="h-12 w-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
      </svg>
    )
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
            {getFileIcon(product.file_type)}
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

        {product.video_url && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full shadow-sm flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              Vídeo
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3.5rem]">
            {product.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1">{product.file_name}</p>
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">{product.description}</p>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-full"
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">+{product.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Price and Button */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price * 100)}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <BuyButton
                productId={product.id}
                productType="file"
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
