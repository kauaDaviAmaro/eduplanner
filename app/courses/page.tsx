import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import {
  getAllCoursesWithProgress,
  getFavoriteCourseIds,
  getAllTiers,
  getPublicCourses,
  type Course,
} from '@/lib/queries/courses'
import { getAllTiers as getAllTiersFromSubscriptions } from '@/lib/queries/subscriptions'
import { CourseCard } from '@/components/courses/course-card'
import { CoursesFilters } from '@/components/courses/courses-filters'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

type ProgressFilter = 'all' | 'in-progress' | 'not-started' | 'completed'
type SortOption = 'date' | 'title' | 'progress'

interface CoursesPageProps {
  readonly searchParams: Promise<{
    search?: string
    progress?: string
    tier?: string
    sort?: string
  }>
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
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
  let favoriteIds = new Set<string>()
  let allTiers: Awaited<ReturnType<typeof getAllTiersFromSubscriptions>> = []
  let isAdmin = false

  if (isAuthenticated && session?.user) {
    profile = await getCurrentUserProfile()
    if (profile) {
      favoriteIds = await getFavoriteCourseIds()
      allTiers = await getAllTiersFromSubscriptions()
      isAdmin = session.user.isAdmin || false
    }
  }

  const params = await searchParams
  const search = params.search || ''
  const progressFilter = (params.progress as ProgressFilter) || 'all'
  const tierFilter = params.tier || 'all'
  const sortBy = (params.sort as SortOption) || 'date'

  // Get courses based on authentication status
  const tiers = await getAllTiers()
  
  let courses: (Course | Awaited<ReturnType<typeof getAllCoursesWithProgress>>[number])[] = []
  if (isAuthenticated) {
    courses = await getAllCoursesWithProgress()
  } else {
    courses = await getPublicCourses(1000) // Get all public courses
  }

  const tierMap = new Map(tiers.map((tier) => [tier.id, tier]))

  const coursesWithTiers = courses.map((course) => {
    const tier = tierMap.get(course.minimum_tier_id) || null
    return { course, tier }
  })

  let filteredCourses = coursesWithTiers

  if (search) {
    const searchLower = search.toLowerCase()
    filteredCourses = filteredCourses.filter(
      ({ course }) =>
        course.title.toLowerCase().includes(searchLower) ||
        (course.description?.toLowerCase().includes(searchLower) ?? false)
    )
  }

  // Only apply progress filter if user is authenticated
  if (isAuthenticated) {
    if (progressFilter === 'in-progress') {
      filteredCourses = filteredCourses.filter(
        ({ course }) => 'progress' in course && course.progress.percentage > 0 && course.progress.percentage < 100
      )
    } else if (progressFilter === 'not-started') {
      filteredCourses = filteredCourses.filter(
        ({ course }) => 'progress' in course && course.progress.percentage === 0 && course.progress.total > 0
      )
    } else if (progressFilter === 'completed') {
      filteredCourses = filteredCourses.filter(
        ({ course }) => 'progress' in course && course.progress.percentage === 100
      )
    }
  }

  if (tierFilter !== 'all') {
    const tierId = Number.parseInt(tierFilter, 10)
    filteredCourses = filteredCourses.filter(
      ({ course }) => course.minimum_tier_id === tierId
    )
  }

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'title') {
      return a.course.title.localeCompare(b.course.title)
    } else if (sortBy === 'progress' && isAuthenticated) {
      const aProgress = 'progress' in a.course ? a.course.progress.percentage : 0
      const bProgress = 'progress' in b.course ? b.course.progress.percentage : 0
      return bProgress - aProgress
    } else {
      return (
        new Date(b.course.created_at).getTime() - new Date(a.course.created_at).getTime()
      )
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && profile ? (
        <Navbar 
          userName={profile.name || null} 
          currentPath="/courses"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cursos</h1>
          <p className="text-gray-600">
            Explore todos os cursos disponíveis e continue seu aprendizado
          </p>
        </div>

        {/* Filters */}
        <CoursesFilters tiers={tiers} isPublic={!isAuthenticated} />

        {/* Login CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mb-6 rounded-xl bg-blue-50 border-2 border-blue-200 p-6 text-center">
            <p className="text-base text-blue-900 mb-4 font-medium">
              Faça login para acessar os cursos, salvar seu progresso e adicionar aos favoritos!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login?redirect=/courses"
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Fazer Login
              </Link>
              <Link
                href="/signup?redirect=/courses"
                className="rounded-lg border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {sortedCourses.length === 0 ? (
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhum curso encontrado</h3>
            <p className="mt-2 text-sm text-gray-600">
              {search || progressFilter !== 'all' || tierFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar mais cursos.'
                : 'Não há cursos disponíveis no momento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCourses.map(({ course, tier }) => (
              <CourseCard
                key={course.id}
                course={course}
                isFavorite={isAuthenticated ? favoriteIds.has(course.id) : false}
                tier={tier}
                isPublic={!isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {sortedCourses.length > 0 && (
          <div className="mt-6 text-sm text-gray-600">
            Mostrando {sortedCourses.length} de {courses.length} cursos
          </div>
        )}
      </main>
    </div>
  )
}

