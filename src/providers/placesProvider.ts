import type { IntegrationProviderMode, PlaceCandidate, PlaceDetails } from '../types/integrations'

export type PlaceSearchInput = {
  area: string
  categories: string[]
  budgetMax: number
  dateStart: string
}

export type PlaceSearchResult = {
  name: string
  category: string
  providerUrl: string
  ratingSummary: string
  availabilitySummary: string
}

export type PlacesProvider = {
  providerName: string
  mode: IntegrationProviderMode
  searchPlaces: (input: PlaceSearchInput) => Promise<PlaceCandidate[]>
  getPlaceDetails?: (placeId: string) => Promise<PlaceDetails>
  legacySearchPlaces?: (input: PlaceSearchInput) => Promise<PlaceSearchResult[]>
}
