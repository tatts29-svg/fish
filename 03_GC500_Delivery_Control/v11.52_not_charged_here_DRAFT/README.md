# v11.52 — Not charged here: six references on their own hire schedules; waste-tank labour one charge with the block

Author: Andrew Fisher. Built on live v11.51 `da4e1ef9…`. LIVE line and hashes in STATUS.md.

## Andrew's words, 23 Oct 2026

"Labour on waste tanks is one charge inclusive with the toilet block. and these are not to be charged these are on
different contract we can make note and remove any charges to do with these please related to these references we will
obviously still track like we have been doing etc. but we wont include these costs in anything we do on here ok, T0024
are on HS# 9977412 & 9968929, T0162 are on HS# 9977410, T0176 are on HS# 9989424, BJR01 are on HS# 9983884, SVP01 are on
HS# 9980337, Tickford on HS# 9990100".

## What the page did before, measured on live v11.51 (23 Oct, 11:35 AEST)

Each of the six references (T0024 Coates' own compound, T0162 Blanchard Race, T0176 Redbull, BJR01 Brad Jones Racing,
SVP01 Shell V-Power, PG29 Tickford Racing — eight FWF toilets between them) was charged on the page like any customer
reference: labour included on arrival (install and demob, $36.44 a toilet each), event-night servicing (FWF pump-out,
$72.87 a night a toilet, three nights, T0024 already excluded as Coates' own use since v10.50), transport ($47.50 a toilet
each way as the legs happened) and the card-hire comparison figure; Event Portables' servicing cost for the same toilets
sat on the cost side. The four tank-mounted toilet blocks (WC05, WC20, WC27, WC60: six waste tanks) carried their own
labour on the tank — install, levelling, cleaning and demob, $551.73 a tank — on top of the block's.

| Figure (AUD ex GST) | Live v11.51 | v11.52 build | Change |
|---|---|---|---|
| Revenue total (Costs & P&L) | 898,461.60 | 892,686.56 | −5,775.04 |
| of which labour included per piece | 76,435.86 | 72,542.48 | −3,893.38 (six references −582.96; waste tanks −3,310.38) |
| of which event-night servicing | 86,247.45 | 84,935.79 | −1,311.66 (six FWF × 3 nights) |
| of which transport legs arrived | 117,783.30 | 117,213.30 | −570.00 (the legs that had happened; $760 over the job) |
| Card-hire comparison (not in the total) | — | — | −720.54 (eight FWF at the card's day rate) |
| Direct costs known | 363,856.67 | 363,163.67 | −693.00 (Event Portables servicing of the six FWF) |
| Difference so far | 534,604.93 | 529,522.89 | −5,082.04 |
| Labour, the whole job (install, steps, levelling, demob) | 64,620.51 | 61,664.03 | −2,956.48 |

The included-charge rows and their count (507) are unchanged: the work is still recorded; it is priced at nought.

## What changes

- **One new script block** (`notcharged1152.js`, inserted before the `spot1117` block, after every function it wraps)
  wraps the money primitives, so every table built from them says the same thing:
  - `labourLinesFor` — on the six references, and on every waste tank, the card lines stay (they are the included-on-
    arrival rows and the ticks) with a rate of nought and the reason on them;
  - `assetTotal` — hire, accessories, labour and the card's transport at nought on the six; the lines stay, marked;
  - `nightService1040` — no event-night servicing on the six, so the supplier servicing cost drops too;
  - `buildingTransportInput831` / `otherTransportInput831` — a held reference's legs are excluded before the model prices
    them, the way Coates' own use is;
  - `contractTreatment747` — contract 9968929 line 5 is the same asset 1257261 (T0023, Coates' own container) whose
    description Baseplan now writes as "Shop Front - Shut Down"; the 1 Oct own-use treatment stands (it had fallen off
    with the rename and the line read "no rate");
  - `arrivedChargesHtml975` — the drawer's charges table says Not charged here instead of rows at nought.
- **Fourteen text edits:** the drawer's charge rows and hire line say why; the Pricing tab prices the job without the six
  and lists them with their hire schedules beside the cancelled references; the P&L "Not in it yet" list, the costs
  ledger hint, the Where-we-are money cards and the text export carry a "Not charged here" line; the labour summary
  object names the six (`excluded1152`); footer v11.51 → v11.52.
- **Nothing else moves.** No record change. The trackers, lights, servicing areas, positions, the crew card and the
  Map explorer are untouched. The handle is `window.NotChargedHere1152` (refs, has, of, hs, why, tank, summary; the
  unwrapped primitives under `unwrapped` for a test to measure what is held out).

## Files

- `patch_v1152.py` — requires live v11.51 by SHA-256; the edits, the block insertion, the footer; needles checked.
- `notcharged1152.js` — the block.
- `tests/test_v1152.cjs` — desktop and phone: the six held (hire, labour, transport, total at nought; lines marked;
  included rows kept); no night servicing on them and none in the servicing model; transport legs excluded with the
  reason; what is held out is real money (labour, servicing, transport, card hire above nought, printed); every waste
  tank's labour at nought with its rows kept and the block's rates untouched; contract 9968929 all Coates own use;
  the P&L labour equals the references' labour; the summary names the six and the waste tanks; the P&L list and ledger
  hint, the money cards, the Pricing note and count, the drawer for T0162; record unchanged, no errors, no writes.
  Screenshots: the P&L "Not in it yet" list, the Pricing note, the T0162 drawer.

## Checks

- Dry build on a copy of live v11.51, scrubbed as the build is, check_page PASS; the real build from live byte for
  byte the same (hash in STATUS.md).
- `tests/test_v1152.cjs`: see STATUS.md for the counts on the build (evidence/dry/) and on live.
- Regressions on the build: v11.48 (tabs set aside), v11.51 (areas with the toilets), v11.50 (closures), v11.46 (card
  words) — evidence/dry/regress/.
- Sweeps, desktop and phone, on the build — evidence/dry/sweep_*.json.
