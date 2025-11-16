'use client'

import { useState } from 'react'
import type { AttachmentWithContext } from '@/lib/queries/attachments'
import { FilePreviewModal } from './file-preview-modal'

interface FileCardProps {
  attachment: AttachmentWithContext
  isDownloaded?: boolean
  isPublic?: boolean
}

export function FileCard({ attachment, isDownloaded = false, isPublic = false }: FileCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase()
    if (type.includes('PDF')) {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('PPT') || type.includes('POWERPOINT')) {
      return (
        <svg className="h-8 w-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('DOC') || type.includes('WORD')) {
      return (
        <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('XLS') || type.includes('EXCEL')) {
      return (
        <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    }
    return (
      <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )
  }

  const handleOpenPreview = () => {
    if (isPublic) return
    setIsPreviewOpen(true)
  }

  const handleDownloadComplete = () => {
    // Refresh the page to update download status
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all p-6 ${!isPublic ? 'cursor-pointer' : ''}`} onClick={!isPublic ? handleOpenPreview : undefined}>
        <div className="flex items-start space-x-4">
          {/* File Icon */}
          <div className="flex-shrink-0">{getFileIcon(attachment.file_type)}</div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {attachment.file_name}
            </h3>

            <div className="space-y-1 text-sm text-gray-600 mb-3">
              {attachment.course_title ? (
                <>
                  <p>
                    <span className="font-medium">Curso:</span> {attachment.course_title}
                  </p>
                  {attachment.lesson_title && (
                    <p>
                      <span className="font-medium">Aula:</span> {attachment.lesson_title}
                    </p>
                  )}
                  {attachment.module_title && (
                    <p>
                      <span className="font-medium">Módulo:</span> {attachment.module_title}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-purple-600 font-medium">Arquivo Geral (sem curso)</p>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {attachment.tier_name}
              </span>
              <span className="text-xs text-gray-500">• {attachment.file_type}</span>
              {!isPublic && isDownloaded && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Baixado
                </span>
              )}
            </div>

            {/* Preview Button (only if not public) */}
            {!isPublic && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenPreview()
                }}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>Visualizar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal (only if not public) */}
      {!isPublic && (
        <FilePreviewModal
          attachment={attachment}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onDownload={handleDownloadComplete}
        />
      )}
    </>
  )
}

