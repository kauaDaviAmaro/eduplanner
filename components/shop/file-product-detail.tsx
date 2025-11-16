'use client'

import { formatPrice } from '@/lib/stripe/config'
import type { FileProductWithPurchaseStatus } from '@/lib/queries/file-products'
import type { FileProductImage } from '@/lib/queries/file-product-images'
import { VideoPlayer } from './video-player'
import { BuyButton } from './buy-button'
import { useState } from 'react'

interface FileProductDetailProps {
  product: FileProductWithPurchaseStatus
  images?: FileProductImage[]
  isAuthenticated: boolean
}

export function FileProductDetail({ product, images = [], isAuthenticated }: FileProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const allImages = product.thumbnail_url 
    ? [{ image_url: product.thumbnail_url, id: 'thumbnail' }, ...images]
    : images

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Media */}
        <div className="space-y-4">
          {/* Video Section */}
          {product.video_url && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vídeo do Produto</h3>
              <VideoPlayer videoUrl={product.video_url} title={product.title} />
            </div>
          )}

          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Imagens</h3>
              {/* Main Image */}
              <div className="mb-4">
                <img
                  src={allImages[selectedImageIndex]?.image_url}
                  alt={product.title}
                  className="w-full h-auto rounded-lg object-cover max-h-96"
                />
              </div>
              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((img, index) => (
                    <button
                      key={img.id || index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-purple-600 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`${product.title} - Imagem ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File Icon if no images or video */}
          {!product.video_url && allImages.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
              {getFileIcon(product.file_type)}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getFileIcon(product.file_type)}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
                  <p className="text-sm text-gray-500 mt-1">{product.file_name}</p>
                </div>
              </div>
              {product.is_purchased && (
                <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                  Comprado
                </span>
              )}
            </div>

            {/* Price */}
            <div className="text-4xl font-bold text-gray-900 mb-4">
              {formatPrice(product.price * 100)}
            </div>

            {/* Buy Button */}
            <div className="mb-6">
              <BuyButton
                productId={product.id}
                productType="file"
                isPurchased={product.is_purchased}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>

          {/* Short Description */}
          {product.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          {/* Long Description */}
          {product.long_description && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Descrição Detalhada</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {product.long_description}
              </div>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Especificações Técnicas</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                      <dt className="font-medium text-gray-700">{key}:</dt>
                      <dd className="text-gray-600">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Informações do Arquivo</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Tipo:</span> {product.file_type}
              </p>
              <p>
                <span className="font-medium">Nome:</span> {product.file_name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

