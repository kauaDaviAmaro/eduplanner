import { queryOne, queryMany } from '@/lib/db/client'
import { Database } from '@/types/database'
import { getCurrentUserProfile } from './profiles'
import { getAllCourses } from './courses'
import { getCourseProgress } from './user-progress'
import type { AttachmentWithContext } from './attachments'

export type Course = Database['public']['Tables']['courses']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type Module = Database['public']['Tables']['modules']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Certificate = Database['public']['Tables']['certificates']['Row']
type Favorite = Database['public']['Tables']['favorites']['Row']
type UserDownload = Database['public']['Tables']['user_downloads']['Row']
export type LessonPlan = Database['public']['Tables']['lesson_plans']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

export type LastWatchedLesson = {
  lesson: Lesson
  module: Module
  course: Course
  progress: {
    time_watched: number
    is_completed: boolean
    last_watched_at: string | null
  }
}

export type CourseWithProgress = Course & {
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

export type DashboardData = {
  overallProgress: {
    percentage: number
    completedCourses: number
    totalCourses: number
  }
  lastWatchedLesson: LastWatchedLesson | null
  subscription: Subscription | null
  inProgressCourses: CourseWithProgress[]
  favoriteCourses: Course[]
  availableCertificates: Array<Certificate & { course: Course | null }>
  notifications: Notification[]
  unreadNotificationsCount: number
  downloads: UserDownload[]
  recentFiles: AttachmentWithContext[]
  lessonPlans: LessonPlan[]
}

/**
 * Get the last watched lesson for a user
 */
export async function getLastWatchedLesson(userId: string): Promise<LastWatchedLesson | null> {
  // Get the most recently watched lesson with related data
  const progress = await queryOne<{
    time_watched: number
    is_completed: boolean
    last_watched_at: string | null
    lesson: Lesson & { module: Module & { course: Course } }
  }>(
    `SELECT 
      up.time_watched,
      up.is_completed,
      up.last_watched_at,
      json_build_object(
        'id', l.id,
        'module_id', l.module_id,
        'title', l.title,
        'duration', l.duration,
        'video_url', l.video_url,
        'order', l."order",
        'created_at', l.created_at,
        'updated_at', l.updated_at,
        'module', json_build_object(
          'id', m.id,
          'course_id', m.course_id,
          'title', m.title,
          'order', m."order",
          'created_at', m.created_at,
          'updated_at', m.updated_at,
          'course', json_build_object(
            'id', c.id,
            'title', c.title,
            'description', c.description,
            'thumbnail_url', c.thumbnail_url,
            'minimum_tier_id', c.minimum_tier_id,
            'created_at', c.created_at,
            'updated_at', c.updated_at
          )
        )
      ) as lesson
     FROM user_progress up
     INNER JOIN lessons l ON up.lesson_id = l.id
     INNER JOIN modules m ON l.module_id = m.id
     INNER JOIN courses c ON m.course_id = c.id
     WHERE up.user_id = $1
       AND up.last_watched_at IS NOT NULL
     ORDER BY up.last_watched_at DESC
     LIMIT 1`,
    [userId]
  )

  if (!progress || !progress.lesson) {
    return null
  }

  const lesson = progress.lesson as any
  const module = lesson.module as Module & { course: Course }
  const course = module.course as Course

  return {
    lesson: {
      ...lesson,
      module_id: lesson.module_id,
    } as Lesson,
    module: {
      ...module,
      course_id: module.course_id,
    } as Module,
    course,
    progress: {
      time_watched: progress.time_watched,
      is_completed: progress.is_completed,
      last_watched_at: progress.last_watched_at,
    },
  }
}

/**
 * Get overall progress percentage for user's tier
 */
export async function getOverallProgress(userId: string): Promise<{
  percentage: number
  completedCourses: number
  totalCourses: number
}> {
  // Get user's tier to know which courses they have access to
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return { percentage: 0, completedCourses: 0, totalCourses: 0 }
  }

  // Get all courses accessible to user
  const allCourses = await getAllCourses()
  const totalCourses = allCourses.length

  if (totalCourses === 0) {
    return { percentage: 0, completedCourses: 0, totalCourses: 0 }
  }

  // Check completion for each course
  let completedCourses = 0
  for (const course of allCourses) {
    const courseProgress = await getCourseProgress(userId, course.id)

    // Get total lessons for this course
    const modules = await queryMany<{ id: string }>(
      `SELECT id FROM modules WHERE course_id = $1`,
      [course.id]
    )

    if (!modules || modules.length === 0) continue

    const moduleIds = modules.map((m) => m.id)
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM lessons WHERE module_id = ANY($1::uuid[])`,
      [moduleIds]
    )

    const totalLessons = parseInt(result?.count || '0', 10)
    if (totalLessons === 0) continue

    // Count completed lessons
    const completedLessons = courseProgress.filter((p) => p.is_completed).length

    // Course is complete if all lessons are completed
    if (completedLessons === totalLessons) {
      completedCourses++
    }
  }

  const percentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0

  return {
    percentage,
    completedCourses,
    totalCourses,
  }
}

/**
 * Get courses in progress with progress information
 */
export async function getInProgressCourses(userId: string): Promise<CourseWithProgress[]> {
  // Get all courses accessible to user
  const allCourses = await getAllCourses()
  const coursesWithProgress: CourseWithProgress[] = []

  for (const course of allCourses) {
    const courseProgress = await getCourseProgress(userId, course.id)

    // Get total lessons for this course
    const modules = await queryMany<{ id: string }>(
      `SELECT id FROM modules WHERE course_id = $1`,
      [course.id]
    )

    if (!modules || modules.length === 0) continue

    const moduleIds = modules.map((m) => m.id)
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM lessons WHERE module_id = ANY($1::uuid[])`,
      [moduleIds]
    )

    const totalLessons = parseInt(result?.count || '0', 10)
    if (totalLessons === 0) continue

    const completedLessons = courseProgress.filter((p) => p.is_completed).length

    // Only include courses that have some progress but aren't complete
    if (completedLessons > 0 && completedLessons < totalLessons) {
      coursesWithProgress.push({
        ...course,
        progress: {
          completed: completedLessons,
          total: totalLessons,
          percentage: Math.round((completedLessons / totalLessons) * 100),
        },
      })
    }
  }

  // Sort by most recent progress
  return coursesWithProgress.sort((a, b) => {
    return b.progress.percentage - a.progress.percentage
  })
}

