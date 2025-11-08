import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAttachmentByIdForAdmin } from '@/lib/queries/admin'
import { getAllTiers, getAllCourses } from '@/lib/queries/courses'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { EditFilePageClient } from './edit-file-client'

interface EditFilePageProps {
  params: Promise<{ id: string }>
}

export default async function EditFilePage({ params }: EditFilePageProps) {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/dashboard')
  }

  const { id } = await params
  const [attachment, tiers, courses, profile] = await Promise.all([
    getAttachmentByIdForAdmin(id),
    getAllTiers(),
    getAllCourses(),
    getCurrentUserProfile(),
  ])

  if (!attachment) {
    redirect('/admin/files')
  }

  return (
    <EditFilePageClient
      attachment={attachment}
      courses={courses}
      tiers={tiers}
      userName={profile?.name || null}
      currentTierId={profile?.tier_id}
    />
  )
}

