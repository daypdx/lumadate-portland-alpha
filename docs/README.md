# LumaDate documentation

This directory is the durable project record for the Portland controlled alpha. Start here when returning to the project or handing work to another human or AI agent.

## Current source of truth

- [Launch, ownership, funding, and cost playbook](launch/PORTLAND_ALPHA_LAUNCH_PLAYBOOK.md) — current launch verdict, founder-control rules, expense bands, funding order, legal/IP cautions, and next actions.
- [Architecture decision 0001](decisions/0001-portland-web-alpha-before-native.md) — why LumaDate is validating a Portland web alpha before live-data expansion or native apps.
- [A/B and dogfood handoff](testing/ab-testing-codex-handoff.md) — repeatable review brief and regression priorities.
- [2026-07-17 live Variant A baseline](testing/reports/2026-07-17-live-variant-a-baseline.md) — initial deployed landing-page findings and highest-value A/B questions.
- [2026-07-17 technical verification](testing/reports/2026-07-17-technical-verification.md) — commands and results supporting the current alpha verdict.

## Product definition

LumaDate is an intake-based date itinerary planner. It is not a dating, swiping, or matching service.

The controlled alpha is Portland-only, guest-first, and demonstration-data-labeled. It intentionally excludes accounts, automated booking, payments, real messaging, background location, and native apps.

## Documentation rules

1. Keep the repository and deployment under founder-controlled accounts.
2. Never commit credentials, private addresses, tester personal information, API keys, or legal communications.
3. Label mock, estimated, externally verified, and live provider data accurately.
4. Update the launch playbook when the launch verdict, budget, ownership posture, or provider strategy changes.
5. Add dated verification reports rather than silently rewriting historical evidence.
6. Record durable architecture/product decisions in `decisions/`.
7. Treat legal and cost material as planning information, not professional advice or guaranteed quotes.
