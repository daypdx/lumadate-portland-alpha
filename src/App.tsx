import { useEffect, useMemo, useRef, useState } from 'react'
import plansJson from './data/datePlans.json'
import lumaDateEmblem from './assets/lumadate-emblem.png'
import { buildMockStopSignals, mockWeatherAtArrival } from './lib/mockItinerarySignals'
import './App.css'

type MeetingMode = 'near_me' | 'near_them' | 'fair_midpoint' | 'neutral_public'
type EndMode = 'fixed_end' | 'flexible' | 'open_ended'
type DateStage = 'first_date' | 'early_dating' | 'established' | 'anniversary' | 'friend_date'
type MeetupStyle = 'meeting_there' | 'i_pick_up' | 'they_pick_up' | 'fair_midpoint' | 'neutral_public'
type BookingType = 'free' | 'walk_in' | 'reservation' | 'ticketed' | 'unknown'
type ProviderMode = 'external_link' | 'call' | 'copy' | 'mock_checkout' | 'mock_reservation'
type Tab = 'plan' | 'options' | 'itinerary' | 'adjust' | 'alerts' | 'safety'
type Sheet = 'booking' | 'reminders' | 'late' | 'safety' | 'invite' | 'saved' | 'assistant' | 'exit' | null
type PlanState = 'Draft' | 'Proposed' | 'Agreed' | 'Booked externally' | 'Tonight' | 'Completed'

type ProviderAction = {
  type: string
  label: string
  url?: string
  phone?: string
  mode: ProviderMode
}

type PlanStep = {
  timeOffsetMinutes: number
  title: string
  description: string
  canReplace: boolean
  placeIndex?: number
}

type Place = {
  name: string
  category: string
  neighborhood: string
  priceLevel: string
  ratingSummary: string
  mapsLink: string
  reviewLink: string
  why: string
  warning?: string
}

export type DatePlan = {
  id: string
  title: string
  shortPitch: string
  neighborhoods: string[]
  city: string
  estimatedCostTotal: number
  estimatedCostLevel: 0 | 1 | 2 | 3 | 4
  estimatedDurationMinutes: number
  bookingType: BookingType
  tags: string[]
  interestKeywords: string[]
  safetyProfile: {
    publicPlace: boolean
    goodForFirstDate: boolean
    alcoholCentric: boolean
    indoor: boolean
    outdoor: boolean
  }
  itinerary: PlanStep[]
  backupOptions: string[]
  providers: ProviderAction[]
  places?: Place[]
  safetyNotes: string[]
}

export type Intake = {
  dateStage: DateStage
  startLocation: string
  startLocationPrivate: boolean
  dateArea: string
  meetingMode: MeetingMode
  meetupStyle: MeetupStyle
  dateStart: string
  endMode: EndMode
  dateEnd: string
  travelRadius: number
  transportMode: string
  budgetMode: 'total' | 'per_person'
  budgetMax: number
  foodWanted: 'yes' | 'maybe' | 'no'
  cuisineLikes: string
  dietaryLimits: string
  alcoholPreference: 'alcohol_ok' | 'no_alcohol' | 'mocktail_friendly' | 'avoid_bars'
  activityTypes: string[]
  indoorOutdoor: 'indoor' | 'outdoor' | 'either' | 'weather_safe'
  moodTypes: string[]
  energyLevel: number
  romanceLevel: number
  crowdComfort: number
  dateEnjoysText: string
  userEnjoysText: string
  firstDateSafeMode: boolean
  safetyShareEnabled: boolean
  mustAvoid: string
}

export type RankedPlan = {
  plan: DatePlan
  score: number
  reasons: string[]
  warnings: string[]
  meetArea: string
  trafficNote: string
  leaveBy: string
  crowdForecast: string
  crowdBackup: string
}

type ReminderSettings = {
  dayBefore: boolean
  twoHours: boolean
  leaveTime: boolean
  runningLate: boolean
  safetyCheck: boolean
}

type SavedItinerary = {
  id: string
  planId: string
  title: string
  meetArea: string
  savedAt: string
}

const plans = plansJson as DatePlan[]

const storageKeys = {
  intake: 'lumadate-intake',
  saved: 'lumadate-saved',
  reminders: 'lumadate-reminders',
}

export function createDefaultIntake(now = new Date()): Intake {
  const { dateStart, dateEnd } = dateWindow(now, now.getHours() >= 21 ? 1 : 0)

  return {
    dateStage: 'first_date',
    startLocation: 'Portland, OR',
    startLocationPrivate: true,
    dateArea: 'SE Portland',
    meetingMode: 'neutral_public',
    meetupStyle: 'neutral_public',
    dateStart,
    endMode: 'flexible',
    dateEnd,
    travelRadius: 10,
    transportMode: 'driving',
    budgetMode: 'total',
    budgetMax: 120,
    foodWanted: 'maybe',
    cuisineLikes: '',
    dietaryLimits: '',
    alcoholPreference: 'alcohol_ok',
    activityTypes: [],
    indoorOutdoor: 'either',
    moodTypes: [],
    energyLevel: 3,
    romanceLevel: 3,
    crowdComfort: 3,
    dateEnjoysText: '',
    userEnjoysText: '',
    firstDateSafeMode: true,
    safetyShareEnabled: true,
    mustAvoid: '',
  }
}

export function createExampleIntake(now = new Date()): Intake {
  return {
    ...createDefaultIntake(now),
    foodWanted: 'yes',
    cuisineLikes: 'Thai, pizza, coffee, dessert',
    alcoholPreference: 'mocktail_friendly',
    activityTypes: ['dinner', 'outdoors', 'scenic_walk', 'coffee', 'quiet_conversation'],
    indoorOutdoor: 'weather_safe',
    moodTypes: ['chill', 'quiet', 'romantic'],
    romanceLevel: 4,
    crowdComfort: 2,
    dateEnjoysText: 'They said they like parks, restaurants, coffee, and quiet places.',
    userEnjoysText: 'I like walkable Portland plans with good food and a relaxed park stop.',
    mustAvoid: 'long drives, crowded bars, long waits',
  }
}

const defaultIntake = createDefaultIntake()

const defaultReminders: ReminderSettings = {
  dayBefore: true,
  twoHours: true,
  leaveTime: true,
  runningLate: true,
  safetyCheck: true,
}

const planStates: PlanState[] = ['Draft', 'Proposed', 'Agreed', 'Booked externally', 'Tonight', 'Completed']

const moodOptions = ['chill', 'romantic', 'playful', 'adventurous', 'social', 'quiet']

const avoidOptions = ['loud bars', 'long waits', 'expensive places', 'long drives', 'crowded venues', 'outdoor weather risk']

const clueOptions = ['parks', 'restaurants', 'coffee', 'dessert', 'walkable', 'quiet corners', 'Thai food', 'pizza', 'mocktails', 'art', 'comedy', 'live music']

const budgetOptions = [
  {
    label: 'Keep it easy',
    value: 70,
    range: 'Up to $50-$70 total',
    description: 'Casual, thoughtful, low-pressure: coffee, dessert, casual bites.',
  },
  {
    label: 'Comfortable',
    value: 120,
    range: '$50-$120 total',
    description: 'Dinner or drinks plus a simple activity.',
  },
  {
    label: 'Treat night',
    value: 250,
    range: '$120-$250 total',
    description: 'Elevated spots, tickets, cocktails/mocktails, or a special moment.',
  },
] as const

const preferenceGroups = [
  {
    title: 'Food & drink',
    items: ['coffee', 'dinner', 'dessert', 'brunch', 'sushi', 'thai', 'pizza', 'mocktails', 'food_carts'],
  },
  {
    title: 'Music & entertainment',
    items: ['jazz', 'live_music', 'comedy', 'theater', 'movie', 'arcade_trivia'],
  },
  {
    title: 'Culture & activity',
    items: ['museum', 'gallery', 'bookstore', 'class', 'market'],
  },
  {
    title: 'Outdoors & movement',
    items: ['scenic_walk', 'park', 'river_walk', 'garden', 'viewpoint'],
  },
  {
    title: 'Date mood',
    items: ['quiet', 'lively', 'romantic', 'adventurous', 'photo_worthy', 'sober_friendly'],
  },
  {
    title: 'Low-key / comfort',
    items: ['quiet_conversation', 'cozy_cafe', 'low_crowd', 'short_date', 'easy_exit'],
  },
] as const

const datePresetOptions = [
  ['Tonight', 0],
  ['Tomorrow', 1],
  ['This weekend', 'weekend'],
] as const

const portlandAreaOptions = [
  'SE Portland',
  'NE Portland',
  'NW Portland',
  'Downtown Portland',
  'Pearl District',
  'Alberta Arts District',
  'Mississippi / Williams',
  'Sellwood / Moreland',
] as const

const durationOptions = [
  ['90 min', 'fixed_end', 90],
  ['2-3 hr', 'flexible', 180],
  ['Open-ended', 'open_ended', 0],
] as const

const inviteStarters = [
  'Want to try this Thursday?',
  'I found a low-key place near us. Want me to send details?',
  'Coffee or mini golf? I found a couple options.',
  'This looks like it fits what you mentioned. Want to make it the plan?',
]

const meetingLabels: Record<MeetingMode, string> = {
  near_me: 'Meet near me',
  near_them: 'Meet near them',
  fair_midpoint: 'Fair midpoint',
  neutral_public: 'Neutral public area',
}

const dateStageLabels: Record<DateStage, string> = {
  first_date: 'First date',
  early_dating: 'Early dating',
  established: 'Established couple',
  anniversary: 'Anniversary',
  friend_date: 'Friend date',
}

const meetupStyleLabels: Record<MeetupStyle, string> = {
  meeting_there: 'Meeting there',
  i_pick_up: "I'm picking them up",
  they_pick_up: "They're picking me up",
  fair_midpoint: 'Fair midpoint',
  neutral_public: 'Neutral public area',
}

const endModeLabels: Record<EndMode, string> = {
  fixed_end: 'fixed end',
  flexible: 'flexible',
  open_ended: 'open-ended',
}

const alcoholLabels: Record<Intake['alcoholPreference'], string> = {
  alcohol_ok: 'alcohol okay',
  no_alcohol: 'no alcohol',
  mocktail_friendly: 'mocktail-friendly',
  avoid_bars: 'avoid bars',
}

const foodWantedLabels: Record<Intake['foodWanted'], string> = {
  yes: 'Include food',
  maybe: 'Maybe snacks/drinks',
  no: 'Skip food',
}

const indoorOutdoorLabels: Record<Intake['indoorOutdoor'], string> = {
  indoor: 'indoor',
  outdoor: 'outdoor',
  either: 'either',
  weather_safe: 'weather-safe',
}

const bookingLabels: Record<BookingType, string> = {
  free: 'Free',
  walk_in: 'Walk-in / verify wait',
  reservation: 'Reservation handoff',
  ticketed: 'Ticket handoff',
  unknown: 'Verify availability',
}

const crowdLabels = [
  'Usually quiet',
  'Usually moderate',
  'Peak around 7 PM',
  'Busy on weekends',
  'Good backup if crowded',
]

const trafficLabels = [
  'Traffic looks normal',
  'Add 10 minutes for evening traffic',
  'Running late risk: medium',
  'Easy route from the meet area',
  'Leave earlier if parking matters',
]

const stopWords = new Set([
  'about',
  'also',
  'and',
  'are',
  'both',
  'date',
  'dates',
  'for',
  'good',
  'great',
  'have',
  'like',
  'likes',
  'place',
  'places',
  'said',
  'that',
  'the',
  'they',
  'this',
  'want',
  'with',
])

function parseStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function normalizeIntake(value: Intake): Intake {
  return { ...defaultIntake, ...value }
}

function intakeForStorage(value: Intake): Intake {
  return { ...value, startLocation: 'Portland, OR' }
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
  return [...new Set(words)]
}

function formatMoney(amount: number): string {
  return `$${amount}`
}

function formatCostRange(amount: number): string {
  const low = Math.max(20, Math.floor(amount / 10) * 10)
  const high = Math.ceil((amount * 1.5) / 10) * 10
  return `$${low}-$${high} example total`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const leftover = minutes % 60
  return leftover ? `${hours} hr ${leftover} min` : `${hours} hr`
}

function cleanLabel(value: string): string {
  return value.replace('_', ' ')
}

function formatPlanDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not set'
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function looksLikeStreetAddress(value: string): boolean {
  return /^\s*\d{1,6}\s+\S+/i.test(value.trim())
}

function placePreview(plan: DatePlan): string {
  return plan.places?.slice(0, 3).map((place) => place.name).join(' -> ') ?? plan.neighborhoods.join(' -> ')
}

function primaryAnchor(plan: DatePlan, fallback = 'Portland area'): string {
  return plan.places?.find((place) => /dinner|restaurant|market|food/i.test(place.category))?.name
    ?? plan.places?.[0]?.name
    ?? plan.neighborhoods[0]
    ?? fallback
}

function providerModeLabel(mode: ProviderMode): string {
  if (mode === 'external_link') return 'External provider - verify availability'
  if (mode === 'call') return 'User-initiated call link'
  if (mode === 'copy') return 'Copy details'
  if (mode === 'mock_checkout') return 'Demo checkout only'
  return 'Demo reservation only'
}

function summarizeDatePlan(intake: Intake): string {
  const area = intake.dateArea || intake.startLocation
  const interests = extractKeywords(`${intake.dateEnjoysText} ${intake.userEnjoysText}`).slice(0, 4)
  const interestText = interests.length ? ` with ${interests.join(', ')} interests` : ''
  return `You're planning a ${endModeLabels[intake.endMode]} ${dateStageLabels[intake.dateStage].toLowerCase()} near ${area}, ${alcoholLabels[intake.alcoholPreference]}, under ${formatMoney(intake.budgetMax)}${interestText}.`
}

function budgetSummary(intake: Intake): string {
  const preset = budgetOptions.find((option) => option.value === intake.budgetMax)
  const basis = intake.budgetMode === 'total' ? 'whole date' : 'per person'
  return `${preset?.label ?? 'Custom max'}: up to ${formatMoney(intake.budgetMax)} ${basis}. Private planning guide only.`
}

function fitLabel(ranked: RankedPlan, index: number): string {
  if (index === 0) return 'Best fit'
  if (ranked.plan.estimatedCostTotal <= 75) return 'Budget-friendly backup'
  if (ranked.plan.tags.some((tag) => /quiet|coffee|walk|park/i.test(tag))) return 'Low-key backup'
  if (ranked.plan.tags.some((tag) => /comedy|music|social/i.test(tag))) return 'Social option'
  return 'Alternate plan'
}

function offsetTime(start: string, offsetMinutes: number): string {
  const date = new Date(start)
  date.setMinutes(date.getMinutes() + offsetMinutes)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

type DatePresetValue = (typeof datePresetOptions)[number][1]

function resolveDatePresetOffset(value: DatePresetValue, now: Date): number {
  if (value !== 'weekend') return value
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7
  return daysUntilSaturday === 0 ? 0 : daysUntilSaturday
}

export function dateWindow(now: Date, preset: DatePresetValue): { dateStart: string; dateEnd: string } {
  const daysFromToday = resolveDatePresetOffset(preset, now)
  const start = new Date(now)
  start.setDate(start.getDate() + daysFromToday)
  start.setHours(18, 30, 0, 0)

  if (daysFromToday === 0 && start.getTime() <= now.getTime()) {
    start.setTime(now.getTime() + 45 * 60_000)
    start.setSeconds(0, 0)
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15)
  }

  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 180)
  return { dateStart: toDateTimeLocal(start), dateEnd: toDateTimeLocal(end) }
}

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function inferDatePreset(dateStart: string, now = new Date()): string | null {
  const selected = new Date(dateStart)
  if (Number.isNaN(selected.getTime())) return null
  const match = datePresetOptions.find(([, preset]) => {
    const candidate = new Date(dateWindow(now, preset).dateStart)
    return dateKey(candidate) === dateKey(selected)
  })
  return match?.[0] ?? null
}

