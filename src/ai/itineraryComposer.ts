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
  reasons?: string[]
  warnings?: string[]
  areaMatch: boolean
  budgetFits: boolean
  safetyEligible: boolean
  venueOptions: AiVenueOption[]
  reasonCodes: string[]
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

export type AiProviderMode = 'mock' | 'hosted'

export type AiItineraryComposition = {
  schemaVersion: 1
  providerMode: AiProviderMode | 'fallback'
  primaryPlanId: string
  plans: AiComposedPlan[]
  verificationRequired: true
}

type AiItineraryComposerOutput = Omit<AiItineraryComposition, 'providerMode'>

export type AiItineraryValidation = {
  valid: boolean
  errors: string[]
}

const MAX_RESPONSE_CHARACTERS = 4096
const MAX_REQUEST_CHARACTERS = 16_384
const MAX_REQUEST_STRING_CHARACTERS = 120
const MAX_REQUEST_ARRAY_ITEMS = 16
const MAX_REQUEST_OBJECT_KEYS = 17
const MAX_REQUEST_DEPTH = 4
const MAX_SELECTED_PLANS = 3
const MAX_VENUE_OPTIONS_PER_PLAN = 8
const MAX_REASON_CODES_PER_PLAN = 7
const MAX_IDENTIFIER_CHARACTERS = 120
const MAX_TAGGING_INPUT_CHARACTERS = 2000
const MAX_RESPONSE_ARRAY_ITEMS = 16
const MAX_RESPONSE_OBJECT_KEYS = 8
const MAX_RESPONSE_DEPTH = 4
const identifierPattern = /^[a-z0-9][a-z0-9-]{0,79}$/

