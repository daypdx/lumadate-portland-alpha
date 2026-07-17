import { describe, expect, it } from 'vitest'
import { createDefaultIntake, dateWindow, meetAreaFor, rankPlans, safetyText } from './App'

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
})
