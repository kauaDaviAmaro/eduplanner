'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAttachment } from '@/app/actions/courses'
import type { AttachmentForAdmin } from '@/lib/queries/admin'

interface FilesListProps {
  attachments: AttachmentForAdmin[]
  onDelete?: () => void
}

type FileTypeFilter = 'all' | 'PDF' | 'PPT' | 'DOC' | 'XLS' | 'other'
type SortOption = 'date' | 'name' | 'course'

export function FilesList({ attachments, onDelete }: FilesListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) {
      return
    }

    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteAttachment(id)
      if (result.success) {
        if (onDelete) {
          onDelete()
        }
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase()
    if (type.includes('PDF')) {
      return (
        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('PPT') || type.includes('POWERPOINT')) {
      return (
        <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('DOC') || type.includes('WORD')) {
      return (
        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    } else if (type.includes('XLS') || type.includes('EXCEL')) {
      return (
        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      )
    }
    return (
      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )
  }

  if (attachments.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum arquivo encontrado</h3>
        <p className="mt-2 text-sm text-gray-600">Não há arquivos disponíveis no momento.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arquivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curso / Aula
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attachments.map((attachment) => (
              <tr key={attachment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">{getFileIcon(attachment.file_type)}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {attachment.file_name}
                      </div>
                      {attachment.file_url ? (
                        <div className="text-xs text-green-600">Arquivo enviado</div>
                      ) : (
                        <div className="text-xs text-gray-500">Aguardando upload</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {attachment.course_title ? (
                    <>
                      <div className="text-sm text-gray-900">{attachment.course_title}</div>
                      {attachment.lesson_title && (
                        <div className="text-xs text-gray-500">{attachment.lesson_title}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-purple-600 font-medium">Arquivo Geral (sem curso)</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{attachment.file_type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {attachment.tier_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(attachment.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/admin/files/${attachment.id}/edit`}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deletingId === attachment.id || isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === attachment.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Total: {attachments.length} arquivo{attachments.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

