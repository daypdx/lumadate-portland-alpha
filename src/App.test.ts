import { describe, expect, it } from 'vitest'
import plansJson from './data/datePlans.json'
import { recommendablePortlandVenues } from './data/portlandVenues'
import { composeAiItinerarySafely, createAiItineraryRequest, mockItineraryComposer } from './ai/itineraryComposer'
import {
  canonicalPlanFor,
  aiCandidateInputsFor,
  aiCompositionDisclosure,
  aiCompositionToast,
  aiCompositionApplicationDecision,
  calmExitMessages,
  createAiGenerationCoordinator,
  createDefaultIntake,
  createExampleIntake,
  dateWindow,
  durationSettingFor,
  estimatedCostRange,
  inviteTextFor,
  looksLikeStreetAddress,
  meetAreaFor,
  normalizeIntake,
  nextAiVenueSelectionState,
  planMatchesArea,
  publicStopDetails,
  rankPlans,
  runCurrentAiGeneration,
  safetyText,
  syncSavedItinerariesAfterAiInvalidation,
  syncSavedItinerariesAfterIntakeReplacement,
  syncSavedItinerariesWithVenueSelections,
  trustedContactMessage,
  type DatePlan,
  type RankedPlan,
} from './App'

describe('Portland alpha planning safeguards', () => {
  function pearlJazzScenario(dateArea = 'Pearl District') {
    const intake = {
      ...createDefaultIntake(new Date(2026, 6, 17, 12, 0)),
      dateArea,
      budgetMax: 250,
      foodWanted: 'yes' as const,
      activityTypes: ['sushi', 'jazz', 'bookstore'],
      moodTypes: ['quiet', 'romantic'],
      dateEnjoysText: 'They like jazz, sushi, bookstores, and quiet places.',
    }
    const ranked = rankPlans(intake).find(({ plan }) => plan.id === 'jazz-sushi-bookstore-evening')
    const venue = recommendablePortlandVenues.find(({ id }) => id === 'piazza-italia-pearl')

    expect(ranked).toBeDefined()
    expect(venue).toBeDefined()
    return {
      intake,
      ranked: ranked!,
      venueMatch: {
        venue: venue!,
        score: 0,
        matchedTerms: [],
        reason: 'Actual curated Pearl District venue fixture',
      },
    }
  }

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

  it('resolves a multi-neighborhood meet area from the intake-matching neighborhood before deterministic fallback', () => {
    const { intake, ranked } = pearlJazzScenario()

    expect(meetAreaFor(intake, ranked.plan)).toBe('Pearl District public meet point')
    expect(meetAreaFor({ ...intake, dateArea: 'SE Portland' }, ranked.plan)).toBe('NW Portland public meet point')
  })

  it('gives the trusted selected canonical venue area priority over the intake-matching plan neighborhood', () => {
    const { intake, ranked, venueMatch } = pearlJazzScenario('NW Portland')
    const canonical = canonicalPlanFor(ranked, intake, {
      ...venueMatch,
      venue: {
        ...venueMatch.venue,
        name: 'Provider-authored venue name',
        area: 'Provider-authored private area',
      },
    })

    expect(canonical.meetArea).toBe('Pearl District public meet point')
    expect(canonical.anchorPlace?.id).toBe('piazza-italia-pearl')
    expect(canonical.anchorPlace?.name).toBe('Piazza Italia')
    expect(canonical.stops[0].place?.id).toBe('piazza-italia-pearl')
  })

  it.each(['automatic', 'mock-preview'] as const)(
    'keeps the actual Pearl District jazz plan canonical across the %s venue path',
    async (path) => {
      const { intake, ranked, venueMatch } = pearlJazzScenario()
      const candidates = aiCandidateInputsFor(intake, [ranked])
      const selectedVenueByPlan: Record<string, string> = {}

      expect(candidates[0].venueOptions[0]?.venueId).toBe('piazza-italia-pearl')
      if (path === 'mock-preview') {
        const request = createAiItineraryRequest({ intake, candidates })
        const composition = await composeAiItinerarySafely(request, mockItineraryComposer, { trustedMode: 'mock' })
        const selection = composition.plans.find(({ planId }) => planId === ranked.plan.id)
        expect(composition.providerMode).toBe('mock')
        expect(selection?.venueId).toBe('piazza-italia-pearl')
        selectedVenueByPlan[ranked.plan.id] = selection!.venueId!
      }

      const [saved] = syncSavedItinerariesWithVenueSelections([{
        id: `saved-${path}`,
        planId: ranked.plan.id,
        title: 'Stale title',
        meetArea: 'stale meet area',
        venueId: 'stale-venue',
        venueName: 'Stale venue',
        stopIds: ['stale-stop'],
        anchorName: 'Stale anchor',
        anchorMapsLink: 'https://example.com/stale',
        savedAt: '2026-07-20T00:00:00.000Z',
      }], selectedVenueByPlan, [ranked], intake)
      const canonical = canonicalPlanFor(ranked, intake, venueMatch)
      const invite = inviteTextFor(ranked, intake, 'Want to try this plan?', venueMatch)
      const safety = safetyText(ranked, intake, venueMatch)

      expect(canonical).toMatchObject({
        planId: 'jazz-sushi-bookstore-evening',
        title: 'Jazz, Sushi, and Quiet Bookstore Finish',
        meetArea: 'Pearl District public meet point',
        anchorPlace: { id: 'piazza-italia-pearl', name: 'Piazza Italia' },
      })
      expect(canonical.stops[0].place).toMatchObject({ id: 'piazza-italia-pearl', name: 'Piazza Italia' })
      expect(saved).toMatchObject({
        planId: canonical.planId,
        title: canonical.title,
        meetArea: canonical.meetArea,
        venueId: 'piazza-italia-pearl',
        venueName: 'Piazza Italia',
        anchorName: 'Piazza Italia',
      })
      expect(invite).toContain('Public meet area: Pearl District public meet point')
      expect(invite).toContain('Meet outside the dinner venue at Piazza Italia')
      expect(safety).toContain('Public meet area: Pearl District public meet point')
      expect(safety).toContain('Piazza Italia')
    },
  )

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

  it('builds AI candidates from hard plan eligibility and compatible active venues only', () => {
    const intake = {
      ...createExampleIntake(new Date(2026, 6, 17, 12, 0)),
      dateArea: 'SE Portland',
      budgetMax: 120,
      firstDateSafeMode: true,
      dietaryLimits: 'peanut allergy — private note',
    }
    const ranked = rankPlans(intake)
    const candidates = aiCandidateInputsFor(intake, ranked)

    expect(candidates).toHaveLength(ranked.length)
    candidates.forEach((candidate, index) => {
      expect(candidate.areaMatch).toBe(ranked[index].areaMatch)
      expect(candidate.budgetFits).toBe(ranked[index].budgetFits)
      expect(candidate.safetyEligible).toBe(
        ranked[index].plan.safetyProfile.publicPlace
        && ranked[index].plan.safetyProfile.goodForFirstDate
        && !ranked[index].plan.safetyProfile.alcoholCentric,
      )
      expect(candidate.venueOptions?.every((venue) => venue.areaMatch && venue.categoryMatch && venue.available)).toBe(true)
      expect(candidate.reasonCodes).toEqual(expect.arrayContaining([
        ...(ranked[index].areaMatch ? ['AREA_MATCH'] : []),
        ...(ranked[index].budgetFits ? ['BUDGET_MATCH'] : []),
      ]))
    })
    expect(JSON.stringify(candidates)).not.toContain(intake.dietaryLimits)
    expect(candidates[0]).not.toHaveProperty('title')
    expect(candidates[0]).not.toHaveProperty('reasons')
    expect(candidates[0]).not.toHaveProperty('warnings')

    expect(candidates.find((candidate) => candidate.planId === 'portland-park-restaurant-walk')?.reasonCodes)
      .toEqual(expect.arrayContaining(['QUIET_FIT', 'INTEREST_MATCH', 'BACKUP_AVAILABLE']))
    expect(candidates.find((candidate) => candidate.planId === 'coffee-art-low-pressure')?.reasonCodes)
      .toContain('WEATHER_SAFE')
  })

  it('keeps AI-selectable venues inside the canonical UI venue set', () => {
    const intake = {
      ...createExampleIntake(new Date(2026, 6, 17, 12, 0)),
      dateArea: 'SE Portland',
    }

    const candidates = aiCandidateInputsFor(intake, rankPlans(intake))

    expect(candidates.every((candidate) => candidate.venueOptions.length <= 4)).toBe(true)
  })

  it('hard-filters AI venues by selected area, budget tier, alcohol fit, kind, and status', () => {
    const intake = {
      ...createExampleIntake(new Date(2026, 6, 17, 12, 0)),
      dateArea: 'SE Portland',
      budgetMax: 120,
      alcoholPreference: 'avoid_bars' as const,
    }
    const base = rankPlans(intake)[0]
    const secondaryAreaPlan = {
      ...base,
      areaMatch: true,
      budgetFits: true,
      plan: { ...base.plan, neighborhoods: ['NW Portland', 'SE Portland'] },
    }
    const [candidate] = aiCandidateInputsFor(intake, [secondaryAreaPlan])
    const venues = candidate.venueOptions.map((option) => (
      recommendablePortlandVenues.find((venue) => venue.id === option.venueId)
    ))

    expect(venues.length).toBeGreaterThan(0)
    expect(venues.every((venue) => venue?.area === 'SE Portland')).toBe(true)
    expect(venues.every((venue) => (venue?.priceTierEstimate ?? 99) <= 2)).toBe(true)
    expect(venues.every((venue) => venue?.alcoholFit !== 'bar-forward')).toBe(true)
    expect(venues.every((venue) => venue?.kind === 'restaurant' && venue.status === 'active')).toBe(true)
  })

  it('keeps bar-tagged plans AI-ineligible when alcohol is excluded', () => {
    const intake = {
      ...createDefaultIntake(new Date(2026, 6, 17, 12, 0)),
      alcoholPreference: 'avoid_bars' as const,
    }
    const ranked = rankPlans(intake)[0]
    const barTaggedRanked = {
      ...ranked,
      plan: {
        ...ranked.plan,
        tags: [...ranked.plan.tags, 'bar'],
        safetyProfile: { ...ranked.plan.safetyProfile, alcoholCentric: false },
      },
    }

    expect(aiCandidateInputsFor(intake, [barTaggedRanked])[0].safetyEligible).toBe(false)
  })

  it('labels mock composition and deterministic fallback truthfully', () => {
    expect(aiCompositionDisclosure('mock')).toEqual({
      eyebrow: 'AI foundation preview',
      title: 'AI foundation preview — safe mock, no hosted model connected',
      detail: 'LumaDate controls every plan, venue, and visible explanation shown below.',
    })
    expect(aiCompositionDisclosure('fallback')).toEqual({
      eyebrow: 'Deterministic fallback',
      title: 'AI preview unavailable — no AI selection applied',
      detail: 'LumaDate kept the original deterministic plan ranking and eligible venue choices.',
    })
    expect(aiCompositionToast('mock')).toBe('Safe mock composition generated - pick one to inspect.')
    expect(aiCompositionToast('fallback')).toBe('AI preview unavailable - deterministic plans kept.')
  })

  it.each([
    ['mock', 'AI foundation preview — safe mock, no hosted model connected', 'Safe mock composition generated'],
    ['hosted', 'AI-assisted composition — validated by LumaDate', 'Validated AI composition generated'],
  ] as const)('selects disclosure and toast from trusted %s invocation context, not response metadata', async (
    trustedMode,
    expectedTitle,
    expectedToast,
  ) => {
    const request = createAiItineraryRequest({
      intake: createDefaultIntake(new Date(2026, 6, 17, 12, 0)),
      candidates: [{
        planId: 'trusted-plan',
        estimatedCostHigh: 40,
        durationMinutes: 90,
        areaMatch: true,
        budgetFits: true,
        safetyEligible: true,
        venueOptions: [],
        reasonCodes: ['AREA_MATCH'],
      }],
    })
    const result = await composeAiItinerarySafely(
      request,
      {
        compose: async () => ({
          schemaVersion: 1,
          primaryPlanId: 'trusted-plan',
          plans: [{ planId: 'trusted-plan', reasonCodes: ['AREA_MATCH'] }],
          verificationRequired: true,
        }),
      },
      { trustedMode },
    )

    const decision = aiCompositionApplicationDecision(result)

    expect(result.providerMode).toBe(trustedMode)
    expect(decision.disclosure.title).toBe(expectedTitle)
    expect(decision.toast).toContain(expectedToast)
  })

  it('keeps the original active plan when fallback chooses a later eligible candidate', async () => {
    const intake = createDefaultIntake(new Date(2026, 6, 17, 12, 0))
    const request = createAiItineraryRequest({
      intake,
      candidates: [
        {
          planId: 'ranked-first-ineligible',
          estimatedCostHigh: 40,
          durationMinutes: 90,
          areaMatch: false,
          budgetFits: true,
          safetyEligible: true,
          venueOptions: [],
          reasonCodes: [],
        },
        {
          planId: 'later-eligible',
          estimatedCostHigh: 50,
          durationMinutes: 120,
          areaMatch: true,
          budgetFits: true,
          safetyEligible: true,
          venueOptions: [{
            venueId: 'fallback-venue',
            areaMatch: true,
            categoryMatch: true,
            available: true,
          }],
          reasonCodes: ['AREA_MATCH'],
        },
      ],
    })
    const fallback = await composeAiItinerarySafely(
      request,
      { compose: async () => ({ unexpected: 'invalid provider response' }) },
      { trustedMode: 'mock' },
    )
    const decision = aiCompositionApplicationDecision(fallback)
    let activePlanId = request.candidates[0].planId
    if (decision.activePlanId) activePlanId = decision.activePlanId

    expect(fallback.primaryPlanId).toBe('later-eligible')
    expect(activePlanId).toBe('ranked-first-ineligible')
    expect(decision.displayedPlans).toEqual([])
    expect(decision.disclosure.title).toBe('AI preview unavailable — no AI selection applied')
    expect(decision.toast).toBe('AI preview unavailable - deterministic plans kept.')
  })

  it('tracks AI venue ownership explicitly and preserves later manual choices', () => {
    const priorComposition = {
      schemaVersion: 1 as const,
      providerMode: 'mock' as const,
      primaryPlanId: 'plan-a',
      plans: [{ planId: 'plan-a', venueId: 'ai-venue', reasonCodes: [] }],
      verificationRequired: true as const,
    }
    const fallbackComposition = {
      schemaVersion: 1 as const,
      providerMode: 'fallback' as const,
      primaryPlanId: 'plan-a',
      plans: [{ planId: 'plan-a', venueId: 'fallback-venue', reasonCodes: [] }],
      verificationRequired: true as const,
    }
    const nextComposition = {
      ...priorComposition,
      plans: [{ planId: 'plan-a', venueId: 'next-ai-venue', reasonCodes: [] }],
    }

    expect(nextAiVenueSelectionState(
      { 'plan-a': 'ai-venue', 'manual-plan': 'manual-venue' },
      { 'plan-a': 'ai-venue' },
      fallbackComposition,
    )).toEqual({
      selectedVenueByPlan: { 'manual-plan': 'manual-venue' },
      ownedByAi: {},
    })
    expect(nextAiVenueSelectionState(
      { 'plan-a': 'manual-override' },
      {},
      fallbackComposition,
    ).selectedVenueByPlan).toEqual({ 'plan-a': 'manual-override' })
    expect(nextAiVenueSelectionState(
      { 'plan-a': 'manual-override' },
      {},
      nextComposition,
    ).selectedVenueByPlan).toEqual({ 'plan-a': 'manual-override' })
    expect(nextAiVenueSelectionState(
      { 'plan-a': 'ai-venue' },
      {},
      fallbackComposition,
    ).selectedVenueByPlan).toEqual({ 'plan-a': 'ai-venue' })
  })

  it('aborts and ignores superseded or explicitly invalidated AI generations', async () => {
    const coordinator = createAiGenerationCoordinator()
    const applied: string[] = []
    let firstSignal: AbortSignal | undefined
    let resolveFirst!: (value: string) => void
    const firstResult = runCurrentAiGeneration(
      coordinator,
      (signal) => {
        firstSignal = signal
        return new Promise<string>((resolve) => { resolveFirst = resolve })
      },
      (value) => applied.push(value),
    )

    const secondResult = runCurrentAiGeneration(
      coordinator,
      async () => 'second',
      (value) => applied.push(value),
    )
    expect(await secondResult).toBe(true)
    resolveFirst('stale first')
    expect(await firstResult).toBe(false)
    expect(firstSignal?.aborted).toBe(true)

    let invalidatedSignal: AbortSignal | undefined
    let resolveInvalidated!: (value: string) => void
    const invalidatedResult = runCurrentAiGeneration(
      coordinator,
      (signal) => {
        invalidatedSignal = signal
        return new Promise<string>((resolve) => { resolveInvalidated = resolve })
      },
      (value) => applied.push(value),
    )
    coordinator.invalidate()
    resolveInvalidated('stale after intake edit')

    expect(await invalidatedResult).toBe(false)
    expect(invalidatedSignal?.aborted).toBe(true)
    expect(applied).toEqual(['second'])
  })

  it('canonicalizes a stale saved title even when its plan drops out of the current top three', () => {
    const intake = createExampleIntake(new Date(2026, 6, 17, 12, 0))
    const ranked = rankPlans(intake)
    const target = ranked[0]
    const venueId = aiCandidateInputsFor(intake, ranked)[0].venueOptions[0].venueId
    const saved = [{
      id: 'saved-plan',
      planId: target.plan.id,
      title: 'Stale saved title',
      meetArea: 'stale meet area',
      venueId: 'stale-venue',
      venueName: 'Stale venue',
      stopIds: ['stale-stop'],
      anchorName: 'Stale anchor',
      anchorMapsLink: 'https://example.com/stale',
      savedAt: '2026-07-19T00:00:00.000Z',
    }]

    const [updated] = syncSavedItinerariesWithVenueSelections(
      saved,
      { [target.plan.id]: venueId },
      ranked.filter((candidate) => candidate.plan.id !== target.plan.id),
      intake,
    )

    expect(updated.title).toBe(target.plan.title)
    expect(updated.venueId).toBe(venueId)
    expect(updated.venueName).not.toBe('Stale venue')
    expect(updated.meetArea).not.toBe('stale meet area')
    expect(updated.stopIds).not.toEqual(['stale-stop'])
    expect(updated.anchorName).not.toBe('Stale anchor')
    expect(updated.anchorMapsLink).toMatch(/^https:\/\//)
  })

  it('canonicalizes a stale saved title on intake invalidation without AI-owned venues', () => {
    const nextIntake = createDefaultIntake(new Date(2026, 6, 17, 12, 0))
    const topPlanIds = new Set(rankPlans(nextIntake).map((ranked) => ranked.plan.id))
    const outsideTopThree = plansJson.find((plan) => !topPlanIds.has(plan.id))!
    const saved = [{
      id: 'saved-outside-top-three',
      planId: outsideTopThree.id,
      title: 'Stale saved title',
      meetArea: 'stale meet area',
      venueId: 'stale-venue',
      venueName: 'Stale venue',
      stopIds: ['stale-stop'],
      anchorName: 'Stale anchor',
      anchorMapsLink: 'https://example.com/stale',
      savedAt: '2026-07-19T00:00:00.000Z',
    }]

    const [updated] = syncSavedItinerariesAfterAiInvalidation(
      saved,
      {},
      {},
      nextIntake,
    )

    expect(updated.title).toBe(outsideTopThree.title)
    expect(updated.meetArea).not.toBe('stale meet area')
    expect(updated.venueId).not.toBe('stale-venue')
    expect(updated.venueName).not.toBe('Stale venue')
    expect(updated.stopIds).not.toEqual(['stale-stop'])
    expect(updated.anchorName).not.toBe('Stale anchor')
    expect(updated.anchorMapsLink).not.toBe('https://example.com/stale')
  })

  it.each([
    ['fresh', createDefaultIntake(new Date(2026, 6, 17, 12, 0))],
    ['demo', createExampleIntake(new Date(2026, 6, 17, 12, 0))],
  ])('canonicalizes a stale saved title for %s intake replacement', (_mode, nextIntake) => {
    const topPlanIds = new Set(rankPlans(nextIntake).map((ranked) => ranked.plan.id))
    const outsideTopThree = plansJson.find((plan) => !topPlanIds.has(plan.id))!
    const saved = [{
      id: 'retained-saved-plan',
      planId: outsideTopThree.id,
      title: 'Stale saved title',
      meetArea: 'stale meet area',
      venueId: 'stale-venue',
      venueName: 'Stale venue',
      stopIds: ['stale-stop'],
      anchorName: 'Stale anchor',
      anchorMapsLink: 'https://example.com/stale',
      savedAt: '2026-07-19T00:00:00.000Z',
    }]

    const [updated] = syncSavedItinerariesAfterIntakeReplacement(saved, nextIntake)

    expect(updated.title).toBe(outsideTopThree.title)
    expect(updated.meetArea).not.toBe('stale meet area')
    expect(updated.venueId).not.toBe('stale-venue')
    expect(updated.stopIds).not.toEqual(['stale-stop'])
    expect(updated.anchorName).not.toBe('Stale anchor')
    expect(updated.anchorMapsLink).not.toBe('https://example.com/stale')
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
