# v8.09 — The Coates Way machine upgrade

> **Version note:** this release is **v8.09**. Codex claimed v8.08 first, in f4455f0. The folder was first named `v8.08_` and was renamed `v8.09_` once the four builds finished; the version labels in its code and tests say v8.09.

Author: Andrew Fisher · **LIVE, verified 3 Oct 2026 14:32 AEST.** Registered the complete frozen vehicle package after the Demob page release. All 226 public files match the approved hashes and sizes. The v8.16 page, all four map descriptors and operational-record fingerprints are unchanged. [Publication proof](evidence/release_verification.json). Actual public-host desktop and phone open/render/Back checks pass 20/20, with zero page/console errors or attempted writes; both final views inspected. [Live browser proof](evidence/live_smoke_verification.json). The handover below is retained as history.

## Andrew's words (Claude's chat, 2 Oct 2026)

"I need you to work on improving the coates way. You need to get rid of the info boxes they pop up every where. And dont close. I need you to upgrade this area. Push your limits further. Add more mecahnical features. The guy who is the driver looks like he crawls out of vehicle. Make this all 4k crystal clear. Improve every thing on here. 10/10"

## What we found before starting

**Info boxes.** On a phone, tapping things in the garage opens an "In the garage" card that covers the car. Its close button is pushed off the bottom behind the control dock, so it can't be closed. The cards come from `showExhibit` in `car-app.js`.

**The driver.** The driver figure (helmet 26) stands and walks on top of the car, with his body coming through the roof.

## The work (four parallel builds on separate files)

| Area | Files |
|---|---|
| Info boxes and interface | `car-app.js`, CSS, `index.html` |
| Driver and crew | `car-driver.js`, `crew.js`, `poses.js` |
| Mechanical features | engine, drive, pit machinery and register files |
| 4K clarity | renderer, effects, garage, body, cockpit surfaces |

Each area records its changes in `evidence/CHANGES_*.md`.

**Test rig:** `evidence/machine_rig.js` serves `work/` locally. It fetches models and sounds from the live machine by GET only. Every fetched file must match its descriptor in `evidence/manifest_v809.json` (see the handover).

**Publishing** needs the edit key, so Codex publishes once this is READY. Mock-up pictures go to Andrew first.

## Historical READY handover

**READY TO UPLOAD (machine set only).** Claude implemented and tested this. Codex reviewed the source (groups 1–4, frozen-source audit of c1f6fb5, `review_v809_release/`). Codex publishes. Nothing was uploaded, registered or written to the live service in preparing this.

| | |
|---|---|
| Source commit | `dfec015586208531bbe31fe507d44cc9cc49955e` (`work/` is byte-identical to c1f6fb5, the commit Codex audited: all 63 files match `audit_c1f6fb5.json`) |
| Base (live, re-read 3 Oct 2026 03:58 UTC) | machine manifest **`65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86`**, `v8.13-maps-satellite`, 219 files, 172,184,133 B |
| Candidate | **`7d2ff39f645696c212197f1bf0c7dfe8e4a01c232c4e3ca1dbea359b53500a1e`**: `evidence/manifest_v809.json`, **226 files, 172,348,506 B** (+164,373 B) |
| Delta | 17 changed, 7 new, 202 descriptors kept byte-identical, none removed |
| Live page (not touched) | v8.15 `35ab1366…`. It opens the machine at `/w/<view>/` (entry `index.html`), `explorer/index.html` and `poc3d/index.html`. All three paths are in the union; `index.html` is updated, while both map entry files are unchanged. Publication preserved the newer v8.16 page `7ae89da4…`. |

