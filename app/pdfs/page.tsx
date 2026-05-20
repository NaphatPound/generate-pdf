'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Table, Button, Input, Space, Tag, App, Popconfirm, Card, Row, Col } from 'antd'
import { DeleteOutlined, DownloadOutlined, SearchOutlined, FilePdfOutlined, ClearOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

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

export default function GeneratedPdfsPage() {
  const { message } = App.useApp()
  const [pdfs, setPdfs] = useState<GeneratedPdf[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPdfs()
  }, [])

  const fetchPdfs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pdfs')
      if (response.ok) {
        const data = await response.json()
        setPdfs(data)
      }
    } catch {
      message.error('Failed to load PDFs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/pdfs/${id}`, { method: 'DELETE' })
      if (response.ok) {
        message.success('PDF deleted')
        fetchPdfs()
      } else {
        message.error('Failed to delete PDF')
      }
    } catch {
      message.error('Failed to delete PDF')
    }
  }

  const filteredPdfs = useMemo(() => {
    if (!search) return pdfs
    const q = search.toLowerCase()
    return pdfs.filter(p =>
      p.fileName.toLowerCase().includes(q) ||
      p.templateName.toLowerCase().includes(q)
    )
  }, [pdfs, search])

  const columns: ColumnsType<GeneratedPdf> = [
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (name: string) => (
        <Space>
          <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Template',
      dataIndex: 'templateName',
      key: 'templateName',
      render: (name: string) => (
        <Tag color="blue">{name}</Tag>
      ),
    },
    {
      title: 'Data Preview',
      key: 'data',
      ellipsis: true,
      render: (_, record) => {
        try {
          const data = JSON.parse(record.data)
          return Object.entries(data).slice(0, 3).map(([key, val]) => (
            <Tag key={key} style={{ marginBottom: 2, fontSize: 11 }}>
              {key}: {String(val).substring(0, 20)}
            </Tag>
          ))
        } catch {
          return '-'
        }
      },
      responsive: ['md'] as any,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            href={record.pdfUrl || '#'}
            target="_blank"
            disabled={!record.pdfUrl}
          >
            Download
          </Button>
          <Popconfirm
            title="Delete PDF"
            description="Are you sure you want to delete this PDF?"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Generated PDFs</h1>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={12}>
            <Input
              placeholder="Search by file name or template..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          {search && (
            <Col>
              <Button icon={<ClearOutlined />} onClick={() => setSearch('')} size="small" type="link">
                Clear
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredPdfs}
        rowKey="id"
        loading={loading}
        scroll={{ x: 700 }}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} PDFs` }}
      />
    </div>
  )
}
