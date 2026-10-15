import type { Chapter } from '../types'

interface ChapterNavProps {
  chapters: Chapter[]
  activeChapterId: string
  onSelect: (id: string) => void
}

export default function ChapterNav({ chapters, activeChapterId, onSelect }: ChapterNavProps) {
  return (
    <nav className="w-56 shrink-0 hidden md:block border-r border-slate-750 h-full overflow-y-auto py-4 px-2">
      <p className="text-2xs font-medium text-ink-400 uppercase tracking-wider px-2 mb-3">
        Chapters
      </p>
      <div className="space-y-0.5">
        {chapters.map((chapter, idx) => (
          <button
            key={chapter.id}
            onClick={() => onSelect(chapter.id)}
            className={`w-full text-left px-2 py-2 rounded transition-colors duration-150 group ${
              activeChapterId === chapter.id
                ? 'bg-slate-750 text-white'
                : 'text-ink-300 hover:bg-slate-850 hover:text-ink-100'
            }`}
          >
            <span className="text-2xs text-teal/70 block mb-0.5">Ch. {idx + 1}</span>
            <span className="text-sm leading-snug line-clamp-3">{chapter.title}</span>
            <span className="text-2xs text-ink-500 mt-1 block">
              pp. {chapter.pageStart}–{chapter.pageEnd}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
