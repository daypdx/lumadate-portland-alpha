# Variant B UX implementation response

Date: July 21, 2026

This pass responds to the desk-based A/B and UX review of the LumaDate Portland alpha. It implements the recommended itinerary-first Variant B direction without adding provider side effects or changing the canonical plan data model.

## Product decisions

- Reduce intake from seven visible pages to four stages: Where + time, Vibe + budget, Personal clue, and Review.
- Let users enter the planner or preview an example before showing the alpha acknowledgement.
- Require the acknowledgement before generation, plan selection, or saving.
- Keep optional travel, weather, preference, and safety controls available through progressive disclosure.
- Separate plans that fit both area and budget from nearby alternatives that break a stated preference.
- Use distinct Choose this plan, Save, and View details actions.
- Hide itinerary navigation until a plan is selected.
- Keep the ranked-plan screen focused by withholding the supporting privacy and forecast column until after selection.

## Copy and comprehension

- The landing promise is now "Plan a great Portland date in minutes."
- The intake review uses a compact natural-language brief instead of concatenated field fragments.
- Interest extraction filters filler terms such as "love" and "enjoy" and presents the remaining interests as a readable list.
- Nearby alternatives disclose their area or budget tradeoff instead of receiving the same best-match treatment.

## Preserved safeguards

- Private street addresses remain excluded from generated and shared content.
- Plans, venues, Maps links, invites, reminders, and safety shares continue to use canonical application-owned records.
- Bookings, reservations, payments, calls, and messages remain mocked or external handoffs only.
- Normal mode remains deterministic. The local mock AI preview remains limited to the explicit preview query mode.

## Validation target

- No horizontal overflow at 390 by 844.
- Equal landing actions on mobile and desktop.
- Exactly three independently actionable ranked plans.
- Supporting navigation hidden until selection.
- Lint, unit, build, and desktop/mobile Playwright gates green before review.

This is an implementation response to a heuristic review, not evidence from live traffic or statistically significant A/B testing.
