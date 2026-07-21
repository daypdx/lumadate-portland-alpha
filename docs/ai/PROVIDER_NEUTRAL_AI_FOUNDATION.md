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
6. In internal mock-preview mode only, `composeAiItinerarySafely(...)` descriptor-inspects the allowlisted request, validates a closed bounded schema, and passes only the resulting detached, recursively frozen authority snapshot to the local mock composer.
7. `validateAiItineraryComposition(...)` first copies untrusted output into a bounded, frozen plain-data snapshot, then validates it against the same immutable request authority and accepts only validated plan IDs, venue IDs, and reason codes. Provider mode is not part of this untrusted response contract.
8. The app resolves those IDs back to the same LumaDate-owned plan and venue. Canonical meet-area authority uses that selected catalog venue's area when it defines the anchor or first stop, otherwise the intake-matching catalog neighborhood, then the plan's deterministic fallback neighborhood. The resulting canonical identity drives stops, invites, safety shares, saved plans, reminders, and Maps handoffs.
9. Malformed, empty, timed-out, thrown, or invalid composer output falls back to eligible deterministic LumaDate candidates only. If none are eligible, no AI selection is applied and the normal deterministic UI remains available.
10. Changing an intake or eligibility input aborts and invalidates the current generation, removes only explicitly tracked AI-owned venue selections, and immediately resynchronizes saved canonical records from the next intake and full plan catalog. Fresh-personal and example-demo intake replacements use the same saved-record synchronization rule while resetting current venue selections. Later manual venue choices remain authoritative even when their ID equals a prior AI-selected ID.

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
- the plan is compatible with the alcohol preference. Alcohol-centric or bar-tagged plans are ineligible unless the preference is `alcohol_ok`.

The validator rejects unknown, duplicate, over-budget, different-area, and safety-ineligible plans. The primary plan must be present in the returned plan list and must remain LumaDate's first deterministically ranked eligible candidate; a provider cannot replace that authority. A response may select one to three plans.

### Venues

A venue option is supplied only when:

- its area matches the selected intake area, including when that area is a secondary plan neighborhood;
- its price tier fits the total-date budget tier;
- it is not `bar-forward` when the alcohol preference excludes bars;
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

LumaDate converts these codes to visible copy with `reasonCodesToCopy(...)`. No model-authored visible prose is accepted. Provider-authored summaries, explanations, invitations, safety language, facts, addresses, hours, prices, and availability claims are rejected by the response schema.

## Response contract and fallback

A validated composer response contains only:

- `schemaVersion: 1`;
- `primaryPlanId`;
- one to three plan selections containing `planId`, optional `venueId`, and approved `reasonCodes`; and
- `verificationRequired: true`.

After validation succeeds, `composeAiItinerarySafely(...)` stamps the result with the explicit trusted invocation mode (`mock` or `hosted`) supplied by application-owned adapter wiring. The composer cannot author, replace, or impersonate that mode. Any composer-supplied `providerMode` is an unexpected field and fails closed to deterministic fallback. `providerMode: fallback` is internal application state created only by the safe wrapper. An internal fallback result may contain zero plans when no candidate passes every hard eligibility rule. User-facing disclosure and toast selection consume only this trusted wrapper result, never provider response metadata.

Before schema validation, the boundary copies output into a recursively frozen snapshot made only from plain own data properties. It rejects accessor properties without invoking them, custom prototypes, symbol keys, sparse arrays, circular references, non-finite numbers, unsupported value types, and excessive string length, array length, object key count, nesting depth, or serialized size. Oversized arrays are rejected from their length before their elements are traversed. Schema validation then rejects wrong versions, missing verification, any composer-supplied mode, unexpected fields, unknown or duplicate IDs, unapproved or duplicate reason codes, oversized IDs, empty composer plan arrays, and more than three selections. Accepted results use the frozen snapshot rather than the provider-owned object; only then does the wrapper add trusted application-owned mode state.

