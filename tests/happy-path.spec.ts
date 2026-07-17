import { expect, test } from '@playwright/test'

test('first-time planning opens Step 1 without an empty Saved modal', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Portland controlled alpha').first()).toBeVisible()
  await page.getByRole('button', { name: 'Start planning' }).click()
  await expect(page.getByRole('heading', { name: 'Where should the date happen?' })).toBeVisible()

  await page.getByRole('button', { name: 'Saved 0' }).click()
  await expect(page.getByText('No saved plans yet.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Where should the date happen?' })).toBeVisible()
})

test('Step 2 exposes exactly one selected date preset', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start planning' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'When and how flexible?' })).toBeVisible()

  const presets = page.getByRole('group', { name: 'Date presets' }).getByRole('button')
  await expect(presets).toHaveCount(3)
  await expect(page.locator('[role="group"][aria-label="Date presets"] button[aria-pressed="true"]')).toHaveCount(1)
})

test('example route reaches itinerary, adjustment preview, and demo reminders', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Show me an example' }).click()
  await expect(page.getByRole('heading', { name: 'Pick the plan before we build the full itinerary.' })).toBeVisible()
  await page.getByRole('button', { name: 'Use this plan' }).click()
  await expect(page.locator('.itinerary')).toBeVisible()

  await page.getByRole('button', { name: 'Adjust plan' }).click()
  await expect(page.getByRole('heading', { name: 'Preview an adjusted plan, then keep it or choose another change.' })).toBeVisible()
  await page.getByRole('button', { name: /Make cheaper/ }).click()
  await page.getByRole('button', { name: 'Keep adjusted plan' }).click()
  await expect(page.locator('.itinerary')).toBeVisible()

  await page.getByRole('button', { name: 'Set reminders' }).click()
  await expect(page.getByRole('dialog', { name: 'Demo reminder setup' })).toBeVisible()
  await expect(page.getByText('These are copyable demo reminders only.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Demo reminder setup' })).toBeHidden()
})
