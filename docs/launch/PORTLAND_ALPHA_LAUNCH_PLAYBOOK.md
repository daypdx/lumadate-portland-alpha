# LumaDate Portland alpha launch, ownership, funding, and cost playbook

- Last reviewed: 2026-07-17
- Status: Canonical founder-readiness brief
- Scope: Portland controlled web alpha and the path to a live-data Portland web beta
- Disclaimer: Planning information only; not legal, tax, investment, or accounting advice.

## Executive verdict

| Stage | Current position |
|---|---|
| Controlled Portland alpha | Ready for a limited 10–25-person usability cohort |
| Public Portland web beta | Not ready |
| Paid or heavily marketed launch | Not ready |
| Native iOS/Android applications | Later phase |
| Conventional equity fundraising | Premature |
| No-equity mentoring, grants, and service credits | Appropriate now |

The product experience is ahead of the live-data and operating infrastructure. The next milestone is evidence that Portland testers can complete the flow, trust the boundaries, and receive recommendations they would realistically use.

## The launch pathway

### Phase 1 — controlled alpha now

- Recruit 10–25 Portland-area testers.
- Ask for realistic preferences but only general starting areas, never private street addresses.
- Observe whether users can complete planning without assistance.
- Ask whether the first recommendation feels relevant and usable.
- Confirm users understand demonstration/estimated data versus externally verified/live data.
- Capture privacy, safety, accessibility, and trust failures as release blockers.
- Avoid speculative feature expansion during this phase.

### Phase 2 — protected live-data Portland beta

Only after alpha evidence supports the product:

- Put privileged provider calls behind a protected server or edge layer.
- Use server-side keys, quotas, rate limits, caching permitted by provider terms, and cost alerts.
- Integrate current place data, routes, and Portland weather with explicit error states.
- Enforce transportation, travel radius, accessibility, diet, operating hours, and other meaningful constraints.
- Keep reservations, tickets, messages, and calls as user-initiated provider handoffs.
- Add privacy-respecting analytics, error monitoring, support, feedback, and incident handling.
- Obtain professional review of privacy and terms before broad public use.

### Phase 3 — public Portland web beta

Recommended first true launch shape:

> Free, guest-first, Portland-only web beta with real venue data, no exact-address storage, no automated booking, and no required account.

Do not add a native shell, payments, background location, or broad market expansion until usage demonstrates that the recommendation engine creates repeat value.

## Alpha exit criteria

Do not open a public beta until:

- Real-device testing passes on iPhone Safari, Android Chrome, and desktop Chrome.
- No private origin appears in invitations, public plan text, saved public data, or safety shares.
- There are no recurring activation, navigation, or plan-generation failures.
- Testers understand LumaDate is an itinerary planner, not a dating app.
- Most testers find at least one plan they would realistically consider.
- Provider handoffs and estimated/verified language do not create serious trust confusion.
- Support, feedback, privacy, terms, monitoring, and incorrect-information response processes exist.
- Provider usage has hard quotas and a measured cost per completed itinerary.

## Founder control and ownership

Keep these under founder or founder-company control:

- GitHub account/organization and canonical repository.
- Domain registrar and DNS.
- Hosting and cloud accounts.
- Maps, Places, routing, weather, email, analytics, and monitoring accounts.
- Billing profiles and recovery methods.
- App-store accounts if native apps are later created.
- Customer/tester data and vendor contracts.

Do not let an agency, contractor, investor, or collaborator become the sole owner or recovery contact for any critical account.

### Contributor requirements

Before a human contributor receives meaningful access or produces work:

- Use a written agreement.
- Include confidentiality obligations.
- Include a present assignment of intellectual property, not only a vague “work for hire” statement.
- State that repository, documentation, design files, domains, credentials, and product data remain founder/company property.
- Grant least-privilege access and remove it when work ends.
- Never share personal master credentials.

### AI-assisted authorship

U.S. copyright protection requires human authorship. Purely AI-generated material may not be protected in the same way as human-authored work. Preserve evidence of human product direction and contribution:

- Human-written product requirements and decisions.
- Material review, selection, modification, integration, and testing of generated code.
- Git history and dated decision records.
- Human-created copy, taxonomy, curation, and original design decisions.

Use contracts, controlled accounts, trademarks, trade secrets, and proprietary operational knowledge alongside copyright; do not rely on copyright alone.

## Brand and IP posture

- A preliminary exact-wordmark search did not identify an exact `LUMADATE` federal result when reviewed, but that is not legal clearance.
- Search confusingly similar names, common-law use, state records, domains, app stores, and relevant federal classes before filing.
- The current USPTO base application fee is generally $350 per class, with possible additional fees and professional costs.
- Patent filing is not an immediate priority unless counsel identifies a genuinely novel technical method.
- Protect private ranking logic, curation methods, quality-control processes, and nonpublic operating knowledge as trade secrets.
- Do not publish potentially available domain choices before they are secured.

## Location/provider data rules

- Never expose privileged provider keys in frontend code.
- Do not scrape venue providers or represent stale data as live.
- Google Places content cannot be treated as an unrestricted permanent proprietary venue database.
- Store provider identifiers and content only as allowed by the applicable terms; preserve required attribution.
- Build durable LumaDate-owned data from original curation, user feedback obtained with permission, direct venue relationships, and properly licensed sources.
- Use field masks, candidate reuse, strict quotas, and cost monitoring.
- National Weather Service data may reduce weather-provider cost, subject to its terms and availability.

