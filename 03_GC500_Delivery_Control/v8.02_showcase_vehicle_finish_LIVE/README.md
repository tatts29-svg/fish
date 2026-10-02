# Showcase and vehicle finish

Author: Andrew Fisher

LIVE,2Oct2026 15:38 AEST. This carries the reviewed v7.94 full-lap presentation and v8.00 vehicle components onto the fresh v8.01 booking release. It preserves Wednesday bookings, their departure order, operational allocations and shared records. The public view was independently verified byte for byte.

The bounded integration patch consumes the v8.01 release marker, applies both visual components with their existing exact source guards, and sets the final release marker to v8.02. Component source versions remain v7.94/v8.00 for traceability. A repeated or partial application is refused.

After v8.01 is verified live:

```bash
bash toolchain/build.sh v8.02 v8.02_showcase_vehicle_finish_LIVE/patch_v802.py
```

Final source checks, visual evidence and publication verification will be recorded here. Component source and review evidence remain in the referenced draft folders until their publication status is updated. No completion, physical-device frame-rate or flawless-rendering claim is made from CPU checks alone.

## Final candidate verification

Fresh official build from verified live v8.01: SHA-256 `07d618803b0b6ee97b27265ce4eeadd0390190a4a61dd25a7c1d428ca1bc2992`, 9,070,571 bytes. Complete DATA and business script match live `70ed0c49…`; all seven non-business scripts match the independently GPU-tested `85adb462…` visual reference exactly. Source binding15/15, race32, plant154, material21, camera188 plus integrated244, native-AA26, AA guard4 and race patch guard6 checks pass. The accepted graphics source passed82 matched GPU checks,14 actual desktop/phone UI views and ten normal opening/seam views. Root also inspected final desktop day/night and phone boom frames. No operational record writes.

Balanced now selects a supported native4× framebuffer on devices that cannot supply the requested2×. Measured additional attachments:30.29MiB at the tested desktop size and10.53MiB on phone; existing allocation fallback/disposal remains in force. Test-browser correctness and resource cleanup passed; physical-device frame rate is not measured. The existing operational layout is unchanged. Both final21-tab/7-link desktop and phone sweeps pass with zero page and console errors.

Public verification: `evidence/release_verification.json` confirms the exact final candidate and every operational collection unchanged, record3538.
