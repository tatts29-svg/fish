# Map Demob, remaining equipment and numbered VMS signs — LIVE

Author: Andrew Fisher

LIVE 25 Oct 2026 10:39:41 AEST. READY source `919fb745d4d9b984bef8bd2e9c7fe1dafd314e21`. Guarded upload and separate public GET matched every byte. The actual public phone passed VMS icons/grouping 18/18 and pickup/export 29/29, with zero runtime errors or attempted record writes. Public phone images inspected.

Andrew requested a Demob action from the map area: select what can be picked up, flag no twin-steer access, and share the location, map pictures, details and navigation in a PDF attachment. He also requested an easy Coates FWF finder, a Left site marker with the departure time, prevention of repeated pickup selection, and visible VMS icons.

The map-area Demob pack selects recorded physical units and bounded quantities from the native remaining-stock model. It retains owner categories, arrival/pump-out holds, loading-side information and confirmed plan doors. Sharing prepares a searchable PDF with map close-ups and navigation, plus image/text exports. File-sharing uses the chosen app; the fallback downloads the PDF and opens an email draft with an attach instruction. Preparing or sharing a pack never records a departure.

A separate explicit **Record selected items left site** action uses the existing collection ledger. It requires the actual AEST departure date and time. Partial pickups retain the remaining equipment; complete pickups show **LEFT SITE** and leave the Still to leave list. Collected identities cannot be picked twice. Historical records and charge lines remain intact, and a partial departure does not become a new arrival or clear the remaining units’ pump-out evidence. Older date-only events remain labelled as having no recorded time.

**Coates FWF** finds the individual recorded Coates units, including mixed-owner references, and excludes units already collected. Unplaced equipment remains explicitly unplaced.

**VMS boards** opens a map finder with sharp vector signs and board numbers. Nearby boards form tappable counts in the overview; tapping zooms into numbered signs. Shared pins retain separate labels at close range. Known approach-road positions outside the paper plan can be fitted into the view. Marker nodes are reused during pan/zoom, and duplicate canvas labels are suppressed. No coordinate or identity is changed by the release code.

Base: v12.10.1, `4e53b9dc3e08ea8cdbe60fdaba053093890562445625ea4541cf61a95d67c95d`. Candidate: `3b51c50a7766f2f37d222f49c2cad18c03eb868356c8019ce600581eac46915d`, 15,314,171 bytes, 196 inline scripts. Implementation source: `2e318d3c339561678b943106ce56bab05912a8f0` on `ccr-061f77e8-ivjhrv`. This release preserves the final-night Servicing/card payload, crew-code rules and all 188 unrelated scripts exactly; it does not publish the event tracker.

Final checks: toolchain PASS; departure boundaries 17/17 and pickup model 14/14; preservation 8/8; native departures 28/28, pickup/export 29/29 and map search 39/39 on desktop and phone. Numbered VMS signs/grouping pass on desktop, phone and a 3840 × 2160 viewport. Both complete navigation sweeps pass 27 routes, 19 direct panes, seven deep links and Back with zero errors or attempted record writes. PDF content, close-ups and navigation pass on both sizes. Phone images inspected. Exact counts are in `evidence/ready.json`. Implemented and tested independently; no second-agent review is claimed.

Build with `bash 03_GC500_Delivery_Control/toolchain/build.sh v12.11 03_GC500_Delivery_Control/v12.11_map_demob_LIVE/patch_v1211.py`. The patch is pinned to its exact live base and refuses reuse. Publication used the unchanged-base guard and passed exact public byte and UI checks. Private source records, generated PDFs and screenshots stay outside this repository. No real departures were entered by tests.
