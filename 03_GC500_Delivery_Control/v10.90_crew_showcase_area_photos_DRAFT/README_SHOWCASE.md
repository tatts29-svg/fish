# Crew Showcase

Author: Andrew Fisher

This module expands the existing Showcase to 25 pages. The ten original pages,
their order relative to one another, and every existing narration take remain.
Fifteen additional pages give the installation and fencing crews more room for
their recorded work. New pages use silent reading holds during broadcast.
Existing photos, backdrops, car code, contacts and historical team records are
unchanged.

The added pages cover buildings and containers, toilet units, recorded levelling
and steps checks, VMS boards, water barriers, delivered-message bookings, fencing
length, panels and feet, fixing hardware, crowd-control barriers, repeat work,
reviewed map areas, dated records, historical station weather and both crews'
remaining work. CCB has a dedicated page; standard units, flat-feet units and
event/demarcation activity retain separate measures.

## Evidence and update rules

All figures come from existing shared models at the selected date. This patch
does not store counters or write native records. Physical fencing components and
metres use physical-record models, never supplier billing overlays. Gross
activities are not unique stock; partial source coverage and unclassified CCB
remain visible.

Delivered-message bookings retain the archive's export boundary and are
deduplicated by booking ID. They are not truck trips. Steps and levelling are
reference checks, not stair quantities or walking steps. Historical Seaway
station observations are weather context, not evidence of crew exposure. No
forklift movement, tow-distance, attendance or walking total is inferred.

An open new or retained progress page refreshes when the existing cache or
render signals run. Updates are coalesced without polling and preserve the
current scene, scroll position and audio. Manual navigation stops narration
belonging to another scene. Original first-run and loop narration order is kept;
the established player still owns pause, resume, media-failure fallback and stop.

## Integration and validation

`patch_showcase1090.patch(text, path)` adds only the scoped style and script
blocks. It requires the v10.89 Showcase marker and refuses a repeated patch.
The parent `patch_v1090.py` owns exact-base checks, versioning, the independent
area-photo module and release publication.

Synthetic checks:

```sh
node test_showcase1090.js
node test_broadcast1090.js
```

Focused GET-only browser checks use the existing shared harness. `EVIDENCE` must
point outside the repository; captured models and screenshots remain private.
Run once for desktop and once with `MOB=1`, under the shared browser lock:

```sh
PAGE=/private/candidate.html EVIDENCE=/private/evidence \
  flock /tmp/gc500-browser.lock node test_showcase_browser1090.js
```

The same assertions can run against the public live page with `PUBLIC_LIVE=1`
and `PAGE` unset. They check all page geometry, original media/team preservation,
native-change propagation and restoration, current-scene/scroll preservation,
complete narration routing, pause/resume, media fallback and close/stop.
Publication still requires the parent release's official build, preservation
checks, both full sweeps, guarded upload and exact public read-back.
