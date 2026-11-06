# v11.43 — The Showcase opens quicker on a device that was slow building the 3D circuit

Author: Andrew Fisher. Built on live v11.42 `5537771a…`. LIVE 23 Oct 2026 09:09 AEST, page `483375ed…` (full hash in
STATUS.md).

## Andrew's word, 23 Oct 2026

- "Also showcase is lagging this morning its freezing."
- To the slow-device opening put to him: "What ever makes it quicker please."

## What was measured

On live v11.41 with the v11.20 steadiness test at 4× CPU: the dialog paints in 1.9 s, then the 3D base circuit takes
8.6 s on the main thread (the static detail already skipped by the v11.20 budget). That build is the freeze.

## What changes

`steady1143.js`, appended after the v11.20 module:
- The device's base-circuit build time is kept in its local storage (`gc500.show3d.mount`), measured outside the v11.20
  wrapper so it sees the whole mount.
- When that time was over the v11.20 budget (1.5 s), the next opening on that device starts on the flat circuit at once,
  with a **"3D circuit · N s here"** button beside the backdrop choice. The button brings the 3D back for that opening
  (built a beat after the paint, as v11.20 does). The button hides when the 3D is on.
- A device within budget keeps the 3D circuit at night as the never-chosen default (Andrew, 22 Oct: "I want the 3d race
  track as default"). A chosen 3D look (day, night) is kept as the choice and returns with the button; choosing a 3D look
  from the backdrop list during a flat opening is honoured at once.
- Closing the Showcase clears the "3D now" for the next opening. Nothing is written to the record.

## Files

- `patch_v1143.py` — requires live v11.42 by SHA-256; appends the module before the last `</body>`; footer.
- `tests/test_v1143.cjs` — desktop at 4× CPU and phone: a never-chosen device opens on 3D and its build time is kept;
  when over budget the next opening is flat with the button, which returns the 3D (deferred); a remembered fast build
  keeps 3D with no button; a chosen 3D day on a 9 s device opens flat and the button returns the chosen day with the
  choice kept; choosing 3D from the list during a flat opening is honoured; record unchanged, no errors, no writes.

## Checks

- Dry build on a scratch copy of live v11.42, scrubbed as the build is, then the real build from live: byte for byte the
  same (`483375ed…`).
- `tests/test_v1143.cjs`: 13/13 desktop and phone on the build; 13/13 desktop and phone on live.
- Regression on the build: v11.20 (steadiness) 15/15. Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console,
  0 writes blocked.
