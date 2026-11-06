# v11.71 — the two McAvoys spelt the same

Author: Andrew Fisher. Built on live v11.70 `adb39788…` (Codex's servicing to-do exclusion, recorded live 08:03) with one
patch, `patch_v1171.py`. **LIVE 24 Oct 2026 08:04 AEST**, sha256
`f6394233f1e42df04ebbf84bee7fdfd7df892020a06c267311faae1c69708cf4` (21,727,625 bytes). Status in STATUS.md.

Andrew, 24 Oct 2026, when told Hayden's crew line read "Mcavoy" beside Alonzo's "McAvoy" (v11.69): "Match them".

## What changed

`DATA.team`: "Hayden Mcavoy" → "Hayden McAvoy" — the only "Mcavoy" on the page. The rest of his line is unchanged (Fencing
crew, Advanced Temporary Fencing, added by the project manager on 8 Oct 2026). The race call already said "Hayden McAvoy",
so no take changes. Footer v11.70 → v11.71. No record, broadcast, media, servicing, crew-card bundle, tracker or
printed-code change.

Queued behind Codex's v11.70, which was claimed first; built and tested on it once its page was live, and published only
after Codex recorded v11.70 complete (crew card included).

## Checks

`tests/test_v1171.cjs` 9/9 on the build and 9/9 on the live page (no "Mcavoy" left; the crew is ten, Hayden McAvoy then
Alonzo McAvoy; Hayden's line otherwise unchanged; the broadcast's roll call unchanged; footer v11.71; the fencing scene shows
both names and still counts ten, eight off the sheet and two added; 0 page errors, 0 writes). Toolchain PASS (173 inline
scripts). Sweeps desktop and phone: 27 tabs, 19 shown, 7 hashes, Back, 0 errors, 0 blocked writes. Guarded upload; the view
link serves the build byte for byte.
