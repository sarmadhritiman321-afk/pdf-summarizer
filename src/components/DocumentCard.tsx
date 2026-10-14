import { useNavigate } from 'react-router-dom'
import { FileText, Trash2, BookOpen } from 'lucide-react'
import type { Document } from '../types'

interface DocumentCardProps {
  doc: Document
  onDelete: (id: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts))
}

export default function DocumentCard({ doc, onDelete }: DocumentCardProps) {
  const navigate = useNavigate()

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-slate-600 transition-colors duration-150 group">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded bg-slate-750 flex items-center justify-center shrink-0 mt-0.5">
          <FileText size={16} className="text-teal/80" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-medium leading-snug line-clamp-2">{doc.name}</h3>
          <p className="text-sm text-ink-400 mt-0.5">
            {formatDate(doc.uploadedAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-ink-400">
        <span className="flex items-center gap-1.5">
          <BookOpen size={13} />
          {doc.chapters.length} chapters
        </span>
        <span className="text-ink-600">·</span>
        <span>{doc.totalPages} pages</span>
        <span className="text-ink-600">·</span>
        <span>{formatSize(doc.fileSize)}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => navigate(`/doc/${doc.id}`)}
          className="btn-primary text-sm py-1.5 flex-1 justify-center"
        >
          Read
        </button>
        <button
          onClick={() => {
            if (confirm(`Remove "${doc.name}" from your library?`)) onDelete(doc.id)
          }}
          className="p-1.5 text-ink-500 hover:text-red-400 hover:bg-slate-750 rounded transition-colors duration-150"
          aria-label="Delete document"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
