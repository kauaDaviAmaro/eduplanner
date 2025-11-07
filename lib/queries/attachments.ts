import { queryOne, queryMany } from '@/lib/db/client'
import { getCurrentUserId, getPermissionLevel, isAdmin } from '@/lib/auth/helpers'
import { hasCourseAccess } from './courses'

/**
 * Check if user has access to an attachment
 * Returns true if:
 * 1. If attachment has a course: User has access to the course that contains this attachment
 * 2. User's permission_level >= attachment's minimum_tier permission_level
 * For attachments without course, only tier check is performed
 */
export async function hasAttachmentAccess(attachmentId: string): Promise<boolean> {
  const userId = await getCurrentUserId()
  const permissionLevel = await getPermissionLevel()
  const userIsAdmin = await isAdmin()

  if (!userId) {
    return false
  }

  if (userIsAdmin) {
    return true
  }

  // Get the attachment's course and tier information
  const attachment = await queryOne<{
    course_id: string | null
    minimum_tier_id: number
    permission_level: number
  }>(
    `SELECT c.id as course_id, a.minimum_tier_id, t.permission_level
     FROM attachments a
     LEFT JOIN lessons l ON a.lesson_id = l.id
     LEFT JOIN modules m ON l.module_id = m.id
     LEFT JOIN courses c ON m.course_id = c.id
     INNER JOIN tiers t ON a.minimum_tier_id = t.id
     WHERE a.id = $1`,
    [attachmentId]
  )

  if (!attachment) {
    return false
  }

  // If attachment has a course, check course access
  if (attachment.course_id) {
    const userHasCourseAccess = await hasCourseAccess(attachment.course_id)
    if (!userHasCourseAccess) {
      return false
    }
  }

  // Check if user's permission level is sufficient
  return attachment.permission_level <= permissionLevel
}

/**
 * Get monthly download count for a user
 * Counts downloads from the current month
 */
