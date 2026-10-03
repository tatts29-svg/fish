# Road-rule integration review

Author: Andrew Fisher.

Exact source: `abbb01baf3318d39d970313063c29cdb30990d33`.
Compared with `24cb316b9a4440356cd438e0fb83738183d02569`.
`demob816_src.js` SHA-256: `aca9b7089b42d62902c1235f25f83be9bf32a573c62e359b2625f6d9da47df31`.

Read-only source diff and synthetic CPU execution of that exact source. No browser, network, live record changes, implementation edits, publication or commits. Original Queensland Access Conditions Guide PDF remains inaccessible and was not read. The earlier provenance/GET evidence is in `followup_24cb316_roads.md`; this pass makes no new claim about legal accuracy or guide currency.

## Findings

1. **P1 — Run-sheet printing now throws for every nonempty load list.** `demob816_src.js:302–311` removes `run` from `assume816()`, but `sheet816()` still reads `A.run.lab` and `A.run.v` at **line 573**. `printDay816()` calls that renderer at line 584 before reaching `window.print()`. CPU execution of the exact source, with a minimal ordinary load and otherwise valid globals, returns `TypeError: Cannot read properties of undefined (reading 'lab')`. Use the new per-run travel model in the sheet, including a separate supplier/unknown-time rendering; do not leave the old assumption dereference.

2. **P1 — Oversize checks cannot be set through the page, and their warnings are never shown.** The new `ovFlag816()` setter exists at lines **352–353**, but its sole call site in the entire frozen release folder is the read at line **401**. No input or event handler sets the flag. `L.ovc` is populated at lines 401–402 but neither renderer reads it. Meanwhile large loads change from `kind: 'oversize'` to `kind: 'single'` at line **370**, while the old permit warnings still require `L.kind === 'oversize'` at lines **491** and **570**. Thus the previous permit warning disappears and the replacement branch-controlled warning path is unreachable. Even a synthetic load explicitly supplied with `ov: true` and an `ovc.flags` convoy warning renders no oversize or convoy warning in `trucksHtml816()`. Wire the branch control, render its state and warnings, and preserve an explicit permit-review status while classification is unknown.

3. **P2 — The travel-time migration removes the editor and ignores saved overrides.** `travel816()` reads a new local-storage key at lines **339–345**, but no code writes that key and no form input is bound to it. `assumeHtml816()` at lines **496–501** renders only the keys left in `assume816()`: `between`, `stop`, `unit`, `unload`, `perLoad`. The prior `gc500.demob816.assume.run` override is consequently ignored and cannot be re-entered through the page, contrary to the per-run editable-time comment at lines 334–338. A prior manually supplied travel figure silently falls back to `run782()`. Add the per-run editor and preserve/migrate existing explicit overrides before claiming they are editable.

4. **P2 — Unset supplier times are displayed as midnight truck movements.** Supplier collections deliberately receive null departure, arrival, collection and return times at line **403**. The unchanged renderer passes them to `clock816()` at lines **492–493**, which converts null to `00:00`. CPU rendering gives: `Sub-hire · truck 1 · load 1 of 1 Leave Kingston 00:00 · on site 00:00 · leave site 00:00 · back 00:00`. This contradicts the new supplier model's “no truck plan, no times” comment at line 366 and creates invented operational times. Render the supplier collection list without Kingston movements and show unset Coates travel times as unconfirmed.

## Road-rule scope and source limits

The old item-type classification now chooses a separate single-item load; it no longer directly declares that load oversize. That addresses part of the previous documentation mismatch in principle, but the new explicit flag is not connected to the UI or output yet (finding 2).

The calculated `latest` at line 355 subtracts the full Kingston/circuit travel figure from 16:00. There is no separately supplied time to the Gold Coast council boundary, route geometry, vehicle dimension, permit or exception input. Do not describe this calculation as a verified permit-specific latest departure from the guide. It is a planning calculation using the current travel estimate.

`ovCheck816(360, 70)` flags 06:00 as `on the road before 09:00 - Gold Coast peak`, while the adjacent source comment names the peak as 07:00–09:00. This is an internal overstatement of the named peak restriction, not proof that 06:00 is legally permitted: the original night rules and permit conditions have not been checked. Separate project planning windows from legal restrictions and do not infer a road-wide 09:00–16:00 entitlement from these two peak exclusions.

The new `OVSRC816` string cites guide sections but is not used in rendered output. It does not supply a current source URL, original PDF page, route determination or completed permit review. The existing project-manager no-travel windows still apply to the scheduling loops for all Coates runs; this review does not recommend loosening a project instruction merely because a quoted legal rule may have a narrower scope.

## CPU evidence

The exact Git blob was loaded into a Node `vm` using `git show abbb01b:03_GC500_Delivery_Control/v8.16_reference_and_demob_DRAFT/demob816_src.js`; no source was edited. Globals were synthetic (`DATA.brand`, HTML formatting stubs and in-memory local storage). A minimal load had `kind: 'single'`, an empty stop list, numeric journey times, `ov: true` and an explicit convoy warning.

Observed results:

```json
{
  "sheetResult": "TypeError: Cannot read properties of undefined (reading 'lab')",
  "flaggedLoadVisibleWarning": false,
  "assumptionKeys": ["between", "stop", "unit", "unload", "perLoad"],
  "oldSavedRunMinutes": 120,
  "newBranchRunMinutesWithRun782Returning70": 70,
  "htmlHasTravelInput": false,
  "supplierTimeText": "Leave Kingston 00:00 · on site 00:00 · leave site 00:00 · back 00:00",
  "check0600": {
    "latest": 890,
    "flags": ["on the road before 09:00 - Gold Coast peak"]
  }
}
```

These are integration findings on a moving draft, not a release-readiness assessment. Original-guide verification remains pending.
