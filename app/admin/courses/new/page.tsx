import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllTiers } from '@/lib/queries/courses'
import { CourseBuilder } from '@/components/admin/course-builder'
import { Navbar } from '@/components/layout/navbar'

export default async function NewCoursePage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const tiers = await getAllTiers()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseBuilder tiers={tiers} />
      </main>
    </div>
  )
}

