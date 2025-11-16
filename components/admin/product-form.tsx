'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/app/actions/products'
import type { ProductWithDetails } from '@/lib/queries/products'
import type { AttachmentForAdmin } from '@/lib/queries/admin'

interface ProductFormProps {
  product?: ProductWithDetails | null
  attachments: AttachmentForAdmin[]
}

export function ProductForm({ product, attachments }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    thumbnail_url: product?.thumbnail_url || '',
    is_active: product?.is_active !== undefined ? product.is_active : true,
    attachment_ids: product?.attachments.map((a) => a.id) || [],
  })

  const isEditMode = !!product

  const handleThumbnailUpload = async (file: File, productId?: string): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('A imagem deve ter no máximo 5MB')
    }

    setUploadingThumbnail(true)
    setError(null)

    try {
      // Request presigned URL for thumbnail upload
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: 'product-thumbnail',
          contentType: file.type,
          productId: productId || undefined,
        }),
      })

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json()
        throw new Error(errorData.error || 'Erro ao solicitar upload')
      }

      const { uploadUrl, storageKey } = await requestResponse.json()

      // Upload file directly to MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do thumbnail')
      }

      // Confirm upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageKey,
          fileType: 'product-thumbnail',
          productId: productId || undefined,
        }),
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Erro ao confirmar upload')
      }

      const { fileUrl } = await completeResponse.json()
      setFormData((prev) => ({ ...prev, thumbnail_url: fileUrl }))
      setUploadingThumbnail(false)
      return fileUrl
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do thumbnail')
      setUploadingThumbnail(false)
      throw err
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Título é obrigatório')
      return
    }

    if (formData.price <= 0) {
      setError('Preço deve ser maior que zero')
      return
    }

    if (formData.attachment_ids.length === 0) {
      setError('Selecione pelo menos um arquivo para o bundle')
      return
    }

    startTransition(async () => {
      try {
        let thumbnailUrl = formData.thumbnail_url

        // Upload thumbnail if a new file was selected
        if (selectedThumbnail) {
          const uploadedUrl = await handleThumbnailUpload(
            selectedThumbnail,
            isEditMode ? product!.id : undefined
          )
          thumbnailUrl = uploadedUrl
        }

        if (isEditMode) {
          const result = await updateProduct(product!.id, {
            title: formData.title,
            description: formData.description || undefined,
            price: formData.price,
            thumbnail_url: thumbnailUrl || undefined,
            is_active: formData.is_active,
            attachment_ids: formData.attachment_ids,
          })

          if (result.success) {
            router.push('/admin/loja')
            router.refresh()
          } else {
            setError(result.error || 'Erro ao atualizar bundle')
          }
        } else {
          const result = await createProduct({
            title: formData.title,
            description: formData.description || undefined,
            price: formData.price,
            thumbnail_url: thumbnailUrl || undefined,
            is_active: formData.is_active,
            attachment_ids: formData.attachment_ids,
          })

          if (result.success) {
            router.push('/admin/loja')
            router.refresh()
          } else {
            setError(result.error || 'Erro ao criar bundle')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao salvar bundle')
      }
    })
  }

  const toggleAttachment = (attachmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      attachment_ids: prev.attachment_ids.includes(attachmentId)
        ? prev.attachment_ids.filter((id) => id !== attachmentId)
        : [...prev.attachment_ids, attachmentId],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Nome do bundle"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Descrição do bundle"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preço (R$) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail do Bundle
          </label>
          <div className="space-y-3">
            {formData.thumbnail_url && (
              <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={formData.thumbnail_url}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {uploadingThumbnail && (
              <p className="text-sm text-gray-600">Enviando thumbnail...</p>
            )}
            {selectedThumbnail && !uploadingThumbnail && (
              <p className="text-sm text-gray-600">
                Arquivo selecionado: {selectedThumbnail.name}
              </p>
            )}
          </div>
        </div>

        {/* Attachments Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arquivos do Bundle <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
            {attachments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum arquivo disponível</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <label
                    key={attachment.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.attachment_ids.includes(attachment.id)}
                      onChange={() => toggleAttachment(attachment.id)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {attachment.file_name}
                      </div>
                      <div className="text-xs text-gray-500">{attachment.file_type}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {formData.attachment_ids.length} arquivo(s) selecionado(s)
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            Bundle ativo (visível na loja)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Criar Bundle'}
          </button>
        </div>
      </div>
    </form>
  )
}

