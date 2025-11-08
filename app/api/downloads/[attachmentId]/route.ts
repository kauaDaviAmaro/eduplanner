import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { canDownloadAttachment, getAttachmentWithCourse } from '@/lib/queries/attachments'
import { getPresignedUrl, BUCKETS } from '@/lib/storage/client'
import { query } from '@/lib/db/client'

/**
 * GET /api/downloads/[attachmentId]
 * Returns a signed URL for the attachment download
 * Valid for 60 seconds
 * Also records the download in user_downloads table
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

    // Check if user can download this attachment
    const canDownload = await canDownloadAttachment(attachmentId)
    if (!canDownload.canDownload) {
      return NextResponse.json(
        { error: canDownload.reason || 'Forbidden: You cannot download this attachment' },
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

    // Generate signed URL with 60 seconds expiration
    const signedUrl = await getPresignedUrl(BUCKETS.ATTACHMENTS, fileKey, 60)

    // Record the download (upsert to update timestamp if already downloaded)
    try {
      await query(
        `INSERT INTO user_downloads (user_id, attachment_id, downloaded_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, attachment_id) DO UPDATE
         SET downloaded_at = NOW()`,
        [userId, attachmentId]
      )
    } catch (error) {
      // Log error but don't fail the request if recording fails
      console.error('Error recording download:', error)
    }

    return NextResponse.json({
      url: signedUrl,
      expiresIn: 60, // 60 seconds
      fileName: attachment.file_name,
    })
  } catch (error: any) {
    console.error('Error generating download signed URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

