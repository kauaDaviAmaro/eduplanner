import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import { isBuildTimeError } from './build-error'

/**
 * Get the current session safely, handling JWT errors gracefully
 */
export async function getSession() {
  try {
    return await auth()
  } catch (error) {
    if (isBuildTimeError(error)) {
      return null
    }
    console.warn('Session error (likely corrupted cookie):', error)
    return null
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
}

/**
 * Get the current user's ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isAdmin || false
}

/**
 * Get user's permission level
 */
export async function getPermissionLevel(): Promise<number> {
  const user = await getCurrentUser()
  return user?.permissionLevel || 0
}

/**
 * Create a new user with password
 */
export async function createUserWithPassword(
  email: string,
  password: string,
  name?: string
): Promise<{ id: string } | null> {
  // Check if user already exists
  const existingUser = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  )

  if (existingUser) {
    return null
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const userId = await queryOne<{ id: string }>(
    `INSERT INTO users (email, name, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING id`,
    [email, name || email.split('@')[0]]
  )

  if (!userId) {
    return null
  }

  await query(
    `INSERT INTO accounts (
      user_id, type, provider, provider_account_id,
      password, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [userId.id, 'credentials', 'credentials', userId.id, hashedPassword]
  )

  return userId
}

