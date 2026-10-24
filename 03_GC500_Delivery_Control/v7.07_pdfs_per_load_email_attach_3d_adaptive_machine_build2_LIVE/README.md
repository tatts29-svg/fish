# v7.07 PDFs + Email attach; 3D adaptive; machine build 2 (LIVE)

Author: Andrew Fisher

**Live: 28 Sep 2026, 01:39 AEST.** The page is v7.16 + `patch_v707.py`, and the machine set is 9637ce437ad2. Every file
was verified byte for byte on the view link.

## Day documents: real PDFs (v7.07)
- **Every tile is a drop-down:**
  - Pre-start: 1 page.
  - Drivers and Install: "All loads", or one load by its references.
  - Email: Pre-start, Drivers or Install.
- **One A4 PDF per load**, plus one combined file for printing in one go. Each is captured at 240 dpi with the page's own
  fonts, 0.5–0.75 MB a page, and the QR codes are drawn as vectors (483 of 483 decode at 150 dpi).
- **Email (attach):** the phone's share sheet opens (Outlook) with the per-load PDFs attached and NO links anywhere,
  following Andrew's instruction. It splits into parts over 10 files or about 18 MB. Where attaching isn't possible, the
  PDFs are saved and a link-free email opens.
- **Sheet change:** the Navigate QR codes on multi-reference sheets are now 12.5 mm, so they scan and the four photos
  still fit.
- **Timings, simulated phone with CPU 4×:** 7 PDFs in 22–30 s; 13 PDFs in 41–48 s.

## 3D Map (adaptive)
- It draws at about 0.6× while moving and snaps back to full sharpness about 0.2 s after stopping:

  | Tier | When still |
  |---|---|
  | Ultra | the device's own ratio, up to 3× |
  | Auto | up to 2× |
  | Light | 1× |

- The 366 pins no longer re-measure their height on every tile. They're placed once at the measured ground.
- Folding phones are recognised as touch devices.
- The status box shows briefly and closes with any touch. See `README_3d.md`.

## Machine build 2
- Sharp when still: full device ratio up to 3, with every part drawn. It drops to a lower resolution while moving and
  snaps back 0.18 s after stopping.
- Anti-aliasing is restored (4×), and the shadow map is 4,096.
- Everyone is working: the crew spend 91–100 % of their time on real jobs.
- People working at the car fade to 30 % when they're in the camera's way.
- **Not in it yet:** the exploded interior (seat, console, wheel and cog), which needs a new cabin layout.
  See `CHANGES_v7.00.md`.

**Checks:**
- The full dashboard → Map → 3D flow: 368 pins, find, a real tap opening the card, back to 2D, no errors.
- The pre-start is still one page.
- The machine: test_v7_00 7/7 and test_v6_99 17/17.
