import { v4 as uuidv4 } from './uuid'
import { extractTextFromPDF } from './pdfExtractor'
import { detectChapters } from './chapterDetector'
import {
  generateSummary,
  extractKeyConcepts,
  generateCriticalAnalysis,
  generateRevisionQuestions,
  countWords,
} from './summarizer'
import type { Document, Chapter, ProcessingStatus } from '../types'

export async function processPDF(
  file: File,
  onStatus: (status: ProcessingStatus) => void
): Promise<Document> {
  // Read file
  onStatus({ stage: 'reading', progress: 0 })
  const arrayBuffer = await file.arrayBuffer()
  const pdfData = new Uint8Array(arrayBuffer)

  // Extract text page by page
  const pages = await extractTextFromPDF(pdfData, (page, total) => {
    onStatus({ stage: 'reading', progress: Math.round((page / total) * 100) })
  })

  const totalPages = pages.length

  // Detect chapters
  onStatus({ stage: 'detecting', progress: 0 })
  const rawChapters = detectChapters(pages)

  // Summarize each chapter
  const chapters: Chapter[] = []
  for (let i = 0; i < rawChapters.length; i++) {
    onStatus({ stage: 'summarizing', current: i + 1, total: rawChapters.length })
    const raw = rawChapters[i]

    // Yield to event loop briefly so UI updates
    await new Promise((r) => setTimeout(r, 0))

    const chapter: Chapter = {
      id: uuidv4(),
      title: raw.title,
      pageStart: raw.pageStart,
      pageEnd: raw.pageEnd,
      rawText: raw.text,
      summary: generateSummary(raw.text, 9),
      keyConceptsList: extractKeyConcepts(raw.text),
      criticalAnalysis: generateCriticalAnalysis(raw.text, raw.title),
      revisionQuestions: generateRevisionQuestions(raw.text),
      wordCount: countWords(raw.text),
    }
    chapters.push(chapter)
  }

  const doc: Document = {
    id: uuidv4(),
    name: file.name.replace(/\.pdf$/i, ''),
    totalPages,
    fileSize: file.size,
    uploadedAt: Date.now(),
    chapters,
    pdfData,
  }

  onStatus({ stage: 'done' })
  return doc
}
