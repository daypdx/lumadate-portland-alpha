# LumaDate Portland Alpha

Controlled Portland web alpha for LumaDate, an intake-based date itinerary planner. This repository is the canonical source for the public alpha and deploys automatically through GitHub Pages after verification passes.

## Alpha boundaries

- Portland-only demonstration plans and public-area meet points.
- No accounts, GPS tracking, messages, notifications, payments, calls, or reservations.
- Place, route, crowd, and weather details are demonstrations or provider handoffs that must be verified.
- Starting-area input is not retained in browser storage or included in public plan text.
- Search indexing is disabled while the alpha is controlled.

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run test:run
npm run test:e2e
npm run build
```

## Project documentation

Start with [`docs/README.md`](docs/README.md) for the durable project record and file map.

Key references:

- [`docs/launch/PORTLAND_ALPHA_LAUNCH_PLAYBOOK.md`](docs/launch/PORTLAND_ALPHA_LAUNCH_PLAYBOOK.md) — canonical launch verdict, founder-control rules, funding order, expense preparation, and next actions.
- [`docs/decisions/0001-portland-web-alpha-before-native.md`](docs/decisions/0001-portland-web-alpha-before-native.md) — accepted staged-launch decision.
- [`docs/testing/ab-testing-codex-handoff.md`](docs/testing/ab-testing-codex-handoff.md) — current ChatGPT/Codex-ready A/B and dogfood brief.
- [`docs/testing/reports/2026-07-17-live-variant-a-baseline.md`](docs/testing/reports/2026-07-17-live-variant-a-baseline.md) — initial deployed landing-page A/B baseline.
- [`docs/testing/reports/2026-07-17-technical-verification.md`](docs/testing/reports/2026-07-17-technical-verification.md) — evidence behind the controlled-alpha readiness verdict.

## Deployment

Pushes to `main` run lint, unit safeguards, desktop/mobile browser tests, and a production build. GitHub Pages deploys only after every verification step succeeds.

## Tester privacy

Never enter a street address, another person's private information, or emergency information. Use a Portland city or neighborhood and verify every provider detail before relying on a plan.
