# VMS board regos, 18 Oct 2026: runner built, NOT applied

Author: Andrew Fisher · written by Claude.

Andrew, 18 Oct: "Please add rego. For all of these ... THIS NEED TO BE FIXED and updated" (VMS1 1211354 EX0017,
VMS2 1211370 ES3206, VMS3 1271129 536UOO, VMS4 1191877 EM6306, VMS6 1211359 ER9247, VMS7 1182999 410UFQ,
VMS8 1211383 ER9381, VMS9 1211404 TF15JR).

`vms.cjs` is the p06 record runner with one extra op, `vms_rego`, which goes through the page's own `vms913Save(key, ..., {rego:true})`.
`vms_spec.json` lists the eight regos. The dry run (read-only, every write aborted) on live v10.71, record 9728, refused
all eight with "Nothing changed": Codex had already saved the same eight regos at 09:22 UTC under the v10.72 claim. It was
never run with `--apply`, and this folder wrote nothing.

Read-back of `/api/state` (version 9728) confirms all eight regos on keys 1211354, 1211370, 1271129, 1191877, 1211359,
1182999, 1211383 and VMS09. The board names VMS1–VMS8 are Codex's v10.72 page change.

## Applied: VMS7 (1182999) ticked installed, 18 Oct 2026 19:59 AEST

Andrew, 18 Oct: "I want them all tidked installed". On the record before, every VMS install tick was already on except
T0001 unit 1182999 (VMS7), which he had taken off on 23 Sep. His word today is later and wins (AGENTS.md: when his own
entries disagree, his later word wins). The other boards: T0001's other six units and the rest, T0103 (VMS9/VMS10) and T0128
(VMS11/12) were already ticked. T0158 (VMS13–17) is "not on site" (in for Mon 19 Oct), so it was left alone.

`node vms.cjs --apply --spec vms_install_spec.json` (op `labour_on`, through the page's own `setLabour`, by Andrew Fisher),
with backup `backup_state_20261018T095944Z.json`. Two documents written, the tick and its stamp; record 9728 → 9730;
every other document unchanged in value; VERIFIED on the service (`report_20261018T095944Z.json`).
