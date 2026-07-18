import type { PlacesProvider } from './placesProvider'
import { recommendCuratedVenues } from '../lib/curatedVenueRecommendations'

export const activePlacesProvider: PlacesProvider = {
  providerName: 'Curated Portland alpha provider',
  mode: 'mock',
  async searchPlaces(input) {
    return recommendCuratedVenues({
      area: input.area,
      categories: input.categories,
      budgetMax: input.budgetMax,
    }, 8).map(({ venue }) => ({
      id: venue.id,
      source: 'curated' as const,
      name: venue.name,
      category: venue.cuisines.join(' / '),
      neighborhood: venue.neighborhood,
      address: venue.address,
      mapsUrl: venue.mapsUrl,
      reviewUrl: venue.reviewUrl,
      priceLevel: `${'$'.repeat(venue.priceTierEstimate)} editorial estimate`,
      ratingSummary: 'No rating stored. Open the review handoff for current provider information.',
      availabilitySummary: 'Curated static record; hours and availability are not live.',
      bookingType: venue.bookingType,
      verificationRequired: true,
    }))
  },
}
