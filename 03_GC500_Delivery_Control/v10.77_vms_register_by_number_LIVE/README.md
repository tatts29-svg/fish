# v10.77: the VMS board register in VMS-number order, with what has turned up (LIVE 19 Oct 2026 16:41 AEST)

Author: Andrew Fisher · built and uploaded by Claude. Andrew, 19 Oct 2026: "i want this simple forget the T numbers for
these ... each with a VMS number whats turned up", "Our qty needs to now be 23", "Proceed upload and you go live".

- The Equipment tab's **VMS board register** lists its 23 boards in number order, VMS01–04 and VMS06–VMS24. Before, it was
  in contract-line order (VMS02, VMS01, VMS07 …).
- Each board is marked **✓ turned up** (on a delivery that is on site; v10.76's rule) or **still to come**.
- Heading: **"23 boards · 20 turned up · 3 still to come · 20 regos given"**. Still to come: VMS21, VMS22, VMS24.
- Display only; no record or charge changes. Footer v10.76 → v10.77.

**Page:** `74e9b97240e32b36a62d187974467e493eebc49b8ab73a407496ea48ed41c323`, 18,515,126 bytes, built on live v10.76
`d1ecb5b1…`; guarded upload, byte for byte. **Tests:** `test_v1077.cjs` covers the order, the marks, the heading, the VMS
row (20 on site · 3 still to come · 23 ordered), the footer and page errors. It passed on desktop and phone on the build, and
on live. Both 24-tab sweeps: 0 page errors, 0 console errors.
