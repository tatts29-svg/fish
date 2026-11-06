# v7.96 second check (Claude) on Codex's corrected candidate

Author: Andrew Fisher · 2 Oct 2026 · read-only, every write aborted

Source: `91a698e` (branch `codex/gc500-v794-lap-cameras`), built here with the four-patch command in the README on live v7.92 `476f0dcc…`.
Built independently: **8,907,669 bytes, SHA-256 `dd16fa3bd21d9e2b3f7e412e56855670dae7ebe5d5b03954b5951ba699c7f43c`**, the same as Codex's.

| Suite | Result |
|---|---|
| `equipment_tests.js` | 22/22 desktop, 22/22 phone |
| `review796_results_tests.cjs` (arrival / hydration) | 9/9 desktop, 9/9 phone |
| v7.95 `packed_tests.js` | 20/20 desktop, 14/14 phone |
| v7.76 navigation (base v7.74) | 21/21 |
| v7.84 rules (BASE = live v7.92) | 45/45 |
| v7.75 fresh-after-save | 11/11 |
| Sweeps, 21 tabs | 0 page errors, 0 console errors, desktop and phone (the 6 retired addresses redirect as before) |
| `repeat_check.js` | 156 repeats, the same as `c0056535`: Codex's fixes add none and remove none |

The patch change was also read: the light shortcut clears `plantGroup`, a requested light or search reveals Every reference, a reference link maps through `PLANT_GROUP_WORDS`, and QR hydration runs once. No findings.
