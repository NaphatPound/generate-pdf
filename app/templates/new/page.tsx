'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Form, Input, App, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Title } = Typography

const defaultContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    h1 { color: #3b7cff; }
    .info { margin-bottom: 10px; }
    .label { font-weight: 600; min-width: 120px; display: inline-block; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <div class="info">
    <span class="label">Name:</span> {{name}}
  </div>
  <div class="info">
    <span class="label">Detail:</span> {{detail}}
  </div>
  <p>{{content}}</p>
</body>
</html>`

export default function NewTemplatePage() {
  const router = useRouter()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState(defaultContent)
  const [extractedVars, setExtractedVars] = useState<string[]>([])

  const extractVariables = (html: string) => {
    const regex = /\{\{(\w+)\}\}/g
    const vars: string[] = []
    let match
    while ((match = regex.exec(html)) !== null) {
      if (!vars.includes(match[1])) vars.push(match[1])
    }
    return vars
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    const vars = extractVariables(value)
    setExtractedVars(vars)
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const vars = extractVariables(content)
      const variables = vars.map(v => ({
        name: v,
        label: v.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
        type: 'text',
        defaultValue: '',
      }))

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          content,
          variables: JSON.stringify(variables),
        }),
      })

      if (response.ok) {
        const template = await response.json()
        message.success('Template created successfully')
        router.push(`/templates/${template.id}`)
      } else {
        message.error('Failed to create template')
      }
    } catch {
      message.error('Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>New Template</Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 1200 }}
      >
        <Form.Item
          name="name"
          label="Template Name"
          rules={[{ required: true, message: 'Please enter template name' }]}
        >
          <Input placeholder="e.g., Invoice Template" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Brief description of this template" />
        </Form.Item>

        <Form.Item label="HTML Content" required>
          <div style={{
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            <TextArea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={20}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 13,
                borderRadius: 0,
                border: 'none',
              }}
            />
          </div>
        </Form.Item>

        {extractedVars.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong>Detected Variables ({extractedVars.length}):</strong>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {extractedVars.map(v => (
                <code key={v} style={{
                  background: '#e6f4ff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  color: '#1677ff',
                }}>
                  {'{{'}{v}{'}}'}
                </code>
              ))}
            </div>
          </div>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Template
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
