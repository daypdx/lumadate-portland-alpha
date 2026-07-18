import { expect, test } from '@playwright/test'

test('first-time planning opens Step 1 without an empty Saved modal', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Portland controlled alpha').first()).toBeVisible()
  await page.getByRole('button', { name: 'Build my Portland plan' }).click()
  await expect(page.getByRole('heading', { name: 'Where should the date happen?' })).toBeVisible()

  await page.getByRole('button', { name: 'Saved 0' }).click()
  await expect(page.getByText('No saved plans yet.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Where should the date happen?' })).toBeVisible()
})

test('Step 2 exposes exactly one selected date preset', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Build my Portland plan' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'When and how flexible?' })).toBeVisible()

  const presets = page.getByRole('group', { name: 'Date presets' }).getByRole('button')
  await expect(presets).toHaveCount(3)
  await expect(page.locator('[role="group"][aria-label="Date presets"] button[aria-pressed="true"]')).toHaveCount(1)
})

test('personal planning starts clean and corrects street-like input before advancing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Build my Portland plan' }).click()
  await expect(page.getByText('Demo profile')).toHaveCount(0)

  await page.getByPlaceholder('City or neighborhood').fill('1234 SE Privacy Leak St, Portland, OR')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('alert')).toContainText('We replaced the street address with Portland, OR.')
  await expect(page.getByRole('heading', { name: 'Where should the date happen?' })).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'When and how flexible?' })).toBeVisible()
})

test('example route stays labeled and its safety share matches the visible itinerary', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Preview a clearly labeled demo' }).click()
  await expect(page.getByText('Demo profile')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pick the plan before we build the full itinerary.' })).toBeVisible()
  await page.getByRole('button', { name: 'Open selected itinerary' }).click()
  await expect(page.locator('.itinerary')).toBeVisible()
  await expect.poll(() => page.locator('.bottom-nav').evaluate((element) => getComputedStyle(element).position)).toBe('static')
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)

  await page.getByRole('button', { name: 'Safety share' }).click()
  const safetyText = page.getByRole('dialog', { name: 'Safety share' }).getByRole('textbox')
  const safetyValue = await safetyText.inputValue()
  const safetyStops = safetyValue.split('Public stops:')[1]
  expect(safetyValue).toContain('Date:')
  expect(safetyStops.match(/Laurelhurst Park/g)).toHaveLength(2)
  expect(safetyStops.indexOf('Laurelhurst Market')).toBeGreaterThan(safetyStops.lastIndexOf('Laurelhurst Park'))
  expect(safetyStops.indexOf('Rimsky-Korsakoffee House')).toBeGreaterThan(safetyStops.indexOf('Laurelhurst Market'))
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Adjust' }).click()
  await expect(page.getByRole('heading', { name: 'Preview an adjusted plan, then keep it or choose another change.' })).toBeVisible()
  await page.getByRole('button', { name: /Make cheaper/ }).click()
  await page.getByRole('button', { name: 'Keep adjusted plan' }).click()
  await expect(page.locator('.itinerary')).toBeVisible()

  await page.getByRole('button', { name: 'Safety share' }).click()
  const adjustedSafetyValue = await page.getByRole('dialog', { name: 'Safety share' }).getByRole('textbox').inputValue()
  const adjustedSafetyStops = adjustedSafetyValue.split('Public stops:')[1]
  expect(adjustedSafetyStops.indexOf('Portland Art Museum')).toBeGreaterThan(adjustedSafetyStops.indexOf('Barista Pearl District'))
  expect(adjustedSafetyStops.indexOf('Pix Patisserie')).toBeGreaterThan(adjustedSafetyStops.indexOf('Portland Art Museum'))
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Alerts' }).click()
  await page.getByRole('button', { name: 'Edit demo reminders' }).click()
  await expect(page.getByRole('dialog', { name: 'Demo reminder setup' })).toBeVisible()
  await expect(page.getByText('These are copyable demo reminders only.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Demo reminder setup' })).toBeHidden()
})
