import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { hasLessonAccess, getLessonWithCourse } from '@/lib/queries/lessons'
import { getPresignedUrl, BUCKETS } from '@/lib/storage/client'

/**
 * GET /api/videos/[lessonId]
 * Returns a signed URL for the lesson video
 * Valid for 5 minutes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const userId = await getCurrentUserId()

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Get lesson information including video_url
    const lesson = await getLessonWithCourse(lessonId)
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Extract the MinIO key from video_url
    // video_url can be:
    // - Just the key: "lesson-{id}.mp4"
    // - Key with bucket: "videos/lesson-{id}.mp4"
    // - Full URL: "http://minio:9000/videos/lesson-{id}.mp4"
    let videoKey = lesson.video_url

    // Remove protocol and domain if present
    if (videoKey.includes('://')) {
      const url = new URL(videoKey)
      videoKey = url.pathname
    }

    // Remove leading slash
    if (videoKey.startsWith('/')) {
      videoKey = videoKey.substring(1)
    }

    // Remove bucket prefix if present (getPresignedUrl needs only the key)
    if (videoKey.startsWith(`${BUCKETS.VIDEOS}/`)) {
      videoKey = videoKey.replace(`${BUCKETS.VIDEOS}/`, '')
    }

    // Generate signed URL with 5 minutes expiration (300 seconds)
    const signedUrl = await getPresignedUrl(BUCKETS.VIDEOS, videoKey, 300)

    return NextResponse.json({
      url: signedUrl,
      expiresIn: 300, // 5 minutes in seconds
    })
  } catch (error: any) {
    console.error('Error generating video signed URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

