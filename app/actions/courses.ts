'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId, isAdmin } from '@/lib/auth/helpers'
import { query, queryOne, queryMany, transaction } from '@/lib/db/client'
import { v4 as uuidv4 } from 'uuid'
import { deleteFile, BUCKETS } from '@/lib/storage/client'

/**
 * Toggle favorite status for a course
 */
export async function toggleCourseFavorite(courseId: string): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, isFavorite: false, error: 'Usuário não autenticado' }
  }

  try {
    // Check if already favorited
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM favorites WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    )

    if (existing) {
      // Remove favorite
      await query(
        `DELETE FROM favorites WHERE id = $1 AND user_id = $2`,
        [existing.id, userId]
      )
      revalidatePath('/courses')
      revalidatePath('/dashboard')
      return { success: true, isFavorite: false }
    } else {
      // Add favorite
      await query(
        `INSERT INTO favorites (user_id, course_id, created_at)
         VALUES ($1, $2, NOW())`,
        [userId, courseId]
      )
      revalidatePath('/courses')
      revalidatePath('/dashboard')
      return { success: true, isFavorite: true }
    }
  } catch (error: any) {
    return { success: false, isFavorite: false, error: error.message || 'Erro ao atualizar favorito' }
  }
}

/**
 * Check if a course is favorited
 */
export async function isCourseFavorited(courseId: string): Promise<boolean> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return false
  }

  const favorite = await queryOne<{ id: string }>(
    `SELECT id FROM favorites WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId]
  )

  return favorite !== null
}

/**
 * Check if current user is admin
 */
async function checkAdmin(): Promise<void> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Acesso negado: apenas administradores podem realizar esta ação')
  }
}

/**
 * Create a new course (admin only)
 */
export async function createCourse(data: {
  title: string
  description?: string
  thumbnailUrl?: string
  minimumTierId: number
}): Promise<{ success: boolean; courseId?: string; error?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (!data.title || !data.title.trim()) {
      return { success: false, error: 'Título do curso é obrigatório' }
    }

    if (!data.minimumTierId) {
      return { success: false, error: 'Tier mínimo é obrigatório' }
    }

    // Verify tier exists
    const tier = await queryOne<{ id: number }>(
      'SELECT id FROM tiers WHERE id = $1',
      [data.minimumTierId]
    )

    if (!tier) {
      return { success: false, error: 'Tier especificado não existe' }
    }

    const courseId = uuidv4()

    await query(
      `INSERT INTO courses (id, title, description, thumbnail_url, minimum_tier_id, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
      [courseId, data.title.trim(), data.description?.trim() || null, data.thumbnailUrl || null, data.minimumTierId]
    )

    revalidatePath('/dashboard')
    revalidatePath('/admin/courses')
    return { success: true, courseId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao criar curso' }
  }
}

/**
 * Create a new module (admin only)
 */
