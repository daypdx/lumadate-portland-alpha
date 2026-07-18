# LumaDate Portland Alpha — thorough live A/B + dogfood QA

- Review date: 2026-07-17
- Live target: https://daypdx.github.io/lumadate-portland-alpha/
- Repository: https://github.com/daypdx/lumadate-portland-alpha
- Local branch/commit: `main` / `691e7f55c72f6e5dcc9392c5a208cc317062e05c`
- Product category: guest-first Portland date-itinerary planner, not dating/matching/swiping
- Test model: desk-based heuristic A/B, exploratory QA, source inspection, and automated regression verification; not statistical traffic A/B testing
- Variant A: current deployed controlled alpha
- Variant B: proposed controlled-alpha experience suitable for 10–25 Portland-area testers

## Executive summary

**Verdict: conditional GO for a controlled 10–25-person Portland alpha after one confirmed P1 safety fix and one P1 trust fix. Not ready for public beta.**

The product has a credible core: category clarity, privacy containment, visual identity, concrete Portland plans, keyboard semantics, and external-provider boundaries are all strong. The largest confirmed functional defect is that the generated safety share can assign real places to the wrong itinerary times. The largest product-trust defect is that the real `Start planning` path begins with extensive demonstration preferences, making generated personalization appear more earned than it is.

The canonical code-quality gates pass, but they do not cover safety-share timeline consistency. A focused Playwright reproduction failed exactly where expected while the exact-address privacy check passed. This is a useful example of a green suite missing a high-impact behavior.

The itinerary is also too long and action-heavy for the controlled alpha. The detail screen duplicates summaries and warnings before exposing eight competing actions. Variant B should separate demo and real intake, shorten time-to-value, label synthetic estimates at the claim, and make the timeline plus three high-value actions the product payoff.

## Launch decision

| Stage | Verdict | Conditions |
|---|---|---|
| Controlled Portland alpha, 10–25 invited testers | **Conditional GO** | Fix safety-share timeline/place alignment; separate or prominently label demo defaults; run physical-device smoke checks |
| Public web beta | **NO-GO** | Requires live/provider data boundaries, stronger analytics/monitoring, support/legal review, expanded QA, and real user evidence |
| Paid/broad/App Store launch | **NO-GO** | Later phase; outside this alpha’s scope |

## Test coverage

| Surface/check | Result | Evidence |
|---|---|---|
| Landing/value proposition | Pass with conversion opportunities | Live visual/snapshot review |
| Start planning | Pass | Live keyboard flow plus Playwright pointer flow |
| Show me an example | Pass | Desktop Chromium, Pixel 7 Chromium, iPhone 13 WebKit emulation |
| Seven-step intake | Pass with burden/trust issues | Full live traversal |
| Progress semantics | Pass | `aria-current="step"`, completed/current/upcoming labels |
| Selected cards/chips | Pass | `aria-pressed`, radio, slider semantics inspected |
| Date preset semantics | Pass in current source/build | `aria-pressed` at `src/App.tsx:1220`; automated selected-preset regression passes |
| Review/generate | Pass | Full live traversal |
| Ranked options | Pass with credibility issues | Three concrete plans inspected |
| Itinerary/detail | Pass functionally; fails hierarchy heuristic | Full live traversal; 4,011 px page in independent 624 px viewport |
| Adjust preview | Pass | Existing desktop/mobile Chromium and iPhone WebKit tests |
| Demo reminders | Pass | Existing desktop/mobile Chromium and iPhone WebKit tests |
| Save/idempotency | Pass | Saved count/storage inspection; duplicate save did not duplicate plan |
| Saved-zero feedback | Pass in current source/build | Toast `No saved plans yet.` and e2e assertion |
| Exact-address containment | Pass | Live inspection, unit safeguard, focused Playwright reproduction |
| Safety-share timeline consistency | **Fail** | Focused Playwright reproduction; confirmed wrong place/time mapping |
| Initial browser console | Pass | No application errors observed |
| Horizontal mobile overflow/fixed overlap | Pass in emulation | Pixel/390 px checks; no horizontal overflow or fixed-control overlap |
| Real physical iPhone/Android | Not completed | No physical-device access in this environment |

## Confirmed severity-ranked findings

