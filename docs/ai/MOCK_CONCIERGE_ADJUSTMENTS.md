# LumaDate Mock Concierge Adjustments

## Purpose

The Adjust screen includes a local, deterministic Concierge prototype. It demonstrates how a future conversational planner can understand a short request, propose a safe plan change, and wait for explicit approval.

This feature does not use a hosted model, make network AI requests, send messages, or perform provider actions.

## Supported requests

- Set a maximum budget between $20 and $1,000.
- Make the date cheaper.
- Prefer a quieter plan.
- Switch to an indoor plan.
- Shorten the date.
- Prefer a more romantic plan.
- Add food or drinks.

The interface also provides four suggested requests. Unsupported requests receive a bounded explanation instead of invented behavior.

## Safety and data boundary

The interpreter rejects street-like addresses, phone numbers, email addresses, URLs, empty messages, and messages longer than 240 characters. Rejected private text is not repeated in the visible transcript.

Every proposal must already pass LumaDate's application-owned eligibility checks:

- Selected-area match.
- Existing intake budget.
- Public and first-date safety rules when required.
- Alcohol preference compatibility.
- At least one active, compatible, same-area venue from the curated catalog.

The Concierge cannot create a plan ID, venue ID, place, itinerary stop, price, or route.

## Approval flow

1. The user enters or selects one adjustment.
2. LumaDate interprets it locally.
3. The app selects only from eligible ranked plans.
4. A before-and-after preview shows the canonical plan, venue, duration, and example cost range.
5. The active itinerary remains unchanged until the user selects **Apply change**.
6. **Keep current plan** dismisses the proposal without changing the itinerary.

After approval, the existing canonical itinerary code remains authoritative for the itinerary, venue, invite, safety share, reminders, saved plan, and Maps handoff.

## Future hosted model boundary

A future hosted model may translate natural language into the same supported intent schema. It must run behind a server-side adapter and must not receive private starting locations. The current deterministic interpreter and application-owned eligibility checks remain the fallback and validation boundary.

Do not place provider secrets in browser code or `VITE_*` variables.
