# GC500 presentation and flow audit

Author: Andrew Fisher

Read-only baseline: live v9.93 exact local source `build/GC500_v9.93-final/GC500_Delivery_Control_hosted.html`, SHA256 `3da4e17980eead5cbf886dbbfab54f60c18aacd48405d92822869a7ce3637205`.

Desktop 1440 × 960 and phone 390 × 844. Each pass visited all 22 declared routes, resolving to 14 unique pages. Top, middle and bottom screenshots captured for each unique page (84 screenshots total). Both passes: zero JavaScript errors, zero console errors, zero blocked operational writes, zero document horizontal overflow. Native shared records read from the service. Google tile session and tiles use explicit read-only test fixtures; the project's map and application are native. This audit does not validate financial/quantity correctness, prove every nested editor works, or substitute for the separate navigation/overlay audit.

## Confirmed defects and direct cleanups

1. **Equipment heading unreadable — desktop and phone.** `.refresh-equipment .eqhead` declares a dark background with white text, but the global `.card::after` white face overlays it. Equipment is effectively invisible; the subtitle is pale grey on white. Restore the existing intended dark header face/pseudo layers without changing layout. Source lines7422–7424 and5442. Evidence: `desktop/plant-top.png`, `phone/plant-top.png`.
2. **Change deliveries uses the obsolete Timeline name.** `[data-chtl]` reads “Open on the Timeline”; the destination is now Build. Label-only correction to “Open in Build”. Source line35314. Evidence: `desktop/change-top.png`, `phone/change-top.png`.
3. **Daily staff repeated on Build.** The selected approved day card already lists that day's names and count; a second expanded staff block repeats them immediately below the day strip. Preserve one clear available-staff source and existing edit access, rather than duplicate names. Evidence: `desktop/timeline-scroll.png`.
4. **Demob staff styling inconsistent.** The same daily staff component is white and137px tall on desktop, while Today uses the approved compact dark row70px tall. Reuse the established approved colours and compact presentation without changing names/counts/dates. Evidence: `desktop/demob-top.png`, `phone/demob-top.png`.
5. **Coates Way exposes implementation metadata.** Directly beside/below Open the machine: build version, old build hash, file count and megabytes. This is not operational information and belongs in the existing More info. Target `#cwmachine .cwmact > #cwMachineState.cwmst`; existing destination `#cwmachine > details.sfold > .sfoldbody`. Preserve loading/failure/unavailable state visibility; only move the ready technical string. Source machineCardHtml24255–24273, async ready message24301, foldStories53745. Evidence: `desktop/coatesway-scroll.png`, `phone/coatesway-top.png`.

## Page coverage and design improvements for a preview

| Page | Result and recommendation |
|---|---|
| Today | Approved compact controls and roster work. Existing category groups and contacts remain legible. Keep native animated hero; routine controls no longer dominate desktop. |
| Build | Approved weather day cards and load lights intact. Remove repeated daily staff above. Phone day documents/nav occupy~350px, first day card starts aroundy690. A later preview can compact the tool area and present two desktop load cards per row where content fits. |
| Equipment | Fix invisible heading. Default all-reference list is~9,051px desktop, total page10,645px. Filter/search/section jumps would make historic detail easier to reach. |
| Sub-hired | Company selection and date-based remaining-delivery groups are clear. Full-width small rows leave desktop whitespace; a later compact table/card preview may help. Keep supplier status and numbers intact. |
| Demob | Shared staff theme cleanup above. Day and branch controls legible. Native phone pickup entries are tall but usable; preview natural-height packing without removing readiness warnings. |
| Map explorer | Native search/mode/zoom controls visible on both sizes. Phone instruction bubble covers part of lower plan; a future help disclosure could reduce overlap without hiding discovery guidance. Tile rendering beyond fixtures was not validated here. |
| Documents | Categories and search clear. Phone category cards require scrolling before recent documents, but no clipping. Keep current component styles. |
| Fencing | Largest page:18,087px desktop /26,842px phone. Introductory map link and two More info lines precede page title; title appears atphoney488. Preview title-first navigation, forecast/recorded summary together, searchable/recent signed papers, supporting sources folded. No quantities changed. |
| Pre-starts | Clear crew separation, SWMS and upcoming sheets. Duplicated public-view explanation and long prefill prose delay the first usable sheet; fold prose into existing instructions. Past file history could be a dated archive. |
| Coates Way | Hide ready implementation metadata under existing More info. Desktop hero card is1,004px high and puts explicit Open machine button below fold (image itself is clickable). Later preview can bound the poster height. |
| Costs & P&L | Desktop table and phone stacked figures are legible. Forecast and onsite charge subtotal kept separate. Several different More info treatments make lower navigation inconsistent; unify only in a reviewed preview. Financial values not audited here. |
| Change deliveries | Correct Build wording. Phone header stacks four full-width shortcuts before any deliveries. Grouping secondary shortcuts is a later preview; retain read-only and edit rights. |
| Questions | Counts visible, but header has two generic More info controls. Consolidate supporting context in preview while retaining all answers/history. No question closed on assumption. |
| About | Very long default text/table reference page:10,631px desktop /13,985px phone. Group contacts, usage reference and source/history under named section navigation or folds. Historical detailed tables require internal horizontal scrolling; no whole-page overflow. |

## Navigation scope

The persistent site navigation and history back affordance remain visible across visited noninitial pages. This pass did not click all nested overlays. Close, Back, Escape, focus return and browser-history behaviour are covered by the root agent's separate navigation audit.


## Corrections added during the audit

Andrew reported vague generator identities and an unsupported fencing-delay conclusion. The release now includes source-backed Concert unit/docket display joins and GN13's existing approved map-symbol destination. Exact Concert placement remains an explicit source gap. Fencing comparisons retain their arithmetic and forecast values, while display labels distinguish docket differences from actual crew progress; Andrew's dated site confirmation is retained in Coates Way. These are scoped evidence corrections, not a new financial-data audit.
