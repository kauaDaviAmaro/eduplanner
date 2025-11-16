import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { isBuildTimeError } from '@/lib/auth/build-error'
import { getCourseById, hasCourseAccess } from '@/lib/queries/courses'
import { getCourseProgress } from '@/lib/queries/user-progress'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { CourseViewer } from '@/components/courses/course-viewer'
import { Navbar } from '@/components/layout/navbar'
import { getCurrentUserProfile } from '@/lib/queries/profiles'

export default async function CoursePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>
}>) {
  const { id } = await params
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

  const hasAccess = await hasCourseAccess(id)

  if (!hasAccess) {
    redirect('/upgrade')
  }

  const course = await getCourseById(id)
  const profile = await getCurrentUserProfile()
  const userId = await getCurrentUserId()

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-semibold">Curso não encontrado</h1>
      </div>
    )
  }

  const progress = userId ? await getCourseProgress(userId, id) : []

  const allTiers = await getAllTiers()
  const isAdmin = session.user.isAdmin || false

  // Calculate course stats
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedLessons = progress.filter((p) => p.is_completed).length
  const courseProgressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30">
      <Navbar 
        userName={profile?.name || null} 
        currentPath={`/courses/${id}`}
        isAdmin={isAdmin}
        currentTierId={profile?.tier_id}
        tiers={allTiers}
      />
      
      {/* Breadcrumbs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link 
              href="/dashboard" 
              className="hover:text-purple-600 transition-colors duration-200"
            >
              Dashboard
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link 
              href="/courses" 
              className="hover:text-purple-600 transition-colors duration-200"
            >
              Cursos
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium truncate max-w-md">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* Elegant Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-5"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="max-w-4xl animate-fade-in">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                Curso Online
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-lg text-gray-600 mb-6 leading-relaxed max-w-3xl">
                {course.description}
              </p>
            )}
            
            {/* Course Stats */}
            <div className="flex flex-wrap items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-medium">{totalLessons} {totalLessons === 1 ? 'aula' : 'aulas'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium">{course.modules.length} {course.modules.length === 1 ? 'módulo' : 'módulos'}</span>
              </div>
              {totalLessons > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{courseProgressPercentage}% concluído</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {course.modules.length > 0 && course.modules.some((m) => m.lessons.length > 0) ? (
          <div className="animate-fade-in animate-delay-100">
            <CourseViewer course={course} initialProgress={progress} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center transform transition-all hover:shadow-xl">
              <div className="mb-6">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhuma aula disponível</h3>
              <p className="text-gray-600 leading-relaxed">
                Este curso ainda não possui aulas publicadas. 
                <br />
                Volte em breve para começar a aprender!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

