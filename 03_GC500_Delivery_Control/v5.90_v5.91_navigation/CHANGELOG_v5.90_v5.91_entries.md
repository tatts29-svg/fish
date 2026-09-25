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
