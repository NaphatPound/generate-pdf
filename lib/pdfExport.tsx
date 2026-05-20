import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import PdfDocument from '@/components/PdfDocument'

export const generatePdf = async (
  templateName: string,
  content: string,
  data: Record<string, string>
): Promise<Blob> => {
  const div = document.createElement('div')
  div.style.position = 'absolute'
  div.style.top = '-9999px'
  div.style.left = '-9999px'
  div.style.width = '210mm'
  div.style.minHeight = '297mm'
  document.body.appendChild(div)

  const root = createRoot(div)
  root.render(<PdfDocument content={content} data={data} />)

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        if ('fonts' in document) {
          await document.fonts.ready
        }

        const pdfContent = div.querySelector('#pdf-content-wrapper') as HTMLElement
        if (!pdfContent) throw new Error('PDF content wrapper not found')

        const canvas = await html2canvas(pdfContent, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: pdfContent.scrollWidth,
          windowHeight: pdfContent.scrollHeight,
        })

        const imgData = canvas.toDataURL('image/png')

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        })

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const ratio = pdfWidth / canvas.width
        const imgHeight = canvas.height * ratio

        if (imgHeight > pdfHeight) {
          const fitRatio = pdfHeight / imgHeight
          const scaledWidth = pdfWidth * fitRatio
          const offsetX = (pdfWidth - scaledWidth) / 2
          pdf.addImage(imgData, 'PNG', offsetX, 0, scaledWidth, pdfHeight)
        } else {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight)
        }

        const blob = pdf.output('blob')

        root.unmount()
        document.body.removeChild(div)
        resolve(blob)
      } catch (err) {
        root.unmount()
        if (document.body.contains(div)) document.body.removeChild(div)
        reject(err)
      }
    }, 1000)
  })
}
