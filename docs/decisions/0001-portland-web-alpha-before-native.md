# ADR 0001: Validate a Portland web alpha before broader launch

- Status: Accepted
- Date: 2026-07-17
- Decision owner: Founder

## Context

LumaDate has a polished itinerary-planning experience, but broad consumer reliability depends on real venue data, routing, weather, privacy operations, support, monitoring, and repeatable user demand. Building native apps or heavily marketing the product before those foundations are validated would increase cost and risk without proving that users value the recommendations.

## Decision

LumaDate will follow this sequence:

1. Controlled Portland web alpha with demonstration data and 10–25 testers.
2. Use structured feedback and observed behavior to validate the intake, ranking, itinerary, trust, and safety experience.
3. Add a protected server-side provider layer for live Portland place, route, and weather data.
4. Open a free, guest-first Portland web beta only after privacy, reliability, legal/support, and cost controls pass.
5. Consider accounts, monetization, broader markets, fundraising, and native applications only after the web beta demonstrates real use.

## Non-negotiable constraints

- Founder-controlled GitHub, hosting, domain, cloud, analytics, and provider accounts.
- No exact private origin in invitations, saved public plan text, or safety shares.
- No privileged provider keys in browser code.
- No fabricated availability, crowd levels, bookings, ratings, routes, or weather.
- User-initiated handoffs for reservations, tickets, messages, and calls.
- No automated booking, payments, real SMS, or background location in the current phase.
- Google Places content may not be treated as an unrestricted permanent LumaDate venue database; provider terms, attribution, and storage restrictions must be followed.

## Consequences

### Benefits

- Preserves ownership and negotiating leverage.
- Limits privacy, support, and provider-cost exposure.
- Produces evidence before expensive engineering or fundraising.
- Keeps source and deployment aligned through automated verification.

### Trade-offs

- The alpha cannot be relied on as a live date-planning service.
- Growth and native distribution are delayed.
- The founder must actively recruit testers, conduct interviews, and curate decisions.

## Revisit triggers

Reconsider this decision after the controlled alpha has documented tester outcomes and the following are true:

- No repeatable privacy or primary-flow failures.
- Most testers can complete planning without assistance.
- Recommendations are perceived as relevant enough to use.
- Estimated versus verified information is consistently understood.
- A live-data beta architecture and cost-per-itinerary model are validated.
