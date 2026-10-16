# Today's board made right: WC09's FWF counted installed, T0128 VMS installed and complete — 16 Oct 2026 — APPLIED, VERIFIED

Author: Andrew Fisher. Andrew, 16 Oct 2026: "toilets are still showing as not complete … VMS boards still not updated
on the main Today page, please get everything updated and correct."

- **Toilets.** Today read "261 received · 255 installed". The six were WC09's FWF that arrived today: WC09 was ticked
  complete on 9 Oct with four units, and the Toilets card counts a unit installed only when the install tick is newer
  than the arrival count (`toiletItem962`: `explicitInstall` needs the install stamp at or after the receipt stamp). The
  install tick was saved 10:48 and the count set to 10 at 10:58, so the same tick was saved again through `setLabour`
  (`wc09_spec.json`, 7333 → 7334). WC09 now reads 10 of 10 installed; the only toilet not complete is WC65 (FWF ×1, due
  19 Oct, not arrived).
- **VMS.** Today read "2 of 6 complete": T0128 (VMS11 467T, VMS12 1211646, delivered today) had been left unticked for
  Andrew's word. His word given, T0128's install tick (the tick row's own button) and complete tick (`setDone`)
  (`t0128_spec.json`, 7334 → 7338). T0158's five boards stay received (5 of 9) for Monday 19 Oct.

Runner `ticks_apply.cjs` (from `record_16Oct2026_wc09_complete/`, now with `restamp` and `complete`), dry run first,
backup, write gate, read-back; reports beside the specs.
