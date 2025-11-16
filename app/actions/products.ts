'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { isAdmin } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { queryOne } from '@/lib/db/client'

/**
 * Create a file product
 */
export async function createFileProduct(data: {
  attachment_id: string
  title: string
  description?: string
  price: number
  is_active?: boolean
}): Promise<{ success: boolean; fileProductId?: string; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect('/login')
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem criar produtos.' }
  }

  try {
    // Check if attachment already has a product
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM file_products WHERE attachment_id = $1`,
      [data.attachment_id]
    )

    if (existing) {
      return { success: false, error: 'Este arquivo já possui um produto associado.' }
    }

    const result = await queryOne<{ id: string }>(
      `INSERT INTO file_products (attachment_id, title, description, price, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        data.attachment_id,
        data.title,
        data.description || null,
        data.price,
        data.is_active !== undefined ? data.is_active : true,
      ]
    )

    if (!result) {
      return { success: false, error: 'Erro ao criar produto: resultado não retornado' }
    }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')

    return { success: true, fileProductId: result.id }
  } catch (error: any) {
    console.error('Error creating file product:', error)
    return { success: false, error: error.message || 'Erro ao criar produto' }
  }
}

/**
 * Update a file product
 */
export async function updateFileProduct(
  id: string,
  data: {
    title?: string
    description?: string
    price?: number
    is_active?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect('/login')
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem atualizar produtos.' }
  }

  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(data.title)
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(data.description || null)
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramIndex++}`)
      values.push(data.price)
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(data.is_active)
    }

    if (updates.length === 0) {
      return { success: false, error: 'Nenhum campo para atualizar' }
    }

    values.push(id)

    await queryOne(
      `UPDATE file_products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values
    )

    revalidatePath('/admin/loja')
    revalidatePath('/loja')

    return { success: true }
  } catch (error: any) {
    console.error('Error updating file product:', error)
    return { success: false, error: error.message || 'Erro ao atualizar produto' }
  }
}

/**
 * Delete a file product
 */
export async function deleteFileProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect('/login')
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem deletar produtos.' }
  }

  try {
    await queryOne(`DELETE FROM file_products WHERE id = $1`, [id])

    revalidatePath('/admin/loja')
    revalidatePath('/loja')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting file product:', error)
    return { success: false, error: error.message || 'Erro ao deletar produto' }
  }
}

/**
 * Create a product bundle
 */
export async function createProduct(data: {
  title: string
  description?: string
  price: number
  thumbnail_url?: string
  is_active?: boolean
  attachment_ids: string[]
}): Promise<{ success: boolean; productId?: string; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect('/login')
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem criar bundles.' }
  }

  try {
    // Create product
    const productResult = await queryOne<{ id: string }>(
      `INSERT INTO products (title, description, price, thumbnail_url, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        data.title,
        data.description || null,
        data.price,
        data.thumbnail_url || null,
        data.is_active !== undefined ? data.is_active : true,
      ]
    )

    if (!productResult) {
      return { success: false, error: 'Erro ao criar bundle: resultado não retornado' }
    }

    const productId = productResult.id

    // Add attachments to bundle
    if (data.attachment_ids.length > 0) {
      for (const attachmentId of data.attachment_ids) {
        await queryOne(
          `INSERT INTO product_attachments (product_id, attachment_id)
           VALUES ($1, $2)
           ON CONFLICT (product_id, attachment_id) DO NOTHING`,
          [productId, attachmentId]
        )
      }
    }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')

    return { success: true, productId }
  } catch (error: any) {
    console.error('Error creating product:', error)
    return { success: false, error: error.message || 'Erro ao criar bundle' }
  }
}

/**
 * Update a product bundle
 */
export async function updateProduct(
  id: string,
  data: {
    title?: string
    description?: string
    price?: number
    thumbnail_url?: string
    is_active?: boolean
    attachment_ids?: string[]
  }
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect('/login')
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem atualizar bundles.' }
  }

  try {
    // Update product fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(data.title)
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(data.description || null)
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramIndex++}`)
      values.push(data.price)
    }
    if (data.thumbnail_url !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex++}`)
      values.push(data.thumbnail_url || null)
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(data.is_active)
    }

    if (updates.length > 0) {
      values.push(id)
      await queryOne(
        `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        values
      )
    }

    // Update attachments if provided
    if (data.attachment_ids !== undefined) {
      // Delete existing attachments
      await queryOne(`DELETE FROM product_attachments WHERE product_id = $1`, [id])

      // Add new attachments
      if (data.attachment_ids.length > 0) {
        for (const attachmentId of data.attachment_ids) {
          await queryOne(
            `INSERT INTO product_attachments (product_id, attachment_id)
             VALUES ($1, $2)`,
            [id, attachmentId]
          )
        }
      }
    }

    revalidatePath('/admin/loja')
    revalidatePath('/loja')

    return { success: true }
  } catch (error: any) {
    console.error('Error updating product:', error)
    return { success: false, error: error.message || 'Erro ao atualizar bundle' }
  }
}

/**
 * Delete a product bundle
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect('/login')
  }

  const admin = await isAdmin()
  if (!admin) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem deletar bundles.' }
  }

  try {
    await queryOne(`DELETE FROM products WHERE id = $1`, [id])

    revalidatePath('/admin/loja')
    revalidatePath('/loja')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return { success: false, error: error.message || 'Erro ao deletar bundle' }
  }
}

