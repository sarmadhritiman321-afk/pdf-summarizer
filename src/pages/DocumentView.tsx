import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ChapterNav from '../components/ChapterNav'
import ChapterReader from '../components/ChapterReader'
import { getDocument } from '../lib/db'
import { useAi } from '../ai/AiContext'
import AiStatusPanel from '../components/AiStatusPanel'
import InstructionBar from '../components/InstructionBar'
import type { Document } from '../types'

export default function DocumentView() {
  const { id } = useParams<{ id: string }>()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeChapterId, setActiveChapterId] = useState<string>('')
  const [instruction, setInstruction] = useState('')
  const { tick, queueDocument } = useAi()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setActiveChapterId('')
    getDocument(id).then((d) => {
      if (d) {
        setDoc(d)
        setActiveChapterId(d.chapters[0]?.id ?? '')
      }
      setLoading(false)
    })
  }, [id])

  // Quietly pick up AI summaries as they arrive (no spinner, keeps the chapter you are on)
  useEffect(() => {
    if (!id || tick === 0) return
    getDocument(id).then((d) => { if (d) setDoc(d) })
  }, [id, tick])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
        <p className="text-ink-300 font-medium">Document not found</p>
        <p className="text-ink-500 text-sm">It may have been removed from your library.</p>
        <Link to="/" className="btn-ghost text-sm mt-2">
          <ArrowLeft size={14} />
          Back to library
        </Link>
      </div>
    )
  }

  const activeChapter = doc.chapters.find((c) => c.id === activeChapterId)
  const activeIndex = doc.chapters.findIndex((c) => c.id === activeChapterId)

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b border-slate-750 px-5 py-3 flex items-center gap-4">
        <Link to="/" className="btn-ghost py-1.5 px-2 text-sm">
          <ArrowLeft size={14} />
          Library
        </Link>
        <span className="text-ink-600">·</span>
        <h2 className="text-white font-medium text-sm truncate flex-1">{doc.name}</h2>
        <span className="text-2xs text-ink-500 shrink-0">
          {doc.totalPages} pages · {doc.chapters.length} chapters
        </span>
      </div>

      <div className="md:hidden shrink-0 px-4 py-2 border-b border-slate-750">
        <select
          value={activeChapterId}
          onChange={(e) => setActiveChapterId(e.target.value)}
          className="w-full bg-slate-850 border border-slate-750 rounded px-2 py-1.5 text-sm text-white"
          aria-label="Choose chapter"
        >
          {doc.chapters.map((c, i) => (
            <option key={c.id} value={c.id}>{i + 1}. {c.title}</option>
          ))}
        </select>
      </div>

      {/* Content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ChapterNav
          chapters={doc.chapters}
          activeChapterId={activeChapterId}
          onSelect={(id) => {
            setActiveChapterId(id)
            window.scrollTo({ top: 0 })
          }}
        />

        {activeChapter ? (
          <ChapterReader
            chapter={activeChapter}
            chapterIndex={activeIndex}
            header={
              <div className="space-y-3 mb-8">
                <InstructionBar
                  value={instruction}
                  onChange={setInstruction}
                  onSubmit={() => queueDocument(doc.id, instruction)}
                  submitLabel="Summarise with AI"
                />
                <AiStatusPanel />
              </div>
            }
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-400 text-sm">
            Select a chapter to begin reading.
          </div>
        )}
      </div>
    </div>
  )
}
