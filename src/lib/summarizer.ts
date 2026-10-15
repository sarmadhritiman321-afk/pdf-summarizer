import type { KeyConcept, RevisionQuestion } from '../types'

// ---------------------------------------------------------------------------
// Sentence utilities
// ---------------------------------------------------------------------------

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

// Common English stop words to exclude from TF scoring
const STOP_WORDS = new Set([
  'the','and','for','that','this','with','from','are','was','were','been','have',
  'has','had','not','but','they','their','there','then','than','its','also','into',
  'more','which','when','where','what','who','how','our','your','one','two','three',
  'can','will','may','some','such','each','all','any','him','her','his','she','would',
  'could','should','said','like','just','very','even','those','these','only','about',
  'after','before','between','through','during','under','over','again','further',
])

// ---------------------------------------------------------------------------
// TF-IDF style sentence scoring
// ---------------------------------------------------------------------------

function scoreText(text: string): Array<{ sentence: string; score: number }> {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return []

  // Term frequency across all sentences
  const termFreq: Record<string, number> = {}
  for (const s of sentences) {
    for (const word of tokenize(s)) {
      if (!STOP_WORDS.has(word)) termFreq[word] = (termFreq[word] ?? 0) + 1
    }
  }

  return sentences.map((sentence) => {
    const words = tokenize(sentence).filter((w) => !STOP_WORDS.has(w))
    const score =
      words.length === 0
        ? 0
        : words.reduce((sum, w) => sum + (termFreq[w] ?? 0), 0) / words.length
    return { sentence, score }
  })
}

// ---------------------------------------------------------------------------
// Summary: ranked sentences with redundancy elimination (MMR), in original order
// ---------------------------------------------------------------------------

const CUE = /\b(therefore|thus|in (?:conclusion|summary|short)|defined as|refers to|means|held that|the court|must|shall|however|except|unless|provided that|in other words|for example|importantly)\b/i

function contentSet(sentence: string): Set<string> {
  return new Set(tokenize(sentence).filter((w) => !STOP_WORDS.has(w)))
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  a.forEach((w) => { if (b.has(w)) inter++ })
  return inter / Math.min(a.size, b.size)
}

/** Pick the most informative, least repetitive sentences, returned in document order. */
function rankSentences(text: string, maxSentences: number, maxWords: number): string[] {
  const scored = scoreText(text)
  const n = scored.length
  if (n === 0) return []

  const base = scored.map((s, i) => {
    const words = s.sentence.split(' ').length
    let score = s.score
    if (i < n * 0.1) score *= 1.15            // openings state the topic
    if (i > n * 0.95) score *= 1.05           // closings often conclude
    if (CUE.test(s.sentence)) score *= 1.2    // definitions, holdings, qualifications
    if (words < 8) score *= 0.5               // fragments
    if (words > 60) score *= 0.7              // run-on extraction noise
    return { i, sentence: s.sentence, score, set: contentSet(s.sentence), words }
  })

  const chosen: typeof base = []
  let wordTotal = 0
  const pool = [...base]
  while (pool.length && chosen.length < maxSentences) {
    let bestIdx = -1
    let bestVal = -Infinity
    for (let k = 0; k < pool.length; k++) {
      const redundancy = chosen.length ? Math.max(...chosen.map((c) => overlap(pool[k].set, c.set))) : 0
      const val = 0.72 * pool[k].score - 0.28 * redundancy * (pool[k].score || 1)
      if (val > bestVal) { bestVal = val; bestIdx = k }
    }
    const pick = pool.splice(bestIdx, 1)[0]
    if (wordTotal + pick.words > maxWords && chosen.length > 0) continue
    chosen.push(pick)
    wordTotal += pick.words
  }
  return chosen.sort((a, b) => a.i - b.i).map((c) => c.sentence)
}

export function generateSummary(text: string, targetSentences = 7): string {
  const n = splitSentences(text).length
  if (n === 0) return 'No text could be extracted for this section.'
  const limit = Math.min(targetSentences, Math.max(3, Math.ceil(n * 0.3)))
  return rankSentences(text, limit, 400).join('\n')
}

/** Source passages handed to the local language model: grounded, de-duplicated, capped in size. */
export function selectPassages(text: string, maxWords = 650): string {
  const n = splitSentences(text).length
  if (n === 0) return ''
  return rankSentences(text, Math.max(6, Math.ceil(n * 0.4)), maxWords).join(' ')
}

// ---------------------------------------------------------------------------
// Key concepts: noun phrases and domain terms that appear multiple times
// ---------------------------------------------------------------------------

