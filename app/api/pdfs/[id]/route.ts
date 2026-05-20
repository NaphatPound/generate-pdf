import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileUrl, deleteFile } from '@/services/storageService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pdf = await prisma.generatedPdf.findUnique({
      where: { id },
      include: { template: true },
    })

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    let pdfUrl = null
    try {
      pdfUrl = await getFileUrl(pdf.filePath)
    } catch {
      pdfUrl = null
    }

    return NextResponse.json({ ...pdf, pdfUrl })
  } catch (error) {
    console.error('Error fetching PDF:', error)
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pdf = await prisma.generatedPdf.findUnique({ where: { id } })

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    try {
      await deleteFile(pdf.filePath)
    } catch {
      // File might already be deleted
    }

    await prisma.generatedPdf.delete({ where: { id } })

    return NextResponse.json({ message: 'PDF deleted successfully' })
  } catch (error) {
    console.error('Error deleting PDF:', error)
    return NextResponse.json({ error: 'Failed to delete PDF' }, { status: 500 })
  }
}
