import * as pdfjsLib from 'pdfjs-dist'

// Use CDN worker to avoid bundling issues on Cloudflare Pages
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`

export interface PageText {
  pageNum: number
  text: string
}

export async function extractTextFromPDF(
  data: Uint8Array,
  onProgress?: (page: number, total: number) => void
): Promise<PageText[]> {
  const pdf = await pdfjsLib.getDocument({ data: data.slice() }).promise
  const pages: PageText[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => {
        if ('str' in item) return item.str
        return ''
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    pages.push({ pageNum: i, text })
    onProgress?.(i, pdf.numPages)
  }

  return pages
}

export function getPDFPageCount(data: Uint8Array): Promise<number> {
  return pdfjsLib
    .getDocument({ data: data.slice() })
    .promise.then((pdf) => pdf.numPages)
}
