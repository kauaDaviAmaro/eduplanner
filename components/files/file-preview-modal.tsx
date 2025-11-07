'use client'

import { useState, useEffect } from 'react'
import type { AttachmentWithContext } from '@/lib/queries/attachments'

interface FilePreviewModalProps {
  attachment: AttachmentWithContext
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
}

export function FilePreviewModal({ attachment, isOpen, onClose, onDownload }: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [userPermissionLevel, setUserPermissionLevel] = useState<number | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  // Check user permission level when modal opens
  useEffect(() => {
    if (isOpen && attachment) {
      checkUserAccess()
    } else {
      setPreviewUrl(null)
      setPreviewError(null)
      setUserPermissionLevel(null)
      setIsCheckingAccess(true)
    }
  }, [isOpen, attachment?.id])

  const checkUserAccess = async () => {
    setIsCheckingAccess(true)
    try {
      const response = await fetch('/api/user/permission-level')
      if (response.ok) {
        const data = await response.json()
        setUserPermissionLevel(data.permissionLevel)
        
        // If user has access, load preview
        if (data.permissionLevel >= attachment.tier_permission_level) {
          loadPreviewUrl()
        }
      } else {
        setPreviewError('Erro ao verificar permissões')
      }
    } catch (error) {
      setPreviewError('Erro ao verificar permissões')
    } finally {
      setIsCheckingAccess(false)
    }
  }

  const loadPreviewUrl = async () => {
    setIsLoadingPreview(true)
    setPreviewError(null)

    try {
      const response = await fetch(`/api/preview/${attachment.id}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao carregar preview')
      }

      const data = await response.json()
      setPreviewUrl(data.url)
    } catch (err: any) {
      setPreviewError(err.message || 'Erro ao carregar preview do arquivo')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(`/api/downloads/${attachment.id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao baixar arquivo')
      }

      const data = await response.json()

      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.url
      link.download = attachment.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Call onDownload callback if provided
      if (onDownload) {
        onDownload()
      }
    } catch (err: any) {
      setDownloadError(err.message || 'Erro ao baixar arquivo')
    } finally {
      setIsDownloading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase()
    if (type.includes('PDF')) {
      return (
        <svg className="h-16 w-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('PPT') || type.includes('POWERPOINT')) {
      return (
        <svg className="h-16 w-16 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('DOC') || type.includes('WORD')) {
      return (
        <svg className="h-16 w-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('XLS') || type.includes('EXCEL')) {
      return (
        <svg className="h-16 w-16 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    }
    return (
      <svg className="h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )
  }

  const canPreview = (fileType: string): boolean => {
    const type = fileType.toUpperCase()
    return type.includes('PDF') || type.includes('IMAGE') || type.includes('PNG') || type.includes('JPG') || type.includes('JPEG')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0">{getFileIcon(attachment.file_type)}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {attachment.file_name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{attachment.file_type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fechar"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Preview Section */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview</h3>
                <div className="border border-gray-200 rounded-lg bg-gray-50 min-h-[400px] flex items-center justify-center">
                  {isCheckingAccess ? (
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="animate-spin h-8 w-8 text-purple-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-sm text-gray-600">Verificando acesso...</p>
                    </div>
                  ) : userPermissionLevel !== null && userPermissionLevel < attachment.tier_permission_level ? (
                    <div className="text-center p-8 max-w-md">
                      <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Acesso Restrito
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Este arquivo requer o tier <span className="font-semibold text-purple-600">{attachment.tier_name || 'Premium'}</span> para visualização.
                      </p>
                      <p className="text-xs text-gray-500 mb-6">
                        Faça upgrade do seu plano para acessar este conteúdo.
                      </p>
                      <a
                        href="/upgrade"
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Fazer Upgrade
                      </a>
                    </div>
                  ) : isLoadingPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="animate-spin h-8 w-8 text-purple-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-sm text-gray-600">Carregando preview...</p>
                    </div>
                  ) : previewError ? (
                    <div className="text-center p-6">
                      <p className="text-sm text-red-600 mb-2">{previewError}</p>
                      <button
                        onClick={loadPreviewUrl}
                        className="text-sm text-purple-600 hover:text-purple-700 underline"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : previewUrl && canPreview(attachment.file_type) ? (
                    <div className="w-full h-full">
                      {attachment.file_type.toUpperCase().includes('PDF') ? (
                        <iframe
                          src={previewUrl}
                          className="w-full h-[600px] rounded-lg"
                          title="Preview do arquivo"
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt={attachment.file_name}
                          className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      {getFileIcon(attachment.file_type)}
                      <p className="text-sm text-gray-600 mt-4">
                        Preview não disponível para este tipo de arquivo
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Use o botão de download para acessar o arquivo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="lg:col-span-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Informações</h3>
                <div className="space-y-4">
                  {/* File Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Nome do Arquivo
                      </p>
                      <p className="text-sm text-gray-900 mt-1 break-words">
                        {attachment.file_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Tipo
                      </p>
                      <p className="text-sm text-gray-900 mt-1">{attachment.file_type}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Tier Requerido
                      </p>
                      {attachment.tier_name && attachment.tier_name !== 'N/A' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                          {attachment.tier_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                          Não disponível
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course Context */}
                  {attachment.course_title && (
                    <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                        Contexto do Curso
                      </p>
                      <div>
                        <p className="text-xs text-purple-600 font-medium">Curso:</p>
                        <p className="text-sm text-purple-900 mt-1">{attachment.course_title}</p>
                      </div>
                      {attachment.module_title && (
                        <div>
                          <p className="text-xs text-purple-600 font-medium">Módulo:</p>
                          <p className="text-sm text-purple-900 mt-1">{attachment.module_title}</p>
                        </div>
                      )}
                      {attachment.lesson_title && (
                        <div>
                          <p className="text-xs text-purple-600 font-medium">Aula:</p>
                          <p className="text-sm text-purple-900 mt-1">{attachment.lesson_title}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!attachment.course_title && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Tipo
                      </p>
                      <p className="text-sm text-purple-600 font-medium">
                        Arquivo Geral (sem curso)
                      </p>
                    </div>
                  )}

                  {/* Download Error */}
                  {downloadError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{downloadError}</p>
                    </div>
                  )}

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    {isDownloading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Baixando...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        <span>Baixar Arquivo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

