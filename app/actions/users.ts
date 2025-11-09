'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/helpers'
import { query, queryOne } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

/**
 * Check if current user is admin
 */
async function checkAdmin(): Promise<boolean> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Acesso negado: apenas administradores podem realizar esta ação')
  }
  return true
}

/**
 * Create a new user (admin only)
 */
export async function createUser(data: {
  email: string
  password: string
  name?: string
  tierId: number
  isAdmin?: boolean
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (!data.email || !data.password) {
      return { success: false, error: 'Email e senha são obrigatórios' }
    }

    if (data.password.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' }
    }

    // Check if user already exists
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    )

    if (existingUser) {
      return { success: false, error: 'Email já está em uso' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    const userId = uuidv4()

    // Create user
    await query(
      `INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [userId, data.email, data.name || data.email.split('@')[0]]
    )

    // Create profile
    await query(
      `INSERT INTO profiles (id, email, name, tier_id, is_admin, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE 
       SET tier_id = $4, is_admin = $5, updated_at = NOW()`,
      [userId, data.email, data.name || data.email.split('@')[0], data.tierId, data.isAdmin || false]
    )

    // Create account with password
    await query(
      `INSERT INTO accounts (
        user_id, type, provider, provider_account_id,
        password, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, 'credentials', 'credentials', userId, hashedPassword]
    )

    revalidatePath('/dashboard')
    return { success: true, userId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao criar usuário' }
  }
}

/**
 * Update user (admin only)
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string
    email?: string
    tierId?: number
    isAdmin?: boolean
    password?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    // Validate input
    if (data.email) {
      // Check if email is already in use by another user
      const existingUser = await queryOne<{ id: string }>(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [data.email, userId]
      )

      if (existingUser) {
        return { success: false, error: 'Email já está em uso' }
      }
    }

    // Update user
    if (data.name !== undefined || data.email !== undefined) {
      const updates: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`)
        params.push(data.name.trim())
      }

      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`)
        params.push(data.email.trim())
      }

      updates.push(`updated_at = NOW()`)
      params.push(userId)

      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
      )
    }

    // Update profile
    const profileUpdates: string[] = []
    const profileParams: any[] = []
    let profileParamIndex = 1

    if (data.name !== undefined) {
      profileUpdates.push(`name = $${profileParamIndex++}`)
      profileParams.push(data.name.trim())
    }

    if (data.email !== undefined) {
      profileUpdates.push(`email = $${profileParamIndex++}`)
      profileParams.push(data.email.trim())
    }

    if (data.tierId !== undefined) {
      profileUpdates.push(`tier_id = $${profileParamIndex++}`)
      profileParams.push(data.tierId)
    }

    if (data.isAdmin !== undefined) {
      profileUpdates.push(`is_admin = $${profileParamIndex++}`)
      profileParams.push(data.isAdmin)
    }

    if (profileUpdates.length > 0) {
      profileUpdates.push(`updated_at = NOW()`)
      profileParams.push(userId)

      await query(
        `UPDATE profiles SET ${profileUpdates.join(', ')} WHERE id = $${profileParamIndex}`,
        profileParams
      )
    }

    // Update password if provided
    if (data.password) {
      if (data.password.length < 6) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' }
      }

      const hashedPassword = await bcrypt.hash(data.password, 10)
      await query(
        `UPDATE accounts 
         SET password = $1, updated_at = NOW()
         WHERE user_id = $2 AND type = $3`,
        [hashedPassword, userId, 'credentials']
      )
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar usuário' }
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()

    // Prevent deleting yourself
    const session = await auth()
    if (session?.user?.id === userId) {
      return { success: false, error: 'Você não pode deletar sua própria conta' }
    }

    // Delete user (cascade will delete profile, accounts, etc.)
    await query('DELETE FROM users WHERE id = $1', [userId])

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao deletar usuário' }
  }
}





