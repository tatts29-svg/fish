# Charge reconciliation v10.10

Author: Andrew Fisher

The original rate card and the current confirmed site record remain the pricing
authority. Updated Baseplan evidence is used only for the bounded corrections
below. Raw source rows and operational records are not rewritten by this module.

| Correction | Current customer revenue | Full-job customer revenue | Arrived package |
| --- | ---: | ---: | ---: |
| WC09: four approved FWF units replace the older contract quantity of ten | −$540.42 | −$540.42 | Already four; unchanged |
| P65/P67: two unfilled building allocations remain forecast | −$2,852.14 | Unchanged | Not arrived |
| P45: verified contract line 131 replaces an onsite-only card fallback in the ledger | +$1,426.07 | +$1,426.07 | Same hire; no duplicate |
| P03/P04/P51/P46: correct the four building identity allocations together | Unchanged | Unchanged | Same four hires |
| T0005: include the separately dated return and later rehire period for the same physical forklift | Already included; unchanged | Already included; unchanged | +$3,522.60 |
| **Pricing effect** | **−$1,966.49** | **+$885.65** | **+$3,522.60** |

Amounts are AUD excluding GST. Workforce forecasting is tested separately and
must not be attributed to these hire corrections.

“Current customer revenue” above refers to the existing contract-ledger model,
which also carries approved hire lines for equipment still to arrive. It is not
a statement that all contract hire has been delivered, invoiced or recognised
as accounting actuals. The arrived package is the received-equipment billing
view. This bounded release does not reclassify every future contract line.

The original Street Rate Card 2026 row 22 prices each pee panel at $672.1677 for
the full event hire; six total $4,033.01. The separately published daily rate is
$9.5996. Install, level, clean and demob also match their original cells. Their
older year headings remain visible evidence. The module does not invent a
shorter hire period or divide a per-unit price by six. A dedicated full-hire
override is shared by the drawer, Costs, branches and P&L and can be reset to the
card. The existing approved $450 supplier cost per panel remains counted once.

Confirmed ownership now reaches the financial classification as well as the
asset record. The 109 identified Event Portables FWF units at 20 references,
spread across 39 existing contract lines, move $9,817.63 from Hire Revenue
(1005) to Rehire Revenue (1010). Customer totals and supplier costs do not change.
The resolver requires fully received scope, unique physical numbers, one explicit
owner and matching contract quantity. Mixed, incomplete or ambiguous allocations
are not inferred. The two Coates toilet blocks at WC09 remain owned hire.

A recorded branch edit now moves uniquely matched customer hire together with
the reference's existing work and cartage charges in Costs, P&L, October Finance
and the Rehire breakdown. Shared or unlinked source contracts keep their source
branch. Supplier costs remain on their separately documented cost branch. The
source contracts and billed snapshots are preserved.

Five additional source checks remain explicit holds:

- Concert cables: two sets of five; the ten component cables are included under
  the parent bundle. The rate period is unresolved, so no new cable total is
  guessed.
- T0109: asset 1281615 has conflicting forklift type, dates and branch between
  the current site record and the updated contract.
- AA, WC42 and WC81: the current physical units have no exact hire allocation
  in the reviewed source. Their existing card estimates are retained pending a
  check of bulk contract coverage; no duplicate revenue is added.

These are in addition to existing missing transport rates and other unresolved
inputs. A priced subtotal is not a complete invoice and is not certified as
fully priced while those holds remain.

## Verification

- `node test_pricing1010.cjs`: independent source and integration cases.
- `check_propagation1010.cjs`: isolated in-memory edits to full hire, generator
  rate/date, installation source rate, transport, branch and received quantity;
  exact branch transfers, reset and zero operational writes are checked.
- `audit_pricing1010.py`: read-only source arithmetic against the original
  workbook and extracted models, including generator standdown windows,
  service quantities, rates, branches and unauthorized damage-waiver exclusion.
- `reconcile_pricing1010.py`: baseline versus candidate controls covering source
  identity, unchanged site facts, hire, service, transport, branch, P&L and onsite
  package effects. Both extracts must use the same native record version.
  The verified classification change is supplied explicitly as
  `--rehire-classification-change 9817.63`; it is separate from price changes.
- `evidence/independent-pricing-review.json`: independent original-workbook
  verification of the final bounded source projection.

Source file hashes and cells are retained in the projection metadata and the
evidence files. Source workbooks and native snapshots remain private and outside
the repository.
