# Road, travel and sheet follow-up

Author: Andrew Fisher.

Exact source: `8c821da439027bd09b01d4dbc2e84b53c966c397`, compared with `abbb01baf3318d39d970313063c29cdb30990d33`.
`demob816_src.js` SHA-256: `bafd51d93afd3716c4e277eec4a93d56f358d94820f17e485e2a64dd0745d143`.

**16/16 focused CPU checks pass.** The changed road/travel controls and sheet rendering fix the earlier unreachable controls, print exception and invented supplier journey times. No new runtime defect was found in these changed paths. This is bounded integration feedback on a moving draft, not a release or legal approval.

## Fixed paths

- **Run-sheet exception:** `demob816_src.js:625` and `:634` use per-run travel instead of removed `A.run`. Ordinary branch and Coates toilet sheets render successfully.
- **Oversize input and output:** the checkbox and warnings now render at `:513–520`; the actual `:591` handler saves and clears the flag. Both screen and sheet (`:624`) preserve supplied convoy/permit warnings. An unflagged load offers the control without declaring the load oversize.
- **Travel editing:** `:522–526` renders each run's current figure and planning label; the actual `:588–590` handler saves 120 minutes, redraws, keeps the Coates run independent, and preserves a blank entry as explicitly unconfirmed. The branch sheet shows unconfirmed travel without midnight movement times.
- **Supplier rendering:** supplier screen and sheet omit Kingston movements and fabricated time cells. The sheet at `:616–622` retains recorded emptying name and formatted timestamp.

The fixture invokes the exact source's `wireDemob816` with synthetic selector objects, then calls the installed change handlers. It also executes the exact renderers with synthetic single, Coates, flagged and supplier loads. Warning text is supplied on the fixture load: these checks establish its visibility, not a new validation of the unchanged road calculation or planning algorithm. They do not exercise browser layout, capability enforcement in a real DOM, the print engine, or the print-selector dispatcher; the latter and quantity/capacity tests are covered separately by the parent review.

## Remaining, distinguished from the fixed paths

1. **Prior saved travel override migration is still absent.** The editor is restored, but unchanged `travel816()` at `demob816_src.js:339–345` reads only `gc500.demob816.travel`, then the planning fallback. It does not consult the earlier `gc500.demob816.assume.run` value. The prior `abbb01b` CPU reproduction (saved 120 minutes becoming the 70-minute planning figure) therefore remains relevant for a browser carrying that earlier draft state. This does not establish that any live user's browser contains that state. The unchanged function was compared, not needlessly retested.

2. **The displayed road-window claim still exceeds the available excerpt.** New screen wording at `demob816_src.js:519` and sheet wording at `:624` say “on Gold Coast roads 09:00–16:00 only.” The owner-supplied text in `access_rules_qld.md:40–41` quotes business-day exclusions of 07:00–09:00 and 16:00–18:00; those exclusions alone do not establish a general 09:00–16:00-only legal rule or permission for every route/load within that window. Unchanged `ovCheck816()` at `demob816_src.js:354–358` also subtracts the entire Kingston journey figure from 16:00, while the note at `access_rules_qld.md:25–26` describes travel to the council boundary. Label this as a conservative project planning calculation or supply the additional applicable conditions and boundary-specific travel input. This observation does not recommend loosening the project manager's existing no-travel instruction.

The PDF was **not read**. The new text added at `f2bde64`, now `access_rules_qld.md:32–58`, is an owner-provided excerpt/transcription, explicitly states that the original PDF is not committed and gives no source URL (`:34–36`, `:50–51`). It improves traceability to claimed guide sections but does not independently establish transcription accuracy, complete conditions, route applicability or current guide version. The earlier public discovery GET returned 403, recorded in `followup_24cb316_roads.md`; no new network requests were made in this pass.

## Reproduce

Requires Node.js and a file containing the exact frozen source; no baseline HTML, package installation, browser or network is needed. The fixture rejects any other source SHA-256. From the repository root:

```sh
git show 8c821da439027bd09b01d4dbc2e84b53c966c397:03_GC500_Delivery_Control/v8.16_reference_and_demob_DRAFT/demob816_src.js > /tmp/followup_8c821da_roads_source.js
node 03_GC500_Delivery_Control/review_v816_release/evidence/followup_8c821da_roads.cjs /tmp/followup_8c821da_roads_source.js
```

Checked-in evidence: `followup_8c821da_roads.cjs` (portable, synthetic-only fixture) and `followup_8c821da_roads.json` (16 named successful checks). All writes in this subreview are these three new evidence files; previous reports and implementation files were preserved. No browser, network, live records, publication or commits.
