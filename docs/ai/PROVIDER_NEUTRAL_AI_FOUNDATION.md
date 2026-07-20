# Provider-neutral AI itinerary foundation

## Status

Implemented as a safe mock foundation for the Portland controlled alpha. No hosted model, AI API key, or new external data provider is connected.

The guided form remains the primary experience. LumaDate still owns ranking, venue eligibility, canonical itinerary stops, safety copy, budget checks, and provider-verification language.

## Current flow

1. The guided form produces the existing `Intake` record.
2. `rankPlans` applies LumaDate's deterministic product and safety rules.
3. Curated venue matching supplies approved venue IDs for each ranked plan.
4. `createAiItineraryRequest` creates an allowlisted model request. It intentionally excludes `startLocation`.
5. The provider-neutral `ItineraryComposer` interface composes only from supplied plan and venue IDs.
6. `validateAiItineraryComposition` rejects unknown plan IDs, unknown venue IDs, and street-like addresses in AI-authored text.
7. `composeAiItinerarySafely` falls back to deterministic LumaDate candidates when a composer throws or returns invalid output.
8. The results screen clearly labels the current implementation as a safe mock and uses the composition explanation on each plan card.

The selected `DatePlan` remains the complete itinerary source. This prevents the composition layer from inventing stops, venues, routes, reservations, hours, prices, ratings, or availability.

## Code map

- `src/ai/itineraryComposer.ts` — request/response types, provider interface, mock composer, validation, and fallback.
- `src/ai/itineraryComposer.test.ts` — privacy, candidate-boundary, address-safety, and fallback tests.
- `src/App.tsx` — converts ranked plans into approved candidates and connects the composition result to the results flow.
- `tests/happy-path.spec.ts` — desktop/mobile disclosure and generated-results browser coverage.

## Trust boundaries

- Never send a private starting location or street address to a model.
- A model may select only candidate plan IDs and venue IDs supplied by LumaDate.
- Model-authored text is limited to summaries and explanations.
- Canonical itinerary content and provider facts remain app-controlled.
- Every result continues to require current provider verification.
- Hosted-provider failure must never block deterministic planning.
- Browser code must never contain a hosted-model secret.

## Connecting a hosted provider later

Implement another `ItineraryComposer` adapter behind a serverless endpoint. The endpoint should:

1. Accept the `AiItineraryRequest` schema only.
2. call the chosen model with structured-output enforcement;
3. return an `AiItineraryComposition` only;
4. set strict timeout, size, quota, and rate limits;
5. avoid request or response logging that could retain personal preference text;
6. validate output server-side and allow the browser to validate it again;
7. keep provider keys in server-side secrets, never `VITE_*` variables; and
8. preserve the current deterministic fallback.

Before enabling a hosted adapter, add tests for malformed JSON, timeouts, rate limits, empty candidates, duplicate IDs, prompt-injection text in free-form intake fields, and provider error responses. The UI label must change only when a real hosted adapter is actually active.
