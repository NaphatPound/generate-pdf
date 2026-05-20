'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table, Button, Modal, Input, Space, Tag, App, Popconfirm, Card, Row, Col } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SearchOutlined, FilePdfOutlined, ClearOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

interface PdfTemplate {
  id: string
  name: string
  description: string | null
  content: string
  variables: string
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const { message } = App.useApp()
  const [templates, setTemplates] = useState<PdfTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch {
      message.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (response.ok) {
        message.success('Template deleted successfully')
        fetchTemplates()
      } else {
        message.error('Failed to delete template')
      }
    } catch {
      message.error('Failed to delete template')
    }
  }

  const filteredTemplates = useMemo(() => {
    if (!search) return templates
    const q = search.toLowerCase()
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q))
    )
  }, [templates, search])

  const columns: ColumnsType<PdfTemplate> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <a onClick={() => router.push(`/templates/${record.id}`)} style={{ fontWeight: 500 }}>
          {name}
        </a>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string | null) => desc || '-',
      responsive: ['md'] as any,
    },
    {
      title: 'Variables',
      key: 'variables',
      width: 100,
      render: (_, record) => {
        const vars = JSON.parse(record.variables || '[]')
        return <Tag>{vars.length} vars</Tag>
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      responsive: ['lg'] as any,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      responsive: ['lg'] as any,
    },
    {
      title: 'Actions',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/templates/${record.id}`)}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/templates/${record.id}`)}
          />
          <Popconfirm
            title="Delete template"
            description="Are you sure you want to delete this template?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>PDF Templates</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/templates/new')}
        >
          New Template
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={12}>
            <Input
              placeholder="Search templates..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          {search && (
            <Col>
              <Button
                icon={<ClearOutlined />}
                onClick={() => setSearch('')}
                size="small"
                type="link"
              >
                Clear
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredTemplates}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} templates` }}
      />
    </div>
  )
}
