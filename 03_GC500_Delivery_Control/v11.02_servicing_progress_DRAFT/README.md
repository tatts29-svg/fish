# Servicing progress lights and stable refresh

Author: Andrew Fisher

READY TO UPLOAD — final candidate checks complete. Source `15d6ed347d9fc8b9e7487ec9c52d8acf914fe601`; owner: accepted servicing session on the branch named in STATUS.md. Guarded publication and actual native read-back remain pending.

Servicing progress previously replaced the whole panel when a displayed clock or completion changed, temporarily detaching the map and active controls. The controller now reconciles keyed values in place, retaining the map, open areas, focus and scroll. Map area/reference controls also retain their nodes and unchanged progress avoids a repaint.

The existing race-light appearance is used for prominent overall and area percentages. Lights mark 20/40/60/80/100 percent; reached milestones are red and all five become green only when every required reference is fully saved. Numeric percentages update immediately. No timer animates a fabricated intermediate count. Short decorative transitions respect reduced motion; existing map motion and image limits are retained.

The shared SvcState arithmetic remains byte-identical: quantity-weighted jobs, percentages rounded down, selected servicing night, refill extras excluded. Pending, undo, empty-plan and failed-read states retain their distinctions. There is no tracker, crew-card, QR-code, operational, financial, location or source-drawing change.

Build and focused guards:

```sh
bash toolchain/build.sh v11.02 v11.02_servicing_progress_DRAFT/patch_v1102.py
python3 v11.02_servicing_progress_DRAFT/test_patch1102.py build/GC500_v11.01/GC500_Delivery_Control_hosted.html
node v11.02_servicing_progress_DRAFT/test_progress1102.cjs
```

The patch requires exact verified v11.01 SHA-256 `eb8373a49087060adaf4fac26668c4ad02c87482dabfdcf14155ad3137322395`. Protected source spans and unrelated scripts/styles are checked. Controller tests use local synthetic GET snapshots and reject live writes. Private native evidence and screenshots remain outside the repository. Both final desktop/phone sweeps and exact public/native read-back are required before a VERIFIED LIVE handover.

Frozen candidate: SHA-256 `4b1ee468727cb98b3c52f751c77ce6d4b0258b7dca32c14b40c1ae41a95bcfd5`, 20,941,279 bytes. Official build parses all 150 inline scripts. All 13 patch guards and 44 focused presentation checks pass, including the actual candidate CSS on phone and desktop. Separate final source review confirms exact reproducibility and unchanged protected spans.

Controller coverage includes unchanged reads across a displayed-minute boundary, saved completion, undo, pending ticks, selected night, midnight/service-day rollover, failed reads, shared manual-refresh requests and loss of edit access. The old controller detached the map during a normal clock update; the new controller preserves existing map/details/buttons/meters throughout. Local timings describe the controlled browser fixture, not a promise about physical phones or network latency.

Final controller suite: 190 checks pass, zero external requests, writes or browser errors. Desktop and phone full-page sweeps each pass all 25 routes, seven links and Back with zero page/console/navigation errors. Independent source review and phone/desktop presentation review pass. No review or acknowledgement from the other external assistant is claimed.
