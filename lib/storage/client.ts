import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
const port = parseInt(process.env.MINIO_PORT || '9000', 10)
const useSSL = process.env.MINIO_USE_SSL === 'true'
const accessKeyId = process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin'
const secretAccessKey = process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin'

// Public endpoint for browser-accessible URLs (presigned URLs)
// Use MINIO_PUBLIC_ENDPOINT if set, otherwise fall back to localhost
const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'localhost'
const publicPort = process.env.MINIO_PUBLIC_PORT ? parseInt(process.env.MINIO_PUBLIC_PORT, 10) : port

// S3Client for server-side operations (uses internal endpoint)
const s3Client = new S3Client({
  endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
  region: 'us-east-1', // MinIO doesn't care about region, but SDK requires it
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
})

// S3Client for generating presigned URLs (uses public endpoint)
// This ensures the signature is calculated with the correct hostname
const publicS3Client = new S3Client({
  endpoint: `${useSSL ? 'https' : 'http'}://${publicEndpoint}:${publicPort}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
})

export const BUCKETS = {
  VIDEOS: process.env.MINIO_BUCKET_VIDEOS || 'videos',
  ATTACHMENTS: process.env.MINIO_BUCKET_ATTACHMENTS || 'attachments',
  THUMBNAILS: process.env.MINIO_BUCKET_THUMBNAILS || 'thumbnails',
}

/**
 * Upload a file to MinIO
 */
export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await s3Client.send(command)

  return getFileUrl(bucket, key)
}

/**
 * Get a file from MinIO
 */
export async function getFile(bucket: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  const response = await s3Client.send(command)
  
  if (!response.Body) {
    throw new Error(`File not found: ${bucket}/${key}`)
  }

  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as any) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}

/**
 * Delete a file from MinIO
 */
export async function deleteFile(bucket: string, key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Check if a file exists
 */
export async function fileExists(bucket: string, key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    await s3Client.send(command)
    return true
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error
  }
}

/**
 * Generate a presigned URL for temporary access (useful for private files)
 * Uses the public S3Client to ensure the signature is calculated with the correct hostname
 */
export async function getPresignedUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  // Use publicS3Client to generate URLs with the correct hostname for browser access
  return await getSignedUrl(publicS3Client, command, { expiresIn })
}

/**
 * Generate a presigned URL for uploading a file (PUT operation)
 * This allows direct upload from browser to MinIO without going through Next.js server
 * Uses the public S3Client to ensure the signature is calculated with the correct hostname
 */
export async function getPresignedUploadUrl(
  bucket: string,
  key: string,
  contentType?: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  // Use publicS3Client to generate URLs with the correct hostname for browser access
  return await getSignedUrl(publicS3Client, command, { expiresIn })
}

/**
 * Generate a unique storage key for a file
 * Format: course-{courseId}/lesson-{lessonId}/{sanitized-filename}-{timestamp}.{ext}
 * or: course-{courseId}/attachment-{attachmentId}/{sanitized-filename}-{timestamp}.{ext}
 * or: products/product-{productId}/{sanitized-filename}-{timestamp}.{ext} (for product-thumbnail)
 */
export function generateStorageKey(
  type: 'video' | 'attachment' | 'thumbnail' | 'product-thumbnail',
  filename: string,
  courseId: string,
  resourceId: string,
  timestamp?: number
): string {
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/[-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')

  const ext = filename.split('.').pop()?.toLowerCase() || 'bin'
  
  const ts = timestamp || Date.now()

  let prefix: string
  let bucketPrefix: string
  
  switch (type) {
    case 'video':
      prefix = `lesson-${resourceId}`
      bucketPrefix = ''
      break
    case 'attachment':
      prefix = `attachment-${resourceId}`
      bucketPrefix = ''
      break
    case 'thumbnail':
      prefix = `course-${courseId}`
      bucketPrefix = ''
      break
    case 'product-thumbnail':
      prefix = `product-${resourceId}`
      bucketPrefix = 'products/'
      break
    default:
      prefix = `resource-${resourceId}`
      bucketPrefix = ''
  }

  const nameWithoutExt = sanitized.replace(/\.[^/.]+$/, '')
  
  if (type === 'product-thumbnail') {
    return `${bucketPrefix}${prefix}/${nameWithoutExt}-${ts}.${ext}`
  }
  
  return `course-${courseId}/${prefix}/${nameWithoutExt}-${ts}.${ext}`
}

/**
 * Get the public URL for a file
 * Note: This assumes the bucket is configured for public access
 */
export function getFileUrl(bucket: string, key: string): string {
  const protocol = useSSL ? 'https' : 'http'
  return `${protocol}://${publicEndpoint}:${publicPort}/${bucket}/${key}`
}

export async function uploadVideo(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = 'video/mp4'
): Promise<string> {
  return uploadFile(BUCKETS.VIDEOS, key, body, contentType)
}

export async function uploadAttachment(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<string> {
  return uploadFile(BUCKETS.ATTACHMENTS, key, body, contentType)
}

export async function uploadThumbnail(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  return uploadFile(BUCKETS.THUMBNAILS, key, body, contentType)
}

export { s3Client }

