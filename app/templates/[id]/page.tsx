'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Button, Form, Input, App, Typography, Spin, Tabs, Space, Descriptions, Tag, Alert, Card,
} from 'antd'
import { ArrowLeftOutlined, EditOutlined, FilePdfOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { generatePdf } from '@/lib/pdfExport'
import PdfDocument from '@/components/PdfDocument'
import { TemplateEditor } from '@/components/TemplateEditor'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Title } = Typography

interface VariableDef {
  name: string
  label: string
  type: string
  defaultValue: string
}

interface PdfTemplate {
  id: string
  name: string
  description: string | null
  content: string
  variables: string
  createdAt: string
  updatedAt: string
}

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

export default function TemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { message } = App.useApp()
  const [template, setTemplate] = useState<PdfTemplate | null>(null)
  const [generatedPdfs, setGeneratedPdfs] = useState<GeneratedPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [form] = Form.useForm()
  const [editContent, setEditContent] = useState('')
  const [previewData, setPreviewData] = useState<Record<string, string>>({})
  const previewRef = useRef<HTMLDivElement>(null)
  const [savingPdf, setSavingPdf] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTemplate()
      fetchGeneratedPdfs()
    }
  }, [params.id])

  useEffect(() => {
    if (!loading) {
      form.setFieldsValue(previewData)
    }
  }, [loading])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
        setEditContent(data.content)

        const variables: VariableDef[] = JSON.parse(data.variables || '[]')
        const defaultData: Record<string, string> = {}
        variables.forEach(v => { defaultData[v.name] = v.defaultValue || '' })
        setPreviewData(defaultData)
      } else {
        message.error('Template not found')
        router.push('/templates')
      }
    } catch {
      message.error('Failed to load template')
    } finally {
      setLoading(false)
    }
  }

  const fetchGeneratedPdfs = async () => {
    try {
      const response = await fetch(`/api/pdfs?templateId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setGeneratedPdfs(data)
      }
    } catch {
      // silent
    }
  }

  const handleUpdateTemplate = async () => {
    if (!template) return
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          content: editContent,
          variables: template.variables,
        }),
      })
      if (response.ok) {
        message.success('Template updated')
        fetchTemplate()
      } else {
        message.error('Failed to update template')
      }
    } catch {
      message.error('Failed to update template')
    }
  }

  const handleGeneratePdf = async () => {
    if (!template) return
    try {
      setGenerating(true)
      const values = await form.validateFields()

      const blob = await generatePdf(template.name, template.content, values)

      const timestamp = Date.now()
      const safeName = template.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
      const fileName = `${safeName}_${timestamp}.pdf`

      const formData = new FormData()
      formData.append('file', blob, fileName)
      formData.append('data', JSON.stringify(values))
      formData.append('fileName', fileName)

      setSavingPdf(true)
      const saveResponse = await fetch(`/api/templates/${template.id}/generate`, {
        method: 'POST',
        body: formData,
      })

      if (saveResponse.ok) {
        message.success('PDF generated and uploaded to MinIO')
        fetchGeneratedPdfs()
      } else {
        message.error('Failed to save PDF')
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to generate PDF')
    } finally {
      setGenerating(false)
      setSavingPdf(false)
    }
  }

  const handleDeletePdf = async (pdfId: string) => {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}`, { method: 'DELETE' })
      if (response.ok) {
        message.success('PDF deleted')
        fetchGeneratedPdfs()
      }
    } catch {
      message.error('Failed to delete PDF')
    }
  }

  const handleFormChange = (_: any, allValues: any) => {
    setPreviewData(allValues)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
  }

  if (!template) return null

  const variables: VariableDef[] = JSON.parse(template.variables || '[]')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>{template.name}</Title>
      </div>

      <Descriptions column={2} size="small" style={{ marginBottom: 24 }} bordered>
        <Descriptions.Item label="Name">{template.name}</Descriptions.Item>
        <Descriptions.Item label="Description">{template.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="Variables">
          {variables.map(v => (
            <Tag key={v.name} style={{ marginBottom: 4 }}>{v.label} (<code>{'{{'}{v.name}{'}}'}</code>)</Tag>
          ))}
        </Descriptions.Item>
        <Descriptions.Item label="Created">{dayjs(template.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
      </Descriptions>

      <Tabs
        defaultActiveKey="generate"
        items={[
          {
            key: 'generate',
            label: 'Generate PDF',
            children: (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 350 }}>
                  <Form form={form} layout="vertical" onValuesChange={handleFormChange}>
                    {variables.map(v => (
                      <Form.Item key={v.name} name={v.name} label={v.label}>
                        {v.type === 'textarea' ? <TextArea rows={3} /> : <Input />}
                      </Form.Item>
                    ))}
                    <Form.Item>
                      <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        onClick={handleGeneratePdf}
                        loading={generating || savingPdf}
                        size="large"
                      >
                        {generating ? 'Generating...' : savingPdf ? 'Uploading...' : 'Generate PDF'}
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
                <div style={{ flex: 1, minWidth: 350 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Preview</div>
                  <div
                    ref={previewRef}
                    style={{
                      border: '1px solid #e8e8e8',
                      borderRadius: 8,
                      padding: 16,
                      maxHeight: 500,
                      overflow: 'auto',
                      fontSize: 12,
                      lineHeight: 1.5,
                      background: '#fff',
                    }}
                  >
                    <PdfDocument content={template.content} data={previewData} />
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'editor',
            label: 'Edit Template',
            children: (
              <div>
                <TemplateEditor
                  value={editContent}
                  onChange={(html) => setEditContent(html)}
                />
                <div style={{ marginTop: 16 }}>
                  <Space>
                    <Button type="primary" icon={<EditOutlined />} onClick={handleUpdateTemplate}>
                      Save Changes
                    </Button>
                    <Button onClick={() => setEditContent(template.content)}>Reset</Button>
                  </Space>
                </div>
              </div>
            ),
          },
          {
            key: 'history',
            label: `Generated PDFs (${generatedPdfs.length})`,
            children: (
              <div>
                {generatedPdfs.length === 0 ? (
                  <Alert type="info" message="No PDFs generated yet. Fill in the fields and generate your first PDF." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {generatedPdfs.map(pdf => {
                      let data: Record<string, string> = {}
                      try { data = JSON.parse(pdf.data) } catch {}
                      return (
                        <Card key={pdf.id} size="small">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 500 }}>{pdf.fileName}</div>
                              <div style={{ fontSize: 12, color: '#999' }}>
                                Created: {dayjs(pdf.createdAt).format('DD/MM/YYYY HH:mm')}
                                {pdf.fileSize && ` | ${(pdf.fileSize / 1024).toFixed(1)} KB`}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                {Object.entries(data).slice(0, 3).map(([key, val]) => (
                                  <Tag key={key} style={{ fontSize: 11 }}>
                                    {key}: {String(val).substring(0, 30)}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                            <Space>
                              <Button
                                type="link"
                                icon={<EyeOutlined />}
                                onClick={() => router.push(`/pdfs/${pdf.id}`)}
                              >
                                Preview
                              </Button>
                              <Button
                                type="link"
                                icon={<DownloadOutlined />}
                                href={pdf.pdfUrl || '#'}
                                target="_blank"
                                disabled={!pdf.pdfUrl}
                              >
                                Download
                              </Button>
                              <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeletePdf(pdf.id)}
                              />
                            </Space>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
