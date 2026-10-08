# Confirmed 14 October arrival plan — draft integration

Author: Andrew Fisher

Andrew confirmed Kingston departure by 05:00 and P25 at the front at the Higman Street end, followed by P66, P65 and P67. His latest instruction requires all trucks on site before 07:00, no travel 07:00–09:00 and traffic control from 06:00 on every 14 October driver document and daily run.

The native Timeline, driver/install sheets, Full details, PDF email draft and daily run/text composition receive these instructions. No text/email is sent and no record is changed. Current native units, door sides, equipment types and load order remain authoritative. The static map is withheld with a stale warning when its four-truck snapshot differs. Other-day/removal prints keep their native route/order; dispatch/spotter/clash checks remain active.

The approved two-page plan source is in `../arrival_plan_14Oct2026_DRAFT/source`. Both supplied upstream source commits were incorporated. All four marked originals were inspected privately. The landward island holding edge starts after the red pedestrian crossing and ends before Higman; numbered queue markers indicate order only, without guessed truck dimensions or capacity. Shared georeferenced geometry drives both map builders. Overview maps preserve their complete extent. Both pages carry the before-07:00 restriction and fit A4 including their footer.

Rebuild the artifacts with build_maps.py, build_aerial.py, build_sheet.py, then render.js using NODE_PATH for the canonical toolchain and CHROMIUM_PATH. The renderer uses self-contained source HTML, waits for fonts/images and blocks external requests. Publish the three versioned v3 artifacts through native Documents before the page patch; the patch references only public view URLs. Do not replace these with the superseded one-page plan.

Patch accepts v9.41 focused test base or v9.42 final base and advances the footer to43. Browser tests require frozen read-only state/clock, shared browser lock and strict GET interception before navigation. ARTIFACT_DIR stores private screenshots/PDFs; ARRIVAL_ARTIFACT_SRC optionally serves staged exact PNG bytes for pre-upload testing.

Source/model checks and targeted native desktop/phone checks pass. Driver output is6pages and installer output4pages for the selected load, including both map pages; native page bounds and all images fit. Lazy loading, stale-record withholding, draft composition, mailto cap and unchanged native state passed. Zero page errors; one expected blocked Google mapping session POST per browser. Phone and printed aerial screenshots were inspected. Evidence records exact source/artifact hashes. **READY for final combined build and public artifact verification**; not yet LIVE. Root owns publication and final combined checks.
