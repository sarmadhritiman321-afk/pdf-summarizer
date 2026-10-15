import {
  DINO_BODY, DINO_LEGS, DINO_DUCK_BODY, DINO_DUCK_LEGS,
  CACTUS_SMALL, CACTUS_LARGE, BIRD_FRAMES, CLOUD, type R,
} from './sprites'

export type EngineState = 'ready' | 'running' | 'paused' | 'over'

export interface EngineCallbacks {
  onScore: (score: number) => void
  onState: (state: EngineState) => void
  onGameOver: (score: number) => void
  onNewBest: () => void
}

// Logical canvas size. The canvas is scaled to fit its container.
export const W = 600
export const H = 160
const G = 138 // y of the ground line (the dino's feet)
const U = 2 // sprite unit in logical px
const DINO_X = 32

// Physics, in logical px per fixed 1/60s step. Fixed-step => identical behaviour on 60Hz and 144Hz screens.
const GRAVITY = 0.6
const JUMP_V = 9.5 // apex ~ 75px
const START_SPEED = 6
const MAX_SPEED = 13
const ACCEL = 0.0015 // reaches max after ~78s of play: smooth, no sudden jumps
const STEP = 1000 / 60

const COL = {
  dino: '#3dbe8b',
  dead: '#5ff0b0',
  cactus: '#4fa89c',
  bird: '#8fbfc0',
  ground: '#2f5a49',
  cloud: '#1d3a2f',
  text: '#d3eee3',
}

interface Box { x: number; y: number; w: number; h: number }
interface Obstacle {
  kind: 'cactus' | 'bird'
  x: number
  y: number // top
  w: number
  h: number
  draw: R[]            // rects in sprite units, relative to obstacle origin
  boxes: Box[]         // hit boxes, relative to origin (px)
  birdFrames?: R[][]
}

function rnd(a: number, b: number) { return a + Math.random() * (b - a) }

export class DinoEngine {
  state: EngineState = 'ready'
  private ctx: CanvasRenderingContext2D
  private cb: EngineCallbacks
  private raf = 0
  private last = 0
  private acc = 0

