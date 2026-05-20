import type { Metadata } from 'next'
import { ClientProviders } from '@/components/ClientProviders'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF Generator - Generate PDF from Templates',
  description: 'Create and manage PDF templates, generate PDFs with dynamic data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
