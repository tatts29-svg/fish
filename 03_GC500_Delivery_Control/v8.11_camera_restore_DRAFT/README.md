Author: Andrew Fisher

v8.11 restores the Showcase cameras from the last live page before the camera overhaul. Andrew said in this chat on 2 Oct 2026: “All of the camera angles are terrible. I want it exactly how it was done previous.” The current track, scenery and vehicle visuals remain.

The camera component is frozen for the combined v8.12 integration. It is not a separate published page. Root owns the final build, standing checks and publication. The real Tools-entry test found an inherited focus-return defect in the integration candidate; root is correcting that separately before publication.

`patch_v811.py` removes only the v7.94 camera override and v8.00 selected-vehicle fitting override. It restores the two original Detail returns and open-portaloo camera priority, then removes the later default/menu override. The existing original implementation therefore supplies all nine choices, remembered valid choices, default Car follow, native event-driven Auto cuts, camera arms, lens response, transitions, shake and lean. A saved former Circuit tour choice falls back to Car follow. No replacement camera or new framing algorithm is added.

The full-lap transport, inset map, scenery, pit, corridor, all seven selectable vehicle models, paint/glass/lighting and v8.02 anti-aliasing remain. Source checks prove the entire business script and embedded DATA unchanged, as well as the complete renderer outside the declared camera block. The input release tag is retained so the final integrator can apply v8.12 after its other components.

Frozen sources:

- Original live v8.01: `70ed0c49213a910ae33dd062ecd3ada5f1752a69b0c1665c19c6bb25bcea1f11`.
- Current live v8.07 base: `35024d43405947d59c106e858221f8c40ed9629bcf6b19b1081f87c4da6799ed`.
- Restored component candidate: `b9a8d98a0d2a189df5e6523923d8a332ee3b914fdf50734792c575c29dc3a576`, 9,069,543 bytes.
- Patch: `ca3d446c1dd5f96d57af7f49ef77d6336dff1451689a5fcb1a1ab378cb5c0af9`.
- Restored original `G.VIEWS` through `G.camUp` block: `a6fada76c3c3ea98bd81df5abb883bcc30b2d439a3269a6ac89219536708c622`, byte-identical to v8.01.
- Combined v8.12 candidate: `33d61cd71fa409b34f23ba0c7badbbdf7c4ae61ed5a4b8f080bea63e5d492cc0`; root owns its final status.

Checks completed:

- `evidence/source811_checks.py`: 28/28 component/source/guard/script-parse checks, including v8.07 and v8.08 integration markers and exact preservation outside the camera changes.
- `evidence/camera811_checks.cjs`: 61/61 on both the component and final v8.12. All nine views match the original over 40 seconds at 120 Hz with normal, reduced-motion, towing and obstruction inputs. Explicit priority cues, portaloo/fireworks, selection, pause, portrait lens coverage and saved-choice fallbacks are covered.
- Independent review: 8/8 source and 8/8 moving comparison checks. All 42 desktop/phone frames exactly match the original camera, physics, director, lens, roll and shake state. Current race-car Detail and Front detail frames were inspected and fit the original views.
- Independent captures used `fe38d887…`; final `b9a8d98a…` differs solely by one retained-map indentation space. The exact delta binding is saved with that review.

Real controls are tested with `PAGE=/absolute/final.html OUT=/private/evidence CHROMIUM_PATH=/usr/bin/chromium node evidence/controls811_checks.cjs`. This covers the actual Tools entry, nine choices, former Tour fallback, valid choice across reopen, all seven vehicles on desktop/phone, day/night, graphics-context recovery and native restarted Auto frames. Every service request is GET only. Full pages, record snapshots and screenshots stay private.

The original Detail rigs remain close-ups. They fit the race car but can crop the forklift mast, scissor platform or much of a towed trailer. The original wider towing Chase/Car follow rigs are retained. This restoration does not reinstate the later automatic whole-assembly fitting.

Actual-entry finding on `33d61cd7…`: Tools → Start showcase captures the soon-hidden `showcaseBtn` as `SHOW.ret`. Escape closes and removes inert/listeners, but focus falls to `BODY` because that menu item is hidden. The original v8.01/8.07 `showClose` implementation is unchanged by this component. The strict desktop assertion and exact endpoint remain in the private controls report; this is an integration release blocker until the separately owned fallback and affected checks pass.

Reproduction from this project directory:

```sh
python3 v8.11_camera_restore_DRAFT/evidence/source811_checks.py --base build/GC500_v8.07/GC500_Delivery_Control_hosted.html --page /private/component.html
node v8.11_camera_restore_DRAFT/evidence/camera811_checks.cjs --page /private/component.html
```

Private review paths: `/workspace/private-v811-camera-restore/` and `/workspace/private-camera-restore-02Oct2026/REVIEW.md`. The latter comparison intentionally rewinds the simulation to different times; its later Auto frames retain the playback distance maximum and must not be presented as normal lap-progress screenshots. Fresh native restarted Auto frames belong to the final controls run. These software-rendered checks make no physical-phone frame-rate claim.