/**
 * Get favorite courses for a user
 */
export async function getFavoriteCourses(userId: string): Promise<Course[]> {
  const favorites = await queryMany<{ course_id: string; course: Course }>(
    `SELECT 
      f.course_id,
      json_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'thumbnail_url', c.thumbnail_url,
        'minimum_tier_id', c.minimum_tier_id,
        'created_at', c.created_at,
        'updated_at', c.updated_at
      ) as course
     FROM favorites f
     INNER JOIN courses c ON f.course_id = c.id
     WHERE f.user_id = $1 AND f.course_id IS NOT NULL`,
    [userId]
  )

  return favorites.map((f) => f.course).filter((c) => c !== null) as Course[]
}

/**
 * Get available certificates (courses that are 100% complete) with course info
 */
export async function getAvailableCertificates(userId: string): Promise<
  Array<Certificate & { course: Course | null }>
> {
  const certificates = await queryMany<Certificate & { course: Course | null }>(
    `SELECT 
      cert.*,
      CASE 
        WHEN c.id IS NOT NULL THEN json_build_object(
          'id', c.id,
          'title', c.title,
          'description', c.description,
          'thumbnail_url', c.thumbnail_url,
          'minimum_tier_id', c.minimum_tier_id,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        )
        ELSE NULL
      END as course
     FROM certificates cert
     LEFT JOIN courses c ON cert.course_id = c.id
     WHERE cert.user_id = $1`,
    [userId]
  )

  return certificates
}

/**
 * Check if a course is 100% complete and create certificate if needed
 */
