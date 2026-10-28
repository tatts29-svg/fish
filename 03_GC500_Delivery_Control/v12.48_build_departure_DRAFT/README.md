# v12.48 — existing departure status on Build and other affected views

Author: Andrew Fisher

DRAFT — not READY and not live. The publication owner is recorded on STATUS; the combined candidate must pass the agreed checks first. Start from verified live v12.47 SHA-256 `1437f56498007f24a7e54acfd23542c2ab2daa0e3fd9aca64941c45753bd47ff`.

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
- Map projection/sizing and Sub-hired identity/quantity checks use synthetic evidence. The Sub-hired check also exercises the two exact native renderer anchors and reverses them to the unchanged predecessor.
- Patch boundary: eight tests covering explicit predecessor, wrong bytes/version, repeat application, source fingerprints, exact anchors, full reversal and failed-CLI non-mutation.
- Focused actual-page Build verification and final combined regression checks are recorded after completion. Tests are read only; private native fixtures and screenshots remain outside the repository.
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

No publication is authorised by this draft label alone. Require the final READY source/candidate in STATUS, exact shared rebuild, unchanged money/records, the focused checks, both navigation sweeps and the guarded upload/public read-back.
