# LumaDate alpha AI foundation — WIP handoff

Updated: 2026-07-19

## Resume point

- Repository: `https://github.com/daypdx/lumadate-portland-alpha`
- Working branch: `feat/alpha-ai-foundation`
- Do not merge into `main` or deploy this branch yet.
- Do not connect a hosted model yet.
- Preserve the expanded Portland catalog and all AI changes.
- The branch is intentionally a WIP checkpoint and is not release-ready.

## Current verification state

Last commands run before this handoff:

- `npx vitest run src/ai/itineraryComposer.test.ts`: **PASS — 28/28 tests**.
- `npm run build`: **EXPECTED FAIL — current TDD RED state**.

Current build errors are all caused by the next application-level test importing a helper that has not been implemented yet:

- `src/App.test.ts`: `aiCandidateInputsFor` is not exported by `src/App.tsx`.
- The resulting callback parameters are temporarily inferred as `any` until that helper receives its typed implementation.

This is the exact point where the next chat should resume.

## Completed hardening

### Privacy boundary

- `startLocation` is never serialized into an AI request.
- Raw `dateEnjoysText`, `userEnjoysText`, `cuisineLikes`, `dietaryLimits`, and `mustAvoid` are not forwarded.
- Those fields are reduced to allowlisted interest, cuisine, dietary, and avoid tags.
- Structured activity and mood values are allowlisted.
- Street-like addresses, phone numbers, emails, URLs, and social handles are removed before tag extraction.
- Prompt-injection prose cannot become composer instructions; only approved tags can survive.
- Candidate titles, scores, free-form reasons, warnings, and legacy free-form venue fields are not serialized.

### Candidate and response schema

- Candidate metadata includes area, budget, and safety eligibility.
- Venue options include area match, category match, and availability.
- The request builder removes different-area and wrong-category venue options.
- Composer output contains IDs and approved reason codes only.
- Approved reason codes:
  - `AREA_MATCH`
  - `BUDGET_MATCH`
  - `QUIET_FIT`
  - `INTEREST_MATCH`
  - `FIRST_DATE_SAFE`
  - `WEATHER_SAFE`
  - `BACKUP_AVAILABLE`
- LumaDate translates reason codes into visible copy with `reasonCodesToCopy(...)`.
- Provider-authored summaries, explanations, invitations, safety language, facts, addresses, hours, prices, and availability claims are not part of the output contract.

### Validation and fallback

The validator now rejects:

- wrong schema version;
- `verificationRequired !== true`;
- invalid provider mode;
- missing/invalid primary plan;
- primary plan absent from the returned plan list;
- unknown, duplicate, over-budget, different-area, or safety-ineligible plans;
- unknown, duplicate, different-area, wrong-category, or unavailable venues;
- missing, unknown, duplicate, unapproved, or excessive reason codes;
- unexpected response fields such as `summary` or `explanation`;
- empty plan arrays;
- more than three plan selections;
- oversized identifiers or total serialized output.

`composeAiItinerarySafely(...)` uses deterministic fallback for malformed text, empty/null/missing output, timeout, provider errors, and validation failure. If no AI choice is eligible, fallback preserves LumaDate's deterministic first-ranked plan.

### Feature-mode foundation

- `getAiFeatureMode('')` returns `deterministic`.
- Only `?aiPreview=mock` returns `mock-preview`.
- Values such as `?aiPreview=hosted` remain deterministic.
- No hosted model or provider secret is connected.

## Exact next implementation

Implement and export `aiCandidateInputsFor(...)` in `src/App.tsx` so the new RED test in `src/App.test.ts` passes.

The helper should:

1. Accept `Intake` and ranked plans.
2. Preserve each ranked plan's `areaMatch`, `budgetFits`, estimated high cost, duration, and deterministic order.
3. Compute `safetyEligible` from LumaDate-owned facts:
   - public-place requirement;
   - first-date safety when enabled or when `dateStage === 'first_date'`;
   - alcohol preference compatibility.
4. Generate approved reason codes from deterministic facts only.
5. Generate venue options only when all are true:
   - venue area matches the plan area;
   - venue kind matches `preferredVenueKinds(plan)`;
   - venue status is `active`.
6. Never include venue names, addresses, user free text, ranked free-form reasons, or warnings.
7. Use this helper inside `showItinerary()` instead of the current legacy candidate mapping.

After that helper is green, finish App feature-mode integration:

- Normal alpha generation must remain deterministic and must not call the composer.
- Internal `?aiPreview=mock` mode may call the safe mock composer.
- Hide the AI preview banner in normal alpha mode.
- Show exactly `AI foundation preview — safe mock, no hosted model connected` only in internal preview mode.
- Keep all canonical itinerary, invite, safety, saved-plan, reminder, and Maps flows tied to the same plan/venue/stop IDs.

## Remaining tests and work

- Complete the new `aiCandidateInputsFor(...)` unit test.
- Add/finish canonical-authority regression coverage for AI-selected plan and venue IDs.
- Update Playwright so normal mode proves the banner is hidden and internal preview proves it is shown.
- Add a 390px horizontal-overflow assertion.
- Update `docs/ai/PROVIDER_NEUTRAL_AI_FOUNDATION.md` with:
  - exact data sent;
  - exact data never sent;
  - reason-code catalog;
  - hard eligibility rules;
  - feature-mode behavior;
  - later server-side hosted-provider architecture;
  - explicit GitHub Pages warning that no provider secret may be stored in browser code or `VITE_*` variables.
- Run and require all of the following before release/merge:
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
  - `npm run test:e2e` as one complete desktop/mobile run
- Do not merge or deploy until every gate is green.

## Files currently in the working checkpoint

Core AI work:

- `src/ai/itineraryComposer.ts`
- `src/ai/itineraryComposer.test.ts`
- `src/App.tsx`
- `src/App.test.ts`
- `tests/happy-path.spec.ts`
- `docs/ai/PROVIDER_NEUTRAL_AI_FOUNDATION.md`
- `docs/README.md`

This handoff:

- `ALPHA_AI_FOUNDATION_HANDOFF.md`

## Security constraints

- No provider key or credential belongs in browser code.
- GitHub Pages is static hosting and cannot protect a hosted-model secret.
- `VITE_*` values are embedded in the client bundle and are not secret.
- A later hosted adapter must run server-side, keep credentials server-side, enforce the same schema and timeout, and return only validated IDs and reason codes.
