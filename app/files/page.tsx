import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getAllAttachments, getPublicAttachments, type AttachmentWithContext } from '@/lib/queries/attachments'
import { getAllCourses, getPublicCourses } from '@/lib/queries/courses'
import { getAllTiers } from '@/lib/queries/courses'
import { getAllTiers as getAllTiersFromSubscriptions } from '@/lib/queries/subscriptions'
import { queryMany } from '@/lib/db/client'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { Navbar } from '@/components/layout/navbar'
import { FilesFilters } from '@/components/files/files-filters'
import { FileCard } from '@/components/files/file-card'
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

export default async function FilesPage({ searchParams }: FilesPageProps) {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    if (!isBuildTimeError(error)) {
      console.warn('Session error (likely corrupted cookie):', error)
    }
    session = null
  }

  const isAuthenticated = !!session?.user
  let profile = null
  let allTiers: Awaited<ReturnType<typeof getAllTiersFromSubscriptions>> = []
  let isAdmin = false

  if (isAuthenticated && session?.user) {
    profile = await getCurrentUserProfile()
    if (profile) {
      allTiers = await getAllTiersFromSubscriptions()
      isAdmin = session.user.isAdmin || false
    }
  }

  const params = await searchParams
  const search = params.search || ''
  const courseFilter = params.course || 'all'
  const fileTypeFilter = (params.fileType as FileTypeFilter) || 'all'
  const tierFilter = params.tier || 'all'
  const sortBy = (params.sort as SortOption) || 'date'

  // Get attachments and courses based on authentication status
  const tiers = await getAllTiers()
  
  let attachments: AttachmentWithContext[] = []
  let courses: Awaited<ReturnType<typeof getAllCourses>> = []
  
  if (isAuthenticated) {
    [attachments, courses] = await Promise.all([
      getAllAttachments(),
      getAllCourses(),
    ])
  } else {
    [attachments, courses] = await Promise.all([
      getPublicAttachments(1000), // Get all public attachments
      getPublicCourses(1000), // Get all public courses for filter
    ])
  }

  const userId = isAuthenticated ? await getCurrentUserId() : null
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

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && profile ? (
        <Navbar 
          userName={profile.name || null} 
          currentPath="/files"
          isAdmin={isAdmin}
          currentTierId={profile.tier_id}
          tiers={allTiers}
        />
      ) : (
        <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">EduPlanner</span>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-6">
                  <Link
                    href="/courses"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Cursos
                  </Link>
                  <Link
                    href="/loja"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Loja
                  </Link>
                  <Link
                    href="/files"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Biblioteca
                  </Link>
                  <Link
                    href="/plans"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Planos
                  </Link>
                  <Link
                    href="/ajuda"
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    Ajuda
                  </Link>
                </div>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-indigo-700"
                >
                  Começar grátis
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Biblioteca de Arquivos</h1>
          <p className="text-gray-600">
            Visualize e baixe todos os materiais disponíveis nos seus cursos
          </p>
        </div>

        {/* Filters */}
        <FilesFilters tiers={tiers} courses={courses} isPublic={!isAuthenticated} />

        {/* Login CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mb-6 rounded-xl bg-blue-50 border-2 border-blue-200 p-6 text-center">
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
                isDownloaded={isAuthenticated ? downloadedIds.has(attachment.id) : false}
                isPublic={!isAuthenticated}
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

