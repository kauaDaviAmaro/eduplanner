'use client'

import { useState, useTransition, useRef } from 'react'
import { createAttachment, deleteAttachment } from '@/app/actions/courses'
import type { Database } from '@/types/database'

type Attachment = Database['public']['Tables']['attachments']['Row']
type Tier = Database['public']['Tables']['tiers']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']

interface AttachmentFormProps {
  lessonId: string
  lesson: Lesson
  attachments: Attachment[]
  tiers: Tier[]
  onSuccess: () => void
  onCancel?: () => void
}

export function AttachmentForm({ lessonId, lesson, attachments, tiers, onSuccess, onCancel }: AttachmentFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    fileName: '',
    fileType: 'PDF',
    minimumTierId: tiers[0]?.id || 0,
  })

  const handleFileUpload = async (file: File, attachmentId: string) => {
    setUploadingFile(attachmentId)
    setUploadProgress({ [attachmentId]: 0 })
    setError(null)

    try {
      // Request presigned URL for attachment upload
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

      // Upload file directly to MinIO with progress tracking
      const xhr = new XMLHttpRequest()

      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress({ [attachmentId]: percentComplete })
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              // Confirm upload
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

              setUploadProgress({ [attachmentId]: 100 })
              setTimeout(() => {
                setUploadingFile(null)
              setUploadProgress({})
              setSuccessMessage('Anexo enviado com sucesso!')
              setTimeout(() => setSuccessMessage(null), 3000)
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
      setUploadingFile(null)
      setUploadProgress({})
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) {
      return
    }

    setDeletingAttachmentId(attachmentId)
    setError(null)

    try {
      const result = await deleteAttachment(attachmentId)
      if (result.success) {
        setSuccessMessage('Anexo excluído com sucesso!')
        setTimeout(() => setSuccessMessage(null), 3000)
        onSuccess()
      } else {
        setError(result.error || 'Erro ao excluir anexo')
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Por favor, selecione um arquivo')
      return
    }

    // Validate file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx']
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Formato de arquivo não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`)
      return
    }

    // Validate file size (default 100MB for attachments)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setError(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    if (!formData.fileName.trim()) {
      setError('Nome do arquivo é obrigatório')
      return
    }

    if (!formData.minimumTierId) {
      setError('Tier mínimo é obrigatório')
      return
    }

    // Determine file type from extension
    const extensionUpper = fileExtension.toUpperCase()
    const fileType = ['PDF', 'PPT', 'PPTX', 'DOC', 'DOCX'].includes(extensionUpper) ? extensionUpper : 'PDF'

    startTransition(async () => {
      try {
        const result = await createAttachment({
          lessonId,
          fileName: formData.fileName || file.name,
          fileType,
          minimumTierId: formData.minimumTierId,
        })

        if (result.success && result.attachmentId) {
          // Upload the file
          await handleFileUpload(file, result.attachmentId)
          
          setFormData({
            fileName: '',
            fileType: 'PDF',
            minimumTierId: tiers[0]?.id || 0,
          })
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          onSuccess()
        } else {
          setError(result.error || 'Erro ao criar anexo')
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Anexo</h3>
      <p className="text-sm text-gray-600 mb-4">Aula: {lesson.title}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Arquivo *
          </label>
          <input
            type="text"
            id="fileName"
            value={formData.fileName}
            onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ex: Material Complementar"
          />
        </div>

        <div>
          <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Arquivo
          </label>
          <select
            id="fileType"
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
          <label htmlFor="minimumTierId" className="block text-sm font-medium text-gray-700 mb-1">
            Tier Mínimo *
          </label>
          <select
            id="minimumTierId"
            value={formData.minimumTierId}
            onChange={(e) => setFormData({ ...formData, minimumTierId: parseInt(e.target.value) })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} (Nível {tier.permission_level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo *
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx"
            required
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending || !!uploadingFile}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || !!uploadingFile}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isPending ? 'Criando...' : uploadingFile ? 'Enviando...' : 'Adicionar Anexo'}
          </button>
        </div>
      </form>

      {attachments.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Anexos Criados</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const isUploading = uploadingFile === attachment.id
              const progress = uploadProgress[attachment.id] || 0

              return (
                <div
                  key={attachment.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {attachment.file_name}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({attachment.file_type})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {attachment.file_url ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          Enviado
                        </span>
                      ) : isUploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Aguardando upload
                        </span>
                      )}
                      {attachment.file_url && (
                        <button
                          onClick={() => handleDelete(attachment.id)}
                          disabled={deletingAttachmentId === attachment.id}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingAttachmentId === attachment.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

