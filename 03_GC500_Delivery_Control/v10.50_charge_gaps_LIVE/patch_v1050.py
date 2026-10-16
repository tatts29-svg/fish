"""Author: Andrew Fisher. v10.50 - the charge gaps on the GC500, filled from their sources (Andrew, 16 Oct 2026: "add in
the gaps on the gc500 for delivery and pick ups and anything else others should have and is missing, ensure all this
is added correctly").

Every uncharged delivery and pick-up leg on site was researched against the 2026 card, Coates' own contract lines
(Baseplan (5), 16 Oct) and the delivery dockets, and each answer was checked a second time
(gaps_16Oct2026/research). This release puts in the ones with a real source; the ones with no source wait for
Andrew's word.

Charged from their source (customer rates, ex GST):
- Waste tanks WC05 (1), WC20 (2), WC27 (1), WC60 (2): 2026 card Transport "Waste Tank 6m x3m" $500 each way. Tanks go
  on their own dockets and trucks, not with the block. $6,000.
- WC02, WC04, WC06 delivery: card "Portable Toilet FWF" $47.50 a unit. The Coates contract delivery lines that covered
  them (9968955 lines 135-137) were removed in Baseplan (5). $190.
- T0003 hired-in 5 t forklift: card "5.0t Manitou Forklift (Rough Terrain)" $500 each way; no contract line covers it.
  T0109 2.5 t forklift: card "2.5t Forklift" $500 each way; 9987005 line 3 belongs to T0085. $2,000.
- T0025 Trakmat pick-up: Coates contract 9973079 line 2 prices the delivery of the same 20 mats at $103.30 a load; the
  pick-up is that load reversed. $103.30.

Already charged on a Coates contract line (shown as covered; nothing added, revenue unchanged): T0258 and T0266
(9974042 lines 3 and 4, $500 a container each way), T0085 (9987005 line 3), FL03 (9992300 line 7), FL04 (9992300
line 8).

From Andrew's own rules:
- Fire extinguisher only where he recorded one ("if I have not added they don't have them"): a building with no fire
  extinguisher recorded no longer offers or forecasts the line (39 buildings, $2,029.95 of forecast off).
- T0024 is the Coates compound toilet, "no charge" (Andrew, 26 Sep 2026): no event-night servicing ($218.61 off).

A charged leg counts when it has happened: a delivery when the unit is on site, a pick-up when its tick is on. The
record, rates and costs are otherwise unchanged. Footer v10.49 -> v10.50.

    python3 patch_v1050.py path/to/page.html   (on the v10.49 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

ANCHOR = "/* v10.44 - names-everywhere-1044: whatever routine drew it, an agent name never stays on the page. */"
NEW = r'''/* v10.50 - charge-gaps-1050: the GC500 charge gaps filled from their sources (Andrew, 16 Oct 2026). */
(function(W){
 const TANK = "2026 card Transport 'Waste Tank 6m x3m' $500 each way (tanks travel on their own dockets)";
 const FWF = "2026 card Transport 'Portable Toilet FWF' $47.50 a unit; the contract delivery line that covered it (9968955 lines 135-137) was removed in Baseplan (5)";
 const SRC1050 = [
  {ref: 'WC05', item: 'Waste tank', legs: ['delivery', 'pickup'], rate: 500, source: TANK},
  {ref: 'WC20', item: 'Waste tank', legs: ['delivery', 'pickup'], rate: 500, source: TANK},
  {ref: 'WC27', item: 'Waste tank', legs: ['delivery', 'pickup'], rate: 500, source: TANK},
  {ref: 'WC60', item: 'Waste tank', legs: ['delivery', 'pickup'], rate: 500, source: TANK},
  {ref: 'WC02', item: 'FWF', legs: ['delivery'], rate: 47.5, source: FWF},
  {ref: 'WC04', item: 'FWF', legs: ['delivery'], rate: 47.5, source: FWF},
  {ref: 'WC06', item: 'FWF', legs: ['delivery'], rate: 47.5, source: FWF},
  {ref: 'T0003', item: 'Forklift 5T', legs: ['delivery', 'pickup'], rate: 500, source: "2026 card Transport '5.0t Manitou Forklift (Rough Terrain)' $500 each way; no contract transport line covers this hired-in machine"},
  {ref: 'T0109', item: '2.5T Forklift STD', legs: ['delivery', 'pickup'], rate: 500, source: "2026 card Transport '2.5t Forklift' $500 each way; contract 9987005 line 3 belongs to T0085"},
  {ref: 'T0025', item: 'Trakmat', legs: ['pickup'], flat: 103.3, source: "Coates contract 9973079 line 2: $103.30 for the delivery load of these 20 mats; the pick-up is the same load reversed"}];
 const COV1050 = [
  {ref: 'T0258', item: '3.0m Cont', delivery: '9974042|3', pickup: '9974042|4', amount: 500, basis: '$500 a container each way'},
  {ref: 'T0266', item: '6.0m Refrigerator Cont', delivery: '9974042|3', pickup: '9974042|4', amount: 500, basis: '$500 a container each way'},
  {ref: 'T0085', item: '3.5T Forklift Std', delivery: '9987005|3', pickup: '9987005|3', amount: 500, basis: 'Transport Charge 2 x $500'},
  {ref: 'FL03', item: 'Forklift 5T', delivery: '9992300|7', pickup: '9992300|7', amount: 500, basis: 'Transport Charge 5T Forklift 2 x $500'},
  {ref: 'FL04', item: 'Forklift 2.5T', delivery: '9992300|8', pickup: '9992300|8', amount: 500, basis: 'Transport Charge 2.5T Forklift 2 x $500'}];
 const OWN1050 = new Set(['T0024']); /* Andrew, 26 Sep 2026: "toilet is for Coates compound no charge" */
 const cents = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
 W.SRC1050 = SRC1050; W.COV1050 = COV1050;
 /* transport: decided legs priced from their source, contract legs shown as covered - under the 1006 projection and the
    1033 ticks, which then count a leg when it has happened */
 const beforeT = buildingTransportModel831;
 const gT = function(){ return heldMemo('transport1050', () => {
  const M = beforeT();
  const rows = (M.rows || []).map(r => {
   if (r.leg !== 'delivery' && r.leg !== 'pickup') return r;
   const q = Number(r.quantity) || 0;
   const s = SRC1050.find(x => x.ref === r.ref && x.item === r.item && x.legs.includes(r.leg));
   if (s && r.state !== 'excluded' && r.state !== 'included') { const add = s.flat != null ? cents(s.flat) : cents(q * s.rate);
    return Object.assign({}, r, {state: 'estimate', rate: s.flat != null ? s.flat : s.rate, rateSource: s.source, reasons: [], coverage: [], coveredQuantity: 0, uncoveredQuantity: q,
     additional: add, grossEstimate: add, coveredEstimate: 0, heldEstimate: 0, decided1050: true}); }
   const c = COV1050.find(x => x.ref === r.ref && x.item === r.item && x[r.leg]);
   if (c && (r.state === 'held' || r.state === 'covered')) {
    return Object.assign({}, r, {state: 'covered', rate: c.amount, rateSource: 'Coates contract ' + c[r.leg] + ' · ' + c.basis, reasons: [],
     coverage: [{id: c[r.leg], amount: cents(c.amount * q), quantity: q, basis: c.basis + ' (already counted in the contract charges)'}], coveredQuantity: q, uncoveredQuantity: 0,
     additional: 0, grossEstimate: cents(c.amount * q), coveredEstimate: cents(c.amount * q), heldEstimate: 0, covered1050: true}); }
   return r;
  });
  const out = Object.assign({}, M, {rows});
  if (typeof M.held === 'number') out.held = rows.filter(r => r.state === 'held').length;
  if (Array.isArray(M.byBranch)) out.byBranch = M.byBranch.map(b => { const o = Object.assign({}, b); if (typeof b.uncoveredAdditional === 'number') o.uncoveredAdditional = cents(rows.filter(r => r.branch === b.branch).reduce((n, r) => n + (Number(r.additional) || 0), 0)); return o; });
  return out;
 }); };
 gT.charge1050 = true; W.buildingTransportModel831 = gT; try { buildingTransportModel831 = gT; } catch (x) {}
 /* fire extinguisher only where one is recorded on the building */
 const beforeL = labourLinesFor;
 const gL = function(ref, disc, item, key, unit, asset){ const r = beforeL.apply(this, arguments);
  try { if (r && Array.isArray(r.lines) && r.lines.some(x => x.key === 'fire_ext')) { const a = asset || (typeof assetOf === 'function' ? assetOf(ref) : null); const f = a && typeof fire914Of === 'function' ? fire914Of(a) : null;
   if (!(f && f.host)) { const lines = r.lines.filter(x => x.key !== 'fire_ext'); return Object.assign({}, r, {lines, priced: lines.length, fire1050: 'none recorded'}); } } } catch (x) {}
  return r; };
 gL.charge1050 = true; W.labourLinesFor = gL; try { labourLinesFor = gL; } catch (x) {}
 /* own use: no event-night servicing */
 const beforeN = nightService1040;
 const gN = function(a){ if (a && OWN1050.has(a.key)) return null; return beforeN.apply(this, arguments); };
 gN.charge1050 = true; W.nightService1040 = gN; try { nightService1040 = gN; } catch (x) {}
})(window);
''' + ANCHOR

REPLACEMENTS = [
    ('charge gaps filled from their sources', ANCHOR, NEW),
    ('Release footer', "+ ' · v10.49'", "+ ' · v10.50'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'charge-gaps-1050' in html: sys.exit('patch_v1050 refuses a repeat')
    if "+ ' · v10.49'" not in html: sys.exit('patch_v1050: not the v10.49 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1050 applied: charge gaps from their sources; fire extinguisher only where recorded; T0024 own use; footer v10.49 -> v10.50')


if __name__ == '__main__':
    main()
