import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
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
  // Handle potential JWT session errors gracefully
  let session = null
  try {
    session = await auth()
  } catch (error) {
    // If there's a JWT session error (corrupted cookie or secret mismatch),
    // redirect to login to clear the session
    console.warn('Session error (likely corrupted cookie):', error)
    redirect('/login?error=' + encodeURIComponent('Sessão inválida. Por favor, faça login novamente.'))
  }

  // Check if user is authenticated
  if (!session?.user) {
    redirect('/login')
  }

  // Check if user has access to this course
  const hasAccess = await hasCourseAccess(id)

  if (!hasAccess) {
    redirect('/upgrade')
  }

  // Fetch the course with all modules, lessons, and attachments
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

  // Fetch user progress for this course
  const progress = userId ? await getCourseProgress(userId, id) : []

  // Get all tiers for admin tier selector
  const allTiers = await getAllTiers()
  const isAdmin = session.user.isAdmin || false

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null} 
        currentPath={`/courses/${id}`}
        isAdmin={isAdmin}
        currentTierId={profile?.tier_id}
        tiers={allTiers}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">{course.title}</h1>
          {course.description && (
            <p className="text-lg text-gray-600">{course.description}</p>
          )}
        </div>

        {course.modules.length > 0 && course.modules.some((m) => m.lessons.length > 0) ? (
          <CourseViewer course={course} initialProgress={progress} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Nenhuma aula disponível</h3>
            <p className="mt-2 text-sm text-gray-600">
              Este curso ainda não possui aulas publicadas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

