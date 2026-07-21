import { expect, test, type Page } from '@playwright/test'

async function acknowledgeAndEnter(
  page: Page,
  buttonName: 'Build my date plan' | 'See a Portland example',
  path = '/',
) {
  await page.goto(path)
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

async function generatePearlJazzPlan(page: Page, path: '/' | '/?aiPreview=mock') {
  await acknowledgeAndEnter(page, 'Build my date plan', path)
  await page.getByLabel('Planning area').selectOption('Pearl District')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('radio', { name: 'indoor' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('radio', { name: 'Include food' }).click()
  await page.getByRole('button', { name: 'Treat night' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'sushi', exact: true }).click()
  await page.getByRole('button', { name: 'jazz', exact: true }).click()
  await page.getByText('Culture & activity', { exact: true }).click()
  await page.getByRole('button', { name: 'bookstore', exact: true }).click()
  await page.getByLabel('What have they told you they enjoy?').fill('They like jazz, sushi, bookstores, and quiet places.')
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Generate options' }).click()
}

test('landing acknowledgement is accessible, remembers the session, and preserves the destination', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Portland controlled alpha').first()).toBeVisible()
  await expect(page.locator('.welcome-hero-preview')).toHaveCount(0)
  await expect(page.getByText('No account or GPS')).toHaveCount(0)

  const buildButton = page.getByRole('button', { name: 'Build my date plan' })
  const previewButton = page.getByRole('button', { name: 'See a Portland example' })
  const buildBox = await buildButton.boundingBox()
  const previewBox = await previewButton.boundingBox()
  expect(buildBox).not.toBeNull()
  expect(previewBox).not.toBeNull()
  expect(Math.abs((buildBox?.width ?? 0) - (previewBox?.width ?? 0))).toBeLessThan(2)
  expect(Math.abs((buildBox?.height ?? 0) - (previewBox?.height ?? 0))).toBeLessThan(2)

  await buildButton.click()
  const dialog = page.getByRole('dialog', { name: 'Before you continue' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('.welcome-panel')).toHaveAttribute('aria-hidden', 'true')
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
  await page.getByRole('button', { name: 'Build my date plan' }).click()
  await expect(page.getByRole('dialog', { name: 'Before you continue' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Where should the date happen?' })).toBeVisible()
  await expect(page.getByText('Demo profile')).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
})

test('duration uses one stepped slider and every budget is total for the date', async ({ page }) => {
  await acknowledgeAndEnter(page, 'Build my date plan')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'When and how flexible?' })).toBeFocused()

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
  await acknowledgeAndEnter(page, 'See a Portland example')

  const cards = page.locator('article.result-card')
  await expect(cards).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Open plan', exact: true })).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Save for later', exact: true })).toHaveCount(3)
  await expect(cards.getByRole('button', { name: 'Adjust', exact: true })).toHaveCount(3)
  await expect(page.getByText('Curated Portland venue pool')).toHaveCount(0)
  await expect(cards.nth(1)).toContainText('Barista Pearl District')
  await expect(cards.nth(2)).toContainText('Helium Comedy Club Portland')

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
  await acknowledgeAndEnter(page, 'See a Portland example')
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

test('synchronizing a stale saved title keeps the saved card and opened itinerary canonical', async ({ page }) => {
  const canonicalTitle = 'Jazz, Sushi, and Quiet Bookstore Finish'
  await page.addInitScript(() => {
    localStorage.setItem('lumadate-saved', JSON.stringify([{
      id: 'saved-jazz-plan',
      planId: 'jazz-sushi-bookstore-evening',
      title: 'Stale saved title',
      meetArea: 'stale meet area',
      venueId: 'stale-venue',
      venueName: 'Stale venue',
      stopIds: ['stale-stop'],
      anchorName: 'Stale anchor',
      anchorMapsLink: 'https://example.com/stale',
      savedAt: '2026-07-20T00:00:00.000Z',
    }]))
  })
  await acknowledgeAndEnter(page, 'See a Portland example')

  await expect(page.locator('article.result-card[data-plan-id="jazz-sushi-bookstore-evening"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Saved (1)' }).click()
  const savedCard = page.locator('.saved-card').filter({ hasText: canonicalTitle })
  await expect(savedCard.locator('strong')).toHaveText(canonicalTitle)
  await expect(savedCard).not.toContainText('Stale saved title')
  const savedVenue = (await savedCard.locator('small').innerText()).replace('Venue: ', '')
  await savedCard.getByRole('button', { name: 'Open' }).click()

  const itinerary = page.locator('.itinerary')
  await expect(itinerary).toHaveAttribute('data-plan-id', 'jazz-sushi-bookstore-evening')
  await expect(itinerary).not.toHaveAttribute('data-venue-id', '')
  const planSummary = page.getByLabel('Plan summary')
  await expect(planSummary.getByRole('heading')).toHaveText(canonicalTitle)
  await expect(planSummary).toContainText(savedVenue)
})

test('safety share still uses public itinerary stops and no private origin', async ({ page }) => {
  await acknowledgeAndEnter(page, 'See a Portland example')
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

test('the selected plan keeps one venue schedule across itinerary, invite, safety, and Maps', async ({ page }) => {
  await acknowledgeAndEnter(page, 'See a Portland example')
  const firstCard = page.locator('article.result-card').first()
  await expect(firstCard).toContainText('SE Portland public meet point')
  await expect(firstCard).toContainText('$70-$110 example total')
  await firstCard.getByRole('button', { name: 'Open plan' }).click()

  const timelinePlaces = (await page.locator('.timeline-place').allTextContents())
    .map((value) => value.split(' · ')[0].trim())
  expect(timelinePlaces.length).toBeGreaterThan(2)

  const mapHref = await page.getByRole('link', { name: 'Open anchor in Maps' }).getAttribute('href')
  expect(mapHref).toContain('Laurelhurst')

  await page.getByRole('button', { name: 'Copy invite' }).click()
  await expect(page.locator('.toast-region')).toContainText(/Invite copied|Copy blocked/)

  await page.getByText('More tools', { exact: true }).click()
  await page.getByRole('button', { name: 'Edit invite' }).click()
  const invite = await page.getByRole('dialog', { name: 'Invite starter' }).getByRole('textbox').inputValue()
  for (const place of new Set(timelinePlaces)) expect(invite).toContain(place)
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Safety share' }).click()
  const safety = await page.getByRole('dialog', { name: 'Safety share' }).getByRole('textbox').inputValue()
  for (const place of new Set(timelinePlaces)) expect(safety).toContain(place)
  await page.getByRole('button', { name: 'Copy safety text' }).click()
  await expect(page.locator('.toast-region')).toContainText(/Safety copied|Copy blocked/)
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Running late' }).click()
  const lateDialog = page.getByRole('dialog', { name: 'Running-late assistant' })
  await expect(lateDialog.getByRole('link', { name: 'Find phone number in Maps' })).toHaveAttribute('href', /^https:\/\//)
  await expect(lateDialog.getByText('Call venue', { exact: true })).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
})

for (const mode of ['automatic', 'mock-preview'] as const) {
  test(`${mode} multi-neighborhood selection keeps the Pearl venue and public meet identity canonical`, async ({ page }) => {
    const planId = 'jazz-sushi-bookstore-evening'
    const title = 'Jazz, Sushi, and Quiet Bookstore Finish'
    const venueId = 'piazza-italia-pearl'
    const venueName = 'Piazza Italia'
    const meetArea = 'Pearl District public meet point'
    await generatePearlJazzPlan(page, mode === 'automatic' ? '/' : '/?aiPreview=mock')

    const card = page.locator(`article.result-card[data-plan-id="${planId}"]`)
    await expect(card).toBeVisible()
    await expect(card).toHaveAttribute('data-venue-id', venueId)
    await expect(card).toContainText(venueName)
    await expect(card).toContainText(meetArea)
    if (mode === 'mock-preview') {
      await expect(page.getByLabel('AI composition summary')).toContainText('AI foundation preview — safe mock')
      await expect(card).toHaveAttribute('data-ai-venue-id', venueId)
    } else {
      await expect(card).toHaveAttribute('data-ai-venue-id', '')
    }

    await card.getByRole('button', { name: 'Save for later' }).click()
    const savedRecord = await page.evaluate((expectedPlanId) => {
      const records = JSON.parse(localStorage.getItem('lumadate-saved') ?? '[]') as Array<Record<string, unknown>>
      return records.find((record) => record.planId === expectedPlanId)
    }, planId)
    expect(savedRecord).toMatchObject({
      planId,
      title,
      meetArea,
      venueId,
      venueName,
      anchorName: venueName,
    })

    await page.getByRole('button', { name: 'Saved (1)' }).click()
    const savedCard = page.locator('.saved-card').filter({ hasText: title })
    await expect(savedCard).toContainText(meetArea)
    await expect(savedCard).toContainText(`Venue: ${venueName}`)
    await savedCard.getByRole('button', { name: 'Open' }).click()

    const itinerary = page.locator('.itinerary')
    await expect(itinerary).toHaveAttribute('data-plan-id', planId)
    await expect(itinerary).toHaveAttribute('data-venue-id', venueId)
    const summary = page.getByLabel('Plan summary')
    await expect(summary.getByRole('heading')).toHaveText(title)
    await expect(summary).toContainText(venueName)
    await expect(summary).toContainText(meetArea)
    await expect(page.locator('.timeline-row').first()).toContainText(venueName)
    await expect(page.getByRole('link', { name: 'Open anchor in Maps' })).toHaveAttribute('href', /Piazza/)

    await page.getByText('More tools', { exact: true }).click()
    await page.getByRole('button', { name: 'Edit invite' }).click()
    const invite = await page.getByRole('dialog', { name: 'Invite starter' }).getByRole('textbox').inputValue()
    expect(invite).toContain(`Public meet area: ${meetArea}`)
    expect(invite).toContain(`Meet outside the dinner venue at ${venueName}`)
    await page.getByRole('button', { name: 'Close' }).click()

    await page.getByRole('button', { name: 'Safety share' }).click()
    const safety = await page.getByRole('dialog', { name: 'Safety share' }).getByRole('textbox').inputValue()
    expect(safety).toContain(`Public meet area: ${meetArea}`)
    expect(safety).toContain(venueName)
    await page.getByRole('button', { name: 'Close' }).click()
    await expectNoHorizontalOverflow(page)
  })
}

test('guided generation remains deterministic unless the internal mock preview is enabled', async ({ page }) => {
  await acknowledgeAndEnter(page, 'Build my date plan')

  for (let step = 0; step < 6; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: 'Generate options' }).click()

  await expect(page.getByRole('heading', { name: 'Three ways the date could go.' })).toBeVisible()
  await expect(page.getByLabel('AI composition summary')).toHaveCount(0)
  await expect(page.getByText('AI foundation preview — safe mock, no hosted model connected', { exact: true })).toHaveCount(0)
})

test('internal mock preview discloses the provider-neutral AI composition', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await acknowledgeAndEnter(page, 'Build my date plan', '/?aiPreview=mock')

  for (let step = 0; step < 6; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: 'Generate options' }).click()

  await expect(page.getByRole('heading', { name: 'Three ways the date could go.' })).toBeVisible()
  const aiSummary = page.getByLabel('AI composition summary')
  await expect(aiSummary.getByText('AI foundation preview — safe mock, no hosted model connected', { exact: true })).toBeVisible()
  await expect(aiSummary).toContainText('controls every plan, venue, and visible explanation')

  const primaryPlanId = await aiSummary.getAttribute('data-primary-plan-id')
  expect(primaryPlanId).toBeTruthy()
  const selectedCard = page.locator('article.result-card.selected')
  await expect(selectedCard).toHaveAttribute('data-plan-id', primaryPlanId!)
  const aiVenueId = await selectedCard.getAttribute('data-ai-venue-id')
  expect(aiVenueId).toBeTruthy()
  await expect(selectedCard).toHaveAttribute('data-venue-id', aiVenueId!)

  await selectedCard.getByRole('button', { name: 'Open plan' }).click()
  const itinerary = page.locator('.itinerary')
  await expect(itinerary).toHaveAttribute('data-plan-id', primaryPlanId!)
  await expect(itinerary).toHaveAttribute('data-venue-id', aiVenueId!)
  await expectNoHorizontalOverflow(page)
})

test('internal mock preview discloses deterministic fallback when no AI candidate is eligible', async ({ page }) => {
  await acknowledgeAndEnter(page, 'Build my date plan', '/?aiPreview=mock')

  for (let step = 0; step < 3; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: /Custom max/ }).click()
  await page.locator('.custom-budget-control input[type="range"]').press('Home')
  for (let step = 0; step < 3; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: 'Generate options' }).click()

  const aiSummary = page.getByLabel('AI composition summary')
  await expect(aiSummary.getByText('AI preview unavailable — no AI selection applied', { exact: true })).toBeVisible()
  await expect(page.locator('.toast-region')).toContainText('AI preview unavailable - deterministic plans kept.')
  await expect(page.locator('.toast-region')).not.toContainText('Safe mock composition generated')
})

