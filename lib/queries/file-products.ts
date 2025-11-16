import { queryOne, queryMany } from '@/lib/db/client'
import { getCurrentUserId } from '@/lib/auth/helpers'

/**
 * File product with attachment information
 */
export type FileProduct = {
  id: string
  attachment_id: string
  title: string
  description: string | null
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Attachment info
  file_name: string
  file_type: string
  file_url: string | null
}

/**
 * File product with purchase status
 */
export type FileProductWithPurchaseStatus = FileProduct & {
  is_purchased: boolean
}

/**
 * Get all file products (for admin - includes inactive)
 */
export async function getFileProducts(includeInactive: boolean = false): Promise<FileProduct[]> {
  let query = `
    SELECT 
       fp.id,
       fp.attachment_id,
       fp.title,
       fp.description,
       fp.price,
       fp.is_active,
       fp.created_at,
       fp.updated_at,
       a.file_name,
       a.file_type,
       a.file_url
     FROM file_products fp
     INNER JOIN attachments a ON fp.attachment_id = a.id
  `
  
  if (!includeInactive) {
    query += ` WHERE fp.is_active = true`
  }
  
  query += ` ORDER BY fp.created_at DESC`

  const products = await queryMany<FileProduct>(query)
  return products
}

/**
 * Get file product by ID
 */
export async function getFileProductById(id: string): Promise<FileProduct | null> {
  const product = await queryOne<FileProduct>(
    `SELECT 
       fp.id,
       fp.attachment_id,
       fp.title,
       fp.description,
       fp.price,
       fp.is_active,
       fp.created_at,
       fp.updated_at,
       a.file_name,
       a.file_type,
       a.file_url
     FROM file_products fp
     INNER JOIN attachments a ON fp.attachment_id = a.id
     WHERE fp.id = $1`,
    [id]
  )

  return product || null
}

/**
 * Get file products with purchase status for current user
 */
export async function getFileProductsWithPurchaseStatus(): Promise<FileProductWithPurchaseStatus[]> {
  const userId = await getCurrentUserId()
  if (!userId) {
    // If not logged in, return products without purchase status
    const products = await getFileProducts()
    return products.map((p) => ({ ...p, is_purchased: false }))
  }

  const products = await queryMany<FileProductWithPurchaseStatus>(
    `SELECT 
       fp.id,
       fp.attachment_id,
       fp.title,
       fp.description,
       fp.price,
       fp.is_active,
       fp.created_at,
       fp.updated_at,
       a.file_name,
       a.file_type,
       a.file_url,
       CASE WHEN fpur.id IS NOT NULL THEN true ELSE false END as is_purchased
     FROM file_products fp
     INNER JOIN attachments a ON fp.attachment_id = a.id
     LEFT JOIN file_purchases fpur ON fp.id = fpur.file_product_id AND fpur.user_id = $1
     WHERE fp.is_active = true
     ORDER BY fp.created_at DESC`,
    [userId]
  )

  return products
}

/**
 * Check if user has purchased a file product
 */
export async function hasFilePurchase(fileProductId: string, userId: string): Promise<boolean> {
  const purchase = await queryOne<{ id: string }>(
    `SELECT id FROM file_purchases 
     WHERE file_product_id = $1 AND user_id = $2`,
    [fileProductId, userId]
  )

  return !!purchase
}

/**
 * Check if user has purchased an attachment (via any file product)
 */
export async function hasPurchasedAttachment(attachmentId: string, userId: string): Promise<boolean> {
  const purchase = await queryOne<{ id: string }>(
    `SELECT fp.id 
     FROM file_purchases fp
     INNER JOIN file_products fprod ON fp.file_product_id = fprod.id
     WHERE fprod.attachment_id = $1 AND fp.user_id = $2`,
    [attachmentId, userId]
  )

  return !!purchase
}

/**
 * Get all purchased files for a user
 */
export async function getUserPurchasedFiles(userId: string): Promise<FileProduct[]> {
  const products = await queryMany<FileProduct>(
    `SELECT 
       fp.id,
       fp.attachment_id,
       fp.title,
       fp.description,
       fp.price,
       fp.is_active,
       fp.created_at,
       fp.updated_at,
       a.file_name,
       a.file_type,
       a.file_url
     FROM file_purchases fpur
     INNER JOIN file_products fp ON fpur.file_product_id = fp.id
     INNER JOIN attachments a ON fp.attachment_id = a.id
     WHERE fpur.user_id = $1
     ORDER BY fpur.purchased_at DESC`,
    [userId]
  )

  return products
}

/**
 * Get IDs of attachments that user has purchased
 */
export async function getUserPurchasedFileIds(userId: string): Promise<string[]> {
  const purchases = await queryMany<{ attachment_id: string }>(
    `SELECT DISTINCT fp.attachment_id
     FROM file_purchases fpur
     INNER JOIN file_products fp ON fpur.file_product_id = fp.id
     WHERE fpur.user_id = $1`,
    [userId]
  )

  return purchases.map((p) => p.attachment_id)
}

/**
 * Create a file purchase record
 */
export async function createFilePurchase(
  userId: string,
  fileProductId: string,
  stripePaymentIntentId: string,
  amountPaid: number
): Promise<void> {
  await queryOne(
    `INSERT INTO file_purchases (user_id, file_product_id, stripe_payment_intent_id, amount_paid)
     VALUES ($1, $2, $3, $4)`,
    [userId, fileProductId, stripePaymentIntentId, amountPaid]
  )
}

/**
 * Get file purchase by Stripe payment intent ID
 */
export async function getFilePurchaseByPaymentIntentId(
  stripePaymentIntentId: string
): Promise<{ id: string; user_id: string; file_product_id: string } | null> {
  const purchase = await queryOne<{ id: string; user_id: string; file_product_id: string }>(
    `SELECT id, user_id, file_product_id
     FROM file_purchases
     WHERE stripe_payment_intent_id = $1`,
    [stripePaymentIntentId]
  )

  return purchase || null
}

