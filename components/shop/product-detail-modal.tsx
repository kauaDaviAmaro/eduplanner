'use client'

import { formatPrice } from '@/lib/stripe/config'
import type { ProductWithDetails } from '@/lib/queries/products'
import { VideoPlayer } from './video-player'
import { BuyButton } from './buy-button'
import { useState } from 'react'
import Image from 'next/image'

interface ProductDetailModalProps {
  product: ProductWithDetails | null
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
}

export function ProductDetailModal({ product, isOpen, onClose, isAuthenticated }: ProductDetailModalProps) {
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(0)

  if (!isOpen || !product) {
    return null
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

  const selectedAttachment = product.attachments[selectedAttachmentIndex]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        {/* Modal */}
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-lg transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="overflow-y-auto max-h-[90vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
              {/* Left Column - Media */}
              <div className="space-y-4">
                {/* Thumbnail */}
                {product.thumbnail_url && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={product.thumbnail_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Video Section for Selected Attachment */}
                {selectedAttachment?.video_url && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Vídeo: {selectedAttachment.file_name}
                    </h3>
                    <VideoPlayer videoUrl={selectedAttachment.video_url} title={selectedAttachment.file_name} />
                  </div>
                )}

                {/* File Icon if no thumbnail */}
                {!product.thumbnail_url && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
                    <svg className="h-16 w-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.attachment_count} {product.attachment_count === 1 ? 'arquivo' : 'arquivos'}
                      </p>
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
                      productType="bundle"
                      isPurchased={product.is_purchased}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{product.description}</p>
                  </div>
                )}

                {/* Attachments List */}
                {product.attachments.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Arquivos do Bundle</h2>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {product.attachments.map((attachment, index) => (
                        <div
                          key={attachment.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAttachmentIndex === index
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedAttachmentIndex(index)}
                        >
                          <div className="flex items-center space-x-3">
                            {getFileIcon(attachment.file_type)}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {attachment.file_name}
                              </div>
                              <div className="text-xs text-gray-500">{attachment.file_type}</div>
                              {attachment.video_url && (
                                <div className="text-xs text-purple-600 mt-1">✓ Vídeo disponível</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

