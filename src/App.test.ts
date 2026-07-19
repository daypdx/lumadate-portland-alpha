import { describe, expect, it } from 'vitest'
import plansJson from './data/datePlans.json'
import {
  canonicalPlanFor,
  calmExitMessages,
  createDefaultIntake,
  createExampleIntake,
  dateWindow,
  durationSettingFor,
  estimatedCostRange,
  inviteTextFor,
  looksLikeStreetAddress,
  meetAreaFor,
  normalizeIntake,
  planMatchesArea,
  publicStopDetails,
  rankPlans,
  safetyText,
  trustedContactMessage,
  type DatePlan,
  type RankedPlan,
} from './App'

describe('Portland alpha planning safeguards', () => {
  it('creates a current date window instead of a hardcoded launch date', () => {
    const now = new Date(2026, 6, 17, 15, 0)
    const intake = createDefaultIntake(now)
    const start = new Date(intake.dateStart)

    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(6)
    expect(start.getDate()).toBe(17)
    expect(start.getTime()).toBeGreaterThan(now.getTime())
  })

  it('moves the default to tomorrow when tonight is already over', () => {
    const now = new Date(2026, 6, 17, 22, 0)
    const start = new Date(createDefaultIntake(now).dateStart)

    expect(start.getDate()).toBe(18)
    expect(start.getHours()).toBe(18)
  })

  it('resolves This weekend to Saturday', () => {
    const friday = new Date(2026, 6, 17, 12, 0)
    const start = new Date(dateWindow(friday, 'weekend').dateStart)

    expect(start.getDay()).toBe(6)
  })

  it('never copies a private starting address into public plan text', () => {
    const intake = {
      ...createDefaultIntake(new Date(2026, 6, 17, 12, 0)),
      startLocation: '123 Private Street',
      meetingMode: 'near_me' as const,
    }
    const ranked = rankPlans(intake)[0]
    const meetArea = meetAreaFor(intake, ranked.plan)
    const publicText = safetyText({ ...ranked, meetArea }, intake)

    expect(meetArea).not.toContain('123 Private Street')
    expect(publicText).not.toContain('123 Private Street')
    expect(publicText).toContain('Date:')
  })

  it('keeps personal planning blank while the example profile is clearly seeded', () => {
    const now = new Date(2026, 6, 17, 12, 0)
    const personal = createDefaultIntake(now)
    const example = createExampleIntake(now)

    expect(personal.activityTypes).toEqual([])
    expect(personal.moodTypes).toEqual([])
    expect(personal.dateEnjoysText).toBe('')
    expect(personal.userEnjoysText).toBe('')
    expect(personal.mustAvoid).toBe('')
    expect(example.activityTypes.length).toBeGreaterThan(0)
    expect(example.dateEnjoysText).toContain('parks')
  })

  it('detects street-like input for visible privacy correction', () => {
    expect(looksLikeStreetAddress('1234 SE Privacy Leak St, Portland, OR')).toBe(true)
    expect(looksLikeStreetAddress('SE Portland')).toBe(false)
  })

  it('maps every safety stop through its explicit itinerary place reference', () => {
    const intake = createExampleIntake(new Date(2026, 6, 17, 12, 0))

    for (const plan of plansJson as DatePlan[]) {
      const ranked: RankedPlan = {
        plan,
        score: 0,
        reasons: [],
        warnings: [],
        meetArea: meetAreaFor(intake, plan),
        trafficNote: '',
        leaveBy: '',
        crowdForecast: '',
        crowdBackup: '',
        areaMatch: planMatchesArea(intake, plan),
        budgetFits: estimatedCostRange(plan.estimatedCostTotal).high <= intake.budgetMax,
        estimatedCostHigh: estimatedCostRange(plan.estimatedCostTotal).high,
      }
      const canonical = canonicalPlanFor(ranked, intake)
      const stops = publicStopDetails(ranked, intake)

      plan.itinerary.forEach((step, index) => {
        expect(step.id).toBeTruthy()
        expect(step.placeId).toBeTruthy()
        expect(stops[index].id).toBe(step.id)
        expect(stops[index].placeName).toBe(plan.places?.find((place) => place.id === step.placeId)?.name)
        expect(canonical.stops[index].place?.name).toBe(stops[index].placeName)
      })
    }
  })

  it('uses one canonical ordered schedule across itinerary, invite, safety, and Maps handoffs', () => {
    const intake = createExampleIntake(new Date(2026, 6, 17, 12, 0))

    for (const ranked of rankPlans(intake)) {
      const canonical = canonicalPlanFor(ranked, intake)
      const invite = inviteTextFor(ranked, intake, 'Want to try this plan?')
      const safety = safetyText(ranked, intake)

      expect(new Set(canonical.stops.map((stop) => stop.id)).size).toBe(canonical.stops.length)
      for (const stop of canonical.stops) {
        expect(invite).toContain(stop.title)
        expect(safety).toContain(stop.place?.name ?? stop.title)
      }
      expect(canonical.anchorPlace?.mapsLink).toMatch(/^https:\/\//)
      expect(canonical.meetArea).toBe(ranked.meetArea)
    }
  })

  it('keeps the best fit inside the selected area and full estimated budget range', () => {
    const intake = {
      ...createDefaultIntake(new Date(2026, 6, 17, 12, 0)),
      dateArea: 'SE Portland',
      budgetMax: 120,
      dateEnjoysText: 'sushi jazz bookstores',
    }
    const ranked = rankPlans(intake)

    expect(ranked[0].areaMatch).toBe(true)
    expect(ranked[0].budgetFits).toBe(true)
    expect(ranked[0].plan.neighborhoods).toContain('SE Portland')
    expect(ranked[0].estimatedCostHigh).toBeLessThanOrEqual(120)
    expect(ranked.find((item) => item.plan.id === 'jazz-sushi-bookstore-evening')?.warnings.join(' ')).toContain('over budget')
  })

  it('names the defining comedy venue as the plan anchor', () => {
    const intake = createDefaultIntake(new Date(2026, 6, 17, 12, 0))
    const comedy = rankPlans({ ...intake, dateArea: 'NE Portland', activityTypes: ['comedy'] })
      .find((ranked) => ranked.plan.id === 'comedy-mocktails')

    expect(comedy).toBeDefined()
    expect(canonicalPlanFor(comedy!, intake).anchorPlace?.name).toBe('Helium Comedy Club Portland')
  })

  it('surfaces dietary verification warnings in ranked plans', () => {
    const intake = {
      ...createDefaultIntake(new Date(2026, 6, 17, 12, 0)),
      dietaryLimits: 'peanut allergy',
    }
    const warnings = rankPlans(intake).flatMap((ranked) => ranked.warnings).join(' ')

    expect(warnings).toContain('peanut allergy')
    expect(warnings).toContain('Verify dietary needs directly')
  })

  it('penalizes food plans when the user says food is unnecessary', () => {
    const intake = {
      ...createDefaultIntake(new Date(2026, 6, 17, 12, 0)),
      foodWanted: 'no' as const,
    }
    const warnings = rankPlans(intake).flatMap((ranked) => ranked.warnings).join(' ')

    expect(warnings).toContain('food or drink stop')
  })

  it('maps the stepped duration slider to the three supported timing modes', () => {
    expect(durationSettingFor(0)).toEqual({ label: '90 minutes', mode: 'fixed_end', minutes: 90 })
    expect(durationSettingFor(1)).toEqual({ label: '2-3 hours', mode: 'flexible', minutes: 180 })
    expect(durationSettingFor(2)).toEqual({ label: 'Open-ended', mode: 'open_ended', minutes: 0 })
  })

  it('normalizes legacy per-person budgets to a total-date budget', () => {
    const legacy = { ...createDefaultIntake(), budgetMode: 'per_person' as const }

    expect(normalizeIntake(legacy).budgetMode).toBe('total')
  })

  it('uses the researched calm-exit set without exposing the safety arrangement', () => {
    expect(calmExitMessages).toHaveLength(4)
    expect(calmExitMessages[0]).toBe("I'm going to head out now. Thanks for meeting me.")
    expect(calmExitMessages.join(' ')).not.toContain("promised a friend I'd check in")
  })

  it('builds distinct trusted-contact messages using public plan details only', () => {
    const intake = {
      ...createExampleIntake(new Date(2026, 6, 17, 12, 0)),
      startLocation: '123 Private Street',
    }
    const ranked = rankPlans(intake)[0]
    const discreet = trustedContactMessage('call_five', ranked)
    const clear = trustedContactMessage('call_now', ranked)
    const urgent = trustedContactMessage('help_now', ranked)

    expect(discreet).toContain('call me in 5 minutes')
    expect(clear).toContain('Stay on the phone')
    expect(urgent).toContain(ranked.meetArea)
    expect(urgent).not.toContain('123 Private Street')
  })
})
