import Link from 'next/link'
import type { AttachmentWithContext } from '@/lib/queries/attachments'

interface FilesSectionProps {
  files: AttachmentWithContext[]
}

export function FilesSection({ files }: Readonly<FilesSectionProps>) {
  if (files.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Arquivos Recentes</h3>
          <Link
            href="/files"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Ver todos
          </Link>
        </div>
        <p className="text-gray-600">Você ainda não baixou nenhum arquivo.</p>
      </div>
    )
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toUpperCase()
    if (type.includes('PDF')) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
      )
    } else if (type.includes('PPT') || type.includes('POWERPOINT')) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
      )
    } else if (type.includes('DOC') || type.includes('WORD')) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
      )
    } else if (type.includes('XLS') || type.includes('EXCEL')) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
      )
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
        <svg
          className="h-6 w-6 text-gray-600"
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
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Hoje'
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`
    } else {
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Arquivos Recentes</h3>
        <Link
          href="/files"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Ver todos →
        </Link>
      </div>
      <div className="space-y-3">
        {files.map((file) => (
          <Link
            key={file.id}
            href={`/files?search=${encodeURIComponent(file.file_name)}`}
            className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            {/* File Icon */}
            <div className="flex-shrink-0">{getFileIcon(file.file_type)}</div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                {file.file_name}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-gray-500 truncate">{file.course_title}</p>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">{file.file_type}</span>
              </div>
            </div>

            {/* Badge */}
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {file.tier_name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

