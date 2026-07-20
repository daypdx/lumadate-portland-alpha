export type AiReasonCode =
  | 'AREA_MATCH'
  | 'BUDGET_MATCH'
  | 'QUIET_FIT'
  | 'INTEREST_MATCH'
  | 'FIRST_DATE_SAFE'
  | 'WEATHER_SAFE'
  | 'BACKUP_AVAILABLE'

export type AiVenueOption = {
  venueId: string
  areaMatch: boolean
  categoryMatch: boolean
  available: boolean
}

export type AiItineraryCandidate = {
  planId: string
  estimatedCostHigh: number
  durationMinutes: number
  areaMatch: boolean
  budgetFits: boolean
  safetyEligible: boolean
  venueOptions: AiVenueOption[]
  reasonCodes: AiReasonCode[]
}

export type AiItineraryCandidateInput = {
  planId: string
  title?: string
  score?: number
  estimatedCostHigh: number
  durationMinutes: number
  venueIds?: string[]
  reasons?: string[]
  warnings?: string[]
  areaMatch?: boolean
  budgetFits?: boolean
  safetyEligible?: boolean
  venueOptions?: AiVenueOption[]
  reasonCodes?: string[]
}

export type AiIntakeInput = {
  startLocation?: string
  dateArea: string
  dateStage: string
  dateStart: string
  dateEnd: string
  endMode: string
  budgetMax: number
  foodWanted: string
  cuisineLikes: string
  dietaryLimits: string
  alcoholPreference: string
  activityTypes: string[]
  indoorOutdoor: string
  moodTypes: string[]
  energyLevel: number
  romanceLevel: number
  crowdComfort: number
  dateEnjoysText: string
  userEnjoysText: string
  firstDateSafeMode: boolean
  mustAvoid: string
}

export type AiPreferences = {
  dateArea: string
  dateStage: string
  dateStart: string
  dateEnd: string
  endMode: string
  budgetMax: number
  foodWanted: string
  alcoholPreference: string
  indoorOutdoor: string
  energyLevel: number
  romanceLevel: number
  crowdComfort: number
  firstDateSafeMode: boolean
  activityTags: string[]
  moodTags: string[]
  interestTags: string[]
  cuisineTags: string[]
  dietaryTags: string[]
  avoidTags: string[]
}

export type AiItineraryRequest = {
  schemaVersion: 1
  preferences: AiPreferences
  candidates: AiItineraryCandidate[]
}

export type AiComposedPlan = {
  planId: string
  venueId?: string
  explanation: string
}

export type AiItineraryComposition = {
  schemaVersion: 1
  providerMode: 'mock' | 'hosted' | 'fallback'
  primaryPlanId: string
  summary: string
  plans: AiComposedPlan[]
  verificationRequired: true
}

export type AiItineraryValidation = {
  valid: boolean
  errors: string[]
}

