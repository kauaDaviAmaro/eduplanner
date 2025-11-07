import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/helpers'
import { getCourseById } from '@/lib/queries/courses'

/**
 * GET /api/courses/[id]
 * Get course with all modules, lessons, and attachments (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const course = await getCourseById(id)

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error: any) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

