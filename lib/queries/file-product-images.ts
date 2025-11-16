import { queryOne, queryMany } from '@/lib/db/client'

/**
 * File product image
 */
export type FileProductImage = {
  id: string
  file_product_id: string
  image_url: string
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * Get all images for a file product
 */
export async function getFileProductImages(fileProductId: string): Promise<FileProductImage[]> {
  const images = await queryMany<FileProductImage>(
    `SELECT 
       id,
       file_product_id,
       image_url,
       display_order,
       created_at,
       updated_at
     FROM file_product_images
     WHERE file_product_id = $1
     ORDER BY display_order ASC, created_at ASC`,
    [fileProductId]
  )

  return images
}

/**
 * Create a file product image
 */
export async function createFileProductImage(
  fileProductId: string,
  imageUrl: string,
  displayOrder: number = 0
): Promise<FileProductImage> {
  const image = await queryOne<FileProductImage>(
    `INSERT INTO file_product_images (file_product_id, image_url, display_order)
     VALUES ($1, $2, $3)
     RETURNING id, file_product_id, image_url, display_order, created_at, updated_at`,
    [fileProductId, imageUrl, displayOrder]
  )

  if (!image) {
    throw new Error('Failed to create file product image')
  }

  return image
}

/**
 * Delete a file product image
 */
export async function deleteFileProductImage(imageId: string): Promise<void> {
  await queryOne(
    `DELETE FROM file_product_images WHERE id = $1`,
    [imageId]
  )
}

/**
 * Update display order of images
 */
export async function updateFileProductImageOrder(
  imageId: string,
  displayOrder: number
): Promise<void> {
  await queryOne(
    `UPDATE file_product_images 
     SET display_order = $1, updated_at = NOW()
     WHERE id = $2`,
    [displayOrder, imageId]
  )
}

