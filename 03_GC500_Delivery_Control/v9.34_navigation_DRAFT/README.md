# Navigation exits — v9.34

Author: Andrew Fisher

Frozen for final integration, not published by this task. Requested in the shared chat: “After done. bug check. navigation across all tabs check every area has a close button. and back button.” The main header retains its native Back control. Dialogs covering it gain a visible Back beside the existing Close, using the same native dismissal.

The actual v9.33 page confirmed Inventory and daily PDF previews survived Escape/browser Back, a nested Text drawer ignored Escape, and Today's toilet supplier link still opened Timeline after Event Portables moved to Sub-hired. This patch fixes those exits, focuses a surviving opener or current pane, confines keyboard focus to the upper overlay, and opens the correct supplier company while preserving Back to breakdown. Native Showcase and Machine history/keyboard handling remain in charge. Transient overlays close when a route changes; no extra history entries are introduced.

Five older dialogs (contract, breakdown, variation, carrier pairing and generated drop card) called `bump()` on ordinary Close/Cancel/backdrop dismissal. Their dismissal path is now separate from their unchanged explicit save/delete/withdraw path. Navigation must not save the record.

The helper watches only direct body overlay insertion/removal and each overlay's direct content/open attribute. It adds no record fields or storage. Escape falls through if the upper layer has no supported native exit. Auxiliary Back controls use existing components; no page layout or operational data was redesigned.

## Validation

- Actual-page focused read-only checks: **50/50**, including visible Back/Close clicks, Escape, browser Back, nested Escape closing only the upper layer, supplier navigation/return, five pure-dismiss paths, keyboard focus containment, removed opener fallback and mobile/desktop header hit testing.
- Native record byte representation unchanged, **zero native save attempts**, **zero runtime errors**. The strict harness blocked all network writes, including the map provider's session POST.
- All **40 inline scripts parse**; shared page checker passes; no new key/token strings.
- Patch guard test passes: exact single application, v9.33→v9.34 footer, second application and missing prerequisite rejected without modifying the file.
- Inspected actual 390px screenshots of Inventory, PDF, asset and contract headers, and a 1440px Inventory preview. Back and Close are visible, readable and unobscured.
- Independent source review covered nested handlers, native close reuse, focus return, history and the five pure-dismiss edits; no remaining blocker found.
- Prior actual v9.33 audit verified all 14 available main routes retain reachable global Back. Final all-tab desktop/phone sweeps belong to the integrating release owner. The last v9.31 sewage-family alias update does not change navigation; integration must apply this patch after the updated v9.33 chain.

Base tested: `cf3af701607eae858c4009cd0bbd4da48f7572b9de027d6c9a661a186c0c6a82`.
Focused candidate: `9d79d107f726811424aa1d6bf0dabd05ad4288804f0a998682f3b4d4d3cf777d`.

```sh
python3 patch_v934.py /private/path/candidate.html
BASE=/private/path/base-v933.html python3 tests/test_patch934.py
CHROMIUM_PATH=/usr/bin/chromium PAGE=/private/path/candidate.html NAV_OUT=/private/path/results \
  flock /tmp/gc500-browser.lock node tests/test_navigation934.cjs
python3 ../toolchain/check_page.py /private/path/candidate.html --base /private/path/base-v933.html
```

PDF generation is deliberately held pending in navigation tests; these tests exercise preview exits, not PDF content. Existing content-specific PDF tests remain the evidence for the document pages.
