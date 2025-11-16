'use client'

import Link from 'next/link'
import type { AttachmentWithContext } from '@/lib/queries/attachments'
import { FileCard } from './file-card'

interface FeaturedFilesSectionProps {
  files: AttachmentWithContext[]
  isAuthenticated: boolean
}

export function FeaturedFilesSection({
  files,
  isAuthenticated,
}: FeaturedFilesSectionProps) {
  if (files.length === 0) {
    return null
  }

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Biblioteca de Arquivos
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Acesse materiais exclusivos, PDFs, apresentações e muito mais
          </p>
        </div>

        {/* Files Grid */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {files.map((file) => (
            <FileCard
              key={file.id}
              attachment={file}
              isPublic={!isAuthenticated}
            />
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-12 text-center">
          <Link
            href="/files"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl"
          >
            Ver todos os arquivos
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Login CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-8 rounded-xl bg-blue-50 border-2 border-blue-200 p-6 text-center max-w-2xl mx-auto">
            <p className="text-base text-blue-900 mb-4 font-medium">
              Faça login para visualizar e baixar os arquivos da biblioteca!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login?redirect=/files"
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Fazer Login
              </Link>
              <Link
                href="/signup?redirect=/files"
                className="rounded-lg border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

