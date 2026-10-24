# v11.85 — the feet read as feet

Author: Andrew Fisher. **LIVE 24 Oct 2026 15:27 AEST.** Page `4da2a95c57d1027a58a039fb252536b23d1095233b79f596d8fafc2dd2e9f583`
(21,875,851 bytes), built on Codex's live v11.84 `6ec05a3a3516de14d9780d375899290be094e42f8b2f0ffee5b640d2b77aa012`. Media manifest
`a16f36185c4b23f5156e6053194753252a140a82ed9ca2875b21aa39eae7caeb` (1,999 files) registered first. Guarded upload; the view link
serves the build byte for byte.

Andrew, 24 Oct 2026: "Do you have the feet right ... Feet/bases we should have 1000s not hundreds ... Concrete block are wrong ...
Forget what we charge i want data what they used ... What are concrete blocks are they not feet".

They are. Feet, bases and blocks are one item. The "216 fence blocks" were the 216 feet on docket 36566 (108 braces at the rear of
the pit building). They went on the card's Fence Blocks charge line at $3.02 on the project manager's word of 2 Oct 2026, and they
are already inside the 8,235 feet the crew wrote on the hire agreements.

## What changed

1. **`feet1185.js`.** The progress views carried a recorded-only "Fence blocks 216" line read from the charge column. It now reads
   **Feet / bases 8,235**: the component-box total of the usable hire agreements to race weekend, which is the same count
   `fenceComponents849` gives the Showcase and the Fencing tab's components.
   - Today fencing table: Feet / bases, recorded 8,235 each.
   - Its breakdown lists every hire agreement with its feet, 123 of them (36568: 474; 36566: 216 ...), with the signed papers.
     The plan line reads "8,235 each recorded". The note says 11 hire agreements with panels or braces left the box blank, and
     those are not estimated.
   - Progress tab, "Fencing — planned to date against done": Feet / bases each, docketed 8235, no plan. The table writes whole
     numbers plain, as every row does. The race-weekend merge keeps the line.
   - Earlier days show their own feet. On 20 Sep, before 36566, it reads 1,499.
   - Unchanged: the Fence Blocks charge line (FCOL `fence_blocks`, $3.02, "charge as per what was used"), the Fencing tab's
     weekly charge lines, and docket 36566's own entry.
2. **Race-call turn 30** no longer says "two hundred and sixteen concrete blocks". A fresh voicing was declined at the approval
   prompt and was not retried, so the phrase is cut out of the v11.83 take 30a.
   - `cut_turn30.py`: keep 0–11.98 s, drop 11.98–15.22 s, 0.18 s gap, 10 ms fades. Then the v11.83 mix unchanged.
   - Evidence: `evidence/cut_turn30.txt` (word timings and levels) and `evidence/qa_turn30.txt`. The new take transcribes word
     for word (ratio 1.000), with no "concrete" or "sixteen" and no click at the join (largest sample step 0.33 against 0.35
     elsewhere). Take `6fb5d349…`, 20.06 s.
   - It now says: "Five thousand two hundred and twenty-three mesh panels! Eight thousand two hundred and thirty-five feet!
     That's more feet than a centipede convention! Every panel carried, stood and squared up by hand — foot by foot, around the
     whole circuit!"

No record, servicing, crew card, tracker or printed-code change. Record version 10804 throughout.

## Checks

- `toolchain/build.sh v11.85 patch_v1185.py`: 178 inline scripts parse, no secrets, PASS.
- `tests/test_v1185.cjs`: 23/23 on the build (desktop and phone, after the media upload) and 23/23 on the live page (desktop and
  phone). Logs and screenshots are in `evidence/`.
- Full sweeps on the build, desktop and phone: 27 tabs, 19 shown, 7 hashes, Back; 0 errors, 0 console errors, 0 writes.

## Files

`patch_v1185.py`, `feet1185.js`, `cut_turn30.py`, `turns_changes.json`, `takes/turn30.mp3` + `takes/takes.json`,
`upload_media1185.py`, `tests/test_v1185.cjs`, `evidence/`.