export async function getMonthlyDownloadCount(userId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM user_downloads
     WHERE user_id = $1
     AND EXTRACT(YEAR FROM downloaded_at) = EXTRACT(YEAR FROM NOW())
     AND EXTRACT(MONTH FROM downloaded_at) = EXTRACT(MONTH FROM NOW())`,
    [userId]
  )

  return Number.parseInt(result?.count || '0', 10)
}

/**
 * Get user's tier download limit
 * Returns the download_limit for the user's tier, or null if unlimited
 */
export async function getUserDownloadLimit(userId: string): Promise<number | null> {
  const result = await queryOne<{ download_limit: number | null }>(
    `SELECT t.download_limit
     FROM profiles p
     INNER JOIN tiers t ON p.tier_id = t.id
     WHERE p.id = $1`,
    [userId]
  )

  return result?.download_limit ?? null
}

/**
 * Check if user can download an attachment
 * Returns:
 * - { canDownload: true } if user can download
 * - { canDownload: false, reason: string } if user cannot download
 */
export async function canDownloadAttachment(attachmentId: string): Promise<{
  canDownload: boolean
  reason?: string
}> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { canDownload: false, reason: 'Usuário não autenticado' }
  }

  // Check if user has access to the attachment
  const hasAccess = await hasAttachmentAccess(attachmentId)
  if (!hasAccess) {
    return { canDownload: false, reason: 'Você não tem acesso a este anexo. Faça upgrade do seu plano.' }
  }

  // Get user's download limit
  const downloadLimit = await getUserDownloadLimit(userId)

  // If unlimited (null), allow download
  if (downloadLimit === null) {
    return { canDownload: true }
  }

  // Check monthly download count
  const monthlyCount = await getMonthlyDownloadCount(userId)

  if (monthlyCount >= downloadLimit) {
    return {
      canDownload: false,
      reason: `Você atingiu o limite de ${downloadLimit} downloads deste mês. Faça upgrade do seu plano para downloads ilimitados.`,
    }
  }

  return { canDownload: true }
}

/**
 * Get attachment information including course context (if available)
 */
export async function getAttachmentWithCourse(attachmentId: string) {
  const attachment = await queryOne<{
    id: string
    lesson_id: string | null
    file_name: string
    file_type: string
    file_url: string | null
    minimum_tier_id: number
    course_id: string | null
    course_title: string | null
  }>(
    `SELECT 
       a.id,
       a.lesson_id,
       a.file_name,
       a.file_type,
       a.file_url,
       a.minimum_tier_id,
       c.id as course_id,
       c.title as course_title
     FROM attachments a
     LEFT JOIN lessons l ON a.lesson_id = l.id
     LEFT JOIN modules m ON l.module_id = m.id
     LEFT JOIN courses c ON m.course_id = c.id
     WHERE a.id = $1`,
    [attachmentId]
  )

  return attachment
}

/**
 * Attachment with full context for library display
 */
export type AttachmentWithContext = {
  id: string
  file_name: string
  file_type: string
  file_url: string | null
  minimum_tier_id: number
  created_at: string
  course_id: string | null
  course_title: string | null
  lesson_id: string | null
  lesson_title: string | null
  module_title: string | null
  tier_name: string
  tier_permission_level: number
}

/**
 * Get all attachments accessible to the current user
 * Filters by user's permission level and includes full context
 */
export async function getAllAttachments(): Promise<AttachmentWithContext[]> {
  const userId = await getCurrentUserId()
  const permissionLevel = await getPermissionLevel()
  const userIsAdmin = await isAdmin()

  if (!userId) {
    return []
  }

  // If admin, return all attachments
  if (userIsAdmin) {
    const attachments = await queryMany<AttachmentWithContext>(
      `SELECT 
         a.id,
         a.file_name,
         a.file_type,
         a.file_url,
         a.minimum_tier_id,
         a.created_at,
         c.id as course_id,
         c.title as course_title,
         l.id as lesson_id,
         l.title as lesson_title,
         m.title as module_title,
         t.name as tier_name,
         t.permission_level as tier_permission_level
       FROM attachments a
       LEFT JOIN lessons l ON a.lesson_id = l.id
       LEFT JOIN modules m ON l.module_id = m.id
       LEFT JOIN courses c ON m.course_id = c.id
       INNER JOIN tiers t ON a.minimum_tier_id = t.id
       ORDER BY a.created_at DESC`
    )
    return attachments
  }

  // Otherwise, filter by permission level
  const attachments = await queryMany<AttachmentWithContext>(
    `SELECT 
       a.id,
       a.file_name,
       a.file_type,
       a.file_url,
       a.minimum_tier_id,
       a.created_at,
       c.id as course_id,
       c.title as course_title,
       l.id as lesson_id,
       l.title as lesson_title,
       m.title as module_title,
       t.name as tier_name,
       t.permission_level as tier_permission_level
     FROM attachments a
     LEFT JOIN lessons l ON a.lesson_id = l.id
     LEFT JOIN modules m ON l.module_id = m.id
     LEFT JOIN courses c ON m.course_id = c.id
     INNER JOIN tiers t ON a.minimum_tier_id = t.id
     WHERE t.permission_level <= $1
     ORDER BY a.created_at DESC`,
    [permissionLevel]
  )

  return attachments
}

/**
 * Get recently downloaded attachments for a user
 * Returns the last N downloads with full context
 */
export async function getRecentDownloads(limit: number = 5): Promise<AttachmentWithContext[]> {
  const userId = await getCurrentUserId()
  const permissionLevel = await getPermissionLevel()
  const userIsAdmin = await isAdmin()

  if (!userId) {
    return []
  }

  // Get recent downloads
  const downloads = await queryMany<{ attachment_id: string; downloaded_at: string }>(
    `SELECT attachment_id, downloaded_at
     FROM user_downloads
     WHERE user_id = $1
     ORDER BY downloaded_at DESC
     LIMIT $2`,
    [userId, limit]
  )

  if (downloads.length === 0) {
    return []
  }

  const attachmentIds = downloads.map((d) => d.attachment_id)

  // Build query with permission check
  let query = `
    SELECT 
      a.id,
      a.file_name,
      a.file_type,
      a.file_url,
      a.minimum_tier_id,
      a.created_at,
      c.id as course_id,
      c.title as course_title,
      l.id as lesson_id,
      l.title as lesson_title,
      m.title as module_title,
      t.name as tier_name,
      t.permission_level as tier_permission_level,
      ud.downloaded_at
    FROM attachments a
    LEFT JOIN lessons l ON a.lesson_id = l.id
    LEFT JOIN modules m ON l.module_id = m.id
    LEFT JOIN courses c ON m.course_id = c.id
    INNER JOIN tiers t ON a.minimum_tier_id = t.id
    INNER JOIN user_downloads ud ON a.id = ud.attachment_id
    WHERE a.id = ANY($1::uuid[])
      AND ud.user_id = $2
  `

  const params: any[] = [attachmentIds, userId]

  if (!userIsAdmin) {
    query += ` AND t.permission_level <= $3`
    params.push(permissionLevel)
  }

  query += ` ORDER BY ud.downloaded_at DESC`

  const attachments = await queryMany<AttachmentWithContext & { downloaded_at: string }>(query, params)

  // Remove downloaded_at from result (not part of AttachmentWithContext)
  return attachments.map(({ downloaded_at, ...attachment }) => attachment)
}

