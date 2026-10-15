export const DEFAULT_INSTRUCTION = 'Write a clear, well-organised summary for a student.'
export const MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct'

export function cleanInstruction(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 240)
}

export interface ChatMessage { role: 'system' | 'user'; content: string }

export function buildMessages(title: string, passages: string, instruction: string): ChatMessage[] {
  const style = cleanInstruction(instruction) || DEFAULT_INSTRUCTION
  return [
    {
      role: 'system',
      content:
        'You are a careful study assistant. Rewrite the SOURCE PASSAGES into a summary. ' +
        'Use ONLY information found in the passages. Never add facts, case names, statute sections, quotations or page numbers that are not in them. ' +
        'Follow the reader\'s style instruction exactly (for example format, length, tone, or level of detail).',
    },
    {
      role: 'user',
      content:
        `Style instruction: ${style}\n\nChapter: ${title}\n\nSOURCE PASSAGES:\n${passages}\n\nWrite the summary now.`,
    },
  ]
}
