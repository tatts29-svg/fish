# Road-rule source and implementation review

Author: Andrew Fisher.

Reviewed source: `24cb316b9a4440356cd438e0fb83738183d02569`.
Road-note introduction: `762b99babd183232e1d140464e27ef54b93aa463`.
Review performed 3 Oct 2026. Read-only source review and public HTTP GETs; no browser, record writes, implementation changes, publication or commits.

## Result and scope

The road-rule commit adds **only** `v8.16_reference_and_demob_DRAFT/access_rules_qld.md` (37 lines). It does not implement a new road-rule gate or change the Demob scheduler. The unchanged planning restrictions are attributed to the project manager in the README, not validated here as legal restrictions from the guide.

**Original guide not read.** The available file is the owner's research summary. Its assertions must not be described as independently verified against the original PDF. No original PDF, its supplied filename, attachment identifier, accessible source location or direct URL was found in the frozen draft or the local filename search. `research.md` supplies no guide link.

## Available source pointer

`access_rules_qld.md:3` identifies “Queensland Access Conditions Guide, Version 6.0, December 2023 (TMR), sent by Andrew on 3 Oct 2026”. This is the author's provenance statement, not an independently checked PDF identity. The summary names these sections and tables:

- Scope: sections 1 and 4.
- Peak hours: section 11.2, Table 3.
- Wide/long weekend and public-holiday travel: section 11.3, Table 4.
- Convoys: section 9; speed: section 5, Table 1.
- Permits: sections 7 and 12.2, Table 12.
- Night travel: section 13, Tables 13–14.
- Pre-trip checks: sections 10.2 and 10.4.
- Crane/SPV exception: Schedule 1, Table 15.

There is no independently verified source URL, version date or PDF page citation to provide. The summary itself calls for a currency check at line 7 and says its pilot/escort tables were not extracted at lines 34–35. This review did not verify current permit conditions, vehicle dimensions, route applicability, escort counts, exemptions or holiday rules.

## Actionable documentation/runtime mismatches

1. **P2 — Describe the note as research, not implemented enforcement.** `access_rules_qld.md:9` says “Rules the Demob tab applies to a load flagged oversize”. The only new artifact is that note. The actual scheduler does not implement the listed convoy spacing, speed, permit thresholds or night-travel tests. `demob816_src.js:323–324` applies the existing peak-window check to every load; `demob816_src.js:443` and `:512` state those project planning windows without an oversize-only qualification. The oversize-specific output at `:509` remains “check permit / travel window”. Keep the PM's planning constraint distinct from the guide's claimed legal scope; this finding does not imply normal trucks must be exempted from a stricter project instruction.

2. **P2 — Correct the stated source of the oversize classification.** `access_rules_qld.md:5` says the page never guesses which loads are oversize; `:37` says the branch flags them per load. In this frozen source `demob816_src.js:204` derives `big` from `refKind(a) === 'building'` or the item-type regex, and `:316` assigns `kind: 'oversize'` from that derived flag. No branch-confirmed load classification is read on this path. The note should describe this as a planning classification, or implementation needs an explicit branch/vehicle/load input before that claim is made.

3. **P2 — Preserve the distinction between editable assumptions and supplied travel time.** `access_rules_qld.md:25–26` says the run sheet shows latest departure based on time to the council boundary and that travel time “is not assumed”. In fact `demob816_src.js:278–286` starts with the existing Kingston-run figure, with a 70-minute fallback and a 10-minute precinct fallback, then accepts local overrides. The sheet at `:507` prints the calculated planned departure and return times; this path has no separate measured time to the council boundary or labelled latest-departure field. The existing UI labels its values as planning assumptions. Align the note with that behaviour.

## Statements still requiring the original

The numeric limits and exceptions at `access_rules_qld.md:13–20` remain unverified, not established errors. Do not use this review to attest that they are complete or current.

The road-wide “only ... 09:00 to 16:00” conclusion at `:24` is also not independently established. Site hours and the two listed peak exclusions alone do not establish the legal permissibility of every other travel period. The original night rules, vehicle category, dimensions, permit and actual route must be read before turning that sentence into a legal route window. The source currently permits planning a pre-07:00 inbound road leg to reach site at 07:00 (`demob816_src.js:323–325`), further distinguishing its behaviour from the summary's wording.

Required handover: supply Andrew's original PDF or its exact accessible attachment/source location, identify the version and any newer revision, then read the cited tables including image-only tables. Until then the source review state is **summary read; original inaccessible; rules not independently verified**.

## Public GET attempts

The cloud-environment runtime skill and networking reference were read before network work. The runtime reported an enforced unrestricted HTTP policy; inherited proxy and TLS verification were retained. No credentials were used for these public reads.

- `https://www.tmr.qld.gov.au/business-industry/Heavy-vehicles/Heavy-vehicle-guidelines-and-class-permits.aspx` — HTTP **403 Forbidden**. This was an attempted official discovery page, not a verified PDF pointer. No bypass attempted.
- `https://www.google.com/search?q=Queensland+Access+Conditions+Guide+Version+6.0+December+2023+pdf` — HTTP 200, no usable guide link returned.
- `https://www.google.com/search?q=%22Queensland%20Access%20Conditions%20Guide%22%20pdf&gbv=1` — HTTP 200, JavaScript/challenge response, no usable guide link.
- `https://html.duckduckgo.com/html/?q=%22Queensland%20Access%20Conditions%20Guide%22%20pdf` — HTTP 202, challenge response, no usable guide link.
- Bing RSS queries for the full title, the title plus version, and `site:tmr.qld.gov.au "Access Conditions"` returned HTTP 200 but irrelevant results. Representative exact URL: `https://www.bing.com/search?format=rss&q=%22Queensland%20Access%20Conditions%20Guide%22`. No result was treated as source evidence.

No original PDF was downloaded or archived.

## Frozen artifact hashes

| Artifact | SHA-256 |
|---|---|
| `access_rules_qld.md` | `74578e14a8de6105fabd78d7e78c423e42b8db7d4010dfeae726d4571850f819` |
| `demob816_src.js` | `201147305c2e760f7ccecd6f9c09a3c7b3651931f0c82a5a7dfbd5584249fcea` |

This is a bounded documentation/source audit, not road-access approval or release readiness.
