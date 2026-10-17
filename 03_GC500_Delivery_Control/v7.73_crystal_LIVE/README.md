> **LIVE within v7.73 — 1 Oct 2026 18:19 AEST.** Final proof: `evidence/release_verification.json`.

# v7.73 — crystal (built with v7.70 and v7.72 on the live page; results below)

Author: Andrew Fisher · 1 Oct 2026, 17:50 AEST

Andrew, 1 Oct 17:37: "Please do a clean sweep of all pages. I want 4K ultra crystal clear contrast on all words. No
blurring. No delays. No lagging. Perfection at every look and turn. Work with Codex for perfection 10/10."

Split with Codex (PR #1, 17:40): this patch is the clarity half — contrast, size, blur and fades, plus per-draw P&L memoisation. Codex has
the speed half (tab-open timings, long tasks, the Map explorer and the Showcase on a phone), so the two never touch
the same lines.

## How it was measured

`evidence/audit_crystal.js` opens every tab on the build, desktop at 2× (1440 × 900) and phone at 3× (390 × 844), every
fold open, and for every visible text run works out the colour actually behind it (walking up through translucent
layers), the contrast ratio, the font size and weight, the opacity on the way up the tree, and any blur, backdrop
blur, non-integer scale or sub-pixel transform on an ancestor; it lists images drawn above their pixels and canvases
backed below device pixels, horizontal overflow, and per tab the open-to-paint time and the long tasks. The findings
are in `evidence/audit.json` and `evidence/audit_phone.json` (before) and `evidence/after/` (after).
`evidence/probe_rules.js` then traced each low-contrast or tiny run to the stylesheet rule that set it
(`evidence/rules.json`), so every fix is one rule aimed at one finding.

## What the audit found (before)

| Finding | Where | Was |
|---|---|---|
| The light theme's greys on white | every tab: `.w`, `small`, `.src`, `.hint`, the P&L's `--pl-mute`, hand-written `#6b7681` / `#7b8590` | 4.0–5.3:1 |
| Bright orange as a text colour on white | Fencing (docket numbers and links, 86 runs), Pre-starts (links), Documents (the "//" stripes, 79), the P&L eyebrow | 2.6–2.9:1 |
| "✓ Complete" ticks, white on green | Today, Progress, Plant, Fencing, About (156 runs) | 3.6:1 |
| The banner caption on a blurred, half-transparent panel | every tab with a banner | 2.6–3.0:1 |
| Table headers on backdrop blur | every table | crisp text, but a blur layer per header on a phone |
| Text under 10 px | Timeline day figures 8.5 px and weather lines 7.5–9.5 px; P&L tags and column headings 9.5 px; delivery-card kickers 9.5–10 px; hub asset numbers 9 px | |
| Text dimmed with opacity | the delivery and installer cards, the showcase tiles, the labour ticks | 0.72–0.92 |
| Cards arriving | every tab: a 0.55 s rise with up to 0.35 s stagger | |
| Banner photographs drawn at 1.56× their pixels on a 2× screen | every tab with a banner (1800 px sources) | not fixable in CSS — needs 3600 px sources |

Not findings: the dark instrument panels (their own light tokens already pass 7:1), text on photographs and
gradients (checked by eye), the VMS board lines inside the Today picture (part of the picture).

## What it changes

One CSS block at the end of the stylesheet, screen only (print keeps its own), plus per-draw P&L memoisation: the light theme's `--mute`,
`--slate`, `--ink2` and `--orange-ink` lifted to 7:1 and better on white (the dark theme's own values restated);
the P&L's `--pl-mute` and the hand-written greys to match; links and the document stripes on the light panes in the
dark orange; the tick green deepened; the banner caption on a solid dark panel at full opacity; table headers
without backdrop blur; targeted small labels enlarged (some chips and flags remain 10–10.5 px); selected dimmed text
restored to full opacity; cards rise in 0.3 s with a 60 ms stagger. Sticky table headers use the local theme background;
the financial cards pair their light text colours with a light surface in dark mode too.

## Build

```
bash toolchain/build.sh v7.73 v7.70_pl_in_the_business_lines_LIVE/patch_v770.py v7.72_tidy_for_management_LIVE/patch_v772.py v7.73_crystal_LIVE/patch_v773.py
python3 toolchain/upload_page.py build/GC500_v7.73/GC500_Delivery_Control_hosted.html
```

## Historical candidate results — superseded by the final release proof below

`build/GC500_v7.73` (v7.70 + v7.72 + v7.73 on the live v7.71), 8,665,987 bytes, SHA-256 `113483bdf67779eb1a1306b318a87ba13d077953c7aa9f27a153f60b9efacedd`, 17:53–17:58 AEST

| Check | Result |
|---|---|
| The clarity audit, re-run on the build (`evidence/after/`) | **real low-contrast text runs 418 → 31 on desktop, 435 → 31 on phone** (opacity ≥ .85, no gradient or photograph behind). Per tab, before → after: Fencing 157 → 0 · Plant 84 → 4 · Costs 48 → 0 · Timeline 42 → 0 · Progress 43 → 24 · Today 22 → 2 · Documents 31 → 0 (phone) · Pre-starts 16 → 0 · Pricing 2 → 0 · About 3 → 0. |
| What the 31 are | 24 on the Where we are instrument panel — white and pale text on the panel's dark SVG-drawn ground, which the audit reads as white (checked by eye: they pass); 1 brand chip (white on the brand orange, 2.9:1 — the design's, left); 4 "cancelled" in red on pale green (4.5:1 — borderline, left); 1 rail label and 1 phase label on the Today programme card (one run each; the phase label joins v7.74). |
| Small text | the Timeline's day figures and weather lines, the P&L's tags and headings, the delivery-card kickers, the hub asset numbers lifted to 10–11 px; what remains under 11 px is chips and glyph flags at 10–10.5 px bold. |
| Blur | the banner caption and the table headers no longer sit on backdrop blur; nothing else on the page blurs text. |
| v7.70 suite on the build | **30/30 desktop · 30/30 phone** |
| Sweeps (`evidence/regress/`) | 21 tabs, 0 page errors, 0 console errors, desktop and phone; 7 deep links clean |
| Open-to-paint and long tasks | unchanged (CSS does not change the JavaScript work): Costs 0.7–0.9 s, Progress 0.5–1.1 s, the empty tabs 0.5–0.6 s each — Codex's half, with the per-tab figures in `evidence/before/audit*.json` |

## Final release verification

The final candidate includes the independent review corrections to v7.70 and v7.72 and the light/dark theme pairing
above. Its release proof is recorded in `evidence/release_verification.json` after upload. Earlier byte counts and
audit counts describe the historical candidate, not this final build. The final build has fresh browser checks and
sweeps; it does not claim a full performance overhaul or native 4K image sources.
