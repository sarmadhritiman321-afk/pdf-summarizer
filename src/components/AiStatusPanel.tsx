import { Cpu, Sparkles, Check, AlertTriangle, X } from 'lucide-react'
import ProgressBar from './ProgressBar'
import DinoIcon from '../game/DinoIcon'
import { useGame } from '../game/GameContext'
import { useAi } from '../ai/AiContext'

const mb = (b: number) => `${(b / (1024 * 1024)).toFixed(0)} MB`

function PlayDino() {
  const { openGame } = useGame()
  return (
    <button onClick={openGame} className="btn-primary text-sm py-1.5">
      <DinoIcon size={14} />
      Play Dino Runner
    </button>
  )
}

/** The "loading tracker": shows exactly what the local AI engine is doing, with real numbers only. */
export default function AiStatusPanel() {
  const { engine, job, queued, hasConsented, enable, cancelJob } = useAi()
  const { stage } = engine

  const loading = stage === 'preparing' || stage === 'downloading' || stage === 'initializing'

  let body: React.ReactNode

  if (stage === 'error') {
    body = (
      <>
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-white font-medium">The AI engine could not start</p>
            <p className="text-sm text-ink-300 mt-1">{engine.message}</p>
            <p className="text-sm text-ink-400 mt-1">Instant extractive summaries still work. Try a recent Chrome, Edge or Firefox.</p>
          </div>
        </div>
      </>
    )
  } else if (loading) {
    const label =
      stage === 'downloading'
        ? `Downloading model files: ${Math.round(engine.progress ?? 0)}% (${mb(engine.loadedBytes)} of ${mb(engine.totalBytes)})`
        : stage === 'initializing'
        ? 'Initializing the model in your browser…'
        : 'Checking your browser and local cache…'
    body = (
      <>
        <p className="text-white font-medium">Preparing your AI model</p>
        <div className="mt-3">
          <ProgressBar value={stage === 'downloading' ? engine.progress : null} />
          <p className="text-sm text-ink-300 mt-2 font-mono">{label}</p>
        </div>
        <p className="text-xs text-ink-400 mt-2">Keep reading the instant summaries. This download happens once, then it is cached.</p>
        <div className="mt-3"><PlayDino /></div>
      </>
    )
  } else if (job) {
    body = (
      <>
        <p className="text-white font-medium">Writing AI summaries for “{job.docName}”</p>
        <div className="mt-3">
          <ProgressBar value={(job.done / Math.max(1, job.total)) * 100} />
          <p className="text-sm text-ink-300 mt-2 font-mono">Chapter {Math.min(job.done + 1, job.total)} of {job.total} · {engine.device === 'webgpu' ? 'GPU' : 'CPU'}</p>
        </div>
        <p className="text-xs text-ink-400 mt-2 truncate">Instruction: “{job.instruction || 'default'}”</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <PlayDino />
          <button onClick={cancelJob} className="btn-ghost border border-slate-750 text-sm py-1.5"><X size={14} /> Stop</button>
        </div>
      </>
    )
  } else if (stage === 'ready') {
    body = (
      <div className="flex items-start gap-2">
        <Check size={16} className="text-sea-glow mt-0.5 shrink-0" />
        <div>
          <p className="text-white font-medium">Your AI model is ready</p>
          <p className="text-sm text-ink-300 mt-1">
            Running on your {engine.device === 'webgpu' ? 'GPU' : 'CPU'}. Nothing leaves this device.
            {queued > 0 && ` ${queued} document${queued === 1 ? '' : 's'} waiting.`}
          </p>
        </div>
      </div>
    )
  } else {
    body = (
      <>
        <p className="text-white font-medium">Local AI engine <span className="badge bg-slate-750 text-ink-200 ml-1">off</span></p>
        <p className="text-sm text-ink-300 mt-1">
          Instant summaries work right now. Switch on the AI engine to rewrite them into proper prose that follows your instruction.
          {queued > 0 && ' Your instruction is queued and will run as soon as the engine is on.'}
        </p>
        <p className="text-xs text-ink-400 mt-1">
          {hasConsented ? 'Loads from your browser cache.' : 'One-time download of a few hundred MB, then cached. Runs on your device; no API, no account.'}
        </p>
        <button onClick={enable} className="btn-primary mt-3 text-sm py-1.5">
          <Sparkles size={14} />
          {hasConsented ? 'Load AI engine' : 'Activate AI summaries'}
        </button>
      </>
    )
  }

  return (
    <section className="glass p-4 relative overflow-hidden" aria-label="AI engine status">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-teal/10 blur-2xl pointer-events-none" />
      <div className="flex items-start gap-3 relative">
        <div className="w-8 h-8 rounded-lg bg-slate-750 border border-teal/30 flex items-center justify-center shrink-0">
          <Cpu size={15} className="text-teal" />
        </div>
        <div className="min-w-0 flex-1">{body}</div>
      </div>
    </section>
  )
}
