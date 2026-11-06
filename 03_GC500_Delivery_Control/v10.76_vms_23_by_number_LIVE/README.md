# v10.76: VMS boards counted by VMS number — 23 boards, what has turned up (LIVE 19 Oct 2026 16:29 AEST)

Author: Andrew Fisher · built and uploaded by Claude.

Andrew, 19 Oct 2026: "i want this simple forget the T numbers for these ... each with a VMS number whats turned up", "Our
qty needs to now be 23 vms05 was removed and no longer needed", "so the build qty needs to show this".

**Rule:** the VMS count is the boards on the VMS register: VMS01–04 and VMS06–VMS24 = **23** (1211404, once VMS05, is VMS09;
VMS05 is no longer needed). A board has turned up when the register puts it on a delivery that is on site. It is complete
when that delivery's Complete tick covers it. Otherwise it is still to come, by its contract line's date. Andrew's 23 is the
confirmed VMS requirement, so VMS no longer reads "provisional". Display only: no record, contract line, rate or charge
changes.

**Live now (read back):**
- Today: VMS boards **87% · 20 of 23 boards complete**, "23 boards · 20 of 23 boards on site", by type VMS 20 / 23, Work
  progress "86.96% confirmed complete · 23 total · Done 20 · Left 3", milestone "not there yet — 3 boards to go".
- Equipment VMS row: **20 on site · Premiair Hire 6 · Coates numbered 14 · still to come 3 · ordered 23**.
- Still to come: VMS21 (due 22 Oct), VMS22 (21 Oct), VMS24 (19 Oct, pending).
- The Build tab has no VMS total; its day cards show each delivery's own load and stay as they are.

**What changed** (`patch_v1076.py`): the helper `vmsCount1076` beside the VMS register; the Work progress VMS area; the
Today group card and type readings (bound before Scope960); the milestone's "to go" wording; the confirmed requirement
of 23 in `currentEvidence`; the Equipment VMS row (ordered and still to come). The Today part was worked out and tested by a
read-only analysis (`analysis_today_and_record_option.json`). That analysis also showed adding the three missing boards as
records does not work: revenue +$265.47 and the milestone stays at 20 of 20.

**Page:** `d1ecb5b1f8fb57e60665aae2816743b12c8fe85c1345aceaebded4186d477322`, 18,514,253 bytes, built on live v10.75
`1a4f83f1…`; guarded upload, byte for byte. **Tests:** `diff_base.cjs` (VMS row, one card per board, one company name,
footer, Costs and Today line diff): Costs **unchanged**; Today changes only the VMS readings and the overall index (92.26 →
90.39). Both 24-tab sweeps: 0 page errors, 0 console errors. Not done yet: the VMS register table in VMS-number order with
a turned-up mark on each row.
