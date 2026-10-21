# GC500 servicing presentation and stable map viewport

Author: Andrew Fisher

FROZEN DRAFT — handed over to Claude at Andrew’s request. Not READY TO UPLOAD and not live. Focused/source/visual checks and both final navigation sweeps pass; bounded native verification and guarded publication/read-back remain incomplete. Codex has stopped new execution; Claude receipt is not claimed. The separate v10.96 draft remains paused with its existing owner.

Andrew requested one visible Whole Night percentage, larger area lights, stronger glow in each area's existing colour, and clear matching area identities. Normal view retains the large whole-night hero; Big screen shows its already-bound map counterpart. Both bindings and all progress calculations remain intact. Area cards and the chooser show the existing canonical area number and full name; the unlocated scope uses its authoritative name without inventing a number. Selected cards, chooser and drawing outline use their existing shared colour. Saved completion alone enables the pulsing outline; the lamps retain their native eligibility gates. Reduced-motion and hidden-panel pause remain supported. Original drawings, photographs, geometry, permanent codes, print sheets and operational records are unchanged.

The existing resize callback used the new viewport dimensions when calculating the previous viewed centre. It also ignored height-only changes when the fit scale stayed constant. `resize1106_src.js` captures the previous dimensions before measuring the new ones and adjusts translation around the same world centre. Relative zoom, selected area/night and focus survive resize; there is no automatic Fit reset.

## Exact build

`patch_v1106.py` requires verified v11.05 SHA-256 `56fcb00987640d249e363936a61fefed8574e2a03c17933dca32b1e8c20b985c`. It composes the two bounded subpatches, changes only the release footer and protects the native state/data/map image spans and unrelated script contents.

Current composed candidate SHA-256: `7c3f21cef9a5d161bcd1dbf317465707b7f93df9e70fa873c3f1505e32e94716`. The official build matches this exact hash (21,050,643 bytes), with all 153 inline scripts parsed. Final desktop and phone sweeps passed 25 sections, seven links and Back, with zero script or console errors. Independent native verification and guarded publication/read-back remain required.

## Validation completed on this candidate

- 42 local browser presentation checks: one visible overall in normal desktop, fullscreen and phone; all configured area scopes visible together at 1920×1080 and 3840×2160; main phone figure above the fixed footer; larger area lamps and matching lit colours; complete percentages do not overlap lamps; saved-only pulse, undo, pending state, reduced-motion and hidden pause; canonical names/numbers and matching selected map colour. No mutating requests or browser errors.
- 42 actual-module browser resize/identity checks: height-only same-fit resize, portrait/landscape, repeated round trips, fullscreen, hidden zero-sized resize/reopen, refresh, stable map/image nodes, selected area/night/zoom/focus and finite transform. Centre drift remains below 0.05 screen pixels. Non-sequential IDs 7, 2 and 0 plus reordered areas prove labels use canonical IDs, not array positions. Zero network requests or browser errors.
- The predecessor callback reproduces the original same-fit and rotation drift in the same fixture. The corrected callback fixes both without changing model values.
- Final screenshots and exact receipts are private. Completion screenshots use synthetic local ticks and are not claims about live completion. Native live read-back remains the release owner's responsibility.

Commands (private paths supplied through environment):

```sh
SERVICING_BASE=/private/verified-v11.05.html python3 test_patch1106.py
flock /tmp/gc500-browser.lock env RESIZE_CANDIDATE=/private/candidate.html RESIZE_EVIDENCE=/private/resize node test_resize1106.cjs
flock /tmp/gc500-browser.lock env RACE_CANDIDATE=/private/candidate.html RACE_SNAPSHOT=/private/readback.json RACE_EVIDENCE=/private/presentation node test_servicingRace1106.cjs
```

The presentation fixture serves local copies only, aborts mutations and external requests, and holds the hydration sender. No tracker-link document is opened. The only animations added are bounded opacity changes; no continuous JavaScript render loop, blur or layout animation is introduced.
