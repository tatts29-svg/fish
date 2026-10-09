# v7.86 — Fence blocks and incomplete Track detail hidden (LIVE)

Author: Andrew Fisher · **LIVE 2 Oct 2026 08:45 AEST**

The incomplete Track detail option is hidden until the upgrade covers the whole lap. The existing full-circuit
Showcase, MP4 car/weather, speedos, camera controls and driving simulation are preserved. The separate whole-lap
visual improvement remains unfinished; this release does not claim to deliver it.

A settled **Fence blocks** line is also available on Fencing: counted each at the issued 2026 street rate card's
$3.02 per block. The supplier's per-block cost remains unknown until their invoice. Existing docket figures are
unchanged. No docket was entered or edited by this release.

## Andrew's instructions

On the partial scene: “can we take this out until its fixed, don't have it in there, its almost like a bug ... make it
go live so people don't see”. The button is no longer added; the detail source remains in the page for the whole-lap
work. All ordinary Showcase controls remain available.

On hire agreement 36566, bracing existing fence with no new metres: “charge as per what was used”, then “continue
with your logic please”. The 216 bases use the card's “Fence Blocks( per block)” line: 216 × $3.02 = $652.32.
Clamps and braces have no separate card line and remain included in the fence rate. Advanced's sheet has no
per-block cost, so the cost is not estimated. Docket transcription is a separate authorised task.

## Reproduce the release

This patch was built on live v7.85, SHA256
`2e73ac04d3c8f8105db6ff801998bbd8016a0e60b70374acfe9e4dad3e09c297`:

```bash
bash toolchain/build.sh v7.86 v7.86_fence_blocks_line_LIVE/patch_v786.py
```

The command is historical: the patch refuses a page where it has already been applied.
Final page: **8,838,586 bytes**, SHA256
`0513542de21e7e00b2498c2416d90941ca7ded90e965fa1540ac50fc55e2e425`.
The official upload passed its fresh-base guard and public byte verification. A separate fresh GET matched the same
candidate. Shared record **3527** and the active machine manifest remained unchanged. No journals or real messages
were sent.

## Checks on the final candidate

| Check | Result |
|---|---|
| Track detail disabled | 4/4 desktop and 4/4 phone; the original Showcase opens, its controls remain, no detail button or enabled partial scene |
| Fence blocks | 8/8 desktop and 8/8 phone; correct customer rate, supplier cost unknown, form and totals work, all 63 existing dockets unchanged |
| Both navigation sweeps | 21 tabs and 7 links each; zero page or console errors |
| Static page checks | 6 inline scripts parse; no new keys |
| Official upload dry-run | PASS; live base matched and publishing capability confirmed |
| Phone visual | Original car and circuit visible, normal controls reachable, no partial-detail button; zero errors or attempted record writes |
| Publication | Reviewed build equals public page byte for byte |

The source diff has three hunks: the Fence blocks column, the detail-button guard and the release comment.
Independent implementation review and final checks are complete. Public proof is in
`evidence/independent_review.json`, `evidence/phone_showcase_live.png` and `evidence/release_verification.json`.
Phone checks use Chromium emulation; no physical-handset performance claim is made.

## Earlier checks

Before the Track detail guard was added, the fence-only candidate `3e1612dd…` passed the existing rules, print,
destination, ways-in, inventory, explorer, fencing, fresh-after-save and P&L checks on desktop and phone, plus Inventory
PDF 9/9 and both sweeps. Those files remain historical evidence. The v7.79 text suite's 16/23 result had the same
intended old-expectation misses documented for v7.84. Earlier v7.84 prechecks are in `evidence/precheck_on_v784/`.

The first fence build triggered the attribution scrub by naming a person in page code, which collapsed intentional
spacing in driver-detail lines. The final source uses “the project manager”; the scrub is a no-op and the rules pass.
