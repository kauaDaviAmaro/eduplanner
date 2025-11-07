import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/helpers'
import { getAttachmentByIdForAdmin } from '@/lib/queries/admin'
import { getAllTiers, getAllCourses } from '@/lib/queries/courses'
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
  const [attachment, tiers, courses] = await Promise.all([
    getAttachmentByIdForAdmin(id),
    getAllTiers(),
    getAllCourses(),
  ])

  if (!attachment) {
    redirect('/admin/files')
  }

  return <EditFilePageClient attachment={attachment} courses={courses} tiers={tiers} />
}

