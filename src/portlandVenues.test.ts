import { describe, expect, it } from 'vitest'
import { portlandVenues, recommendablePortlandVenues } from './data/portlandVenues'
import { findAreaPairing, findVenueBackup, recommendCuratedVenues } from './lib/curatedVenueRecommendations'
import { activePlacesProvider } from './providers/mockPlacesProvider'

describe('curated Portland venue seed', () => {
  it('contains a balanced 75–100 place catalog with unique stable IDs', () => {
    const ids = portlandVenues.map((venue) => venue.id)
    const names = portlandVenues.map((venue) => venue.name)
    const kinds = recommendablePortlandVenues.map((venue) => venue.kind as string)

    expect(recommendablePortlandVenues.length).toBeGreaterThanOrEqual(75)
    expect(recommendablePortlandVenues.length).toBeLessThanOrEqual(100)
    expect(recommendablePortlandVenues.every((venue) => venue.status === 'active')).toBe(true)
    expect(recommendablePortlandVenues.some((venue) => venue.id === 'tov-coffee-sunnyside')).toBe(false)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    expect(kinds).toEqual(expect.arrayContaining(['restaurant', 'cafe', 'dessert', 'park', 'activity']))
    expect(kinds.filter((kind) => kind === 'restaurant').length).toBeGreaterThanOrEqual(40)
    expect(kinds.filter((kind) => kind === 'cafe' || kind === 'dessert').length).toBeGreaterThanOrEqual(12)
    expect(kinds.filter((kind) => kind === 'park').length).toBeGreaterThanOrEqual(8)
    expect(kinds.filter((kind) => kind === 'activity').length).toBeGreaterThanOrEqual(8)
    expect(names).toEqual(expect.arrayContaining([
      'Farmhouse Kitchen Thai Cuisine',
      'Piazza Italia',
      'Mio Sushi — NW 23rd',
      'Fish & Rice',
    ]))
  })

  it('stores a location-specific public identity and compatible nearby stops for every place', () => {
    const venueIds = new Set(portlandVenues.map((venue) => venue.id))

    for (const venue of portlandVenues) {
      const compatibleVenueIds = (venue as typeof venue & { compatibleVenueIds?: string[] }).compatibleVenueIds

      expect(venue.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(venue.neighborhood).not.toMatch(/multiple .* locations/i)
      expect(venue.address, `${venue.name} should use a location-specific public address`).toBeTruthy()
      expect(venue.websiteUrl, `${venue.name} should have an official public link`).toMatch(/^https:\/\//)
      expect(venue.priceTierEstimate).toBeGreaterThanOrEqual(1)
      expect(venue.priceTierEstimate).toBeLessThanOrEqual(4)
      if (venue.kind === 'park') {
        expect(venue.priceTierEstimate).toBe(1)
        expect(venue.bookingType).toBe('free')
      }
      expect(compatibleVenueIds?.length ?? 0, `${venue.name} should have compatible nearby stops`).toBeGreaterThan(0)
      expect(compatibleVenueIds?.every((id) => id !== venue.id && venueIds.has(id)) ?? false).toBe(true)
      expect(compatibleVenueIds?.every((id) => portlandVenues.find((candidate) => candidate.id === id)?.area === venue.area) ?? false).toBe(true)
      expect(compatibleVenueIds?.every((id) => portlandVenues.find((candidate) => candidate.id === id)?.status === 'active') ?? false).toBe(true)
    }
  })

  it('stores provenance and safe provider handoffs without live ratings or hours', () => {
    for (const venue of portlandVenues) {
      expect(venue.verifiedAt).toMatch(/^2026-07-(17|19)$/)
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
      const pairing = findAreaPairing(restaurant)
      expect(backup, `${restaurant.name} should have a backup`).toBeDefined()
      expect(backup?.area).toBe(restaurant.area)
      expect(pairing, `${restaurant.name} should have an area pairing`).toBeDefined()
      expect(
        portlandVenues.some((candidate) => candidate.name === pairing?.name && (candidate.kind === 'park' || candidate.kind === 'activity')),
        `${restaurant.name} should pair to a sourced catalog place`,
      ).toBe(true)
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
    const activeIds = new Set(recommendablePortlandVenues.map((venue) => venue.id))
    expect(results.every((place) => activeIds.has(place.id))).toBe(true)
    expect(results.some((place) => place.id === 'tov-coffee-sunnyside')).toBe(false)
    expect(results.every((place) => place.source === 'curated')).toBe(true)
    expect(results.every((place) => place.verificationRequired)).toBe(true)
    expect(results.every((place) => place.availabilitySummary.includes('not live'))).toBe(true)
  })
})
