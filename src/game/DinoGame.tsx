import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Volume2, VolumeX, ArrowDown } from 'lucide-react'
import { DinoEngine, W, H, type EngineState } from './engine'
import { loadStats, saveStats, type DinoStats } from './storage'
import { validateSprites } from './sprites'

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(5, '0')

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null
  if (!el || !el.tagName) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

/** One game instance, used by the permanent sidebar button AND the loading panel (via the shared modal). */
export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<DinoEngine | null>(null)
  const statsRef = useRef<DinoStats>(loadStats())
  const [stats, setStats] = useState<DinoStats>(statsRef.current)
  const [score, setScore] = useState(0)
  const [state, setState] = useState<EngineState>('ready')
  const [bestFlash, setBestFlash] = useState(false)

  const updateStats = useCallback((patch: Partial<DinoStats>) => {
    statsRef.current = { ...statsRef.current, ...patch }
    saveStats(statsRef.current)
    setStats(statsRef.current)
  }, [])

  // engine lifecycle
  useEffect(() => {
    const canvas = canvasRef.current!
    if (import.meta.env.DEV) validateSprites()
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const engine = new DinoEngine(
      canvas,
      {
        onScore: setScore,
        onState: setState,
        onNewBest: () => { setBestFlash(true); window.setTimeout(() => setBestFlash(false), 2500) },
        onGameOver: (final) => {
          const s = statsRef.current
          updateStats({ last: final, runs: s.runs + 1, best: Math.max(s.best, final) })
          engine.setBest(Math.max(s.best, final))
        },
      },
      { best: statsRef.current.best, sound: statsRef.current.sound, reducedMotion: reduced }
    )
    engineRef.current = engine

    // keep the bitmap crisp at any size / device pixel ratio
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const cssW = canvas.clientWidth
      if (!cssW) return
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssW * dpr * (H / W))
      const ctx = canvas.getContext('2d')!
      const k = canvas.width / W
      ctx.setTransform(k, 0, 0, k, 0, 0)
      ctx.imageSmoothingEnabled = false
      engine.draw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)

    const onVis = () => { if (document.hidden) engine.pause() }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      engine.destroy()
      engineRef.current = null
    }
  }, [updateStats])

  // keyboard: only while the game is mounted, never while typing in a field
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      const eng = engineRef.current
      if (!eng) return
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (!e.repeat) eng.jump()
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        eng.duck(true)
      } else if (e.code === 'Enter' && eng.state === 'over') {
        e.preventDefault()
        eng.restart()
      } else if (e.code === 'KeyP') {
        eng.state === 'paused' ? eng.resume() : eng.pause()
      }
    }
    const up = (e: KeyboardEvent) => {
      const eng = engineRef.current
      if (!eng) return
      if (e.code === 'Space' || e.code === 'ArrowUp') eng.releaseJump()
      if (e.code === 'ArrowDown') eng.duck(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const togglePause = () => {
    const eng = engineRef.current
    if (!eng) return
    eng.state === 'paused' ? eng.resume() : eng.pause()
  }

  const toggleSound = () => {
    const next = !statsRef.current.sound
    updateStats({ sound: next })
    engineRef.current?.setSound(next)
  }

  return (
    <div className="select-none">
      {/* HUD */}
      <div className="flex items-end justify-between font-mono mb-2 px-1">
        <div className="text-sm sm:text-base tracking-widest text-ink-100" aria-live="off">
          SCORE: <span className="text-white">{pad(score)}</span>
        </div>
        <div className={`text-sm sm:text-base tracking-widest transition-colors ${bestFlash ? 'text-sea-glow glow-text animate-pulse-soft' : 'text-ink-300'}`}>
          BEST: <span className={bestFlash ? 'text-sea-glow' : 'text-white'}>{pad(Math.max(stats.best, bestFlash ? score : 0))}</span>
        </div>
      </div>

      {/* Play field: touch-action:none stops page scroll only inside the game area */}
      <div
        className="relative rounded-lg border border-slate-750 bg-ink-950 overflow-hidden"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault()
          engineRef.current?.jump()
        }}
        onPointerUp={() => engineRef.current?.releaseJump()}
      >
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ aspectRatio: `${W} / ${H}`, imageRendering: 'pixelated' }}
          role="img"
          aria-label="Dino Runner game. Press space or the up arrow to jump, down arrow to duck."
        />
        {state === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/55 pointer-events-none">
            <p className="font-mono text-white tracking-[0.3em] text-sm sm:text-lg">GAME OVER</p>
            <p className="font-mono text-ink-200 text-xs mt-2">Space / Enter / tap to run again</p>
          </div>
        )}
        {state === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 pointer-events-none">
            <p className="font-mono text-white tracking-[0.3em]">PAUSED</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onPointerDown={(e) => { e.stopPropagation(); engineRef.current?.duck(true) }}
          onPointerUp={() => engineRef.current?.duck(false)}
          onPointerLeave={() => engineRef.current?.duck(false)}
          onPointerCancel={() => engineRef.current?.duck(false)}
          className="btn-ghost border border-slate-750 py-1.5 px-3 text-sm touch-none sm:hidden"
          aria-label="Duck (hold)"
        >
          <ArrowDown size={14} /> Duck
        </button>

        <button
          onClick={(e) => { e.currentTarget.blur(); togglePause() }}
          disabled={state === 'ready' || state === 'over'}
          className="btn-ghost border border-slate-750 py-1.5 px-3 text-sm disabled:opacity-40"
          aria-label={state === 'paused' ? 'Resume game' : 'Pause game'}
        >
          {state === 'paused' ? <Play size={14} /> : <Pause size={14} />}
          {state === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={(e) => { e.currentTarget.blur(); engineRef.current?.restart() }}
          className="btn-ghost border border-slate-750 py-1.5 px-3 text-sm"
          aria-label="Restart game"
        >
          <RotateCcw size={14} /> Restart
        </button>
        <button
          onClick={(e) => { e.currentTarget.blur(); toggleSound() }}
          className="btn-ghost border border-slate-750 py-1.5 px-3 text-sm"
          aria-pressed={stats.sound}
          aria-label={stats.sound ? 'Turn sound off' : 'Turn sound on'}
        >
          {stats.sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
          Sound {stats.sound ? 'on' : 'off'}
        </button>
        <p className="ml-auto text-2xs font-mono text-ink-400 hidden sm:block">
          LAST {pad(stats.last)} · RUNS {stats.runs}
        </p>
      </div>

      <p className="mt-3 text-xs text-ink-400 leading-relaxed">
        <span className="hidden sm:inline">
          <kbd className="font-mono text-ink-200">Space</kbd> / <kbd className="font-mono text-ink-200">↑</kbd> jump ·{' '}
          <kbd className="font-mono text-ink-200">↓</kbd> duck · <kbd className="font-mono text-ink-200">P</kbd> pause ·{' '}
          <kbd className="font-mono text-ink-200">Esc</kbd> close
        </span>
        <span className="sm:hidden">Tap the game area to jump. Hold Duck to duck.</span>
      </p>
    </div>
  )
}
