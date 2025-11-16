import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/helpers'
import { updateLessonVideo, updateAttachmentFile } from '@/app/actions/courses'
import { fileExists, getFileUrl, BUCKETS } from '@/lib/storage/client'

/**
 * POST /api/upload/complete
 * Confirms that a file upload is complete and updates the database
 * 
 * Body: {
 *   lessonId?: string
 *   attachmentId?: string
 *   storageKey: string
 *   fileType: 'video' | 'attachment' | 'thumbnail'
 *   fileSize?: number
 *   duration?: number (for videos)
 *   bucket?: string
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
    const { lessonId, attachmentId, storageKey, fileType, fileSize, duration, bucket } = body

    // Validate input
    if (!storageKey || !fileType) {
      return NextResponse.json(
        { error: 'storageKey and fileType are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!['video', 'attachment', 'thumbnail', 'product-thumbnail'].includes(fileType)) {
      return NextResponse.json(
        { error: 'fileType must be video, attachment, thumbnail, or product-thumbnail' },
        { status: 400 }
      )
    }

    // Determine bucket if not provided
    let finalBucket: string
    if (bucket) {
      finalBucket = bucket
    } else {
      switch (fileType) {
        case 'video':
          finalBucket = BUCKETS.VIDEOS
          break
        case 'attachment':
          finalBucket = BUCKETS.ATTACHMENTS
          break
        case 'thumbnail':
        case 'product-thumbnail':
          finalBucket = BUCKETS.THUMBNAILS
          break
        default:
          return NextResponse.json(
            { error: 'Invalid file type' },
            { status: 400 }
          )
      }
    }

    // Verify file exists in MinIO
    const exists = await fileExists(finalBucket, storageKey)
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found in storage. Upload may have failed.' },
        { status: 404 }
      )
    }

    // Validate file size if provided (optional check)
    if (fileSize) {
      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10) * 1024 * 1024
      if (fileSize > maxFileSize) {
        // File already uploaded, but log warning
        console.warn(`File size ${fileSize} exceeds maximum ${maxFileSize}`)
      }
    }

    // Generate file URL
    const fileUrl = getFileUrl(finalBucket, storageKey)

    // Update database based on file type
    if (fileType === 'video') {
      if (!lessonId) {
        return NextResponse.json(
          { error: 'lessonId is required for video uploads' },
          { status: 400 }
        )
      }

      const result = await updateLessonVideo({
        lessonId,
        storageKey,
        videoUrl: fileUrl,
        duration,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update lesson video' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Video upload confirmed',
        fileUrl,
        storageKey,
      })
    } else if (fileType === 'attachment') {
      if (!attachmentId) {
        return NextResponse.json(
          { error: 'attachmentId is required for attachment uploads' },
          { status: 400 }
        )
      }

      const result = await updateAttachmentFile({
        attachmentId,
        storageKey,
        fileUrl,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update attachment' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Attachment upload confirmed',
        fileUrl,
        storageKey,
      })
    } else if (fileType === 'thumbnail') {
      // thumbnail - just return success, thumbnail_url is updated separately via course update
      return NextResponse.json({
        success: true,
        message: 'Thumbnail upload confirmed',
        fileUrl,
        storageKey,
      })
    } else {
      // product-thumbnail - just return success, thumbnail_url is updated separately via product update
      return NextResponse.json({
        success: true,
        message: 'Product thumbnail upload confirmed',
        fileUrl,
        storageKey,
      })
    }
  } catch (error: any) {
    console.error('Error confirming upload:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

