# v12.07 · Third-lap Showcase scene — LIVE

Author: Andrew Fisher.

The existing Onsite scene now appears once on every third completed lap (3, 6, 9 and so on), with a person standing beside the car waving both arms, a large rounded fireball and a dark smoke plume. The scene camera includes the person and effects while keeping the door lettering readable. Andrew directly requested these changes and publication for the big screen.

This is fictional Showcase scenery. The empty car's two wordmarks, barrier placement, native 4K option, explicit camera choices, Calm driving, reduced motion, reset and resource cleanup are retained. Geometry is cached; effects reuse one bounded batch and the existing frame loop. No record, business rule, map, vehicle-driving or media changes.

Claimed at `2f70ad3f3e3ff144f5625f3ba6e5ae0749b6f430` on `ccr-061f77e8-ivjhrv`. Implementation began at `c7c61b1b8155be98858a59a385fcdda4ba694e4b`; visual refinement at `73cfec0`. Exact base v12.06 `8e371c70200d6b6566d59e7c078f70e5f4737654470a3d812b7fda9159166933`; candidate `dc2d5eff8a345f0f090135fa6bd90013bdc1f7786f0193588a46e965ac3ee894`, 15,251,289 bytes, 194 inline scripts. The patch checks the complete base and predecessor scene hashes. Rebuild/retest if live changes.

Final validation: shared toolchain PASS; rules/model/whole-page preservation 34/34; native scene/control/lifecycle checks 20/20; actual 3840 × 2160 target and PNG with four-sample smoothing 5/5; both full navigation sweeps 27 routes, 19 direct panes, seven deep links and Back, zero page/console errors or attempted record writes. Phone, desktop and 4K frames inspected, including arm movement, smoke visibility and readable lettering. Guarded upload dry run passed. Sanitised results are in `evidence/validation.json`; raw images stay private.

The 4K test establishes exact rendered dimensions and successful GPU submission using software rendering; it does not establish frame rates on every display or physical device. This release was implemented and tested independently; no second-agent review claimed.

LIVE 25 Oct 2026 07:52:06 AEST. READY source `517e561411d92c06e92609aa56de5f84b9978495`. The guarded uploader confirmed the unchanged base and exact public bytes; a separate public GET at 07:52:26 matched the complete candidate and footer. Actual public scene checks 6/6, with the phone frame inspected: third-lap scene and person rendered, loaded fencing truck retained, clean close, unchanged shared record and zero errors/writes. Exact read-back in `evidence/live.json`.
