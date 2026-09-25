# GC500 Delivery Control — v5.90 and v5.91 (25 Sep 2026, Andrew Fisher)

Both are page patches on the live hosted page (`patch_v590.py`, `patch_v591.py`, `patch_v591b.py`, exact-once
replacements, also applied to `print/build_asset_app.py`). Uploaded with `upload_kit.py`; media unchanged.

## v5.90 — one way round, one way through
- Every map starts the way D001 is drawn (beach along the top): the satellite pins map, the street-level map, the
  register map and the 3D satellite open at the sheet's bearing (`DATA.georef.orientation.sheet_top_bearing_deg`,
  89.84°); each map's compass says where north is.
- The full-screen frame that carried The Coates Way machine now carries the satellite plan explorer and the 3D
  proof as well (pages of the hosted machine set); its header switches between them without leaving the page.
  Entry points on the Map tab (all three boards) and The Coates Way tab. Each page is fetched only when pressed.

## v5.91 — fewer pages, one Plant page, pictures in their drawers
- Breakdowns, Register and Edit are set aside (TABS_OFF, as Variances, Journal and Add were in v5.86). Plant takes
  Register's place in the primary bar and carries the asset register beneath the plant lines (the register's own
  pane moved in and drawn by its own renderer, so search, lights and discipline filters still work). Every link
  that went to the Register goes to Plant. The Today cards for Breakdowns and Edit are hidden.
- Documents: photographs are one race-card per category — drop photographs (117), fencing dockets (44), site
  pictures (6), other pictures — with the count and a strip of four thumbnails; a press opens that category's
  gallery with a way back and the other categories a tap away. Nothing is re-filed.
- The v5.90 frame buttons use their own attribute (`data-mopen`) so a document card's `data-open` (a reference or
  a picture) is never mistaken for them; the Map tab shows the buttons on the hosted page from the first draw.

## Explorer and 3D proof (hosted machine set, same day)
- Both open the D001 way round; the explorer's overview map is the sheet as drawn with north marked; N turns
  north-up, As drawn (D) turns back. Both carry a navigation row (Dashboard, Plan on satellite, 3D proof, The
  Coates Way) when opened on their own, hidden inside the dashboard's frame.

## v5.92 — the presentation pass
- Plant has a glyph in the tab bar like every other primary view (it sat unaligned without one).
- The delivery gauge sweeps up on every arrival at Today, not once per session (GI_SEEN cleared on a change of tab).
- The big figures on the race cards and data cards count up when a page arrives: any bold whole number set 22 px
  or larger in the arriving pane, 640 ms, once per arrival, the rendered text put back exactly; off under
  reduced motion.
- Cards lift a touch under a pointer; text is antialiased and legibility-optimised; big figures use tabular
  lining numerals so they do not jiggle while counting.
- Limit: the illustrative banners are 1800 × 600 (a few 2600 × 1837) and are shown about 1900 CSS px wide, so a
  4K or Retina screen upscales them roughly two times. Everything drawn by the page (cards, gauge, lights, type)
  is vector and crisp at any size; the photographs need originals of about 3800 px wide to match.

## v5.93 — smooth, no lag
Measured on a phone profile throttled four times (Playwright, CPU ×4): Where we are took 9.1 s to draw and the
first tap on a tab was lost in it; Today 4.8 s. After v5.93: 3.2 s and 1.9 s; long tasks after load 38.8 s → 16 s.
- `isoIn()` built a new Intl.DateTimeFormat on every call, thousands of times a render: one formatter, made once;
  `todayIso()` cached for a second.
- `fitKpis()` read then wrote once instead of shrinking and measuring in a loop (a layout per step per figure).
- Plant paints its plant lines first and draws the register 40 ms later.
- A tapped tab lights up on the same frame; its page is drawn on the next, so the press is answered at once.
- THE LOST FIRST TAP, FOUND: the header car's reflection (v5.87, `.hzcarref`, absolute, 84 px below the brand
  row) sat over Today and Where we are in the tab bar and took the tap meant for them. No header decoration takes a
  pointer now. Every tab hit-tested on laptop and phone profiles: all reach their button.
- The banner's race-day pod carries the full countdown: whole days, then hours:minutes:seconds to midnight on race
  day on the Gold Coast, ticking with the clock.

## v5.94 — smooth, no lag, second pass
- The money formatters are made once (toLocaleString with options built an Intl.NumberFormat per call).
- The branch roll-up and the money summary are remembered for the length of one draw (RENDER_MEMO, emptied at
  the start of every render pass).
- Measured, headless: Where we are 1,918 → 480 ms; Today 923 → 275 ms; Plant 1,220 → 466 ms. Phone profile
  throttled four times: a tap on Where we are 9.1 s → 1.9 s; Today 4.8 s → 1.5 s.
