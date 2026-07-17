# Live Variant A landing baseline — 2026-07-17

- Repository: https://github.com/daypdx/lumadate-portland-alpha
- Live site: https://daypdx.github.io/lumadate-portland-alpha/
- Source commit reviewed: `97bf51d`
- Review time: 2026-07-17 16:28 PDT
- Scope: initial desk-based launch-readiness review of the deployed landing page; not statistical traffic A/B testing or full-funnel usability testing.

## Variant framing

- Variant A: the current deployed Portland controlled alpha.
- Variant B target: an improved controlled-alpha experience suitable for 10–25 Portland-area usability testers.
- This report establishes the Variant A landing baseline. It does not invent Variant B copy or user outcomes.

## Verified observations

| Area | Variant A baseline | Initial assessment |
|---|---|---|
| Category clarity | “Not a dating app. No swiping, no profiles” is visible directly below the hero. | Strong: the product is clearly separated from dating/swiping apps. |
| Value proposition | “Plan the date without overthinking it.” is the dominant headline. | Strong and memorable, though “itinerary planner” remains implied rather than stated in the hero. |
| Primary action | “Start planning” is visually prominent and paired with “Show me an example.” | Strong initial CTA hierarchy. Full click-path behavior was not covered in this baseline. |
| Trust and privacy | Private-address, no-fake-booking, and adjustability promises are visible near the CTA. | Strong trust positioning for a controlled alpha. |
| Product visualization | The hero shows a timed route with a public meet point, dinner, live music, and a backup. | Strong visual explanation of the itinerary concept. |
| Alpha honesty | Controlled-alpha, demonstration-data, provider-handoff, and private-starting-detail language is visible. | Honest, but repeated caveats compete with the emotional product promise and may reduce conversion. |
| Support surfaces | Privacy, Terms, Support, and Feedback are linked from the landing page. | Appropriate controlled-alpha coverage. |
| Browser console | No console messages or JavaScript errors appeared on initial load. | Pass for the observed landing-page load. |

## Initial launch-readiness judgment

The deployed landing page is suitable as Variant A for a controlled Portland usability alpha. It communicates the product category, value proposition, primary action, privacy boundaries, and demonstration-data limitations without visible console failures.

The main Variant B opportunity is hierarchy rather than removing safeguards: keep the privacy and demonstration-data disclosures, but reduce how strongly repeated alpha caveats compete with excitement and immediate time-to-value.

## Highest-value A/B questions

1. Does explicitly saying “Portland date itinerary” near the hero improve category comprehension without making the copy feel mechanical?
2. Does moving one repeated alpha/demo caveat lower on the page improve start-planning conversion while preserving informed consent?
3. Does the example-plan CTA increase confidence for older or lower-tech-confidence users, or distract from the primary CTA?
4. Do testers understand that provider details require external verification before they enter the planning flow?

## Limits and next gate

This baseline covered only the deployed landing page in a desktop browser session. It did not verify the complete wizard, generated rankings, itinerary actions, private-origin regression path, keyboard flow, iPhone Safari, Android Chrome, or statistically valid user preference outcomes.

Next, run the existing full-funnel brief in [`../ab-testing-codex-handoff.md`](../ab-testing-codex-handoff.md) with the three defined personas, then collect structured outcomes from 10–25 Portland-area testers before changing the broader launch verdict.
