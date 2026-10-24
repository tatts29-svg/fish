# v8.09 phone controls and presentation review

Author: Andrew Fisher · 3 Oct 2026, AEST · isolated proposal, not live

Reviewed immutable source `ba9fff7ec48d3d49d037f461c145b1abd6f2c957`, folder `v8.09_coates_way_machine_DRAFT/work/`. No moving implementation, source snapshot or operational record was changed. Existing components, layout, styling, teaching copy and vehicle appearance are preserved.

Two functional defects reproduce in the actual source functions using controlled pointer and DOM doubles. The proposal fixes both. It also includes two explicit button names and an optional tour focus improvement. These are CPU/source results, not browser, screen-reader or physical-device certification.

## Reproduced functional findings

| Priority | Trigger and observed result | Source | Small correction |
|---|---|---|---|
| P1 | Touch the steering wheel, add a second finger, then lift both. After either release order, or cancellation of the first pointer, `steerHeld` remains `true`. In the outside view `controls.enabled` remains `false`, so subsequent background drags cannot orbit. | `car-app.js:347`: every pointer-down sets `grab=null` before rejecting a second pointer; the release handler at 353 has then lost the object that releases steering and restores orbit. | Move `grab=null` after the multiple-pointer/not-ready guard. Retain the original grab until its own release/cancel. Single-touch release still works; cockpit orbit stays intentionally disabled. |
| P2 | Start Guided tour, then open Find a part. Both the tour card and the native modal register remain open. Closing the register reveals the still-running tour, contrary to the one-surface rule. | `car-app.js:312`: `openRegister` closes only the exhibit; it never ends or hides the tour. | Call `endTour()` before `closeCard()` and `showModal()`. The register becomes the sole surface. |

The pointer correction does not redesign gestures or promise that a two-finger gesture beginning on the wheel becomes a pinch. It fixes the stuck state after the fingers leave. Actual pointer capture and orbit recovery still need the shared browser check.

## Accessibility findings and optional improvement

- **P2, static naming defect:** at widths up to 1,180 px, `.header-actions #tour span{display:none}` removes “Guided tour” from the accessibility tree, leaving only `▷`. `index.html:4` has no explicit accessible name. Add `aria-label="Guided tour"` and the initial `aria-pressed="false"` to the existing button.
- **P2, static naming defect:** `index.html:9` names the inspector disclosure only `−` or `+`; `aria-expanded` conveys its state but not what it controls. Add `aria-label="Toggle selected part details"` and `aria-controls="inspect-content"`.
- **Optional accessibility improvement:** after Next, the tour title and copy change while focus remains on Next, and the tour content has no live announcement. CPU execution verifies that focus stays on `tour-next`. Move the existing heading-focus call into `showTour()`, so each step places focus on `tour-title`. This follows the draft’s existing first-step behaviour. Screen-reader speech was not tested and is not claimed.

The existing card implementation already has a named non-modal dialog, persistent 44 px close button, Escape handling, opener return, scrollable body and focus styling. Source inspection found that card scrolling does not reach the canvas’s pointer handlers, and the single exhibit replaces previous exhibit content. No duplicate teaching copy was added or removed by this proposal.

## Evidence and replay

[Proposal script](phone/apply_proposal.py) writes new files to a separate output directory and refuses a source with different hashes. [Patch](phone/phone-controls.proposed.patch) shows only six exact fragment changes in `car-app.js` and `index.html`; no CSS changes. Full candidate source is deliberately kept outside this review folder.

```sh
python3 phone/apply_proposal.py /path/to/reviewed/work /tmp/phone-review
node phone/check_phone_cpu.cjs /path/to/reviewed/work/car-app.js /tmp/phone-review/car-app.proposed.js /tmp/phone-results.json
python3 phone/check_names.py /path/to/reviewed/work /tmp/phone-review/index.proposed.html
node --check /tmp/phone-review/car-app.proposed.js
```

Run from this review directory. [Recorded CPU results](phone/results.json): 10 cases per candidate. Snapshot: two single-touch controls pass, six two-pointer cases reproduce the stuck state, register/tour coexistence reproduces, and Next leaves focus unchanged. Proposal: all 10 cases pass. The static label check reproduces both missing names and verifies both additions. The proposed module parses. Source extraction is executed directly; rendering and layout are stubbed explicitly.

| File | Reviewed source SHA-256 | Proposed SHA-256 |
|---|---|---|
| `car-app.js` | `718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707` | `d71f0ccbf13649b8643e0349ad8b9296be081539f811e2a58918cd7b9d7fe379` |
| `index.html` | `11dbc435a37111480dcac1f6cce55e1818de3b7968f71af39134e558acf5b4f9` | `fb07e7b09dd5574f3869f5e35ac61f22d950f42efbf13d7a2a2ddaa90d571148` |

## Browser follow-up and limits

The assigned browser reviewer has been asked to inspect Find a part during the tour and the close button, dock and tabs at 667 × 375 touch landscape. There is a source risk in short landscape: the studio keeps a 520 px minimum height and `placeCards()` enforces a 120 px minimum card height even when its measured available band is smaller. This is **untested**, not a reproduced layout defect; no speculative CSS change is included.

Portrait/landscape fit, touch hit-testing, focus after native dialog closure, actual screen-reader announcements and physical-device performance remain for browser/device validation. No broad accessibility pass or release readiness is claimed.
