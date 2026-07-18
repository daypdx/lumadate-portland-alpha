import { describe, expect, it } from 'vitest'
import { portlandVenues, recommendablePortlandVenues } from './data/portlandVenues'
import { findAreaPairing, findVenueBackup, recommendCuratedVenues } from './lib/curatedVenueRecommendations'
import { activePlacesProvider } from './providers/mockPlacesProvider'

describe('curated Portland venue seed', () => {
  it('contains at least 30 recommendable restaurants and cafes with unique stable IDs', () => {
    const ids = portlandVenues.map((venue) => venue.id)
    const names = portlandVenues.map((venue) => venue.name)

    expect(recommendablePortlandVenues.length).toBeGreaterThanOrEqual(30)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual(expect.arrayContaining([
      'Farmhouse Kitchen Thai Cuisine',
      'Piazza Italia',
      'Mio Sushi — NW 23rd',
      'Fish & Rice',
    ]))
  })

  it('stores provenance and safe provider handoffs without live ratings or hours', () => {
    for (const venue of portlandVenues) {
      expect(venue.verifiedAt).toBe('2026-07-17')
      expect(venue.sourceUrls.length).toBeGreaterThan(0)
      expect(venue.sourceUrls.every((url) => url.startsWith('https://'))).toBe(true)
      expect(venue.mapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/search/)
      expect(venue.reviewUrl).toMatch(/^https:\/\/www\.google\.com\/search/)
      expect(venue).not.toHaveProperty('rating')
      expect(venue).not.toHaveProperty('openingHours')
      expect(venue).not.toHaveProperty('availability')
    }
  })

  it('keeps Fish & Rice as a lower-confidence founder seed with current-hour caution', () => {
    const fishAndRice = portlandVenues.find((venue) => venue.id === 'fish-and-rice-westover')

    expect(fishAndRice?.status).toBe('active')
    expect(fishAndRice?.curationTier).toBe('founder-seed')
    expect(fishAndRice?.verificationCaution).toContain('winter hours')
    expect(recommendablePortlandVenues).toContain(fishAndRice)
  })

  it('covers areas, costs, atmospheres, dietary cues, alcohol fit, and booking modes', () => {
    const restaurantTags = recommendablePortlandVenues
      .filter((venue) => venue.kind === 'restaurant')
      .flatMap((venue) => venue.dateTags)
    const bookingModes = new Set(recommendablePortlandVenues.map((venue) => venue.bookingType))

    expect(new Set(recommendablePortlandVenues.map((venue) => venue.area)).size).toBeGreaterThanOrEqual(6)
    expect(new Set(recommendablePortlandVenues.map((venue) => venue.priceTierEstimate))).toEqual(new Set([1, 2, 3, 4]))
    expect(bookingModes.has('walk_in')).toBe(true)
    expect(bookingModes.has('reservation')).toBe(true)
    expect(restaurantTags).toEqual(expect.arrayContaining(['quiet', 'lively', 'romantic', 'casual']))
    expect(recommendablePortlandVenues.some((venue) => venue.dietarySignals.length > 0)).toBe(true)
    expect(recommendablePortlandVenues.some((venue) => venue.alcoholFit === 'easy-without-alcohol')).toBe(true)
    expect(recommendablePortlandVenues.filter((venue) => venue.curationTier === 'editorial-consensus').length).toBeGreaterThanOrEqual(6)
  })

  it('provides a same-area backup and a pairing for every restaurant', () => {
    const restaurants = recommendablePortlandVenues.filter((venue) => venue.kind === 'restaurant')

    for (const restaurant of restaurants) {
      const backup = findVenueBackup(restaurant)
      expect(backup, `${restaurant.name} should have a backup`).toBeDefined()
      expect(backup?.area).toBe(restaurant.area)
      expect(findAreaPairing(restaurant), `${restaurant.name} should have an area pairing`).toBeDefined()
    }
  })

  it('uses cuisine and area cues to surface founder-requested venue seeds', () => {
    const thai = recommendCuratedVenues({
      area: 'Pearl District',
      categories: ['dinner'],
      budgetMax: 180,
      cues: 'Thai food and colorful places',
    })
    const sushi = recommendCuratedVenues({
      area: 'NW Portland',
      categories: ['sushi'],
      budgetMax: 120,
      cues: 'casual sushi',
    })

    expect(thai[0].venue.name).toBe('Farmhouse Kitchen Thai Cuisine')
    expect(sushi.map((match) => match.venue.name)).toContain('Mio Sushi — NW 23rd')
    expect(sushi.map((match) => match.venue.name)).toContain('Fish & Rice')
  })

  it('treats must-avoid terms as exclusions instead of positive matches', () => {
    const results = recommendCuratedVenues({
      area: 'NW Portland',
      categories: ['dinner'],
      budgetMax: 180,
      cues: 'quiet conversation',
      avoidCues: 'sushi and poke',
    }, 35)

    expect(results.length).toBeGreaterThan(0)
    expect(results.every(({ venue }) => !venue.cuisines.some((cuisine) => /sushi|poke/.test(cuisine)))).toBe(true)

    const quietResults = recommendCuratedVenues({
      area: 'SE Portland',
      categories: ['dinner'],
      budgetMax: 180,
      avoidCues: 'bars and noisy places',
    }, 35)

    expect(quietResults.every(({ venue }) => venue.alcoholFit !== 'bar-forward')).toBe(true)
    expect(quietResults.every(({ venue }) => !venue.dateTags.includes('lively'))).toBe(true)
  })

  it('does not turn conversational filler into match reasons', () => {
    const results = recommendCuratedVenues({
      area: 'Alberta Arts District',
      categories: [],
      budgetMax: 120,
      cues: 'They like places and want some food',
    })

    expect(results.every(({ matchedTerms }) => matchedTerms.length === 0)).toBe(true)
  })

  it('powers the alpha places provider with curated, non-live candidates', async () => {
    const results = await activePlacesProvider.searchPlaces({
      area: 'Downtown Portland',
      categories: ['coffee', 'quiet'],
      budgetMax: 70,
      dateStart: '2026-07-17T18:30',
    })

    expect(results).toHaveLength(8)
    expect(results.every((place) => place.source === 'curated')).toBe(true)
    expect(results.every((place) => place.verificationRequired)).toBe(true)
    expect(results.every((place) => place.availabilitySummary.includes('not live'))).toBe(true)
  })
})