export async function createModule(data: {
  courseId: string
  title: string
  order?: number
}): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (!data.title || !data.title.trim()) {
      return { success: false, error: 'Título do módulo é obrigatório' }
    }

    if (!data.courseId) {
      return { success: false, error: 'ID do curso é obrigatório' }
    }

    // Verify course exists
    const course = await queryOne<{ id: string }>(
      'SELECT id FROM courses WHERE id = $1',
      [data.courseId]
    )

    if (!course) {
      return { success: false, error: 'Curso não encontrado' }
    }

    // Get max order if not provided
    let order = data.order
    if (order === undefined) {
      const maxOrder = await queryOne<{ max_order: number | null }>(
        `SELECT MAX("order") as max_order FROM modules WHERE course_id = $1`,
        [data.courseId]
      )
      order = (maxOrder?.max_order ?? -1) + 1
    }

    const moduleId = uuidv4()

    await query(
      `INSERT INTO modules (id, course_id, title, "order", created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [moduleId, data.courseId, data.title.trim(), order]
    )

    revalidatePath('/dashboard')
    revalidatePath(`/admin/courses/${data.courseId}`)
    return { success: true, moduleId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao criar módulo' }
  }
}

/**
 * Create a new lesson (admin only)
 * Note: video_url and storage_key are initially null
 */
export async function createLesson(data: {
  moduleId: string
  title: string
  order?: number
}): Promise<{ success: boolean; lessonId?: string; error?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (!data.title || !data.title.trim()) {
      return { success: false, error: 'Título da aula é obrigatório' }
    }

    if (!data.moduleId) {
      return { success: false, error: 'ID do módulo é obrigatório' }
    }

    // Verify module exists
    const module = await queryOne<{ id: string }>(
      'SELECT id FROM modules WHERE id = $1',
      [data.moduleId]
    )

    if (!module) {
      return { success: false, error: 'Módulo não encontrado' }
    }

    // Get max order if not provided
    let order = data.order
    if (order === undefined) {
      const maxOrder = await queryOne<{ max_order: number | null }>(
        `SELECT MAX("order") as max_order FROM lessons WHERE module_id = $1`,
        [data.moduleId]
      )
      order = (maxOrder?.max_order ?? -1) + 1
    }

    const lessonId = uuidv4()

    await query(
      `INSERT INTO lessons (id, module_id, title, duration, video_url, storage_key, "order", created_at, updated_at)
       VALUES ($1, $2, $3, 0, NULL, NULL, $4, NOW(), NOW())`,
      [lessonId, data.moduleId, data.title.trim(), order]
    )

    revalidatePath('/dashboard')
    return { success: true, lessonId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao criar aula' }
  }
}

/**
 * Update lesson with video information after upload (admin only)
 */
export async function updateLessonVideo(data: {
  lessonId: string
  storageKey: string
  videoUrl: string
  duration?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (!data.lessonId || !data.storageKey || !data.videoUrl) {
      return { success: false, error: 'Dados incompletos para atualizar vídeo' }
    }

    // Verify lesson exists
    const lesson = await queryOne<{ id: string }>(
      'SELECT id FROM lessons WHERE id = $1',
      [data.lessonId]
    )

    if (!lesson) {
      return { success: false, error: 'Aula não encontrada' }
    }

    await query(
      `UPDATE lessons 
       SET storage_key = $1, video_url = $2, duration = COALESCE($3, duration), updated_at = NOW()
       WHERE id = $4`,
      [data.storageKey, data.videoUrl, data.duration || null, data.lessonId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar vídeo' }
  }
}

/**
 * Publish a course (admin only)
 */
export async function publishCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!courseId) {
      return { success: false, error: 'ID do curso é obrigatório' }
    }

    // Verify course exists
    const course = await queryOne<{ id: string }>(
      'SELECT id FROM courses WHERE id = $1',
      [courseId]
    )

    if (!course) {
      return { success: false, error: 'Curso não encontrado' }
    }

    await query(
      `UPDATE courses SET is_published = true, updated_at = NOW() WHERE id = $1`,
      [courseId]
    )

    revalidatePath('/dashboard')
    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao publicar curso' }
  }
}

/**
 * Unpublish a course (admin only)
 */
export async function unpublishCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!courseId) {
      return { success: false, error: 'ID do curso é obrigatório' }
    }

    await query(
      `UPDATE courses SET is_published = false, updated_at = NOW() WHERE id = $1`,
      [courseId]
    )

    revalidatePath('/dashboard')
    revalidatePath('/courses')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao despublicar curso' }
  }
}

/**
 * Create a new attachment (admin only)
 * Note: file_url and storage_key are initially null
 * lessonId is optional - if not provided, attachment will be accessible only by tier
 */
export async function createAttachment(data: {
  lessonId?: string | null
  fileName: string
  fileType: string
  minimumTierId: number
}): Promise<{ success: boolean; attachmentId?: string; error?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (!data.fileName || !data.fileName.trim()) {
      return { success: false, error: 'Nome do arquivo é obrigatório' }
    }

    if (!data.minimumTierId) {
      return { success: false, error: 'Tier mínimo é obrigatório' }
    }

    // Verify lesson exists only if lessonId is provided
    if (data.lessonId) {
      const lesson = await queryOne<{ id: string }>(
        'SELECT id FROM lessons WHERE id = $1',
        [data.lessonId]
      )

      if (!lesson) {
        return { success: false, error: 'Aula não encontrada' }
      }
    }

    // Verify tier exists
    const tier = await queryOne<{ id: number }>(
      'SELECT id FROM tiers WHERE id = $1',
      [data.minimumTierId]
    )

    if (!tier) {
      return { success: false, error: 'Tier especificado não existe' }
    }

    const attachmentId = uuidv4()

    // Try to apply migration 006 if it hasn't been applied yet
    // This is a fallback in case the migration wasn't run
    try {
      await query(
        `DO $$ 
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'attachments' 
            AND column_name = 'lesson_id' 
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE attachments ALTER COLUMN lesson_id DROP NOT NULL;
          END IF;
        END $$;`
      )
    } catch (migrationError) {
      // Migration might already be applied or there's a different issue
      // Continue with the insert attempt
      console.warn('Migration check failed (might already be applied):', migrationError)
    }

    await query(
      `INSERT INTO attachments (id, lesson_id, file_name, file_type, file_url, minimum_tier_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NULL, $5, NOW(), NOW())`,
      [attachmentId, data.lessonId || null, data.fileName.trim(), data.fileType, data.minimumTierId]
    )

    revalidatePath('/dashboard')
    return { success: true, attachmentId }
  } catch (error: any) {
    // Check if error is about NOT NULL constraint
    if (error.message?.includes('null value in column "lesson_id"')) {
      return { 
        success: false, 
        error: 'A migração do banco de dados não foi aplicada. Execute a migração 006 para permitir attachments sem lesson_id.' 
      }
    }
    return { success: false, error: error.message || 'Erro ao criar anexo' }
  }
}

/**
 * Update attachment with file information after upload (admin only)
 */
export async function updateAttachmentFile(data: {
  attachmentId: string
  storageKey: string
  fileUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (!data.attachmentId || !data.storageKey || !data.fileUrl) {
      return { success: false, error: 'Dados incompletos para atualizar anexo' }
    }

    // Verify attachment exists
    const attachment = await queryOne<{ id: string }>(
      'SELECT id FROM attachments WHERE id = $1',
      [data.attachmentId]
    )

    if (!attachment) {
      return { success: false, error: 'Anexo não encontrado' }
    }

    await query(
      `UPDATE attachments 
       SET file_url = $1, storage_key = $2, updated_at = NOW()
       WHERE id = $3`,
      [data.fileUrl, data.storageKey, data.attachmentId]
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar anexo' }
  }
}

/**
 * Update attachment metadata (admin only)
 * Updates: file_name, file_type, minimum_tier_id, lesson_id
 */
export async function updateAttachment(
  attachmentId: string,
  data: {
    fileName?: string
    fileType?: string
    minimumTierId?: number
    lessonId?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!attachmentId) {
      return { success: false, error: 'ID do anexo é obrigatório' }
    }

    // Verify attachment exists
    const attachment = await queryOne<{ id: string }>(
      'SELECT id FROM attachments WHERE id = $1',
      [attachmentId]
    )

    if (!attachment) {
      return { success: false, error: 'Anexo não encontrado' }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.fileName !== undefined) {
      if (!data.fileName.trim()) {
        return { success: false, error: 'Nome do arquivo não pode ser vazio' }
      }
      updates.push(`file_name = $${paramIndex++}`)
      values.push(data.fileName.trim())
    }

    if (data.fileType !== undefined) {
      if (!data.fileType.trim()) {
        return { success: false, error: 'Tipo de arquivo não pode ser vazio' }
      }
      updates.push(`file_type = $${paramIndex++}`)
      values.push(data.fileType.trim())
    }

    if (data.minimumTierId !== undefined) {
      // Verify tier exists
      const tier = await queryOne<{ id: number }>(
        'SELECT id FROM tiers WHERE id = $1',
        [data.minimumTierId]
      )

      if (!tier) {
        return { success: false, error: 'Tier especificado não existe' }
      }

      updates.push(`minimum_tier_id = $${paramIndex++}`)
      values.push(data.minimumTierId)
    }

    if (data.lessonId !== undefined) {
      // If lessonId is provided (not null), verify lesson exists
      if (data.lessonId !== null && data.lessonId !== '') {
        const lesson = await queryOne<{ id: string }>(
          'SELECT id FROM lessons WHERE id = $1',
          [data.lessonId]
        )

        if (!lesson) {
          return { success: false, error: 'Aula não encontrada' }
        }

        updates.push(`lesson_id = $${paramIndex++}`)
        values.push(data.lessonId)
      } else {
        // Allow setting lesson_id to NULL (file without course)
        updates.push(`lesson_id = $${paramIndex++}`)
        values.push(null)
      }
    }

    if (updates.length === 0) {
      return { success: false, error: 'Nenhum campo para atualizar' }
    }

    updates.push(`updated_at = NOW()`)
    values.push(attachmentId)

    await query(
      `UPDATE attachments SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    revalidatePath('/dashboard')
    revalidatePath('/admin/files')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar anexo' }
  }
}

