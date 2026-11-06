# v12.63 — the Build day cards redrawn (MOCK-UP, not on the page)

Author: Andrew Fisher · 30 Oct 2026 · **mock-up only**: nothing here is applied to the page, the record or the money.

Andrew, 30 Oct 2026 05:21 AEST, with four phone screenshots of the Build tab's day cards: "We need these cards looking
better. I want all the details with weather animation. But needs to look better. Any ideas at moment looks 5/10." Then:
"Show me examples".

`mock/build_cards_mock.html` is a stand-alone page (no page code, no record) drawing three real days from the page's own
day records the way the cards could look, every detail kept:

| Example | Day | What it shows |
|---|---|---|
| 1 | Wed 7 Oct 2026 (Build week 2) | a busy day, 11 of 11 loads in the 05:00–12:00 window, gusts 63 km/h |
| 2 | Thu 15 Oct 2026 (Build week 1) | the big barrier day, 3 of 4 on time, P60 26 min late, gusts 50 km/h |
| 3 | Sun 4 Oct 2026 | a quiet Sunday at half height |

What changes against today's cards: the day and its sky lead (the date large, a weather tile with an animated scene from
the BOM record — sun with slow rays, drifting cloud, gust streaks over 40 km/h, rain when it rained — the tile tinted by
the weather); the ink stamp becomes a small "Day completed" seal; the whole-build figure is one clean bar ("49% at
least", the exact figure stays in More info); deliveries are a mini gantt with the booked window as a shaded band and one
lane per equipment type, green tick in the window, amber when late; "What went in" uses the map symbol set with fixed
rows; staff as initial chips; the life saving rule as one slim strip; quiet days at half height. Three text sizes, faint
dividers, no wavy background.

The delivery bar times in the mock are illustrative (drawn from the current cards' pictures, not read from the record);
everything else is the page's own data for those days. Pictures: `mock/phone-card-07oct.png`, `mock/phone-card-15oct.png`,
`mock/phone-card-04oct.png`, `mock/weather-scenes.png` (rendered at 390 px, 2×, by `mock/shoot.cjs`).

If Andrew says go, the build is the v12.47/v12.04 card renderer redrawn to this layout (desktop and phone), the weather
scene driven by the day's BOM record, reduced-motion respected, the existing "Pause animation" control honoured; tests on
the three days above plus the last build day; preview before upload.
