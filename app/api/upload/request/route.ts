import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/helpers'
import { queryOne } from '@/lib/db/client'
import { getPresignedUploadUrl, generateStorageKey, BUCKETS } from '@/lib/storage/client'

/**
 * POST /api/upload/request
 * Generates a presigned URL for uploading a file directly to MinIO
 * 
 * Body: {
 *   filename: string
 *   lessonId?: string
 *   attachmentId?: string
 *   fileType: 'video' | 'attachment' | 'thumbnail'
 *   contentType?: string
 *   courseId?: string (required for thumbnails)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { filename, lessonId, attachmentId, fileType, contentType, courseId } = body

    // Validate input
    if (!filename || !fileType) {
      return NextResponse.json(
        { error: 'filename and fileType are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!['video', 'attachment', 'thumbnail'].includes(fileType)) {
      return NextResponse.json(
        { error: 'fileType must be video, attachment, or thumbnail' },
        { status: 400 }
      )
    }

    // Validate file extension based on type
    const extension = filename.split('.').pop()?.toLowerCase() || ''

    if (fileType === 'video') {
      const allowedExtensions = ['mp4', 'webm', 'mov', 'avi']
      if (!allowedExtensions.includes(extension)) {
        return NextResponse.json(
          { error: `Invalid video format. Allowed: ${allowedExtensions.join(', ')}` },
          { status: 400 }
        )
      }
    } else if (fileType === 'attachment') {
      const allowedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx']
      if (!allowedExtensions.includes(extension)) {
        return NextResponse.json(
          { error: `Invalid attachment format. Allowed: ${allowedExtensions.join(', ')}` },
          { status: 400 }
        )
      }
    } else if (fileType === 'thumbnail') {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
      if (!allowedExtensions.includes(extension)) {
        return NextResponse.json(
          { error: `Invalid thumbnail format. Allowed: ${allowedExtensions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate resource ID based on file type
    let resourceId: string
    let finalCourseId: string | null = courseId || null

    if (fileType === 'video') {
      if (!lessonId) {
        return NextResponse.json(
          { error: 'lessonId is required for video uploads' },
          { status: 400 }
        )
      }

      // Verify lesson exists and get courseId
      const lesson = await queryOne<{ id: string; course_id: string }>(
        `SELECT l.id, c.id as course_id
         FROM lessons l
         INNER JOIN modules m ON l.module_id = m.id
         INNER JOIN courses c ON m.course_id = c.id
         WHERE l.id = $1`,
        [lessonId]
      )

      if (!lesson) {
        return NextResponse.json(
          { error: 'Lesson not found' },
          { status: 404 }
        )
      }

      resourceId = lessonId
      finalCourseId = lesson.course_id
    } else if (fileType === 'attachment') {
      if (!attachmentId) {
        return NextResponse.json(
          { error: 'attachmentId is required for attachment uploads' },
          { status: 400 }
        )
      }

      // Verify attachment exists and get courseId (if available)
      // Attachment may not have a course (lesson_id can be NULL)
      const attachment = await queryOne<{ id: string; course_id: string | null }>(
        `SELECT a.id, c.id as course_id
         FROM attachments a
         LEFT JOIN lessons l ON a.lesson_id = l.id
         LEFT JOIN modules m ON l.module_id = m.id
         LEFT JOIN courses c ON m.course_id = c.id
         WHERE a.id = $1`,
        [attachmentId]
      )

      if (!attachment) {
        return NextResponse.json(
          { error: 'Attachment not found' },
          { status: 404 }
        )
      }

      resourceId = attachmentId
      finalCourseId = attachment.course_id
    } else {
      // thumbnail
      if (!courseId) {
        return NextResponse.json(
          { error: 'courseId is required for thumbnail uploads' },
          { status: 400 }
        )
      }

      // For thumbnails, allow upload even if course doesn't exist yet (during course creation)
      // Check if courseId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (uuidRegex.test(courseId)) {
        // If it's a valid UUID, try to verify course exists (for editing existing courses)
        // But don't fail if it doesn't exist - allow for new course creation
        try {
          const course = await queryOne<{ id: string }>(
            'SELECT id FROM courses WHERE id = $1',
            [courseId]
          )
          // If course exists, great. If not, we'll still allow the upload for new course creation
        } catch (error) {
          // If there's an error (like invalid UUID format in query), we'll still proceed
          // This allows upload during course creation before the course is saved
        }
      } else {
        // Invalid UUID format (like 'temp'), reject the request
        return NextResponse.json(
          { error: 'Invalid courseId format. Please create the course first before uploading thumbnail.' },
          { status: 400 }
        )
      }

      resourceId = courseId
      finalCourseId = courseId
    }

    // For attachments without course, use a default courseId for storage organization
    // This allows attachments without course to still be uploaded
    if (!finalCourseId && fileType === 'attachment') {
      // Use a special identifier for attachments without course
      finalCourseId = 'no-course'
    } else if (!finalCourseId) {
      return NextResponse.json(
        { error: 'Could not determine courseId' },
        { status: 400 }
      )
    }

    // Determine bucket based on file type
    let bucket: string
    switch (fileType) {
      case 'video':
        bucket = BUCKETS.VIDEOS
        break
      case 'attachment':
        bucket = BUCKETS.ATTACHMENTS
        break
      case 'thumbnail':
        bucket = BUCKETS.THUMBNAILS
        break
      default:
        return NextResponse.json(
          { error: 'Invalid file type' },
          { status: 400 }
        )
    }

    // Generate storage key
    // For attachments without course, use attachmentId as the course identifier
    const storageKey = generateStorageKey(
      fileType,
      filename,
      finalCourseId === 'no-course' ? resourceId : finalCourseId,
      resourceId
    )

    // Generate presigned upload URL (valid for 1 hour)
    const uploadUrl = await getPresignedUploadUrl(
      bucket,
      storageKey,
      contentType,
      3600 // 1 hour
    )

    return NextResponse.json({
      uploadUrl,
      storageKey,
      bucket,
      expiresIn: 3600,
    })
  } catch (error: any) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

