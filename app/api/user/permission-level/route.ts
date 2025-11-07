import { NextResponse } from 'next/server'
import { getPermissionLevel } from '@/lib/auth/helpers'

/**
 * GET /api/user/permission-level
 * Returns the current user's permission level
 */
export async function GET() {
  try {
    const permissionLevel = await getPermissionLevel()
    
    return NextResponse.json({
      permissionLevel,
    })
  } catch (error: any) {
    console.error('Error getting permission level:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

