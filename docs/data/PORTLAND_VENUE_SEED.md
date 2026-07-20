# Portland curated place catalog

- Last researched: 2026-07-19
- App data: `src/data/portlandVenues.ts`
- Recommendation logic: `src/lib/curatedVenueRecommendations.ts`
- Scope: controlled Portland alpha
- Inventory: 77 records; 76 automatically recommendable and one `needs-recheck`

## Why this exists

The catalog gives LumaDate enough real Portland restaurants, cafes, dessert shops, parks, and activities to create useful date combinations without exposing a paid Places API key or claiming live availability.

This is intentionally **static editorial and public-place data**, not live provider data. LumaDate does not store ratings, review counts, current hours, exact menu prices, reservation inventory, ticket inventory, wait times, or live availability. Every place retains an official/public link and a user-initiated Maps handoff for a current check.

## Catalog shape

### Recommendable records by kind

| Kind | Count |
|---|---:|
| Restaurant | 40 |
| Cafe | 8 |
| Dessert | 6 |
| Park | 11 |
| Activity | 11 |
| **Total recommendable** | **76** |

One additional cafe, Tōv Coffee, is retained as `needs-recheck` and excluded from automatic recommendations because its previously verified first-party website returned 404 on 2026-07-19.

### Recommendable records by routing area

| Area | Count |
|---|---:|
| SE Portland | 18 |
| NW Portland | 11 |
| Downtown Portland | 9 |
| NE Portland | 9 |
| Alberta Arts District | 8 |
| Mississippi / Williams | 7 |
| Pearl District | 7 |
| Sellwood / Moreland | 7 |

### Broad price estimates

| Tier | Count | Intended meaning |
|---|---:|---|
| `$` | 30 | Free, budget, or casual stop |
| `$$` | 21 | Moderate outing |
| `$$$` | 20 | Elevated dinner or outing |
| `$$$$` | 5 | Special-occasion anchor |

These tiers are broad itinerary-planning estimates, not current quoted prices.

## Required record identity

Every stored place has:

- A stable kebab-case `id`.
- An exact location-specific name.
- A neighborhood.
- A stable routing area.
- A public address.
- A place kind and cuisine/category tags.
- A broad price estimate.
- A booking-use category.
- Original LumaDate date-fit tags and summary.
- An official, municipal, or first-party URL.
- One or more source URLs.
- A Maps search URL generated from the exact name and public address.
- A verification date and status.
- One or more compatible same-area place IDs.

Brand-wide placeholders such as “Multiple Portland locations” are not allowed. Routing records must identify a specific branch.

## Inclusion method

A place is included when it has a current location identity and meets at least one of these conditions:

1. It appears in a current Portland editorial or tourism guide and has a current first-party location surface.
2. It is a founder-requested seed with adequate first-party evidence and honest lower-confidence labeling.
3. It is a public park, museum, theater, bookstore, garden, or activity verified through a municipal or first-party page.
4. It fills a material area, price, cuisine, dietary, alcohol-fit, backup, or date-style gap without relying on unsupported popularity claims.

Descriptions and date-fit tags are LumaDate-authored. They are not copied reviews.

## Provenance tiers

### `editorial-consensus`

The place appeared across multiple named current editorial lists. Consensus is a small ranking tie-breaker, not a rating.

Current multi-list-consensus records include:

- Akadi
- Kachka
- Kann
- Langbaan
- Le Pigeon
- Lovely’s Fifty Fifty

### `current-guide`

The place has a current first-party identity plus current or still-relevant reputable guide coverage.

### `founder-seed`

The founder explicitly requested the place. It remains eligible only when current first-party evidence supports its identity, and it does not inherit an unsupported “best” claim.

Founder seeds:

- Farmhouse Kitchen Thai Cuisine — Pearl District
- Piazza Italia
- Mio Sushi — NW 23rd
- Fish & Rice

Fish & Rice remains a lower-confidence founder seed. Its first-party and ordering surfaces supported operation during research, but stale “winter hours” wording requires a direct current-hours check.

### `official-verified` (shown as “first-party verified”)

A business location is supported by a current first-party page but is not represented as an editorial-consensus or current-guide selection. This tier is useful for specific dessert and cafe branches without inventing popularity.

### `official-public` (shown as “official-source destination”)

A park, museum, theater, garden, bookstore, arcade, or other destination is supported by a current municipal or first-party page. The label describes the source, not ownership or independent certification, and it does not promise operating hours, programming, tickets, or access.

## Primary research sources

Each record stores its own first-party and corroborating URLs. Reused guide sources include:

- Portland Monthly, current restaurant guide:
  https://www.pdxmonthly.com/eat-and-drink/best-restaurants-portland
- Portland Monthly, current indie coffee guide:
  https://www.pdxmonthly.com/eat-and-drink/best-coffee-shops-cafes-portland
- Portland Monthly, romantic/date restaurant guide:
  https://www.pdxmonthly.com/eat-and-drink/romantic-restaurants-date-portland
- Eater Portland 38, updated April 2026:
  https://pdx.eater.com/maps/best-portland-oregon-restaurants
