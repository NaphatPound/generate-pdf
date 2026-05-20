import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/services/storageService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await prisma.pdfTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const dataStr = formData.get('data') as string
    const fileName = formData.get('fileName') as string

    if (!file || !fileName) {
      return NextResponse.json({ error: 'File and fileName are required' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const objectName = await uploadFile(buffer, fileName, 'application/pdf')

    const generated = await prisma.generatedPdf.create({
      data: {
        templateId: id,
        templateName: template.name,
        data: dataStr || '{}',
        fileName,
        filePath: objectName,
        fileSize: buffer.length,
        pageCount: null,
      },
    })

    return NextResponse.json({ ...generated, pdfUrl: objectName }, { status: 201 })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
