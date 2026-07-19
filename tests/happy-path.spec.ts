import { expect, test, type Page } from '@playwright/test'

async function acknowledgeAndEnter(page: Page, buttonName: 'Build my Portland plan' | 'Preview an example') {
  await page.goto('/')
  await page.getByRole('button', { name: buttonName }).click()
  const dialog = page.getByRole('dialog', { name: 'Before you continue' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Continue' }).click()
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))).toBe(true)
}

test('landing acknowledgement is accessible, remembers the session, and preserves the destination', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Portland Alpha').first()).toBeVisible()
  await expect(page.locator('.welcome-hero-preview')).toHaveCount(0)
  await expect(page.getByText('No account or GPS')).toHaveCount(0)

  const buildButton = page.getByRole('button', { name: 'Build my Portland plan' })
  const previewButton = page.getByRole('button', { name: 'Preview an example' })
  const buildBox = await buildButton.boundingBox()
  const previewBox = await previewButton.boundingBox()
  expect(buildBox).not.toBeNull()
  expect(previewBox).not.toBeNull()
  expect(Math.abs((buildBox?.width ?? 0) - (previewBox?.width ?? 0))).toBeLessThan(2)
  expect(Math.abs((buildBox?.height ?? 0) - (previewBox?.height ?? 0))).toBeLessThan(2)

  await buildButton.click()
  const dialog = page.getByRole('dialog', { name: 'Before you continue' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Continue' })).toBeDisabled()
  await expect(dialog.getByText('never a private street address')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(buildButton).toBeFocused()

  await previewButton.click()
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Demo profile')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Three ways the date could go.' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Build my Portland plan' }).click()
  await expect(page.getByRole('dialog', { name: 'Before you continue' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Where should the date happen?' })).toBeVisible()
  await expect(page.getByText('Demo profile')).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
})

test('duration uses one stepped slider and every budget is total for the date', async ({ page }) => {
  await acknowledgeAndEnter(page, 'Build my Portland plan')
  await page.getByRole('button', { name: 'Next' }).click()

  const duration = page.getByRole('slider', { name: 'Date duration' })
  await expect(duration).toHaveCount(1)
  await expect(duration).toHaveValue('1')
  await expect(duration).toHaveAttribute('aria-valuetext', '2-3 hours')
  await duration.press('Home')
  await expect(duration).toHaveValue('0')
  await expect(duration).toHaveAttribute('aria-valuetext', '90 minutes')

  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'Food, drinks, and limits.' })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Budget basis' })).toHaveCount(0)
  await expect(page.getByText('Whole date', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Per person', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: /Custom max/ }).click()
  await expect(page.getByText(/total for the date/).first()).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'Review the plan brief.' })).toBeVisible()
  await expect(page.locator('.review-card').filter({ hasText: 'Time' })).toContainText('90 minutes')
  await expect(page.locator('.review-card').filter({ hasText: 'Budget' })).toContainText('total for the date')
  await expectNoHorizontalOverflow(page)
})

test('ranked results contain exactly three independently actionable plans', async ({ page }) => {
  await acknowledgeAndEnter(page, 'Preview an example')

  const cards = page.locator('article.result-card')
  await expect(cards).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Open plan', exact: true })).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Save for later', exact: true })).toHaveCount(3)
  await expect(cards.getByRole('button', { name: 'Adjust', exact: true })).toHaveCount(3)
  await expect(page.getByText('Curated Portland venue pool')).toHaveCount(0)

  const secondTitle = await cards.nth(1).getByRole('heading').innerText()
  await cards.nth(1).getByRole('button', { name: 'Save for later' }).click()
  await expect(page.getByRole('button', { name: 'Saved (1)' })).toBeVisible()
  await page.getByRole('button', { name: 'Saved (1)' }).click()
  const savedDialog = page.getByRole('dialog', { name: 'Saved plans' })
  await expect(savedDialog).toContainText(secondTitle)
  await expect(savedDialog.locator('.saved-card')).toHaveCount(1)
  await savedDialog.getByRole('button', { name: 'Close' }).click()

  await cards.first().getByRole('button', { name: 'Open plan' }).click()
  await expect(page.locator('.itinerary')).toBeVisible()
  await expect(page.locator('.itinerary').getByRole('button', { name: /save/i })).toHaveCount(0)
  await expect(page.locator('.itinerary').getByRole('heading', { name: 'Curated Portland venue pool' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Adjust plan' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Compare plans' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('venue changes live under Adjust and update an already-saved plan', async ({ page }) => {
  await acknowledgeAndEnter(page, 'Preview an example')
  const firstCard = page.locator('article.result-card').first()
  await firstCard.getByRole('button', { name: 'Save for later' }).click()
  await firstCard.getByRole('button', { name: 'Open plan' }).click()

  await page.getByRole('button', { name: 'Adjust plan' }).click()
  await page.getByRole('button', { name: 'Review or change venue' }).click()
  await expect(page.getByRole('heading', { name: 'Keep the recommended place or choose a nearby fit.' })).toBeVisible()
  const venues = page.locator('.curated-venue-card')
  await expect(venues).toHaveCount(4)
  await expect(venues.first()).toContainText('Selected venue')
  const alternativeName = await venues.nth(1).locator('strong').first().innerText()
  await venues.nth(1).getByRole('button', { name: 'Use this venue' }).click()
  await expect(page.locator('.toast')).toContainText(`Venue changed to ${alternativeName}`)
  await page.getByRole('button', { name: 'Return to itinerary' }).click()
  await expect(page.getByLabel('Plan summary')).toContainText(alternativeName)

  await page.getByRole('button', { name: 'Saved (1)' }).click()
  await expect(page.getByRole('dialog', { name: 'Saved plans' })).toContainText(`Venue: ${alternativeName}`)
  await expectNoHorizontalOverflow(page)
})

test('safety share still uses public itinerary stops and no private origin', async ({ page }) => {
  await acknowledgeAndEnter(page, 'Preview an example')
  await page.locator('article.result-card').first().getByRole('button', { name: 'Open plan' }).click()
  await page.getByRole('button', { name: 'Safety share' }).click()

  const safetyText = page.getByRole('dialog', { name: 'Safety share' }).getByRole('textbox')
  const value = await safetyText.inputValue()
  expect(value).toContain('Public stops:')
  expect(value).toContain('Private home/work addresses are not included.')
  expect(value).not.toContain('123 Private Street')
  await page.getByRole('button', { name: 'Close' }).click()
  await expectNoHorizontalOverflow(page)
})
