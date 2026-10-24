# v11.26 — Live and clear: rings sweep, changes flash, what is not done is listed

Author: Andrew Fisher. Built on live v11.25 `0d8d97cf…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "Remember we want this clear as day. So it updates. We must make sure this data is always 100%
accurate. It saves. It updates every where it glows. It pulsates. Perecentages updates. It clear whats missing and not
done".

## What the card already did (unchanged, checked)

- **It saves.** Every tap is queued on the phone and sent to the service straight away, resent with back-off until the
  service confirms it, and shown "Completed hh:mm · waiting for signal" until then. "Save & close" checks every tap has
  reached the service. The status line reads "Sending · N ticks waiting" or "No signal · they go when signal is back".
- **It updates.** The card reads the service every 15 s (60 s while the service is being updated), redraws every 5 s and
  after every tap and whenever the tab comes back into view, and only replaces the parts that changed so a button is never
  swapped under a finger. The status line reads "Live · updated hh:mm:ss".
- **It is accurate.** Every percentage, ring, chip and count is worked out on every draw from the same job states (the
  service's ticks plus this phone's unsent ones), with each job weighed by its line's units and rounded down.

## What v11.26 adds

- **Rings sweep.** The card registers its `--p` ring property as a number, so the transition the rings already carried
  runs: a ring sweeps to its new percentage instead of jumping. The page's panel gets its own `--sp` property (the page
  uses `--p` elsewhere as a length, so it is not registered page-wide).
- **Changes flash, everywhere.** Every ring (job cards, header, area headers, progress bars) and every percentage number
  carries a key. After each draw the card compares them with the last draw: a changed ring sweeps from its old value and
  its halo flashes; a changed number bumps. This happens for this phone's taps and for ticks that arrive from other phones
  alike. A pill under the header shows the change for four seconds: "+3 jobs done · 255 of 752 · 33%". Switching day never
  flashes.
- **It pulsates.** A ring with work left breathes: the icon and the halo pulse slowly in the job colour. A full ring keeps
  its green pulse. All of it is off under the phone's reduced-motion setting.
- **What is missing and not done, clear as day.** A "Not done yet" card sits at the top of the view, before the audit: how
  many references and jobs are left, the jobs left by kind with their icons, then every area with its references and, on
  each reference, the icons of the jobs it is still missing, plus the area's last tap time (or "nothing done yet"). On a
  service day that has closed (08:00 the next morning) it reads **Missed**, in red, so a night that was not finished is
  never quiet. A day to come reads "Not yet open". When nothing is missing it says "Nothing missing". On a code's own card
  the "Still to go" chips carry the same missing-job icons.
- The page's servicing panel rings sweep and breathe the same way. Footer v11.25 → v11.26.

Nothing else changes: data, codes, service, record. The crews see it once the tracker is published again from the page's
own fold (TEST first; the event tracker on Andrew's word; printed codes stay valid).

## Files

- `patch_v1126.py` — requires the live v11.25 page by SHA-256. Card: keys on the ring and number markup (job cards, header,
  area headers, progress bars), the not-done card and missing-job icons, the live effects after each draw, the style; panel:
  its own property, sweep and breathe; footer. Anchors are the v11.25 blocks, imported, plus exact lines of the card.
- `tests/test_v1126.cjs` — desktop and phone: the page registers only `--sp` and the panel ring carries it with a
  transition and a breathing icon; the card registers `--p`, keys every ring, breathes with a pulsing halo; the not-done
  card (75 of 75 references, 752 jobs by kind, 15 areas, 75 references with their missing-job icons, before the audit);
  "Missed" on a closed day and "Not yet open" on a day to come; a changed ring sweeps from its old value (mid-sweep below
  the target, then at it), flashes, the number bumps, the pill shows and hides; record unchanged, no errors, no writes.
  `test_v1125.cjs` and `test_v1123.cjs` run on the same page as regressions.
- `tracker_update.cjs`, `tracker_card_check.cjs` — as before; the card check also requires keyed rings, the registered
  property, the breathing icon and missing-job icons on the still-to-go chips.
- `evidence/` — screenshots and results.

## Checks

Applied to a copy of the live v11.25 page first; the live build is byte-identical (`d39f7421…`, 21,141,885 bytes). Toolchain
PASS. `tests/test_v1126.cjs` desktop 10/10 and phone 10/10; `test_v1123.cjs` regression 11/11; `test_v1125.cjs` regression
10/13, its three misses being bounding-box size checks read while the icons breathe (39/41/25 px against 40/42/26), the
sizes themselves unchanged and pinned by CSS width in test_v1126; sweeps desktop + phone 25 tabs / 7 hashes / Back, 0
errors, 0 blocked writes. On the live page 10/10. The TEST tracker was republished from the live page's own admin fold (one
POST /api/cards, the page's own confirm answered, contact from the service, "saved and read back");
`tracker_card_check.cjs test PG01`: CARD OK — on the clean and pump codes the keyed, breathing rings with the registered
property and missing-job icons on the still-to-go chips; in view mode, with the service, "Not done yet · Thursday 22", 75 of
75 references, 752 jobs by kind, 15 areas, 75 references with 211 missing-job icons, before the audit, status "Live ·
updated hh:mm:ss"; 0 writes, 0 errors. Evidence in `evidence/`. The EVENT tracker (the crews' printed codes) is republished
only on Andrew's word.