**How the digest is computed.** This is the method in `satellite_explorer/tools/machine_set.py` (Codex's tool, which the service uses): sha256 of the canonical JSON `{schema:"gc500-machine-v1", entry:"index.html", files}`. `files` is sorted by path, each entry is `{bytes, path, sha256, type}`, object keys are sorted and there is no whitespace. Applied to Codex's `machine813_manifest.json`, the same code gives 65c47180, which matches. It agrees with Codex's independent union in `review_v809_release/` (7d2ff39f, 226 files, 172,348,506 B). The `manifest_v809.json` file itself hashes to `b6cedf5839d005d3597608b58037d64700d586086de067d70ec87f140760a59f`, but the service registers by the digest above. Rebuild and check it with `evidence/handover/handover_v809.py union | closure | live`.

### Changed files (17)

| file | v8.13 live sha256 (bytes) | v8.09 sha256 (bytes) |
|---|---|---|
| `car-app.js` | `a6c3a4025be3f5142d9b53cd97224a07c3c7ad8e19fb0712dbf90d529ede9a78` (129,280) | `d2964c3138eb1b2429a542cfb598adb507ae345b6b92858c78231fdbe49ff3c8` (150,573) |
| `car-cockpit.js` | `259ea8a36bec9ea1e12920f055a90922b308e59c3ce1ea59d4b66cafab64220a` (88,795) | `bd0a198cb5a21100166ede6803d5443f4471dd695cfc8fa36c97b4090375fc29` (88,819) |
| `car-driver.js` | `f26f4a900a8977c5d9745b68b07edbe3db232aed94cfd2a1df028eb61e77aee3` (23,556) | `3f0cb7e314377ffbd506672610a4b0c83af2873dabaf0e6145730234d3736c8d` (25,308) |
| `car-fit.js` | `9f8077351367a41375223c15d4aedb75e5e453853c18d3855e38bace26b10527` (6,159) | `7a9348f5c3333c39aebf02a87a4fcfeac9e227d8c17255c5b955a9f0d64514fb` (6,207) |
| `car-gc500.js` | `6287ee0e1cd0c87d3925794bc13e936655c15f1f8f76b958b5b16051cab3247f` (16,257) | `e61e3d002b4174f230e8483c9bdb43b49aeeb7c665230b5033ea9f512c0b795e` (23,111) |
| `car-powertrain.js` | `bd0897200c1e65f146355c6fab4eb852090f6d738c7a25092ba3aad58a69cefe` (41,812) | `fa842cc90f10974464210b913dabeb19ced14b9292eb9b9310a5aaa32ce7209d` (47,148) |
| `car-scene.js` | `65aa1e52e934e32589a7132a63d2b5cf6f897b3ee94b25e8fdc0e3c8c3d57148` (4,622) | `8fbaed2ee75320d49e2844198fbf9e51bb510dbab83ea66d7221adeeec6ed92d` (5,821) |
| `car.css` | `78b7b8be0b1c824568731927ee5b43d01a0acaa82dfcdffa511de065f70fbeda` (24,943) | `ac558e79e7182bb88731a864d83c6e6dbbfe616e13ce316755047a5f01b3260f` (28,212) |
| `cockpit-surfaces.js` | `35b9f8672cb041e3860fa71db0c2b9bfb6b87e31c08a59894ccb575c5c51ccba` (10,594) | `9d09692404126eab990b402ae2e85949c3609fdf5f0ee95dc7ffcf6ae3ac07b1` (11,616) |
| `crew.js` | `652851251e5c529287747d44956e0f37ae9214b757e8ea8e529f9e79d24db04a` (144,923) | `fc0a9314450e9eabf145b6d4f1b3682ccb89168cd8be2a2facd1bfa55d44eb8d` (152,822) |
| `index.html` | `f69cfb19e25d5ce2044b7795dae9b7fee67a1b621a462a3d65a3ccb7e43f237c` (11,143) | `fb07e7b09dd5574f3869f5e35ac61f22d950f42efbf13d7a2a2ddaa90d571148` (11,468) |
| `part-connections.js` | `4856f9632ce260a6a8f4e495b119115da4d252b7cf5889f0d3bc54ecd05d90de` (11,050) | `63dc3e5a3d4118f9557e96e943c0544ad9a4289494f235fbb244bf10b130bdd7` (12,572) |
| `pit-garage.js` | `0b88a0386f82abcbc859676cf040112d4d51ccf1995b0025cd436ffedc9ef946` (96,519) | `e543b48a02c68ab5955c652c96fd8186241fa87d9616b580576cb3e2b4eec72d` (103,331) |
| `style.css` | `fe62a8b23dccd154a007e6752ad645d62576932d0c9707ad828bea774bc3f3d7` (21,827) | `b01c5c0ce0ac04929267b15e5f8b625b55f8f74c87cc9745afc17bf3eeafa389` (21,985) |
| `timing-drive.js` | `448d6d4f9244a62be0b818fdf6ff547ae7105ea2b5f6e80071fe654c864a2331` (4,358) | `857e720ae0d365d6ddbde8c6d4f1abaa24994b68f7a797c10c4de18c242b8d04` (7,191) |
| `vendor/addons/postprocessing/GTAOPass.js` | `980b036767c439cf2aadd0e869b2e51b2ec00736a75a5ad1bb69dddb03254fe8` (16,582) | `33e0c4074eff4f2cd6116fef1df4ae900ef33229ac91c6793c5af5d6dab4fcb2` (16,645) |
| `view-fx.js` | `e39a4d405a7b838784e351b63940b77c0e0eceac0954c0792622b9651ef87fc0` (10,897) | `39c6bd70fbf478a977a5cd849a18ac6920a84fe7aaa8ccb368df388c59e9820d` (13,784) |

### New files (7)

| new file | sha256 | bytes |
|---|---|---|
| `fx-quality.js` | `3bde119ed7da19feaf01b8f7778b9836a0053431b324f74437bffc750760b31d` | 18,834 |
| `mech-brakes.js` | `e98ed2ee1c48e4306f5b1d1e5537803a6fc740ffc919b997b11906090e8471ce` | 18,254 |
| `mech-driveline.js` | `5f8361b93380a7b6309eeca8580349c1cbb7eb3fb63196c1a137c3b1fa01da23` | 13,295 |
| `mech-oil.js` | `6ed2710b80e94615556517b98d951a316c047a8042a561e8d9785b2edbb56a4d` | 4,013 |
| `mech-register.js` | `3ca9272996b77f3fa6f6924da36dda403c568c5c6ef896c4cebfd83aed5a6411` | 8,085 |
| `people-atlas.js` | `ca348d901d0a1deb36454617f347c2324f68c15405a04f2ac4616b775d3ad100` | 14,528 |
| `people-figure.js` | `16fab5c0bb809edb77e30280d4a1921299d84778e76fb3f53604b8b8f4c92203` | 24,068 |

### The four map descriptors: unchanged

| file | sha256 (v8.13 live = v8.09 candidate) |
|---|---|
| `explorer/explorer.js` | `366897925de96b5f881485bec60c6a3a7263fd20d9b04d48231ac82d356020d0` |
| `explorer/explorer-merge.js` | `261238402f3c4bf3dc94a661b3dc8378bb789b01cdfd77b4cfc9810d1236b67c` |
| `explorer/index.html` | `e2f0f9bfbfc9b5f707a2ead734b99cb0569c11f68bf15e0303d7021eac9e0572` |
| `poc3d/index.html` | `7edf7b5ac55c1cf5f60f35b72d577d8e257854e2e482b1b93796e498edcf5ac4` |

Each was also read from live (GET, sha256) and matches.

### Checks on the final candidate (3 Oct 2026, 00:00–03:57 UTC)

- **Base still live:** all 56 `base/` files and the four map files were read from `/w/Coates-GC500-2026/` (GET) and match `base/` and the v8.13 manifest byte for byte. `/api/machine` reports 65c47180 (`evidence/handover/live_check.json`).
- **Asset closure** (`handover/closure_v809.json`): the changed and new files hold 100 references (imports, `url()`, `src`/`href`, asset literals), and every one resolves in the union. Three `tests/*.mjs` names appear only in code comments; they are in the live copy as well and are never loaded. The one external URL is the Google Fonts stylesheet that live `style.css` already uses. The module graph from both entries (`index.html`, `mechanism.html`; 61 files) and all 34 audio clips resolve.
- **Runtime suites** on `work/`, one browser job per suite and device under the shared lock. Every run passed:

| suite | device | result |
|---|---|---|
| people_tests (work) | desk · phone | PASS · PASS (2,193 samples each, no fails) |
| driver_tests | desk · phone | 43/43 · 43/43 |
| ui_tests, TUNE=dpr:0.5 | phone · desktop · tablet | 137/137 · 141/141 · 137/137 |
| ui_tests | 4k | 134/134 (rerun after one test correction, below) |
| mech_tests | desk · phone | 27/27 · 27/27 |
| fx_tests (both devices, plus the hidden-tab page) | desktop · phone · hidden tab | 27/27 · 22/22 · 2/2 |
| legacy_tests (new, `mechanism.html`) | desk · phone | 21/21 · 21/21 |

  That is **782 checks plus both people runs** (the phone QUICK rerun of 107 not counted again), with no failures on the final candidate.
- **Regression checks from Codex's review**, all inside those runs:
  - texture count over Balanced/Laptop quality rounds: desktop 86→86→86, phone 82→82→82;
  - second finger on the wheel, lifted in either order or cancelled (phone);
  - Find a part during the tour leaves only the register open; the two button names;
  - first walker frame at the sill, crouched and facing the right way, on the first exit and after Reset;
  - hidden tab: Balanced stays Balanced;
  - clutch out from the first starting frame, and take-up of 1/3 rad in 1, 2, 10 or 100 steps.
- **One failure, and how it was fixed.** ui_tests at 4k failed one check: the visually hidden "Ready to run" measured 2 × 2 px against 1 px. The page is right. At 4k the interface is drawn at `zoom` 2, and the test compared screen px with a CSS-px limit. The test now reads CSS px, as its dock-words check already does, and also requires the clip that hides the text, so it is stricter. A `display:none` still fails it. The 4k rerun passed 134/134, and a phone QUICK rerun of the corrected check passed 107/107. No page file changed (see `CHANGES_ui.md`).
- **Codex's handover gaps (review_v809_release):**
  1. Final browser evidence is in `evidence/runs_v809_final/`: logs, results JSON, exit codes and `queue.log`. Screenshots stay out of the repo (`.gitignore`). The phone and desktop card and rest views were looked at: the garage card sits above the dock and its ✕ is reachable.
  2. The rig is now bound to the union. `machine_rig.js` serves a live-fetched file only when it is named in `manifest_v809.json` and matches its sha256 and size. Otherwise the page gets a 404 or 502 and the run's error check fails. `work/` files are checked too. All 19 browser sessions are logged in `runs_v809_final/rig_provenance.jsonl`: 40 distinct live assets, all matching, and all 63 `work/` files matching. There were no unknown or mismatched files.
  3. The legacy path is covered. `legacy_tests.js` checks `mechanism.html` (legacy `app.js` with the changed `style.css`) on desk and phone: controls drawn and on top with text of at least 11 px; Controls ? and the parts register open; both ✕ buttons 44 × 44, on screen, and closing on a click or tap; no control moved or resized against the live copy; no errors. On `base/` the same test fails only on the old 40 px ✕ buttons.
  4. This section is the handover.

### Known limits

- Every run used software rendering (SwiftShader in headless Chromium). Frame rate and GPU memory were **not measured on a real GPU or phone**. The fx frame times compare quality settings on this machine only.
- Codex's camera note stands: OrbitControls clamps a requested distance above 20 at canvas ratios of about 0.552 or less. This was not seen at normal phone sizes.
- The optional camera-ownership and complete-body-opening options are not in this release, and neither is the Next-heading focus change (see `CHANGES_ui.md`).

### For the publisher

Register the union, not `work/` alone. `work/` leaves out 163 live files. Immediately before registering, confirm `/api/machine` still reports 65c47180. If it has moved, rebuild with `handover_v809.py union` against the new live manifest and keep its unrelated descriptors. After registering, read back the digest 7d2ff39f and every changed or new file, and check that the page opens and closes the machine on the current host.
