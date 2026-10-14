export interface Chapter {
  id: string
  title: string
  pageStart: number
  pageEnd: number
  rawText: string
  summary: string
  keyConceptsList: KeyConcept[]
  criticalAnalysis: string
  revisionQuestions: RevisionQuestion[]
  wordCount: number
}

export interface KeyConcept {
  term: string
  definition: string
}

export interface RevisionQuestion {
  question: string
  hint: string
}

export interface Document {
  id: string
  name: string
  totalPages: number
  fileSize: number
  uploadedAt: number
  chapters: Chapter[]
  pdfData?: Uint8Array
}

export type ProcessingStatus =
  | { stage: 'idle' }
  | { stage: 'reading'; progress: number }
  | { stage: 'detecting'; progress: number }
  | { stage: 'summarizing'; current: number; total: number }
  | { stage: 'done' }
  | { stage: 'error'; message: string }

export type TabId = 'summary' | 'concepts' | 'analysis' | 'questions'
