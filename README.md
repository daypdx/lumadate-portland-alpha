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

## Deployment

Pushes to `main` run lint, unit safeguards, desktop/mobile browser tests, and a production build. GitHub Pages deploys only after every verification step succeeds.

## Tester privacy

Never enter a street address, another person's private information, or emergency information. Use a Portland city or neighborhood and verify every provider detail before relying on a plan.
