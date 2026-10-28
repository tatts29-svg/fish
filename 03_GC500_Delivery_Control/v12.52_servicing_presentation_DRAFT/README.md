# Servicing presentation preview

Author: Andrew Fisher

**PREVIEW ONLY — not READY and not live.** Andrew reviews the desktop and phone previews before any presentation release. This builds independently on exact live v12.50, SHA-256 `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`. It is not a production successor of another draft.

The Servicing tab becomes three night cards, Friday 23, Saturday 24 and Sunday 25 October. Each opens its existing Night report on demand, including its current score, locations, crew details and final-night lock-up content, plus the existing native Print / PDF document. The reports keep their own Coates A4 styling. The surrounding cards keep the current dark Coates tab styling. Other tabs, Build cards, weather, monetary models and operational records are unchanged.

Old tab presentation is bypassed only while this preview adapter is present. The original tracker reader, report model, report HTML, pagination and print functions remain in the code. The per-card Print / PDF path reuses their native renderer and pagination. Legacy `svcNight1202` / `report1202.open` compatibility is a separate pre-production gate: bypassing the old poll can leave its closure snapshot empty even though the preview has a verified read. No other live caller was found beyond the now-hidden original Night report button, but no claim is made that all shared entry points are already preserved. The adapter uses the existing bounded `SvcAdminReader` and existing edit-authorised GET method, validates the event tracker against the page's reference/day/plan configuration, and builds all three reports through `report1202.model` and `report1202.html`. No completion or financial calculations are duplicated. The three cards start collapsed with no report frames. Opening a card creates its report near the viewport. Frames contain only the native report and expand to fit its pages rather than imposing a second scrolling area. Refresh work runs only while the tab is visible, with a bounded interval and shared in-flight request.

## Access boundary and open requirement

The existing page intentionally restricts `/api/ticks` and `svcNight1202` to the edit link because tracker responses contain private site information. This preview preserves that boundary, including synchronous removal of its report DOM and models when capability is lost. The public view retains the existing edit-link notice. It does not embed a private tracker snapshot or expose its token.

Therefore the requested identical report display on public view and edit links is **not complete**. A separate, deliberately scoped report-read path is needed before that part can be accepted. No authentication bypass or backend redesign is included in this preview. Private edit-mode screenshots can establish the presentation choice without representing public access as implemented.

## Reproduce privately

```sh
python3 build_preview.py /private/path/live50.html /private/path/preview52.html
```

The build refuses an unknown base and proves that reversing its two narrow lifecycle hooks and removing its appended CSS/JS restores every byte of the original page. It does not change the live footer version or make a production-release claim.

The browser check uses private frozen main-record and native tracker snapshots. Set `BASE`, `PAGE`, `STATE`, `TRACKER_DIR` and `OUT` explicitly; `TRACKER_DIR` contains `tracker-list.json`, `tracker-pages.json` and `tracker-snapshot.json`, never committed. Run `node tests/preview.cjs` under `/tmp/gc500-browser.lock`. The harness blocks all HTTP writes. Edit capability is simulated only inside that local rehearsal; no edit URL or credential is embedded.

Checks compare the original native reports with the preview's model and complete screen/print HTML for all three nights. They also check all three cards, visible report pagination, popup controls, monetary/document preservation, bounded repeated wakes, capability-loss cleanup and the unchanged public notice. Actual reports, financial probes and screenshots remain private. A production release still needs Andrew's preview review, the public-view requirement resolved or explicitly narrowed, a rebuild on its then-current predecessor and full release checks.

## Completed preview evidence

Frozen preview SHA-256 `f2128139050c4fc829cd21342d7861ba4c0da211857e6d06a4be1791e58817a9`. The private native baseline and desktop/phone preview captures use the same fresh private record snapshot. A fresh complete tracker GET preserved every event from the initial private capture.

The native comparison passes for all three report models and complete screen/print HTML; every per-card print popup retains native pagination. Documents and the checked monetary projections are exact. Both viewports have three ordered cards and zero initial report frames. Repeated render/wake calls cause no extra reads; capability loss removes private DOM, including revocation while pagination is pending. Runtime errors, console errors and attempted writes are all zero. The public-view notice remains unchanged.

The native report can paginate beyond its original two-page design when recorded content requires it. Actual original popups were opened with their existing font-loading and pagination path, and candidate print counts match; no rows are dropped or forced onto two pages. Detailed counts and actual report screenshots remain private.

Desktop and phone collapsed overviews have been inspected. Full-height locator screenshots of embedded reports are clipped by the app's scrolling viewport and are not complete-page visual evidence. The separate `tests/report_scroll.cjs` check scrolls the actual outer `MAIN` container and hit-tests each native report sheet through its iframe. Every sheet is reachable and visible, with zero errors or attempted writes. First, middle and last viewport screenshots for each night have been inspected privately; the earlier large blank locator capture was a screenshot artifact. Native A4 pages retain their existing unused page space. All UI timestamps in the controlled screenshot rehearsal use the documented fixed test clock, not a new live-status assertion.
