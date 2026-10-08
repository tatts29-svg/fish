# v9.51 fencing programme source reconciliation

Author: Andrew Fisher

Fencing-only component of the parent v9.51 release. **Source frozen for integration; not independently published.** The parent owns `patch_v951.py`, infrastructure source changes, footer/version guards, final integrated browser checks and publication.

## Result

The 9 October upload repeats all programme cells from the 7 October workbook. It still contains eight circular formulas, omitted/doubled totals and copied future completion marks. This component uses explicit task quantity columns and current dated rows, rather than SUMMARY caches or embedded subtotals.

It updates only `DATA.fencing`, its source explanations/evidence fold and two bounded consumers. All `DATA.fence` prices/costs, native dockets, completion, existing installation-plan objects and covered-day quantities remain unchanged. Programme forecasts can change; recorded financial actuals do not change.

- Ten construction/event/demob programme weeks; 380 source task rows retained with cell references and original notes.
- Existing installation-plan overrides win on their covered days. The current workbook appears as their programme comparator. Uncovered days use current workbook task quantities.
- 2026 demob dates become usable plans. The three 2025 DECON WK2 rows, ancillary 2025 sheets, explicitly pending/outside-scope rows and the C1 sheet's historical C4 row remain visible as held evidence.
- A wrong week code on an otherwise correctly dated row is a warning; the explicit date is retained, not silently changed.
- TBC quantities remain identified, not converted into zero. Arithmetic task formulas are safely evaluated; formula caches/subtotal ranges are not used.
- Source completion words are audit counts only. No native completion or “arranged” traffic-control state is inferred.
- Source notes retain gate, access, traffic-control timing, supplier-scope and cost-allocation instructions. The native folded evidence table is read-only and is moved into the existing Planning & commercial detail section by the native fencing layout.
- CON WK6's erroneous Date Completed Excel serial is no longer a quantity. Its legitimate totals remain identical, preserving the reviewed native compound allowance.
- `progressAsOf` uses actual first task dates when earlier than a mapped week label: Sunday 25 October removals are included before the Monday demob label. It does not move tasks/dockets or change the week map.
- Installation completion reports exclude DECON reuse, matching the current Today scope. Demob's 950 m clean-fence movements stay in their own plan.

## Source evidence

Original supplied filename: `1-P003-25003-01-GC600-2026_Coates-Hire-Fencing-Programme-1-.xlsx`.

SHA-256: `836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db`.

The GC600/25003 filename is retained; internal GC500 titles establish its event context. This component does not upload or republish the private original. Source links require an exact matching public hash before appearing.

`fencing_source951.json` is the bounded source transcription. `fencing_zip951.py` reads ZIP/XML directly, avoiding workbook-format rewrites. `fencing_extract951.py ORIGINAL.xlsx OUTPUT.json` reproduces the source only for the reviewed hash. Full private audit, original comparisons and native snapshot are outside the repository under `/workspace/private-workbooks09Oct2026/fencing/`.

## Integration API and file ownership

`fencing951.py` exports:

- `refresh_fencing(original, source=None)`: pure deep-copy transformation of the fencing programme object, with schema/order/source/double-application guards.
- `apply_fencing951(html, path='<candidate>')`: exact replacements through the shared `rep` helper. No footer change. Parent patch must enforce its v9.50→v9.51 chain before/after calling this function.

Owned files are `fencing*`, `tests/test_fencing*` and `evidence/fencing*` only. No STATUS or parent patch edits.

## Validation

- **40 Python source/model/exact-HTML checks** on final v9.48 input pass. They cover explicit quantity columns, circular/invalid expression rejection, source/date/scope guards, retained unknowns, copied-status exclusion, active PDF precedence, no input mutation, unchanged other DATA/native committed literals and duplicate patch refusal.
- **32 isolated native JavaScript consumer checks** pass. They run the page's actual `plannedToDay`, `progressAsOf`, `fenceTypes`, `fenceByWeek` and `cj764Fencing` functions against the changed source with explicit synthetic rates and no network/storage. Sunday 25 October contains 806 m removal; cumulative planned removal is 1,939 m. Installation clean-fence denominator is 8,090.5 m, excluding demob's retained 950 m reuse.
- Native forecast changes are independently reconciled per week/category × explicit fixture rate; the fixture values are **not actual commercial amounts**. Native actual-rate/financial checks belong to final integration, alongside the other workbook changes.
- The notes renderer escapes source text, contains no inputs/selects/buttons/write handlers and retains held rows.
- Final integrated phone source-fold screenshot and runtime/record checks remain assigned to the final candidate, before parent publication.

Run exact HTML tests with:

```sh
PAGE=/absolute/base.html python tests/test_fencing951.py
```

`test_fencing_consumers951.cjs` reads a JSON envelope on stdin with `before`, `after` HTML and an absolute `notes` path. The parent can reuse this without live operations. Sanitised native-model evidence is in `evidence/fencing_consumers951.json`.

No operational writes or publication were performed by this component.
