import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllAttachmentsForAdmin } from '@/lib/queries/admin'
import { getAllCourses, getAllTiers } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { Navbar } from '@/components/layout/navbar'
import { FileFilters } from '@/components/admin/file-filters'
import { FilesList } from '@/components/admin/files-list'
import Link from 'next/link'

type FileTypeFilter = 'all' | 'PDF' | 'PPT' | 'DOC' | 'XLS' | 'other'
type SortOption = 'date' | 'name' | 'course'

interface FilesPageProps {
  readonly searchParams: Promise<{
    search?: string
    course?: string
    fileType?: string
    tier?: string
    sort?: string
  }>
}

export default async function AdminFilesPage({ searchParams }: FilesPageProps) {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const search = params.search || ''
  const courseFilter = params.course || 'all'
  const fileTypeFilter = (params.fileType as FileTypeFilter) || 'all'
  const tierFilter = params.tier || 'all'
  const sortBy = (params.sort as SortOption) || 'date'

  // Fetch data
  const [attachments, courses, tiers, profile] = await Promise.all([
    getAllAttachmentsForAdmin(),
    getAllCourses(),
    getAllTiers(),
    getCurrentUserProfile(),
  ])

  // Apply filters
  let filteredAttachments = attachments

  // Search filter
  if (search) {
    const searchLower = search.toLowerCase()
    filteredAttachments = filteredAttachments.filter(
      (attachment) =>
        attachment.file_name.toLowerCase().includes(searchLower) ||
        (attachment.course_title && attachment.course_title.toLowerCase().includes(searchLower)) ||
        (attachment.lesson_title && attachment.lesson_title.toLowerCase().includes(searchLower))
    )
  }

  // Course filter
  if (courseFilter !== 'all') {
    if (courseFilter === 'no-course') {
      // Filter for files without course
      filteredAttachments = filteredAttachments.filter(
        (attachment) => !attachment.course_id
      )
    } else {
      filteredAttachments = filteredAttachments.filter(
        (attachment) => attachment.course_id === courseFilter
      )
    }
  }

  // File type filter
  if (fileTypeFilter !== 'all') {
    filteredAttachments = filteredAttachments.filter((attachment) => {
      const fileType = attachment.file_type.toUpperCase()
      if (fileTypeFilter === 'PDF') return fileType.includes('PDF')
      if (fileTypeFilter === 'PPT') return fileType.includes('PPT') || fileType.includes('POWERPOINT')
      if (fileTypeFilter === 'DOC') return fileType.includes('DOC') || fileType.includes('WORD')
      if (fileTypeFilter === 'XLS') return fileType.includes('XLS') || fileType.includes('EXCEL')
      if (fileTypeFilter === 'other') {
        return (
          !fileType.includes('PDF') &&
          !fileType.includes('PPT') &&
          !fileType.includes('POWERPOINT') &&
          !fileType.includes('DOC') &&
          !fileType.includes('WORD') &&
          !fileType.includes('XLS') &&
          !fileType.includes('EXCEL')
        )
      }
      return true
    })
  }

  // Tier filter
  if (tierFilter !== 'all') {
    const tierId = Number.parseInt(tierFilter, 10)
    filteredAttachments = filteredAttachments.filter(
      (attachment) => attachment.minimum_tier_id === tierId
    )
  }

  // Sort
  const sortedAttachments = [...filteredAttachments].sort((a, b) => {
    if (sortBy === 'name') {
      return a.file_name.localeCompare(b.file_name)
    } else if (sortBy === 'course') {
      const aTitle = a.course_title || 'Sem curso'
      const bTitle = b.course_title || 'Sem curso'
      return aTitle.localeCompare(bTitle)
    } else {
      // date (default)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null}
        currentPath="/admin/files"
        isAdmin={true}
        currentTierId={profile?.tier_id}
        tiers={tiers}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Arquivos</h1>
            <p className="text-gray-600">Gerencie todos os arquivos do sistema</p>
          </div>
          <Link
            href="/admin/files/new"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            Adicionar Arquivo
          </Link>
        </div>

        {/* Filters */}
        <FileFilters tiers={tiers} courses={courses} />

        {/* Files List */}
        <FilesList attachments={sortedAttachments} />
      </main>
    </div>
  )
}

