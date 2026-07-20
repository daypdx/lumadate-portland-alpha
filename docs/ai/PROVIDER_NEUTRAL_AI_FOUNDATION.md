# Provider-neutral AI itinerary foundation

## Status and feature modes

This branch contains a provider-neutral, safe-mock foundation for the Portland controlled alpha. It does not connect a hosted model, AI API key, or new external data provider.

- Normal alpha mode is `deterministic`. It does not call the itinerary composer and does not show an AI banner.
- Only `?aiPreview=mock` enables `mock-preview` mode.
- Preview mode shows exactly: `AI foundation preview — safe mock, no hosted model connected`.
- Other values, including `?aiPreview=hosted`, remain deterministic.

LumaDate owns ranking, eligibility, canonical itinerary stops, visible copy, safety content, budget checks, and verification language in both modes.

## Current flow

1. The guided form produces an `Intake` record.
2. `rankPlans(...)` deterministically ranks LumaDate's catalog.
3. `aiCandidateInputsFor(...)` reduces ranked plans and curated venues to eligible IDs, booleans, numeric facts, and approved reason codes.
4. `createAiItineraryRequest(...)` converts intake preferences to an allowlisted request and strips raw/private fields.
5. In normal mode, generation stops at deterministic ranked plans.
6. In internal mock-preview mode only, `composeAiItinerarySafely(...)` calls the local mock composer.
7. `validateAiItineraryComposition(...)` accepts only validated plan IDs, venue IDs, and reason codes.
8. The app resolves those IDs back to the same LumaDate-owned plan, venue, canonical stops, invite, safety share, saved plan, reminder, and Maps handoffs.
9. Malformed, empty, timed-out, thrown, or invalid composer output falls back to deterministic LumaDate candidates.

The composition layer cannot invent a stop, venue, route, reservation, address, hours, price, rating, availability claim, explanation, or safety message.

## Exact request data

The model-facing request has `schemaVersion: 1` and the following allowlisted fields.

### Preferences

- `dateArea`
- `dateStage`
- `endMode`
- `budgetMax`
- `foodWanted`
- `alcoholPreference`
- `indoorOutdoor`
- `energyLevel`
- `romanceLevel`
- `crowdComfort`
- `firstDateSafeMode`
- allowlisted `activityTags`
- allowlisted `moodTags`
- extracted and allowlisted `interestTags`
- extracted and allowlisted `cuisineTags`
- extracted and allowlisted `dietaryTags`
- extracted and allowlisted `avoidTags`

Before tag extraction, LumaDate removes street-like addresses, phone numbers, email addresses, URLs, and social handles. Values not present in an approved tag catalog are discarded.

### Candidates

For each ranked plan, in deterministic ranked order:

- `planId`
- `estimatedCostHigh`
- `durationMinutes`
- `areaMatch`
- `budgetFits`
- `safetyEligible`
- `venueOptions`, each containing only:
  - `venueId`
  - `areaMatch`
  - `categoryMatch`
  - `available`
- `reasonCodes`

## Data never sent

The request never includes:

- `startLocation` or any private origin;
- raw `dateEnjoysText` or `userEnjoysText`;
- raw `cuisineLikes`, `dietaryLimits`, or `mustAvoid`;
- exact `dateStart` and `dateEnd` values;
- venue names, street addresses, coordinates, URLs, phone numbers, summaries, popularity notes, or verification cautions;
- plan titles, short pitches, scores, free-form ranking reasons, warnings, safety notes, itinerary prose, provider actions, or place records;
- invite drafts, safety-share text, reminders, saved-plan data, clipboard content, or local-storage records;
- provider keys, credentials, or browser secrets.

Free-form text can contribute only approved tags after sensitive-pattern removal. It cannot become composer instructions or provider-authored copy.

## Hard eligibility rules

### Plans

A composer may select a plan only when all supplied LumaDate facts are true:

- the plan matches the selected area;
- the plan's estimated high cost fits the total-date budget;
- the plan is a public-place plan;
- when first-date safety is enabled or `dateStage === 'first_date'`, the plan is marked good for a first date; and
- the plan is compatible with the alcohol preference. Alcohol-centric plans are ineligible unless the preference is `alcohol_ok`.

