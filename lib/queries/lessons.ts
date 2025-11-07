import { queryOne } from '@/lib/db/client'
import { getCurrentUserId, getPermissionLevel } from '@/lib/auth/helpers'
import { isAdmin } from '@/lib/auth/helpers'

/**
 * Check if user has access to a lesson
 * Returns true if:
 * 1. User has access to the course that contains this lesson
 * 2. User's permission_level >= course's minimum_tier permission_level
 */
export async function hasLessonAccess(lessonId: string): Promise<boolean> {
  const userId = await getCurrentUserId()
  const permissionLevel = await getPermissionLevel()
  const userIsAdmin = await isAdmin()

  if (!userId) {
    return false
  }

  if (userIsAdmin) {
    return true
  }

  // Get the lesson's course information
  const lesson = await queryOne<{
    course_id: string
    minimum_tier_id: number
    permission_level: number
  }>(
    `SELECT c.id as course_id, c.minimum_tier_id, t.permission_level
     FROM lessons l
     INNER JOIN modules m ON l.module_id = m.id
     INNER JOIN courses c ON m.course_id = c.id
     INNER JOIN tiers t ON c.minimum_tier_id = t.id
     WHERE l.id = $1`,
    [lessonId]
  )

  if (!lesson) {
    return false
  }

  // Check if user's permission level is sufficient
  return lesson.permission_level <= permissionLevel
}

/**
 * Get lesson information including course context
 */
export async function getLessonWithCourse(lessonId: string) {
  const lesson = await queryOne<{
    id: string
    module_id: string
    title: string
    duration: number
    video_url: string
    order: number
    course_id: string
    course_title: string
    minimum_tier_id: number
  }>(
    `SELECT 
       l.id,
       l.module_id,
       l.title,
       l.duration,
       l.video_url,
       l."order",
       c.id as course_id,
       c.title as course_title,
       c.minimum_tier_id
     FROM lessons l
     INNER JOIN modules m ON l.module_id = m.id
     INNER JOIN courses c ON m.course_id = c.id
     WHERE l.id = $1`,
    [lessonId]
  )

  return lesson
}