function leaveByTime(start: string): string {
  const date = new Date(start)
  date.setMinutes(date.getMinutes() - 25)
  return `Leave by ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

function dressWeatherNote(ranked: RankedPlan): string {
  if (ranked.plan.safetyProfile.outdoor) return 'Comfortable shoes and a light layer.'
  if (ranked.plan.bookingType === 'reservation') return 'Smart casual works. Build in a few minutes for check-in.'
  if (ranked.plan.bookingType === 'ticketed') return 'Bring ID and arrive early enough for entry.'
  return 'Keep it casual and weather-safe.'
}

export function meetAreaFor(intake: Intake, plan: DatePlan): string {
  const publicArea = plan.neighborhoods[0] ?? (intake.dateArea || 'Portland public area')
  if (intake.meetingMode === 'fair_midpoint') return `Public midpoint in ${publicArea}`
  if (intake.meetingMode === 'neutral_public') return `${publicArea} public meet point`
  return `Public meet point in ${publicArea}`
}

function planMatchesAlcohol(intake: Intake, plan: DatePlan): boolean {
  if (intake.alcoholPreference === 'alcohol_ok') return true
  return !plan.safetyProfile.alcoholCentric && !plan.tags.some((tag) => tag.includes('bar'))
}

export function rankPlans(intake: Intake): RankedPlan[] {
  const dateWords = extractKeywords(intake.dateEnjoysText)
  const userWords = extractKeywords(intake.userEnjoysText)
  const cuisineWords = extractKeywords(intake.cuisineLikes)
  const avoidWords = extractKeywords(intake.mustAvoid)
  const preferenceWords = [...intake.activityTypes, ...intake.moodTypes].flatMap((value) => extractKeywords(value))
  const areaWords = extractKeywords(intake.dateArea)
  const dietaryNeeds = intake.dietaryLimits.trim()

  return plans
    .map((plan, index) => {
      let score = 0
      const reasons: string[] = []
      const warnings: string[] = []
      const searchable = [
        ...plan.tags,
        ...plan.interestKeywords,
        ...plan.neighborhoods,
        plan.title,
        plan.shortPitch,
        ...(plan.places ?? []).flatMap((place) => [place.name, place.category, place.neighborhood, place.why]),
      ].join(' ').toLowerCase()
      const dateMatches = dateWords.filter((word) => searchable.includes(word))
      const userMatches = userWords.filter((word) => searchable.includes(word))
      const cuisineMatches = cuisineWords.filter((word) => searchable.includes(word))
      const avoidMatches = avoidWords.filter((word) => searchable.includes(word))
      const preferenceMatches = preferenceWords.filter((word) => searchable.includes(word))
      const areaMatches = areaWords.filter((word) => searchable.includes(word))
      const hasFood = /food|dinner|restaurant|sushi|coffee|dessert|mocktail|market/.test(searchable)
      const isQuiet = /quiet|low pressure|bookstore|coffee|park|walkable/.test(searchable)
      const isHighEnergy = /comedy|music|social|class|adventurous|tickets/.test(searchable)

      if (dateMatches.length) {
        score += Math.min(30, dateMatches.length * 8)
        reasons.push(`Matches what they enjoy: ${dateMatches.slice(0, 3).join(', ')}.`)
      }
      if (userMatches.length) {
        score += Math.min(20, userMatches.length * 5)
        reasons.push(`Also fits your taste: ${userMatches.slice(0, 3).join(', ')}.`)
      }
      if (cuisineMatches.length) {
        score += 10
        reasons.push(`Works with the food cues you entered: ${cuisineMatches.slice(0, 2).join(', ')}.`)
      }
      if (preferenceMatches.length) {
        score += Math.min(18, preferenceMatches.length * 4)
        reasons.push(`Matches your selected vibe: ${preferenceMatches.slice(0, 3).join(', ')}.`)
      }
      if (areaMatches.length) {
        score += 8
        reasons.push('Fits the Portland area you selected.')
      }
      if (plan.estimatedCostTotal <= intake.budgetMax) {
        score += 12
        reasons.push(`Fits your ${formatMoney(intake.budgetMax)} ${intake.budgetMode.replace('_', ' ')} budget.`)
      } else {
        score -= 20
        warnings.push(`Estimated ${formatMoney(plan.estimatedCostTotal)}, above your budget.`)
      }
      if (intake.endMode === 'open_ended' || plan.estimatedDurationMinutes <= 240) {
        score += 8
      }
      if ((intake.firstDateSafeMode || intake.dateStage === 'first_date') && plan.safetyProfile.goodForFirstDate) {
        score += 10
        reasons.push('Keeps the plan public and first-date safe.')
      }
      if (intake.indoorOutdoor === 'indoor' && !plan.safetyProfile.indoor) {
        score -= 18
        warnings.push('Outdoor plan conflicts with indoor preference.')
      }
      if (intake.indoorOutdoor === 'outdoor' && !plan.safetyProfile.outdoor) {
        score -= 10
      }
      if (!planMatchesAlcohol(intake, plan)) {
        score -= 25
        warnings.push('Alcohol preference needs a safer alternative.')
      }
      if (intake.foodWanted === 'yes' && hasFood) score += 8
      if (intake.foodWanted === 'no' && hasFood) {
        score -= 12
        warnings.push('Includes a food or drink stop even though food was marked unnecessary.')
      }
      if (dietaryNeeds && hasFood) {
        warnings.push(`Verify dietary needs directly with each venue: ${dietaryNeeds}.`)
      }
      if (intake.energyLevel <= 2 && isQuiet) score += 7
      if (intake.energyLevel <= 2 && isHighEnergy) score -= 7
      if (intake.energyLevel >= 4 && isHighEnergy) score += 7
      if (intake.romanceLevel >= 4 && /romantic|special|jazz|garden|scenic/.test(searchable)) score += 7
      if (intake.crowdComfort <= 2 && isQuiet) score += 6
      if (intake.crowdComfort <= 2 && /social|tickets|comedy|music/.test(searchable)) score -= 6
      if ((intake.transportMode === 'walking' || intake.transportMode === 'biking') && /walkable|walk|park/.test(searchable)) {
        score += 6
      }
      if (avoidMatches.length) {
        score -= 20
        warnings.push(`May conflict with avoid list: ${avoidMatches.slice(0, 2).join(', ')}.`)
      }
      if (plan.bookingType === 'reservation' || plan.bookingType === 'ticketed') {
        score += 8
        reasons.push('Has a clear booking or reservation handoff.')
      }
      if (plan.backupOptions.length) {
        score += 5
        reasons.push('Includes a backup if the main plan gets crowded.')
      }
      if (!dateMatches.length && !userMatches.length) {
        reasons.push('A practical backup that still fits the date window.')
      }

      return {
        plan,
        score,
        reasons: reasons.slice(0, 4),
        warnings,
        meetArea: meetAreaFor(intake, plan),
        trafficNote: trafficLabels[index % trafficLabels.length],
        leaveBy: leaveByTime(intake.dateStart),
        crowdForecast: crowdLabels[index % crowdLabels.length],
        crowdBackup: `Backup if crowded: ${plan.backupOptions[0] ?? 'nearby quiet cafe'}.`,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function App() {
  const [started, setStarted] = useState(false)
  const [experienceMode, setExperienceMode] = useState<'personal' | 'demo'>('personal')
  const [tab, setTab] = useState<Tab>('plan')
  const [wizardStep, setWizardStep] = useState(0)
  const [intake, setIntake] = useState<Intake>(() => normalizeIntake(parseStored(storageKeys.intake, defaultIntake)))
  const [activeId, setActiveId] = useState('portland-park-restaurant-walk')
  const [sheet, setSheet] = useState<Sheet>(null)
  const [lateMinutes, setLateMinutes] = useState(10)
  const [copied, setCopied] = useState('')
  const [adjustmentMessage, setAdjustmentMessage] = useState('')
  const [planState, setPlanState] = useState<PlanState>('Draft')
  const [inviteDraft, setInviteDraft] = useState(inviteStarters[1])
  const [reminders, setReminders] = useState<ReminderSettings>(() =>
    parseStored(storageKeys.reminders, defaultReminders),
  )
  const [saved, setSaved] = useState<SavedItinerary[]>(() => parseStored(storageKeys.saved, []))

  const rankedPlans = useMemo(() => rankPlans(intake), [intake])
  const active = rankedPlans.find((item) => item.plan.id === activeId) ?? rankedPlans[0]

  useEffect(() => {
    localStorage.setItem(storageKeys.intake, JSON.stringify(intakeForStorage(intake)))
  }, [intake])

  useEffect(() => {
    localStorage.setItem(storageKeys.reminders, JSON.stringify(reminders))
  }, [reminders])

  useEffect(() => {
    localStorage.setItem(storageKeys.saved, JSON.stringify(saved))
  }, [saved])

  useEffect(() => {
    if (!rankedPlans.some((item) => item.plan.id === activeId) && rankedPlans[0]) {
      setActiveId(rankedPlans[0].plan.id)
    }
  }, [activeId, rankedPlans])

  function updateIntake<K extends keyof Intake>(key: K, value: Intake[K]) {
    setIntake((current) => ({ ...current, [key]: value }))
  }

  function updateMeetupStyle(value: MeetupStyle) {
    const meetingMode: MeetingMode =
      value === 'fair_midpoint' ? 'fair_midpoint' : value === 'neutral_public' ? 'neutral_public' : 'near_me'
    setIntake((current) => ({ ...current, meetupStyle: value, meetingMode }))
  }

  function toggleActivity(value: string) {
    setIntake((current) => {
      const exists = current.activityTypes.includes(value)
      return {
        ...current,
        activityTypes: exists
          ? current.activityTypes.filter((item) => item !== value)
          : [...current.activityTypes, value],
      }
    })
  }

  function toggleMood(value: string) {
    setIntake((current) => {
      const exists = current.moodTypes.includes(value)
      return {
        ...current,
        moodTypes: exists ? current.moodTypes.filter((item) => item !== value) : [...current.moodTypes, value],
      }
    })
  }

  function toggleAvoid(value: string) {
    setIntake((current) => {
      const items = current.mustAvoid
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      const exists = items.some((item) => item.toLowerCase() === value.toLowerCase())
      const nextItems = exists ? items.filter((item) => item.toLowerCase() !== value.toLowerCase()) : [...items, value]
      return { ...current, mustAvoid: nextItems.join(', ') }
    })
  }

  async function copyText(label: string, text: string, selector?: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(label)
    } catch {
      const target = selector ? document.querySelector<HTMLTextAreaElement>(selector) : null
      if (target) {
        target.focus()
        target.select()
        showToast('Copy blocked by browser. Text selected for manual copy.')
      } else {
        showToast('Copy blocked by browser. Select the text and copy manually.')
      }
    }
  }

  function showToast(label: string) {
    setCopied(label)
    window.setTimeout(() => setCopied(''), 2600)
  }

  function saveActive() {
    const record: SavedItinerary = {
      id: `${active.plan.id}-${Date.now()}`,
      planId: active.plan.id,
      title: active.plan.title,
      meetArea: active.meetArea,
      savedAt: new Date().toISOString(),
    }
    setSaved((current) => [record, ...current.filter((item) => item.planId !== active.plan.id)])
    showToast('Plan saved')
  }

  function showItinerary() {
    setTab('options')
    showToast('Plans generated - pick one to inspect.')
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
  }

  function confirmPlan() {
    setTab('itinerary')
    showToast('Itinerary opened.')
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.querySelector<HTMLElement>('.itinerary')?.focus()
    }, 0)
  }

  function startDemo() {
    setSheet(null)
    setIntake(createExampleIntake())
    setExperienceMode('demo')
    setStarted(true)
    setTab('options')
    showToast('Clearly labeled example loaded.')
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
  }

  function clearDemoData() {
    localStorage.removeItem(storageKeys.intake)
    localStorage.removeItem(storageKeys.saved)
    localStorage.removeItem(storageKeys.reminders)
    setIntake(createDefaultIntake())
    setExperienceMode('personal')
    setSaved([])
    setReminders(defaultReminders)
    showToast('Planning data cleared')
  }

  if (!started) {
    return (
      <main className="welcome">
        <section className="welcome-panel">
          <div className="welcome-hero-preview" aria-hidden="true">
            <div className="route-map-card">
              <span className="map-pin map-pin-one">Meet</span>
              <span className="map-pin map-pin-two">Dinner</span>
              <span className="map-pin map-pin-three">Backup</span>
              <span className="route-line route-line-one" />
              <span className="route-line route-line-two" />
            </div>
            <div className="mini-itinerary-card card-one">
              <span>6:30 PM</span>
              <strong>Public meet point</strong>
              <small>Private address hidden</small>
            </div>
            <div className="mini-itinerary-card card-two">
              <span>8:15 PM</span>
              <strong>Live music nearby</strong>
              <small>Backup ready if crowded</small>
            </div>
          </div>
          <span className="alpha-badge">Portland controlled alpha</span>
          <div className="brand-lockup">
            <span className="brand-mark image-mark">
              <img src={lumaDateEmblem} alt="" />
            </span>
            <span>LumaDate</span>
          </div>
          <h1>Plan the date without overthinking it.</h1>
          <p>
            Not a dating app. No swiping, no profiles - just a thoughtful Portland plan for someone
            you are already meeting.
          </p>
          <div className="trust-row" aria-label="LumaDate trust promises">
            <span>No account or GPS</span>
            <span>Stored in this browser</span>
            <span>No bookings or payments</span>
          </div>
          <div className="welcome-actions">
            <button type="button" className="primary" onClick={() => {
              setSheet(null)
              setIntake(createDefaultIntake())
              setExperienceMode('personal')
              setStarted(true)
              setTab('plan')
              showToast('Planning flow opened.')
            }}>
              Build my Portland plan
            </button>
            <button type="button" className="secondary" onClick={startDemo}>
              Preview a clearly labeled demo
            </button>
          </div>
          <small>Use a city or neighborhood only. Private starting details are not retained or shared.</small>
          <AlphaFooter />
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-lockup">
            <span className="brand-mark image-mark">
              <img src={lumaDateEmblem} alt="" />
            </span>
            <span>LumaDate</span>
          </div>
          <span className="topbar-alpha">Portland controlled alpha</span>
          <p>Thoughtful date plans without the stress.</p>
        </div>
        <button type="button" className="ghost" onClick={() => saved.length ? setSheet('saved') : showToast('No saved plans yet.')}>
          Saved {saved.length}
        </button>
      </header>

      {experienceMode === 'demo' && (
        <div className="demo-profile-banner" role="status">
          <strong>Demo profile</strong>
          <span>These answers and results are examples, not your data.</span>
        </div>
      )}

      <section className="main-grid">
        <div className="planner-column">
          {tab === 'plan' && (
            <IntakeWizard
              intake={intake}
              onChange={updateIntake}
              onMeetupStyle={updateMeetupStyle}
              onToggleActivity={toggleActivity}
              onToggleMood={toggleMood}
              onToggleAvoid={toggleAvoid}
              onGenerate={showItinerary}
              onStepChange={setWizardStep}
            />
          )}

          {tab === 'options' && (
            <ResultsPanel
              rankedPlans={rankedPlans}
              activeId={active.plan.id}
              onSelect={(id) => setActiveId(id)}
              onConfirm={confirmPlan}
            />
          )}

          {tab === 'itinerary' && (
            <ItineraryPanel
              ranked={active}
              intake={intake}
              onOpenSheet={setSheet}
              onGoAdjust={() => {
                setTab('adjust')
                window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
              }}
              onCompare={() => {
                setTab('options')
                window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
              }}
              onSave={saveActive}
              planState={planState}
              onPlanState={setPlanState}
              inviteDraft={inviteDraft}
              adjustmentMessage={adjustmentMessage}
              copied={copied}
              onCopy={copyText}
            />
          )}

          {tab === 'adjust' && (
            <AdjustPanel
              ranked={active}
              rankedPlans={rankedPlans}
              message={adjustmentMessage}
              onAdjust={setAdjustmentMessage}
              onSelect={setActiveId}
              onGoItinerary={confirmPlan}
              onOpenLate={() => setSheet('late')}
              onOpenExit={() => setSheet('exit')}
            />
          )}

          {tab === 'alerts' && (
            <AlertsPanel
              ranked={active}
              reminders={reminders}
              onOpenReminders={() => setSheet('reminders')}
              onOpenAssistant={() => setSheet('assistant')}
              onOpenExit={() => setSheet('exit')}
            />
          )}

          {tab === 'safety' && (
            <SafetyPanel ranked={active} intake={intake} copied={copied} onCopy={copyText} onOpenExit={() => setSheet('exit')} />
          )}
        </div>

        <aside className="context-column">
          {tab === 'plan' ? (
            <GuidanceCard step={wizardStep} intake={intake} />
          ) : (
            <>
              <PrivacyCard intake={intake} ranked={active} />
              <ForecastCard ranked={active} intake={intake} />
            </>
          )}
          <SettingsCard intake={intake} onChange={updateIntake} onClear={clearDemoData} />
        </aside>
      </section>

      {!sheet && tab !== 'plan' && (
        <nav className="bottom-nav" aria-label="LumaDate navigation">
          {[
            ['itinerary', 'Itinerary'],
            ['adjust', 'Adjust'],
            ['alerts', 'Alerts'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={tab === value ? 'active' : ''}
              aria-current={tab === value ? 'page' : undefined}
              onClick={() => setTab(value as Tab)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {copied && <div className="toast" role="status">{copied}</div>}

      {sheet === 'booking' && <BookingSheet ranked={active} onClose={() => setSheet(null)} />}
      {sheet === 'reminders' && (
        <ReminderSheet reminders={reminders} onChange={setReminders} onClose={() => setSheet(null)} />
      )}
      {sheet === 'late' && (
        <LateSheet
          ranked={active}
          minutes={lateMinutes}
          onMinutes={setLateMinutes}
          copied={copied}
          onCopy={copyText}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'safety' && (
        <SafetySheet ranked={active} intake={intake} copied={copied} onCopy={copyText} onClose={() => setSheet(null)} />
      )}
      {sheet === 'invite' && (
        <InviteSheet
          ranked={active}
          intake={intake}
          inviteDraft={inviteDraft}
          onInviteDraft={setInviteDraft}
          copied={copied}
          onCopy={copyText}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'saved' && (
        <SavedSheet
          saved={saved}
          onOpen={(planId) => {
            setActiveId(planId)
            setTab('itinerary')
            setSheet(null)
          }}
          onRemove={(id) => setSaved((current) => current.filter((item) => item.id !== id))}
          onClear={clearDemoData}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'assistant' && (
        <AssistantSheet ranked={active} intake={intake} onClose={() => setSheet(null)} />
      )}
      {sheet === 'exit' && (
        <ExitPlanSheet copied={copied} onCopy={copyText} onClose={() => setSheet(null)} />
      )}
      <AlphaFooter />
    </main>
  )
}

function AlphaFooter() {
  return (
    <footer className="alpha-footer">
      <span>Portland controlled alpha. Plans use demonstration data and provider handoffs.</span>
      <nav aria-label="Alpha information">
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
        <a href="support.html">Support</a>
        <a href="feedback.html">Feedback</a>
      </nav>
    </footer>
  )
}

function IntakeWizard({
  intake,
  onChange,
  onMeetupStyle,
  onToggleActivity,
  onToggleMood,
  onToggleAvoid,
  onGenerate,
  onStepChange,
}: {
  intake: Intake
  onChange: <K extends keyof Intake>(key: K, value: Intake[K]) => void
  onMeetupStyle: (value: MeetupStyle) => void
  onToggleActivity: (value: string) => void
  onToggleMood: (value: string) => void
  onToggleAvoid: (value: string) => void
  onGenerate: () => void
  onStepChange: (step: number) => void
}) {
  const [step, setStep] = useState(0)
  const [isBuilding, setIsBuilding] = useState(false)
  const [customBudget, setCustomBudget] = useState(!budgetOptions.some((option) => option.value === intake.budgetMax))
  const [customDateTime, setCustomDateTime] = useState(false)
  const [showFoodLimits, setShowFoodLimits] = useState(false)
  const [locationNotice, setLocationNotice] = useState('')
  const [selectedDatePreset, setSelectedDatePreset] = useState<string | null>(() => inferDatePreset(intake.dateStart))
  const steps = ['Where', 'Time', 'Energy', 'Food', 'Likes', 'Safety', 'Review']
  const isLastStep = step === steps.length - 1
  const selectedAvoids = intake.mustAvoid
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  useEffect(() => {
    onStepChange(step)
  }, [onStepChange, step])

  function nextStep() {
    if (isLastStep) {
      onGenerate()
      return
    }
    if (step === 0 && looksLikeStreetAddress(intake.startLocation)) {
      onChange('startLocation', 'Portland, OR')
      setLocationNotice('For privacy, use a city or neighborhood only. We replaced the street address with Portland, OR.')
      return
    }
    if (step === 1 && !intake.dateStart) applyDatePreset(0)
    setStep((current) => Math.min(current + 1, steps.length - 1))
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0))
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
  }

  function addClue(clue: string) {
    const current = intake.dateEnjoysText.trim()
    const alreadyIncluded = current.toLowerCase().includes(clue.toLowerCase())
    if (alreadyIncluded) return
    onChange('dateEnjoysText', current ? `${current}, ${clue}` : clue)
  }

  function buildPlan() {
    setIsBuilding(true)
    window.setTimeout(onGenerate, 700)
  }

  function applyDatePreset(preset: DatePresetValue) {
    const option = datePresetOptions.find(([, value]) => value === preset)
    const next = dateWindow(new Date(), preset)
    onChange('dateStart', next.dateStart)
    onChange('dateEnd', next.dateEnd)
    setSelectedDatePreset(option?.[0] ?? null)
    setCustomDateTime(false)
  }

  function applyDuration(mode: EndMode, minutes: number) {
    onChange('endMode', mode)
    if (mode !== 'open_ended') {
      const end = new Date(intake.dateStart)
      end.setMinutes(end.getMinutes() + minutes)
      onChange('dateEnd', toDateTimeLocal(end))
    }
  }

  if (isBuilding) {
    return (
      <section className="surface intake-wizard building-screen" aria-live="polite">
        <div className="section-heading">
          <span className="eyebrow">Building your plan</span>
          <h2>Turning clues into an easy win.</h2>
          <p>LumaDate is ranking the vibe, budget, timing, public meet point, and backup.</p>
        </div>
        <div className="building-checklist">
          {['Matching the vibe', 'Keeping the meet point public', 'Checking budget and timing', 'Adding a backup'].map((item) => (
            <span key={item}>✓ {item}</span>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="surface intake-wizard">
      <div className="section-heading">
        <span className="eyebrow">Planning flow</span>
        <h2>{wizardTitles[step]}</h2>
        <p>{wizardCopy[step]}</p>
      </div>

      <WizardProgress labels={steps} activeStep={step} onEdit={setStep} nextTitle={wizardTitles[step + 1]} />
      <InlineGuidance step={step} intake={intake} />

      {step === 0 && (
        <div className="wizard-step">
          <div className="form-grid">
            <label>
              Starting area
              <input
                value={intake.startLocation}
                aria-describedby="starting-area-help starting-area-notice"
                onChange={(event) => {
                  setLocationNotice('')
                  onChange('startLocation', event.target.value)
                }}
                placeholder="City or neighborhood"
                autoComplete="off"
              />
              <small id="starting-area-help">City or neighborhood only, never a street address.</small>
              {locationNotice && (
                <span id="starting-area-notice" className="privacy-correction" role="alert">
                  {locationNotice}
                </span>
              )}
            </label>
            <label>
              Planning area
              <select value={intake.dateArea} onChange={(event) => onChange('dateArea', event.target.value)}>
                {portlandAreaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </label>
          </div>
          <div className="choice-grid" aria-label="Meet-up style">
            {(Object.keys(meetupStyleLabels) as MeetupStyle[]).map((style) => (
              <button
                type="button"
                key={style}
                className={intake.meetupStyle === style ? 'choice-card selected' : 'choice-card'}
                aria-pressed={intake.meetupStyle === style}
                onClick={() => onMeetupStyle(style)}
            >
              <strong>{meetupStyleLabels[style]}</strong>
              {style === 'neutral_public' && <em className="recommended-badge">Recommended for first dates</em>}
              <span>{meetupHelperText[style]}</span>
            </button>
            ))}
          </div>
          <div className="form-grid single-control-grid">
            <label>
              Transportation
              <select value={intake.transportMode} onChange={(event) => onChange('transportMode', event.target.value)}>
                <option value="driving">Driving</option>
                <option value="rideshare">Rideshare</option>
                <option value="transit">Transit</option>
                <option value="walking">Walking</option>
                <option value="biking">Biking</option>
              </select>
            </label>
          </div>
          <p className="privacy-note">Invites and safety shares only show public Portland places.</p>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step">
          <div className="segmented three-up" role="group" aria-label="Date presets">
            {datePresetOptions.map(([label, offset]) => (
              <button
                type="button"
                key={label}
                className={selectedDatePreset === label ? 'active' : ''}
                aria-pressed={selectedDatePreset === label}
                onClick={() => applyDatePreset(offset)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="segmented five-up" role="radiogroup" aria-label="Date stage">
            {(Object.keys(dateStageLabels) as DateStage[]).map((stage) => (
              <button
                type="button"
                role="radio"
                key={stage}
                className={intake.dateStage === stage ? 'active' : ''}
                aria-checked={intake.dateStage === stage}
                onClick={() => onChange('dateStage', stage)}
              >
                {dateStageLabels[stage]}
              </button>
            ))}
          </div>
          <div className="segmented three-up" role="radiogroup" aria-label="Date duration">
            {durationOptions.map(([label, mode, minutes]) => (
              <button
                type="button"
                role="radio"
                key={label}
                className={intake.endMode === mode ? 'active' : ''}
                aria-checked={intake.endMode === mode}
                onClick={() => applyDuration(mode, minutes)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="ghost wide" onClick={() => setCustomDateTime((current) => !current)}>
            {customDateTime ? 'Hide exact date/time' : 'Pick exact date/time'}
          </button>
          {customDateTime && (
            <div className="form-grid">
              <label>
                Start time
                <input type="datetime-local" value={intake.dateStart} onChange={(event) => {
                  setSelectedDatePreset(null)
                  onChange('dateStart', event.target.value)
                }} />
              </label>
              {intake.endMode !== 'open_ended' ? (
                <label>
                  End time
                  <input type="datetime-local" value={intake.dateEnd} onChange={(event) => onChange('dateEnd', event.target.value)} />
                </label>
              ) : (
                <p className="privacy-note">Open-ended means LumaDate will keep low-pressure extensions and safe exits ready.</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <p className="privacy-note">Pick what you know. You can leave the rest as recommended.</p>
          <div className="segmented" role="radiogroup" aria-label="Indoor or outdoor">
            {(Object.keys(indoorOutdoorLabels) as Intake['indoorOutdoor'][]).map((preference) => (
              <button
                type="button"
                role="radio"
                key={preference}
                className={intake.indoorOutdoor === preference ? 'active' : ''}
                aria-checked={intake.indoorOutdoor === preference}
                onClick={() => onChange('indoorOutdoor', preference)}
              >
                {indoorOutdoorLabels[preference]}
              </button>
            ))}
          </div>
          <div className="chip-cloud" aria-label="Mood">
            {moodOptions.map((option) => (
              <button
                type="button"
                key={option}
                className={intake.moodTypes.includes(option) ? 'chip selected' : 'chip'}
                aria-pressed={intake.moodTypes.includes(option)}
                onClick={() => onToggleMood(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <label>
              Crowd: {intake.crowdComfort}/5
              <input
                type="range"
                min="1"
                max="5"
                value={intake.crowdComfort}
                onChange={(event) => onChange('crowdComfort', Number(event.target.value))}
              />
              <span className="range-labels"><span>Quiet</span><span>Lively</span></span>
            </label>
            <label>
              Energy level: {intake.energyLevel}/5
              <input
                type="range"
                min="1"
                max="5"
                value={intake.energyLevel}
                onChange={(event) => onChange('energyLevel', Number(event.target.value))}
              />
              <span className="range-labels"><span>Chill</span><span>Active</span></span>
            </label>
            <label>
              Date tone: {intake.romanceLevel}/5
              <input
                type="range"
                min="1"
                max="5"
                value={intake.romanceLevel}
                onChange={(event) => onChange('romanceLevel', Number(event.target.value))}
              />
              <span className="range-labels"><span>Casual</span><span>Intentional</span></span>
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-step">
          <div className="segmented three-up" role="radiogroup" aria-label="Food wanted">
            {(['yes', 'maybe', 'no'] as Intake['foodWanted'][]).map((value) => (
              <button
                type="button"
                role="radio"
                key={value}
                className={intake.foodWanted === value ? 'active' : ''}
                aria-checked={intake.foodWanted === value}
                onClick={() => onChange('foodWanted', value)}
              >
                {foodWantedLabels[value]}
              </button>
            ))}
          </div>
          <div className="budget-guide">
            <div className="inline-heading">
              <span className="eyebrow">Budget guide</span>
              <p>LumaDate uses this as a private planning guide. It is not shown to your date.</p>
            </div>
            <div className="budget-card-grid" aria-label="Budget guide">
              {budgetOptions.map((option) => (
                <button
                  type="button"
                  key={option.label}
                  className={!customBudget && intake.budgetMax === option.value ? 'budget-card selected' : 'budget-card'}
                  aria-pressed={!customBudget && intake.budgetMax === option.value}
                  onClick={() => {
                    setCustomBudget(false)
                    onChange('budgetMax', option.value)
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.range}</span>
                  <small>{option.description}</small>
                </button>
              ))}
              <button
                type="button"
                className={customBudget ? 'budget-card selected' : 'budget-card'}
                aria-pressed={customBudget}
                onClick={() => setCustomBudget(true)}
              >
                <strong>Custom max</strong>
                <span>Set my own limit</span>
                <small>Use exact control when the presets do not fit.</small>
              </button>
            </div>
            <div className="segmented two-up budget-basis" role="radiogroup" aria-label="Budget basis">
              {(['total', 'per_person'] as Intake['budgetMode'][]).map((mode) => (
                <button
                  type="button"
                  role="radio"
                  key={mode}
                  className={intake.budgetMode === mode ? 'active' : ''}
                  aria-checked={intake.budgetMode === mode}
                  onClick={() => onChange('budgetMode', mode)}
                >
                  {mode === 'total' ? 'Whole date' : 'Per person'}
                </button>
              ))}
            </div>
            {customBudget && (
              <label className="custom-budget-control">
                Plan around: up to {formatMoney(intake.budgetMax)} {intake.budgetMode === 'total' ? 'total' : 'per person'}
                <input
                  type="range"
                  min="20"
                  max="250"
                  step="5"
                  value={intake.budgetMax}
                  onChange={(event) => onChange('budgetMax', Number(event.target.value))}
                />
              </label>
            )}
          </div>
          <button type="button" className="ghost wide" onClick={() => setShowFoodLimits((current) => !current)}>
            {showFoodLimits ? 'Hide dietary and avoid limits' : 'Add dietary/alcohol/avoid limits'}
          </button>
          {showFoodLimits && (
            <div className="advanced-section">
              <div className="form-grid">
                <label>
                  Cuisine likes
                  <input value={intake.cuisineLikes} onChange={(event) => onChange('cuisineLikes', event.target.value)} />
                </label>
                <label>
                  Dietary limits
                  <input value={intake.dietaryLimits} onChange={(event) => onChange('dietaryLimits', event.target.value)} />
                </label>
                <label>
                  Alcohol preference
                  <select
                    value={intake.alcoholPreference}
                    onChange={(event) => onChange('alcoholPreference', event.target.value as Intake['alcoholPreference'])}
                  >
                    <option value="alcohol_ok">Alcohol okay</option>
                    <option value="no_alcohol">No alcohol</option>
                    <option value="mocktail_friendly">Mocktail-friendly</option>
                    <option value="avoid_bars">Avoid bars</option>
                  </select>
                </label>
              </div>
              <div className="chip-cloud" aria-label="Must avoid quick picks">
                {avoidOptions.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={selectedAvoids.includes(option) ? 'chip selected' : 'chip'}
                    aria-pressed={selectedAvoids.includes(option)}
                    onClick={() => onToggleAvoid(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <label>
                Anything else to avoid?
                <input value={intake.mustAvoid} onChange={(event) => onChange('mustAvoid', event.target.value)} />
              </label>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="wizard-step likes-step">
          <div className="selected-summary">
            <strong>Selected</strong>
            <span>
              {[...intake.activityTypes, ...intake.moodTypes].slice(0, 8).map(cleanLabel).join(', ') || 'Use the Portland defaults or add a few clues.'}
            </span>
          </div>
          <div className="preference-accordion" aria-label="Preference categories">
            {preferenceGroups.map((group, index) => (
              <details key={group.title} open={index < 2}>
                <summary>{group.title}</summary>
                <div className="chip-cloud compact-chip-cloud">
                  {group.items.map((option) => {
                    const isMood = group.title === 'Date mood'
                    const selected = isMood ? intake.moodTypes.includes(option) : intake.activityTypes.includes(option)
                    return (
                      <button
                        type="button"
                        key={option}
                        className={selected ? 'chip selected' : 'chip'}
                        aria-pressed={selected}
                        onClick={() => (isMood ? onToggleMood(option) : onToggleActivity(option))}
                      >
                        {cleanLabel(option)}
                      </button>
                    )
                  })}
                </div>
              </details>
            ))}
          </div>
          <label>
            What have they told you they enjoy?
            <textarea
              value={intake.dateEnjoysText}
              onChange={(event) => onChange('dateEnjoysText', event.target.value)}
              placeholder="They said they like jazz, sushi, bookstores, quiet places."
            />
          </label>
          <div className="chip-cloud" aria-label="Quick-add clues">
            {clueOptions.slice(0, 6).map((option) => (
              <button type="button" key={option} className="chip quick-chip" onClick={() => addClue(option)}>
                + {option}
              </button>
            ))}
          </div>
          <label>
            What do you enjoy?
            <textarea
              value={intake.userEnjoysText}
              onChange={(event) => onChange('userEnjoysText', event.target.value)}
              placeholder="I like good food, music, and dates that can extend naturally."
            />
          </label>
          <label>
            Must avoid
            <input value={intake.mustAvoid} onChange={(event) => onChange('mustAvoid', event.target.value)} />
          </label>
          <p className="privacy-note">If you only know one thing, type it. LumaDate can work with clues.</p>
        </div>
      )}

      {step === 5 && (
        <div className="wizard-step">
          <div className="choice-grid" aria-label="Safety and comfort settings">
            <button
              type="button"
              className={intake.firstDateSafeMode ? 'choice-card selected safety-choice' : 'choice-card safety-choice'}
              aria-pressed={intake.firstDateSafeMode}
              onClick={() => onChange('firstDateSafeMode', !intake.firstDateSafeMode)}
            >
              <strong>{intake.firstDateSafeMode ? 'On: ' : ''}First-date safe mode</strong>
              <span>Favor public, easy-exit, conversation-friendly places.</span>
            </button>
            <button
              type="button"
              className={intake.safetyShareEnabled ? 'choice-card selected safety-choice' : 'choice-card safety-choice'}
              aria-pressed={intake.safetyShareEnabled}
              onClick={() => onChange('safetyShareEnabled', !intake.safetyShareEnabled)}
            >
              <strong>{intake.safetyShareEnabled ? 'On: ' : ''}Create a shareable safety note</strong>
              <span>Create copyable public plan details for a trusted contact.</span>
            </button>
            <div className="choice-card selected safety-choice privacy-lock" role="note">
              <strong>Always on: Private origin hidden</strong>
              <span>Private addresses never appear in invites or safety text.</span>
            </div>
          </div>
          <p className="privacy-note">Safety share uses public meet details only. No home/work address is included.</p>
        </div>
      )}

      {step === 6 && (
        <ReviewGenerateStep intake={intake} onEdit={setStep} />
      )}

      <div className="wizard-actions">
        <button type="button" className="ghost" onClick={previousStep} disabled={step === 0}>
          Back
        </button>
        <button type="button" className="primary" onClick={isLastStep ? buildPlan : nextStep}>
          {isLastStep ? 'Generate options' : 'Next'}
        </button>
      </div>
    </section>
  )
}

const wizardTitles = [
  'Where should the date happen?',
  'When and how flexible?',
  'What kind of energy?',
  'Food, drinks, and limits.',
  'What do they like?',
  'Safety and comfort.',
  'Review the plan brief.',
]

const wizardCopy = [
  'Use a general starting area, then choose the public Portland area for the date.',
  'Set the time window. You can keep the night flexible.',
  'Tell LumaDate if this should be low-key, thoughtful, lively, or quiet.',
  'Help the plan avoid awkward food and drink misses.',
  'This is the emotional core. One clue is enough to make it personal.',
  'Keep the plan reassuring without making it heavy.',
  'One quick check before the itinerary appears.',
]

const meetupHelperText: Record<MeetupStyle, string> = {
  meeting_there: 'Best when both people handle their own travel.',
  i_pick_up: 'Keep private addresses out of shared plan text.',
  they_pick_up: 'Still keep the invite centered on a public area.',
  fair_midpoint: 'Balance travel between both general areas.',
  neutral_public: 'Good default for first-date safety.',
}

function WizardProgress({
  labels,
  activeStep,
  onEdit,
  nextTitle,
}: {
  labels: string[]
  activeStep: number
  onEdit: (step: number) => void
  nextTitle?: string
}) {
  const progress = labels.length > 1 ? `${(activeStep / (labels.length - 1)) * 100}%` : '0%'

  return (
    <div className="wizard-progress-wrap">
      <div className="wizard-progress-meta">
        <span>Step {activeStep + 1} of {labels.length}</span>
        <strong>{nextTitle ? `Next: ${nextTitle}` : 'Ready to build your plan.'}</strong>
      </div>
      <div className="wizard-progress" aria-label="Planning progress" style={{ '--progress': progress } as React.CSSProperties}>
        {labels.map((label, index) => {
          const state = index < activeStep ? 'done' : index === activeStep ? 'active' : 'future'
          return (
            <button
              type="button"
              key={label}
              className={state}
              aria-current={state === 'active' ? 'step' : undefined}
              aria-label={`${label}, ${state === 'done' ? 'completed' : state === 'active' ? 'current step' : 'upcoming step'}`}
              disabled={state === 'future'}
              onClick={() => state !== 'future' && onEdit(index)}
            >
              <span aria-hidden="true">{state === 'done' ? '✓' : index + 1}</span>
              <strong>{label}</strong>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function guidanceForStep(step: number, intake: Intake) {
  return [
    {
      title: 'Use general areas.',
      body: 'Neutral public is the safest default for first dates. Private addresses stay out of invites and safety shares.',
      tip: intake.meetupStyle === 'neutral_public' ? 'Good default selected.' : 'Neutral public is usually easiest.',
    },
    {
      title: 'A rough time is enough.',
      body: 'Pick Tonight, Tomorrow, or This weekend first. Exact date/time is only there if you need it.',
      tip: 'Flexible endings keep backup options open.',
    },
    {
      title: 'Leave defaults if unsure.',
      body: 'Quiet, energy, and tone help LumaDate rank options, but rough answers are totally fine.',
      tip: 'You can tune the plan after seeing results.',
    },
    {
      title: 'Budget stays private.',
      body: 'Choose a planning range. LumaDate never shows the budget to your date.',
      tip: `${formatMoney(intake.budgetMax)} ${intake.budgetMode === 'total' ? 'total' : 'per person'} selected.`,
    },
    {
      title: 'One clue is enough.',
      body: 'If they mentioned coffee, parks, sushi, music, quiet places, or anything small, add it here.',
      tip: 'LumaDate looks for overlap, not perfection.',
    },
    {
      title: 'Safety messages are drafts only.',
      body: 'The safety share uses public stops and arrival times. LumaDate never sends or shares these drafts automatically.',
      tip: intake.safetyShareEnabled ? 'Safety share is on.' : 'Safety share is optional.',
    },
    {
      title: 'Quick check before results.',
      body: 'Review the public area, time, budget guide, and safety settings. Then compare plan options.',
      tip: 'You are not booking anything yet.',
    },
  ][step]
}

function InlineGuidance({ step, intake }: { step: number; intake: Intake }) {
  const guidance = guidanceForStep(step, intake)

  return (
    <div className="wizard-coach" role="note">
      <strong>{guidance.title}</strong>
      <span>{guidance.tip}</span>
    </div>
  )
}

function GuidanceCard({ step, intake }: { step: number; intake: Intake }) {
  const guidance = guidanceForStep(step, intake)

  return (
    <section className="side-card guidance-card">
      <span className="eyebrow">Concierge note</span>
      <h3>{guidance.title}</h3>
      <p>{guidance.body}</p>
      <small>{guidance.tip}</small>
    </section>
  )
}

function ReviewGenerateStep({ intake, onEdit }: { intake: Intake; onEdit: (step: number) => void }) {
  const reviewRows = [
    ['Where', 0, `${meetupStyleLabels[intake.meetupStyle]} by ${intake.transportMode} in ${intake.dateArea}.`],
    ['Time', 1, `${dateStageLabels[intake.dateStage]} on ${formatPlanDate(intake.dateStart)} at ${offsetTime(intake.dateStart, 0)} with a ${endModeLabels[intake.endMode]} finish.`],
    ['Vibe', 2, `${intake.moodTypes.join(', ') || 'Flexible'} with ${intake.activityTypes.slice(0, 4).map(cleanLabel).join(', ')}.`],
    ['Budget', 3, budgetSummary(intake)],
    ['Food', 3, `${intake.foodWanted === 'no' ? 'No food needed' : `Food: ${intake.cuisineLikes || 'open'}`}; ${alcoholLabels[intake.alcoholPreference]}.`],
    ['What they enjoy', 4, intake.dateEnjoysText || 'No personal notes yet.'],
    ['Safety', 5, `${intake.firstDateSafeMode ? 'First-date safe' : 'Flexible safety mode'}; ${intake.safetyShareEnabled ? 'safety share on' : 'safety share off'}.`],
  ] as const

  return (
    <div className="wizard-step review-step">
      <div className="review-summary">
        <span className="eyebrow">Plan brief</span>
        <h3>{summarizeDatePlan(intake)}</h3>
        <p>LumaDate will weigh timing, budget, preferences, comfort, and backups before ranking plans.</p>
      </div>
      <div className="review-grid">
        {reviewRows.map(([title, editStep, value]) => (
          <article className="review-card" key={title}>
            <div>
              <strong>{title}</strong>
              <p>{value}</p>
            </div>
            <button type="button" className="ghost" onClick={() => onEdit(editStep)}>
              Edit
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

function ResultsPanel({
  rankedPlans,
  activeId,
  onSelect,
  onConfirm,
}: {
  rankedPlans: RankedPlan[]
  activeId: string
  onSelect: (id: string) => void
  onConfirm: () => void
}) {
  const active = rankedPlans.find((ranked) => ranked.plan.id === activeId) ?? rankedPlans[0]

  return (
    <section className="surface">
      <div className="section-heading">
        <span className="eyebrow">Ranked plans</span>
        <h2>Pick the plan before we build the full itinerary.</h2>
        <p>Selecting a card only marks it. Use the confirmation button when it feels right.</p>
      </div>
      <div className="alpha-plan-ribbon">Alpha plan · real place suggestions · live availability not checked</div>
      <div className="result-list">
        {rankedPlans.map((ranked, index) => (
          <button
            type="button"
            key={ranked.plan.id}
            className={activeId === ranked.plan.id ? 'result-card selected' : 'result-card'}
            aria-pressed={activeId === ranked.plan.id}
            onClick={() => onSelect(ranked.plan.id)}
          >
            <span className="score">#{index + 1} {fitLabel(ranked, index)}</span>
            <strong>{ranked.plan.title}</strong>
            <span>{ranked.plan.shortPitch}</span>
            <span className="place-preview">{placePreview(ranked.plan)}</span>
            <span className="verification-note">Map and review handoff ready.</span>
            <span className="mini-meta">
              {ranked.meetArea} · {formatCostRange(ranked.plan.estimatedCostTotal)} · {formatDuration(ranked.plan.estimatedDurationMinutes)}
            </span>
            {activeId === ranked.plan.id && <span className="selected-plan-note">Selected</span>}
          </button>
        ))}
      </div>
      <div className="confirm-plan-bar">
        <div>
          <strong>{active?.plan.title}</strong>
          <span>{active ? `${active.meetArea} · ${formatCostRange(active.plan.estimatedCostTotal)}` : 'Choose a plan'}</span>
        </div>
        <button type="button" className="primary" onClick={onConfirm} disabled={!active}>
          Open selected itinerary
        </button>
      </div>
    </section>
  )
}

function ItineraryPanel({
  ranked,
  intake,
  onOpenSheet,
  onGoAdjust,
  onCompare,
  onSave,
  planState,
  onPlanState,
  inviteDraft,
  adjustmentMessage,
  copied,
  onCopy,
}: {
  ranked: RankedPlan
  intake: Intake
  onOpenSheet: (sheet: Sheet) => void
  onGoAdjust: () => void
  onCompare: () => void
  onSave: () => void
  planState: PlanState
  onPlanState: (state: PlanState) => void
  inviteDraft: string
  adjustmentMessage: string
  copied: string
  onCopy: (label: string, text: string, selector?: string) => void
}) {
  const inviteText = `${inviteDraft}

Plan: ${ranked.plan.title}
Meet: ${ranked.meetArea} on ${formatPlanDate(intake.dateStart)} at ${offsetTime(
    intake.dateStart,
    0,
  )}
Why it fits: ${ranked.reasons[0] ?? ranked.plan.shortPitch}`

  return (
    <section className="surface itinerary" tabIndex={-1}>
      <PlanSummaryCard
        ranked={ranked}
        intake={intake}
        planState={planState}
      />

      {adjustmentMessage && <p className="adjustment-banner">{adjustmentMessage}</p>}
      <div className="alpha-plan-ribbon">Example estimates · verify route, hours, and availability externally</div>

      <div className="timeline">
        <div className="timeline-row">
          <time>{ranked.leaveBy.replace('Leave by ', '')}</time>
          <div>
            <strong>Example leave time - verify route in Maps</strong>
            <p>{ranked.leaveBy}. Demo traffic estimate: {ranked.trafficNote}</p>
          </div>
        </div>
        {ranked.plan.itinerary.map((step) => (
          <div className="timeline-row" key={`${step.title}-${step.timeOffsetMinutes}`}>
            <time>{offsetTime(intake.dateStart, step.timeOffsetMinutes)}</time>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="forecast-strip">
        <span>Demo crowd estimate - not live: {ranked.crowdForecast}</span>
        <span>{ranked.crowdBackup}</span>
      </div>

      <div className="itinerary-primary-actions">
        <button type="button" className="primary" onClick={() => onCopy('Invite copied', inviteText)}>
          {copied === 'Invite copied' ? 'Copied' : 'Copy invite'}
        </button>
        <button type="button" className="secondary" onClick={() => onOpenSheet('booking')}>
          Check hours & availability externally ↗
        </button>
        {intake.safetyShareEnabled && (
          <button type="button" className="secondary" onClick={() => onOpenSheet('safety')}>
            Safety share
          </button>
        )}
      </div>

      <details className="itinerary-secondary">
        <summary>More plan details and tools</summary>
        <MeetAreaMapCard ranked={ranked} intake={intake} />
        <IntegrationReadinessCard />
        <PlacePanel places={ranked.plan.places ?? []} ranked={ranked} intake={intake} />
        <div className="reason-list">
          {ranked.reasons.map((reason) => <p key={reason}>{reason}</p>)}
          {ranked.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
        </div>
        <div className="state-row" role="radiogroup" aria-label="Plan states">
          {planStates.map((state) => (
            <button
              type="button"
              role="radio"
              key={state}
              className={planState === state ? 'state-option active' : 'state-option'}
              aria-checked={planState === state}
              onClick={() => onPlanState(state)}
            >
              {state}
            </button>
          ))}
        </div>
        <div className="secondary-tool-grid">
          <button type="button" className="secondary" onClick={() => onOpenSheet('invite')}>Edit invite starter</button>
          <button type="button" className="secondary" onClick={onCompare}>Compare other options</button>
          <button type="button" className="secondary" onClick={onGoAdjust}>Adjust plan</button>
          <button type="button" className="secondary" onClick={() => onOpenSheet('reminders')}>Set reminders</button>
          <button type="button" className="secondary" onClick={() => onOpenSheet('late')}>Running late</button>
          <button type="button" className="ghost" onClick={onSave}>Save in this browser</button>
        </div>
      </details>
    </section>
  )
}

function PlanSummaryCard({
  ranked,
  intake,
  planState,
}: {
  ranked: RankedPlan
  intake: Intake
  planState: PlanState
}) {
  return (
    <section className="plan-summary" aria-label="Plan summary">
      <div className="summary-topline">
        <span className="state-chip">{planState}</span>
        <span>{bookingLabels[ranked.plan.bookingType]}</span>
      </div>
      <h2>{ranked.plan.title}</h2>
      <p>{ranked.plan.shortPitch}</p>
      <div className="summary-grid">
        <span><strong>When</strong>{formatPlanDate(intake.dateStart)} · {offsetTime(intake.dateStart, 0)}</span>
        <span><strong>Meet</strong>{ranked.meetArea}</span>
        <span><strong>Travel</strong>Example: {ranked.leaveBy.toLowerCase()} · verify in Maps</span>
        <span><strong>Budget</strong>{formatCostRange(ranked.plan.estimatedCostTotal)}</span>
        <span><strong>Vibe</strong>{ranked.plan.tags.slice(0, 2).join(' + ')}</span>
        <span><strong>Backup</strong>{ranked.plan.backupOptions[0] ?? 'nearby cafe'}</span>
        <span><strong>Anchor</strong>{primaryAnchor(ranked.plan, ranked.meetArea)}</span>
      </div>
      <div className="summary-note">
        <strong>Plan note</strong>
        <span>{dressWeatherNote(ranked)} Availability is external; verify hours, reviews, and provider options before leaving.</span>
      </div>
    </section>
  )
}

function MeetAreaMapCard({ ranked, intake }: { ranked: RankedPlan; intake: Intake }) {
  return (
    <section className="meet-map-card" aria-label="Public meet area map preview">
      <div className="mock-map">
        <span className="map-pin start">You</span>
        <span className="map-pin meet">Meet</span>
        <span className="map-pin backup">Backup</span>
        <span className="route-line"></span>
      </div>
      <div>
        <span className="eyebrow">Public meet area</span>
        <h3>{ranked.meetArea}</h3>
        <p>
          {meetingLabels[intake.meetingMode]}. Private origin addresses stay hidden in invite and safety share.
          Use the public meet point first, then verify park/weather and restaurant availability before leaving.
        </p>
      </div>
    </section>
  )
}

function IntegrationReadinessCard() {
  return (
    <section className="integration-card" aria-label="Map and data readiness">
      <div>
        <span className="eyebrow">Plan check</span>
        <h3>Portland map links and planning estimates are included.</h3>
        <p>
          Controlled alpha data is shown here. Verify current hours, reviews, route, and availability before leaving.
        </p>
      </div>
      <div className="integration-pill-grid" aria-label="Integration status">
        <span>Map links ready</span>
        <span>External place checks</span>
        <span>Demo weather placeholder</span>
        <span>Demo crowd estimate - not live</span>
      </div>
    </section>
  )
}

function PlacePanel({ places, ranked, intake }: { places: Place[]; ranked: RankedPlan; intake: Intake }) {
  if (!places.length) return null
  return (
    <div className="place-panel" aria-label="Real place recommendations">
      <div className="section-heading compact-heading">
        <span className="eyebrow">Real places</span>
        <h3>Portland anchors with map and review handoffs.</h3>
        <p>
          Portland place links are ready to inspect. Verify current hours, availability,
          reviews, photos, and route details before leaving.
        </p>
      </div>
      <div className="place-list">
        {places.map((place, index) => {
          const signals = buildMockStopSignals({
            place,
            index,
            dateStart: intake.dateStart,
            bookingType: ranked.plan.bookingType,
            crowdComfort: intake.crowdComfort,
          })

          return (
          <article className="place-card" key={`${place.name}-${place.category}`}>
            <div>
              <strong>{place.name}</strong>
              <span>{place.category} · {place.neighborhood} · {place.priceLevel}</span>
            </div>
            <p>{place.why}</p>
            <div className="place-signal-grid">
              <span>
                <strong>Demo weather placeholder</strong>
                {signals.weather.summary}
              </span>
              <span>
                <strong>Demo crowd estimate - not live</strong>
                {signals.crowd.label}
              </span>
              <span>
                <strong>Example route leg - verify in Maps</strong>
                  {signals.routeLeg.estimatedMinutes} min estimate
              </span>
            </div>
            <small>{place.ratingSummary}</small>
            <small>{signals.crowd.verificationCopy}</small>
            {place.warning && <small className="place-warning">{place.warning}</small>}
            <div className="place-actions">
              <a className="link-button" href={place.mapsLink} target="_blank" rel="noreferrer">
                Open map
              </a>
              <a className="ghost link-button" href={place.reviewLink} target="_blank" rel="noreferrer">
                Verify reviews
              </a>
            </div>
          </article>
          )
        })}
      </div>
    </div>
  )
}

function AdjustPanel({
  ranked,
  rankedPlans,
  message,
  onAdjust,
  onSelect,
  onGoItinerary,
  onOpenLate,
  onOpenExit,
}: {
  ranked: RankedPlan
  rankedPlans: RankedPlan[]
  message: string
  onAdjust: (message: string) => void
  onSelect: (planId: string) => void
  onGoItinerary: () => void
  onOpenLate: () => void
  onOpenExit: () => void
}) {
  const adjustments: Array<[string, string, string]> = [
    ['Make cheaper', 'Find a lower-cost plan while keeping real place links.', 'Selected the lowest-cost itinerary and kept Google Maps review links visible.'],
    ['Make quieter', 'Prioritize conversation-friendly venues and calmer backups.', `Favored quiet backups like ${ranked.plan.backupOptions[0] ?? 'a quieter backup nearby'}.`],
    ['Make more romantic', 'Tune the plan toward thoughtful without making it too formal.', 'Kept a more intentional finish without making it too formal.'],
    ['Switch indoor', 'Find a rain-safe or indoor version of the plan.', 'Selected an indoor/rain-safe itinerary where available.'],
    ['Replace activity', 'Swap the main activity for a nearby backup.', `Swapped the anchor toward ${ranked.plan.backupOptions[1] ?? 'a nearby backup'}.`],
    ['Add food/drinks', 'Prioritize plans with food, coffee, dessert, or drinks.', 'Prioritized a plan with real food/drink locations and Google Maps links.'],
    ['Extend date', 'Keep optional next stops ready if the night is going well.', 'Kept optional extension stops visible on the itinerary.'],
    ['End sooner', 'Shorten the plan while keeping the public meet point.', 'Selected a shorter itinerary and kept the public meet point.'],
    ['Continue the night', 'Show low-pressure late-night food, dessert, coffee, or safe transport.', 'Showing low-pressure late-night food, dessert, coffee, or safe transport.'],
    ['Find backup nearby', 'Bring the backup forward if the first choice is crowded.', ranked.crowdBackup],
  ]

  function adjustedPlanId(title: string): string {
    if (title === 'Make cheaper' || title === 'End sooner') {
      return [...rankedPlans].sort((a, b) => a.plan.estimatedCostTotal - b.plan.estimatedCostTotal)[0]?.plan.id ?? ranked.plan.id
    }
    if (title === 'Switch indoor' || title === 'Make quieter') {
      return rankedPlans.find((item) => item.plan.safetyProfile.indoor && item.plan.tags.includes('quiet'))?.plan.id ?? ranked.plan.id
    }
    if (title === 'Add food/drinks') {
      return rankedPlans.find((item) => item.plan.places?.some((place) => /food|sushi|coffee|dessert|drink/i.test(place.category)))?.plan.id ?? ranked.plan.id
    }
    return ranked.plan.id
  }

  function applyAdjustment(title: string, appliedCopy: string) {
    const planId = adjustedPlanId(title)
    onSelect(planId)
    onAdjust(`Preview ready - ${title}: ${appliedCopy} Keep adjusted plan to use it, or choose another adjustment.`)
  }

  return (
    <section className="surface">
      <div className="section-heading">
        <span className="eyebrow">Preview changes</span>
        <h2>Preview an adjusted plan, then keep it or choose another change.</h2>
      </div>
      <div className="adjust-grid">
        {adjustments.map(([title, preview, appliedCopy]) => {
          const selected = message.startsWith(`Preview ready - ${title}:`)
          return (
          <button
            type="button"
            className={selected ? 'adjust-card selected' : 'adjust-card'}
            aria-pressed={selected}
            key={title}
            onClick={() => applyAdjustment(title, appliedCopy)}
          >
            <strong>{selected ? `Applied: ${title}` : title}</strong>
            <span>{selected ? appliedCopy : preview}</span>
          </button>
          )
        })}
      </div>
      {message && <p className="mock-update" role="status">{message}</p>}
      {message && (
        <button type="button" className="primary wide" onClick={onGoItinerary}>
          Keep adjusted plan
        </button>
      )}
      <button type="button" className="secondary wide" onClick={onOpenLate}>
        Open running-late assistant
      </button>
      <button type="button" className="ghost wide" onClick={onOpenExit}>
        Help me leave
      </button>
    </section>
  )
}

function AlertsPanel({
  ranked,
  reminders,
  onOpenReminders,
  onOpenAssistant,
  onOpenExit,
}: {
  ranked: RankedPlan
  reminders: ReminderSettings
  onOpenReminders: () => void
  onOpenAssistant: () => void
  onOpenExit: () => void
}) {
  const alerts = [
    reminders.dayBefore && 'Tomorrow morning: confirm the reservation or tickets.',
    reminders.twoHours && `Two hours before: review ${ranked.plan.title}.`,
    reminders.leaveTime && `${ranked.leaveBy}: ${ranked.trafficNote}.`,
    reminders.runningLate && '15 minutes before: LumaDate will ask if you are on time.',
    reminders.safetyCheck && 'Safety check-in: copy your public itinerary to a trusted contact.',
  ].filter((alert): alert is string => Boolean(alert))

  return (
    <section className="surface">
      <div className="section-heading">
        <span className="eyebrow">Demo reminders</span>
        <h2>Copyable reminder checklist.</h2>
      </div>
      <TonightModeCard ranked={ranked} onOpenReminders={onOpenReminders} />
      <div className="alert-list">
        {alerts.map((alert) => (
          <p key={alert}>{alert}</p>
        ))}
      </div>
      <button type="button" className="primary wide" onClick={onOpenReminders}>
        Edit demo reminders
      </button>
      <button type="button" className="secondary wide" onClick={onOpenAssistant}>
        Open Luma Assistant demo
      </button>
      <button type="button" className="ghost wide" onClick={onOpenExit}>
        Help me leave
      </button>
    </section>
  )
}

function TonightModeCard({ ranked, onOpenReminders }: { ranked: RankedPlan; onOpenReminders: () => void }) {
  return (
    <section className="tonight-card">
      <div>
        <span className="state-chip">Tonight mode</span>
        <h3>Ready when the plan starts moving.</h3>
        <p>{ranked.leaveBy}. {ranked.trafficNote}. {dressWeatherNote(ranked)}</p>
      </div>
      <div className="tonight-grid">
        <span>ETA: example 24 min</span>
        <span>Backup: {ranked.plan.backupOptions[0] ?? 'nearby cafe'}</span>
        <span>Weather note: light layer</span>
      </div>
      <button type="button" className="secondary wide" onClick={onOpenReminders}>
        Review copyable reminders
      </button>
    </section>
  )
}

function SafetyPanel({
  ranked,
  intake,
  copied,
  onCopy,
  onOpenExit,
}: {
  ranked: RankedPlan
  intake: Intake
  copied: string
  onCopy: (label: string, text: string, selector?: string) => void
  onOpenExit: () => void
}) {
  const text = safetyText(ranked, intake)
  const stops = publicStopDetails(ranked, intake)
  return (
    <section className="surface">
      <div className="section-heading">
        <span className="eyebrow">Safety share</span>
        <h2>Share the public version of the plan.</h2>
        <p>{formatPlanDate(intake.dateStart)}. Only public places and planned arrival times are included. Private home/work anchors stay out.</p>
      </div>
      <div className="public-stop-list" aria-label="Public safety stops">
        {stops.map((stop) => (
          <article className="public-stop-card" key={`${stop.time}-${stop.title}`}>
            <time>{stop.time}</time>
            <div>
              <strong>{stop.placeName}</strong>
              <span>{stop.title} · {stop.location}</span>
              <small>{stop.qualities}</small>
              {stop.mapsLink && (
                <a className="inline-link" href={stop.mapsLink} target="_blank" rel="noreferrer">
                  Open map
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      <textarea className="copy-box safety-copy" data-copy-target="safety" value={text} readOnly />
      <div className="note-list">
        {ranked.plan.safetyNotes.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>
      <button type="button" className="primary wide" onClick={() => onCopy('Safety copied', text, '[data-copy-target="safety"]')}>
        {copied === 'Safety copied' ? 'Copied' : 'Copy safety share'}
      </button>
      <button type="button" className="secondary wide" onClick={onOpenExit}>
        Help me leave
      </button>
    </section>
  )
}

function SavedSheet({
  saved,
  onOpen,
  onRemove,
  onClear,
  onClose,
}: {
  saved: SavedItinerary[]
  onOpen: (planId: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onClose: () => void
}) {
  return (
    <SheetFrame title="Saved plans" onClose={onClose}>
      <div className="section-heading">
        <span className="eyebrow">Saved plans</span>
        <h2>Your shortlist and settings.</h2>
      </div>
      {saved.length === 0 ? (
        <p className="empty">No saved plans yet. Save one from the itinerary screen.</p>
      ) : (
        <div className="saved-list">
          {saved.map((item) => (
            <div className="saved-card" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.meetArea}</p>
              </div>
              <div className="saved-actions">
                <button type="button" className="secondary" onClick={() => onOpen(item.planId)}>
                  Open
                </button>
                <button type="button" className="ghost" onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="ghost wide" onClick={onClear}>
        Clear planning data
      </button>
    </SheetFrame>
  )
}

function PrivacyCard({ intake, ranked }: { intake: Intake; ranked: RankedPlan }) {
  return (
    <section className="side-card">
      <span className="eyebrow">Privacy-aware meet point</span>
      <h3>{meetingLabels[intake.meetingMode]}</h3>
      <p>{ranked.meetArea}</p>
      <small>Exact home or work addresses are not included in invites or safety shares.</small>
    </section>
  )
}

function ForecastCard({ ranked, intake }: { ranked: RankedPlan; intake: Intake }) {
  const weather = mockWeatherAtArrival(intake.dateStart, ranked.plan.safetyProfile.outdoor)

  return (
    <section className="side-card">
      <span className="eyebrow">Traffic and crowd</span>
      <h3>Example leave time - verify in Maps</h3>
      <p>{ranked.leaveBy}. Demo traffic estimate: {ranked.trafficNote}</p>
      <p>Demo weather placeholder: {weather.summary}</p>
      <p>Demo crowd estimate - not live: {ranked.crowdForecast}</p>
      <small>Live Google Popular Times not connected. Verify before leaving.</small>
    </section>
  )
}

function SettingsCard({
  intake,
  onChange,
  onClear,
}: {
  intake: Intake
  onChange: <K extends keyof Intake>(key: K, value: Intake[K]) => void
  onClear: () => void
}) {
  return (
    <section className="side-card">
      <span className="eyebrow">Defaults</span>
      <label>
        First-date safe
        <input
          type="checkbox"
          checked={intake.firstDateSafeMode}
          onChange={(event) => onChange('firstDateSafeMode', event.target.checked)}
        />
      </label>
      <p className="privacy-note"><strong>Private origin is always hidden.</strong> This protection cannot be turned off.</p>
      <button type="button" className="ghost wide" onClick={onClear}>
        Clear planning data
      </button>
    </section>
  )
}

function BookingSheet({ ranked, onClose }: { ranked: RankedPlan; onClose: () => void }) {
  return (
    <SheetFrame title="Booking and reservation" onClose={onClose}>
      <p className="sheet-copy">
        External/demo only. LumaDate does not complete bookings, payments, calls, or reservations.
        Use these handoffs to verify current availability yourself.
      </p>
      <div className="provider-note">
        <strong>Main anchor</strong>
        <span>{primaryAnchor(ranked.plan, ranked.meetArea)}</span>
      </div>
      <div className="provider-list">
        {ranked.plan.providers.map((provider) => (
          <a
            key={`${provider.type}-${provider.label}`}
            className="provider-card"
            href={provider.mode === 'call' ? `tel:${provider.phone}` : provider.url ?? '#'}
            target={provider.url ? '_blank' : undefined}
            rel={provider.url ? 'noreferrer' : undefined}
          >
            <strong>{provider.label}</strong>
            <span>{providerModeLabel(provider.mode)}</span>
          </a>
        ))}
      </div>
      <p className="sheet-copy">Before leaving: check maps, hours, review recency, weather for park stops, and the provider's own confirmation screen.</p>
    </SheetFrame>
  )
}

function ReminderSheet({
  reminders,
  onChange,
  onClose,
}: {
  reminders: ReminderSettings
  onChange: (settings: ReminderSettings) => void
  onClose: () => void
}) {
  const rows: Array<[keyof ReminderSettings, string]> = [
    ['dayBefore', 'Copy prompt: day before confirmation'],
    ['twoHours', 'Copy prompt: two hours before'],
    ['leaveTime', 'Copy prompt: leave-time reminder'],
    ['runningLate', 'Copy prompt: running-late check'],
    ['safetyCheck', 'Copy prompt: safety check-in'],
  ]
  return (
    <SheetFrame title="Demo reminder setup" onClose={onClose}>
      <p className="sheet-copy">
        These are copyable demo reminders only. LumaDate is not scheduling notifications or sending messages yet.
      </p>
      <div className="toggle-stack">
        {rows.map(([key, label]) => (
          <label className="toggle" key={key}>
            <input
              type="checkbox"
              checked={reminders[key]}
              onChange={(event) => onChange({ ...reminders, [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
    </SheetFrame>
  )
}

function LateSheet({
  ranked,
  minutes,
  onMinutes,
  copied,
  onCopy,
  onClose,
}: {
  ranked: RankedPlan
  minutes: number
  onMinutes: (minutes: number) => void
  copied: string
  onCopy: (label: string, text: string, selector?: string) => void
  onClose: () => void
}) {
  const message = `Hi, this is Zach. I have a reservation or plan for ${ranked.plan.title}. We are running about ${minutes} minutes late. Could you please hold the spot if possible? Thank you.`
  const phoneProvider = ranked.plan.providers.find((provider) => provider.mode === 'call')
  return (
    <SheetFrame title="Running-late assistant" onClose={onClose}>
      <p className="sheet-copy">Choose the delay and copy a message. SMS is intentionally not sent in this demo.</p>
      <div className="segmented">
        {[5, 10, 15, 20].map((value) => (
          <button
            type="button"
            key={value}
            className={minutes === value ? 'active' : ''}
            aria-pressed={minutes === value}
            onClick={() => onMinutes(value)}
          >
            {value} min
          </button>
        ))}
      </div>
      <textarea className="copy-box" data-copy-target="late" value={message} readOnly />
      <div className="button-grid">
        <button type="button" className="primary" onClick={() => onCopy('Late copied', message, '[data-copy-target="late"]')}>
          {copied === 'Late copied' ? 'Copied' : 'Copy message'}
        </button>
        <a className="secondary link-button" href={phoneProvider?.phone ? `tel:${phoneProvider.phone}` : '#'}>
          Call venue
        </a>
      </div>
      <p className="sheet-copy">{ranked.crowdBackup}</p>
    </SheetFrame>
  )
}

function SafetySheet({
  ranked,
  intake,
  copied,
  onCopy,
  onClose,
}: {
  ranked: RankedPlan
  intake: Intake
  copied: string
  onCopy: (label: string, text: string, selector?: string) => void
  onClose: () => void
}) {
  const text = safetyText(ranked, intake)
  return (
    <SheetFrame title="Safety share" onClose={onClose}>
      <textarea className="copy-box safety-copy" data-copy-target="safety-sheet" value={text} readOnly />
      <button type="button" className="primary wide" onClick={() => onCopy('Safety copied', text, '[data-copy-target="safety-sheet"]')}>
        {copied === 'Safety copied' ? 'Copied' : 'Copy safety text'}
      </button>
    </SheetFrame>
  )
}

function InviteSheet({
  ranked,
  intake,
  inviteDraft,
  onInviteDraft,
  copied,
  onCopy,
  onClose,
}: {
  ranked: RankedPlan
  intake: Intake
  inviteDraft: string
  onInviteDraft: (draft: string) => void
  copied: string
  onCopy: (label: string, text: string, selector?: string) => void
  onClose: () => void
}) {
  const inviteText = `${inviteDraft}

Plan: ${ranked.plan.title}
Meet: ${ranked.meetArea} at ${offsetTime(intake.dateStart, 0)}
Why it fits: ${ranked.reasons[0] ?? ranked.plan.shortPitch}
Booking note: ${bookingLabels[ranked.plan.bookingType]}`

  return (
    <SheetFrame title="Invite starter" onClose={onClose}>
      <p className="sheet-copy">Pick a tone, edit the message, and copy it yourself. LumaDate never auto-messages.</p>
      <div className="starter-list">
        {inviteStarters.map((starter) => (
          <button
            type="button"
            key={starter}
            className={inviteDraft === starter ? 'starter-card selected' : 'starter-card'}
            aria-pressed={inviteDraft === starter}
            onClick={() => onInviteDraft(starter)}
          >
            {starter}
          </button>
        ))}
      </div>
      <textarea
        className="copy-box"
        data-copy-target="invite"
        value={inviteText}
        onChange={(event) => onInviteDraft(event.target.value.split('\n\nPlan:')[0])}
      />
      <button type="button" className="primary wide" onClick={() => onCopy('Invite copied', inviteText, '[data-copy-target="invite"]')}>
        {copied === 'Invite copied' ? 'Copied' : 'Copy invite text'}
      </button>
    </SheetFrame>
  )
}

function AssistantSheet({ ranked, intake, onClose }: { ranked: RankedPlan; intake: Intake; onClose: () => void }) {
  const suggestions = [
    `${ranked.leaveBy}. ${ranked.trafficNote}.`,
    `If ${ranked.plan.title} feels crowded, pivot to ${ranked.plan.backupOptions[0] ?? 'a quieter nearby backup'}.`,
    `Keep it ${intake.moodTypes[0] ?? 'flexible'} and public: ${ranked.meetArea}.`,
  ]

  return (
    <SheetFrame title="Luma Assistant demo" onClose={onClose}>
      <p className="sheet-copy">
        Future assistant structure only. This demo does not track GPS, send messages, place calls,
        contact venues, or make reservations.
      </p>
      <div className="assistant-panel">
        <span className="eyebrow">Example suggestions</span>
        {suggestions.map((suggestion) => (
          <p key={suggestion}>{suggestion}</p>
        ))}
      </div>
      <div className="button-grid">
        <button type="button" className="secondary">
          Demo: re-rank if plans change
        </button>
        <button type="button" className="secondary">
          Demo: draft venue message
        </button>
        <button type="button" className="ghost">
          Demo only, confirmation required
        </button>
      </div>
      <p className="sheet-copy">
        Production version would require explicit permission, server-side providers, consent-aware messaging,
        and official maps/places APIs.
      </p>
    </SheetFrame>
  )
}

function ExitPlanSheet({
  copied,
  onCopy,
  onClose,
}: {
  copied: string
  onCopy: (label: string, text: string, selector?: string) => void
  onClose: () => void
}) {
  const exitMessages = [
    "I'm going to head out now. Thanks for meeting up.",
    "I'm not feeling well, so I'm going to call it a night.",
    'Something came up and I need to leave. Take care.',
    "I promised a friend I'd check in, so I'm heading out.",
    "I'm going to get my ride now. Have a good night.",
  ]
  const contactMessage = 'Can you call me in 5 minutes? I may need an easy exit from this date.'
  const firmMessages = ["I can't stay. I'm leaving now.", "Please don't follow me."]

  return (
    <SheetFrame title="Help me leave" onClose={onClose}>
      <p className="sheet-copy">
        Copy-only drafts for a low-pressure exit. LumaDate does not send messages, call anyone,
        or act as an emergency response service.
      </p>
      <p className="emergency-note">If you feel unsafe or are in immediate danger, contact emergency services or a trusted person directly.</p>
      <div className="exit-message-list">
        {exitMessages.map((message) => (
          <button
            type="button"
            className="starter-card"
            key={message}
            onClick={() => onCopy('Exit message copied', message)}
          >
            {message}
          </button>
        ))}
      </div>
      <div className="provider-note">
        <strong>Trusted contact</strong>
        <span>{contactMessage}</span>
      </div>
      <button type="button" className="primary wide" onClick={() => onCopy('Contact message copied', contactMessage)}>
        {copied === 'Contact message copied' ? 'Copied' : 'Copy trusted-contact text'}
      </button>
      <div className="note-list">
        {firmMessages.map((message) => (
          <button type="button" className="ghost" key={message} onClick={() => onCopy('Firm exit copied', message)}>
            {message}
          </button>
        ))}
      </div>
    </SheetFrame>
  )
}

function SheetFrame({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <section className="sheet">
        <div className="sheet-header">
          <h2>{title}</h2>
          <button ref={closeButtonRef} type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function publicStopDetails(ranked: RankedPlan, intake: Intake) {
  return ranked.plan.itinerary.map((step) => {
    const place = step.placeIndex === undefined ? undefined : ranked.plan.places?.[step.placeIndex]
    const outdoor = place ? /park|walk|garden|outdoor/i.test(place.category) : ranked.plan.safetyProfile.outdoor
    return {
      time: offsetTime(intake.dateStart, step.timeOffsetMinutes),
      title: step.title,
      placeName: place?.name ?? step.title,
      location: place ? `${place.neighborhood} · public place` : `${ranked.meetArea} · verify in app`,
      mapsLink: place?.mapsLink,
      reviewLink: place?.reviewLink,
      qualities: [
        ranked.plan.safetyProfile.publicPlace && 'public',
        ranked.plan.safetyProfile.indoor && !outdoor && 'indoors/staffed where available',
        outdoor && 'outdoor/public',
        ranked.plan.safetyProfile.goodForFirstDate && 'easy-exit friendly',
      ].filter(Boolean).join(' · '),
    }
  })
}

export function safetyText(ranked: RankedPlan, intake: Intake): string {
  const stops = publicStopDetails(ranked, intake)
    .map((stop) => `${stop.time} - ${stop.placeName} - ${stop.location}
Map: ${stop.mapsLink ?? 'verify in app'}
Notes: ${stop.qualities || 'public stop; verify before leaving'}`)
    .join('\n\n')

  return `LumaDate safety share
Plan: ${ranked.plan.title}
Public meet area: ${ranked.meetArea}
Date: ${formatPlanDate(intake.dateStart)}
Start: ${offsetTime(intake.dateStart, 0)}
Check-in: ${offsetTime(intake.dateStart, Math.min(ranked.plan.estimatedDurationMinutes, 150))}

Public stops:
${stops}

Last updated: ${new Date().toLocaleString()}
Private home/work addresses are not included.
Verify hours, route, and availability before leaving.`
}

export default App
