# v9.46 — Print exits and phone navigation fit

Author: Andrew Fisher

READY for parent integration; not published. Apply once after v9.45; v9.41/v9.42 are accepted for focused testing. The patch advances the footer to v9.46.

Andrew asked for Close and Back throughout the page, with no clipped controls. The driver readiness check placed its only exits below the phone viewport after focusing the first checkbox. Drop-sheet preflight warnings inherited the A4 page’s width and expanded a 390 px phone to 718 px, hiding exits to the side and below the screen. The phone tab row also clipped the second caption line and the selected Timeline caption at its narrowest size.

The native dialogs now have a sticky top Close button, which the existing navigation helper pairs with Back. Both use the original cancellation action. The screen container of a drop sheet is clipped to the phone width while each actual sheet retains the native 190 mm width for fitting and printing. The phone tab row has four more pixels of height and a compact Tools column. All native routes and captions remain.

No readiness condition, approval, native printing/preflight sequence, document contents, records, financial data or save functions change. Genuine outstanding spotter, clash or print-fit warnings still require the existing decision; nothing is automatically approved.

Completed checks:

- 46 actual-page checks at 390 and 1440 px: top Back/Close after native driver auto-scroll, Escape, unchecked readiness with disabled approval, unchanged warning model, GN01/P55 native Print drop preflight, cancellation back to the equipment drawer and zero print calls.
- Every primary phone caption measured in every selected state at 320, 360 and 390 px; desktop at 1440 px. All fit without horizontal scrolling.
- The repaired phone warning has a 390 px document width; the native sheet still measures 718.109 px (190 mm).
- 12 guarded-patch/source checks, including wrong-base/idempotence rejection, unchanged complete print preflight and unchanged driver readiness logic apart from the added exit.
- 43 inline scripts parsed; zero new keys, operational writes or runtime errors; native record unchanged. All non-GET requests are refused. Only the existing Google map tile-session request was blocked.
- Phone screenshots inspected for both dialogs and the tab row. Detailed operational evidence stays private under `/workspace/private-exits946/evidence/`; only sanitised counters and hashes are checked in.
- Independent source review confirmed native cancellation and unchanged readiness paths. Parent owns final combined navigation sweeps and publication.

```sh
python3 tests/test_patch946.py /path/to/combined-v9.41.html
PAGE=/path/to/candidate.html EXIT_OUT=/private/evidence CHROMIUM_PATH=/usr/bin/chromium flock /tmp/gc500-browser.lock node tests/test_exits_actual946.cjs
```

Exact candidate and source hashes are in `evidence/checks.json`.