const allowedDateAreas = new Set([
  'Portland',
  'SE Portland',
  'NE Portland',
  'NW Portland',
  'Downtown Portland',
  'Pearl District',
  'Alberta Arts District',
  'Mississippi / Williams',
  'Sellwood / Moreland',
])
const allowedDateStages = new Set(['first_date', 'early_dating', 'established', 'anniversary', 'friend_date'])
const allowedEndModes = new Set(['fixed_end', 'flexible', 'open_ended'])
const allowedFoodPreferences = new Set(['yes', 'maybe', 'no'])
const allowedAlcoholPreferences = new Set(['alcohol_ok', 'no_alcohol', 'mocktail_friendly', 'avoid_bars'])
const allowedIndoorOutdoorPreferences = new Set(['indoor', 'outdoor', 'either', 'weather_safe'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function allowlistedValue(value: unknown, allowed: Set<string>, fallback: string): string {
  return typeof value === 'string' && allowed.has(value) ? value : fallback
}

function boundedNumber(value: unknown, minimum: number, maximum: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(maximum, Math.max(minimum, Math.round(value)))
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && identifierPattern.test(value)
}

function unexpectedKeys(value: Record<string, unknown>, allowed: string[], scope: string): string[] {
  const allowedKeys = new Set(allowed)
  return Object.keys(value)
    .filter((key) => !allowedKeys.has(key))
    .map((key) => `Unexpected response field "${key}" in ${scope}.`)
}

function snapshotBoundedResponse(
  value: unknown,
  path = '$',
  depth = 0,
  ancestors = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.length > MAX_RESPONSE_CHARACTERS) throw new Error(`${path} exceeds the size limit.`)
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} must be a finite JSON number.`)
    return value
  }
  if (typeof value !== 'object') throw new Error(`${path} must contain plain JSON data.`)
  if (depth > MAX_RESPONSE_DEPTH) throw new Error(`${path} exceeds the nesting size limit.`)
  if (ancestors.has(value)) throw new Error(`${path} contains a circular reference.`)

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) throw new Error(`${path} must be a plain JSON array.`)
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
      const length = lengthDescriptor && 'value' in lengthDescriptor ? lengthDescriptor.value : undefined
      if (typeof length !== 'number' || length > MAX_RESPONSE_ARRAY_ITEMS) {
        throw new Error(`${path} exceeds the array size limit.`)
      }
      const keys = Reflect.ownKeys(value)
      if (keys.some((key) => typeof key !== 'string') || keys.length !== length + 1) {
        throw new Error(`${path} must be a dense plain JSON array.`)
      }
      const snapshot: unknown[] = []
      for (let index = 0; index < length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
          throw new Error(`${path}[${index}] must be a plain data property.`)
        }
        snapshot.push(snapshotBoundedResponse(descriptor.value, `${path}[${index}]`, depth + 1, ancestors))
      }
      return Object.freeze(snapshot)
    }

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) throw new Error(`${path} must be a plain JSON object.`)
    const keys = Reflect.ownKeys(value)
    if (keys.length > MAX_RESPONSE_OBJECT_KEYS) throw new Error(`${path} exceeds the object size limit.`)
    if (keys.some((key) => typeof key !== 'string')) throw new Error(`${path} cannot contain symbol keys.`)

    const snapshot = Object.create(null) as Record<string, unknown>
    for (const key of keys as string[]) {
      if (key.length > MAX_IDENTIFIER_CHARACTERS) throw new Error(`${path} contains an oversized field name.`)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        throw new Error(`${path}.${key} must be a plain data property.`)
      }
      snapshot[key] = snapshotBoundedResponse(descriptor.value, `${path}.${key}`, depth + 1, ancestors)
    }
    return Object.freeze(snapshot)
  } finally {
    ancestors.delete(value)
  }
}

function snapshotBoundedRequest(
  value: unknown,
  path = '$',
  depth = 0,
  ancestors = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.length > MAX_REQUEST_STRING_CHARACTERS) throw new Error(`${path} exceeds the request string limit.`)
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} must be a finite JSON number.`)
    return value
  }
  if (typeof value !== 'object') throw new Error(`${path} must contain plain JSON data.`)
  if (depth > MAX_REQUEST_DEPTH) throw new Error(`${path} exceeds the request nesting limit.`)
  if (ancestors.has(value)) throw new Error(`${path} contains a circular reference.`)

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) throw new Error(`${path} must be a plain JSON array.`)
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
      const length = lengthDescriptor && 'value' in lengthDescriptor ? lengthDescriptor.value : undefined
      if (typeof length !== 'number' || length > MAX_REQUEST_ARRAY_ITEMS) {
        throw new Error(`${path} exceeds the request array limit.`)
      }
      const keys = Reflect.ownKeys(value)
      if (keys.some((key) => typeof key !== 'string') || keys.length !== length + 1) {
        throw new Error(`${path} must be a dense plain JSON array.`)
      }
      const snapshot: unknown[] = []
      for (let index = 0; index < length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
          throw new Error(`${path}[${index}] must be a plain data property.`)
        }
        snapshot.push(snapshotBoundedRequest(descriptor.value, `${path}[${index}]`, depth + 1, ancestors))
      }
      return Object.freeze(snapshot)
    }

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) throw new Error(`${path} must be a plain JSON object.`)
    const keys = Reflect.ownKeys(value)
    if (keys.length > MAX_REQUEST_OBJECT_KEYS) throw new Error(`${path} exceeds the request object-key limit.`)
    if (keys.some((key) => typeof key !== 'string')) throw new Error(`${path} cannot contain symbol keys.`)

    const snapshot = Object.create(null) as Record<string, unknown>
    for (const key of keys as string[]) {
      if (key.length > MAX_IDENTIFIER_CHARACTERS) throw new Error(`${path} contains an oversized field name.`)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        throw new Error(`${path}.${key} must be a plain data property.`)
      }
      snapshot[key] = snapshotBoundedRequest(descriptor.value, `${path}.${key}`, depth + 1, ancestors)
    }
    return Object.freeze(snapshot)
  } finally {
    ancestors.delete(value)
  }
}

function createCompositionSnapshot(composition: unknown): {
  composition?: Record<string, unknown>
  errors: string[]
} {
  try {
    const snapshot = snapshotBoundedResponse(composition)
    if (!isRecord(snapshot)) return { errors: ['Response must be a JSON object.'] }
    const serialized = JSON.stringify(snapshot)
    if (serialized.length > MAX_RESPONSE_CHARACTERS) {
      return { errors: [`Response exceeds the ${MAX_RESPONSE_CHARACTERS}-character size limit.`] }
    }
    return { composition: snapshot, errors: [] }
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : 'Response must be bounded plain JSON data.'] }
  }
}

