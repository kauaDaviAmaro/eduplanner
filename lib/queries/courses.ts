import { queryOne, queryMany } from '@/lib/db/client'
import { getCurrentUserId, getPermissionLevel } from '@/lib/auth/helpers'
import { Database } from '@/types/database'
import { getCourseProgress } from './user-progress'
import type { CourseWithProgress } from './dashboard'

export type Course = Database['public']['Tables']['courses']['Row']
type Module = Database['public']['Tables']['modules']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type Attachment = Database['public']['Tables']['attachments']['Row']
type Tier = Database['public']['Tables']['tiers']['Row']

export type CourseWithModules = Course & {
  modules: (Module & {
    lessons: (Lesson & {
      attachments: Attachment[]
    })[]
  })[]
}

/**
 * Get a course by ID with all modules, lessons, and attachments
 * Permission checking is done in application logic
 */
export async function getCourseById(courseId: string): Promise<CourseWithModules | null> {
  // Get the course
  const course = await queryOne<Course>(
    `SELECT * FROM courses WHERE id = $1`,
    [courseId]
  )

  if (!course) {
    return null
  }

  // Get modules for this course
  const modules = await queryMany<Module>(
    `SELECT * FROM modules
     WHERE course_id = $1
     ORDER BY "order" ASC`,
    [courseId]
  )

  if (!modules || modules.length === 0) {
    return { ...course, modules: [] }
  }

  const moduleIds = modules.map((m) => m.id)

  // Get lessons for each module
  const lessons = await queryMany<Lesson>(
    `SELECT * FROM lessons
     WHERE module_id = ANY($1::uuid[])
     ORDER BY "order" ASC`,
    [moduleIds]
  )

  if (!lessons || lessons.length === 0) {
    return {
      ...course,
      modules: modules.map((m) => ({ ...m, lessons: [] })),
    }
  }

  const lessonIds = lessons.map((l) => l.id)

  // Get attachments for each lesson
  const attachments = await queryMany<Attachment>(
    `SELECT * FROM attachments
     WHERE lesson_id = ANY($1::uuid[])
     ORDER BY created_at ASC`,
    [lessonIds]
  )

  // Organize data structure
  const modulesWithLessons = modules.map((module) => ({
    ...module,
    lessons: lessons
      .filter((lesson) => lesson.module_id === module.id)
      .map((lesson) => ({
        ...lesson,
        attachments: attachments.filter((att) => att.lesson_id === lesson.id),
      })),
  }))

  return {
    ...course,
    modules: modulesWithLessons,
  }
}

/**
 * Get all courses accessible to the current user
 * Permission checking is done in application logic
 */
export async function getAllCourses(): Promise<Course[]> {
  const userId = await getCurrentUserId()
  const permissionLevel = await getPermissionLevel()
  const isAdmin = await import('@/lib/auth/helpers').then((m) => m.isAdmin())

  if (!userId) {
    return []
  }

  // If admin, return all courses
  if (isAdmin) {
    const courses = await queryMany<Course>(
      `SELECT * FROM courses ORDER BY created_at DESC`
    )
    return courses
  }

  // Otherwise, filter by permission level
  const courses = await queryMany<Course>(
    `SELECT c.*
     FROM courses c
     INNER JOIN tiers t ON c.minimum_tier_id = t.id
     WHERE t.permission_level <= $1
     ORDER BY c.created_at DESC`,
    [permissionLevel]
  )

  return courses
}

/**
 * Check if user has access to a course
 * Returns true if user's permission_level >= course's minimum_tier permission_level
 */
export async function hasCourseAccess(courseId: string): Promise<boolean> {
  const userId = await getCurrentUserId()
  const permissionLevel = await getPermissionLevel()
  const isAdmin = await import('@/lib/auth/helpers').then((m) => m.isAdmin())

  if (!userId) {
    return false
  }

  if (isAdmin) {
    return true
  }

  const course = await queryOne<{ minimum_tier_id: number }>(
    `SELECT c.minimum_tier_id
     FROM courses c
     INNER JOIN tiers t ON c.minimum_tier_id = t.id
     WHERE c.id = $1 AND t.permission_level <= $2`,
    [courseId, permissionLevel]
  )

  return course !== null
}

/**
 * Get all courses with progress information for the current user
 * Returns courses with progress data (completed lessons, total lessons, percentage)
 */
export async function getAllCoursesWithProgress(): Promise<CourseWithProgress[]> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return []
  }

  // Get all accessible courses
  const allCourses = await getAllCourses()
  const coursesWithProgress: CourseWithProgress[] = []

  for (const course of allCourses) {
    const courseProgress = await getCourseProgress(userId, course.id)

    // Get total lessons for this course
    const modules = await queryMany<{ id: string }>(
      `SELECT id FROM modules WHERE course_id = $1`,
      [course.id]
    )

    if (!modules || modules.length === 0) {
      // Course with no modules - no progress
      coursesWithProgress.push({
        ...course,
        progress: {
          completed: 0,
          total: 0,
          percentage: 0,
        },
      })
      continue
    }

    const moduleIds = modules.map((m) => m.id)
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM lessons WHERE module_id = ANY($1::uuid[])`,
      [moduleIds]
    )

    const totalLessons = parseInt(result?.count || '0', 10)
    const completedLessons = courseProgress.filter((p) => p.is_completed).length

    coursesWithProgress.push({
      ...course,
      progress: {
        completed: completedLessons,
        total: totalLessons,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
    })
  }

  return coursesWithProgress
}

/**
 * Get favorite course IDs for the current user
 * Returns a Set of course IDs that are favorited
 */
export async function getFavoriteCourseIds(): Promise<Set<string>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return new Set()
  }

  const favorites = await queryMany<{ course_id: string }>(
    `SELECT course_id FROM favorites WHERE user_id = $1 AND course_id IS NOT NULL`,
    [userId]
  )

  return new Set(favorites.map((f) => f.course_id).filter((id) => id !== null))
}

/**
 * Get all tiers (for filtering)
 */
export async function getAllTiers(): Promise<Tier[]> {
  const tiers = await queryMany<Tier>(
    `SELECT * FROM tiers ORDER BY permission_level ASC`
  )
  return tiers
}

/**
 * Get public courses for landing page (no authentication required)
 * Returns all courses without tier restrictions, limited by count
 */
export async function getPublicCourses(limit: number = 10): Promise<Course[]> {
  const courses = await queryMany<Course>(
    `SELECT * FROM courses ORDER BY created_at DESC LIMIT $1`,
    [limit]
  )
  return courses
}
