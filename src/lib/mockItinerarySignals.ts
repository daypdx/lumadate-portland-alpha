import { estimateCrowd } from './crowdEstimate'
import type { CrowdEstimate, RouteLeg, WeatherAtArrival } from '../types/integrations'

type DemoPlace = {
  name: string
  category: string
  ratingSummary?: string
}

type StopSignalInput = {
  place: DemoPlace
  index: number
  dateStart: string
  bookingType: 'free' | 'walk_in' | 'reservation' | 'ticketed' | 'unknown'
  crowdComfort: number
}

export type MockStopSignals = {
  arrivalTimeIso: string
  weather: WeatherAtArrival
  crowd: CrowdEstimate
  routeLeg: RouteLeg
}

export function buildMockStopSignals(input: StopSignalInput): MockStopSignals {
  const arrival = new Date(input.dateStart)
  arrival.setMinutes(arrival.getMinutes() + input.index * 55)
  const arrivalTimeIso = arrival.toISOString()
  const outdoor = /park|walk|outdoor|garden/.test(input.place.category.toLowerCase())
  const weather = mockWeatherAtArrival(arrivalTimeIso, outdoor)

  return {
    arrivalTimeIso,
    weather,
    crowd: estimateCrowd({
      arrivalTimeIso,
      category: input.place.category,
      bookingType: input.bookingType,
      reviewCount: inferredReviewCount(input.place.ratingSummary),
      weather,
      crowdComfort: input.crowdComfort,
    }),
    routeLeg: {
      from: input.index === 0 ? 'Public meet point' : 'Previous stop',
      to: input.place.name,
      travelMode: 'walking/driving demo',
      estimatedMinutes: input.index === 0 ? 12 : 8 + input.index * 3,
      trafficLabel: input.index === 0 ? 'Estimated route timing' : 'Short transfer estimate',
      source: 'mock',
    },
  }
}

export function mockWeatherAtArrival(arrivalTimeIso: string, outdoor: boolean): WeatherAtArrival {
  const arrival = new Date(arrivalTimeIso)
  const evening = arrival.getHours() >= 18

  return {
    arrivalTimeIso,
    summary: outdoor
      ? evening ? 'Mild evening layer suggested' : 'Outdoor-friendly demo forecast'
      : 'Weather-safe indoor stop',
    temperatureF: evening ? 66 : 72,
    precipitationChance: outdoor ? 18 : 8,
    source: 'mock',
    confidence: 'low',
  }
}

function inferredReviewCount(ratingSummary = ''): number | undefined {
  const match = ratingSummary.match(/(\d[\d,]*)\s*(reviews?|ratings?)/i)
  if (!match) return undefined
  return Number(match[1].replace(/,/g, ''))
}
