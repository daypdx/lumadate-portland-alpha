# Portland alpha technical verification — 2026-07-17

- Repository: https://github.com/daypdx/lumadate-portland-alpha
- Live site: https://daypdx.github.io/lumadate-portland-alpha/
- Baseline commit before documentation update: `819987d`
- Verification time: 2026-07-17 PDT
- Scope: source quality gates and deployment reachability; not statistical user testing or full real-device Safari/Android validation.

## Results

| Check | Command or method | Result |
|---|---|---|
| Live deployment | HTTPS request to the GitHub Pages URL | HTTP 200 |
| Lint | `npm run lint` | Passed; 0 warnings and 0 errors |
| Unit safeguards | `npm run test:run` | Passed; 6/6 tests |
| Production build | `npm run build` | Passed |
| Browser regression | `npm run test:e2e` | Passed; 6/6 desktop/mobile Chromium tests |
| Production dependency audit | `npm audit --omit=dev` | 0 known vulnerabilities |

## Covered safeguards

The current automated checks cover:

- Dynamic date behavior.
- Weekend date resolution.
- Private-origin redaction from public plan text.
- Dietary verification warnings.
- Food-preference ranking influence.
- First-time planning without an empty Saved modal.
- Exactly one selected date preset in Step 2.
- Example-plan flow through itinerary, adjustment preview, and demonstration reminders.

## What this does not prove

- Real venue hours, availability, ratings, routes, weather, or crowd information.
- Real-device behavior on iPhone Safari and Android Chrome.
- Statistical usability or preference outcomes.
- Legal compliance or professional review of Privacy/Terms.
- Production readiness for a broad consumer launch.

## Verdict supported by this report

The build is suitable for a controlled Portland usability alpha. It is not evidence that LumaDate is ready for a public, paid, or heavily marketed launch.

## Next verification gate

Before expanding beyond the controlled cohort:

1. Complete real-device iPhone Safari and Android Chrome testing.
2. Run the private-origin regression path with safe fake data.
3. Collect structured outcomes from 10–25 Portland-area testers.
4. Recalculate the launch verdict using actual completion, relevance, trust, and repeat-use signals.
