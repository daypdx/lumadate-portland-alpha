# LumaDate Portland Alpha A/B Testing + Codex Handoff

Use this as the copy/paste brief for ChatGPT, Codex, or another coding/review agent before running the next A/B/dogfood pass.

## Target

- Product: LumaDate Portland Alpha
- Live URL: https://daypdx.github.io/lumadate-portland-alpha/
- Canonical repo: https://github.com/daypdx/lumadate-portland-alpha
- Local repo: `C:/Users/zdayp/lumadate-portland-alpha`
- Product type: Portland-only controlled web alpha for an intake-based date itinerary planner.
- Not a dating/swiping/matching app.

## Current launch verdict

LumaDate is a strong, polished prototype and is close to a controlled web alpha. It is not yet safe for a full consumer launch.

Current launch stance:

- Controlled Portland alpha: acceptable / ready for limited usability testing.
- Public Portland beta: not ready until real-data, privacy, QA, and launch support gaps are closed.
- Paid or heavily marketed launch: not ready.
- App Store launch: later phase only after the web beta proves people use the generated plans.

Recommended first true launch shape:

> Free, guest-first, Portland-only web beta with real venue data, no exact-address storage, no automated booking, and no required account.

## Alpha boundaries to preserve

Do not expand scope during A/B testing. The alpha should remain:

- Portland-only.
- Guest-first.
- Demonstration-data-labeled.
- No accounts.
- No GPS/background location.
- No real SMS, calls, push notifications, or automated reminders.
- No payments.
- No automated booking/reservations.
- No exact address storage.
- No private start location in invites, saved plans, safety shares, or public plan text.
- Provider details must be verified externally by the user.

## What changed from the old prototype

The prior LumaDate prototype had serious launch blockers:

1. Private address leak risk: meetup choices could map to `startLocation` and flow into safety share/public meet area.
2. Hardcoded date: source/live bundle used a fixed `2026-07-18T18:30` while the UI marked it as “Tonight.”
3. Source and live deployment diverged: important public fixes existed only in compiled public prototype output.
4. Many wizard answers were collected but did not affect recommendations enough.
5. Live planning data was not implemented.
6. No automated tests/deployment checks.
7. Missing launch support/legal surfaces: privacy, terms, support, feedback, analytics, local-data explanation.

The new Portland alpha exists to fix the controlled-alpha foundation:

- Private starting details cannot enter invitations or safety shares.
- Dates are generated dynamically instead of hardcoded.
- More wizard choices affect recommendation ranking.
- Dietary restrictions trigger venue-verification warnings.
- Updated navigation, reminder, adjustment, and accessibility fixes are in source.
- Privacy, Terms, Support, and Feedback pages exist.
- Search indexing is disabled while testing remains controlled.
- Pushes run lint, safety tests, browser tests, and production build before deployment.

## Current known-good evidence to verify again

Before A/B conclusions, verify these are still true:

- GitHub Pages live over HTTPS.
- Lint passes.
- Unit/safety tests pass.
- Browser happy-path tests pass.
- Production build passes.
- Dependency audit has no known vulnerabilities, if audit is available.
- Live planning flow works on desktop.
- Date selection uses dynamic/current semantics.
- Privacy page is reachable.
- Public alpha copy says demonstration data / verify provider details.

Run locally when coding or validating source:

```bash
npm install
npm run lint
npm run test:run
npm run test:e2e
npm run build
```

## A/B testing type

This is desk-based expert A/B + dogfood testing, not statistically valid traffic A/B testing.

Compare:

- Variant A: current Portland alpha live/source experience.
- Variant B: ideal controlled-alpha experience ready for 10-25 Portland usability testers.

Do not invent real user data. Label all findings as expert review unless actual tester/analytics data is provided.

## Test personas

Evaluate every major issue against these personas:

1. Young tech-savvy Portland user
   - Used to Uber, DoorDash, TikTok, fast mobile flows.
   - Expects immediate feedback, smooth transitions, and polished mobile behavior.

2. Older/lower-tech-confidence Portland user
   - Needs plain language, obvious progress, explicit defaults, and clear safety/privacy boundaries.
   - More likely to be confused by dense forms, subtle selected states, internal/demo language, or unclear provider caveats.

3. Average tech user
   - Can complete common forms but does not want to overthink planning.
   - Needs reassurance that rough answers are okay and that LumaDate will guide the rest.

## Flow to test

Run the full happy path and representative action paths:

1. Landing page
   - Does it quickly explain LumaDate is a date itinerary planner, not a dating app?
   - Is “Portland-only controlled alpha” clear without killing excitement?
   - Are privacy/demo boundaries visible and understandable?
   - Are primary CTA and example/demo CTA obvious?

2. Start planning
   - Verify pointer/mouse/touch click behavior.
   - Verify keyboard activation.
   - Verify visible transition/focus after click.

3. Wizard/intake
   - Where / general starting area.
   - Date/time presets and custom date behavior.
   - Mood/energy/romance level.
   - Food/drinks/budget/dietary limits.
   - Activities/interests.
   - Transportation/travel radius/accessibility.
   - Safety/privacy settings.
   - Review/generate.

4. Progress guidance
   - Compare current stepper/progress UI with ideal Uber/DoorDash-like connected line/dot checkpoints.
   - Check current/completed/future states.
   - Check `aria-current="step"` and completed/current/upcoming accessibility labels.
   - Check mobile fit/no horizontal overflow.