### P1 — High / alpha launch gates

#### P1-1. Safety-share places contradict the displayed itinerary

For the selected `Laurelhurst Park Walk and Portland Dinner` plan, the visible itinerary is:

- 6:30 PM — Meet at Laurelhurst Park public entrance
- 6:45 PM — Walk the Laurelhurst Park loop
- 7:30 PM — Dinner nearby in SE Portland
- 8:25 PM — Optional coffee or dessert extension

The generated safety share instead contains:

- 6:30 PM — Laurelhurst Park
- **6:45 PM — Laurelhurst Market**
- **7:30 PM — Rimsky-Korsakoffee House**
- 8:25 PM — Optional coffee or dessert extension

This turns the 6:45 park-walk slot into the dinner venue and the 7:30 dinner slot into the dessert venue. Shared check-in information must derive from the same canonical timeline as the itinerary.

**Root cause:** `publicStopDetails` maps `ranked.plan.places[index]` directly onto `ranked.plan.itinerary[index]` at `src/App.tsx:2738–2756`. The plan has four timeline steps but three place records, and their meanings are not one-to-one by index.

**Required fix:** Define an explicit place/stop reference on each itinerary step or generate both the itinerary and safety share from one canonical stop structure. Do not infer semantic alignment by array index.

**Required regression:** For every plan, compare each safety-share time, title, place, and map link against the selected itinerary. Repeat after adjustment/re-ranking.

#### P1-2. Demo defaults masquerade as user personalization

The real `Start planning` route begins with populated values including:

- Cuisine preferences
- Five activity types
- Three moods
- Crowd/energy/romance levels
- Descriptions of what both people enjoy
- Avoid list
- Safety/reminder defaults

Step 5 then reports eight selected interests and generated results say `Matches what they enjoy`, even if the tester supplied none of those clues. `Clear demo data` is secondary and does not make the provenance obvious.

**Required fix:**

- Start real planning with blank personal fields and only neutral, clearly described defaults.
- Keep populated values only behind `Show me an example`.
- Add a persistent banner to the example path: `DEMO PROFILE — These answers and results are examples, not your data.`
- Ensure clearing demo data actually produces a clean real-intake state rather than rebuilding the same seeded defaults.

#### P1-3. Exact street addresses are silently generalized

A fake exact address was accepted without invalid state or explanation. The app correctly stored only `Portland, OR` and did not leak the address into review, results, itinerary, safety share, or saved-plan storage. Privacy containment passes, but the silent replacement makes precise departure guidance appear more personalized than it is.

**Required fix:** Detect street-like input and show an inline explanation before advancing:

> For privacy, use a city or neighborhood only. We replaced the street address with Portland, OR.

### P2 — Medium

#### P2-1. Seven steps delay time-to-value

`Where → Time → Energy → Food → Likes → Safety → Review` is understandable but too long for the alpha promise. Energy alone combines mood chips and three sliders. Main-panel guidance is repeated in the Concierge sidebar.

**Variant B:** Four stages at most:

1. Basics — area and rough date/time
2. Preferences — one clue and optional vibe
3. Constraints — budget, food, safety
4. Review

Move transport, exact time, sliders, detailed food limits, and extra tags behind `More options`.

#### P2-2. Synthetic estimates look more live than they are

Examples include:

- `Leave by 6:05 PM`
- `Peak around 7 PM`
- `Mild evening layer suggested`
- Exact route-leg minutes
- `Running late risk: medium`

Disclosures exist, but the first impression is operational. Source inspection confirms mock/heuristic data (`mockItinerarySignals`, rotating static crowd/traffic labels).

**Fix:** Label at the claim, not only in a footer:

- `Example leave time — verify route in Maps`
- `Demo crowd estimate — not live`
- Remove weather unless live, or label `Demo weather placeholder`

#### P2-3. The itinerary buries the usable plan

The detail screen repeats the selected summary, title, description, map/privacy explanation, readiness status, venue verification warnings, estimates, and rationale before the timeline. Eight actions then compete at similar visual weight.

**Fix:** Lead with:

1. Timeline
2. `Copy invite`
3. `Check hours & availability externally`
4. `Safety share`

Move Compare, Adjust, Save, Reminders, Running late, and plan-state controls under secondary navigation or `More`. Collapse repeated provider caveats.

