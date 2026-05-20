import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/services/storageService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    const where: any = {}
    if (templateId) where.templateId = templateId

    const pdfs = await prisma.generatedPdf.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const result = await Promise.all(
      pdfs.map(async (pdf) => {
        let pdfUrl = null
        try {
          pdfUrl = await getFileUrl(pdf.filePath)
        } catch {
          pdfUrl = null
        }
        return { ...pdf, pdfUrl }
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching PDFs:', error)
    return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 })
  }
}
