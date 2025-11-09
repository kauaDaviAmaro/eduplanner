'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { query } from '@/lib/db/client'

/**
 * Update user profile (name only for now)
 */
export async function updateProfile(data: {
  name?: string
}): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  if (data.name !== undefined) {
    // Validate name
    if (data.name.trim().length === 0) {
      return { success: false, error: 'Nome não pode estar vazio' }
    }

    if (data.name.length > 100) {
      return { success: false, error: 'Nome muito longo (máximo 100 caracteres)' }
    }
  }

  try {
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(data.name.trim())
    }

    if (updates.length === 0) {
      return { success: true }
    }

    updates.push(`updated_at = NOW()`)
    params.push(userId)

    await query(
      `UPDATE profiles
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      params
    )

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar perfil' }
  }
}




