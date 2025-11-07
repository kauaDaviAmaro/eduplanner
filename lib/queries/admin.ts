import { queryOne, queryMany } from '@/lib/db/client'
import { Database } from '@/types/database'
import { getAllCourses } from './courses'

type User = {
  id: string
  name: string | null
  email: string
  created_at: string
}

type Profile = Database['public']['Tables']['profiles']['Row']
type Tier = Database['public']['Tables']['tiers']['Row']
type Course = Database['public']['Tables']['courses']['Row']

export type UserWithProfile = User & {
  profile: (Profile & { tier: Tier }) | null
}

export type AdminStats = {
  totalUsers: number
  totalCourses: number
  activeUsers: number // Users active in last 30 days
  totalCertificates: number
  averageProgress: number // Average progress percentage across all users
  totalAdmins: number
}

/**
 * Get admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  // Get total users
  const totalUsersResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM users`
  )
  const totalUsers = parseInt(totalUsersResult?.count || '0', 10)

  // Get total courses
  const totalCoursesResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM courses`
  )
  const totalCourses = parseInt(totalCoursesResult?.count || '0', 10)

  // Get active users (users with activity in last 30 days - based on user_progress)
  const activeUsersResult = await queryOne<{ count: string }>(
    `SELECT COUNT(DISTINCT user_id) as count 
     FROM user_progress 
     WHERE last_watched_at >= NOW() - INTERVAL '30 days'`
  )
  const activeUsers = parseInt(activeUsersResult?.count || '0', 10)

  // Get total certificates
  const totalCertificatesResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM certificates`
  )
  const totalCertificates = parseInt(totalCertificatesResult?.count || '0', 10)

  // Get total admins
  const totalAdminsResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM profiles WHERE is_admin = true`
  )
  const totalAdmins = parseInt(totalAdminsResult?.count || '0', 10)

  // Calculate average progress across all users
  // Simplified: average of certificates per user / total courses
  let averageProgress = 0
  if (totalUsers > 0 && totalCourses > 0) {
    // Get average certificates per user
    const avgCertificatesResult = await queryOne<{ avg: string }>(
      `SELECT COALESCE(AVG(cert_count), 0) as avg
       FROM (
         SELECT COUNT(*) as cert_count
         FROM certificates
         GROUP BY user_id
       ) sub`
    )
    const avgCertificates = parseFloat(avgCertificatesResult?.avg || '0')
    // Calculate percentage: (avg certificates / total courses) * 100
    averageProgress = Math.round((avgCertificates / totalCourses) * 100)
  }

  return {
    totalUsers,
    totalCourses,
    activeUsers,
    totalCertificates,
    averageProgress,
    totalAdmins,
  }
}

/**
 * Get all users with their profile information
 */
export async function getAllUsers(): Promise<UserWithProfile[]> {
  const users = await queryMany<User>(
    `SELECT id, name, email, created_at FROM users ORDER BY created_at DESC`
  )

  const usersWithProfiles: UserWithProfile[] = []

  for (const user of users) {
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
      [user.id]
    )

    usersWithProfiles.push({
      ...user,
      profile: profile || null,
    })
  }

  return usersWithProfiles
}

export type CourseWithTier = Course & {
  tier: Tier
}

/**
 * Get all courses for admin with tier information
 */
export async function getAllCoursesForAdmin(): Promise<CourseWithTier[]> {
  const courses = await queryMany<Course & { tier: Tier }>(
    `SELECT c.*, 
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
     FROM courses c
     INNER JOIN tiers t ON c.minimum_tier_id = t.id
     ORDER BY c.created_at DESC`
  )

  return courses as CourseWithTier[]
}

export type AttachmentForAdmin = {
  id: string
  file_name: string
  file_type: string
  file_url: string | null
  minimum_tier_id: number
  created_at: string
  updated_at: string
  lesson_id: string | null
  lesson_title: string | null
  module_id: string | null
  module_title: string | null
  course_id: string | null
  course_title: string | null
  tier_name: string
  tier_permission_level: number
}

/**
 * Get all attachments for admin with full context
 * Returns all attachments regardless of permission level
 * Includes attachments without course (lesson_id is NULL)
 */
export async function getAllAttachmentsForAdmin(): Promise<AttachmentForAdmin[]> {
  const attachments = await queryMany<AttachmentForAdmin>(
    `SELECT 
       a.id,
       a.file_name,
       a.file_type,
       a.file_url,
       a.minimum_tier_id,
       a.created_at,
       a.updated_at,
       a.lesson_id,
       l.title as lesson_title,
       m.id as module_id,
       m.title as module_title,
       c.id as course_id,
       c.title as course_title,
       t.name as tier_name,
       t.permission_level as tier_permission_level
     FROM attachments a
     LEFT JOIN lessons l ON a.lesson_id = l.id
     LEFT JOIN modules m ON l.module_id = m.id
     LEFT JOIN courses c ON m.course_id = c.id
     INNER JOIN tiers t ON a.minimum_tier_id = t.id
     ORDER BY a.created_at DESC`
  )

  return attachments
}

/**
 * Get a single attachment by ID for admin with full context
 * Includes attachments without course (lesson_id is NULL)
 */
export async function getAttachmentByIdForAdmin(attachmentId: string): Promise<AttachmentForAdmin | null> {
  const attachment = await queryOne<AttachmentForAdmin>(
    `SELECT 
       a.id,
       a.file_name,
       a.file_type,
       a.file_url,
       a.minimum_tier_id,
       a.created_at,
       a.updated_at,
       a.lesson_id,
       l.title as lesson_title,
       m.id as module_id,
       m.title as module_title,
       c.id as course_id,
       c.title as course_title,
       t.name as tier_name,
       t.permission_level as tier_permission_level
     FROM attachments a
     LEFT JOIN lessons l ON a.lesson_id = l.id
     LEFT JOIN modules m ON l.module_id = m.id
     LEFT JOIN courses c ON m.course_id = c.id
     INNER JOIN tiers t ON a.minimum_tier_id = t.id
     WHERE a.id = $1`,
    [attachmentId]
  )

  return attachment
}

