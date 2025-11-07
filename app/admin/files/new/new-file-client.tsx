'use client'

import { useRouter } from 'next/navigation'
import { FileForm } from '@/components/admin/file-form'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'
import type { Course } from '@/lib/queries/courses'
import type { Database } from '@/types/database'

type Tier = Database['public']['Tables']['tiers']['Row']

interface NewFilePageClientProps {
  courses: Course[]
  tiers: Tier[]
}

export function NewFilePageClient({ courses, tiers }: NewFilePageClientProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/admin/files" className="text-gray-500 hover:text-gray-700">
                Arquivos
              </Link>
            </li>
            <li>
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">Novo Arquivo</span>
            </li>
          </ol>
        </nav>

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/admin/files"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para lista de arquivos
          </Link>
        </div>

        {/* Form Card */}
        <FileForm
          courses={courses}
          tiers={tiers}
          onSuccess={() => {
            router.push('/admin/files')
            router.refresh()
          }}
        />
      </main>
    </div>
  )
}

