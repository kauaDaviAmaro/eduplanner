import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { hasAttachmentAccess } from '@/lib/queries/attachments'
import { queryOne } from '@/lib/db/client'

/**
 * GET /api/attachments/[attachmentId]/tier
 * Returns tier information for an attachment
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

    // Get tier information for the attachment
    const tier = await queryOne<{
      tier_name: string
      tier_permission_level: number
    }>(
      `SELECT t.name as tier_name, t.permission_level as tier_permission_level
       FROM attachments a
       INNER JOIN tiers t ON a.minimum_tier_id = t.id
       WHERE a.id = $1`,
      [attachmentId]
    )

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier information not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tier_name: tier.tier_name,
      tier_permission_level: tier.tier_permission_level,
    })
  } catch (error: any) {
    console.error('Error fetching tier information:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




