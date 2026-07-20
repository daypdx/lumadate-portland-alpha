export type AiFeatureMode = 'deterministic' | 'mock-preview'

export function getAiFeatureMode(search: string): AiFeatureMode {
  return new URLSearchParams(search).get('aiPreview') === 'mock' ? 'mock-preview' : 'deterministic'
}

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
  reasonCodes: AiReasonCode[]
}

export type AiItineraryComposition = {
  schemaVersion: 1
  providerMode: 'mock' | 'hosted' | 'fallback'
  primaryPlanId: string
  plans: AiComposedPlan[]
  verificationRequired: true
}

export type AiItineraryValidation = {
  valid: boolean
  errors: string[]
}

const MAX_RESPONSE_CHARACTERS = 4096
const MAX_SELECTED_PLANS = 3
const MAX_REASON_CODES_PER_PLAN = 7
const MAX_IDENTIFIER_CHARACTERS = 120

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function unexpectedKeys(value: Record<string, unknown>, allowed: string[], scope: string): string[] {
  const allowedKeys = new Set(allowed)
  return Object.keys(value)
    .filter((key) => !allowedKeys.has(key))
    .map((key) => `Unexpected response field "${key}" in ${scope}.`)
}

export function validateAiItineraryComposition(
  request: AiItineraryRequest,
  composition: unknown,
): AiItineraryValidation {
  const errors: string[] = []
  let serialized = ''
  try {
    serialized = JSON.stringify(composition) ?? ''
  } catch {
    errors.push('Response could not be serialized.')
  }
  if (serialized.length > MAX_RESPONSE_CHARACTERS) {
    errors.push(`Response exceeds the ${MAX_RESPONSE_CHARACTERS}-character size limit.`)
  }
  if (!isRecord(composition)) {
    errors.push('Response must be a JSON object.')
    return { valid: false, errors }
  }

  errors.push(...unexpectedKeys(
    composition,
    ['schemaVersion', 'providerMode', 'primaryPlanId', 'plans', 'verificationRequired'],
    'composition',
  ))
  if (composition.schemaVersion !== 1) {
    errors.push('schemaVersion must equal 1.')
  }
  if (!['mock', 'hosted', 'fallback'].includes(String(composition.providerMode))) {
    errors.push('providerMode is invalid.')
  }
  if (composition.verificationRequired !== true) {
    errors.push('verificationRequired must equal true.')
  }
  if (typeof composition.primaryPlanId !== 'string' || composition.primaryPlanId.length === 0) {
    errors.push('primaryPlanId must be a non-empty string.')
  } else if (composition.primaryPlanId.length > MAX_IDENTIFIER_CHARACTERS) {
    errors.push('primaryPlanId exceeds the identifier length limit.')
  }
  if (!Array.isArray(composition.plans)) {
    errors.push('plans must be an array.')
    return { valid: false, errors }
  }
  if (composition.plans.length === 0) {
    errors.push('Response must contain at least one plan.')
  }
  if (composition.plans.length > MAX_SELECTED_PLANS) {
    errors.push(`Response may contain at most ${MAX_SELECTED_PLANS} plans.`)
  }
  if (composition.plans.length > request.candidates.length) {
    errors.push('Response contains more plans than the supplied candidates.')
  }

  const candidates = new Map(request.candidates.map((candidate) => [candidate.planId, candidate]))
  const selectedPlanIds = new Set<string>()
  const selectedVenueIds = new Set<string>()

  for (const [index, value] of composition.plans.entries()) {
    if (!isRecord(value)) {
      errors.push(`Plan selection ${index + 1} must be an object.`)
      continue
    }
    errors.push(...unexpectedKeys(value, ['planId', 'venueId', 'reasonCodes'], `plan selection ${index + 1}`))

    const planId = typeof value.planId === 'string' ? value.planId : ''
    if (!planId) {
      errors.push(`Plan selection ${index + 1} requires a planId.`)
    } else if (planId.length > MAX_IDENTIFIER_CHARACTERS) {
      errors.push(`Plan ID ${index + 1} exceeds the identifier length limit.`)
    }
    if (selectedPlanIds.has(planId)) {
      errors.push(`Duplicate plan ID: ${planId}.`)
    }
    selectedPlanIds.add(planId)

    const candidate = candidates.get(planId)
    if (!candidate) {
      errors.push(`Unknown plan ID: ${planId || '(empty)'}.`)
    } else {
      if (!candidate.areaMatch) errors.push(`Plan ${planId} fails area eligibility.`)
      if (!candidate.budgetFits) errors.push(`Plan ${planId} fails budget eligibility.`)
      if (!candidate.safetyEligible) errors.push(`Plan ${planId} fails safety eligibility.`)
    }

    if (!Array.isArray(value.reasonCodes)) {
      errors.push(`Plan ${planId || index + 1} requires a reasonCodes array.`)
    } else {
      if (value.reasonCodes.length > MAX_REASON_CODES_PER_PLAN) {
        errors.push(`Plan ${planId || index + 1} exceeds the reason-code limit.`)
      }
      const seenReasonCodes = new Set<string>()
      for (const reasonCode of value.reasonCodes) {
        if (typeof reasonCode !== 'string' || !isAiReasonCode(reasonCode)) {
          errors.push(`Unknown reason code: ${String(reasonCode)}.`)
          continue
        }
        if (seenReasonCodes.has(reasonCode)) {
          errors.push(`Duplicate reason code: ${reasonCode}.`)
        }
        seenReasonCodes.add(reasonCode)
        if (candidate && !candidate.reasonCodes.includes(reasonCode)) {
          errors.push(`Reason code ${reasonCode} is not approved for plan ${planId}.`)
        }
      }
    }

    if (value.venueId !== undefined) {
      if (typeof value.venueId !== 'string' || value.venueId.length === 0) {
        errors.push(`Venue ID for plan ${planId || index + 1} must be a non-empty string.`)
      } else {
        const venueId = value.venueId
        if (venueId.length > MAX_IDENTIFIER_CHARACTERS) {
          errors.push(`Venue ID ${venueId} exceeds the identifier length limit.`)
        }
        if (selectedVenueIds.has(venueId)) {
          errors.push(`Duplicate venue ID: ${venueId}.`)
        }
        selectedVenueIds.add(venueId)
        const venue = candidate?.venueOptions.find((option) => option.venueId === venueId)
        if (!venue) {
          errors.push(`Unknown venue ID: ${venueId}.`)
        } else {
          if (!venue.areaMatch) errors.push(`Venue ${venueId} fails area compatibility.`)
          if (!venue.categoryMatch) errors.push(`Venue ${venueId} fails category compatibility.`)
          if (!venue.available) errors.push(`Venue ${venueId} is unavailable.`)
        }
      }
    }
  }

  if (typeof composition.primaryPlanId === 'string' && !selectedPlanIds.has(composition.primaryPlanId)) {
    errors.push('Primary plan must appear in the returned plan list.')
  }

  return { valid: errors.length === 0, errors }
}