export function validateAiItineraryComposition(
  request: AiItineraryRequest,
  composition: AiItineraryComposition,
): AiItineraryValidation {
  const errors: string[] = []
  const candidates = new Map(request.candidates.map((candidate) => [candidate.planId, candidate]))

  if (!candidates.has(composition.primaryPlanId)) {
    errors.push(`Unknown plan ID: ${composition.primaryPlanId || '(empty)'}.`)
  }

  for (const plan of composition.plans) {
    const candidate = candidates.get(plan.planId)
    if (!candidate) {
      errors.push(`Unknown plan ID: ${plan.planId || '(empty)'}.`)
    }
    if (plan.venueId && !candidate?.venueOptions.some((venue) => venue.venueId === plan.venueId)) {
      errors.push(`Unknown venue ID: ${plan.venueId}.`)
    }
  }

  const authoredText = [composition.summary, ...composition.plans.map((plan) => plan.explanation)].join(' ')
  const streetLikeAddress = /\b\d{1,6}\s+(?:[a-z0-9.'-]+\s+){0,5}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way)\b/i
  if (streetLikeAddress.test(authoredText)) {
    errors.push('Street-like address found in model-authored text.')
  }

  return { valid: errors.length === 0, errors }
}

export interface ItineraryComposer {
  compose(request: AiItineraryRequest): Promise<AiItineraryComposition>
}

const reasonCodeCopy: Record<AiReasonCode, string> = {
  AREA_MATCH: 'Fits the selected area.',
  BUDGET_MATCH: 'Fits the total-date budget.',
  QUIET_FIT: 'Supports a quieter date.',
  INTEREST_MATCH: 'Matches approved interest tags.',
  FIRST_DATE_SAFE: 'Keeps the plan public and first-date safe.',
  WEATHER_SAFE: 'Includes a weather-safe option.',
  BACKUP_AVAILABLE: 'Includes a compatible backup.',
}

function fixedExplanation(reasonCodes: AiReasonCode[]): string {
  return reasonCodes.slice(0, 2).map((code) => reasonCodeCopy[code]).join(' ') || 'Approved LumaDate candidate.'
}

function fallbackComposition(request: AiItineraryRequest): AiItineraryComposition {
  const plans = request.candidates.map((candidate) => ({
    planId: candidate.planId,
    venueId: candidate.venueOptions.find((venue) => venue.available)?.venueId,
    explanation: fixedExplanation(candidate.reasonCodes),
  }))

  return {
    schemaVersion: 1,
    providerMode: 'fallback',
    primaryPlanId: plans[0]?.planId ?? '',
    summary: 'AI composition was unavailable, so LumaDate used its safe LumaDate fallback.',
    plans,
    verificationRequired: true,
  }
}

export async function composeAiItinerarySafely(
  request: AiItineraryRequest,
  composer: ItineraryComposer,
): Promise<AiItineraryComposition> {
  try {
    const composition = await composer.compose(request)
    return validateAiItineraryComposition(request, composition).valid
      ? composition
      : fallbackComposition(request)
  } catch {
    return fallbackComposition(request)
  }
}

export const mockItineraryComposer: ItineraryComposer = {
  async compose(request) {
    const plans = request.candidates.map((candidate) => ({
      planId: candidate.planId,
      venueId: candidate.venueOptions.find((venue) => venue.available)?.venueId,
      explanation: fixedExplanation(candidate.reasonCodes),
    }))

    return {
      schemaVersion: 1,
      providerMode: 'mock',
      primaryPlanId: plans[0]?.planId ?? '',
      summary: plans[0]
        ? "Mock composition selected from LumaDate's approved candidates."
        : 'No approved itinerary candidates were available.',
      plans,
      verificationRequired: true,
    }
  },
}

const allowedReasonCodes = new Set<AiReasonCode>([
  'AREA_MATCH',
  'BUDGET_MATCH',
  'QUIET_FIT',
  'INTEREST_MATCH',
  'FIRST_DATE_SAFE',
  'WEATHER_SAFE',
  'BACKUP_AVAILABLE',
])

function isAiReasonCode(value: string): value is AiReasonCode {
  return allowedReasonCodes.has(value as AiReasonCode)
}

type TagRule = readonly [tag: string, aliases: readonly string[]]

const interestTagRules: TagRule[] = [
  ['park', ['park', 'parks']],
  ['coffee', ['coffee', 'cafe', 'cafes']],
  ['walkable', ['walkable', 'walking', 'walk']],
  ['bookstore', ['bookstore', 'bookstores', 'books']],
  ['dessert', ['dessert', 'desserts']],
  ['restaurant', ['restaurant', 'restaurants', 'dinner']],
  ['sushi', ['sushi']],
  ['thai', ['thai']],
  ['pizza', ['pizza']],
  ['mocktails', ['mocktail', 'mocktails']],
  ['art', ['art', 'gallery', 'galleries']],
  ['comedy', ['comedy']],
  ['live_music', ['live music', 'music']],
  ['jazz', ['jazz']],
  ['garden', ['garden', 'gardens']],
  ['museum', ['museum', 'museums']],
  ['quiet', ['quiet']],
]

const cuisineTagRules: TagRule[] = [
  ['thai', ['thai']],
  ['italian', ['italian', 'pasta']],
  ['japanese', ['japanese']],
  ['sushi', ['sushi']],
  ['pizza', ['pizza']],
  ['coffee', ['coffee']],
  ['dessert', ['dessert']],
  ['mexican', ['mexican']],
  ['indian', ['indian']],
  ['mediterranean', ['mediterranean']],
  ['vegan', ['vegan']],
  ['vegetarian', ['vegetarian']],
]

const dietaryTagRules: TagRule[] = [
  ['nut_allergy', ['peanut allergy', 'nut allergy', 'tree nut allergy']],
  ['gluten_free', ['gluten free', 'gluten-free', 'celiac']],
  ['dairy_free', ['dairy free', 'dairy-free', 'lactose']],
  ['vegan', ['vegan']],
  ['vegetarian', ['vegetarian']],
  ['halal', ['halal']],
  ['kosher', ['kosher']],
]

const avoidTagRules: TagRule[] = [
  ['loud_bars', ['loud bar', 'loud bars', 'noisy bar', 'noisy bars']],
  ['long_waits', ['long wait', 'long waits']],
  ['expensive_places', ['expensive place', 'expensive places', 'too expensive']],
  ['long_drives', ['long drive', 'long drives']],
  ['crowded_venues', ['crowded venue', 'crowded venues', 'crowds']],
  ['outdoor_weather_risk', ['outdoor weather risk', 'weather risk', 'rain risk']],
  ['alcohol', ['alcohol', 'drinking']],
]

const approvedActivityTags = new Set([
  'coffee', 'dinner', 'dessert', 'brunch', 'sushi', 'thai', 'pizza', 'mocktails', 'food_carts',
  'jazz', 'live_music', 'comedy', 'theater', 'movie', 'arcade_trivia', 'museum', 'gallery',
  'bookstore', 'class', 'market', 'scenic_walk', 'park', 'river_walk', 'garden', 'viewpoint',
  'quiet', 'lively', 'romantic', 'adventurous', 'photo_worthy', 'sober_friendly',
  'quiet_conversation', 'cozy_cafe', 'low_crowd', 'short_date', 'easy_exit', 'outdoors',
])
const approvedMoodTags = new Set(['chill', 'romantic', 'playful', 'adventurous', 'social', 'quiet'])

function textForTagging(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+|www\.\S+/g, ' ')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, ' ')
    .replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g, ' ')
    .replace(/@[a-z0-9_]+/gi, ' ')
    .replace(/\b\d{1,6}\s+(?:[a-z0-9.'-]+\s+){0,5}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way)\b/gi, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function approvedTags(value: string, rules: TagRule[], limit = 12): string[] {
  const normalized = ` ${textForTagging(value).replace(/-/g, ' ')} `
  return rules
    .filter(([, aliases]) => aliases.some((alias) => normalized.includes(` ${alias.replace(/-/g, ' ')} `)))
    .map(([tag]) => tag)
    .slice(0, limit)
}

function approvedStructuredTags(values: string[], catalog: Set<string>): string[] {
  return [...new Set(values.map((value) => value.toLowerCase().trim()).filter((value) => catalog.has(value)))].slice(0, 16)
}

export function createAiItineraryRequest({
  intake,
  candidates,
}: {
  intake: AiIntakeInput
  candidates: AiItineraryCandidateInput[]
}): AiItineraryRequest {
  return {
    schemaVersion: 1,
    preferences: {
      dateArea: intake.dateArea,
      dateStage: intake.dateStage,
      dateStart: intake.dateStart,
      dateEnd: intake.dateEnd,
      endMode: intake.endMode,
      budgetMax: intake.budgetMax,
      foodWanted: intake.foodWanted,
      alcoholPreference: intake.alcoholPreference,
      indoorOutdoor: intake.indoorOutdoor,
      energyLevel: intake.energyLevel,
      romanceLevel: intake.romanceLevel,
      crowdComfort: intake.crowdComfort,
      firstDateSafeMode: intake.firstDateSafeMode,
      activityTags: approvedStructuredTags(intake.activityTypes, approvedActivityTags),
      moodTags: approvedStructuredTags(intake.moodTypes, approvedMoodTags),
      interestTags: approvedTags(`${intake.dateEnjoysText} ${intake.userEnjoysText}`, interestTagRules),
      cuisineTags: approvedTags(intake.cuisineLikes, cuisineTagRules),
      dietaryTags: approvedTags(intake.dietaryLimits, dietaryTagRules),
      avoidTags: approvedTags(intake.mustAvoid, avoidTagRules),
    },
    candidates: candidates.map((candidate) => {
      const areaMatch = candidate.areaMatch ?? true
      const budgetFits = candidate.budgetFits ?? true
      const safetyEligible = candidate.safetyEligible ?? true
      const venueOptions = candidate.venueOptions
        ?? (candidate.venueIds ?? []).map((venueId) => ({
          venueId,
          areaMatch: true,
          categoryMatch: true,
          available: true,
        }))
      const defaultReasonCodes: AiReasonCode[] = [
        ...(areaMatch ? ['AREA_MATCH' as const] : []),
        ...(budgetFits ? ['BUDGET_MATCH' as const] : []),
        ...(safetyEligible ? ['FIRST_DATE_SAFE' as const] : []),
      ]

      return {
        planId: candidate.planId,
        estimatedCostHigh: candidate.estimatedCostHigh,
        durationMinutes: candidate.durationMinutes,
        areaMatch,
        budgetFits,
        safetyEligible,
        venueOptions: venueOptions
          .filter((venue) => venue.areaMatch && venue.categoryMatch)
          .map((venue) => ({ ...venue })),
        reasonCodes: [...new Set((candidate.reasonCodes ?? defaultReasonCodes).filter(isAiReasonCode))].slice(0, 7),
      }
    }),
  }
}
