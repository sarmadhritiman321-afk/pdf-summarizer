// Local-only persistence for Dino Runner. No network, no accounts.
const KEY = 'lumen.dino.v1'

export interface DinoStats {
  best: number
  last: number
  runs: number
  sound: boolean
}

const DEFAULTS: DinoStats = { best: 0, last: 0, runs: 0, sound: false }

export function loadStats(): DinoStats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw)
    return {
      best: Number.isFinite(p.best) ? p.best : 0,
      last: Number.isFinite(p.last) ? p.last : 0,
      runs: Number.isFinite(p.runs) ? p.runs : 0,
      sound: p.sound === true,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveStats(stats: DinoStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats))
  } catch {
    /* storage unavailable (private mode / quota): the game still works, scores just don't persist */
  }
}
