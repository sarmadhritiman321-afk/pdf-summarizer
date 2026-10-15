import { Routes, Route, Link, useParams } from 'react-router-dom'
import { BookOpen, LayoutGrid, Upload } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Library from './pages/Library'
import UploadPage from './pages/Upload'
import DocumentView from './pages/DocumentView'
import DinoIcon from './game/DinoIcon'
import { useGame } from './game/GameContext'
import { useDocuments } from './hooks/useDocuments'

function MobileBar() {
  const { openGame } = useGame()
  return (
    <header className="md:hidden shrink-0 flex items-center gap-1 px-3 py-2 border-b border-slate-750 bg-ink-950/80 backdrop-blur">
      <Link to="/" className="flex items-center gap-2 mr-auto">
        <div className="w-7 h-7 rounded bg-slate-850 border border-teal/30 flex items-center justify-center">
          <BookOpen size={14} className="text-teal" />
        </div>
        <span className="text-white font-semibold">Lumen</span>
      </Link>
      <Link to="/" className="p-2 text-ink-300 hover:text-white" aria-label="Library"><LayoutGrid size={18} /></Link>
      <Link to="/upload" className="p-2 text-ink-300 hover:text-white" aria-label="Upload PDF"><Upload size={18} /></Link>
      <button onClick={openGame} className="p-2 text-teal" aria-label="Open Dino Runner game"><DinoIcon size={18} /></button>
    </header>
  )
}

function AppShell() {
  const { documents, loading, addDocument, removeDocument } = useDocuments()

  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden">
      <MobileBar />
      <ActiveDocSidebar documents={documents} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<Library documents={documents} loading={loading} onDelete={removeDocument} />} />
          <Route path="/upload" element={<UploadPage onDocumentReady={addDocument} />} />
          <Route path="/doc/:id" element={<DocumentView />} />
        </Routes>
      </div>
    </div>
  )
}

// Wrapper to pass activeDocId to sidebar from route params
function ActiveDocSidebar({ documents }: { documents: ReturnType<typeof useDocuments>['documents'] }) {
  return (
    <Routes>
      <Route path="/doc/:id" element={<SidebarWithId documents={documents} />} />
      <Route path="*" element={<Sidebar documents={documents} />} />
    </Routes>
  )
}

function SidebarWithId({ documents }: { documents: ReturnType<typeof useDocuments>['documents'] }) {
  const { id } = useParams<{ id: string }>()
  return <Sidebar documents={documents} activeDocId={id} />
}

export default function App() {
  return <AppShell />
}
