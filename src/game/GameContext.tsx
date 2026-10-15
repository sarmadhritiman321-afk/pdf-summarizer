import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import DinoGame from './DinoGame'
import DinoIcon from './DinoIcon'

interface GameCtx {
  open: boolean
  openGame: () => void
  closeGame: () => void
}

const Ctx = createContext<GameCtx | null>(null)

export function useGame(): GameCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useGame must be used inside <GameProvider>')
  return c
}

/**
 * Hosts the single Dino Runner window. Sits at the app root, so opening or closing it never touches
 * routes, uploaded documents, or running downloads/summaries.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const openGame = useCallback(() => setOpen(true), [])
  const closeGame = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <Ctx.Provider value={{ open, openGame, closeGame }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Dino Runner"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className={`glass w-full ${expanded ? 'max-w-none h-full' : 'max-w-3xl'} p-4 sm:p-5 overflow-y-auto`}>
            <div className="flex items-center gap-3 mb-4">
              <DinoIcon size={18} className="text-teal" />
              <h2 className="text-white font-medium tracking-wide">Dino Runner</h2>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="p-2 rounded text-ink-300 hover:text-white hover:bg-slate-750 hidden sm:block"
                  aria-label={expanded ? 'Shrink game window' : 'Expand game to full screen'}
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded text-ink-300 hover:text-white hover:bg-slate-750"
                  aria-label="Close game"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <DinoGame />
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
