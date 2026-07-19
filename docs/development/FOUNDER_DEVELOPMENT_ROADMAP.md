# LumaDate founder development roadmap

- Recorded: 2026-07-19
- Owner: Zachary Day
- Product: LumaDate Portland Alpha
- Purpose: preserve the next-step engineering, human-help, learning, validation, funding, and ownership strategy

## Current position

LumaDate is a working Portland-first date-itinerary prototype, not merely an idea. It is also not ready for serious fundraising, acquisition outreach, automated booking, accounts, payments, or broad public traffic.

The correct sequence is:

1. Stabilize the engineering foundation.
2. Validate the product with real users.
3. Prove a repeatable value and revenue hypothesis.
4. Seek outside capital or acquisition conversations only when evidence supports them.

## Product boundaries

The controlled alpha remains:

- Portland-only.
- Guest-first.
- A planning product, not dating/swiping/matching.
- Honest about static, estimated, and externally verified information.
- Free of accounts, payments, automated booking, real messages/calls, background GPS, and native-app complexity.
- Protective of private origin addresses.

## Immediate engineering milestone

### Milestone 1 — one plan, one source of truth

Every plan surface must consume the same canonical ordered stops. Ranked cards, itinerary, invite, safety share, saved plan, reminders, running-late text, and map/provider handoffs must not reconstruct or pair stops independently.

A stable conceptual model is:

```ts
type PlanStop = {
  id: string
  time: string
  purpose: string
  venueId?: string
  area: string
}
```

### Fix order

1. Eliminate itinerary, safety-share, invite, and Maps venue mismatches.
2. Enforce the selected area and budget before labeling a result `Best Fit`.
3. Add ordered cross-surface tuple regression tests.
4. Remove or relabel dead handoffs such as a nonfunctional `Call venue` control.
5. Add visible and accessible copy/save confirmation.
6. Move focus and announce each wizard-step transition.
7. Make modal backgrounds inert to assistive technology.
8. Remove malformed fallback text such as `Flexible with .`.
9. Prove GitHub Pages is serving the intended tested commit.
10. Test physical desktop Chrome, iPhone Safari, and Android Chrome.

Do not add major features until these gates pass.

## Human technical help

### Best first role

Use a senior React/TypeScript engineer for a bounded paid architecture and repair sprint. The goal is not a redesign or a code takeover. Ask the engineer to:

- Review the repository architecture.
- Review or repair the canonical itinerary model.
- Review privacy and browser-storage behavior.
- Review tests and deployment.
- Explain every material change.
- Leave documentation and simpler ownership boundaries behind.

Start with one difficult bug or a small audit rather than an open-ended build contract.

### Outreach template

> I am the founder of LumaDate, a Portland-first date-itinerary planner. I have a working React/TypeScript/Vite controlled alpha and a detailed QA report. I need a senior engineer for a bounded architecture and repair sprint, not a redesign. The immediate work is maintaining one canonical itinerary model, preventing result/share/Maps inconsistencies, strengthening regression tests, and reviewing GitHub Pages deployment. I also want the engineer to explain the code and leave documentation so I can become a stronger technical product owner.

### Places to look

- Portland technology events: https://calagator.org/
- Oregon Entrepreneurs Network mentorship: https://www.oen.org/programs-services/mentorship/
- TiE Oregon programs: https://www.tieoregon.org/oregon-programs
- Portland Incubator Experiment community: https://www.piepdx.com/
- YC free cofounder matching: https://www.ycombinator.com/cofounder-matching
- Bounded freelance searches through reputable marketplaces or warm founder referrals.

A technical cofounder is a long-term product/business partner, not an unpaid contractor. Complete a trial project before discussing major equity.

### Founder-control protections

- Keep GitHub, domain, hosting, analytics, and provider accounts under founder control.
- Grant the minimum repository access required.
- Use a written scope, acceptance tests, milestones, and payment terms.
- Require confidentiality and an explicit present assignment of intellectual property.
- Require pull requests and reviewable commits.
- Never share passwords or unrestricted credentials.
- Do not grant equity during an initial conversation.
- Use vesting and qualified startup counsel for any true cofounder arrangement.

## Founder code-learning path

The founder does not need to become a senior engineer. The practical goal is to become a technical product owner who can:

- Run the project and its tests.
- Read the main data and UI flows.
- Make contained changes.
- Review pull requests.
- Recognize unnecessary complexity and weak verification.

### Learning order

1. Git and GitHub.
2. HTML and CSS.
3. JavaScript fundamentals.
4. TypeScript types and interfaces.
5. React components, props, state, and event handlers.
6. Vitest unit tests.
7. Playwright browser tests.
8. Deployment and browser debugging.

### Six-week project-based track

**Week 1 — repository navigation**

- Run development, lint, unit, E2E, and build commands.
- Learn branch, diff, commit, pull request, and rollback basics.
- Identify `src/App.tsx`, `src/data`, `src/lib`, providers, and tests.

**Week 2 — JavaScript and TypeScript**

