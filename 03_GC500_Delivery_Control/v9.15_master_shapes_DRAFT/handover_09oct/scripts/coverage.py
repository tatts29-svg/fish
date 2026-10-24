# Author: Andrew Fisher. Writes coverage.md from inventory.json.
import json, collections
SC = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/shapes_all/'
d = json.load(open(SC + 'inventory.json'))
U = d['units']
L = []
w = L.append
w('# Coverage: every physical unit against the v9.15 master shapes\n')
w('Author: Andrew Fisher · built 9 Oct 2026 · read only (live page v9.18 DATA, record v4581, v9.15 shapes_v915.json, 2 Oct master D001-26003-03)\n')
units = [r for r in U if r['unit_index'] is not None]
runs = [r for r in U if r['unit_index'] is None]
st = collections.Counter(r['status'] for r in units)
active = [r for r in units if r['ref_state'] == 'active']
sta = collections.Counter(r['status'] for r in active)
w('## Totals\n')
w('| | units (all) | units (active refs) |')
w('|---|---|---|')
for s in ['TRACED', 'MISSING_BUT_DRAWN', 'NOT_ON_MASTER']:
    w('| %s | %d | %d |' % (s, st[s], sta[s]))
w('| **total** | **%d** | **%d** |' % (len(units), len(active)))
w('')
wb = [r for r in runs if r['type'] == 'water_barrier_tl2']
tm = [r for r in runs if r['type'] == 'trakmat']
w('Counted as pieces, one row per reference (not in the unit totals): **%d water-barrier references, %d TL2 pieces** '
  '(%d references / %d pieces MISSING_BUT_DRAWN, %d / %d NOT_ON_MASTER); **trakmat %d pieces** (T0025, NOT_ON_MASTER).\n' % (
      len(wb), sum(r['pieces'] for r in wb),
      sum(1 for r in wb if r['status'] == 'MISSING_BUT_DRAWN'), sum(r['pieces'] for r in wb if r['status'] == 'MISSING_BUT_DRAWN'),
      sum(1 for r in wb if r['status'] == 'NOT_ON_MASTER'), sum(r['pieces'] for r in wb if r['status'] == 'NOT_ON_MASTER'),
      sum(r['pieces'] for r in tm)))
w('Waste tanks (%d) are NOT_ON_MASTER by design: each sits under its toilet block and takes the block\'s traced footprint (the project manager, 9 Oct).\n' % sum(1 for r in units if r['type'] == 'waste_tank'))

w('## By type and status (units)\n')
w('| type | TRACED | MISSING_BUT_DRAWN | NOT_ON_MASTER | total | of which cancelled/deleted | owners |')
w('|---|---|---|---|---|---|---|')
bt = collections.defaultdict(collections.Counter)
own = collections.defaultdict(collections.Counter)
canc = collections.Counter()
for r in units:
    bt[r['type']][r['status']] += 1
    own[r['type']][r['owner']] += 1
    if r['ref_state'] != 'active':
        canc[r['type']] += 1
for t in sorted(bt):
    c = bt[t]
    w('| %s | %d | %d | %d | %d | %d | %s |' % (t, c['TRACED'], c['MISSING_BUT_DRAWN'], c['NOT_ON_MASTER'], sum(c.values()), canc[t],
                                            ', '.join('%s %d' % kv for kv in own[t].most_common())))
w('')

w('## MISSING_BUT_DRAWN (the master draws it; v9.15 has no component)\n')
w('| reference | type | units / pieces | where on the master | confidence |')
w('|---|---|---|---|---|')
seen = collections.OrderedDict()
for r in U:
    if r['status'] == 'MISSING_BUT_DRAWN':
        k = (r['ref'], r['type'])
        seen.setdefault(k, []).append(r)
for (ref, t), rs in seen.items():
    r = rs[0]
    if t == 'water_barrier_tl2':
        wh = '; '.join('%s %s: %d pieces drawn, %.1f m, centre %s' % (x['run'], x['where'], x['pieces_drawn'], x['length_m'], x['centroid_frame']) for x in r['where'])
        conf = '/'.join(sorted({x['confidence'] for x in r['where']}))
        qty = 'schedule %d pieces' % r['pieces']
    else:
        wh = r['where'].get('evidence', '') + ((' · pt %s' % r['where']['where_frame']) if r['where'].get('where_frame') else '')
        conf = r['where'].get('confidence', '')
        qty = 'units %s of %d' % (','.join(str(x['unit_index']) for x in rs), r['qty_for_item'])
    w('| %s | %s | %s | %s | %s |' % (ref, t, qty, wh, conf))
w('')

w('## Every reference with a gap (any unit not TRACED)\n')
w('| reference | state | type | not traced | status | why / where |')
w('|---|---|---|---|---|---|')
g = collections.OrderedDict()
for r in U:
    if r['status'] != 'TRACED':
        g.setdefault((r['ref'], r['type'], r['status']), []).append(r)
