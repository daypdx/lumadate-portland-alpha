import type { PlacesProvider } from './placesProvider'

export function createGooglePlacesProvider(): PlacesProvider {
  return {
    providerName: 'Google Places placeholder',
    mode: 'live',
    async searchPlaces() {
      throw new Error('Google Places must be called from a secure server with official API access.')
    },
  }
}
