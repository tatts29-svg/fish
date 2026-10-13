Author: Andrew Fisher

v10.10 workforce correction. Integration helper: `patch_workforce1010.apply(html)`.

The source roster held three “Fencing crew ×6” shifts, but the costing model ignored `crew_count` and treated the group as one employee. Its recorded $88.49 pay field is the customer selling rate, not the quoted supplier race-day cost.

The shared workforce read now replaces that aggregate with Fencing 1 through Fencing 6. The original documents remain unchanged and reviewable in More info; they are excluded from the six-worker cost total. Individual changes use existing native cost setters and document identities. Individual entries and tombstones take precedence on every read. No operational records are written by this patch or its tests.

Supplier forecast uses Advanced Temporary Fencing quotation 27172, dated 04 Jun 2026, page 2: race-day labour $142 per person/hour, minimum four hours. Explicit recorded breaks are honoured; the employee default break and overtime multipliers do not apply to this quoted contractor rate. The supplied PDF was read directly; private original and extraction remain outside Git. The quote also lists two $200 team-leader daily charges; those are not allocated or invented as an event charge here.

On native version 5796, Friday 23 October has 06:00–18:00 recorded as a planned shift. Each of six workers forecasts $1,704; total $10,224. Saturday and Sunday hours remain unknown. Customer scope remains 195 person-hours at $88.49 = $17,255.55; splitting its visible rows adds no Revenue. Actual work or accounting posting is not inferred from a forecast.

Same-date supplier labour in the green book, labour-bearing paid dockets, or explicit Advanced/fencing labour expense lines holds the additional roster forecast for allocation review, preventing an automatic duplicate. Existing historical fencing costs remain untouched. Kyle Gover's saved night confirmation for 23–25 October is visible; only the obsolete, completely empty unnamed night placeholder is replaced. His unknown hours remain unknown.

Checks: 33 pure-model cases; focused read-only phone/desktop browser checks cover six native-editable workers, quoted costs, unchanged customer Revenue, Kyle's night label, edit/remove isolation, native document identity and unchanged native records. Root owns combined build, full navigation sweeps and publication.