function validateCompositionSnapshot(
  request: AiItineraryRequest,
  composition: Record<string, unknown>,
): AiItineraryValidation {
  const errors: string[] = []

  errors.push(...unexpectedKeys(
    composition,
    ['schemaVersion', 'primaryPlanId', 'plans', 'verificationRequired'],
    'composition',
  ))
  if (composition.schemaVersion !== 1) {
    errors.push('schemaVersion must equal 1.')
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
          errors.push(typeof reasonCode === 'string'
            ? `Unknown reason code: ${reasonCode}.`
            : 'Reason codes must contain strings only.')
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
  const authoritativePrimary = request.candidates.find((candidate) => (
    candidate.areaMatch && candidate.budgetFits && candidate.safetyEligible
  ))
  if (authoritativePrimary && composition.primaryPlanId !== authoritativePrimary.planId) {
    errors.push('Primary plan must preserve LumaDate\'s authoritative first eligible plan.')
  }

  return { valid: errors.length === 0, errors }
}

export function validateAiItineraryComposition(
  request: AiItineraryRequest,
  composition: unknown,
): AiItineraryValidation {
  const snapshot = createCompositionSnapshot(composition)
  if (!snapshot.composition) return { valid: false, errors: snapshot.errors }
  return validateCompositionSnapshot(request, snapshot.composition)
}

export interface ItineraryComposer {
  compose(request: AiItineraryRequest, context: { signal: AbortSignal }): Promise<unknown>
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

function emptyFallbackComposition(): AiItineraryComposition {
  return {
    schemaVersion: 1,
    providerMode: 'fallback',
    primaryPlanId: '',
    plans: [],
    verificationRequired: true,
  }
}

function fallbackComposition(request: AiItineraryRequest): AiItineraryComposition {
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
    providerMode: 'fallback',
    primaryPlanId: plans[0]?.planId ?? '',
    plans,
    verificationRequired: true,
  }
}

export async function composeAiItinerarySafely(
  request: AiItineraryRequest,
  composer: ItineraryComposer,
  options: { trustedMode: AiProviderMode; timeoutMs?: number; signal?: AbortSignal },
): Promise<AiItineraryComposition> {
  const abortController = new AbortController()
  const relayCallerAbort = () => abortController.abort()
  let authoritativeRequest: AiItineraryRequest | undefined
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  try {
    authoritativeRequest = createRequestSnapshot(request)
    if (!authoritativeRequest) return emptyFallbackComposition()
    if (options.signal?.aborted) return fallbackComposition(authoritativeRequest)
    const timeoutMs = Math.max(1, options.timeoutMs ?? 2000)
    if (options.signal?.aborted) abortController.abort()
    else options.signal?.addEventListener('abort', relayCallerAbort, { once: true })

    const composition = await Promise.race([
      composer.compose(authoritativeRequest, { signal: abortController.signal }),
      new Promise<never>((_resolve, reject) => {
        if (abortController.signal.aborted) {
          reject(new Error('Composer cancelled.'))
          return
        }
        abortController.signal.addEventListener(
          'abort',
          () => reject(new Error('Composer cancelled.')),
          { once: true },
        )
      }),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          abortController.abort()
          reject(new Error('Composer timed out.'))
        }, timeoutMs)
      }),
    ])
    if (options.signal?.aborted || abortController.signal.aborted) return fallbackComposition(authoritativeRequest)
    const snapshot = createCompositionSnapshot(composition)
    if (!snapshot.composition || !validateCompositionSnapshot(authoritativeRequest, snapshot.composition).valid) {
      return fallbackComposition(authoritativeRequest)
    }
    return Object.freeze({
      ...snapshot.composition,
      providerMode: options.trustedMode,
    }) as AiItineraryComposition
  } catch {
    return authoritativeRequest ? fallbackComposition(authoritativeRequest) : emptyFallbackComposition()
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
    options.signal?.removeEventListener('abort', relayCallerAbort)
  }
}