test('changing eligibility after mock composition clears stale AI selections', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await acknowledgeAndEnter(page, 'Build my date plan', '/?aiPreview=mock')

  for (let step = 0; step < 6; step += 1) {
    await page.getByRole('button', { name: 'Next' }).click()
  }
  await page.getByRole('button', { name: 'Generate options' }).click()

  await expect(page.getByLabel('AI composition summary')).toBeVisible()
  const cardsWithAiVenue = page.locator('article.result-card[data-ai-venue-id]:not([data-ai-venue-id=""])')
  await expect(cardsWithAiVenue).not.toHaveCount(0)
  await page.getByRole('checkbox', { name: /First-date safe/ }).uncheck()

  await expect(page.getByLabel('AI composition summary')).toHaveCount(0)
  await expect(cardsWithAiVenue).toHaveCount(0)
})

test('Help me leave separates calm exits, trusted-contact urgency, and emergency guidance', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        ;(window as Window & { __sharedText?: string }).__sharedText = data.text
      },
    })
  })
  await acknowledgeAndEnter(page, 'See a Portland example')
  await page.getByRole('button', { name: 'Alerts', exact: true }).click()
  await page.getByRole('button', { name: 'Help me leave', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Help me leave' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("I'm going to head out now. Thanks for meeting me.")).toBeVisible()
  await expect(dialog.getByText("I'm not feeling well, so I'm going to call it a night.")).toBeVisible()
  await expect(dialog.getByText("I promised a friend I'd check in, so I'm heading out.")).toHaveCount(0)
  await expect(dialog.getByRole('radiogroup', { name: 'Trusted contact urgency' }).getByRole('radio')).toHaveCount(3)

  const messagePreview = dialog.getByRole('textbox', { name: 'Trusted contact message preview' })
  await expect(messagePreview).toHaveValue(/call me in 5 minutes/i)
  await dialog.getByRole('radio', { name: 'Call me now' }).click()
  await expect(messagePreview).toHaveValue(/Stay on the phone while I get to my ride/)
  await dialog.getByRole('button', { name: 'Open share sheet' }).click()
  await expect(dialog.locator('.share-status')).toContainText('LumaDate cannot verify it')
  await expect.poll(() => page.evaluate(() => (
    (window as Window & { __sharedText?: string }).__sharedText
  ))).toContain('Stay on the phone while I get to my ride')

  await dialog.getByRole('radio', { name: 'I need help leaving' }).click()
  await expect(messagePreview).toHaveValue(/public meet point/)
  await expect(dialog.getByLabel('Emergency help')).toContainText('Immediate danger is different.')
  await expectNoHorizontalOverflow(page)
})
