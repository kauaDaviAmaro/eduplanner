'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/app/actions/products'
import { createAttachment } from '@/app/actions/courses'
import type { ProductWithDetails } from '@/lib/queries/products'
import type { AttachmentForAdmin } from '@/lib/queries/admin'
import type { Tier } from '@/lib/queries/subscriptions'

interface ProductFormProps {
  product?: ProductWithDetails | null
  attachments: AttachmentForAdmin[]
  tiers?: Tier[]
}

interface NewFileItem {
  id: string
  file: File
  fileName: string
  fileType: string
  minimumTierId: number
  videoUrl: string
  uploading: boolean
  uploadProgress: number
  attachmentId?: string
}

export function ProductForm({ product, attachments, tiers = [] }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [newFiles, setNewFiles] = useState<NewFileItem[]>([])
  const [useExistingFiles, setUseExistingFiles] = useState(true)

  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    thumbnail_url: product?.thumbnail_url || '',
    is_active: product?.is_active !== undefined ? product.is_active : true,
    attachment_ids: product?.attachments.map((a) => a.id) || [],
    attachment_videos: product?.attachments.reduce((acc, a) => {
      if (a.video_url) acc[a.id] = a.video_url
      return acc
    }, {} as Record<string, string>) || {},
  })

  const isEditMode = !!product

  const handleThumbnailUpload = async (file: File, productId?: string): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem')
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('A imagem deve ter no máximo 5MB')
    }

    setUploadingThumbnail(true)
    setError(null)

    try {
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

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do thumbnail')
      }

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

  const handleFileUpload = async (fileItem: NewFileItem): Promise<string> => {
    if (!fileItem.attachmentId) {
      throw new Error('Attachment ID não encontrado')
    }

    const attachmentId = fileItem.attachmentId // Store in a const to ensure it's not undefined

    setNewFiles((prev) =>
      prev.map((f) => (f.id === fileItem.id ? { ...f, uploading: true, uploadProgress: 0 } : f))
    )

    try {
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileItem.file.name,
          fileType: 'attachment',
          contentType: fileItem.file.type,
          attachmentId,
        }),
      })

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json()
        throw new Error(errorData.error || 'Erro ao solicitar upload')
      }

      const { uploadUrl, storageKey } = await requestResponse.json()

      const xhr = new XMLHttpRequest()

      return new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setNewFiles((prev) =>
              prev.map((f) => (f.id === fileItem.id ? { ...f, uploadProgress: percentComplete } : f))
            )
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              const completeResponse = await fetch('/api/upload/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  attachmentId,
                  storageKey,
                  fileType: 'attachment',
                }),
              })

              if (!completeResponse.ok) {
                const errorData = await completeResponse.json()
                throw new Error(errorData.error || 'Erro ao confirmar upload')
              }

              setNewFiles((prev) =>
                prev.map((f) => (f.id === fileItem.id ? { ...f, uploading: false, uploadProgress: 100 } : f))
              )
              resolve(attachmentId)
            } catch (err: any) {
              reject(err)
            }
          } else {
            reject(new Error('Erro ao fazer upload do arquivo'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Erro de conexão durante o upload'))
        })

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', fileItem.file.type)
        xhr.send(fileItem.file)
      })
    } catch (err: any) {
      setNewFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, uploading: false, uploadProgress: 0 } : f))
      )
      throw err
    }
  }

  const addNewFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.ppt,.pptx,.doc,.docx'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF'
        const fileType = ['PDF', 'PPT', 'PPTX', 'DOC', 'DOCX'].includes(extension) ? extension : 'PDF'
        const newFile: NewFileItem = {
          id: Math.random().toString(36).substring(7),
          file,
          fileName: file.name.replace(/\.[^/.]+$/, ''),
          fileType,
          minimumTierId: tiers[0]?.id || 0,
          videoUrl: '',
          uploading: false,
          uploadProgress: 0,
        }
        setNewFiles((prev) => [...prev, newFile])
        setUseExistingFiles(false)
      }
    }
    input.click()
  }

  const removeNewFile = (id: string) => {
    setNewFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const updateNewFile = (id: string, updates: Partial<NewFileItem>) => {
    setNewFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
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

    const allAttachmentIds = [
      ...formData.attachment_ids,
      ...newFiles.filter((f) => f.attachmentId).map((f) => f.attachmentId!),
    ]

    if (allAttachmentIds.length === 0 && newFiles.length === 0) {
      setError('Adicione pelo menos um arquivo para o bundle')
      return
    }

    startTransition(async () => {
      try {
        // Upload new files first
        const uploadedAttachmentIds: string[] = []
        const attachmentVideos: Record<string, string> = { ...formData.attachment_videos }

        for (const fileItem of newFiles) {
          if (!fileItem.attachmentId) {
            // Create attachment
            const attachmentResult = await createAttachment({
              lessonId: null,
              fileName: fileItem.fileName || fileItem.file.name,
              fileType: fileItem.fileType,
              minimumTierId: fileItem.minimumTierId,
            })

            if (!attachmentResult.success || !attachmentResult.attachmentId) {
              setError(attachmentResult.error || 'Erro ao criar arquivo')
              return
            }

            fileItem.attachmentId = attachmentResult.attachmentId
            updateNewFile(fileItem.id, { attachmentId: attachmentResult.attachmentId })
          }

          // Upload file
          await handleFileUpload(fileItem)
          uploadedAttachmentIds.push(fileItem.attachmentId)

          // Add video URL if provided
          if (fileItem.videoUrl.trim()) {
            attachmentVideos[fileItem.attachmentId] = fileItem.videoUrl.trim()
          }
        }

        // Upload thumbnail if needed
        let thumbnailUrl = formData.thumbnail_url
        if (selectedThumbnail) {
          thumbnailUrl = await handleThumbnailUpload(selectedThumbnail, isEditMode ? product!.id : undefined)
        }

        // Combine existing and new attachment IDs
        const allAttachmentIds = [...formData.attachment_ids, ...uploadedAttachmentIds]

        if (isEditMode) {
          const result = await updateProduct(product!.id, {
            title: formData.title,
            description: formData.description || undefined,
            price: formData.price,
            thumbnail_url: thumbnailUrl || undefined,
            is_active: formData.is_active,
            attachment_ids: allAttachmentIds,
            attachment_videos: attachmentVideos,
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
            attachment_ids: allAttachmentIds,
            attachment_videos: attachmentVideos,
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
    setUseExistingFiles(true)
  }

  const updateAttachmentVideo = (attachmentId: string, videoUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      attachment_videos: {
        ...prev.attachment_videos,
        [attachmentId]: videoUrl,
      },
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail do Bundle</label>
          <div className="space-y-3">
            {formData.thumbnail_url && (
              <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {uploadingThumbnail && <p className="text-sm text-gray-600">Enviando thumbnail...</p>}
            {selectedThumbnail && !uploadingThumbnail && (
              <p className="text-sm text-gray-600">Arquivo selecionado: {selectedThumbnail.name}</p>
            )}
          </div>
        </div>

        {/* New Files Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Arquivos do Bundle <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addNewFile}
              className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
            >
              + Adicionar Arquivo
            </button>
          </div>

          {/* New Files List */}
          {newFiles.length > 0 && (
            <div className="mb-4 space-y-3">
              {newFiles.map((fileItem) => (
                <div key={fileItem.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{fileItem.file.name}</div>
                      <div className="text-xs text-gray-500">{fileItem.fileType}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(fileItem.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Arquivo</label>
                    <input
                      type="text"
                      value={fileItem.fileName}
                      onChange={(e) => updateNewFile(fileItem.id, { fileName: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      placeholder="Nome do arquivo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tier Mínimo</label>
                    <select
                      value={fileItem.minimumTierId}
                      onChange={(e) => updateNewFile(fileItem.id, { minimumTierId: Number.parseInt(e.target.value, 10) })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    >
                      {tiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vídeo (URL opcional)</label>
                    <input
                      type="url"
                      value={fileItem.videoUrl}
                      onChange={(e) => updateNewFile(fileItem.id, { videoUrl: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      placeholder="https://..."
                    />
                  </div>

                  {fileItem.uploading && (
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${fileItem.uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Enviando... {Math.round(fileItem.uploadProgress)}%</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Existing Files Selection */}
          <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
            {attachments.length === 0 && newFiles.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum arquivo disponível. Adicione novos arquivos acima.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="space-y-2">
                    <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.attachment_ids.includes(attachment.id)}
                        onChange={() => toggleAttachment(attachment.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{attachment.file_name}</div>
                        <div className="text-xs text-gray-500">{attachment.file_type}</div>
                      </div>
                    </label>
                    {formData.attachment_ids.includes(attachment.id) && (
                      <div className="ml-7 mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Vídeo (URL opcional)</label>
                        <input
                          type="url"
                          value={formData.attachment_videos[attachment.id] || ''}
                          onChange={(e) => updateAttachmentVideo(attachment.id, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {formData.attachment_ids.length + newFiles.length} arquivo(s) selecionado(s)
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