/**
 * Update a course (admin only)
 */
export async function updateCourse(
  courseId: string,
  data: {
    title?: string
    description?: string
    thumbnailUrl?: string | null
    minimumTierId?: number
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!courseId) {
      return { success: false, error: 'ID do curso é obrigatório' }
    }

    // Verify course exists
    const course = await queryOne<{ id: string }>(
      'SELECT id FROM courses WHERE id = $1',
      [courseId]
    )

    if (!course) {
      return { success: false, error: 'Curso não encontrado' }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        return { success: false, error: 'Título do curso não pode ser vazio' }
      }
      updates.push(`title = $${paramIndex++}`)
      values.push(data.title.trim())
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(data.description.trim() || null)
    }

    if (data.thumbnailUrl !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex++}`)
      values.push(data.thumbnailUrl)
    }

    if (data.minimumTierId !== undefined) {
      // Verify tier exists
      const tier = await queryOne<{ id: number }>(
        'SELECT id FROM tiers WHERE id = $1',
        [data.minimumTierId]
      )

      if (!tier) {
        return { success: false, error: 'Tier especificado não existe' }
      }

      updates.push(`minimum_tier_id = $${paramIndex++}`)
      values.push(data.minimumTierId)
    }

    if (updates.length === 0) {
      return { success: false, error: 'Nenhum campo para atualizar' }
    }

    updates.push(`updated_at = NOW()`)
    values.push(courseId)

    await query(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    revalidatePath('/dashboard')
    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar curso' }
  }
}

/**
 * Update a module (admin only)
 */
export async function updateModule(
  moduleId: string,
  data: {
    title?: string
    order?: number
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!moduleId) {
      return { success: false, error: 'ID do módulo é obrigatório' }
    }

    // Verify module exists
    const module = await queryOne<{ id: string }>(
      'SELECT id FROM modules WHERE id = $1',
      [moduleId]
    )

    if (!module) {
      return { success: false, error: 'Módulo não encontrado' }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        return { success: false, error: 'Título do módulo não pode ser vazio' }
      }
      updates.push(`title = $${paramIndex++}`)
      values.push(data.title.trim())
    }

    if (data.order !== undefined) {
      updates.push(`"order" = $${paramIndex++}`)
      values.push(data.order)
    }

    if (updates.length === 0) {
      return { success: false, error: 'Nenhum campo para atualizar' }
    }

    updates.push(`updated_at = NOW()`)
    values.push(moduleId)

    await query(
      `UPDATE modules SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar módulo' }
  }
}

