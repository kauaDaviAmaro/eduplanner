'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createFileProduct, updateFileProduct } from '@/app/actions/products'
import { createAttachment } from '@/app/actions/courses'
import type { FileProduct } from '@/lib/queries/file-products'
import type { AttachmentForAdmin } from '@/lib/queries/admin'
import type { Tier } from '@/lib/queries/subscriptions'

interface FileProductFormProps {
  fileProduct?: FileProduct | null
  attachments?: AttachmentForAdmin[]
  tiers?: Tier[]
}

export function FileProductForm({ fileProduct, attachments = [], tiers = [] }: FileProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [useNewFile, setUseNewFile] = useState(false)

  const [formData, setFormData] = useState({
    attachment_id: fileProduct?.attachment_id || '',
    title: fileProduct?.title || '',
    description: fileProduct?.description || '',
    price: fileProduct?.price || 0,
    is_active: fileProduct?.is_active !== undefined ? fileProduct.is_active : true,
    fileName: '',
    fileType: 'PDF',
    minimumTierId: tiers[0]?.id || 0,
    video_url: fileProduct?.video_url || '',
    thumbnail_url: fileProduct?.thumbnail_url || '',
    is_shop_only: fileProduct?.is_shop_only !== undefined ? fileProduct.is_shop_only : true,
    long_description: fileProduct?.long_description || '',
    specifications: fileProduct?.specifications ? JSON.stringify(fileProduct.specifications, null, 2) : '',
    tags: fileProduct?.tags?.join(', ') || '',
  })

  const isEditMode = !!fileProduct

  const handleFileUpload = async (file: File, attachmentId: string) => {
    setUploadingFile(true)
    setUploadProgress(0)
    setError(null)

    try {
      const requestResponse = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType: 'attachment',
          contentType: file.type,
          attachmentId,
        }),
      })

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json()
        throw new Error(errorData.error || 'Erro ao solicitar upload')
      }

      const { uploadUrl, storageKey } = await requestResponse.json()

      const xhr = new XMLHttpRequest()

      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress(percentComplete)
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

              setUploadProgress(100)
              setTimeout(() => {
                setUploadingFile(false)
                setUploadProgress(0)
                resolve()
              }, 500)
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
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do arquivo')
      setUploadingFile(false)
      setUploadProgress(0)
      throw err
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isEditMode) {
      if (useNewFile) {
        if (!selectedFile) {
          setError('Selecione um arquivo para upload')
          return
        }
        if (!formData.fileName.trim()) {
          setError('Nome do arquivo é obrigatório')
          return
        }
      } else {
        if (!formData.attachment_id) {
          setError('Selecione um arquivo existente ou faça upload de um novo')
          return
        }
      }
    }

    if (!formData.title.trim()) {
      setError('Título é obrigatório')
      return
    }

    if (formData.price <= 0) {
      setError('Preço deve ser maior que zero')
      return
    }

    startTransition(async () => {
      try {
        if (isEditMode) {
          // Parse specifications JSON
          let specifications: Record<string, any> | undefined = undefined
          if (formData.specifications.trim()) {
            try {
              specifications = JSON.parse(formData.specifications)
            } catch (e) {
              setError('Especificações devem ser um JSON válido')
              return
            }
          }

          // Parse tags
          const tags = formData.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)

          const result = await updateFileProduct(fileProduct!.id, {
            title: formData.title,
            description: formData.description || undefined,
            price: formData.price,
            is_active: formData.is_active,
            video_url: formData.video_url || undefined,
            thumbnail_url: formData.thumbnail_url || undefined,
            is_shop_only: formData.is_shop_only,
            long_description: formData.long_description || undefined,
            specifications,
            tags: tags.length > 0 ? tags : undefined,
          })

          if (result.success) {
            router.push('/admin/loja')
            router.refresh()
          } else {
            setError(result.error || 'Erro ao atualizar produto')
          }
        } else {
          let attachmentId = formData.attachment_id

          // If creating new attachment with file upload
          if (useNewFile && selectedFile) {
            const extension = selectedFile.name.split('.').pop()?.toUpperCase() || 'PDF'
            const fileType = ['PDF', 'PPT', 'PPTX', 'DOC', 'DOCX'].includes(extension) ? extension : 'PDF'

            const attachmentResult = await createAttachment({
              lessonId: null,
              fileName: formData.fileName || selectedFile.name,
              fileType,
              minimumTierId: formData.minimumTierId,
            })

            if (!attachmentResult.success || !attachmentResult.attachmentId) {
              setError(attachmentResult.error || 'Erro ao criar arquivo')
              return
            }

            attachmentId = attachmentResult.attachmentId

            // Upload the file
            await handleFileUpload(selectedFile, attachmentId)
          }

          // Parse specifications JSON
          let specifications: Record<string, any> | undefined = undefined
          if (formData.specifications.trim()) {
            try {
              specifications = JSON.parse(formData.specifications)
            } catch (e) {
              setError('Especificações devem ser um JSON válido')
              return
            }
          }

          // Parse tags
          const tags = formData.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)

          const result = await createFileProduct({
            attachment_id: attachmentId,
            title: formData.title,
            description: formData.description || undefined,
            price: formData.price,
            is_active: formData.is_active,
            video_url: formData.video_url || undefined,
            thumbnail_url: formData.thumbnail_url || undefined,
            is_shop_only: formData.is_shop_only,
            long_description: formData.long_description || undefined,
            specifications,
            tags: tags.length > 0 ? tags : undefined,
          })

          if (result.success) {
            router.push('/admin/loja')
            router.refresh()
          } else {
            setError(result.error || 'Erro ao criar produto')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao salvar produto')
      }
    })
  }

  const selectedAttachment = attachments.find((a) => a.id === formData.attachment_id)

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Attachment Selection (only for new products) */}
        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo <span className="text-red-500">*</span>
            </label>
            <div className="mb-3">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!useNewFile}
                    onChange={() => setUseNewFile(false)}
                    className="mr-2"
                  />
                  Selecionar arquivo existente
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useNewFile}
                    onChange={() => setUseNewFile(true)}
                    className="mr-2"
                  />
                  Fazer upload de novo arquivo
                </label>
              </div>
            </div>

            {!useNewFile ? (
              <select
                value={formData.attachment_id}
                onChange={(e) => setFormData({ ...formData, attachment_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required={!useNewFile}
              >
                <option value="">Selecione um arquivo</option>
                {attachments.map((attachment) => (
                  <option key={attachment.id} value={attachment.id}>
                    {attachment.file_name} ({attachment.file_type})
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Arquivo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nome do arquivo"
                    required={useNewFile}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Arquivo
                  </label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PPT">PPT</option>
                    <option value="PPTX">PPTX</option>
                    <option value="DOC">DOC</option>
                    <option value="DOCX">DOCX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier Mínimo
                  </label>
                  <select
                    value={formData.minimumTierId}
                    onChange={(e) => setFormData({ ...formData, minimumTierId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required={useNewFile}
                  />
                  {uploadingFile && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Enviando... {Math.round(uploadProgress)}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!useNewFile && selectedAttachment && (
              <p className="mt-2 text-sm text-gray-500">
                Arquivo selecionado: {selectedAttachment.file_name}
              </p>
            )}
          </div>
        )}

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
            placeholder="Nome do produto"
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
            placeholder="Descrição do produto"
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

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL do Vídeo (opcional)
          </label>
          <input
            type="url"
            value={formData.video_url}
            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://..."
          />
          <p className="mt-1 text-xs text-gray-500">URL do vídeo armazenado no sistema</p>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL da Thumbnail (opcional)
          </label>
          <input
            type="url"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://..."
          />
          <p className="mt-1 text-xs text-gray-500">URL da imagem de destaque do produto</p>
        </div>

        {/* Long Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição Detalhada (opcional)
          </label>
          <textarea
            value={formData.long_description}
            onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Descrição completa e detalhada do produto..."
          />
        </div>

        {/* Specifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Especificações Técnicas (JSON, opcional)
          </label>
          <textarea
            value={formData.specifications}
            onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            placeholder='{"Versão": "1.0", "Plataforma": "Windows", ...}'
          />
          <p className="mt-1 text-xs text-gray-500">Formato JSON: {"{"}"chave": "valor"{"}"}</p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags/Categorias (opcional)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="tag1, tag2, tag3"
          />
          <p className="mt-1 text-xs text-gray-500">Separe as tags por vírgula</p>
        </div>

        {/* Shop Only */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_shop_only"
            checked={formData.is_shop_only}
            onChange={(e) => setFormData({ ...formData, is_shop_only: e.target.checked })}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="is_shop_only" className="ml-2 block text-sm text-gray-700">
            Exclusivo da loja (não aparece na biblioteca)
          </label>
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
            Produto ativo (visível na loja)
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Criar Produto'}
          </button>
        </div>
      </div>
    </form>
  )
}

