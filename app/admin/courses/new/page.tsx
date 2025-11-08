import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllTiers } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { CourseBuilder } from '@/components/admin/course-builder'
import { Navbar } from '@/components/layout/navbar'

export default async function NewCoursePage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const [tiers, profile] = await Promise.all([
    getAllTiers(),
    getCurrentUserProfile(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName={profile?.name || null}
        currentPath="/admin/courses/new"
        isAdmin={true}
        currentTierId={profile?.tier_id}
        tiers={tiers}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseBuilder tiers={tiers} />
      </main>
    </div>
  )
}