#### P2-4. `Book or reserve` overpromises

The booking sheet correctly says LumaDate does not book, pay, call, or reserve, but that truth appears only after activating an assertive CTA.

**Rename:** `Check hours & availability externally ↗`.

#### P2-5. Ranking rationale exposes shallow keyword matching

Examples include `Also fits your taste: walkable, portland, park.` `Portland` is not meaningful personalization, and raw keyword explanations reduce confidence.

**Fix:** Explain meaningful criteria and one tradeoff:

- Public, conversation-friendly start
- Fits quieter crowd preference
- Dinner and coffee fit the selected budget range
- Flexible indoor backup nearby
- Tradeoff: dinner may require a wait/reservation

#### P2-6. Cost precision needs ranges

The selected plan shows `$70` while using a `$$$` dinner anchor plus optional dessert. A precise total lacks a visible breakdown.

**Fix:** Show an estimated range and components, e.g. `$70–$110 for two`, with park/dinner/optional dessert estimates.

### P3 — Low

#### P3-1. Clipboard fallback feedback must remain accessible

An independent browser observed the fallback copy message when clipboard access was blocked. Current source renders toast feedback with `role="status"`, which is appropriate; retain this in regression coverage for success and failure paths.

#### P3-2. `Matching` conflicts with category positioning

The Review screen labels personal preferences `Matching`, after the landing page explicitly distinguishes LumaDate from matching/swiping.

**Rename:** `Preferences`, `Why it fits`, or `What they enjoy`.

#### P3-3. Safety guidance copy is awkward

`Safety is copy-only` is technical and potentially trust-reducing. `Help me leave drafts never auto-send` is grammatically unclear.

**Replace with:** `Safety messages are drafts only. LumaDate never sends or shares them automatically.`

## Findings investigated and not confirmed as current defects

### Pointer activation

The live browser automation sometimes reported a successful click without visible transition; keyboard focus plus Enter advanced. Independent and automated checks subsequently passed pointer activation. Playwright completed the representative flow on desktop Chromium, Pixel 7 Chromium, and iPhone 13 WebKit emulation.

**Disposition:** automation uncertainty, not a confirmed app defect. Keep physical touch verification as a release check.

### Date-preset selected semantics

An independent accessibility snapshot reported `Tonight` without selected semantics. Current source explicitly renders `aria-pressed={selectedDatePreset === label}` and the automated test confirms exactly one selected preset on desktop/mobile Chromium and iPhone WebKit emulation.

**Disposition:** pass in the verified current build; retain the regression.

### `Saved 0` feedback

An independent live interaction missed feedback. Current source emits `No saved plans yet.` through the `role="status"` toast, and the desktop/mobile Chromium test asserts that exact message.

**Disposition:** pass in the verified current build; retain the regression.

## Privacy regression result

Test input:

`1234 SE Privacy Leak St, Portland, OR 97202`

Confirmed absent from:

- Review brief
- Ranked results
- Full itinerary
- Safety-share copy
- Saved-plan record
- `lumadate-intake` local storage
- `lumadate-saved` local storage

Stored intake used `Portland, OR`. The privacy safeguard passed, while the lack of user-visible generalization feedback remains a P1 trust issue.

## A/B scorecard

Scores are directional desk-based evaluations, not analytics or participant outcomes.

| Area | Variant A: current live | Variant B: controlled-alpha target |
|---|---:|---:|
| Landing clarity | 7/10 | 9/10 |
| Privacy/trust | 7/10 | 9/10 |
| Time-to-value | 4/10 | 8/10 |
| Intake burden | 3/10 | 8/10 |
| Result credibility | 4/10 | 8/10 |
| Demo/provider honesty | 6/10 | 9/10 |
| CTA hierarchy | 4/10 | 9/10 |
| Fit for 10–25 testers | 4/10 | 9/10 |
| Overall | 4.9/10 | 8.6/10 |

### Persona projection

| Persona | Variant A | Variant B | Main reason |
|---|---:|---:|---|
| Young, tech-savvy | 77/100 | 90/100 | A is polished but slow and over-documented |
| Average user | 66/100 | 88/100 | Demo defaults and dense detail reduce confidence |
| Older/lower-tech-confidence | 50/100 | 84/100 | Seven steps, subtle provenance, long scrolling, and equal-weight actions create substantial friction |

