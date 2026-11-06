**VERIFIED LIVE — 9 Oct 2026 05:51 AEST, combined v9.34.** Author: Andrew Fisher. The full served page matches SHA256 `b881e8890e8a590fea79ac63657fd43254c5ccdd11735d7f70a1b4874773c33c` (12,295,093 bytes). All 22 tab routes, eight direct links and Back passed on phone and desktop. Final public 390px/1440px checks passed for the supplier route, product information, two VMS units and per-item photo targets; operational record remains 4633. Detailed component evidence below includes the earlier scope candidates. Final combined evidence: `../v9.34_navigation_LIVE/evidence/combined_release.json`.

# Sub-hired company home

Author: Andrew Fisher.

Released with the combined v9.34 page.

Andrew requested a real Sub-hired tab and confirmed Event Portables should not occupy the bottom of Timeline. The patch adds `subhired` to the standard main navigation and native rendering/deep-link/Back flow. It removes the separate `ep819Html()` Timeline append entirely. Ordinary scheduled supplier deliveries remain chronological day records.

The reviewed company identity/quotes panel moves from About to Sub-hired. Company buttons select its existing unique per-unit owner model. Confirmed external owners explicitly say **Sub-hired · company**; unknown ownership is not asserted. Only Event Portables displays its full existing supplier plan, rules, planned runs, allocation/cancellations and native print/email/inventory actions. The unit list scrolls within its panel; every row remains available. Native identity, ownership, finance, plans and record functions are unchanged. Root's later unit identity component owns per-unit badge and number improvements separately.

Apply after components 28–31 with `python patch_v932.py <candidate.html>`. Supported input footer versions are 9.28–9.31; output footer is 9.32. Reapplication fails closed.

Validation: `test_v932.py <base.html>` verifies deterministic source boundaries; toolchain `check_page.py` checks all inline scripts. `browser932.cjs` uses the canonical harness with strict GET-only request policy installed before initial navigation; run serially under `/tmp/gc500-browser.lock` with PAGE, CHROMIUM_PATH and NODE_PATH. Desktop and phone checks cover main tab, initial deep link, company pointer/keyboard navigation, native stop expansion and printable run overlay, captured email/inventory action dispatch (no actual send), Timeline removal, Back, viewport fit and unchanged shared record. Expected denied Google mapping setup is counted honestly as one blocked POST. No operational records are written. Root owns exact combined final sweeps/publication/readback.

Private candidate and screenshots: `/workspace/private-supplier932-candidate.html`, `/workspace/private-supplier932/`. They contain live records and are not committed.