export const mockItineraryComposer = {
  async compose(request: AiItineraryRequest): Promise<AiItineraryComposerOutput> {
    const plans = request.candidates
      .filter((candidate) => candidate.areaMatch && candidate.budgetFits && candidate.safetyEligible)
      .slice(0, MAX_SELECTED_PLANS)
      .map((candidate) => {
        const venueId = candidate.venueOptions
          .find((venue) => venue.areaMatch && venue.categoryMatch && venue.available)?.venueId
        return {
          planId: candidate.planId,
          ...(venueId ? { venueId } : {}),
          reasonCodes: [...candidate.reasonCodes].slice(0, MAX_REASON_CODES_PER_PLAN),
        }
      })

    return {
      schemaVersion: 1,
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

const approvedInterestTags = new Set(interestTagRules.map(([tag]) => tag))
const approvedCuisineTags = new Set(cuisineTagRules.map(([tag]) => tag))
const approvedDietaryTags = new Set(dietaryTagRules.map(([tag]) => tag))
const approvedAvoidTags = new Set(avoidTagRules.map(([tag]) => tag))

function hasExactOwnKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  const keys = Object.keys(value)
  return keys.length === allowedKeys.length && allowedKeys.every((key) => Object.hasOwn(value, key))
}

function isBoundedInteger(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum
}

function isUniqueAllowedStringArray(value: unknown, allowedValues: Set<string>, maximumItems = 16): value is string[] {
  if (!Array.isArray(value) || value.length > maximumItems) return false
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string' || !allowedValues.has(item) || seen.has(item)) return false
    seen.add(item)
  }
  return true
}

function isValidRequestSnapshot(value: unknown): value is AiItineraryRequest {
  if (!isRecord(value) || !hasExactOwnKeys(value, ['schemaVersion', 'preferences', 'candidates'])) return false
  if (value.schemaVersion !== 1 || !isRecord(value.preferences) || !Array.isArray(value.candidates)) return false

  const preferences = value.preferences
  if (!hasExactOwnKeys(preferences, [
    'dateArea',
    'dateStage',
    'endMode',
    'budgetMax',
    'foodWanted',
    'alcoholPreference',
    'indoorOutdoor',
    'energyLevel',
    'romanceLevel',
    'crowdComfort',
    'firstDateSafeMode',
    'activityTags',
    'moodTags',
    'interestTags',
    'cuisineTags',
    'dietaryTags',
    'avoidTags',
  ])) return false
  if (
    typeof preferences.dateArea !== 'string' || !allowedDateAreas.has(preferences.dateArea)
    || typeof preferences.dateStage !== 'string' || !allowedDateStages.has(preferences.dateStage)
    || typeof preferences.endMode !== 'string' || !allowedEndModes.has(preferences.endMode)
    || !isBoundedInteger(preferences.budgetMax, 0, 1000)
    || typeof preferences.foodWanted !== 'string' || !allowedFoodPreferences.has(preferences.foodWanted)
    || typeof preferences.alcoholPreference !== 'string'
    || !allowedAlcoholPreferences.has(preferences.alcoholPreference)
    || typeof preferences.indoorOutdoor !== 'string'
    || !allowedIndoorOutdoorPreferences.has(preferences.indoorOutdoor)
    || !isBoundedInteger(preferences.energyLevel, 1, 5)
    || !isBoundedInteger(preferences.romanceLevel, 1, 5)
    || !isBoundedInteger(preferences.crowdComfort, 1, 5)
    || typeof preferences.firstDateSafeMode !== 'boolean'
    || !isUniqueAllowedStringArray(preferences.activityTags, approvedActivityTags)
    || !isUniqueAllowedStringArray(preferences.moodTags, approvedMoodTags)
    || !isUniqueAllowedStringArray(preferences.interestTags, approvedInterestTags)
    || !isUniqueAllowedStringArray(preferences.cuisineTags, approvedCuisineTags)
    || !isUniqueAllowedStringArray(preferences.dietaryTags, approvedDietaryTags)
    || !isUniqueAllowedStringArray(preferences.avoidTags, approvedAvoidTags)
  ) return false

  if (value.candidates.length > MAX_SELECTED_PLANS) return false
  const seenPlanIds = new Set<string>()
  for (const candidate of value.candidates) {
    if (!isRecord(candidate) || !hasExactOwnKeys(candidate, [
      'planId',
      'estimatedCostHigh',
      'durationMinutes',
      'areaMatch',
      'budgetFits',
      'safetyEligible',
      'venueOptions',
      'reasonCodes',
    ])) return false
    if (
      !isIdentifier(candidate.planId)
      || seenPlanIds.has(candidate.planId)
      || !isBoundedInteger(candidate.estimatedCostHigh, 0, 1000)
      || !isBoundedInteger(candidate.durationMinutes, 1, 1440)
      || typeof candidate.areaMatch !== 'boolean'
      || typeof candidate.budgetFits !== 'boolean'
      || typeof candidate.safetyEligible !== 'boolean'
      || !Array.isArray(candidate.venueOptions)
      || candidate.venueOptions.length > MAX_VENUE_OPTIONS_PER_PLAN
      || !isUniqueAllowedStringArray(candidate.reasonCodes, allowedReasonCodes, MAX_REASON_CODES_PER_PLAN)
    ) return false
    seenPlanIds.add(candidate.planId)

    const seenVenueIds = new Set<string>()
    for (const venue of candidate.venueOptions) {
      if (
        !isRecord(venue)
        || !hasExactOwnKeys(venue, ['venueId', 'areaMatch', 'categoryMatch', 'available'])
        || !isIdentifier(venue.venueId)
        || seenVenueIds.has(venue.venueId)
        || venue.areaMatch !== true
        || venue.categoryMatch !== true
        || venue.available !== true
      ) return false
      seenVenueIds.add(venue.venueId)
    }
  }
  return true
}

function createRequestSnapshot(request: unknown): AiItineraryRequest | undefined {
  try {
    const snapshot = snapshotBoundedRequest(request)
    if (!isValidRequestSnapshot(snapshot)) return undefined
    if (JSON.stringify(snapshot).length > MAX_REQUEST_CHARACTERS) return undefined
    return snapshot
  } catch {
    return undefined
  }
}

function textForTagging(value: unknown): string {
  const bounded = typeof value === 'string' ? value.slice(0, MAX_TAGGING_INPUT_CHARACTERS) : ''
  return bounded
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

function approvedStructuredTags(values: unknown, catalog: Set<string>): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase().trim())
    .filter((value) => catalog.has(value)))]
    .slice(0, 16)
}

