export type ConciergeIntent =
  | 'budget'
  | 'cheaper'
  | 'quieter'
  | 'indoor'
  | 'shorter'
  | 'romantic'
  | 'food'

export type ConciergeRequest = {
  intent: ConciergeIntent
  label: string
  originalText: string
  budgetMax?: number
}

export type ConciergeInterpretation =
  | { status: 'proposal'; request: ConciergeRequest }
  | { status: 'empty' | 'privacy' | 'too_long' | 'unsupported'; reply: string }

export type ConciergePlanCandidate = {
  planId: string
  title: string
  estimatedCostHigh: number
  durationMinutes: number
  eligible: boolean
  isQuiet: boolean
  isIndoor: boolean
  isRomantic: boolean
  hasFood: boolean
}

export const conciergeSuggestions = [
  'Make it quieter',
  'Keep it under $100',
  'Switch indoors',
  'Shorten the date',
] as const

const maxMessageLength = 240
const privateContentPattern = /https?:\/\/|www\.|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|\b\d{1,6}\s+(?:[a-z0-9.'-]+\s+){0,5}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way)\b/i

function proposal(intent: ConciergeIntent, label: string, originalText: string, budgetMax?: number): ConciergeInterpretation {
  return {
    status: 'proposal',
    request: {
      intent,
      label,
      originalText,
      ...(budgetMax === undefined ? {} : { budgetMax }),
    },
  }
}

export function interpretConciergeMessage(value: string): ConciergeInterpretation {
  const originalText = value.trim()
  if (!originalText) {
    return { status: 'empty', reply: 'Tell me what you want to change first.' }
  }
  if (originalText.length > maxMessageLength) {
    return { status: 'too_long', reply: 'Keep the request under 240 characters so I can make one clear adjustment.' }
  }
  if (privateContentPattern.test(originalText)) {
    return {
      status: 'privacy',
      reply: 'Leave out addresses, phone numbers, email addresses, and links. I only need the planning preference.',
    }
  }

  const normalized = originalText.toLowerCase().replace(/[^a-z0-9$\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  const budgetMatch = normalized.match(/(?:under|below|less than|max(?:imum)?|budget|up to|keep it under)\s*\$?\s*(\d{2,4})/)
    ?? normalized.match(/\$\s*(\d{2,4})/)
  if (budgetMatch) {
    const budgetMax = Number(budgetMatch[1])
    if (budgetMax >= 20 && budgetMax <= 1000) {
      return proposal('budget', `Keep it under $${budgetMax}`, originalText, budgetMax)
    }
  }
  if (/\b(cheaper|less expensive|lower cost|save money|spend less|budget friendly)\b/.test(normalized)) {
    return proposal('cheaper', 'Make it cheaper', originalText)
  }
  if (/\b(quiet|quieter|calm|calmer|conversation|less loud|low key|low-key)\b/.test(normalized)) {
    return proposal('quieter', 'Make it quieter', originalText)
  }
  if (/\b(indoor|indoors|rain|rainy|weather safe|weather-safe|dry)\b/.test(normalized)) {
    return proposal('indoor', 'Switch indoors', originalText)
  }
  if (/\b(short|shorten|shorter|quick|quicker|end sooner|less time|90 minutes)\b/.test(normalized)) {
    return proposal('shorter', 'Shorten the date', originalText)
  }
  if (/\b(romantic|more special|thoughtful|date night)\b/.test(normalized)) {
    return proposal('romantic', 'Make it more romantic', originalText)
  }
  if (/\b(food|dinner|coffee|dessert|mocktail|drinks|hungry|restaurant)\b/.test(normalized)) {
    return proposal('food', 'Add food or drinks', originalText)
  }

  return {
    status: 'unsupported',
    reply: 'I can help with budget, noise, indoor plans, timing, romance, or food. Try one change at a time.',
  }
}

export function selectConciergeCandidate(
  request: ConciergeRequest,
  candidates: ConciergePlanCandidate[],
): ConciergePlanCandidate | null {
  const eligible = candidates.filter((candidate) => candidate.eligible)
  if (!eligible.length) return null

  if (request.intent === 'budget') {
    return eligible.find((candidate) => candidate.estimatedCostHigh <= (request.budgetMax ?? 0)) ?? null
  }
  if (request.intent === 'cheaper') {
    return [...eligible].sort((a, b) => a.estimatedCostHigh - b.estimatedCostHigh)[0] ?? null
  }
  if (request.intent === 'shorter') {
    return [...eligible].sort((a, b) => a.durationMinutes - b.durationMinutes)[0] ?? null
  }
  if (request.intent === 'quieter') return eligible.find((candidate) => candidate.isQuiet) ?? null
  if (request.intent === 'indoor') return eligible.find((candidate) => candidate.isIndoor) ?? null
  if (request.intent === 'romantic') return eligible.find((candidate) => candidate.isRomantic) ?? null
  return eligible.find((candidate) => candidate.hasFood) ?? null
}
