**Carried LIVE in v8.01 on 2 Oct 2026 at 15:19 AEST.**

# v7.98 — accurate drawer state and complete print instructions

Author: Andrew Fisher · 2 Oct 2026

**DRAFT — implementation and focused checks complete; independent final combined review and release checks remain with the release coordinator. Not uploaded.**

An open asset drawer kept saying “Live” after the service stopped answering, and could stay “Offline” after recovery. The existing `syncFooter()` now updates only its connection badge, without rebuilding fields, disturbing a draft or adding a timer. A view link says “Offline · view only”.

The drop-sheet print preflight handles missing `document.fonts` or `document.fonts.ready`; the old optional branch dereferenced null. It uses the existing sibling pattern, retaining the image verdicts whether fonts resolve, reject or are unavailable.

Driver and installer sheets now include their load references’ existing recorded delivery notes in the current “Where it goes” component. Previously `dpPage` omitted them entirely, including the Tuesday light-pole warning and Wednesday crane/traffic-control/sign-off instructions. The helper reads `deliveryOf(key).note`, escapes note/reference HTML, retains line breaks, combines identical notes with their reference labels and omits blanks. It applies only to delivery loads: an October delivery instruction does not reappear on a later removal sheet. The existing driver-check fingerprint already includes `dl.note`, so a changed instruction invalidates the earlier check.

## Integration

The patch requires v7.96 Equipment, uses the shared replacement helper and refuses duplicate application or a wrong base. Its only call sites are `precisionTags`, `syncFooter`, the optional font promise in `printPages`, the existing location section in `dpPage`, and the preview-scale reset in `dpPrint`. No source record, storage key, polling timer, map, photo, QR, reference hero, load grouping or Showcase code changes. The existing fixed 64 px preview offset now uses the measured toolbar height, through a CSS custom property. `dpZoomFit` measures the final toolbar wrapping after applying the width fit; `dpBarSay` and the existing resize callback keep it current; Close removes it, and physical print retains its zero-offset override. This prevents the wrapped phone toolbar from covering the Coates/document header. No component restyling. Rebuilt print sheets reset their existing screen-only `--dpz` zoom to 1 before the A4 fit/photo measurements; `dpZoomFit()` then restores the phone preview fit. Without this reset, opening another preview reused the old reduced zoom and made the native photo selector drop images.

Official build from live v7.96 plus v7.97 and this patch:

```bash
bash toolchain/build.sh v7.98 \
  v7.97_photo_outbox_durability_LIVE/patch_v797.py \
  v7.98_control_state_reliability_LIVE/patch_v798.py
```

Base SHA-256: `dd16fa3bd21d9e2b3f7e412e56855670dae7ebe5d5b03954b5951ba699c7f43c`.

Final combined candidate: **`9a52ec22c794a514d44936ef84335b62a6876c2664fa54f211a35f1315666d95`**, **8,919,805 bytes**. Official and private candidate bytes match. The official static check passes: six inline scripts parse, no added credentials.

## Focused verification

| Check | Result |
|---|---|
| Exact-source sync/font cases on final candidate | 13/13 |
| Exact-source delivery-note cases on final candidate | 10/10 |
| Desktop print checks, exact C2 notes, wrapped toolbar, resize and A → B → A previews | 31/31 |
| Phone print checks, wrapped toolbar and resize | 31/31 |
| Four exported A4 PDFs | Instructions complete and present once per load; driver sheet plus existing location sign = 2 pages, installer = 1 |
| Drawer outage/recovery browser cases | Earlier focused candidate 15/15 desktop + 15/15 phone; final combined repeat delegated to independent reviewer |
| Wrong-base / repeat guards | Previously verified to refuse before writing |

The print cases use actual Tuesday/Wednesday loads, locations, images and QR codes with isolated browser-only note-return fixtures copied exactly from the prepared C2 operations, including Tuesday’s attribution/date and 3-versus-4 count clarification. The source strings are recorded in `evidence/control798_note_fixtures.json`. They never save those fixtures into the record. A/B comparison against the same components without the note confirms unchanged load count, reference hero, four photographs and navigation QR. The complete example instructions fit the existing A4 page at its existing scaling. A deliberately overlong note remains complete and triggers the existing “page runs long” verdict instead of being silently truncated. The phone checks use the real `dpFromLink` preview shell, reuse the actual print container, and check the fixed 390 px device width. A → B → A switches between Tuesday driver and Wednesday installer sheets and back, retaining all four photos, correct notes, navigation QR and page fit each time. The harness never removes the preview container to sidestep the issue.

The CPU cases cover reference scoping, repeated rows, matching/different notes, CRLF/newline preservation, HTML escaping, blank notes, removal exclusion and no truncation. Both `drv` and `ins` use the note in their existing location section. Actual browser checks assert the document header starts below the toolbar for all four sheets, long status text and viewport resizing (320/390 phone, 1000/1440 desktop); print has no toolbar offset and Close clears the custom property. The font cases cover absent, missing-ready, resolved, rejected and pending APIs while preserving successful/failed/unknown image verdicts.

The drawer browser test exercises actual GET failures/recovery, capability downgrade/upgrade and same-node draft/focus/caret/scroll preservation. Disabling a focused field on capability downgrade already blurs it and can change phone scroll; an A/B comparison with badge refresh suppressed shows that the fix adds no such change.

Every non-GET request is aborted, and a second mock rejects any attempted document write before transport. No edit credential is used. Expected resource failures are only deliberately injected outages or the blocked Google tile-session POST. Browser capability capture records HTTPS secure context, SubtleCrypto, Blob.arrayBuffer and Web Locks on Chromium desktop and phone emulation; it does not certify native Safari.

```bash
PAGE=build/GC500_v7.98/GC500_Delivery_Control_hosted.html \
  node v7.98_control_state_reliability_LIVE/evidence/control798_unit.js
PAGE=build/GC500_v7.98/GC500_Delivery_Control_hosted.html \
  node v7.98_control_state_reliability_LIVE/evidence/control798_print_notes_unit.js
PAGE=build/GC500_v7.98/GC500_Delivery_Control_hosted.html \
PRIVATE_OUT=/workspace/private-gc500-audit/control798-final \
  node v7.98_control_state_reliability_LIVE/evidence/control798_browser.js
PAGE=build/GC500_v7.98/GC500_Delivery_Control_hosted.html \
PRIVATE_OUT=/workspace/private-gc500-audit/control798-toolbar-final \
  node v7.98_control_state_reliability_LIVE/evidence/control798_print_notes_browser.js
```

Set `NODE_PATH` to the environment’s installed toolchain modules and `CHROMIUM_PATH=/usr/bin/chromium` as needed. Chromium needs network-enabled execution permission for the official GET path. JSON and executable tests are in `evidence/`; operational screenshots/PDFs stay private. The earlier drawer focus candidate evidence remains recorded in `candidate_focus.json` and the original `browser_results.json`; it must not be confused with final combined evidence.

## Remaining review

A separate agent reviewed and accepted the delivery-note helper, integration and scale reset. The combined runtime/standing suites remain with that independent reviewer. Desktop and phone screenshots were visually inspected, including the notes, four photographs, QR and preview controls. The release coordinator owns final status, build verification and publication. This bounded correctness patch does not claim to resolve the separately proposed whole-app layout, repeat or performance work.