## Expense preparation

These are planning ranges, not quotes.

### Next 60 days: controlled-alpha reserve

Recommended authorization ceiling: **$1,000–$3,000**.

Possible uses:

- Domain and business email: $50–$200.
- Tester incentives: $250–$750.
- Oregon entity filing if formed now: verify the state fee at filing; budget approximately $100 for the filing itself.
- Initial startup/IP attorney consultation: $500–$1,500 planning allowance.
- Hosting, AI tools, and controlled backend experimentation: $0–$300.
- Contingency: $300–$500.

Do not authorize a large agency build during this phase.

### Live Portland beta

- AI-assisted implementation plus targeted professional legal, security, accessibility, and engineering review: approximately $10,000–$25,000.
- Fully outsourced public-beta build and launch: potentially $50,000–$100,000 or more.
- Ongoing provider/hosting/monitoring cost must be measured from real usage rather than assumed.

Before approving live-data spend, run a bounded provider experiment and calculate cost per completed itinerary under strict quotas.

## Funding order that preserves control

Pursue in this order:

1. Bootstrap and keep scope narrow.
2. Revenue or paid pilots when the product is ready.
3. Free SCORE/SBDC advising and Oregon ecosystem support.
4. Equity-free grants, service credits, and no-equity accelerators.
5. Strategic venue relationships without exclusivity or product-control rights.
6. Angel/accelerator/venture financing only after traction improves negotiating leverage.

### Oregon opportunities

- Oregon AI Accelerator: published FAQ says participation is free, takes no equity, and offers competition for up to $50,000 in equity-free grant prizes. Apply only if AI is a real core product capability, not merely a tool used to build the app. Applications were closed when last reviewed; monitor future cohorts.
- Portland SBDC and SCORE Portland: appropriate for no-equity operating guidance.
- Oregon Entrepreneurs Network and the Metro Region Innovation Hub: ecosystem, mentoring, and connection resources.
- Oregon Venture Fund and Elevate Capital: later-stage conversations after measurable traction; assume equity and diligence.
- Do not rely on an accelerator or fund listing until its current application path and terms are verified directly.

### Equity guardrails

Avoid:

- Giving away major ownership for routine development work.
- A “technical cofounder” receiving a large stake solely to rebuild an existing prototype.
- Exclusive agreements that restrict LumaDate’s product or venue options.
- Investor board control at the prototype stage.
- Personal guarantees for speculative software work.
- Any deal that transfers the repository, domain, data, or provider accounts.

Current published accelerator structures can include more dilution than a headline percentage implies. Model the entire SAFE/equity package with counsel before signing.

## Founder responsibilities without coding experience

The founder does not need to become the primary programmer. The founder must own:

- Product scope and non-goals.
- Tester recruiting and interviews.
- Recommendation-quality judgment.
- Portland venue/category strategy.
- Privacy and trust decisions.
- Budget approval and vendor selection.
- Account ownership and access reviews.
- Written acceptance criteria for AI agents and contractors.
- Verification that changes pass tests and match the product promise.

AI can accelerate implementation, but every release still requires source control, automated checks, human review, and real-user validation.

## Immediate action list

1. Keep this repository canonical and deploy only from reviewed source.
2. Run the 10–25-person Portland controlled alpha.
3. Record completion, relevance, trust, repeat-use, and willingness-to-pay signals.
4. Spend no more than the controlled-alpha reserve without a documented reason.
5. Schedule one startup/IP attorney consultation before contracts, money collection, or broad public use.
6. Complete trademark clearance before relying heavily on the name.
7. Secure a suitable domain privately before announcing availability.
8. Contact no-equity local support resources.
9. Monitor a future Oregon AI Accelerator cohort if LumaDate truthfully qualifies.
10. Define the live-data beta from tester evidence, not speculative features.

## Official sources reviewed

- U.S. Copyright Office AI initiative: https://www.copyright.gov/ai/
- USPTO trademark application information: https://www.uspto.gov/trademarks/apply
- USPTO fee schedule: https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule
- Google Places API policies: https://developers.google.com/maps/documentation/places/web-service/policies
- Google Maps Platform pricing: https://developers.google.com/maps/billing-and-pricing/pricing
- National Weather Service API: https://www.weather.gov/documentation/services-web-api
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Supabase pricing: https://supabase.com/pricing
- Oregon AI Accelerator FAQ: https://oregonaiaccelerator.com/faqs
- Oregon Entrepreneurs Network Portland resources: https://www.oen.org/programs-services/regional-resources/portland/
- Business Oregon Regional Innovation Hubs: https://www.oregon.gov/biz/programs/Regional_Innovation_Hubs/Pages/default.aspx
- Oregon Venture Fund entrepreneur information: https://www.oregonventurefund.com/entrepreneurs
- Techstars investment terms: https://www.techstars.com/newsroom/investment-terms
- Y Combinator deal terms: https://www.ycombinator.com/deal

## Change policy

When material facts change:

1. Update the `Last reviewed` date.
2. Identify the official source.
3. Separate verified facts from planning estimates.
4. Add a dated report if the launch verdict or technical evidence changes.
5. Commit the change with a focused documentation message.