function extractCandidateTerms(text: string): string[] {
  const words = tokenize(text)
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (!STOP_WORDS.has(w) && w.length > 3) freq[w] = (freq[w] ?? 0) + 1
  }
  return Object.entries(freq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([term]) => term)
}

function findDefinitionSentence(term: string, text: string): string {
  const sentences = splitSentences(text)
  // Prefer sentences that define ("X is", "X refers to", "X means")
  const definitionPatterns = [
    new RegExp(`\\b${term}\\s+(is|are|was|refers to|means|describes|represents)\\b`, 'i'),
    new RegExp(`\\b${term}\\b`, 'i'),
  ]
  for (const pattern of definitionPatterns) {
    const match = sentences.find((s) => pattern.test(s))
    if (match) {
      // Truncate long definitions
      return match.length > 160 ? match.slice(0, 157) + '…' : match
    }
  }
  return `Term appears multiple times in this section.`
}

export function extractKeyConcepts(text: string): KeyConcept[] {
  const candidates = extractCandidateTerms(text)
  return candidates.slice(0, 8).map((term) => ({
    term: term.charAt(0).toUpperCase() + term.slice(1),
    definition: findDefinitionSentence(term, text),
  }))
}

// ---------------------------------------------------------------------------
// Critical analysis: observe patterns, density, structure
// ---------------------------------------------------------------------------

export function generateCriticalAnalysis(text: string, title: string): string {
  const sentences = splitSentences(text)
  const words = tokenize(text)
  const uniqueWords = new Set(words.filter((w) => !STOP_WORDS.has(w)))

  const sentenceCount = sentences.length
  const wordCount = words.length
  const avgSentenceLen = wordCount / Math.max(sentenceCount, 1)
  const lexicalDiversity = uniqueWords.size / Math.max(wordCount, 1)

  const style =
    avgSentenceLen > 28
      ? 'dense, complex sentences — likely technical or academic writing'
      : avgSentenceLen < 14
      ? 'short, direct sentences — likely instructional or narrative writing'
      : 'balanced sentence length — accessible and explanatory in tone'

  const vocabulary =
    lexicalDiversity > 0.55
      ? 'a wide and varied vocabulary, suggesting broad subject coverage'
      : lexicalDiversity > 0.35
      ? 'a moderately varied vocabulary with recurring domain terms'
      : 'a focused, repetitive vocabulary — typical of technical manuals or definitions'

  const topTerms = extractCandidateTerms(text).slice(0, 5).join(', ')

  return (
    `This section ("${title}") spans approximately ${wordCount.toLocaleString()} words across ${sentenceCount} sentences. ` +
    `The prose uses ${style}. It employs ${vocabulary}. ` +
    `The most prominent recurring terms are: ${topTerms || 'not identifiable'}. ` +
    `Readers should pay particular attention to how these terms are defined and applied — ` +
    `they often carry the conceptual weight of the argument or explanation.`
  )
}

// ---------------------------------------------------------------------------
// Revision questions: generated from high-scoring sentences
// ---------------------------------------------------------------------------

function makeQuestion(sentence: string): RevisionQuestion | null {
  const s = sentence.trim()
  if (s.length < 30) return null

  // "X is Y" → "What is X?"
  const isMatch = s.match(/^(.+?)\s+(?:is|are|was|were)\s+(.+)$/i)
  if (isMatch && isMatch[1].split(' ').length <= 5) {
    return {
      question: `What ${isMatch[2].includes('are') ? 'are' : 'is'} ${isMatch[1]}?`,
      hint: s.length > 120 ? s.slice(0, 120) + '…' : s,
    }
  }

  // Generic: turn statement into a "why/how" question
  const words = s.split(' ')
  const subject = words.slice(0, Math.min(5, words.length)).join(' ').replace(/[.,;:]/g, '')
  return {
    question: `What is the significance of: "${subject}…"?`,
    hint: s.length > 120 ? s.slice(0, 120) + '…' : s,
  }
}

export function generateRevisionQuestions(text: string): RevisionQuestion[] {
  const scored = scoreText(text)
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((s) => s.sentence)

  const questions: RevisionQuestion[] = []
  for (const sentence of topSentences) {
    const q = makeQuestion(sentence)
    if (q) questions.push(q)
    if (questions.length >= 5) break
  }

  if (questions.length === 0) {
    questions.push({
      question: 'What are the main ideas presented in this section?',
      hint: 'Re-read the opening and closing paragraphs of this chapter.',
    })
  }

  return questions
}

// ---------------------------------------------------------------------------
// Count words in raw text
// ---------------------------------------------------------------------------

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
