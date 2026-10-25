# Main servicing lock percentage — DRAFT, not live

Author: Andrew Fisher

Andrew: “I want a lock percentage done on the main servucing screen too pleaee.” The main servicing rings and area chips omitted `lockup` from their job list although the task totals and lock icons already existed. Include it in that same list. The existing selected-night plans, unit weights, deduplicated state, undo/void handling and rounded-down percentage stay unchanged. Shows “Locked (doors locked)”, percentage, done/total and remaining count. Nights or areas without lock jobs do not gain a misleading percentage.

Native phone inspection also found a real contrast defect: the generic card pseudo-face paints white over the servicing panel’s dark gradient. Scoped screen-only styles make that face inherit the existing dark background, retaining its cut corner and edge, and prevent generic header “lockup” styles from placing or hiding the new lock indicators. Print and other cards are untouched.

Only the main job list, scoped screen CSS and release footer change. Crew card, tracker configuration, model, declarations, report, QR, server, operational record and all financial code remain byte-identical to v12.22. Claude’s Costs release is preserved.

Final base: independently fetched v12.22 `d286f3a53f56574a016cb8505d8164b7631b70ec9cc038f9ebe8cb3591afa7e4` (15,387,177 bytes), archive source `883cd964`. Candidate: `8112a63d10c5b6c88206a539af5a59dc1037176e414a95f20d253b16f844e257` (15,387,611 bytes).

Shared checker passes (200 scripts), final synthetic model 24/24 and exact preservation 13/13 pass. Final native controller checks pass: phone 13/13 and desktop/tablet 15/15. All three viewport screenshots were inspected independently by Codex and a Codex review agent; lock placement, readable text and header-search visibility pass. Both required full sweeps are running. Not READY TO UPLOAD. Browser ticks are intercepted synthetic events; all live calls are read-only. Private snapshots/screenshots stay outside the repo. Codex implements/tests/publishes; a Codex review agent independently checked the model and pseudo-face fix. No Claude review of this patch claimed.
