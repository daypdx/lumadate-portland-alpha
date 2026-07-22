import { describe, expect, it } from 'vitest'
import {
  interpretConciergeMessage,
  selectConciergeCandidate,
  type ConciergePlanCandidate,
} from './planConcierge'

const candidates: ConciergePlanCandidate[] = [
  {
    planId: 'top-plan',
    title: 'Top plan',
    estimatedCostHigh: 140,
    durationMinutes: 210,
    eligible: true,
    isQuiet: false,
    isIndoor: false,
    isRomantic: true,
    hasFood: true,
  },
  {
    planId: 'quiet-plan',
    title: 'Quiet plan',
    estimatedCostHigh: 80,
    durationMinutes: 120,
    eligible: true,
    isQuiet: true,
    isIndoor: true,
    isRomantic: false,
    hasFood: true,
  },
  {
    planId: 'unsafe-plan',
    title: 'Unsafe plan',
    estimatedCostHigh: 20,
    durationMinutes: 60,
    eligible: false,
    isQuiet: true,
    isIndoor: true,
    isRomantic: true,
    hasFood: true,
  },
]

describe('mock plan concierge', () => {
  it('turns conversational requests into bounded supported intents', () => {
    expect(interpretConciergeMessage('Can we keep it under $100?')).toMatchObject({
      status: 'proposal',
      request: { intent: 'budget', budgetMax: 100 },
    })
    expect(interpretConciergeMessage('Somewhere calmer where we can talk')).toMatchObject({
      status: 'proposal',
      request: { intent: 'quieter' },
    })
    expect(interpretConciergeMessage('Rain is coming, switch this indoors')).toMatchObject({
      status: 'proposal',
      request: { intent: 'indoor' },
    })
    expect(interpretConciergeMessage('Shorten the date')).toMatchObject({
      status: 'proposal',
      request: { intent: 'shorter' },
    })
  })

  it('withholds private details and unsupported requests from proposals', () => {
    expect(interpretConciergeMessage('Start at 123 Private Street')).toMatchObject({ status: 'privacy' })
    expect(interpretConciergeMessage('Email the plan to private@example.com')).toMatchObject({ status: 'privacy' })
    expect(interpretConciergeMessage('Make it absolutely legendary')).toMatchObject({ status: 'unsupported' })
  })

  it('selects only eligible approved candidates', () => {
    const cheaper = interpretConciergeMessage('Make it cheaper')
    const quieter = interpretConciergeMessage('Make it quieter')
    expect(cheaper.status).toBe('proposal')
    expect(quieter.status).toBe('proposal')
    if (cheaper.status !== 'proposal' || quieter.status !== 'proposal') return

    expect(selectConciergeCandidate(cheaper.request, candidates)?.planId).toBe('quiet-plan')
    expect(selectConciergeCandidate(quieter.request, candidates)?.planId).toBe('quiet-plan')
    expect(selectConciergeCandidate(cheaper.request, candidates)?.planId).not.toBe('unsafe-plan')
  })

  it('returns no proposal target when a budget cannot be met safely', () => {
    const interpretation = interpretConciergeMessage('Keep it under $50')
    expect(interpretation.status).toBe('proposal')
    if (interpretation.status !== 'proposal') return
    expect(selectConciergeCandidate(interpretation.request, candidates)).toBeNull()
  })
})
