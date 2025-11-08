import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { upsertLessonProgress, getLessonProgress } from '@/lib/queries/user-progress'
import { hasLessonAccess } from '@/lib/queries/lessons'

/**
 * POST /api/progress
 * Update progress for a lesson
 * Body: { lessonId: string, timeWatched?: number, isCompleted?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { lessonId, timeWatched, isCompleted } = body

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      )
    }

    // Check if user has access to this lesson
    const hasAccess = await hasLessonAccess(lessonId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this lesson' },
        { status: 403 }
      )
    }

    // Update progress
    const progress = await upsertLessonProgress(userId, lessonId, {
      time_watched: timeWatched !== undefined ? Math.floor(timeWatched) : undefined,
      is_completed: isCompleted,
      last_watched_at: new Date().toISOString(),
    })

    if (!progress) {
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      progress: {
        lessonId: progress.lesson_id,
        timeWatched: progress.time_watched,
        isCompleted: progress.is_completed,
        lastWatchedAt: progress.last_watched_at,
      },
    })
  } catch (error: any) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/progress?lessonId=xxx
 * Get progress for a specific lesson
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      )
    }

    // Check if user has access to this lesson
    const hasAccess = await hasLessonAccess(lessonId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this lesson' },
        { status: 403 }
      )
    }

    // Get progress
    const progress = await getLessonProgress(userId, lessonId)

    return NextResponse.json({
      progress: progress
        ? {
            lessonId: progress.lesson_id,
            timeWatched: progress.time_watched,
            isCompleted: progress.is_completed,
            lastWatchedAt: progress.last_watched_at,
          }
        : null,
    })
  } catch (error: any) {
    console.error('Error getting progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


