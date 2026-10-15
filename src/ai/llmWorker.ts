// Runs the local language model in a Web Worker so the page (and the Dino game) stay smooth.
// Everything here runs on the user's device. Model files come from the Hugging Face CDN once and are then cached by the browser.
import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

const ctx = self as unknown as {
  postMessage: (m: unknown) => void
  onmessage: ((e: MessageEvent) => void) | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null
const files = new Map<string, { loaded: number; total: number; done: boolean }>()
let lastPost = 0

function post(m: unknown) { ctx.postMessage(m) }

function reportProgress(force = false) {
  const now = Date.now()
  if (!force && now - lastPost < 250) return
  lastPost = now
  let loaded = 0, total = 0, allDone = files.size > 0
  files.forEach((f) => {
    loaded += f.loaded
    total += f.total
    if (!f.done) allDone = false
  })
  if (total > 0 && !allDone) {
    post({ type: 'status', stage: 'downloading', progress: Math.min(99, (loaded / total) * 100), loadedBytes: loaded, totalBytes: total })
  } else if (allDone) {
    post({ type: 'status', stage: 'initializing', progress: null, loadedBytes: loaded, totalBytes: total })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onProgress(p: any) {
  if (!p || !p.file) return
  if (p.status === 'initiate') files.set(p.file, { loaded: 0, total: 0, done: false })
  else if (p.status === 'progress') files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0, done: false })
  else if (p.status === 'done') {
    const f = files.get(p.file)
    files.set(p.file, { loaded: f?.total || f?.loaded || 0, total: f?.total || f?.loaded || 0, done: true })
  }
  reportProgress(p.status === 'done')
}

async function load(model: string) {
  post({ type: 'status', stage: 'preparing', progress: null, loadedBytes: 0, totalBytes: 0 })
  let device: 'webgpu' | 'wasm' = 'wasm'
  let dtype = 'q4'
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpu = (self.navigator as any).gpu
    const adapter = gpu ? await gpu.requestAdapter() : null
    if (adapter) {
      device = 'webgpu'
      dtype = adapter.features.has('shader-f16') ? 'q4f16' : 'q4'
    }
  } catch { /* no WebGPU: fall back to CPU (WASM) */ }

  const make = (d: string, t: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pipeline as any)('text-generation', model, { device: d, dtype: t, progress_callback: onProgress })

  try {
    generator = await make(device, dtype)
  } catch (err) {
    if (device !== 'webgpu') throw err
    device = 'wasm'
    dtype = 'q4'
    files.clear()
    generator = await make(device, dtype)
  }
  post({ type: 'status', stage: 'ready', progress: 100, loadedBytes: 0, totalBytes: 0, device })
}

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data
  try {
    if (msg.type === 'load') {
      await load(msg.model)
    } else if (msg.type === 'generate') {
      if (!generator) throw new Error('Model is not loaded yet.')
      const out = await generator(msg.messages, {
        max_new_tokens: msg.maxNewTokens ?? 320,
        do_sample: false,
        repetition_penalty: 1.12,
      })
      const gt = out?.[0]?.generated_text
      const text = typeof gt === 'string' ? gt : gt?.[gt.length - 1]?.content ?? ''
      post({ type: 'result', id: msg.id, text: String(text).trim() })
    }
  } catch (err) {
    post({ type: 'error', id: msg.id, message: err instanceof Error ? err.message : String(err) })
  }
}
