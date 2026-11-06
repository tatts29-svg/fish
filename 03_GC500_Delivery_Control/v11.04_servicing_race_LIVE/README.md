# Servicing race display and category progress

Author: Andrew Fisher

VERIFIED LIVE — published 21 Oct 2026 at 15:21 AEST. Guarded publication and independent byte/native read-back passed. Release source `d852f5466b870b9512db4790103c863ad5fabcd1`.

Servicing used pale panels and placed area percentages below a large map. The new presentation matches the existing dark GC500 display, gives the whole night a prominent numeric score, and places every area score alongside the map on wide screens. Big-screen mode keeps the selected night and saved completion visible together. Completed areas glow; pending or rounded readings cannot claim completion. Reduced-motion preferences and hidden views pause the animation.

A separate fencing defect calculated installed progress but retained an unconfirmed state from activities outside that headline. The corrected headline validates the installed scope using the existing evidence and shared-allocation rules. Uncertain allocation remains a range. The seven-category index keeps its existing weighting, and excluded activities retain their separate detail rows.

The exact predecessor is verified v11.03 SHA-256 `312c5a31536a4af0e01cf5850828994b1076d6d3c123d4098158030146af986e`. The master patch protects servicing arithmetic, tracker configuration, permanent codes, drawing data and images. This release does not change operational records or financial values. Private screenshots and native evidence remain outside the repository.

Implementation is split into a presentation subpatch and an installed-progress subpatch, composed by `patch_v1104.py`. Final source, focused tests, phone/big-screen review, both navigation sweeps and guarded publication/read-back are required before a live claim.

```sh
bash toolchain/build.sh v11.04 v11.04_servicing_race_LIVE/patch_v1104.py
```

Final candidate SHA-256 `198242a69a69e675dc733f0945bc1e092d2813d1090af20d1f5fcefb0b348eab` (21,022,969 bytes). All 150 scripts parse. Checks passed: 52 source/model, 39 native qualified-progress, 24 narrow-phone range, 32 exact final presentation and 190 exact final controller checks. Independent final screenshot/source review passed. Both final desktop and phone sweeps pass 25 sections, seven links and Back with zero script/console errors. Completed visual examples are local synthetic fixtures; no event completion is implied. The release performs no native record writes.

Independent live verification passed 2,544 GET-only checks against the exact candidate, with zero mutations or browser errors. Whole job state, tracker configuration, permanent codes, saved ticks and card metadata were unchanged; selected-night percentages and qualified category progress agreed. Root separately verified the exact public bytes and unchanged native documents. A follow-on investigation is checking map centring across a large viewport resize; no geometry or location change is implied.
