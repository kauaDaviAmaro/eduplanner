'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserId } from '@/lib/auth/helpers'
import { isAdmin } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { queryOne, queryMany } from '@/lib/db/client'

/**
 * Create a file product
 */
export async function createFileProduct(data: {
  attachment_id: string
  title: string
  description?: string
  price: number
  is_active?: boolean
  video_url?: string
  thumbnail_url?: string
  is_shop_only?: boolean
  long_description?: string
  specifications?: Record<string, any>
  tags?: string[]
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
      `INSERT INTO file_products (attachment_id, title, description, price, is_active, video_url, thumbnail_url, is_shop_only, long_description, specifications, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        data.attachment_id,
        data.title,
        data.description || null,
        data.price,
        data.is_active !== undefined ? data.is_active : true,
        data.video_url || null,
        data.thumbnail_url || null,
        data.is_shop_only !== undefined ? data.is_shop_only : true,
        data.long_description || null,
        data.specifications ? JSON.stringify(data.specifications) : null,
        data.tags && data.tags.length > 0 ? data.tags : null,
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
    video_url?: string
    thumbnail_url?: string
    is_shop_only?: boolean
    long_description?: string
    specifications?: Record<string, any>
    tags?: string[]
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
    if (data.video_url !== undefined) {
      updates.push(`video_url = $${paramIndex++}`)
      values.push(data.video_url || null)
    }
    if (data.thumbnail_url !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex++}`)
      values.push(data.thumbnail_url || null)
    }
    if (data.is_shop_only !== undefined) {
      updates.push(`is_shop_only = $${paramIndex++}`)
      values.push(data.is_shop_only)
    }
    if (data.long_description !== undefined) {
      updates.push(`long_description = $${paramIndex++}`)
      values.push(data.long_description || null)
    }
    if (data.specifications !== undefined) {
      updates.push(`specifications = $${paramIndex++}`)
      values.push(data.specifications ? JSON.stringify(data.specifications) : null)
    }
    if (data.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`)
      values.push(data.tags && data.tags.length > 0 ? data.tags : null)
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
  attachment_videos?: Record<string, string> // Map of attachment_id -> video_url
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

    // Add attachments to bundle and mark as shop-only
    if (data.attachment_ids.length > 0) {
      for (const attachmentId of data.attachment_ids) {
        const videoUrl = data.attachment_videos?.[attachmentId] || null

        // Insert into product_attachments with video_url
        await queryOne(
          `INSERT INTO product_attachments (product_id, attachment_id, video_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id, attachment_id) DO UPDATE SET video_url = $3`,
          [productId, attachmentId, videoUrl]
        )

        // Mark attachment as shop-only by creating/updating file_product
        // Check if file_product already exists
        const existingFileProduct = await queryOne<{ id: string }>(
          `SELECT id FROM file_products WHERE attachment_id = $1`,
          [attachmentId]
        )

        if (!existingFileProduct) {
          // Create file_product with is_shop_only = true
          await queryOne(
            `INSERT INTO file_products (attachment_id, title, description, price, is_active, is_shop_only)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              attachmentId,
              data.title, // Use bundle title as default
              data.description || null,
              data.price, // Use bundle price as default
              false, // Not active as individual product
              true, // Shop-only
            ]
          )
        } else {
          // Update existing file_product to be shop-only
          await queryOne(
            `UPDATE file_products SET is_shop_only = true WHERE attachment_id = $1`,
            [attachmentId]
          )
        }
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
    attachment_videos?: Record<string, string> // Map of attachment_id -> video_url
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
      // Get current product info for shop-only marking
      const product = await queryOne<{ title: string; description: string | null; price: number }>(
        `SELECT title, description, price FROM products WHERE id = $1`,
        [id]
      )

      // Get existing attachment IDs before deletion
      const existingAttachments = await queryMany<{ attachment_id: string }>(
        `SELECT attachment_id FROM product_attachments WHERE product_id = $1`,
        [id]
      )
      const existingIds = new Set(existingAttachments.map(a => a.attachment_id))

      // Delete existing attachments
      await queryOne(`DELETE FROM product_attachments WHERE product_id = $1`, [id])

      // Add new attachments with video_url and mark as shop-only
      if (data.attachment_ids.length > 0) {
        for (const attachmentId of data.attachment_ids) {
          const videoUrl = data.attachment_videos?.[attachmentId] || null

          await queryOne(
            `INSERT INTO product_attachments (product_id, attachment_id, video_url)
             VALUES ($1, $2, $3)`,
            [id, attachmentId, videoUrl]
          )

          // Mark attachment as shop-only if not already marked
          const existingFileProduct = await queryOne<{ id: string }>(
            `SELECT id FROM file_products WHERE attachment_id = $1`,
            [attachmentId]
          )

          if (!existingFileProduct) {
            // Create file_product with is_shop_only = true
            await queryOne(
              `INSERT INTO file_products (attachment_id, title, description, price, is_active, is_shop_only)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                attachmentId,
                product?.title || 'Bundle File',
                product?.description || null,
                product?.price || 0,
                false, // Not active as individual product
                true, // Shop-only
              ]
            )
          } else {
            // Update existing file_product to be shop-only
            await queryOne(
              `UPDATE file_products SET is_shop_only = true WHERE attachment_id = $1`,
              [attachmentId]
            )
          }
        }
      }

      // If attachment was removed from bundle, we don't automatically unmark as shop-only
      // (it might still be shop-only for other reasons)
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

