import { Link } from 'react-router-dom'
import { Upload, BookOpen } from 'lucide-react'
import DocumentCard from '../components/DocumentCard'
import HowItWorks from '../components/HowItWorks'
import AiStatusPanel from '../components/AiStatusPanel'
import type { Document } from '../types'

interface LibraryProps {
  documents: Document[]
  loading: boolean
  onDelete: (id: string) => void
}

export default function Library({ documents, loading, onDelete }: LibraryProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow mb-2">Lumen · local study engine</p>
            <h1 className="text-3xl font-semibold text-white tracking-tight glow-text">Library</h1>
            <p className="text-sm text-ink-400 mt-1">
              {documents.length === 0
                ? 'No documents yet'
                : `${documents.length} document${documents.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link to="/upload" className="btn-primary">
            <Upload size={15} />
            Upload PDF
          </Link>
        </div>

        <div className="mb-6 max-w-xl"><AiStatusPanel /></div>

        {/* Empty state */}
        {documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center mb-5">
              <BookOpen size={28} className="text-teal/50" />
            </div>
            <h2 className="text-white font-medium text-lg mb-2">No documents yet</h2>
            <p className="text-ink-400 text-sm max-w-xs mb-6">
              Upload a PDF and Lumen will extract chapter-wise summaries, key concepts, and revision questions — all in your browser.
            </p>
            <Link to="/upload" className="btn-primary">
              <Upload size={15} />
              Upload your first PDF
            </Link>
          </div>
        )}

        {/* Document grid */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} />
            ))}
          </div>
        )}
        <HowItWorks />
      </div>
    </main>
  )
}
