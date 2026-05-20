'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Spin, Typography, App, Descriptions, Space } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title } = Typography

interface GeneratedPdf {
  id: string
  templateId: string
  templateName: string
  data: string
  fileName: string
  filePath: string
  pdfUrl: string | null
  fileSize: number | null
  createdAt: string
}

export default function PdfViewPage() {
  const router = useRouter()
  const params = useParams()
  const { message } = App.useApp()
  const [pdf, setPdf] = useState<GeneratedPdf | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPdf()
  }, [params.id])

  const fetchPdf = async () => {
    try {
      const response = await fetch(`/api/pdfs/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPdf(data)
      } else {
        message.error('PDF not found')
        router.push('/pdfs')
      }
    } catch {
      message.error('Failed to load PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!pdf) return
    try {
      const response = await fetch(`/api/pdfs/${pdf.id}`, { method: 'DELETE' })
      if (response.ok) {
        message.success('PDF deleted')
        router.push('/pdfs')
      }
    } catch {
      message.error('Failed to delete PDF')
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
  }

  if (!pdf) return null

  let parsedData: Record<string, string> = {}
  try {
    parsedData = JSON.parse(pdf.data)
  } catch {}

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/pdfs')}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>{pdf.fileName}</Title>
      </div>

      <Descriptions column={2} size="small" style={{ marginBottom: 24 }} bordered>
        <Descriptions.Item label="Template">{pdf.templateName}</Descriptions.Item>
        <Descriptions.Item label="File Name">{pdf.fileName}</Descriptions.Item>
        <Descriptions.Item label="Created">{dayjs(pdf.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="File Size">
          {pdf.fileSize ? `${(pdf.fileSize / 1024).toFixed(1)} KB` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Data" span={2}>
          {Object.entries(parsedData).map(([key, val]) => (
            <div key={key}>
              <strong>{key}:</strong> {String(val)}
            </div>
          ))}
        </Descriptions.Item>
      </Descriptions>

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          href={pdf.pdfUrl || '#'}
          target="_blank"
          disabled={!pdf.pdfUrl}
        >
          Download PDF
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Space>

      {pdf.pdfUrl && (
        <div style={{
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          overflow: 'hidden',
          height: '80vh',
        }}>
          <iframe
            src={pdf.pdfUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  )
}
