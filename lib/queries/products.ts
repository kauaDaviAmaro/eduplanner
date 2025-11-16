import { queryOne, queryMany } from '@/lib/db/client'
import { getCurrentUserId } from '@/lib/auth/helpers'

/**
 * Product (bundle) with attachment count
 */
export type Product = {
  id: string
  title: string
  description: string | null
  price: number
  thumbnail_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  attachment_count: number
}

/**
 * Product with purchase status and attachments
 */
export type ProductWithDetails = Product & {
  is_purchased: boolean
  attachments: Array<{
    id: string
    file_name: string
    file_type: string
    file_url: string | null
    video_url: string | null
  }>
}

/**
 * Get all products (bundles) - for admin includes inactive
 */
export async function getProducts(includeInactive: boolean = false): Promise<Product[]> {
  let query = `
    SELECT 
       p.id,
       p.title,
       p.description,
       p.price,
       p.thumbnail_url,
       p.is_active,
       p.created_at,
       p.updated_at,
       COUNT(pa.attachment_id) as attachment_count
     FROM products p
     LEFT JOIN product_attachments pa ON p.id = pa.product_id
  `
  
  if (!includeInactive) {
    query += ` WHERE p.is_active = true`
  }
  
  query += ` GROUP BY p.id ORDER BY p.created_at DESC`

  const products = await queryMany<Product & { attachment_count: string }>(query)
  return products.map((p) => ({
    ...p,
    attachment_count: Number.parseInt(p.attachment_count, 10),
  }))
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await queryOne<Product & { attachment_count: string }>(
    `SELECT 
       p.id,
       p.title,
       p.description,
       p.price,
       p.thumbnail_url,
       p.is_active,
       p.created_at,
       p.updated_at,
       COUNT(pa.attachment_id) as attachment_count
     FROM products p
     LEFT JOIN product_attachments pa ON p.id = pa.product_id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  )

  if (!product) return null

  return {
    ...product,
    attachment_count: Number.parseInt(product.attachment_count, 10),
  }
}

/**
 * Get product with full details including attachments and purchase status
 */
export async function getProductWithDetails(id: string): Promise<ProductWithDetails | null> {
  const userId = await getCurrentUserId()

  // Get product info
  const product = await queryOne<Product & { attachment_count: string; is_purchased: boolean }>(
    `SELECT 
       p.id,
       p.title,
       p.description,
       p.price,
       p.thumbnail_url,
       p.is_active,
       p.created_at,
       p.updated_at,
       COUNT(DISTINCT pa.attachment_id) as attachment_count,
       CASE WHEN ppr.id IS NOT NULL THEN true ELSE false END as is_purchased
     FROM products p
     LEFT JOIN product_attachments pa ON p.id = pa.product_id
     LEFT JOIN product_purchases ppr ON p.id = ppr.product_id ${userId ? 'AND ppr.user_id = $2' : 'AND ppr.user_id IS NULL'}
     WHERE p.id = $1
     GROUP BY p.id, ppr.id`,
    userId ? [id, userId] : [id]
  )

  if (!product) return null

  // Get attachments with video_url
  const attachments = await queryMany<{
    id: string
    file_name: string
    file_type: string
    file_url: string | null
    video_url: string | null
  }>(
    `SELECT 
       a.id,
       a.file_name,
       a.file_type,
       a.file_url,
       pa.video_url
     FROM product_attachments pa
     INNER JOIN attachments a ON pa.attachment_id = a.id
     WHERE pa.product_id = $1
     ORDER BY a.file_name`,
    [id]
  )

  return {
    ...product,
    attachment_count: Number.parseInt(product.attachment_count, 10),
    is_purchased: product.is_purchased || false,
    attachments,
  }
}

/**
 * Get all products with purchase status for current user
 */
export async function getProductsWithPurchaseStatus(): Promise<ProductWithDetails[]> {
  const userId = await getCurrentUserId()
  const products = await getProducts()

  const productsWithDetails = await Promise.all(
    products.map(async (product) => {
      const details = await getProductWithDetails(product.id)
      return details || {
        ...product,
        is_purchased: false,
        attachments: [],
      }
    })
  )

  return productsWithDetails
}

/**
 * Check if user has purchased a product (bundle)
 */
export async function hasProductPurchase(productId: string, userId: string): Promise<boolean> {
  const purchase = await queryOne<{ id: string }>(
    `SELECT id FROM product_purchases 
     WHERE product_id = $1 AND user_id = $2`,
    [productId, userId]
  )

  return !!purchase
}

/**
 * Get all attachments that user has purchased via bundles
 */
export async function getUserPurchasedBundleAttachmentIds(userId: string): Promise<string[]> {
  const attachments = await queryMany<{ attachment_id: string }>(
    `SELECT DISTINCT pa.attachment_id
     FROM product_purchases pp
     INNER JOIN product_attachments pa ON pp.product_id = pa.product_id
     WHERE pp.user_id = $1`,
    [userId]
  )

  return attachments.map((a) => a.attachment_id)
}

/**
 * Create a product purchase record
 */
export async function createProductPurchase(
  userId: string,
  productId: string,
  stripePaymentIntentId: string,
  amountPaid: number
): Promise<void> {
  await queryOne(
    `INSERT INTO product_purchases (user_id, product_id, stripe_payment_intent_id, amount_paid)
     VALUES ($1, $2, $3, $4)`,
    [userId, productId, stripePaymentIntentId, amountPaid]
  )
}

/**
 * Get product purchase by Stripe payment intent ID
 */
export async function getProductPurchaseByPaymentIntentId(
  stripePaymentIntentId: string
): Promise<{ id: string; user_id: string; product_id: string } | null> {
  const purchase = await queryOne<{ id: string; user_id: string; product_id: string }>(
    `SELECT id, user_id, product_id
     FROM product_purchases
     WHERE stripe_payment_intent_id = $1`,
    [stripePaymentIntentId]
  )

  return purchase || null
}

