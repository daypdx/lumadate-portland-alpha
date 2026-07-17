import type { PlacesProvider } from './placesProvider'

export const activePlacesProvider: PlacesProvider = {
  providerName: 'Mock Portland places provider',
  mode: 'mock',
  async searchPlaces(input) {
    return [
      {
        id: 'mock-laurelhurst-park',
        source: 'mock',
        name: 'Laurelhurst Park',
        category: 'park / walk',
        neighborhood: input.area || 'SE Portland',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Laurelhurst%20Park%20Portland',
        reviewUrl: 'https://www.google.com/search?q=Laurelhurst+Park+Portland+reviews',
        priceLevel: 'Free',
        ratingSummary: 'Review handoff only',
        availabilitySummary: 'Verify park conditions and route before leaving.',
        bookingType: 'free',
        verificationRequired: true,
      },
    ]
  },
}