/**
 * Update a lesson (admin only)
 */
export async function updateLesson(
  lessonId: string,
  data: {
    title?: string
    order?: number
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!lessonId) {
      return { success: false, error: 'ID da aula é obrigatório' }
    }

    // Verify lesson exists
    const lesson = await queryOne<{ id: string }>(
      'SELECT id FROM lessons WHERE id = $1',
      [lessonId]
    )

    if (!lesson) {
      return { success: false, error: 'Aula não encontrada' }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        return { success: false, error: 'Título da aula não pode ser vazio' }
      }
      updates.push(`title = $${paramIndex++}`)
      values.push(data.title.trim())
    }

    if (data.order !== undefined) {
      updates.push(`"order" = $${paramIndex++}`)
      values.push(data.order)
    }

    if (updates.length === 0) {
      return { success: false, error: 'Nenhum campo para atualizar' }
    }

    updates.push(`updated_at = NOW()`)
    values.push(lessonId)

    await query(
      `UPDATE lessons SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar aula' }
  }
}

/**
 * Delete an attachment (admin only)
 * Also deletes the file from MinIO
 */
export async function deleteAttachment(attachmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!attachmentId) {
      return { success: false, error: 'ID do anexo é obrigatório' }
    }

    // Get attachment info including file_url
    const attachment = await queryOne<{ id: string; file_url: string | null }>(
      'SELECT id, file_url FROM attachments WHERE id = $1',
      [attachmentId]
    )

    if (!attachment) {
      return { success: false, error: 'Anexo não encontrado' }
    }

    // Delete file from MinIO if exists
    if (attachment.file_url) {
      try {
        // Extract storage key from file_url
        // file_url format: http://endpoint:port/bucket/key
        const url = new URL(attachment.file_url)
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (pathParts.length >= 2) {
          const bucket = pathParts[0]
          const key = pathParts.slice(1).join('/')
          await deleteFile(bucket, key)
        }
      } catch (error: any) {
        // Log but don't fail if file deletion fails
        console.warn('Error deleting attachment file from MinIO:', error)
      }
    }

    // Delete attachment from database
    await query('DELETE FROM attachments WHERE id = $1', [attachmentId])

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir anexo' }
  }
}

/**
 * Delete a lesson (admin only)
 * Also deletes video from MinIO and all attachments
 */
export async function deleteLesson(lessonId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!lessonId) {
      return { success: false, error: 'ID da aula é obrigatório' }
    }

    // Get lesson info including storage_key and video_url
    const lesson = await queryOne<{ id: string; storage_key: string | null; video_url: string | null }>(
      'SELECT id, storage_key, video_url FROM lessons WHERE id = $1',
      [lessonId]
    )

    if (!lesson) {
      return { success: false, error: 'Aula não encontrada' }
    }

    // Get all attachments for this lesson
    const attachments = await queryMany<{ id: string; file_url: string | null }>(
      'SELECT id, file_url FROM attachments WHERE lesson_id = $1',
      [lessonId]
    )

    // Delete all attachment files from MinIO
    for (const attachment of attachments) {
      if (attachment.file_url) {
        try {
          const url = new URL(attachment.file_url)
          const pathParts = url.pathname.split('/').filter(Boolean)
          if (pathParts.length >= 2) {
            const bucket = pathParts[0]
            const key = pathParts.slice(1).join('/')
            await deleteFile(bucket, key)
          }
        } catch (error: any) {
          console.warn('Error deleting attachment file from MinIO:', error)
        }
      }
    }

    // Delete video from MinIO if exists
    if (lesson.storage_key) {
      try {
        await deleteFile(BUCKETS.VIDEOS, lesson.storage_key)
      } catch (error: any) {
        console.warn('Error deleting video file from MinIO:', error)
      }
    }

    // Delete lesson (cascade will delete attachments)
    await query('DELETE FROM lessons WHERE id = $1', [lessonId])

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir aula' }
  }
}

/**
 * Delete a module (admin only)
 * Also deletes all lessons and their files (cascade)
 */
export async function deleteModule(moduleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!moduleId) {
      return { success: false, error: 'ID do módulo é obrigatório' }
    }

    // Verify module exists
    const module = await queryOne<{ id: string }>(
      'SELECT id FROM modules WHERE id = $1',
      [moduleId]
    )

    if (!module) {
      return { success: false, error: 'Módulo não encontrado' }
    }

    // Get all lessons for this module
    const lessons = await queryMany<{ id: string; storage_key: string | null }>(
      'SELECT id, storage_key FROM lessons WHERE module_id = $1',
      [moduleId]
    )

    // Delete all lesson videos and attachments
    for (const lesson of lessons) {
      // Get attachments for this lesson
      const attachments = await queryMany<{ id: string; file_url: string | null }>(
        'SELECT id, file_url FROM attachments WHERE lesson_id = $1',
        [lesson.id]
      )

      // Delete attachment files
      for (const attachment of attachments) {
        if (attachment.file_url) {
          try {
            const url = new URL(attachment.file_url)
            const pathParts = url.pathname.split('/').filter(Boolean)
            if (pathParts.length >= 2) {
              const bucket = pathParts[0]
              const key = pathParts.slice(1).join('/')
              await deleteFile(bucket, key)
            }
          } catch (error: any) {
            console.warn('Error deleting attachment file from MinIO:', error)
          }
        }
      }

      // Delete lesson video
      if (lesson.storage_key) {
        try {
          await deleteFile(BUCKETS.VIDEOS, lesson.storage_key)
        } catch (error: any) {
          console.warn('Error deleting video file from MinIO:', error)
        }
      }
    }

    // Delete module (cascade will delete lessons and attachments)
    await query('DELETE FROM modules WHERE id = $1', [moduleId])

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir módulo' }
  }
}

/**
 * Delete a course (admin only)
 * Also deletes all modules, lessons, attachments, videos, and thumbnail from MinIO
 */
export async function deleteCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    if (!courseId) {
      return { success: false, error: 'ID do curso é obrigatório' }
    }

    // Verify course exists
    const course = await queryOne<{ id: string; thumbnail_url: string | null }>(
      'SELECT id, thumbnail_url FROM courses WHERE id = $1',
      [courseId]
    )

    if (!course) {
      return { success: false, error: 'Curso não encontrado' }
    }

    // Get all modules for this course
    const modules = await queryMany<{ id: string }>(
      'SELECT id FROM modules WHERE course_id = $1',
      [courseId]
    )

    // Delete all lesson videos and attachments
    for (const module of modules) {
      // Get all lessons for this module
      const lessons = await queryMany<{ id: string; storage_key: string | null }>(
        'SELECT id, storage_key FROM lessons WHERE module_id = $1',
        [module.id]
      )

      // Delete all lesson videos and attachments
      for (const lesson of lessons) {
        // Get attachments for this lesson
        const attachments = await queryMany<{ id: string; file_url: string | null; storage_key: string | null }>(
          'SELECT id, file_url, storage_key FROM attachments WHERE lesson_id = $1',
          [lesson.id]
        )

        // Delete attachment files from MinIO
        for (const attachment of attachments) {
          if (attachment.file_url) {
            try {
              const url = new URL(attachment.file_url)
              const pathParts = url.pathname.split('/').filter(Boolean)
              if (pathParts.length >= 2) {
                const bucket = pathParts[0]
                const key = pathParts.slice(1).join('/')
                await deleteFile(bucket, key)
              }
            } catch (error: any) {
              console.warn('Error deleting attachment file from MinIO:', error)
            }
          } else if (attachment.storage_key) {
            // Try to delete using storage_key if file_url is not available
            try {
              await deleteFile(BUCKETS.ATTACHMENTS, attachment.storage_key)
            } catch (error: any) {
              console.warn('Error deleting attachment file from MinIO using storage_key:', error)
            }
          }
        }

        // Delete lesson video from MinIO
        if (lesson.storage_key) {
          try {
            await deleteFile(BUCKETS.VIDEOS, lesson.storage_key)
          } catch (error: any) {
            console.warn('Error deleting video file from MinIO:', error)
          }
        }
      }
    }

    // Delete thumbnail from MinIO if exists
    if (course.thumbnail_url) {
      try {
        const url = new URL(course.thumbnail_url)
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (pathParts.length >= 2) {
          const bucket = pathParts[0]
          const key = pathParts.slice(1).join('/')
          await deleteFile(bucket, key)
        }
      } catch (error: any) {
        console.warn('Error deleting thumbnail from MinIO:', error)
      }
    }

    // Delete course (cascade will delete modules, lessons, and attachments)
    await query('DELETE FROM courses WHERE id = $1', [courseId])

    revalidatePath('/dashboard')
    revalidatePath('/admin/courses')
    revalidatePath('/courses')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao excluir curso' }
  }
}

