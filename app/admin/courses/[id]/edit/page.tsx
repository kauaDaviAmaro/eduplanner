import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllTiers, getCourseById } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { CourseBuilder } from '@/components/admin/course-builder'
import { Navbar } from '@/components/layout/navbar'

interface EditCoursePageProps {
  params: Promise<{ id: string }>
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const { id } = await params
  const [course, tiers, profile] = await Promise.all([
    getCourseById(id),
    getAllTiers(),
    getCurrentUserProfile(),
  ])

  if (!course) {
    redirect('/admin/courses/new')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null}
        currentPath={`/admin/courses/${id}/edit`}
        isAdmin={true}
        currentTierId={profile?.tier_id}
        tiers={tiers}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseBuilder course={course} tiers={tiers} />
      </main>
    </div>
  )
}

