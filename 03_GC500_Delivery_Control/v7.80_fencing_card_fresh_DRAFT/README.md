# v7.80 — the Fencing card follows a typed rate (DRAFT — for Codex's review)

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