5. Generate/ranked options
   - Does “Generate options” visibly respond?
   - Are recommendations believable and personalized?
   - Do collected answers visibly influence the ranking?
   - Are backup options framed as useful alternatives, not failures?
   - Are warnings for dietary/provider verification visible but not overwhelming?

6. Itinerary/detail
   - Does “Use this plan” clearly route/focus to the selected itinerary?
   - Does the detail page show the plan before caveats?
   - Are timeline, places, map/review links, backup, budget, safety, and verification language understandable?
   - Is the content too dense?

7. Adjust/reminders/safety/share/support
   - Adjustment controls should visibly change selected state and plan state, or be clearly demo-labeled.
   - Reminder language must not imply real SMS/push/background notifications unless implemented.
   - Safety share must never include private start location or exact address.
   - Support/Feedback/Privacy/Terms should be reachable and coherent.
   - Clear-data/local-storage explanation should be visible enough for an alpha.

8. Responsive and real-device risk
   - Desktop Chrome.
   - iPhone Safari target behavior.
   - Android Chrome target behavior.
   - Check bottom nav/sticky controls do not cover content or CTAs.

## Critical issues to re-test first

These are the highest-priority regression areas:

1. Private-origin/privacy enforcement
   - Enter a specific/private-looking start location during testing only if safe/fake, e.g. `123 Fake Street`.
   - Confirm it does not appear in public meet area, invite text, saved plan, safety share, itinerary public text, or local-storage public plan fields.
   - Expected: app stores/uses only generalized Portland area semantics or strips private origin entirely.

2. Dynamic dates
   - “Tonight,” “Tomorrow,” weekend, and custom date should not be hardcoded to stale dates.
   - Expected: labels and generated ISO/date values remain semantically correct relative to current date.

3. Recommendation personalization
   - Change dietary restriction, transportation, travel radius, mood, energy, activity preference, romance level, and safety settings.
   - Expected: ranking, warnings, filters, or itinerary copy should visibly change. If an answer does not affect anything, flag it for removal or implementation.

4. Demo/provider honesty
   - Places/routes/weather/crowd/availability should be clearly demonstration or externally verified.
   - Avoid copy that implies live verified availability when it is not implemented.

5. Deployment/source alignment
   - Confirm live behavior matches source behavior after build/deploy.
   - Do not accept manual compiled-only fixes as the source of truth.

6. Automated checks
   - Verify lint, unit tests, browser tests, and build remain green.
   - If changing behavior, add or update tests for privacy, dates, ranking, and happy-path flow.

## Product scoring dimensions

Score Variant A vs ideal Variant B on:

- Category clarity: itinerary planner, not dating app.
- Value proposition speed.
- Privacy/safety trust.
- Operational confidence: every important click visibly responds.
- Guided-flow quality: progress, defaults, “what happens next.”
- Personalization credibility.
- Result usefulness.
- Demo/live-data honesty.
- Accessibility/keyboard/screen-reader semantics.
- Mobile readiness.
- Launch-readiness for controlled alpha.

## Severity definitions

Use direct severity labels:

- P0 / Critical: privacy leak, unsafe/misleading launch behavior, broken main funnel, stale date logic causing wrong plans, source/deploy mismatch that can erase fixes.
- P1 / High: major conversion blocker, unclear CTA/action feedback, key wizard answers ignored, mobile layout covering controls, accessibility states missing from primary controls.
- P2 / Medium: density, copy friction, repeated disclaimers, ranking labels that reduce confidence, support/legal clarity gaps that do not immediately leak private data.
- P3 / Low: polish, microcopy, visual tuning, non-blocking layout refinements.

## Expected output

Return a concise but blunt report with:

1. What was tested
   - URL, repo/commit if available, commands run, browser/device coverage, files changed or not changed.

2. Launch verdict
   - Controlled alpha / public beta / paid launch / App Store launch readiness.

3. A/B score table
   - Current alpha vs ideal controlled alpha.

4. Persona findings
   - Young tech-savvy user.
   - Older/lower-tech-confidence user.
   - Average user.

5. Severity-ranked issues
   - Issue title.
   - Severity.
   - Evidence.
   - Why it matters.
   - Recommended fix.
   - Likely code area if known.

6. Implementation plan for Codex
   - Must-fix before more testers.
   - Should-fix before public beta.
   - Later / do not build yet.

7. Validation checklist
   - Exact commands and browser paths to verify.

## Codex implementation rules

If Codex is asked to fix issues, follow these rules:

- Work in `C:/Users/zdayp/lumadate-portland-alpha`.
- Keep the Portland alpha scope narrow.
- Do not add native app, accounts, payments, automated booking, real SMS, background location, or AI calling.
- Do not expose API keys in frontend.
- Use server-side/provider abstraction for future live data.
- Do not fabricate live ratings, hours, availability, crowd, or route data.
- Preserve private-origin protections.
- Add tests for every privacy/date/ranking regression fix.
- Run:

```bash
npm run lint
npm run test:run
npm run test:e2e
npm run build
```

- Commit only after checks pass.

## Immediate recommended next move

Run controlled usability testing with 10-25 Portland-area testers using realistic preferences but only general starting areas. Ask:

- Could they complete the planning flow without help?
- Did the first-ranked plan feel personally relevant?
- Would they use the itinerary for a real date?
- Did they understand what was estimated/demo vs verified/live?
- Did anything feel unsafe, misleading, or unnecessarily complicated?
- Which questions noticeably improved the recommendation?

Use that evidence to define the real-data Portland beta instead of adding speculative features.