The validator rejects unknown, duplicate, over-budget, different-area, and safety-ineligible plans. The primary plan must be present in the returned plan list and must remain LumaDate's first deterministically ranked eligible candidate; a provider cannot replace that authority. A response may select one to three plans.

### Venues

A venue option is supplied only when:

- its area matches the plan area;
- its kind matches `preferredVenueKinds(plan)`; and
- its curated status is `active`.

The validator rejects unknown, duplicate, different-area, wrong-category, and unavailable venues. Venue names and facts remain LumaDate-owned and are resolved locally from the validated ID.

## Approved reason-code catalog

The response may contain only reason codes already approved on that candidate:

- `AREA_MATCH` — the deterministic plan-area check passed.
- `BUDGET_MATCH` — the estimated high cost fits the total-date budget.
- `QUIET_FIT` — structured quiet/low-pressure preferences match deterministic plan tags.
- `INTEREST_MATCH` — approved structured activity or mood values match deterministic plan tags.
- `FIRST_DATE_SAFE` — the plan is public, marked good for first dates, and alcohol-compatible.
- `WEATHER_SAFE` — weather-safe mode is requested and the plan has an indoor option.
- `BACKUP_AVAILABLE` — the LumaDate plan contains a deterministic backup option.

LumaDate converts these codes to visible copy with `reasonCodesToCopy(...)`. Provider-authored summaries, explanations, invitations, safety language, facts, addresses, hours, prices, and availability claims are not accepted by the response schema.

## Response contract and fallback

An accepted `AiItineraryComposition` contains only:

- `schemaVersion: 1`;
- `providerMode` (`mock`, `hosted`, or `fallback`);
- `primaryPlanId`;
- one to three plan selections containing `planId`, optional `venueId`, and approved `reasonCodes`; and
- `verificationRequired: true`.

The validator rejects wrong schema versions, missing verification, invalid modes, unexpected fields, unknown or duplicate IDs, unapproved or duplicate reason codes, oversized IDs, oversized serialized output, empty plan arrays, and more than three selections.

If no composer selection is valid, fallback returns the remaining eligible candidates in LumaDate's deterministic order. If no candidate is fully eligible, the composition contains no AI selection while the app's deterministic ranked results remain available. Hosted-provider failure must never block deterministic planning.

## Code map

- `src/ai/itineraryComposer.ts` — request/response types, allowlisting, provider interface, mock composer, validation, copy translation, timeout, and fallback.
- `src/ai/itineraryComposer.test.ts` — privacy, schema, eligibility, validation, timeout, and fallback tests.
- `src/App.tsx` — deterministic ranking, candidate construction, feature-mode boundary, and canonical ID resolution.
- `src/App.test.ts` — planning safeguards and candidate eligibility tests.
- `tests/happy-path.spec.ts` — deterministic/mock mode, disclosure, canonical ID, desktop/mobile, and 390px overflow coverage.

## Hosted-provider architecture later

A hosted adapter must run behind a server-side endpoint, not in this GitHub Pages client. The endpoint must:

1. accept only the versioned `AiItineraryRequest` schema;
2. reapply input size limits and allowlists server-side;
3. call the chosen provider with structured-output enforcement;
4. keep model credentials exclusively in server-side secret storage;
5. enforce strict timeout, response-size, quota, abuse, and rate limits;
6. avoid retaining raw preference data in logs;
7. validate output server-side against the supplied candidates;
8. return only the `AiItineraryComposition` ID/reason-code contract;
9. allow the browser to validate the response again; and
10. preserve deterministic fallback for every failure mode.

## GitHub Pages security warning

GitHub Pages is static hosting. It cannot protect a hosted-model credential.

Never store a provider key in repository files, generated JavaScript, browser storage, client configuration, or a `VITE_*` environment variable. Vite embeds `VITE_*` values in the browser bundle; they are public, not secret. No hosted adapter may be enabled until a server-side boundary and its security/abuse controls exist.
