import { recommendablePortlandVenues, type CuratedVenue } from '../data/portlandVenues'

export type CuratedVenueSearchInput = {
  area: string
  categories: string[]
  budgetMax: number
  cues?: string
  avoidCues?: string
}

export type CuratedVenueMatch = {
  venue: CuratedVenue
  score: number
  matchedTerms: string[]
  reason: string
}

export type AreaPairingIdea = {
  name: string
  kind: 'park' | 'walk' | 'activity'
  mapsUrl: string
}

function pairing(name: string, kind: AreaPairingIdea['kind']): AreaPairingIdea {
  return {
    name,
    kind,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} Portland Oregon`)}`,
  }
}

export const areaPairingCatalog: Record<string, AreaPairingIdea[]> = {
  'Pearl District': [pairing('Tanner Springs Park', 'park'), pairing('Jamison Square', 'park')],
  'NW Portland': [pairing('Wallace Park', 'park'), pairing('NW 23rd Avenue walk', 'walk')],
  'SE Portland': [pairing('Laurelhurst Park', 'park'), pairing('Mount Tabor Park', 'park')],
  'NE Portland': [pairing('Irving Park', 'park'), pairing('Hollywood Theatre', 'activity')],
  'Mississippi / Williams': [pairing('Mississippi Avenue walk', 'walk'), pairing('Peninsula Park', 'park')],
  'Sellwood / Moreland': [pairing('Sellwood Riverfront Park', 'park'), pairing('Oaks Bottom Wildlife Refuge', 'walk')],
  'Downtown Portland': [pairing('Portland Art Museum', 'activity'), pairing('Director Park', 'park')],
  'Alberta Arts District': [pairing('Alberta Street art walk', 'walk'), pairing('Alberta Park', 'park')],
}

const stopWords = new Set([
  'and', 'are', 'date', 'food', 'for', 'like', 'likes', 'option', 'options', 'place', 'places',
  'some', 'that', 'the', 'their', 'them', 'they', 'want', 'wants', 'with',
])
const termAliases: Record<string, string> = {
  bars: 'bar',
  cocktails: 'cocktail',
  crowded: 'lively',
  crowds: 'crowd',
  drinks: 'drink',
  loud: 'lively',
  noisy: 'lively',
  restaurants: 'restaurant',
}

function terms(value: string): string[] {
  return [...new Set(value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((item) => termAliases[item] ?? item)
    .filter((item) => item.length > 2 && !stopWords.has(item)))]
}

function affordableTier(budgetMax: number): number {
  if (budgetMax <= 70) return 1
  if (budgetMax <= 120) return 2
  if (budgetMax <= 250) return 3
  return 4
}

function matchReason(venue: CuratedVenue, matchedTerms: string[], areaMatch: boolean): string {
  const reasons = [
    areaMatch ? `Fits ${venue.area}` : '',
    matchedTerms.length ? `Matches ${matchedTerms.slice(0, 2).join(' + ')}` : '',
    venue.kind === 'cafe' || venue.kind === 'dessert' ? 'Easy low-pressure stop' : '',
  ].filter(Boolean)

  return reasons.join(' · ') || 'Current curated Portland seed'
}

export function recommendCuratedVenues(input: CuratedVenueSearchInput, limit = 4): CuratedVenueMatch[] {
  const queryTerms = terms(`${input.categories.join(' ')} ${input.cues ?? ''}`)
  const avoidTerms = terms(input.avoidCues ?? '')
  const budgetTier = affordableTier(input.budgetMax)

  return recommendablePortlandVenues
    .map((venue, index) => {
      const searchable = terms([
        venue.name,
        venue.kind,
        venue.cuisines.join(' '),
        venue.neighborhood,
        venue.area,
        venue.dateTags.join(' '),
        venue.dietarySignals.join(' '),
        venue.alcoholFit,
        venue.summary,
      ].join(' '))
      const matchedTerms = queryTerms.filter((term) => searchable.includes(term))
      const avoidedTerms = avoidTerms.filter((term) => searchable.includes(term))
      const cuisineTerms = terms(venue.cuisines.join(' '))
      const cuisineMatches = matchedTerms.filter((term) => cuisineTerms.includes(term))
      const areaMatch = venue.area.toLowerCase() === input.area.toLowerCase()
      const priceDifference = venue.priceTierEstimate - budgetTier
      const curationBonus = venue.curationTier === 'editorial-consensus' ? 3 : 0
      const score =
        (areaMatch ? 16 : 0)
        + Math.min(24, matchedTerms.length * 6)
        + Math.min(20, cuisineMatches.length * 10)
        + curationBonus
        + (priceDifference <= 0 ? 6 : priceDifference === 1 ? -4 : -12)
        + (venue.dateTags.includes('conversation') || venue.dateTags.includes('low pressure') ? 2 : 0)
        - index / 1000

      return {
        venue,
        score,
        matchedTerms,
        avoidedTerms,
        reason: matchReason(venue, matchedTerms, areaMatch),
      }
    })
    .filter(({ avoidedTerms }) => avoidedTerms.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, limit))
    .map(({ avoidedTerms: _avoidedTerms, ...match }) => match)
}

export function findVenueBackup(venue: CuratedVenue): CuratedVenue | undefined {
  const sameKind = (candidate: CuratedVenue) => venue.kind === 'restaurant'
    ? candidate.kind === 'restaurant'
    : candidate.kind === 'cafe' || candidate.kind === 'dessert'

  return recommendablePortlandVenues
    .filter((candidate) => candidate.id !== venue.id && sameKind(candidate))
    .sort((a, b) => {
      const areaDifference = Number(b.area === venue.area) - Number(a.area === venue.area)
      if (areaDifference !== 0) return areaDifference
      return Math.abs(a.priceTierEstimate - venue.priceTierEstimate)
        - Math.abs(b.priceTierEstimate - venue.priceTierEstimate)
    })[0]
}

export function findAreaPairing(venue: CuratedVenue): AreaPairingIdea | undefined {
  const sourcedPairing = venue.compatibleVenueIds
    .map((id) => recommendablePortlandVenues.find((candidate) => candidate.id === id))
    .find((candidate) => candidate?.kind === 'park' || candidate?.kind === 'activity')

  if (sourcedPairing) {
    return {
      name: sourcedPairing.name,
      kind: sourcedPairing.kind === 'park' ? 'park' : 'activity',
      mapsUrl: sourcedPairing.mapsUrl,
    }
  }

  const options = areaPairingCatalog[venue.area]
  if (!options?.length) return undefined
  const venueIndex = recommendablePortlandVenues.findIndex((candidate) => candidate.id === venue.id)
  return options[Math.max(0, venueIndex) % options.length]
}
