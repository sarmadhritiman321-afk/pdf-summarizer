import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, LayoutGrid, Upload, ChevronRight } from 'lucide-react'
import type { Document } from '../types'

interface SidebarProps {
  documents: Document[]
  activeDocId?: string
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(ts))
}

export default function Sidebar({ documents, activeDocId }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-ink-950 border-r border-slate-750 h-dvh sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-750 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-slate-850 border border-teal/30 flex items-center justify-center">
            <BookOpen size={14} className="text-teal" />
          </div>
          <span className="text-white font-semibold tracking-tight">Lumen</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-4 pb-2 shrink-0 space-y-0.5">
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <LayoutGrid size={15} />
          Library
        </Link>
        <Link
          to="/upload"
          className={`nav-item ${location.pathname === '/upload' ? 'active' : ''}`}
        >
          <Upload size={15} />
          Upload PDF
        </Link>
      </nav>

      {/* Recent docs */}
      {documents.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4">
          <p className="text-2xs font-medium text-ink-400 uppercase tracking-wider px-2 mb-2">
            Recent
          </p>
          <div className="space-y-0.5">
            {documents.slice(0, 20).map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/doc/${doc.id}`)}
                className={`w-full text-left px-2 py-2 rounded transition-colors duration-150 group ${
                  activeDocId === doc.id
                    ? 'bg-slate-750 text-white'
                    : 'text-ink-300 hover:bg-slate-850 hover:text-ink-100'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm leading-snug line-clamp-2 flex-1 min-w-0">
                    {doc.name}
                  </span>
                  <ChevronRight
                    size={12}
                    className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                  />
                </div>
                <span className="text-2xs text-ink-500 mt-0.5 block">
                  {doc.chapters.length} chapters · {formatDate(doc.uploadedAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-750 shrink-0">
        <p className="text-2xs text-ink-500">
          Processed locally · nothing uploaded
        </p>
      </div>
    </aside>
  )
}