for (ref, t, s), rs in sorted(g.items()):
    r = rs[0]
    n = ('%d pieces' % r['pieces']) if r['unit_index'] is None else ('%d of %d' % (len(rs), r['qty_for_item']))
    if s == 'MISSING_BUT_DRAWN':
        why = 'see the table above'
    elif t == 'waste_tank':
        ub = r.get('under_block') or {}
        why = 'under block %s (%s); %s' % (ub.get('block_asset') or 'unit %s' % ub.get('block_unit_index'), ub.get('pairing_basis'), ub.get('footprint'))
    else:
        why = r.get('why_not') or ''
    if r.get('note'):
        why += ' · ' + r['note']
    w('| %s | %s | %s | %s | %s | %s |' % (ref, 'active' if r['ref_state'] == 'active' else r['ref_state'][:40], t, n, s, why.replace('|', '/')))
w('')

w('## Waste tanks (under their blocks)\n')
w('| reference | tank | block it sits under | block traced (v9.15 component) | footprint | pairing |')
w('|---|---|---|---|---|---|')
for r in U:
    if r['type'] == 'waste_tank':
        ub = r['under_block']
        w('| %s | %s | %s | %s | %s | %s |' % (r['ref'], r.get('asset_or_supplier_no') or 'no number', ub.get('block_asset') or ('unit %s' % ub.get('block_unit_index')),
                                         ub.get('block_v915_component'), ub.get('footprint'), ub.get('pairing_basis') + ((' · ' + ub['note']) if ub.get('note') else '')))
w('')

w('## Water-barrier runs drawn on the master (white-and-yellow, legend "WATER-FILLED BARRIER")\n')
w('Pieces = drawn segments (alternating #ffbf00 / #fafafa quads, 2.0 m each as drawn at 1:2000). The schedule\'s TL2 piece length is not in any source read: size to confirm. Kerb rows (T2, T8, T9, T10) are all-yellow pieces with no white alternation and are low confidence.\n')
w('| run | candidate ref | confidence | where | pieces drawn | length m | centre (MASTER_LOC frame) |')
w('|---|---|---|---|---|---|---|')
for ru in d['wfb_runs']:
    w('| %s | %s | %s | %s | %d | %.1f | %s |' % (ru['run'], ru['candidate_ref'] or '-', ru['confidence'], ru['where'], ru['pieces_drawn'], ru['length_m'], ru['centroid_frame']))
w('')
w('Schedule against drawing: WB06 154 vs R01+R02 157 (zone 1 on K220/K221 says 154 Coates WFB); WB01 12 vs 11; WB16 13 vs 13; WB04 14 vs 13 (iEDM table read 12); WB05 13 vs 11 (iEDM table puts WB05 at Commodore Park / Gate 2, so R04 may instead be the 12 "ADD TO FMS" barriers at Main Beach Light Rail bus stop); WB14 2 vs 2; WB13 10 vs 7 on the fence (+10 in R09, low; iEDM read 13); WB17 6 vs 11+11 kerb pieces; WB18 2 vs 11 kerb pieces.\n')
w('Not drawn: WB02 and WB19 (S08 pathway: in and out 21-27 Sep, and again in demob), WB03 (Turn 2, out 19 Oct) and WB20 (Turn 2, demob), WB07 (Admiralty Dr: no run drawn; iEDM quantity read as 0 or blank), WB15 (Turn 11: no run drawn; zone 6 is HVM).\n')

w('## v9.15 components with no scheduled unit\n')
for s in d['v915_surplus_components']:
    w('- %s component %d (%s): %s' % (s['ref'], s['index'], s['kind'], s['why']))
w('- WC57: the master draws 7 FWF under the WC57 tag and 2 at WC59; the schedule says WC57 2, WC59 7 (and the record holds 7 Event Portables numbers for WC59). WC59 units 3-7 are listed MISSING_BUT_DRAWN against those symbols.')
w('- WC13: the master draws 3; the schedule says 2.\n')

w('## Drawn on the master with no reference\n')
for x in d['drawn_on_master_unmatched']:
    w('- **%s**: %s (%s)' % (x['kind'], x['note'], ', '.join(str(v) for v in (x.get('pdf_drawings') or x.get('runs') or []))))
w('')
w('## Left out\n')
for x in d['excluded']:
    w('- %s %s x%s: %s' % (x['ref'], x['item'], x['qty'], x['why']))
for k, v in d['schedule_rows_skipped'].items():
    w('- %s: %s' % (k, v))
w('')
w('## How to read this\n')
w('- One row per unit in inventory.json (`units`), unit_index 1..qty per item at the reference; barriers and trakmats one row per reference with `pieces`.')
w('- TRACED means a v9.15 component of the right kind was assigned in component order; which drawn symbol carries which asset number is not known unless `number_basis` says so.')
w('- Quantities are the peak on the ground from the schedule place/remove rows; a blank quantity counts as one unit per reference.')
w('- Cancelled or deleted references are kept and marked in `ref_state` (P47, P53, WC32, WC66, T0019, T0089).')
open(SC + 'coverage.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[:40]))
