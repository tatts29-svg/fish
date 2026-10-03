# Today cards — v8.20

Author: Andrew Fisher · 3 Oct 2026

**READY TO UPLOAD; not yet uploaded.** Codex implemented the production integration. The release reviewer
owns the independent checks and the publisher owns the guarded upload and live readback.

Andrew asked for a stronger Today design and animation, then requested “talk to claude and get everything live
and all up to date” after seeing the working previews. This integrates that direction on the existing traffic-light,
delivery and programme cards. Native labels, quantities, calculations and actions remain unchanged.

The cards have clearer headings and spacing, quieter surfaces, a larger dial and responsive phone layouts. Nothing
animates automatically. Play or click a noninteractive card area to select it; only that card animates. The needle,
arc, lit segments and programme rail reveal their actual native readings. Text figures remain fixed. Existing
status colours never cycle to invented states.

Pause, another selection, leaving the visible scroll area, hiding Today, reduced motion, Motion Off, printing or
hiding the document stops the effects. The controller honours the native scrolling `main`, including clipping
behind the fixed header. A refresh retains the selected identity, cancels detached effects and never replays the
reading sweep. A full native redraw can pause during its layout change; it does not automatically restart after a
visibility stop. A visible card replacement can retain ambient motion. No network, preference or operational writes
are added. There is one 250 ms preference guard only while a user-started animation is active; no idle timer.

## Source and build

- `patch_v820.py`: uses shared `rep`, refuses a second installation and requires the v8.18 weather marker plus
  the native Today renderer. It inserts bounded CSS/controller blocks and a `Today v8.20` footer suffix; it does not
  change the original DATA build provenance.
- `today820_src.css` and `today820_src.js`: production sources; `TodayMotion820.report()` is available for checks.
- `check_today820.py`: patch guards and exact original-page preservation after reversing only those insertions.
- `check_today820.cjs`: integrated read-only native status/actions, endpoints, selection, refresh, motion preference,
  scroll clipping, keyboard and responsive checks. Screenshots and live-record observations remain outside Git.

Build from the then-current live page:

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v8.20 \
  03_GC500_Delivery_Control/v8.20_today_motion_DRAFT/patch_v820.py
python3 03_GC500_Delivery_Control/v8.20_today_motion_DRAFT/check_today820.py
CHROMIUM_PATH=/usr/bin/chromium node 03_GC500_Delivery_Control/v8.20_today_motion_DRAFT/check_today820.cjs
CHROMIUM_PATH=/usr/bin/chromium MOB=1 node 03_GC500_Delivery_Control/v8.20_today_motion_DRAFT/check_today820.cjs
```

Use the shared browser lock when other verification is running. `PAGE`, `BASE` and `OUT` can point tests at a final
rebuild and private evidence directory. Standard desktop and phone sweeps must also pass on the final candidate.

Current checked base: `f3bb490b0a6a23ef820dc71d359b5e246a443778e0d1baef35dcf3393a259000`.
Final upload candidate: `88a7b6b110194133ab59f5efa17b169f937f8fa21cb551dfd38f96eab6597919`, 9,293,149 bytes.
Runtime-tested candidate: `c45062efb28840fa6221d8a16dd428eabd4b4deaf3de0a30e4a2eb8a7944e6d8`, 9,293,143 bytes.
The earlier `0c690aaf` candidate is historical and is not the final release: integration testing found that a card
fully clipped behind the fixed header could keep animating. The final source handles ancestor clipping and nested
scrolling explicitly. Two earlier test assertions also used window scrolling or assumed a full native redraw could
not move the card; the final tests exercise the real scroller and distinguish selection from running state.

Seven source checks and page parsing/security checks passed on the current candidate. Owner integrated desktop
16/16 and phone 16/16 check groups passed, with zero page errors or attempted operational writes. The changed
cards were visually inspected in the desktop layout and actual phone viewport positions. `owner_evidence.json`
records the exact source hashes and sanitised outcomes. Independent final release checks remain separately owned. No production or physical-device performance claim is
made by a preview or software-browser check. No operational record changes belong to this release.

Claude's v8.19 remains a separate owned scope. If another page release lands first, rebuild this patch on that live
page and repeat the affected checks; never overwrite another release with these historical candidate bytes.

## Final independent release check

On the frozen candidate above, independent source9/9, focused31/31 and standing269/269 checks pass. Both desktop
and phone sweeps cover22 tabs, seven deep links and Back with zero page or console errors. Native phone programme
navigation and current-record shortcut expectations were corrected in the test harness with original failures
retained privately; the native route, exact reference-set, row count and target-position assertions remain.
The root reviewer inspected final desktop/phone cards. Guarded publication and actual public-host readback remain.

## Upload signature correction

The first upload of `c45062ef` was refused with HTTP400 before any live-page write. The service requires the
case-sensitive text `GC500` within the first5,000 characters; inserting the scoped stylesheet had pushed the
original title beyond that window. The final candidate adds only `GC500 ` to the new metadata content. CSS,
JavaScript, original DATA, visible markup and all native routes are byte-identical to the runtime-tested candidate.
Eight owner source checks, including the service's full-document signature, pass on the corrected bytes.
`owner_evidence.json` retains the exact original runtime-check binding; it is not relabelled as a new test run.
Independent bounded-difference proof and actual public-host smoke bind the correction to that evidence.