Before any request field is read as authority, the safe wrapper copies only plain own data properties by descriptor into a bounded, recursively frozen snapshot. The request boundary rejects accessors without invoking getters or setters, coercion hooks, custom prototypes, symbol keys, sparse arrays, custom iteration, circular references, non-finite numbers, unsupported value types, excessive strings, arrays, object key counts, nesting, or serialized size, and every field must match the closed request schema and allowlists. Snapshot construction and validation occur inside the fail-closed wrapper. If either fails, the composer is never called and the wrapper resolves to an application-owned empty fallback with no AI selection because no trustworthy candidate authority exists.

For a valid request, provider code cannot change candidate eligibility, reason-code permissions, venue permissions, or fallback authority synchronously or across an `await`; validation and fallback both use the same detached immutable snapshot rather than the caller-owned request. Caller mutation after invocation likewise cannot change the snapshot used by the composer, output validator, or deterministic fallback.

Fallback selects only candidates that pass area, budget, and safety eligibility. If none are fully eligible, fallback returns no AI selection; it never promotes an ineligible first-ranked plan. Caller cancellation and timeout both abort the signal passed to the composer and return deterministic fallback at the composition boundary. In the app, a generation epoch prevents a cancelled, superseded, or intake-invalidated completion from applying any plan, venue, saved-state, disclosure, or navigation update. Hosted-provider failure must never block the normal deterministic planning UI, which remains available independently of AI selection.

## Code map

- `src/ai/itineraryComposer.ts` — request/response types, allowlisting, provider interface, immutable snapshot validation, copy translation, cancellation, timeout, and fallback.
- `src/ai/itineraryComposer.test.ts` — privacy, schema, snapshot, eligibility, cancellation, timeout, and fallback tests.
- `src/App.tsx` — deterministic ranking, candidate construction, feature-mode boundary, generation epoch, explicit venue provenance, saved-record synchronization, and canonical ID resolution.
- `src/App.test.ts` — planning safeguards, candidate eligibility, provenance, saved-record synchronization, and stale-generation tests.
- `tests/happy-path.spec.ts` — deterministic/mock mode, disclosure, canonical ID, desktop/mobile, and 390px overflow coverage.

## Hosted-provider architecture later

A hosted adapter must run behind a server-side endpoint, not in this GitHub Pages client. The server must never trust browser-supplied candidate allowlists, IDs, eligibility booleans, venue metadata, or reason-code permissions. The endpoint must:

1. enforce request-byte limits before parsing where the server stack permits, then validate a versioned high-level preference request with closed allowlists and bounded scalars;
2. treat every browser-supplied plan ID, venue ID, eligibility value, candidate list, and reason-code permission as untrusted input rather than authority;
3. reconstruct candidate plans, deterministic rank order, plan and venue eligibility, and permitted reason codes from server-owned, versioned catalogs and deterministic rules;
4. call the chosen provider with structured-output enforcement and no model-authored visible-prose fields;
5. keep model credentials exclusively in server-side secret storage;
6. enforce response-byte limits before parsing where possible, plus strict quota, abuse, and rate limits;
7. pass an `AbortSignal` through the adapter and honor server timeout or client-disconnect cancellation;
8. avoid retaining raw preference data in logs;
9. validate provider output server-side against the reconstructed server-owned candidates and permissions;
10. return only validated plan IDs, venue IDs, and approved reason codes, never model-authored visible prose;
11. allow the browser to validate the response again without treating browser checks as the security boundary; and
12. preserve deterministic fallback for every failure mode, with no AI selection when no candidate is fully eligible.

## GitHub Pages security warning

GitHub Pages is static hosting. It cannot protect a hosted-model credential.

Never store a provider key in repository files, generated JavaScript, browser storage, client configuration, or a `VITE_*` environment variable. Vite embeds `VITE_*` values in the browser bundle; they are public, not secret. No hosted adapter may be enabled until a server-side boundary and its security/abuse controls exist.
