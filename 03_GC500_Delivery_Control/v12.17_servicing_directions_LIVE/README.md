# Servicing card directions fallback — LIVE

Author: Andrew Fisher

The native tracker publisher fills blank directions for an unpinned reference from its existing recorded location text. It preserves existing directions and pins. It does not infer coordinates or combine separate locations into one pin. All jobs, identities, quantities and completion history stay unchanged.

Base: verified v12.16 `4ab22e6bf6a9af93c255fd3732ae8ba57f047dccfb1d3be770b4b1ac7d8d0382`.
Candidate: `1c1a981c3f674c481a0c99e13cb4b93d311396132af54bef5bd66d401addd5f5`, 15,348,113 bytes.

Published and verified live. Toolchain: 197 scripts; synthetic directions boundaries 11/11; exact preservation/wrong-base/double-application checks 3/3; native readiness 17/17 on desktop and phone; crew-card checks 9/9 each; full desktop/phone sweeps 27 routes, 19 visible panes, 7 deep links and Back, zero page/console errors or record writes. Phone inspected. Native dry capture 77 checks, zero writes; uploader dry run passes. Page published 25 Oct 2026 14:34:50 AEST; separate public GET at 14:35:06 matched exact bytes. Native event tracker updated once and read back by 14:35:35 AEST. READY source `58c49fcff5fb2133b91e7ef613f38e2cb067c359`. Live crew SHA-256 `2c9fed6f23d3a3732e28b2c6f32846aa7e467da233f39c40b4a67ac30b3df272`. Live crew checks 10/10 on desktop and phone, including no revision warning; actual public-phone readiness 17/17. All QR signatures, tracker configuration, completion history and the operational record remained unchanged. No crew messages sent. Independently implemented and tested; no second-agent review.

Operational snapshots, directions, private codes, screenshots and generated crew HTML stay outside the repository. Tests take private inputs through RUN/EVIDENCE; only synthetic fixture data is in this source. The guarded updater defaults to dry capture and needs the reviewed candidate live plus explicit execution mode before one native update. It verifies unchanged signatures, tracker configuration, history, job record and exact crew HTML read-back.

Candidate-card previews deliberately receive the previous published card revision from the live GET-only service, so the existing revision guard requests a reload. The final live verification additionally requires that warning to be absent after the native update. No completion tap is used in either check.
