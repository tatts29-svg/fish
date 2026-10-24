# Fifth-lap trackside scene

Author: Andrew Fisher

Status: DRAFT — rendering and release checks in progress. Not ready to upload.

Andrew requested an Onsite-branded race car against a barrier with flames every
five laps, with the branding readable. The scene is fictional Showcase decoration.
It is not an incident report. No operational records or source photographs change.

The scene appears once after completed laps 5, 10, 15 and so on, remains for the
following pass, and clears at the next completed lap. Restart clears its counter.
Existing Loop and Broadcast playback controls determine whether laps continue;
their saved preferences are preserved. Calm driving suppresses the scene. Reduced
motion freezes the effect and keeps the selected camera.

A static white-and-orange touring sedan has two high-resolution Onsite Rental Group
door wordmarks, an empty cabin, wheels, a rear wing and a folded front bonnet.
The front is placed against the existing rendered barrier, outside the driving line.
Procedural flames cover the bonnet, roof and rear, with smoke above. The near door
remains readable. A brief automatic trackside camera shows the scene on approach;
manual camera choices remain unchanged.

Base: public v11.93, SHA-256
`e49bca1a706ee7297f9f05ac04d0e91cbbbfcffdc216e8e1e8d1fb1326ff6ea3`.
This retains the preceding truck changes and the latest Today release.
Claim: `57f1dae01cdbdfbd6b1a7f55fcb43c9eea2ffb6e` on `ccr-061f77e8-ivjhrv`.
The patch refuses a different live base or a second application.

Build with `bash toolchain/build.sh v11.95 v11.95_onsite_scene_DRAFT/patch_v1195.py`.
Use the shared read-only browser harness and serial browser lock. Required checks:
lap recurrence/reset, barrier placement, model validity, records and retained scripts,
phone/desktop rendering and controls, reduced motion, lifecycle cleanup, and both full
navigation sweeps. Inspect actual phone and desktop frames. Raw pages and screenshots
stay private. Archive only sanitised test evidence.

The model is cached, with 17,822 triangles and 10 material batches. Effects use a
single static billboard batch, one procedural shader and one 2048 × 384 text mask.
Resources are owned by the scene and released on restart or unmount. No timers,
network calls, additional animation loop, vehicle-force changes or record writes.

Publication requires the current live base guard, the exact READY source, successful
checks, public byte read-back and actual public UI verification. No second-agent
review or physical-device frame-rate measurement is claimed.
