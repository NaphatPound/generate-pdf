'use client'

import React from 'react'

interface Props {
  content: string
  data: Record<string, string>
}

const PdfDocument: React.FC<Props> = ({ content, data }) => {
  const renderedContent = content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] || `{{${key}}}`
  })

  return (
    <div
      id="pdf-content-wrapper"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        backgroundColor: '#fff',
        color: '#000',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '14px',
        lineHeight: '1.6',
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
}

export default PdfDocument
