import { getMinioClient } from '@/lib/minio'

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'pdf-generator'

export async function ensureBucketExists() {
  const minioClient = getMinioClient()
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`Bucket ${BUCKET_NAME} created successfully.`)
    }
  } catch (error: any) {
    if (error.code === 'SignatureDoesNotMatch') {
      console.error('MinIO Authentication Failed: Verify MINIO_ACCESS_KEY and MINIO_SECRET_KEY in .env')
    }
    console.error('Error checking/creating bucket:', error)
    throw error
  }
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const minioClient = getMinioClient()
  await ensureBucketExists()

  const objectName = `${Date.now()}-${fileName}`
  const metaData = { 'Content-Type': mimeType }

  try {
    await minioClient.putObject(BUCKET_NAME, objectName, fileBuffer, fileBuffer.length, metaData)
    return objectName
  } catch (error) {
    console.error('Error uploading file to MinIO:', error)
    throw error
  }
}

export async function getFileUrl(objectName: string): Promise<string> {
  const minioClient = getMinioClient()
  try {
    const presignedUrl = await minioClient.presignedGetObject(BUCKET_NAME, objectName, 7 * 24 * 60 * 60)
    const publicUrl = process.env.MINIO_PUBLIC_URL
    if (publicUrl) {
      const url = new URL(presignedUrl)
      const publicUrlObj = new URL(publicUrl)
      url.protocol = publicUrlObj.protocol
      url.hostname = publicUrlObj.hostname
      url.port = publicUrlObj.port
      return url.toString()
    }
    return presignedUrl
  } catch (error) {
    console.error('Error getting file URL:', error)
    throw error
  }
}

export async function deleteFile(objectName: string): Promise<void> {
  const minioClient = getMinioClient()
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName)
  } catch (error) {
    console.error('Error deleting file from MinIO:', error)
    throw error
  }
}
