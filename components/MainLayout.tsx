'use client'

import React, { useState } from 'react'
import { Layout, Menu } from 'antd'
import {
  FileTextOutlined,
  FilePdfOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { usePathname, useRouter } from 'next/navigation'

const { Header, Sider, Content } = Layout

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: 'Templates',
    },
    {
      key: '/templates/new',
      icon: <PlusOutlined />,
      label: 'New Template',
    },
    {
      key: '/pdfs',
      icon: <FilePdfOutlined />,
      label: 'Generated PDFs',
    },
  ]

  const getSelectedKey = () => {
    if (pathname === '/') return '/templates'
    if (pathname.startsWith('/templates')) return '/templates'
    if (pathname.startsWith('/pdfs')) return '/pdfs'
    return pathname
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        style={{
          background: '#1a2332',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '0 16px',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          {collapsed ? '📄' : '📄 PDF Generator'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          theme="dark"
          style={{
            background: 'transparent',
            borderRight: 0,
            color: '#fff',
            minHeight: 'calc(100vh - 64px)',
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 32px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            zIndex: 99,
            position: 'sticky',
            top: 0,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a2332' }}>
            PDF Template Generator
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#fff',
            borderRadius: 12,
            minHeight: 280,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
