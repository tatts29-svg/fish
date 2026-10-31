# v12.48 — existing departure status on Build and other affected views

Author: Andrew Fisher

READY TO UPLOAD — all final release checks pass; not live. Frozen implementation/tests: `3aad0e33725d5e2e55f309ed83ece6da2524303e`. Codex implemented/tested; Claude owns guarded publication. Start from verified live v12.47 SHA-256 `1437f56498007f24a7e54acfd23542c2ab2daa0e3fd9aca64941c45753bd47ff`.

The shared live-base build reproduces the tested combined candidate exactly: SHA-256 `39836e1521ace88ea9142c393fdfe1cac90cae0876a954a699121729e323416b`, 16,097,456 bytes. All final focused native checks below use the same frozen record, version 11733, SHA-256 `a0dbf68c109410939d48bc95e68a201fe45fba3aaca21ad599bf839a7e02d99c`. Private fixtures, screenshots and detailed records are kept outside the repository.

## Build-card correction

A fully collected reference can retain a native delivery state of `in transit` because that is how the departure was recorded. The Build card previously read only that delivery state, so it displayed an inbound journey and an obsolete delivery booking even though the authoritative departure model said the reference had left.

The card now reads `Departure1211.status` and reuses `Stamp1232` for the recorded departure time. A verified full departure reads **Left site**, with the existing departure stamp and a single final **Finished** lamp. It does not light unproved historical installation stages or set any Complete tick. Partial departures retain their native setup-stage evidence and show the departure count; on-site wording requires the native arrival proof. Conflicting or unavailable departure evidence leaves the existing display unchanged.

The booking lookup omits fully departed references before the existing booking-text pairing runs. A fully departed load has no obsolete delivery-booking band; a mixed load still looks up its active references. A text ambiguous between an active and departed reference is omitted rather than reassigned; exact pairings and identical shared windows remain. The original booking source and historical day summaries are retained.

The original dark card, orange edge, weather/date cards, information, map-location strip, Navigate/Details actions, expanded controls and native record handlers remain. The only new styling gives the existing departure stamp its established contrast on the dark Build card. No rates, quantities, records, completion ticks, money calculations or operational writes change.

## Map and Sub-hired corrections

The inline phone map now uses the main viewport height, so its canvas can occupy a useful scrolled area below the existing controls. Desktop and fullscreen sizing retain the original behaviour. The map's reference label retains its native description icon and adds the authoritative departed count in brackets with the departure arrow. Partial or uncertain evidence remains qualified; pin positions, rings, drawing and hit testing are unchanged.

Sub-hired unit cards reuse the exact native departure event and existing stamp formatter. A physical, identified unit receives its own departure stamp; a planned or unresolved identity does not. Quantity-only groups use the native item-specific collected and remaining counts, and a partial group states how many remain. Conflicts request review. The existing supplier list, cards, actions and unit controls are retained. No orange-stamp restyle is included.

## Checks and release boundary

- Build projection: 40 synthetic assertions, including no/unknown/conflicting departure evidence, full/partial outcomes, source non-mutation, native model/formatter reuse and mixed-load booking references.
- Map projection/sizing: 27 synthetic assertions. Sub-hired identity/quantity: 27 synthetic and exact-anchor/reversal assertions.
- Patch boundary: eight tests covering explicit predecessor, wrong bytes/version, repeat application, source fingerprints, exact anchors, full reversal and failed-CLI non-mutation.
- Shared build/checker: exact predecessor and candidate hashes verified; all 217 inline scripts parse, no new keys and the author line remains.
- Native Build: full and partial departure cases, native stamp text, Finished indicator, obsolete booking suppression, expanded native controls, map-strip keys, date/weather order and exact record preservation pass. The final phone screenshot was inspected.
- Native map: 2,309 checks pass against the exact predecessor on the same frozen record. Reference/pin/icon/quantity facts are preserved; phone and tablet viewport sizing, desktop sizing, repeated resizing, trusted touch scrolling, hit-tested native canvas panning, selection, zoom and fullscreen Escape pass. The first gesture test emitted no touch-move events, and a later pan coordinate hit an existing overlay; the corrected test verifies trusted touch events and a visible native canvas target on both baseline and candidate.
- Native Sub-hired: 233 checks pass. Unit stamps match native departure events; remaining/planned identities stay unstamped; the original company HTML and controls remain exact after removing the added departure detail. The final phone screenshot was inspected.
- All final focused sessions report zero runtime errors, console errors or attempted operational writes; operational documents remain exact. Financial preservation passes all 34 assertions. Desktop and phone each pass the complete 27-tab, seven-deep-link and Back sweep, with zero runtime/console errors or operational writes. Existing view-only redirects match the verified predecessor. A fresh record read at 14:47 UTC remains byte-identical to the tested snapshot.
- The guarded patch preserves every original stylesheet and reverses exactly to the reviewed predecessor. All coordinated module sources and exact replacement descriptors are SHA-256 guarded.

Run the focused offline checks from the release folder:

```sh
node tests/model.cjs
node tests/map_model1248.cjs
BASE=/private/path/live47.html node tests/subhired1248.cjs
BASE=/private/path/live47.html python3 tests/test_patch_v1248.py
```

The focused native test accepts private `PAGE`, `BASE`, `STATE`, `FIXTURE`, `OUT` and `EXPECTED_PAGE_SHA` inputs. Run under the shared browser lease. The fixture names native references to exercise; it is not published. The controls comparison checks all control identities and map-reference keys. It normalises only the map preview button's asynchronous loading text and `data-picture1247` state, which can differ without a control or source change.

Release build from the repository root, after all source modules are frozen:

```sh
GC500_V1248_BASE_SHA256=1437f56498007f24a7e54acfd23542c2ab2daa0e3fd9aca64941c45753bd47ff \
GC500_V1248_BASE_VERSION=12.47 \
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.48 \
  03_GC500_Delivery_Control/v12.48_build_departure_DRAFT/patch_v1248.py
```

Claude: rebuild from the exact verified v12.47 base using the command above; require the candidate hash and byte count to match this READY record. Recheck current financial/record preservation, use the shared guarded upload and record full public-byte read-back. Codex will independently check the served bytes after publication. If the predecessor or candidate changes, hand the draft back for the affected checks. No operational writes.

## LIVE

LIVE 29 Oct 2026 01:43 AEST. sha256 `39836e1521ace88ea9142c393fdfe1cac90cae0876a954a699121729e323416b`, 16,097,456 bytes, public bytes match the build exactly. Money probe identical to live v12.47.