- Objects, arrays, functions, `map`, `filter`, and `find`.
- Interfaces, unions, optional values, and type narrowing.

**Week 3 — React**

- Components, props, state, event handlers, and conditional rendering.

**Week 4 — tests**

- Read and modify a Vitest invariant.
- Read a Playwright happy-path test.
- Add one small behavior test before implementing a fix.

**Week 5 — small real tickets**

- Improve copy/save feedback.
- Repair one fallback sentence.
- Improve one label or empty state.
- Avoid using the canonical itinerary refactor as a first coding exercise.

**Week 6 — review a human pull request**

Ask the engineer to explain what changed, why, what could break, how the tests prove it, and how to roll it back.

### Primary learning resources

- MDN Learn Web Development: https://developer.mozilla.org/en-US/docs/Learn_web_development
- React Learn: https://react.dev/learn
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- GitHub Skills: https://skills.github.com/
- Playwright: https://playwright.dev/docs/intro
- Vitest: https://vitest.dev/guide/

## Business mentorship

Start with free or low-cost mentoring before paying a general startup consultant.

- Clackamas SBDC: https://oregonsbdc.org/center/clackamas-sbdc/
- Oregon SBDC no-cost advising: https://oregonsbdc.org/service/advising/
- SCORE Portland free mentoring: https://www.score.org/or/portland/
- Oregon Entrepreneurs Network: https://www.oen.org/
- TiE Oregon: https://www.tieoregon.org/

Ask for experience in consumer technology, customer discovery, software business models, hospitality/travel, startup finance, and early-stage funding.

## Validation before funding

### Controlled-alpha evidence

Recruit approximately 10–20 Portland testers only after release blockers pass. Measure:

- Intake completion.
- Time to first useful plan.
- Ranked-plan open rate.
- Venue/map handoff clicks.
- Invite/safety-share use.
- Whether the tester actually used the plan.
- Repeat planning.
- Trust and confusion points.

Interview testers about what they did, not only whether they liked the concept.

### Revenue hypotheses

Test one primary hypothesis at a time:

- Consumer subscription.
- Premium or concierge itinerary.
- Hotel/concierge licensing.
- Local-business sponsorship.
- Disclosed affiliate/referral revenue.
- Employer or membership benefit.

Do not build all models simultaneously.

## Funding path

### Near term

The least dilutive near-term resources are:

- A bounded founder development budget.
- No-cost SBDC/SCORE/OEN/TiE guidance.
- A paid pilot.
- A local sponsorship or partnership.
- Measured referral revenue where provider terms permit it.

General consumer-app development usually does not qualify for innovation grants merely because software is involved.

### After traction

- OEN Angel Oregon Technology: https://www.oen.org/2026-technology/
- TiE Pitch Oregon: https://www.tieoregon.org/pitch-oregon
- Oregon Venture Fund founder path: https://www.oregonventurefund.com/entrepreneurs
- Future Oregon AI Accelerator cohorts, only if AI is genuinely central: https://oregonaiaccelerator.com/founder-resources

National accelerators should be considered only if LumaDate demonstrates venture-scale potential. Review the complete dilution structure, not a headline check size:

- YC deal: https://www.ycombinator.com/deal
- Techstars investment terms: https://www.techstars.com/newsroom/investment-terms

Do not authorize equity or a large development contract before customer evidence and qualified advice.

## Selling the product or idea

A broad app idea is rarely a valuable standalone asset. A buyer normally pays for users, revenue, contracts, distribution, brand, defensible technology/data rights, or a proven team.

Potential future buyer categories could include dating platforms, reservation providers, travel/local discovery products, hotel or concierge technology, event-discovery platforms, and experience marketplaces. Approach them only after LumaDate can show credible metrics and a clean ownership history.

Acquire.com publishes criteria for some pre-revenue SaaS listings, including active customers and a bounded price: https://help.acquire.com/seller-faqs-1

Selling before usage evidence would likely produce a weak valuation. Build a measurable asset before pursuing acquisition.

## Ninety-day sequence

### Days 1–30 — stabilize

- Close release-blocking inconsistencies.
- Align deployment and source.
- Obtain a senior human code review.
- Complete physical-device checks.
- Freeze nonessential features.

### Days 31–60 — validate

- Run a 10–20-person controlled alpha.
- Observe real planning sessions.
- Record product metrics and structured interviews.
- Do not represent static data as live availability.

### Days 61–90 — choose the business path

- Test one revenue hypothesis.
- Prepare a one-page summary, short deck, basic financial model, evidence summary, demo, and architecture overview.
- Decide whether to bootstrap, pilot, apply to a program, recruit a cofounder, or pause/pivot.

## Immediate founder checklist

1. Contact Clackamas SBDC.
2. Request a SCORE Portland mentor.
3. Attend one OEN, TiE, PIE, or Calagator-listed founder/technology event.
4. Recruit a bounded senior React/TypeScript reviewer.
5. Keep all accounts and product decisions founder-controlled.
6. Stabilize before fundraising or acquisition outreach.
