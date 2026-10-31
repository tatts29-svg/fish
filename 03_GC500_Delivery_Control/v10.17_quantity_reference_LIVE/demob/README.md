Author: Andrew Fisher

This component corrects duplicate Demob pickups and collection quantities after a confirmed VMS move. It is a component for the root-owned v10.17 release, not an independently publishable page.

On live v10.16, FL01/T0003 and FL02/T0004 each planned separate pickups for the same source-linked forklift. The relocation reference T0159 scheduled another five VMS boards. T0001 still advertised eight boards for collection after one board moved to T0103, where it was also included.

`patch_demob1017.apply(html)` uses the existing canonical reference resolver before constructing the Demob day, truck and collection models. Cancelled, relocated, follow-up and moved-away source references are excluded from pickup scope; their source history and search records remain. Current references with updated locations remain collectable. VMS quantities use the existing reviewed current-assignment projection. Original receipt quantities, physical records, source schedules and financial lines are unchanged. Current VMS collection quantities flow to the visible row and printed driver sheet. Collection subtraction remains in its existing consumer and is not applied twice here.

Component validation on the exact v10.16 public base `3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c`:

- 15 pure checks pass.
- 23 focused browser checks pass, including rendered rows, truck stops, driver-sheet HTML, current and pending equipment, later replacement and partial-receipt fixtures.
- Native version 6075, original DATA and contract rows remain byte-equivalent; zero browser errors or operational writes.
- Phone row inspected: T0001 clearly shows VMS × 7.

Private evidence: `/workspace/private-gc500-recheck14Oct2026/quantities/demob-checks/`. Run the browser check with `PAGE` and private `OUT_DIR`. Root must run combined financial, navigation and release checks before publication. The separately authorised WC09 scope change is not part of this component.
