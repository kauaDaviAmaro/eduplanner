'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { checkAndCreateCertificate } from '@/lib/queries/dashboard'
import { query, queryOne } from '@/lib/db/client'
import { Database } from '@/types/database'

type FavoriteInsert = Database['public']['Tables']['favorites']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
type LessonPlanInsert = Database['public']['Tables']['lesson_plans']['Insert']
type LessonPlanUpdate = Database['public']['Tables']['lesson_plans']['Update']

/**
 * Mark a course, lesson, or attachment as favorite
 */
export async function markAsFavorite(
  courseId?: string,
  lessonId?: string,
  attachmentId?: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  if (!courseId && !lessonId && !attachmentId) {
    return { success: false, error: 'É necessário especificar curso, aula ou anexo' }
  }

  try {
    await query(
      `INSERT INTO favorites (user_id, course_id, lesson_id, attachment_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, courseId || null, lessonId || null, attachmentId || null]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    // If it's a duplicate, that's okay
    if (error.code === '23505') {
      return { success: true }
    }
    return { success: false, error: error.message || 'Erro ao adicionar favorito' }
  }
}

/**
 * Remove a favorite
 */
export async function removeFavorite(favoriteId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  try {
    await query(
      `DELETE FROM favorites WHERE id = $1 AND user_id = $2`,
      [favoriteId, userId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao remover favorito' }
  }
}

/**
 * Get certificate info (check if available)
 */
export async function getCertificateInfo(courseId: string): Promise<{
  success: boolean
  available: boolean
  certificateId?: string
  error?: string
}> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, available: false, error: 'Usuário não autenticado' }
  }

  // Check if certificate exists or can be created
  const certificate = await checkAndCreateCertificate(userId, courseId)

  if (!certificate) {
    return { success: true, available: false }
  }

  return {
    success: true,
    available: true,
    certificateId: certificate.id,
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  try {
    await query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao marcar notificação como lida' }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  try {
    await query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao marcar notificações como lidas' }
  }
}

/**
 * Create a lesson plan
 */
export async function createLessonPlan(data: {
  title: string
  courseId?: string
  items?: Array<{ text: string; completed: boolean }>
  dueDate?: string
}): Promise<{ success: boolean; lessonPlanId?: string; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  if (!data.title) {
    return { success: false, error: 'Título é obrigatório' }
  }

  try {
    const lessonPlan = await queryOne<{ id: string }>(
      `INSERT INTO lesson_plans (user_id, title, course_id, items, due_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id`,
      [
        userId,
        data.title,
        data.courseId || null,
        JSON.stringify(data.items || []),
        data.dueDate || null,
      ]
    )

    if (!lessonPlan) {
      return { success: false, error: 'Erro ao criar planejamento' }
    }

    revalidatePath('/dashboard')
    return { success: true, lessonPlanId: lessonPlan.id }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao criar planejamento' }
  }
}

/**
 * Update a lesson plan
 */
export async function updateLessonPlan(
  planId: string,
  data: {
    title?: string
    courseId?: string | null
    items?: Array<{ text: string; completed: boolean }>
    dueDate?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  const updates: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    params.push(data.title)
  }
  if (data.courseId !== undefined) {
    updates.push(`course_id = $${paramIndex++}`)
    params.push(data.courseId)
  }
  if (data.items !== undefined) {
    updates.push(`items = $${paramIndex++}`)
    params.push(JSON.stringify(data.items))
  }
  if (data.dueDate !== undefined) {
    updates.push(`due_date = $${paramIndex++}`)
    params.push(data.dueDate)
  }

  if (updates.length === 0) {
    return { success: true }
  }

  updates.push(`updated_at = NOW()`)
  params.push(planId, userId)

  try {
    await query(
      `UPDATE lesson_plans
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`,
      params
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar planejamento' }
  }
}

/**
 * Delete a lesson plan
 */
export async function deleteLessonPlan(planId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  try {
    await query(
      `DELETE FROM lesson_plans WHERE id = $1 AND user_id = $2`,
      [planId, userId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao deletar planejamento' }
  }
}

/**
 * Record a download
 * Note: This function should only be called after verifying permissions via canDownloadAttachment()
 * The API route /api/downloads/[attachmentId] handles verification and recording automatically
 */
export async function recordDownload(attachmentId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  // Verify permissions before recording
  const { canDownloadAttachment } = await import('@/lib/queries/attachments')
  const canDownload = await canDownloadAttachment(attachmentId)

  if (!canDownload.canDownload) {
    return { success: false, error: canDownload.reason || 'Você não pode baixar este anexo' }
  }

  try {
    await query(
      `INSERT INTO user_downloads (user_id, attachment_id, downloaded_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, attachment_id) DO UPDATE
       SET downloaded_at = NOW()`,
      [userId, attachmentId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao registrar download' }
  }
}
