import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAllTiers, getAllCourses } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { NewFilePageClient } from './new-file-client'

export default async function NewFilePage() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const [tiers, courses, profile] = await Promise.all([
    getAllTiers(),
    getAllCourses(),
    getCurrentUserProfile(),
  ])

  return (
    <NewFilePageClient
      courses={courses}
      tiers={tiers}
      userName={profile?.name || null}
      currentTierId={profile?.tier_id}
    />
  )
}
