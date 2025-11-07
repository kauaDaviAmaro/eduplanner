import { query, queryOne, queryMany } from '@/lib/db/client'
import { Database } from '@/types/database'

type UserProgress = Database['public']['Tables']['user_progress']['Row']

/**
 * Get user progress for a specific lesson
 */
export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<UserProgress | null> {
  const progress = await queryOne<UserProgress>(
    `SELECT * FROM user_progress
     WHERE user_id = $1 AND lesson_id = $2`,
    [userId, lessonId]
  )

  return progress
}

/**
 * Get all progress for a user
 */
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const progress = await queryMany<UserProgress>(
    `SELECT * FROM user_progress
     WHERE user_id = $1
     ORDER BY last_watched_at DESC NULLS LAST`,
    [userId]
  )

  return progress
}

/**
 * Get progress for all lessons in a course
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<UserProgress[]> {
  // Get all modules for this course
  const modules = await queryMany<{ id: string }>(
    `SELECT id FROM modules WHERE course_id = $1`,
    [courseId]
  )

  if (!modules || modules.length === 0) {
    return []
  }

  const moduleIds = modules.map((m) => m.id)

  // Get all lesson IDs for these modules
  const lessons = await queryMany<{ id: string }>(
    `SELECT id FROM lessons WHERE module_id = ANY($1::uuid[])`,
    [moduleIds]
  )

  if (!lessons || lessons.length === 0) {
    return []
  }

  const lessonIds = lessons.map((l) => l.id)

  const progress = await queryMany<UserProgress>(
    `SELECT * FROM user_progress
     WHERE user_id = $1 AND lesson_id = ANY($2::uuid[])`,
    [userId, lessonIds]
  )

  return progress
}

/**
 * Create or update user progress for a lesson
 */
export async function upsertLessonProgress(
  userId: string,
  lessonId: string,
  progressData: {
    is_completed?: boolean
    time_watched?: number
    last_watched_at?: string
  }
): Promise<UserProgress | null> {
  const now = new Date().toISOString()
  const lastWatchedAt = progressData.last_watched_at || now

  const progress = await queryOne<UserProgress>(
    `INSERT INTO user_progress (
      user_id, lesson_id, is_completed, time_watched, last_watched_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, lesson_id)
     DO UPDATE SET
       is_completed = COALESCE(EXCLUDED.is_completed, user_progress.is_completed),
       time_watched = COALESCE(EXCLUDED.time_watched, user_progress.time_watched),
       last_watched_at = COALESCE(EXCLUDED.last_watched_at, user_progress.last_watched_at),
       updated_at = $6
     RETURNING *`,
    [
      userId,
      lessonId,
      progressData.is_completed ?? false,
      progressData.time_watched ?? 0,
      lastWatchedAt,
      now,
    ]
  )

  return progress
}

/**
 * Mark a lesson as completed
 */
export async function markLessonCompleted(
  userId: string,
  lessonId: string
): Promise<UserProgress | null> {
  return upsertLessonProgress(userId, lessonId, {
    is_completed: true,
    last_watched_at: new Date().toISOString(),
  })
}

/**
 * Update time watched for a lesson
 */
export async function updateTimeWatched(
  userId: string,
  lessonId: string,
  timeWatched: number
): Promise<UserProgress | null> {
  return upsertLessonProgress(userId, lessonId, {
    time_watched: timeWatched,
    last_watched_at: new Date().toISOString(),
  })
}

/**
 * Get completion statistics for a user
 */
export async function getUserProgressStats(userId: string): Promise<{
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  totalTimeWatched: number
}> {
  // Get all progress for user
  const progress = await getUserProgress(userId)

  const completedLessons = progress.filter((p) => p.is_completed).length
  const inProgressLessons = progress.filter(
    (p) => !p.is_completed && p.time_watched > 0
  ).length
  const totalTimeWatched = progress.reduce((sum, p) => sum + (p.time_watched || 0), 0)

  // Get total lessons count
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM lessons`
  )

  return {
    totalLessons: parseInt(result?.count || '0', 10),
    completedLessons,
    inProgressLessons,
    totalTimeWatched,
  }
}
