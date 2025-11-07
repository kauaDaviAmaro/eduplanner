import { queryOne } from '@/lib/db/client'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Tier = Database['public']['Tables']['tiers']['Row']

export type ProfileWithTier = Profile & {
  tier: Tier
}

/**
 * Get the current user's profile with tier information
 */
export async function getCurrentUserProfile(): Promise<ProfileWithTier | null> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const profile = await queryOne<Profile & { tier: Tier }>(
    `SELECT p.*, 
            json_build_object(
              'id', t.id,
              'name', t.name,
              'price_monthly', t.price_monthly,
              'description', t.description,
              'download_limit', t.download_limit,
              'permission_level', t.permission_level,
              'created_at', t.created_at,
              'updated_at', t.updated_at
            ) as tier
     FROM profiles p
     INNER JOIN tiers t ON p.tier_id = t.id
     WHERE p.id = $1`,
    [userId]
  )

  if (!profile) {
    return null
  }

  return profile as ProfileWithTier
}

/**
 * Get a user's profile by ID (admin only or own profile)
 */
export async function getUserProfile(userId: string): Promise<ProfileWithTier | null> {
  const profile = await queryOne<Profile & { tier: Tier }>(
    `SELECT p.*, 
            json_build_object(
              'id', t.id,
              'name', t.name,
              'price_monthly', t.price_monthly,
              'description', t.description,
              'download_limit', t.download_limit,
              'permission_level', t.permission_level,
              'created_at', t.created_at,
              'updated_at', t.updated_at
            ) as tier
     FROM profiles p
     INNER JOIN tiers t ON p.tier_id = t.id
     WHERE p.id = $1`,
    [userId]
  )

  if (!profile) {
    return null
  }

  return profile as ProfileWithTier
}

/**
 * Get user's permission level
 */
export async function getUserPermissionLevel(): Promise<number> {
  const profile = await getCurrentUserProfile()
  return profile?.tier.permission_level || 0
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.is_admin || false
}
