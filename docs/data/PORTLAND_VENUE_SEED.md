# Portland curated venue seed

- Last researched: 2026-07-17
- App data: `src/data/portlandVenues.ts`
- Recommendation logic: `src/lib/curatedVenueRecommendations.ts`
- Scope: controlled Portland alpha
- Inventory: 35 records; all 35 automatically recommendable as static seeds

## Why this exists

A curated local seed makes the alpha more credible without requiring a paid Places backend. It gives LumaDate enough real Portland restaurants and cafés to react to area, cuisine, vibe, and budget cues while the product is still validating recommendation quality.

This is intentionally **not live provider data**. The app does not store ratings, review counts, opening hours, current menu prices, reservation inventory, wait times, or live availability. Every card sends the tester to Maps, reviews, or a venue’s first-party site for a current check.

## Inclusion method

A venue was included when it met at least one of these conditions:

1. It appears in a current 2026 Portland editorial or tourism guide and had a current first-party web presence where one was available.
2. It was explicitly requested as a founder seed and had a current first-party location/site plus corroborating current category or provider evidence.
3. It adds useful neighborhood, cuisine, budget, or date-style diversity to the controlled Portland pool.

Descriptions and date-fit tags are LumaDate-authored editorial metadata. They are not copied reviews. Broad `$` tiers are planning estimates, not current menu quotes.

## Primary research sources

- Portland Monthly, “The 50 Best Restaurants in Portland Right Now” / 2026 guide:
  https://www.pdxmonthly.com/eat-and-drink/best-restaurants-portland
- Portland Monthly, “The Definitive Guide to Portland’s Best Indie Coffee Shops” / April 2026:
  https://www.pdxmonthly.com/eat-and-drink/best-coffee-shops-cafes-portland
- Portland Monthly, romantic/date-worthy restaurants:
  https://www.pdxmonthly.com/eat-and-drink/romantic-restaurants-date-portland
- Travel Portland, current Italian restaurant guide:
  https://www.travelportland.com/culture/italian-restaurants/
- Travel Portland, current sushi guide:
  https://www.travelportland.com/culture/great-sushi/
- Eater Portland, current Thai restaurant guide:
  https://pdx.eater.com/maps/best-thai-portland-restaurants-pdx
- Eater Portland, current sushi guide:
  https://pdx.eater.com/maps/best-sushi-bars-restaurants-portland-nigiri-sashimi
- Eater Portland 38, updated April 2026:
  https://pdx.eater.com/maps/best-portland-oregon-restaurants
- The Infatuation Portland 25, published March 2026:
  https://www.theinfatuation.com/portland/guides/best-restaurants-hotels-portland-oregon
- Eater Portland romantic/date-night guide, updated February 2026:
  https://pdx.eater.com/maps/romantic-restaurant-bar-date-night-portland
- The Infatuation Portland classics guide, published March 2026:
  https://www.theinfatuation.com/portland/guides/classic-restaurants-portland-oregon

Each dataset row also stores its specific first-party and editorial source URLs.

## Current inventory

### Founder-requested seeds

| Venue | Area | Status | Notes |
|---|---|---|---|
| Farmhouse Kitchen Thai Cuisine | Pearl District | Recommendable | Current first-party Portland page and local Thai coverage |
| Piazza Italia | Pearl District | Recommendable | Current first-party site and Travel Portland Italian guide |
| Mio Sushi — NW 23rd | NW Portland | Recommendable | Current first-party location page |
| Fish & Rice | NW Portland | Recommendable founder seed | Current first-party and ordering surfaces were active; editorial coverage is older and the official page’s “winter hours” label requires a current-hours check |

### Restaurants

- Akadi
- Apizza Scholls
- Café Olli
- Canard
- Coquine
- Eem
- Gado Gado
- Kachka
- Kaede
- Kann
- Langbaan
- Le Pigeon
- Lovely’s Fifty Fifty
- Murata
- Nong’s Khao Man Gai
- Nostrana
- Ox
- St. Jack
- Tartuca
- Gino’s Restaurant and Bar
- Lechon

### Cafés and dessert stops

- Case Study Coffee
- Good Coffee
- Heart Coffee
- Keeper Coffee
- Less and More Coffee
- Portland Cà Phê
- Prince Coffee
- Roseline Coffee
- Soro Soro
- Tōv Coffee

## App behavior

The current alpha:

1. Scores recommendable venues against the selected Portland area, activity/mood tags, cuisine/free-text clues, and broad budget.
2. Shows four compact venue ideas beneath the ranked plan cards, prioritizes restaurants for dinner plans and cafés/dessert for coffee-style plans, and lets the user explicitly choose one.
3. Labels the list as static curation and explicitly says hours, menus, prices, and availability are not live.
4. Offers only user-initiated Maps and first-party-site handoffs.
5. Keeps the complete dataset behind the existing `PlacesProvider` abstraction so a protected live provider can replace or supplement it later.
6. Carries the selected venue into the itinerary summary and browser-saved plan without claiming a booking.
7. Excludes `needs-recheck` records and user-entered must-avoid terms from automated recommendations.

## Product-coverage cross-check

The seed was checked against the alpha criteria supplied during implementation:

- **Geography:** seven active Portland area groups, with neighborhood-level labels inside each record.
- **Price:** broad planning tiers from `$` through `$$$$`, covering budget, moderate, and special-occasion use cases.
- **Atmosphere:** explicit quiet, lively, romantic, casual, cozy, playful, and conversation-first tags.
- **Dietary and alcohol fit:** conservative dietary signals end in `-to-verify`; cafés/dessert stops are tagged as easy without alcohol, while restaurants distinguish food-forward from bar-forward use. These are ranking clues, never allergy-safety claims.
- **Booking style:** both reservation-oriented and walk-in options are represented.
- **Pairings:** every restaurant area has a park, walk, or activity pairing catalog.
- **Backups:** every automatically recommendable restaurant resolves to another restaurant in the same Portland area, favoring a similar broad price tier.
- **Ranking:** area, cuisine, activity/mood, budget, dietary text, alcohol preference, and free-text date clues feed the curated venue scorer. Must-avoid terms are exclusions, never positive matches.
- **Evidence strength:** multi-list editorial consensus receives a small ranking bonus; current-guide records remain standard seeds; founder-requested records remain available but do not inherit a consensus claim.
- **Itinerary:** the top restaurant fit, same-area backup, and area pairing appear as an explicit venue-flex block in the itinerary. It remains a suggested replacement rather than silently changing the demo itinerary or implying a booking.

The curated venue cards are supplemental suggestions. Choosing one updates the venue shown in the plan summary and Saved record; it does not claim that LumaDate booked or verified a table.

## Data maintenance policy

Recheck the dataset before a larger tester round and at least every 60–90 days while the alpha is active:

1. Open the first-party site.
2. Confirm the location still exists and the address/location identity is unchanged.
3. Check for closure, relocation, or major concept changes using a current independent source.
4. Update `verifiedAt`, source URLs, status, and any affected tags.
5. Keep disputed records as `needs-recheck`; never guess.
6. Do not add ratings, hours, exact menu prices, availability, or review counts to the durable static dataset.

## Known limitations

- “Popular” is an editorial curation signal, not a statistical ranking.
- Current editorial inclusion does not guarantee that a venue is open at the tester’s chosen time.
- Multiple-location cafés use a brand-level Maps search and first-party location page; the tester must choose a current location.
- Accessibility, dietary safety, and reservation requirements must be verified directly with each venue.
- Google/provider content is not copied into the dataset. Map and review URLs are external handoffs only.
