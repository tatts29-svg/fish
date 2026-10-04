Author: Andrew Fisher
GC500 v8.40 — Today work progress

Today now leads with six work categories: Buildings, Toilets, Fencing,
Generators, Lighting and Equipment. The approved OLED instruments show recorded
completion and the remaining scope, with a count opening its underlying records.
Daily delivery summaries are removed from Today; the existing Timeline remains
the delivery workflow. Header, weather video, programme, native source records,
cost calculations, maps, documents and Timeline functions are preserved.

Figures are computed from the shared record. A delivered or on-hire item is not
inferred complete. Unknown quantities and conflicting short-delivery/completion
records suppress a whole-scope percentage. Toilet blocks count as units, not
pans; separate waste tanks/accessories are excluded. Equipment covers forklifts
and access machines; the wider inventory remains available through Equipment.

Fencing compares dated, usable clean-fence work in the Build programme with the
full quantified clean-fence Build programme. It does not equate docket metres
with unique physical fence length or mark geometric sections complete. Other
fence types, removals, relocations and off-programme work remain in Fencing.

An instrument animates only when selected and visible. Motion Off and reduced
motion are respected. Work and programme animation are mutually exclusive;
opening a breakdown pauses decorative motion. Redraws retain native main-scroll
position, selection and reference identity. Crisp vectors scale through 4K.

Build from the verified v8.38 base (not the now-live v8.40):
  toolchain/build.sh v8.40 v8.40_today_work_progress_LIVE/patch_v840.py
The patch refuses another base or repeated application. Release assets and
private shared-record/browser evidence are deliberately not stored in Git.

Checks:
  node v8.40_today_work_progress_LIVE/test_metrics840.cjs
  python3 v8.40_today_work_progress_LIVE/test_scope840.py --base BASE.html --candidate PAGE.html
  PAGE=PAGE.html BASE=BASE.html OUT=PRIVATE_DIR node v8.40_today_work_progress_LIVE/test_today840.cjs
Use the repository browser harness environment and a private evidence directory.
The browser suite blocks all non-GET requests before transport.

Release state: VERIFIED LIVE, 4 October 2026 at 20:48 AEST.
Exact public SHA256: 573df8e5440f7cd9c48452a52632114bdc4cedbdf3254db007dc6bff35e48929
The final 205-check integration suite, both 22-tab/seven-link/Back navigation
sweeps and 58 checks against the actual public page passed. All 33 shared-record
collections are unchanged. See RELEASE_REVIEW.txt for verification boundaries.
The separate v8.39 steering-wheel film is held and is excluded from this release.