function safeCandidates(values: unknown): AiItineraryCandidate[] {
  if (!Array.isArray(values)) return []
  const result: AiItineraryCandidate[] = []
  const seenPlanIds = new Set<string>()

  for (const value of values.slice(0, MAX_SELECTED_PLANS)) {
    if (!isRecord(value) || !isIdentifier(value.planId) || seenPlanIds.has(value.planId)) continue
    if (
      typeof value.areaMatch !== 'boolean'
      || typeof value.budgetFits !== 'boolean'
      || typeof value.safetyEligible !== 'boolean'
      || typeof value.estimatedCostHigh !== 'number'
      || !Number.isFinite(value.estimatedCostHigh)
      || value.estimatedCostHigh < 0
      || value.estimatedCostHigh > 1000
      || typeof value.durationMinutes !== 'number'
      || !Number.isFinite(value.durationMinutes)
      || value.durationMinutes < 1
      || value.durationMinutes > 1440
      || !Array.isArray(value.venueOptions)
      || !Array.isArray(value.reasonCodes)
    ) continue

    const seenVenueIds = new Set<string>()
    const venueOptions: AiVenueOption[] = []
    for (const venue of value.venueOptions.slice(0, MAX_VENUE_OPTIONS_PER_PLAN)) {
      if (
        !isRecord(venue)
        || !isIdentifier(venue.venueId)
        || seenVenueIds.has(venue.venueId)
        || venue.areaMatch !== true
        || venue.categoryMatch !== true
        || venue.available !== true
      ) continue
      seenVenueIds.add(venue.venueId)
      venueOptions.push({
        venueId: venue.venueId,
        areaMatch: true,
        categoryMatch: true,
        available: true,
      })
    }

    seenPlanIds.add(value.planId)
    result.push({
      planId: value.planId,
      estimatedCostHigh: Math.round(value.estimatedCostHigh),
      durationMinutes: Math.round(value.durationMinutes),
      areaMatch: value.areaMatch,
      budgetFits: value.budgetFits,
      safetyEligible: value.safetyEligible,
      venueOptions,
      reasonCodes: [...new Set(value.reasonCodes
        .filter((reasonCode): reasonCode is AiReasonCode => typeof reasonCode === 'string' && isAiReasonCode(reasonCode)))]
        .slice(0, MAX_REASON_CODES_PER_PLAN),
    })
  }

  return result
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
      dateArea: allowlistedValue(intake.dateArea, allowedDateAreas, 'Portland'),
      dateStage: allowlistedValue(intake.dateStage, allowedDateStages, 'first_date'),
      endMode: allowlistedValue(intake.endMode, allowedEndModes, 'flexible'),
      budgetMax: boundedNumber(intake.budgetMax, 0, 1000, 120),
      foodWanted: allowlistedValue(intake.foodWanted, allowedFoodPreferences, 'maybe'),
      alcoholPreference: allowlistedValue(intake.alcoholPreference, allowedAlcoholPreferences, 'no_alcohol'),
      indoorOutdoor: allowlistedValue(intake.indoorOutdoor, allowedIndoorOutdoorPreferences, 'either'),
      energyLevel: boundedNumber(intake.energyLevel, 1, 5, 3),
      romanceLevel: boundedNumber(intake.romanceLevel, 1, 5, 3),
      crowdComfort: boundedNumber(intake.crowdComfort, 1, 5, 3),
      firstDateSafeMode: intake.firstDateSafeMode === true,
      activityTags: approvedStructuredTags(intake.activityTypes, approvedActivityTags),
      moodTags: approvedStructuredTags(intake.moodTypes, approvedMoodTags),
      interestTags: approvedTags(`${intake.dateEnjoysText} ${intake.userEnjoysText}`, interestTagRules),
      cuisineTags: approvedTags(intake.cuisineLikes, cuisineTagRules),
      dietaryTags: approvedTags(intake.dietaryLimits, dietaryTagRules),
      avoidTags: approvedTags(intake.mustAvoid, avoidTagRules),
    },
    candidates: safeCandidates(candidates),
  }
}
