import type { CrowdEstimate, WeatherAtArrival } from '../types/integrations'

type CrowdEstimateInput = {
  arrivalTimeIso: string
  category: string
  bookingType?: 'free' | 'walk_in' | 'reservation' | 'ticketed' | 'unknown'
  reviewCount?: number
  weather?: WeatherAtArrival
  crowdComfort?: number
}

export function estimateCrowd(input: CrowdEstimateInput): CrowdEstimate {
  const arrival = new Date(input.arrivalTimeIso)
  const hour = arrival.getHours()
  const day = arrival.getDay()
  const isWeekend = day === 0 || day === 5 || day === 6
  const category = input.category.toLowerCase()
  const signals: string[] = []
  let score = 0

  if (isWeekend) {
    score += 1
    signals.push('weekend timing')
  }

  if (/restaurant|dinner|bistro|market|food/.test(category) && hour >= 18 && hour <= 20) {
    score += 2
    signals.push('dinner rush window')
  }

  if (/coffee|dessert|cafe/.test(category) && (hour >= 8 && hour <= 10 || hour >= 19 && hour <= 21)) {
    score += 1
    signals.push(/coffee|cafe/.test(category) ? 'coffee peak window' : 'evening dessert window')
  }

  if (/park|walk|outdoor/.test(category) && isWeekend && hour >= 11 && hour <= 18) {
    score += 1
    signals.push('weekend park traffic')
  }

  if (input.bookingType === 'walk_in' || input.bookingType === 'unknown') {
    score += 1
    signals.push('walk-in availability needs checking')
  }

  if (input.bookingType === 'reservation') {
    score -= 1
    signals.push('reservation handoff lowers wait risk')
  }

  if (input.reviewCount && input.reviewCount > 800) {
    score += 1
    signals.push('high review volume suggests demand')
  }

  if (input.weather?.precipitationChance && input.weather.precipitationChance >= 45 && /park|walk|outdoor/.test(category)) {
    score -= 1
    signals.push('weather may reduce outdoor crowds')
  }

  const comfort = input.crowdComfort ?? 3
  if (comfort <= 2 && score >= 2) signals.push('above your crowd comfort')

  if (score >= 4) {
    return crowd('busy', 'Likely busy', 'medium', signals, 'Keep the backup close and verify before leaving.')
  }

  if (score >= 2) {
    return crowd('moderate', 'Estimated moderate', 'medium', signals, 'Good plan, but check current wait or availability.')
  }

  if (signals.length > 0) {
    return crowd('quiet', 'Likely manageable', 'low', signals, 'Still verify hours/current availability before leaving.')
  }

  return crowd('unknown', 'Crowd unknown', 'low', ['limited demo signals'], 'Verify before leaving.')
}

function crowd(
  level: CrowdEstimate['level'],
  label: string,
  confidence: CrowdEstimate['confidence'],
  signals: string[],
  recommendation: string,
): CrowdEstimate {
  return {
    level,
    label,
    confidence,
    source: 'heuristic',
    livePopularTimesConnected: false,
    signals,
    recommendation,
    verificationCopy: 'Estimated crowd. Verify before leaving.',
  }
}
