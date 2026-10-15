import { FileUp, ScanText, Zap, Cpu, ShieldCheck } from 'lucide-react'

const STEPS = [
  { Icon: FileUp, title: '1 · You add a PDF', body: 'The file is read by your browser. It is never uploaded to a server; it is stored only in your browser’s own database (IndexedDB).' },
  { Icon: ScanText, title: '2 · Text and chapters', body: 'PDF.js pulls out the text page by page. Chapter headings are detected; if there are none, the book is split into page blocks instead.' },
  { Icon: Zap, title: '3 · Instant summary', body: 'A fast algorithm scores every sentence, drops repetition and keeps the most informative ones. This appears immediately and costs nothing.' },
  { Icon: Cpu, title: '4 · Local AI rewrite', body: 'If you switch it on, a small language model (Qwen2.5-0.5B) is downloaded once and cached. It rewrites the key passages following your one-line instruction, chapter by chapter, on your own device.' },
  { Icon: ShieldCheck, title: '5 · Private and free', body: 'No API keys, no accounts, no paid services. Your documents never leave your computer.' },
]

export default function HowItWorks() {
  return (
    <section className="mt-16 pt-10 border-t border-slate-750" aria-labelledby="how-it-works">
      <p className="eyebrow mb-2">Under the hood</p>
      <h2 id="how-it-works" className="chapter-heading mb-6 glow-text">How Lumen works</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ Icon, title, body }) => (
          <div key={title} className="glass p-4 hover:border-teal/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-slate-750 border border-teal/30 flex items-center justify-center mb-3">
              <Icon size={15} className="text-teal" />
            </div>
            <h3 className="text-white font-medium text-sm mb-1.5">{title}</h3>
            <p className="text-sm text-ink-300 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
      <div className="glass p-4 mt-3">
        <h3 className="text-white font-medium text-sm mb-1.5">Honest limits</h3>
        <ul className="text-sm text-ink-300 space-y-1 list-disc pl-5">
          <li>The AI model is small so that it runs on a student laptop. It can miss nuance and can still make mistakes, so check anything important against the source text.</li>
          <li>It only sees the most important passages of each chapter, not every page, which keeps it fast and keeps it grounded in the book.</li>
          <li>Without a GPU, AI summaries run on the CPU and can take a while per chapter. Keep reading, or play Dino Runner.</li>
          <li>Scanned (image-only) PDFs have no text to read.</li>
        </ul>
      </div>
    </section>
  )
}
