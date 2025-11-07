'use client'

import { useState, useRef, useTransition } from 'react'
import { createAttachment, deleteAttachment } from '@/app/actions/courses'
import type { Database } from '@/types/database'
import type { CourseWithModules } from '@/lib/queries/courses'

type Lesson = CourseWithModules['modules'][0]['lessons'][0]
type Tier = Database['public']['Tables']['tiers']['Row']

interface AttachmentSectionProps {
  lesson: Lesson
  tiers: Tier[]
  onUpdate: () => void
  isExpanded: boolean
  onToggle: () => void
}

export function AttachmentSection({
  lesson,
  tiers,
  onUpdate,
  isExpanded,
  onToggle,
}: AttachmentSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [uploadingAttachment, setUploadingAttachment] = useState<string | null>(null)
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<{ [key: string]: number }>({})
  const [attachmentFormData, setAttachmentFormData] = useState({
    fileName: '',
    fileType: 'PDF',
    minimumTierId: tiers[0]?.id || 0,
  })
  const attachmentFileInputRef = useRef<HTMLInputElement>(null)

  const handleAttachmentFileUpload = async (file: File, attachmentId: string) => {
    setUploadingAttachment(attachmentId)
    setAttachmentUploadProgress({ [attachmentId]: 0 })

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

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setAttachmentUploadProgress({ [attachmentId]: percentComplete })
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

              setAttachmentUploadProgress({ [attachmentId]: 100 })
              setTimeout(() => {
                setUploadingAttachment(null)
                setAttachmentUploadProgress({})
                onUpdate()
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
      alert(err.message || 'Erro ao fazer upload do arquivo')
      setUploadingAttachment(null)
      setAttachmentUploadProgress({})
    }
  }

  const handleCreateAttachment = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = attachmentFileInputRef.current?.files?.[0]
    if (!file) {
      alert('Por favor, selecione um arquivo')
      return
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const allowedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx']
    if (!allowedExtensions.includes(fileExtension)) {
      alert(`Formato de arquivo não suportado. Formatos permitidos: ${allowedExtensions.join(', ')}`)
      return
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      alert(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    if (!attachmentFormData.fileName.trim()) {
      alert('Nome do arquivo é obrigatório')
      return
    }

    if (!attachmentFormData.minimumTierId) {
      alert('Tier mínimo é obrigatório')
      return
    }

    const extensionUpper = fileExtension.toUpperCase()
    const fileType = ['PDF', 'PPT', 'PPTX', 'DOC', 'DOCX'].includes(extensionUpper) ? extensionUpper : 'PDF'

    startTransition(async () => {
      try {
        const result = await createAttachment({
          lessonId: lesson.id,
          fileName: attachmentFormData.fileName || file.name,
          fileType,
          minimumTierId: attachmentFormData.minimumTierId,
        })

        if (result.success && result.attachmentId) {
          await handleAttachmentFileUpload(file, result.attachmentId)
          setAttachmentFormData({
            fileName: '',
            fileType: 'PDF',
            minimumTierId: tiers[0]?.id || 0,
          })
          if (attachmentFileInputRef.current) {
            attachmentFileInputRef.current.value = ''
          }
        } else {
          alert(result.error || 'Erro ao criar anexo')
        }
      } catch (err: any) {
        alert(err.message || 'Erro inesperado')
      }
    })
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) {
      return
    }

    try {
      const result = await deleteAttachment(attachmentId)
      if (result.success) {
        onUpdate()
      } else {
        alert(result.error || 'Erro ao excluir anexo')
      }
    } catch (err: any) {
      alert(err.message || 'Erro inesperado')
    }
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors mb-2"
      >
        {isExpanded ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Ocultar anexos
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Anexos ({lesson.attachments?.length || 0})
          </>
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-3 animate-slide-down">
          {/* Attachment Form */}
          <form
            onSubmit={handleCreateAttachment}
            className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200"
          >
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nome do Arquivo *
                </label>
                <input
                  type="text"
                  value={attachmentFormData.fileName}
                  onChange={(e) =>
                    setAttachmentFormData({ ...attachmentFormData, fileName: e.target.value })
                  }
                  required
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Material Complementar"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo de Arquivo
                  </label>
                  <select
                    value={attachmentFormData.fileType}
                    onChange={(e) =>
                      setAttachmentFormData({ ...attachmentFormData, fileType: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PPT">PPT</option>
                    <option value="PPTX">PPTX</option>
                    <option value="DOC">DOC</option>
                    <option value="DOCX">DOCX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tier Mínimo *
                  </label>
                  <select
                    value={attachmentFormData.minimumTierId}
                    onChange={(e) =>
                      setAttachmentFormData({
                        ...attachmentFormData,
                        minimumTierId: Number.parseInt(e.target.value, 10),
                      })
                    }
                    required
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Arquivo *
                </label>
                <input
                  ref={attachmentFileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  required
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !!uploadingAttachment}
                className="w-full px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isPending ? 'Criando...' : uploadingAttachment ? 'Enviando...' : 'Adicionar Anexo'}
              </button>
            </div>
          </form>

          {/* Attachments List */}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Anexos Criados</h5>
              {lesson.attachments.map((attachment) => {
                const isUploading = uploadingAttachment === attachment.id
                const progress = attachmentUploadProgress[attachment.id] || 0

                return (
                  <div
                    key={attachment.id}
                    className="p-2.5 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-gray-900 block truncate">
                            {attachment.file_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {attachment.file_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {attachment.file_url ? (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                            Enviado
                          </span>
                        ) : isUploading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Aguardando
                          </span>
                        )}
                        {attachment.file_url && (
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            disabled={isPending}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            aria-label="Excluir anexo"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

