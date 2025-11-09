import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getAllAttachments, type AttachmentWithContext } from '@/lib/queries/attachments'
import { getAllCourses } from '@/lib/queries/courses'
import { getAllTiers } from '@/lib/queries/courses'
import { getAllTiers as getAllTiersFromSubscriptions } from '@/lib/queries/subscriptions'
import { queryMany } from '@/lib/db/client'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { Navbar } from '@/components/layout/navbar'
import { FilesFilters } from '@/components/files/files-filters'
import { FileCard } from '@/components/files/file-card'

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

export default async function FilesPage({ searchParams }: FilesPageProps) {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    redirect('/login?error=' + encodeURIComponent('Sessão inválida. Por favor, faça login novamente.'))
  }

  if (!session?.user) {
    redirect('/login')
  }

  const profile = await getCurrentUserProfile()
  if (!profile) {
    redirect('/login?error=' + encodeURIComponent('Perfil não encontrado'))
  }

  const params = await searchParams
  const search = params.search || ''
  const courseFilter = params.course || 'all'
  const fileTypeFilter = (params.fileType as FileTypeFilter) || 'all'
  const tierFilter = params.tier || 'all'
  const sortBy = (params.sort as SortOption) || 'date'

  const [attachments, courses, tiers] = await Promise.all([
    getAllAttachments(),
    getAllCourses(),
    getAllTiers(),
  ])

  const userId = await getCurrentUserId()
  const downloadedAttachments = userId
    ? await queryMany<{ attachment_id: string }>(
        `SELECT attachment_id FROM user_downloads WHERE user_id = $1`,
        [userId]
      )
    : []
  const downloadedIds = new Set(downloadedAttachments.map((d) => d.attachment_id))

  const tierMap = new Map(tiers.map((tier) => [tier.id, tier]))

  let filteredAttachments = attachments

  if (search) {
    const searchLower = search.toLowerCase()
    filteredAttachments = filteredAttachments.filter(
      (attachment) =>
        attachment.file_name.toLowerCase().includes(searchLower) ||
        (attachment.course_title && attachment.course_title.toLowerCase().includes(searchLower)) ||
        (attachment.lesson_title && attachment.lesson_title.toLowerCase().includes(searchLower))
    )
  }

  if (courseFilter !== 'all') {
    if (courseFilter === 'no-course') {
      filteredAttachments = filteredAttachments.filter(
        (attachment) => !attachment.course_id
      )
    } else {
      filteredAttachments = filteredAttachments.filter(
        (attachment) => attachment.course_id === courseFilter
      )
    }
  }

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

  if (tierFilter !== 'all') {
    const tierId = Number.parseInt(tierFilter, 10)
    filteredAttachments = filteredAttachments.filter(
      (attachment) => attachment.minimum_tier_id === tierId
    )
  }

  const sortedAttachments = [...filteredAttachments].sort((a, b) => {
    if (sortBy === 'name') {
      return a.file_name.localeCompare(b.file_name)
    } else if (sortBy === 'course') {
      const aTitle = a.course_title || 'Sem curso'
      const bTitle = b.course_title || 'Sem curso'
      return aTitle.localeCompare(bTitle)
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const allTiers = await getAllTiersFromSubscriptions()
  const isAdmin = session.user.isAdmin || false

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null} 
        currentPath="/files"
        isAdmin={isAdmin}
        currentTierId={profile?.tier_id}
        tiers={allTiers}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Biblioteca de Arquivos</h1>
          <p className="text-gray-600">
            Visualize e baixe todos os materiais disponíveis nos seus cursos
          </p>
        </div>

        {/* Filters */}
        <FilesFilters tiers={tiers} courses={courses} />

        {/* Files Grid */}
        {sortedAttachments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
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
            <p className="mt-2 text-sm text-gray-600">
              {search || courseFilter !== 'all' || fileTypeFilter !== 'all' || tierFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar mais arquivos.'
                : 'Não há arquivos disponíveis no momento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedAttachments.map((attachment) => (
              <FileCard
                key={attachment.id}
                attachment={attachment}
                isDownloaded={downloadedIds.has(attachment.id)}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {sortedAttachments.length > 0 && (
          <div className="mt-6 text-sm text-gray-600">
            Mostrando {sortedAttachments.length} de {attachments.length} arquivos
          </div>
        )}
      </main>
    </div>
  )
}

