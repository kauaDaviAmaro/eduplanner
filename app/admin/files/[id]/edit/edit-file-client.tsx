'use client'

import { useRouter } from 'next/navigation'
import { FileForm } from '@/components/admin/file-form'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'
import type { Course } from '@/lib/queries/courses'
import type { Database } from '@/types/database'
import type { AttachmentForAdmin } from '@/lib/queries/admin'

type Tier = Database['public']['Tables']['tiers']['Row']

interface EditFilePageClientProps {
  attachment: AttachmentForAdmin
  courses: Course[]
  tiers: Tier[]
}

export function EditFilePageClient({ attachment, courses, tiers }: EditFilePageClientProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin/files"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium mb-4 inline-block"
          >
            ← Voltar para lista de arquivos
          </Link>
        </div>
        <FileForm
          attachment={attachment}
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

