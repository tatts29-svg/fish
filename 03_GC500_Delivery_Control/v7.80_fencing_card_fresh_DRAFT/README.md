# v7.80 — the Fencing card follows a typed rate (FINAL CANDIDATE on live v7.79 — for the joint review)

Author: Andrew Fisher · 1 Oct 2026, 22:10 AEST · one patch on the live page (v7.75 + v7.77, `35e4b00b…`)

## Why

Found by the critic in Claude's v7.75 review, recorded in `../v7.75_fresh_after_a_save_DRAFT/README.md`. When an editor types a
paid fence rate on the Fencing tab, the box's handler saves and calls `renderFencing()`. That is a partial redraw, not a
full draw (`renderPass`), so `RENDER_MEMO` (what a draw keeps for itself) was not emptied. The **"Paid to Advanced, by P&L
line"** card reads `fencePaidSplit` from that memo, so it kept the old figure while the KPI above it showed the new one,
until the next tab change. The record itself was right; only the screen was out of date. This bug is the same on v7.74, v7.76 and the live page.

Reproduced on the live page (`evidence/fencing_on_live.json`). After a rate is typed, the dockets' paid total moves from
$75,871.50 to $60,166.50, but the card still shows **$77,121.50** where it should show **$61,416.50**.

## What it changes

`save()` empties `RENDER_MEMO` before and after the save, the same way v7.75 marks the held asset list stale. Every edit
reaches `save()`, so whatever draws next, whether a full draw or a partial one, reads the record as it now is. That also covers
the other per-draw results in the same memo: the P&L model, the money summary, the branch roll-up, the pins and the
labour plan. A draw with no save in it keeps its memo and works each result out once, as before.

No figure, rule or record changes. Three lines differ from the live page: the version note, and two `RENDER_MEMO.clear()`
calls in `save()`.

## Build

```
bash toolchain/build.sh v7.80 v7.80_fencing_card_fresh_DRAFT/patch_v780.py
```

On the live `35e4b00b…`: **8,682,916 bytes, SHA-256 `c246c33ba35c5fbe1fc75e1677e2576568cebbff3187b1b2358463d61ccafd71`**,
check_page PASS (no keys in the page).

If Codex's v7.79 (Text it wording) goes live first, this is rebuilt on that page and both agents check it again.

## Results

| Check | Live page `35e4b00b…` | v7.80 build |
|---|---|---|
| `evidence/fencing_card_fresh_tests.js` (5): F1 the typed rate moves what the dockets paid; F2 the kept split is the fresh one straight after the handler; F3 the card on screen shows the new total; F4 the rate put back, the card and `S` as found; F5 a draw with no save works the split out once per tab change | **3/5** (fails F2, F3) | **5/5 desktop · 5/5 phone** |
| v7.75's fresh-after-save tests (`../v7.75_fresh_after_a_save_DRAFT/evidence/fresh_after_save_tests.js`) | 11/11 | **11/11 desktop · 11/11 phone** |
| The released P&L suite (`../v7.70_pl_in_the_business_lines_LIVE/evidence/practice_tests.js`) | 31/31 | **31/31 desktop · 31/31 phone** |
| Codex's v7.76 navigation regressions | 21/21 | **21/21** |
| Sweeps (`toolchain/harness/sweep.js`) | — | **21 tabs, 7 deep links, 0 page errors, 0 console — desktop and phone** |

All logs and JSON are in `evidence/` and `evidence/regress/`. Every test is read-only: the harness aborts every write the page
attempts, and the editor path is opened only inside the Fencing check, with the push, folder write and storage stubbed and
the record put back.

**Claude: complete on `c246c33b…` (22:30 AEST). Handed to Codex for review.** This is not ready to upload until Codex
has reviewed the same frozen build. If v7.79 goes live first, it is rebuilt on that page and both agents check it again.

## Final candidate — rebuilt on live v7.79, 1 Oct 2026, 22:40 AEST

Codex's independent review of the first build (`c246c33b…` on v7.77) passed at 22:16: exact match, 5/5 on desktop and phone,
the baseline reproduced at 3/5, and memo invalidation only. v7.79 went live at 22:17 (`19d200c4…`), so v7.80 was rebuilt on it.
`patch_v780.py` is unchanged.

**8,682,905 bytes, SHA-256 `303029e3e64d5a43654bafc400d09e5bed2efbb93060a964214502cc04b96fc7`**, base
`19d200c470b5ac7403efad12b42160a6e049c11f7ed7eadbe68b2a640999423a`, check_page PASS. The same three lines differ from the live page.

| Check (`evidence/regress_on_v779/`) | Live v7.79 | v7.80 final |
|---|---|---|
| Fencing card tests | **3/5** (fails F2, F3) | **5/5 desktop · 5/5 phone** |
| v7.75 fresh-after-save tests | — | **11/11 desktop · 11/11 phone** |
| Released P&L suite | — | **31/31 desktop · 31/31 phone** |
| Codex's navigation regressions | — | **21/21** |
| Sweeps | — | **21 tabs, 7 deep links, 0 page errors, 0 console — desktop and phone** |

**Claude: complete on `303029e3…`.** It is READY TO UPLOAD only once Codex has checked this same file.
```
bash toolchain/build.sh v7.80 v7.80_fencing_card_fresh_DRAFT/patch_v780.py
python3 toolchain/upload_page.py build/GC500_v7.80/GC500_Delivery_Control_hosted.html
```

