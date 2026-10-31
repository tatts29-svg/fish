# Frozen owner handover review

Author: Andrew Fisher · 3 Oct 2026 AEST.

**No publication blocker found in this handover review.** Read source `8c821da`, evidence `139d917` and READY board `48b346a` directly from Git. The three implementation files have identical hashes across those commits and match the reviewed candidate `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770` (9,118,422 bytes). The frozen test file hashes to `066949c7f0995b3de4274615e1390a1568bbccd23924789c3ca3e4f0417fb4b6`.

| Committed owner run | Passed | Failed | Log SHA-256 |
| --- | ---: | ---: | --- |
| Desktop | 58 | 0 | `baa258e8f397202d36e54e6bd3c9368a45beb48e81efd430fde934d7d01c6845` |
| Phone | 58 | 0 | `960b535ae58ac258455e706768ccdc25ade220f1086cc389eb1c4734a996c467` |
| Paper | 9 | 0 | `ce88ee200cfc450113db8d53af1ee3d6248728964b236bd67d8f8b7c510b3d05` |

All three logs end `ALL PASSED`; the total is 125 assertions across these runs. The owner README explicitly assigns them to this candidate. Individual suite logs do not embed a page hash; both candidate layout JSON files do embed its exact hash. The separate independent browser evidence also records this runtime hash. These provenance distinctions are retained rather than implying an embedded hash exists in each owner log.

The missing-SWMS assertion is unchanged from `24cb316`: it still requires the chosen missing document's exact row identity, Documents route, expected query, keyboard focus and visibility, with no file opened. Its fixture forces `DOCS.at = 0`, triggers the actual header selection and waits on native `DOCS.busy`/ready state. It does not replace `docsRefresh` or `docsRedraw`; both passing logs contain three render-trace entries. The formerly failing Fencing-week and practice-edit checks also pass on both devices. Paper checks retain complete file/title coverage, equivalent button and native printing, screen-state restoration and the page-count limit (22 pages to 12).

The recorded median opening times are **desktop 434→470 ms** and **phone 457→448 ms**. Desktop is about 8.3% slower, within the existing 10% gate; this is not an across-device speed improvement. Candidate layout reports no horizontal overflow or errors. Desktop default/Packs/Drawings empty-space measurements remain **17.8% / 21.7% / 22.2%**, above the 15% target and explicitly recorded as a follow-up. Phone measured views range from **5.1% to 7.7%**. No claim that every layout target passed is made.

This review opened no browser and changed no implementation, operational record, earlier evidence or release status. Guarded publication and its live verification remain separately recorded by the release owner.