**Desk-based winner: Variant B.**

## Recommended Variant B

### Landing

Eyebrow:

> PRIVATE PORTLAND ALPHA • 10–25 TESTERS

Headline:

> Get 3 Portland date plans in about 2 minutes.

Subhead:

> Tell us the neighborhood, timing, budget, and one thing they like. Get a ranked itinerary with real place suggestions, an estimated cost, a backup, and a copyable invite.

Positioning:

> Planning, not matching. No account. Never enter a street address.

Alpha disclosure:

> Alpha limitation: place suggestions are real, but hours, availability, routes, weather, and crowd levels are not live. LumaDate never books—you’ll verify with Maps or the provider.

CTAs:

- Primary: `Build my plan — about 2 min`
- Secondary: `Preview a clearly labeled demo`

### Results

Persistent ribbon:

> ALPHA PLAN • REAL PLACE SUGGESTIONS • LIVE AVAILABILITY NOT CHECKED

Use a compact structure:

- Recommendation
- Meaningful why-it-fits explanation
- One tradeoff
- Timeline
- Backup
- One verification link per stop

### Detail actions

1. Primary: `Copy invite`
2. Primary/secondary: `Check hours & availability externally ↗`
3. Secondary: `Safety share`
4. Secondary: `Adjust plan`, `Compare 2 alternatives`
5. Tertiary: `Save in this browser`
6. `More`: reminders, running-late drafts, plan states

### Alpha feedback

After copying an invite or opening an external provider:

- `Was this plan useful enough to send? Yes / No`
- `What felt wrong or missing?`

## Automated verification

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | Passed: 0 warnings, 0 errors |
| Unit safeguards | `npm run test:run` | Passed: 6/6 |
| Production build | `npm run build` | Passed |
| Desktop/mobile Chromium e2e | `npm run test:e2e` | Passed: 6/6 |
| iPhone WebKit emulation | temporary Playwright iPhone 13 project | Passed: 3/3 |
| Production dependency audit | `npm audit --omit=dev` | Passed: 0 vulnerabilities |
| Focused safety-share reproduction | temporary Playwright test | **Failed as expected:** 1 safety mismatch; 1 exact-address privacy test passed |

The focused reproduction printed the generated safety share and proved:

- Actual: `6:45 PM - Laurelhurst Market`
- Expected for the displayed park-walk step: Laurelhurst Park/park-walk alignment
- Actual: `7:30 PM - Rimsky-Korsakoffee House`
- Expected for the displayed dinner step: Laurelhurst Market/dinner alignment
- Exact private address remained absent from safety text and local storage

Temporary verification files and Playwright artifacts were removed after execution.

## Source/deploy alignment

The live GitHub Pages HTML references:

- JavaScript: `assets/index-Co4NaBNS.js`
- CSS: `assets/index-3VcUF8cX.css`

A local GitHub Pages-mode build from commit `691e7f5` produced the same JavaScript and CSS asset hashes. The live deployment is therefore aligned with the tested source build.

## Real-device limitation

Automated coverage now includes:

- Desktop Chromium
- Pixel 7 Chromium emulation
- Confirmed 390×844 Chromium device emulation
- iPhone 13 WebKit emulation

This environment does not provide physical iPhone or Android hardware. It cannot honestly certify real Mobile Safari/Chrome behavior for touch input, native date/time pickers, on-screen keyboards, safe areas, browser chrome, clipboard permissions, or screen-reader speech. A short physical-device smoke pass remains required before invitations are sent.

## Required next actions

1. Fix safety-share place/time alignment and add permanent unit/e2e regressions.
2. Separate blank real intake from clearly labeled demo data.
3. Add visible exact-address generalization feedback.
4. Simplify the itinerary and CTA hierarchy.
5. Label synthetic estimates at the point of use.
6. Run physical iPhone Safari and Android Chrome smoke tests.
7. Invite 10–25 Portland testers only after steps 1–3 pass.

## Files modified by this review

- Added this report only: `docs/testing/reports/2026-07-17-thorough-live-ab-dogfood.md`
- No application source, tests, dependencies, configuration, commit, or remote branch was changed.
