import { useState } from 'react'
import { BookText, Lightbulb, Microscope, HelpCircle, type LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { ReactNode } from 'react'
import type { Chapter, TabId } from '../types'

interface ChapterReaderProps {
  chapter: Chapter
  chapterIndex: number
  header?: ReactNode
}

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: 'summary', label: 'Summary', Icon: BookText },
  { id: 'concepts', label: 'Key Concepts', Icon: Lightbulb },
  { id: 'analysis', label: 'Analysis', Icon: Microscope },
  { id: 'questions', label: 'Questions', Icon: HelpCircle },
]

export default function ChapterReader({ chapter, chapterIndex, header }: ChapterReaderProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary')

  return (
    <article className="flex-1 min-w-0 overflow-y-auto px-5 sm:px-8 py-8 animate-fade-in">
      {header}
      {/* Chapter header */}
      <header className="mb-8 pb-6 border-b border-slate-750">
        <p className="text-sm text-teal/80 mb-2 font-medium">Chapter {chapterIndex + 1}</p>
        <h1 className="chapter-heading mb-3">{chapter.title}</h1>
        <div className="flex items-center gap-4 text-sm text-ink-400">
          <span>Pages {chapter.pageStart}–{chapter.pageEnd}</span>
          <span className="text-ink-600">·</span>
          <span>{chapter.wordCount.toLocaleString()} words</span>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 bg-ink-950 rounded-lg w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-btn flex items-center gap-1.5 ${activeTab === id ? 'active' : ''}`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 'summary' && (
          <SummaryTab text={chapter.summary} ai={chapter.aiSummary} instruction={chapter.aiInstruction} />
        )}
        {activeTab === 'concepts' && (
          <ConceptsTab concepts={chapter.keyConceptsList} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab text={chapter.criticalAnalysis} />
        )}
        {activeTab === 'questions' && (
          <QuestionsTab questions={chapter.revisionQuestions} />
        )}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function SummaryTab({ text, ai, instruction }: { text: string; ai?: string; instruction?: string }) {
  // New summaries are one sentence per line; older saved documents are one block of text.
  const extractive = (text.includes('\n') ? text.split('\n') : text.split('. ')).filter(Boolean)
  return (
    <div className="space-y-6">
      {ai && (
        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="badge bg-teal/15 text-teal border border-teal/30">AI summary</span>
            {instruction && <span className="text-2xs text-ink-400 truncate">“{instruction}”</span>}
          </div>
          <div className="reading-text whitespace-pre-wrap">{ai}</div>
          <p className="text-2xs text-ink-500 mt-3">
            Written by a small on-device model from this chapter’s key passages. Verify important points against the source below.
          </p>
        </div>
      )}
      <div>
        <p className="text-sm text-ink-400 mb-4">
          {ai ? 'Key sentences taken directly from the source:' : 'Key sentences taken directly from the source. Switch on the AI engine above for a written summary.'}
        </p>
        <div className="reading-text leading-reading">
          {extractive.map((sentence, i) => (
            <p key={i} className="mb-3 last:mb-0">
              {sentence.endsWith('.') ? sentence : sentence + '.'}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConceptsTab({ concepts }: { concepts: { term: string; definition: string }[] }) {
  if (concepts.length === 0) {
    return (
      <p className="text-ink-400 text-sm">
        No recurring concepts were identified in this chapter.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {concepts.map((concept, i) => (
        <div key={i} className="card p-4">
          <p className="text-white font-medium mb-1.5">{concept.term}</p>
          <p className="text-sm text-ink-300 leading-relaxed">{concept.definition}</p>
        </div>
      ))}
    </div>
  )
}

function AnalysisTab({ text }: { text: string }) {
  return (
    <div>
      <p className="text-sm text-ink-400 mb-4">
        Structural and stylistic observations about this section.
      </p>
      <div className="card p-5">
        <p className="reading-text">{text}</p>
      </div>
    </div>
  )
}

function QuestionsTab({ questions }: { questions: { question: string; hint: string }[] }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  function toggle(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-400 mb-4">
        Test your understanding. Reveal the hint when you're ready.
      </p>
      {questions.map((q, i) => (
        <div key={i} className="card p-4">
          <p className="text-white font-medium mb-3">{q.question}</p>
          {revealed.has(i) ? (
            <div className="bg-teal/10 border border-teal/20 rounded px-3 py-2">
              <p className="text-sm text-teal/90 leading-relaxed">{q.hint}</p>
            </div>
          ) : (
            <button
              onClick={() => toggle(i)}
              className="text-sm text-ink-400 hover:text-teal transition-colors duration-150"
            >
              Show hint
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
