import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { hasAttachmentAccess, getAttachmentWithCourse } from '@/lib/queries/attachments'
import { getPresignedUrl, BUCKETS } from '@/lib/storage/client'

/**
 * GET /api/preview/[attachmentId]
 * Returns a signed URL for the attachment preview
 * Valid for 1 hour (3600 seconds)
 * Does NOT record the download (only for viewing)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { attachmentId } = await params
    const userId = await getCurrentUserId()

    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has access to this attachment
    const hasAccess = await hasAttachmentAccess(attachmentId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this attachment' },
        { status: 403 }
      )
    }

    // Get attachment information including file_url
    const attachment = await getAttachmentWithCourse(attachmentId)
    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    if (!attachment.file_url) {
      return NextResponse.json(
        { error: 'File URL not available' },
        { status: 404 }
      )
    }

    // Extract the MinIO key from file_url
    // file_url can be:
    // - Just the key: "file-{id}.pdf"
    // - Key with bucket: "attachments/file-{id}.pdf"
    // - Full URL: "http://minio:9000/attachments/file-{id}.pdf"
    let fileKey = attachment.file_url

    // Ensure fileKey is not null
    if (!fileKey) {
      return NextResponse.json(
        { error: 'File URL not available' },
        { status: 404 }
      )
    }

    // Remove protocol and domain if present
    if (fileKey.includes('://')) {
      const url = new URL(fileKey)
      fileKey = url.pathname
    }

    // Remove leading slash
    if (fileKey.startsWith('/')) {
      fileKey = fileKey.substring(1)
    }

    // Remove bucket prefix if present (getPresignedUrl needs only the key)
    if (fileKey.startsWith(`${BUCKETS.ATTACHMENTS}/`)) {
      fileKey = fileKey.replace(`${BUCKETS.ATTACHMENTS}/`, '')
    }

    // Generate signed URL with 1 hour expiration (3600 seconds) for preview
    const signedUrl = await getPresignedUrl(BUCKETS.ATTACHMENTS, fileKey, 3600)

    return NextResponse.json({
      url: signedUrl,
      expiresIn: 3600, // 1 hour
      fileName: attachment.file_name,
    })
  } catch (error: any) {
    console.error('Error generating preview signed URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


