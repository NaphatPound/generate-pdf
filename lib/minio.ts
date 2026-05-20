import * as Minio from 'minio'

let minioClient: Minio.Client | null = null

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    const useSSL = process.env.MINIO_USE_SSL === 'true'
    const port = parseInt(process.env.MINIO_PORT || (useSSL ? '443' : '9000'))
    const rawEndpoint = process.env.MINIO_ENDPOINT || 'localhost'
    const endPoint = rawEndpoint.replace(/^https?:\/\//, '')

    minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    })
  }
  return minioClient
}

const minioClientProxy = new Proxy({} as Minio.Client, {
  get(target, prop) {
    const client = getMinioClient()
    return (client as any)[prop]
  },
})

export default minioClientProxy
