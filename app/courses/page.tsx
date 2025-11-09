import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import {
  getAllCoursesWithProgress,
  getFavoriteCourseIds,
  getAllTiers,
} from '@/lib/queries/courses'
import { getAllTiers as getAllTiersFromSubscriptions } from '@/lib/queries/subscriptions'
import { CourseCard } from '@/components/courses/course-card'
import { CoursesFilters } from '@/components/courses/courses-filters'
import { Navbar } from '@/components/layout/navbar'

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
  const progressFilter = (params.progress as ProgressFilter) || 'all'
  const tierFilter = params.tier || 'all'
  const sortBy = (params.sort as SortOption) || 'date'

  const [courses, favoriteIds, tiers] = await Promise.all([
    getAllCoursesWithProgress(),
    getFavoriteCourseIds(),
    getAllTiers(),
  ])

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

  if (progressFilter === 'in-progress') {
    filteredCourses = filteredCourses.filter(
      ({ course }) => course.progress.percentage > 0 && course.progress.percentage < 100
    )
  } else if (progressFilter === 'not-started') {
    filteredCourses = filteredCourses.filter(
      ({ course }) => course.progress.percentage === 0 && course.progress.total > 0
    )
  } else if (progressFilter === 'completed') {
    filteredCourses = filteredCourses.filter(
      ({ course }) => course.progress.percentage === 100
    )
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
    } else if (sortBy === 'progress') {
      return b.course.progress.percentage - a.course.progress.percentage
    } else {
      return (
        new Date(b.course.created_at).getTime() - new Date(a.course.created_at).getTime()
      )
    }
  })

  const allTiers = await getAllTiersFromSubscriptions()
  const isAdmin = session.user.isAdmin || false

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null} 
        currentPath="/courses"
        isAdmin={isAdmin}
        currentTierId={profile?.tier_id}
        tiers={allTiers}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cursos</h1>
          <p className="text-gray-600">
            Explore todos os cursos disponíveis e continue seu aprendizado
          </p>
        </div>

        {/* Filters */}
        <CoursesFilters tiers={tiers} />

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
                isFavorite={favoriteIds.has(course.id)}
                tier={tier}
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

