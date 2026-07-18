export type IntegrationProviderMode = 'mock' | 'live'

export type PlaceCandidate = {
  id: string
  source: 'mock' | 'curated' | 'google-places' | 'partner'
  name: string
  category: string
  neighborhood: string
  address?: string
  mapsUrl: string
  reviewUrl?: string
  priceLevel?: string
  ratingSummary?: string
  availabilitySummary: string
  bookingType?: 'free' | 'walk_in' | 'reservation' | 'ticketed' | 'unknown'
  verificationRequired: boolean
}

export type PlaceDetails = PlaceCandidate & {
  phone?: string
  website?: string
  openingHoursSummary?: string
  photoUrl?: string
}

export type ItineraryStop = {
  id: string
  title: string
  category: string
  arrivalTimeIso: string
  plannedDurationMinutes: number
  place?: PlaceDetails
  verificationNote: string
}

export type RouteLeg = {
  from: string
  to: string
  travelMode: string
  estimatedMinutes: number
  trafficLabel: string
  leaveByIso?: string
  source: 'mock' | 'google-routes'
}

export type WeatherAtArrival = {
  arrivalTimeIso: string
  summary: string
  temperatureF?: number
  precipitationChance?: number
  source: 'mock' | 'nws' | 'google-weather'
  confidence: 'low' | 'medium' | 'high'
}

export type CrowdEstimate = {
  level: 'quiet' | 'moderate' | 'busy' | 'unknown'
  label: string
  confidence: 'low' | 'medium' | 'high'
  source: 'heuristic' | 'partner' | 'unknown'
  livePopularTimesConnected: boolean
  signals: string[]
  recommendation: string
  verificationCopy: string
}