export async function checkAndCreateCertificate(userId: string, courseId: string): Promise<Certificate | null> {
  // Check if certificate already exists
  const existing = await queryOne<Certificate>(
    `SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId]
  )

  if (existing) {
    return existing
  }

  // Check if course is 100% complete
  const courseProgress = await getCourseProgress(userId, courseId)

  const modules = await queryMany<{ id: string }>(
    `SELECT id FROM modules WHERE course_id = $1`,
    [courseId]
  )

  if (!modules || modules.length === 0) {
    return null
  }

  const moduleIds = modules.map((m) => m.id)
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM lessons WHERE module_id = ANY($1::uuid[])`,
    [moduleIds]
  )

  const totalLessons = parseInt(result?.count || '0', 10)
  if (totalLessons === 0) {
    return null
  }

  const completedLessons = courseProgress.filter((p) => p.is_completed).length

  // Course is complete
  if (completedLessons === totalLessons) {
    // Create certificate
    const certificate = await queryOne<Certificate>(
      `INSERT INTO certificates (user_id, course_id, issued_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW())
       RETURNING *`,
      [userId, courseId]
    )

    return certificate
  }

  return null
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let queryText = `SELECT * FROM notifications WHERE user_id = $1`
  const params: any[] = [userId]

  if (unreadOnly) {
    queryText += ` AND is_read = false`
  }

  queryText += ` ORDER BY created_at DESC`

  const notifications = await queryMany<Notification>(queryText, params)

  return notifications
}

/**
 * Get count of unread notifications
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  )

  return parseInt(result?.count || '0', 10)
}

/**
 * Get user downloads
 */
export async function getUserDownloads(userId: string): Promise<UserDownload[]> {
  const downloads = await queryMany<UserDownload>(
    `SELECT ud.* FROM user_downloads ud
     WHERE ud.user_id = $1
     ORDER BY ud.downloaded_at DESC`,
    [userId]
  )

  return downloads
}

/**
 * Get lesson plans for user
 */
export async function getLessonPlans(userId: string): Promise<LessonPlan[]> {
  const plans = await queryMany<LessonPlan>(
    `SELECT * FROM lesson_plans
     WHERE user_id = $1
     ORDER BY due_date ASC NULLS LAST`,
    [userId]
  )

  return plans
}

/**
 * Get active subscription for user
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const subscription = await queryOne<Subscription>(
    `SELECT * FROM subscriptions
     WHERE user_id = $1 AND status = 'active'
     LIMIT 1`,
    [userId]
  )

  return subscription
}

/**
 * Get all dashboard data aggregated
 * Handles errors gracefully if some tables don't exist yet
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Import getRecentDownloads dynamically to avoid circular dependency
  const { getRecentDownloads } = await import('./attachments')

  // Use Promise.allSettled to handle errors gracefully
  const results = await Promise.allSettled([
    getOverallProgress(userId),
    getLastWatchedLesson(userId),
    getActiveSubscription(userId),
    getInProgressCourses(userId),
    getFavoriteCourses(userId),
    getAvailableCertificates(userId),
    getUserNotifications(userId, false),
    getUnreadNotificationsCount(userId),
    getUserDownloads(userId),
    getRecentDownloads(5),
    getLessonPlans(userId),
  ])

  // Extract values or use defaults
  const overallProgress =
    results[0].status === 'fulfilled' ? results[0].value : { percentage: 0, completedCourses: 0, totalCourses: 0 }
  const lastWatchedLesson = results[1].status === 'fulfilled' ? results[1].value : null
  const subscription = results[2].status === 'fulfilled' ? results[2].value : null
  const inProgressCourses = results[3].status === 'fulfilled' ? results[3].value : []
  const favoriteCourses = results[4].status === 'fulfilled' ? results[4].value : []
  const availableCertificates = results[5].status === 'fulfilled' ? results[5].value : []
  const notifications = results[6].status === 'fulfilled' ? results[6].value : []
  const unreadNotificationsCount = results[7].status === 'fulfilled' ? results[7].value : 0
  const downloads = results[8].status === 'fulfilled' ? results[8].value : []
  const recentFiles = results[9].status === 'fulfilled' ? results[9].value : []
  const lessonPlans = results[10].status === 'fulfilled' ? results[10].value : []

  // Log errors for debugging (but don't fail)
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`Dashboard data fetch ${index} failed:`, result.reason)
    }
  })

  return {
    overallProgress,
    lastWatchedLesson,
    subscription,
    inProgressCourses,
    favoriteCourses,
    availableCertificates,
    notifications,
    unreadNotificationsCount,
    downloads,
    recentFiles,
    lessonPlans,
  }
}