  private speed = START_SPEED
  private distance = 0
  private score = 0
  private frames = 0
  private dinoY = 0
  private vy = 0
  private ducking = false
  private obstacles: Obstacle[] = []
  private nextGap = 0
  private clouds: { x: number; y: number }[] = []
  private bumps: { x: number; w: number; y: number }[] = []
  private best: number
  private newBestFired = false
  private celebrate = 0
  private sound: boolean
  private reduced: boolean
  private audio: AudioContext | null = null
  private overAt = 0

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks, opts: { best: number; sound: boolean; reducedMotion: boolean }) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    this.ctx = ctx
    this.cb = cb
    this.best = opts.best
    this.sound = opts.sound
    this.reduced = opts.reducedMotion
    this.reset()
    this.draw()
  }

  setBest(b: number) { this.best = b }
  setSound(on: boolean) { this.sound = on }

  private reset() {
    this.speed = START_SPEED
    this.distance = 0
    this.score = 0
    this.frames = 0
    this.dinoY = 0
    this.vy = 0
    this.ducking = false
    this.obstacles = []
    this.nextGap = 0
    this.newBestFired = false
    this.celebrate = 0
    this.clouds = [{ x: 120, y: 24 }, { x: 330, y: 44 }, { x: 520, y: 18 }]
    this.bumps = Array.from({ length: 14 }, () => ({ x: rnd(0, W), w: rnd(2, 10), y: G + rnd(4, 9) }))
    this.cb.onScore(0)
  }

  // ---------------------------------------------------------------- lifecycle
  start() {
    if (this.state === 'running') return
    if (this.state === 'over') this.reset()
    this.setState('running')
    this.last = performance.now()
    this.acc = 0
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.loop)
  }

  pause() {
    if (this.state !== 'running') return
    this.setState('paused')
    cancelAnimationFrame(this.raf)
    this.draw()
  }

  resume() {
    if (this.state !== 'paused') return
    this.setState('running')
    this.last = performance.now()
    this.acc = 0
    this.raf = requestAnimationFrame(this.loop)
  }

  restart() {
    if (this.state === 'over' && performance.now() - this.overAt < 180) return // avoid accidental instant restart
    this.reset()
    this.state = 'ready'
    this.start()
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.audio?.close().catch(() => {})
    this.audio = null
  }

  private setState(s: EngineState) {
    this.state = s
    this.cb.onState(s)
  }

  // -------------------------------------------------------------------- input
  jump() {
    if (this.state === 'paused') return this.resume()
    if (this.state === 'over') return this.restart()
    if (this.state === 'ready') this.start()
    if (this.dinoY === 0) {
      this.vy = JUMP_V
      this.beep(520, 0.07, 'square')
    }
  }

  releaseJump() {
    if (this.vy > 4) this.vy = 4 // short hop when the key is released early
  }

  duck(on: boolean) {
    this.ducking = on
  }

  // --------------------------------------------------------------------- loop
  private loop = (t: number) => {
    if (this.state !== 'running') return
    this.acc += Math.min(100, t - this.last)
    this.last = t
    let guard = 0
    while (this.acc >= STEP && guard++ < 6) {
      this.step()
      this.acc -= STEP
      if (this.state !== 'running') break
    }
    this.draw()
    if (this.state === 'running') this.raf = requestAnimationFrame(this.loop)
  }

  private step() {
    this.frames++
    this.speed = Math.min(MAX_SPEED, this.speed + ACCEL)
    this.distance += this.speed

    const s = Math.floor(this.distance * 0.025)
    if (s !== this.score) {
      this.score = s
      this.cb.onScore(s)
      if (!this.newBestFired && this.best > 0 && s > this.best) {
        this.newBestFired = true
        this.celebrate = 100
        this.beep(880, 0.12, 'triangle')
        this.cb.onNewBest()
      }
    }
    if (this.celebrate > 0) this.celebrate--

    // dino physics
    if (this.dinoY > 0 || this.vy > 0) {
      this.dinoY += this.vy
      this.vy -= GRAVITY * (this.ducking && this.vy <= 0 ? 2.2 : 1) // fast-fall while ducking in the air
      if (this.dinoY <= 0) { this.dinoY = 0; this.vy = 0 }
    }

    // scenery
    if (!this.reduced) {
      for (const c of this.clouds) { c.x -= this.speed * 0.2; if (c.x < -30) { c.x = W + rnd(0, 120); c.y = rnd(14, 55) } }
      for (const b of this.bumps) { b.x -= this.speed; if (b.x + b.w < 0) { b.x = W + rnd(0, 60); b.w = rnd(2, 10); b.y = G + rnd(4, 9) } }
    }

    // obstacles
    for (const o of this.obstacles) o.x -= this.speed
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -10)
    this.spawn()

    if (this.collides()) this.gameOver()
  }

  private spawn() {
    if (this.frames < 80) return // let first-time players get oriented
    const last = this.obstacles[this.obstacles.length - 1]
    if (last && last.x + last.w + this.nextGap > W) return

    const sc = this.score
    const birdChance = sc < 300 ? 0 : sc < 800 ? 0.22 : 0.32
    let o: Obstacle
    if (Math.random() < birdChance) {
      const roll = Math.random()
      const level = roll < 0.4 ? 'low' : roll < 0.8 || sc < 500 ? 'mid' : 'high'
      const top = level === 'low' ? G - 30 : level === 'mid' ? G - 46 : G - 86
      const f0 = BIRD_FRAMES[0]
      o = {
        kind: 'bird', x: W, y: top, w: f0.w * U, h: f0.h * U,
        draw: f0.rects, birdFrames: BIRD_FRAMES.map((f) => f.rects),
        boxes: [{ x: 4, y: 4, w: f0.w * U - 8, h: f0.h * U - 8 }],
      }
    } else {
      const large = sc >= 100 && Math.random() < 0.45
      const proto = large ? CACTUS_LARGE : CACTUS_SMALL
      const maxN = sc < 150 ? 1 : sc < 450 ? 2 : 3
      const n = 1 + Math.floor(Math.random() * maxN)
      const rects: R[] = []
      const boxes: Box[] = []
      const spacing = 3
      for (let i = 0; i < n; i++) {
        const ox = i * (proto.w + spacing)
        for (const [x, y, w, h] of proto.rects) rects.push([ox + x, y, w, h])
        boxes.push({ x: ox * U + 3, y: 3, w: proto.w * U - 6, h: proto.h * U - 3 })
      }
      const totalW = (n * proto.w + (n - 1) * spacing) * U
      o = { kind: 'cactus', x: W, y: G - proto.h * U, w: totalW, h: proto.h * U, draw: rects, boxes }
    }
    this.obstacles.push(o)
    // Gap scales with speed so it always leaves enough time to land and react again.
    this.nextGap = (o.w + this.speed * 30) * (1 + Math.random() * 0.6)
  }

  private dinoBox(): Box {
    return this.ducking && this.dinoY === 0
      ? { x: DINO_X + 4, y: G - this.dinoY - 22, w: 44, h: 20 }
      : { x: DINO_X + 6, y: G - this.dinoY - 36, w: 32, h: 34 }
  }

  private collides(): boolean {
    const d = this.dinoBox()
    for (const o of this.obstacles) {
      if (o.x > d.x + d.w + 4 || o.x + o.w < d.x - 4) continue
      for (const b of o.boxes) {
        const bx = o.x + b.x, by = o.y + b.y
        if (d.x < bx + b.w && d.x + d.w > bx && d.y < by + b.h && d.y + d.h > by) return true
      }
    }
    return false
  }

  private gameOver() {
    this.overAt = performance.now()
    this.setState('over')
    cancelAnimationFrame(this.raf)
    this.beep(160, 0.2, 'sawtooth')
    this.draw()
    this.cb.onGameOver(this.score)
  }

  // ------------------------------------------------------------------- render
  private rects(list: R[], ox: number, oy: number, color: string) {
    const c = this.ctx
    c.fillStyle = color
    for (const [x, y, w, h] of list) c.fillRect(Math.round(ox + x * U), Math.round(oy + y * U), w * U, h * U)
  }

  private sprite(rows: string[], ox: number, oy: number, color: string, eye?: string) {
    const c = this.ctx
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y]
      let x = 0
      while (x < row.length) {
        const ch = row[x]
        if (ch === '#' || ch === 'e') {
          if (ch === 'e') {
            if (eye) { c.fillStyle = eye; c.fillRect(Math.round(ox + x * U), Math.round(oy + y * U), U, U) }
            x++
            continue
          }
          let end = x
          while (end < row.length && row[end] === '#') end++
          c.fillStyle = color
          c.fillRect(Math.round(ox + x * U), Math.round(oy + y * U), (end - x) * U, U)
          x = end
        } else x++
      }
    }
  }

  draw() {
    const c = this.ctx
    c.clearRect(0, 0, W, H)

    // clouds + ground
    for (const cl of this.clouds) this.rects(CLOUD, cl.x, cl.y, COL.cloud)
    c.fillStyle = COL.ground
    c.fillRect(0, G + 1, W, 1)
    for (const b of this.bumps) c.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), 1)

    // obstacles
    for (const o of this.obstacles) {
      if (o.kind === 'bird' && o.birdFrames) {
        const f = Math.floor(this.frames / 10) % 2
        this.rects(o.birdFrames[this.reduced ? 0 : f], o.x, o.y, COL.bird)
      } else {
        this.rects(o.draw, o.x, o.y, COL.cactus)
      }
    }

    // dino
    const dead = this.state === 'over'
    const airborne = this.dinoY > 0
    const frame = airborne || this.state !== 'running' || this.reduced ? 0 : Math.floor(this.frames / 6) % 2
    const color = dead ? COL.dead : COL.dino
    const eye = dead ? '#06110d' : undefined
    if (this.ducking && !airborne && !dead) {
      const oy = G - this.dinoY - (DINO_DUCK_BODY.length + DINO_DUCK_LEGS[0].length) * U + 2
      this.sprite(DINO_DUCK_BODY, DINO_X, oy, color)
      this.sprite(DINO_DUCK_LEGS[frame], DINO_X, oy + DINO_DUCK_BODY.length * U, color)
    } else {
      const oy = G - this.dinoY - (DINO_BODY.length + DINO_LEGS[0].length) * U + 2
      this.sprite(DINO_BODY, DINO_X, oy, color, eye)
      this.sprite(DINO_LEGS[frame], DINO_X, oy + DINO_BODY.length * U, color)
    }

    // celebration (kept subtle on purpose)
    if (this.celebrate > 0 && (this.reduced || Math.floor(this.celebrate / 8) % 2 === 0)) {
      c.fillStyle = COL.dead
      c.font = '700 12px "Courier New", monospace'
      c.textAlign = 'center'
      c.fillText('NEW BEST!', W / 2, 20)
    }
    if (this.state === 'ready') {
      c.fillStyle = COL.text
      c.globalAlpha = 0.7
      c.font = '12px "Courier New", monospace'
      c.textAlign = 'center'
      c.fillText('PRESS SPACE OR TAP TO START', W / 2, 70)
      c.globalAlpha = 1
    }
  }

  // -------------------------------------------------------------------- sound
  private beep(freq: number, dur: number, type: OscillatorType) {
    if (!this.sound) return
    try {
      this.audio ??= new AudioContext()
      const a = this.audio
      const osc = a.createOscillator()
      const gain = a.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.04, a.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur)
      osc.connect(gain).connect(a.destination)
      osc.start()
      osc.stop(a.currentTime + dur)
    } catch { /* audio unavailable */ }
  }
}
