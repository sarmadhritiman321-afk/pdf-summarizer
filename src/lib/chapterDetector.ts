import type { PageText } from './pdfExtractor'

export interface DetectedChapter {
  title: string
  pageStart: number
  pageEnd: number
  text: string
}

// Patterns that indicate a chapter heading
const CHAPTER_PATTERNS = [
  /^chapter\s+(\d+|[ivxlcdm]+)[:\s\-–—]*(.*)/i,
  /^(part|section|unit)\s+(\d+|[ivxlcdm]+)[:\s\-–—]*(.*)/i,
  /^(\d+)\.\s+([A-Z][^a-z]{0,4}.*)/,   // "1. HEADING" or "1. Title"
  /^(\d+)\s{2,}([A-Z].*)/,              // "1  Title" (common in TOC-style)
]

// Lines that look like chapter titles (short, sentence-case or title-case, no period at end)
function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > 80) return false
  if (trimmed.endsWith('.') || trimmed.endsWith(',')) return false
  // Must start with capital
  if (!/^[A-Z\d]/.test(trimmed)) return false
  // Shouldn't be mostly lowercase words strung together (prose)
  const words = trimmed.split(/\s+/)
  if (words.length > 10) return false
  return true
}

function extractChapterTitle(line: string): string | null {
  for (const pattern of CHAPTER_PATTERNS) {
    const m = line.trim().match(pattern)
    if (m) {
      // Return last meaningful capture group
      const title = m[m.length - 1]?.trim()
      if (title && title.length > 1) return `${m[1]} — ${title}`
      return line.trim().slice(0, 60)
    }
  }
  return null
}

export function detectChapters(pages: PageText[]): DetectedChapter[] {
  const breaks: Array<{ pageNum: number; title: string }> = []

  for (const page of pages) {
    const lines = page.text.split(/\n|(?<=[.!?])\s{2,}/)
    for (const rawLine of lines.slice(0, 8)) {
      // Only look at first 8 logical lines per page for headings
      const line = rawLine.trim()
      if (!line) continue

      const chapterTitle = extractChapterTitle(line)
      if (chapterTitle) {
        // Avoid duplicate consecutive detections on the same page
        if (breaks.length === 0 || breaks[breaks.length - 1].pageNum !== page.pageNum) {
          breaks.push({ pageNum: page.pageNum, title: chapterTitle })
          break
        }
      }
    }
  }

  // If we found zero or only one break, try a fallback: detect heading-like short lines
  if (breaks.length <= 1) {
    breaks.length = 0
    for (const page of pages) {
      const firstLine = page.text.split(/\n/)[0]?.trim() ?? ''
      if (looksLikeHeading(firstLine) && firstLine.length > 4) {
        breaks.push({ pageNum: page.pageNum, title: firstLine })
      }
    }
  }

  // Still nothing — treat every N pages as a chapter
  if (breaks.length === 0) {
    const chunkSize = Math.max(5, Math.ceil(pages.length / 8))
    for (let i = 0; i < pages.length; i += chunkSize) {
      breaks.push({
        pageNum: pages[i].pageNum,
        title: `Section ${Math.floor(i / chunkSize) + 1}`,
      })
    }
  }

  // Build chapters from breaks
  const chapters: DetectedChapter[] = breaks.map((brk, idx) => {
    const nextStart = breaks[idx + 1]?.pageNum ?? pages[pages.length - 1].pageNum + 1
    const chapterPages = pages.filter(
      (p) => p.pageNum >= brk.pageNum && p.pageNum < nextStart
    )
    return {
      title: brk.title,
      pageStart: brk.pageNum,
      pageEnd: nextStart - 1,
      text: chapterPages.map((p) => p.text).join('\n\n'),
    }
  })

  return chapters.filter((c) => c.text.trim().length > 50)
}