export interface ItineraryComposer {
  compose(request: AiItineraryRequest): Promise<unknown>
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

export function reasonCodesToCopy(reasonCodes: AiReasonCode[]): string {
  return reasonCodes.slice(0, 3).map((code) => reasonCodeCopy[code]).join(' ') || 'Approved LumaDate candidate.'
}

function fallbackComposition(request: AiItineraryRequest): AiItineraryComposition {
  const plans = request.candidates.slice(0, MAX_SELECTED_PLANS).map((candidate) => ({
    planId: candidate.planId,
    venueId: candidate.venueOptions.find((venue) => venue.areaMatch && venue.categoryMatch && venue.available)?.venueId,
    reasonCodes: [...candidate.reasonCodes].slice(0, MAX_REASON_CODES_PER_PLAN),
  }))

  return {
    schemaVersion: 1,
    providerMode: 'fallback',
    primaryPlanId: plans[0]?.planId ?? '',
    plans,
    verificationRequired: true,
  }
}

export async function composeAiItinerarySafely(
  request: AiItineraryRequest,
  composer: ItineraryComposer,
  options: { timeoutMs?: number } = {},
): Promise<AiItineraryComposition> {
  const timeoutMs = Math.max(1, options.timeoutMs ?? 2000)
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  try {
    const composition = await Promise.race([
      composer.compose(request),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Composer timed out.')), timeoutMs)
      }),
    ])
    return validateAiItineraryComposition(request, composition).valid
      ? composition as AiItineraryComposition
      : fallbackComposition(request)
  } catch {
    return fallbackComposition(request)
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
  }
}

export const mockItineraryComposer = {
  async compose(request: AiItineraryRequest): Promise<AiItineraryComposition> {
    const plans = request.candidates
      .filter((candidate) => candidate.areaMatch && candidate.budgetFits && candidate.safetyEligible)
      .slice(0, MAX_SELECTED_PLANS)
      .map((candidate) => ({
        planId: candidate.planId,
        venueId: candidate.venueOptions.find((venue) => venue.areaMatch && venue.categoryMatch && venue.available)?.venueId,
        reasonCodes: [...candidate.reasonCodes].slice(0, MAX_REASON_CODES_PER_PLAN),
      }))

    return {
      schemaVersion: 1,
      providerMode: 'mock',
      primaryPlanId: plans[0]?.planId ?? '',
      plans,
      verificationRequired: true,
    }
  },
} satisfies ItineraryComposer

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
