'use client'

import React from 'react'
import MainLayout from '@/components/MainLayout'

export default function PdfsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
