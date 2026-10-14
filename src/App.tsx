import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Library from './pages/Library'
import UploadPage from './pages/Upload'
import DocumentView from './pages/DocumentView'
import { useDocuments } from './hooks/useDocuments'
import { useParams } from 'react-router-dom'

function AppShell() {
  const { documents, loading, addDocument, removeDocument } = useDocuments()

  return (
    <div className="flex h-dvh overflow-hidden">
      <ActiveDocSidebar documents={documents} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <Library
                documents={documents}
                loading={loading}
                onDelete={removeDocument}
              />
            }
          />
          <Route
            path="/upload"
            element={<UploadPage onDocumentReady={addDocument} />}
          />
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
