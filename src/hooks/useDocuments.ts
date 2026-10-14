import { useState, useEffect, useCallback } from 'react'
import { getAllDocuments, saveDocument, deleteDocument } from '../lib/db'
import type { Document } from '../types'

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllDocuments().then((docs) => {
      setDocuments(docs)
      setLoading(false)
    })
  }, [])

  const addDocument = useCallback(async (doc: Document) => {
    await saveDocument(doc)
    setDocuments((prev) => [doc, ...prev])
  }, [])

  const removeDocument = useCallback(async (id: string) => {
    await deleteDocument(id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { documents, loading, addDocument, removeDocument }
}
