# Servicing map pictures and unfinished jobs — draft

Author: Andrew Fisher

Andrew requested a map picture and unfinished jobs, added navigation information, whole-area sharing, and a picture showing where the equipment is within the location. This release adds Share map + jobs to the selected reference and Share area + jobs to the selected area in the main Servicing map.

The prepared picture includes the selected servicing night, verified-progress time, site overview, closer registered-map view, labelled locations and unfinished tasks grouped by reference. It reuses the Servicing map's equipment icons, recorded coordinates, area colours and area-envelope functions. Separate equipment spots within one reference have matching labels on the map and job list. Pump out, Clean & restock and Water checked / refilled retain the existing task rules. Directions use recorded navigation pins; missing positions are identified. The user chooses a recipient in the device share menu, or saves the PNG and copies the jobs/directions. No record or message is sent automatically.

Base: live v11.63, SHA-256 `88a1d5e1cca8a7b005e40b27c0681b69c72934095c2654d993935ec6bfd15dcf`, source board `bab8a7e9d3e1ca59b7d98a630d2da285aac8b771`. Claimed on `fea03a9ce511cb3dccac737a5ddfcc68f6640670`; implementation branch `codex/gc500-servicing-share-24oct`, shared branch `ccr-061f77e8-ivjhrv`.

Status: implementation and tests in progress; not ready to upload. The embedded crew-card bundle, servicing state rules, map geometry, operational records and printed QR codes are retained. Other servicing navigation/checklist proposals remain discussion only.

Build with the shared `toolchain/build.sh v11.64 v11.64_servicing_map_share_DRAFT/patch_v1164.py`. Run `tests/test_v1164.cjs` with `PAGE` pointing to the candidate, `BASE` to `base_live.html`, and `MOB=1` for phone. The synthetic fixture uses an explicitly labelled abstract test map, never the site plan. `tests/test_native_v1164.cjs` separately reads the actual tracker in the native Servicing tab using the runtime credential for host-scoped GETs only. The key never enters the browser, a file or command arguments. `EVIDENCE` must be an authorised private folder outside Git. Then run both shared sweeps and guarded dry-run/upload. Every test blocks live writes and does not send a message.
