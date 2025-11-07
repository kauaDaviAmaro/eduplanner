import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllTiers, getAllCourses } from '@/lib/queries/courses'
import { NewFilePageClient } from './new-file-client'

export default async function NewFilePage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const [tiers, courses] = await Promise.all([getAllTiers(), getAllCourses()])

  return <NewFilePageClient courses={courses} tiers={tiers} />
}
