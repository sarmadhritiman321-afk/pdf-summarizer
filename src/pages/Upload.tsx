import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, AlertCircle } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import { processPDF } from '../lib/processor'
import type { Document, ProcessingStatus } from '../types'

interface UploadPageProps {
  onDocumentReady: (doc: Document) => Promise<void>
}

function statusMessage(status: ProcessingStatus): string {
  switch (status.stage) {
    case 'reading':
      return `Reading pages… ${status.progress}%`
    case 'detecting':
      return 'Detecting chapter structure…'
    case 'summarizing':
      return `Summarizing chapter ${status.current} of ${status.total}…`
    case 'done':
      return 'Done!'
    case 'error':
      return status.message
    default:
      return ''
  }
}

function statusProgress(status: ProcessingStatus): number {
  switch (status.stage) {
    case 'reading':
      return status.progress * 0.5
    case 'detecting':
      return 55
    case 'summarizing':
      return 60 + (status.current / status.total) * 38
    case 'done':
      return 100
    default:
      return 0
  }
}

export default function UploadPage({ onDocumentReady }: UploadPageProps) {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<ProcessingStatus>({ stage: 'idle' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setStatus({ stage: 'error', message: 'Only PDF files are supported.' })
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        setStatus({ stage: 'error', message: 'File is too large. Please use a PDF under 50 MB.' })
        return
      }

      setSelectedFile(file)
      setStatus({ stage: 'reading', progress: 0 })

      try {
        const doc = await processPDF(file, setStatus)
        await onDocumentReady(doc)
        navigate(`/doc/${doc.id}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong processing this PDF.'
        setStatus({ stage: 'error', message })
      }
    },
    [onDocumentReady, navigate]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const isProcessing =
    status.stage === 'reading' ||
    status.stage === 'detecting' ||
    status.stage === 'summarizing'

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Upload a PDF</h1>
        <p className="text-ink-400 text-sm mb-8">
          Everything is processed in your browser — no file leaves your device.
        </p>

        {/* Drop zone */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => !isProcessing && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          className={`
            relative border-2 border-dashed rounded-xl px-8 py-14 flex flex-col items-center text-center
            transition-colors duration-200 cursor-pointer
            ${dragging ? 'border-teal bg-teal/5' : 'border-slate-750 hover:border-slate-600'}
            ${isProcessing ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />

          <div className="w-14 h-14 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center mb-4">
            <FileText size={24} className="text-teal/70" />
          </div>

          {!isProcessing ? (
            <>
              <p className="text-white font-medium mb-1">
                {dragging ? 'Drop to upload' : 'Drop a PDF here'}
              </p>
              <p className="text-ink-400 text-sm">or click to browse · up to 50 MB</p>
            </>
          ) : (
            <div className="w-full max-w-sm">
              <p className="text-white font-medium mb-1">
                {selectedFile?.name}
              </p>
              <p className="text-ink-400 text-sm mb-4">{statusMessage(status)}</p>
              <ProgressBar value={statusProgress(status)} />
            </div>
          )}
        </div>

        {/* Error state */}
        {status.stage === 'error' && (
          <div className="mt-4 flex items-start gap-2.5 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-300 font-medium">Could not process this file</p>
              <p className="text-sm text-red-400 mt-0.5">{status.message}</p>
              <button
                className="text-sm text-red-300 underline mt-2"
                onClick={() => setStatus({ stage: 'idle' })}
              >
                Try a different file
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        {status.stage === 'idle' && (
          <div className="mt-8">
            <p className="text-sm text-ink-500 mb-3">Works best with:</p>
            <ul className="space-y-1.5 text-sm text-ink-400">
              {[
                'Textbooks and academic papers with chapter headings',
                'Reports with numbered sections',
                'Text-based PDFs (not scanned images)',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="text-teal/60 mt-0.5">—</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