- Eater Portland date-night guide:
  https://pdx.eater.com/maps/romantic-restaurant-bar-date-night-portland
- Eater Portland Italian guide:
  https://pdx.eater.com/maps/best-italian-restaurants-portland-pasta-pizza
- Eater Portland Thai guide:
  https://pdx.eater.com/maps/best-thai-portland-restaurants-pdx
- Travel Portland neighborhood and category guides:
  https://www.travelportland.com/
- City of Portland Parks and Recreation:
  https://www.portland.gov/parks

## Newly researched restaurant tranche

The 2026-07-19 expansion added location-specific records across the established routing areas, including:

- Dolly Olive
- Q Restaurant & Bar
- Arden
- Andina
- Phuket Cafe
- Victoria Bar
- Casa Zoraya
- Urdaneta
- Gabbiano’s
- no saint
- Hat Yai — Killingsworth
- Oma’s Hideaway
- Jacqueline at 2500 SE Clinton Street
- Sebastiano’s — Sellwood
- Jade Bistro & Patisserie

Relocation and branch cautions are stored directly on affected records. Conflicted candidates such as Higgins, Takibi, Gumba, sweedeedee, and Khun Pic’s Bahn Thai were not imported into the active catalog.

Research also confirmed that Interurban and Expatriate had closed in 2026; they were not imported. JinJu Patisserie was excluded because its former Williams branch is officially marked permanently closed and a reported replacement location was not yet established as active at the research cutoff.

## Parks and activities

The catalog now contains sourced public companions rather than only free-text pairing ideas. Examples include:

- Tanner Springs Park and Jamison Square
- Wallace Park and Cinema 21
- Laurelhurst Park, Mt. Tabor Park, and OMSI
- Irving Park and Hollywood Theatre
- Peninsula Park and Curious Comedy Theater
- Sellwood Riverfront Park, Oaks Bottom Wildlife Refuge, and Oaks Amusement Park
- Director Park, Portland Art Museum, Lan Su Chinese Garden, and Ground Kontrol
- Alberta Park, Alberta Rose Theatre, and McMenamins Kennedy School
- Powell’s City of Books

Schedules, admission, age rules, trail conditions, exhibits, performances, and ticket availability are never treated as live.

## Compatible nearby stops

`compatibleVenueIds` is populated deterministically from active records in the same stable routing area.

Compatibility order is intentionally complementary:

- Restaurants prefer same-area parks/activities, then cafes/desserts, then another restaurant.
- Parks and activities prefer same-area cafes/desserts, then restaurants.
- Cafes and desserts prefer same-area parks/activities, then restaurants.

The output stores concrete stable IDs, not only a shared “Portland” label. Tests require every compatible ID to resolve, differ from the source ID, and share the same routing area.

Every active restaurant also resolves to:

- A same-area restaurant backup, favoring a similar broad price tier.
- A sourced same-area park or activity companion.

## App behavior

The controlled alpha:

1. Scores active places against area, activity/mood tags, cuisine/free-text clues, broad budget, dietary text, and alcohol preference.
2. Prioritizes restaurants for dinner plans and cafes/desserts for coffee-style plans.
3. Uses parks and activities as explicit nearby companions.
4. Labels the catalog as static and tells users to verify current details.
5. Offers only user-initiated Maps and first-party-site handoffs.
6. Carries a selected venue into the itinerary summary and browser-saved plan without claiming a booking.
7. Excludes `needs-recheck` records and must-avoid terms from automatic recommendations.
8. Keeps the catalog behind the existing provider abstraction so a protected live provider can supplement it later.

## Automated safeguards

`src/portlandVenues.test.ts` enforces:

- 75–100 active recommendable records.
- Unique stable IDs and names.
- Presence of all five kinds.
- At least 40 restaurants.
- At least 12 combined cafes/desserts.
- At least eight parks and eight activities.
- Location-specific addresses and official links.
- Valid HTTPS source and Maps URLs.
- Compatible same-area stop IDs for every record.
- Area, price, atmosphere, dietary, alcohol, and booking-use coverage.
- A same-area backup and sourced companion for every active restaurant.
- Exclusion of `needs-recheck` records from provider output.

## Data maintenance policy

Recheck the dataset before a larger tester round and at least every 60–90 days while the alpha remains active:

1. Open the first-party or municipal page.
2. Confirm the place and exact address still exist.
3. Check for closure, relocation, major concept changes, or schedule dependency using a current independent source where practical.
4. Update `verifiedAt`, source URLs, status, and affected tags.
5. Keep disputed records as `needs-recheck`; never guess.
6. Re-run the catalog tests after any ID, area, status, or place-kind change.
7. Do not add ratings, hours, exact menu prices, availability, or review counts.

## Known limitations

- Editorial inclusion is evidence, not a statistical popularity ranking.
- Current-source evidence does not guarantee a place is open at the tester’s chosen time.
- Static budget tiers may become stale.
- Compatible stops share a maintained routing area; they are not live distance or travel-time calculations.
- Accessibility, dietary handling, age restrictions, programming, tickets, and reservations must be verified directly.
- Google/provider content is not copied into the dataset. Maps and review URLs are external handoffs only.
