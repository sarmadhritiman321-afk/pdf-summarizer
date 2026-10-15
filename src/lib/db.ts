import { openDB, type IDBPDatabase } from 'idb'
import type { Document } from '../types'

const DB_NAME = 'lumen-pdf-db'
const DB_VERSION = 1
const STORE_DOCS = 'documents'
const STORE_PDF = 'pdf-data'

type LumenDB = IDBPDatabase<{
  [STORE_DOCS]: {
    key: string
    value: Omit<Document, 'pdfData'>
    indexes: { uploadedAt: number }
  }
  [STORE_PDF]: {
    key: string
    value: { id: string; data: Uint8Array }
  }
}>

let dbPromise: Promise<LumenDB> | null = null

function getDB(): Promise<LumenDB> {
  if (!dbPromise) {
    dbPromise = openDB<{
      [STORE_DOCS]: {
        key: string
        value: Omit<Document, 'pdfData'>
        indexes: { uploadedAt: number }
      }
      [STORE_PDF]: {
        key: string
        value: { id: string; data: Uint8Array }
      }
    }>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_DOCS)) {
          const store = db.createObjectStore(STORE_DOCS, { keyPath: 'id' })
          store.createIndex('uploadedAt', 'uploadedAt')
        }
        if (!db.objectStoreNames.contains(STORE_PDF)) {
          db.createObjectStore(STORE_PDF, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise as Promise<LumenDB>
}

export async function saveDocument(doc: Document): Promise<void> {
  try {
    const db = await getDB()
    const { pdfData, ...meta } = doc
    await db.put(STORE_DOCS, meta)
    if (pdfData) {
      await db.put(STORE_PDF, { id: doc.id, data: pdfData })
    }
  } catch (e) {
    console.error('Failed to save document:', e)
  }
}

export async function getAllDocuments(): Promise<Document[]> {
  try {
    const db = await getDB()
    const docs = await db.getAllFromIndex(STORE_DOCS, 'uploadedAt')
    return docs.reverse()
  } catch (e) {
    console.error('Failed to load documents:', e)
    return []
  }
}

export async function getDocument(id: string): Promise<Document | undefined> {
  try {
    const db = await getDB()
    const meta = await db.get(STORE_DOCS, id)
    if (!meta) return undefined
    const pdfRow = await db.get(STORE_PDF, id)
    return { ...meta, pdfData: pdfRow?.data }
  } catch (e) {
    console.error('Failed to get document:', e)
    return undefined
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete(STORE_DOCS, id)
    await db.delete(STORE_PDF, id)
  } catch (e) {
    console.error('Failed to delete document:', e)
  }
}

export async function setChapterAi(docId: string, chapterId: string, text: string, instruction: string): Promise<void> {
  try {
    const db = await getDB()
    const meta = await db.get(STORE_DOCS, docId)
    if (!meta) return
    const chapters = meta.chapters.map((c) =>
      c.id === chapterId ? { ...c, aiSummary: text, aiInstruction: instruction } : c
    )
    await db.put(STORE_DOCS, { ...meta, chapters })
  } catch (e) {
    console.error('Failed to save AI summary:', e)
  }
}
