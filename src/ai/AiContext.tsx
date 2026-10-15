import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getDocument, setChapterAi } from '../lib/db'
import { selectPassages } from '../lib/summarizer'
import { buildMessages, cleanInstruction, MODEL_ID } from './prompt'

export type EngineStage = 'off' | 'preparing' | 'downloading' | 'initializing' | 'ready' | 'error'

export interface EngineStatus {
  stage: EngineStage
  progress: number | null // null = unknown (indeterminate). Never invented.
  loadedBytes: number
  totalBytes: number
  device?: string
  message?: string
}

export interface JobStatus {
  docId: string
  docName: string
  done: number
  total: number
  instruction: string
}

interface AiCtx {
  engine: EngineStatus
  job: JobStatus | null
  queued: number
  tick: number // bumps whenever a chapter gets an AI summary, so views can refresh
  toast: string | null
  hasConsented: boolean
  enable: () => void
  queueDocument: (docId: string, instruction: string) => void
  cancelJob: () => void
}

const Ctx = createContext<AiCtx | null>(null)
const FLAG = 'lumen.ai.enabled'

export function useAi(): AiCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAi must be used inside <AiProvider>')
  return c
}

function readFlag(): boolean {
  try { return localStorage.getItem(FLAG) === '1' } catch { return false }
}

export function AiProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<EngineStatus>({ stage: 'off', progress: null, loadedBytes: 0, totalBytes: 0 })
  const [job, setJob] = useState<JobStatus | null>(null)
  const [queue, setQueue] = useState<{ docId: string; instruction: string }[]>([])
  const [tick, setTick] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [consented, setConsented] = useState(readFlag())

  const workerRef = useRef<Worker | null>(null)
  const pending = useRef(new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>())
  const idRef = useRef(0)
  const runningRef = useRef(false)
  const cancelRef = useRef(false)
  const prevStage = useRef<EngineStage>('off')

  const say = useCallback((m: string) => {
    setToast(m)
    window.setTimeout(() => setToast((cur) => (cur === m ? null : cur)), 7000)
  }, [])

  const enable = useCallback(() => {
    try { localStorage.setItem(FLAG, '1') } catch { /* ignore */ }
    setConsented(true)
    if (workerRef.current) return
    try {
      const w = new Worker(new URL('./llmWorker.ts', import.meta.url), { type: 'module' })
      workerRef.current = w
      w.onmessage = (e: MessageEvent) => {
        const m = e.data
        if (m.type === 'status') {
          setEngine({ stage: m.stage, progress: m.progress, loadedBytes: m.loadedBytes, totalBytes: m.totalBytes, device: m.device })
        } else if (m.type === 'result') {
          pending.current.get(m.id)?.resolve(m.text)
          pending.current.delete(m.id)
        } else if (m.type === 'error') {
          if (m.id != null) {
            pending.current.get(m.id)?.reject(new Error(m.message))
            pending.current.delete(m.id)
          } else {
            setEngine({ stage: 'error', progress: null, loadedBytes: 0, totalBytes: 0, message: m.message })
          }
        }
      }
      w.onerror = () => setEngine({ stage: 'error', progress: null, loadedBytes: 0, totalBytes: 0, message: 'The AI worker could not start in this browser.' })
      setEngine({ stage: 'preparing', progress: null, loadedBytes: 0, totalBytes: 0 })
      w.postMessage({ type: 'load', model: MODEL_ID })
    } catch (err) {
      setEngine({ stage: 'error', progress: null, loadedBytes: 0, totalBytes: 0, message: err instanceof Error ? err.message : 'Could not start the AI engine.' })
    }
  }, [])

  const generate = useCallback((messages: unknown) => {
    return new Promise<string>((resolve, reject) => {
      const w = workerRef.current
      if (!w) return reject(new Error('AI engine is not running.'))
      const id = ++idRef.current
      pending.current.set(id, { resolve, reject })
      w.postMessage({ type: 'generate', id, messages, maxNewTokens: 320 })
    })
  }, [])

  const queueDocument = useCallback((docId: string, instruction: string) => {
    setQueue((q) => [...q.filter((x) => x.docId !== docId), { docId, instruction: cleanInstruction(instruction) }])
    if (readFlag()) enable() // consent was already given once: load from cache without asking again
  }, [enable])

  const cancelJob = useCallback(() => {
    cancelRef.current = true
    setQueue([])
  }, [])

  // run queued documents once the engine is ready
  useEffect(() => {
    if (engine.stage !== 'ready' || runningRef.current || queue.length === 0) return
    const next = queue[0]
    runningRef.current = true
    cancelRef.current = false
    setQueue((q) => q.slice(1))
    ;(async () => {
      try {
        const doc = await getDocument(next.docId)
        if (!doc) return
        setJob({ docId: doc.id, docName: doc.name, done: 0, total: doc.chapters.length, instruction: next.instruction })
        for (let i = 0; i < doc.chapters.length; i++) {
          if (cancelRef.current) break
          const ch = doc.chapters[i]
          const passages = selectPassages(ch.rawText, 650)
          if (passages.trim()) {
            const text = await generate(buildMessages(ch.title, passages, next.instruction))
            if (text) {
              await setChapterAi(doc.id, ch.id, text, next.instruction)
              setTick((t) => t + 1)
            }
          }
          setJob((j) => (j ? { ...j, done: i + 1 } : j))
        }
        if (!cancelRef.current) say(`AI summaries are ready for "${doc.name}".`)
      } catch (err) {
        say(`AI summary stopped: ${err instanceof Error ? err.message : 'unknown error'}`)
      } finally {
        runningRef.current = false
        setJob(null)
      }
    })()
  }, [engine.stage, queue, generate, say])

  useEffect(() => {
    if (prevStage.current !== 'ready' && engine.stage === 'ready') say('Your AI model is ready.')
    prevStage.current = engine.stage
  }, [engine.stage, say])

  useEffect(() => () => workerRef.current?.terminate(), [])

  return (
    <Ctx.Provider value={{ engine, job, queued: queue.length, tick, toast, hasConsented: consented, enable, queueDocument, cancelJob }}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-40 glass px-4 py-2.5 text-sm text-ink-100 animate-slide-up max-w-xs"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sea-glow mr-2 align-middle" />
          {toast}
        </div>
      )}
    </Ctx.Provider>
  )
}
