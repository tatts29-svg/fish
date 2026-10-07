#!/usr/bin/env python3
# Author: Andrew Fisher. v8.95 identity: the candidate's DATA equals the base except DATA.rental_on_hire, and inside it
# only what the 7 Oct Baseplan export changes against the 6 Oct export - the two NVAC lines it adds, the 25 lines it
# changes (statuses, dates, asset numbers, dockets, one description) and what v8.71's logic derives from them (the join
# of a line whose number or docket changed, the per-contract summaries, the assignments of the references those lines
# join, the summary counts, the source record and its supplement) - plus the two joins Andrew's record makes under his
# rule ("What I have matched up and completed is correct"): 9968862/50 to P37 and 9968862/79 to P52, and only their join.
# Every other line, field and reference is identical.
#   python3 test_identity895.py <base page (the chain without v8.95)> <candidate page>
# With V895_BASEPLAN set, the changed lines are also checked against the export's own cells.
import json, os, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent))
import baseplan895 as B

def read(path):
    s = Path(path).read_text(encoding='utf-8-sig')
    D = json.loads(re.search(r'const DATA = (\{.*?\});\n', s).group(1))
    mm = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ML = json.JSONDecoder().raw_decode(s[mm.end():])[0] if mm else None
    return D, ML, s

(BD, BL, BS), (ND, NL, NS) = read(sys.argv[1]), read(sys.argv[2])
fails = []
def check(name, ok, detail=''):
    print(('PASS ' if ok else 'FAIL ') + name + ('' if ok or not detail else '  ' + str(detail)[:600]))
    if not ok: fails.append(name)

# ---- 1. the whole page: only DATA.rental_on_hire differs, plus Andrew's one correction to P52's register number
# (8 Oct 2026: "1327211 is correct"; the register wrote 13227211) in exactly these four places; MASTER_LOC and the rest of
# the script are untouched
WRONG, RIGHT = '13227211', '1327211'
P52_PATHS = ['DATA.assets[P52].asset_numbers[0]', 'DATA.assets[P52].events[0].booking801.asset_text', 'DATA.assets[P52].events[0].booking801.loads[0].asset_numbers[0]', 'DATA.ops.rows[P52].asset_numbers_scheduled[0]']
check('no DATA key added or removed', set(BD) == set(ND))
import copy
BX = copy.deepcopy(BD)   # the base with the four corrected values written in: everything else must be identical
try:
    ai = next(i for i, a in enumerate(BX['assets']) if a['key'] == 'P52'); oi = next(i for i, r in enumerate(BX['ops']['rows']) if r['key'] == 'P52')
    a52 = BX['assets'][ai]; bk = a52['events'][0]['booking801']; o52 = BX['ops']['rows'][oi]
    found = [a52['asset_numbers'][0], bk['asset_text'], bk['loads'][0]['asset_numbers'][0], o52['asset_numbers_scheduled'][0]]
    a52['asset_numbers'][0] = RIGHT; bk['asset_text'] = RIGHT; bk['loads'][0]['asset_numbers'][0] = RIGHT; o52['asset_numbers_scheduled'][0] = RIGHT
except Exception as e:
    found = [repr(e)]
check('the base carried 13227211 in exactly the four P52 places and nowhere else', found == [WRONG] * 4 and json.dumps(BD, ensure_ascii=False).count(WRONG) == 4, found)
check('the candidate carries 1327211 in those four places and 13227211 nowhere in DATA', WRONG not in json.dumps(ND, ensure_ascii=False)
      and next(a for a in ND['assets'] if a['key'] == 'P52')['asset_numbers'] == [RIGHT] and next(r for r in ND['ops']['rows'] if r['key'] == 'P52')['asset_numbers_scheduled'] == [RIGHT]
      and next(a for a in ND['assets'] if a['key'] == 'P52')['events'][0]['booking801']['asset_text'] == RIGHT and next(a for a in ND['assets'] if a['key'] == 'P52')['events'][0]['booking801']['loads'][0]['asset_numbers'] == [RIGHT])
for k in BD:
    if k in ('assets', 'ops'):
        check('DATA.' + k + ' identical beyond the P52 correction (' + ', '.join(p for p in P52_PATHS if k in p.split('.')[1]) + ')', BX[k] == ND.get(k))
    elif k != 'rental_on_hire':
        check('DATA.' + k + ' identical', BD[k] == ND.get(k))
check('13227211 appears nowhere on the candidate page; 1327211 is P52\'s number on the register and on its contract line', NS.count(WRONG) == 0 and BS.count(WRONG) == 4)
check('MASTER_LOC identical', BL == NL)
strip = lambda s: re.sub(r'const DATA = \{.*?\};\n', 'DATA', s, count=1).replace(' · v8.95', ' · vX').replace(' · v8.94', ' · vX').replace(' · v8.93', ' · vX').replace(' · v8.92', ' · vX').replace(' · v8.91', ' · vX').replace(' · v8.90', ' · vX').replace(' · v8.89', ' · vX')
check('outside DATA the page differs only in the release footer', strip(BS) == strip(NS))
check('the footer reads v8.95 once', NS.count(' · v8.95') == 1 and ' · v8.94' not in NS)

# ---- 2. the source record
BR, NR = BD['rental_on_hire'], ND['rental_on_hire']
check('rental_on_hire keys unchanged', set(BR) == set(NR))
for k in ('supplied_by', 'transcription_state', 'authority', 'notes', 'columns', 'differences'):
    check('rental_on_hire.' + k + ' identical', BR.get(k) == NR.get(k))
check('the source is the 7 Oct export', NR['record_id'] == 'baseplan-contracts-2026-10-07' and NR['supplied_on'] == '2026-10-07' and NR['workbook'] == 'Baseplan_SuperCars_07Oct.xlsx' and '2026-10-07' in NR['source'] and NR['source'].replace('2026-10-07', '2026-10-06') == BR['source'])
sup = NR['supplements']
check('one supplement added, for v8.95, bound to the export by SHA-256, naming the two joins from his record', len(sup) == len(BR['supplements']) + 1 and sup[:-1] == BR['supplements'] and sup[-1]['applied'] == 'v8.95'
      and sup[-1]['sha256'] == '8a18bd1f0df331d339d0fa27d81bdf22b238b1de0f1f5f5c342b208eed4b3bd7' and sup[-1]['lines_added'] == ['9961976/42', '9961976/43'] and sup[-1]['lines_removed'] == [] and sup[-1]['lines_changed'] == 25
      and sup[-1].get('lines_joined_from_record') == ['9968862/50', '9968862/79'])

# ---- 3. the lines: exactly the export's changes, nothing else
WC07 = {24: '1002566', 25: '1317640', 26: '1211959', 27: '1317649', 28: '1317647', 29: '1317626', 30: '1317652', 31: '1317648', 32: '1212552', 33: '1200595',
        34: '1181004', 35: '1002538', 36: '1317658', 37: '1317632', 38: '1317643', 39: '1317641', 40: '1002715', 41: '1083300', 42: '1192643', 43: '1002651'}
BASE = {'asset_no', 'asset_no_is_plant_number', 'booked_delivery_date', 'delivered', 'item', 'start_date', 'status_as_written'}
EXPECT = {('9961976', 27): {'description', 'what'}, ('9968862', 89): {'booked_delivery_date', 'delivered', 'start_date', 'status_as_written'},
          ('9968955', 97): {'delivery_number', 'match', 'status_as_written'}, ('9968955', 103): {'delivery_number', 'match', 'status_as_written'}, ('9968955', 105): {'delivery_number', 'match', 'status_as_written'}}
# the two lines Andrew's record joins under his rule: their join and nothing else
RECORD = {('9968862', 50): 'P37', ('9968862', 79): 'P52'}
for k in RECORD:
    EXPECT[k] = {'match'}
for l in WC07:
    EXPECT[('9968955', l)] = BASE | ({'match'} if l != 38 else set()) | ({'description'} if l in (24, 39) else set())
ADDED = {('9961976', 42), ('9961976', 43)}
brow = {(str(r['rental_contract']), int(r['line'])): r for r in BR['rows']}; nrow = {(str(r['rental_contract']), int(r['line'])): r for r in NR['rows']}
check('323 lines: the 321 of the 6 Oct export and the two the 7 Oct export adds', len(NR['rows']) == 323 and set(nrow) == set(brow) | ADDED and set(brow) - set(nrow) == set())
check('the lines are in contract and line order', [(str(r['rental_contract']), int(r['line'])) for r in NR['rows']] == sorted(nrow))
unexpected, wrongfields = [], []
for k in sorted(brow):
    d = {f for f in set(brow[k]) | set(nrow[k]) if brow[k].get(f) != nrow[k].get(f)}
    if k not in EXPECT:
        if d: unexpected.append((k, sorted(d)))
    elif d != EXPECT[k]:
        wrongfields.append((k, sorted(d ^ EXPECT[k])))
check('every line outside the export\'s 25 and the record\'s 2 is identical, field for field', not unexpected, unexpected[:6])
check('the 25 changed lines change only in the export\'s fields and what v8.71 derives from them; the record\'s 2 only in their join', not wrongfields, wrongfields[:6])
check('row shape unchanged: every kept line has the base\'s keys in the base\'s order, every added line the standard keys', all(list(nrow[k].keys()) == list(brow[k].keys()) for k in brow) and all(list(nrow.get(k, {}).keys()) == list(BR['rows'][0].keys()) for k in ADDED))

# the values the 7 Oct export writes (a missing line reads as empty, so a check fails instead of stopping)
class Missing(dict):
    def __missing__(self, k): return None
def R(c, l): return nrow.get((c, l)) or Missing()
ok = True
for l, no in WC07.items():
    r = R('9968955', l)
    ok &= r['item'] == no and r['asset_no'] == no and r['asset_no_is_plant_number'] is True and r['status_as_written'] == 'Delivered' and r['delivered'] is True and r['booked_delivery_date'] == '2026-09-22' and r['start_date'] == '2026-09-22' and r['demob_date'] == '2026-11-13' and r['delivery_number'] == '26081411' and r['kind'] == 'toilet' and r['what'] == 'Toilet Portable - Fresh Water Flush'
check('WC07\'s 20 FWF lines (9968955/24-43): Delivered on 22 Sep, each with its Baseplan asset number, docket 26081411 kept', ok)
check('the 20 WC07 lines keep their rates (the export did not change them)', all(R('9968955', l)['rate_1'] == brow[('9968955', l)]['rate_1'] and R('9968955', l)['rate_type'] == brow[('9968955', l)]['rate_type'] for l in WC07))
check('lines 24 and 39: the WC07 prefix came off the description, the thing itself unchanged', R('9968955', 24)['description'] == 'Toilet Portable - Fresh Water Flush' and R('9968955', 39)['description'] == 'Toilet Portable - Fresh Water Flush')
j = lambda r: (r.get('match') or {})
# the page says "matched on site by the project manager": the v5.97 rule lifts the name out of every sentence the page shows (toolchain/scrub_attributions.py)
MATCHED = re.compile(r'matched on site by (the project manager|Andrew Fisher)')
check('19 WC07 lines join WC07 by the number Andrew recorded (as supplied, 22 Sep 2026); their old join was none',
      all(j(R('9968955', l))['key'] == 'WC07' and j(R('9968955', l))['via'] == 'asset number' and j(R('9968955', l))['state'] == 'same asset number' and MATCHED.search(j(R('9968955', l))['basis']) and j(brow[('9968955', l)])['key'] is None for l in WC07 if l != 38))
check('line 38 (1317643) joins nothing: Andrew\'s WC07 record carries 1317743, not 1317643 - held for him', j(R('9968955', 38))['key'] is None and j(R('9968955', 38)) == j(brow[('9968955', 38)]))
check('P56 building (9968862/89): Delivered, on hire from 7 Oct (was Del Req, booked 14 Sep); its join to P56 unchanged', R('9968862', 89)['status_as_written'] == 'Delivered' and R('9968862', 89)['delivered'] is True and R('9968862', 89)['start_date'] == '2026-10-07' and R('9968862', 89)['booked_delivery_date'] == '2026-10-07' and j(R('9968862', 89))['key'] == 'P56' and j(R('9968862', 89)) == j(brow[('9968862', 89)]))
check('WC31 accessible toilet (9968955/97): Pending -> Del Req on docket 26115307, joined to WC31 by that docket', R('9968955', 97)['status_as_written'] == 'Del Req' and R('9968955', 97)['delivery_number'] == '26115307' and R('9968955', 97)['delivered'] is False and R('9968955', 97)['start_date'] is None and j(R('9968955', 97))['key'] == 'WC31' and j(R('9968955', 97))['via'] == 'delivery docket')
check('WC09 toilet blocks (9968955/103, 105): Pending -> Del Req on dockets 26115312 and 26115316, joined to WC09 by those dockets', all(R('9968955', l)['status_as_written'] == 'Del Req' and R('9968955', l)['delivered'] is False and j(R('9968955', l))['key'] == 'WC09' and j(R('9968955', l))['via'] == 'delivery docket' for l in (103, 105)) and R('9968955', 103)['delivery_number'] == '26115312' and R('9968955', 105)['delivery_number'] == '26115316')
check('NVAC forklift (9961976/27): the description typo is fixed and the thing reads Forklift 3.5t Diesel', R('9961976', 27)['description'] == 'SUPPLY-Forklift 3.5t Diesel' and R('9961976', 27)['what'] == 'Forklift 3.5t Diesel' and brow[('9961976', 27)]['what'] == 'orklift 3.5t Diesel')
g42, g43 = R('9961976', 42), R('9961976', 43)
check('two new NVAC lines 42 and 43: 200 kVA Concert generators 1316182 and 1316183, Pending, booked 12-26 Oct, no rate, joined to GN? by the register\'s numbers',
      all(g['branch_code'] == 'NVAC' and g['status_as_written'] == 'Pending' and g['delivered'] is False and g['start_date'] is None and g['booked_delivery_date'] == '2026-10-12' and g['demob_date'] == '2026-10-26' and g['contract_start'] == '2026-10-12'
          and g['kind'] == 'generator' and g['family'] == 'generator' and g['register_type'] == '200kva' and g['what'] == 'Generator - 200kVA (Diesel)' and g['rate_1'] is None and g['rate_classification'] == 'no rates' and g['charge_line'] is False and g['subhired'] is False
          and g['asset_no_is_plant_number'] is True and j(g)['key'] == 'GN?' and j(g)['via'] == 'asset number' and 'in the register' in j(g)['basis'] and g['quantity'] == 1 and g['minimum_days'] == 1 for g in (g42, g43))
      and g42['item'] == '1316182' and g43['item'] == '1316183' and g42['sales_analysis_code'] == 'NVAC-HIR')
check('the new lines carry every field a line has (the v8.71 skeleton), with no money on them', set(g42) == set(BR['rows'][0]) and set(g43) == set(BR['rows'][0]) and all(g[f] is None for g in (g42, g43) for f in ('rate_1', 'rate_2', 'rate_3', 'rate_4', 'rate_5', 'price', 'sell_price', 'billed_amount', 'last_total_amount', 'total_inc_sd_dw_gst', 'flat_monthly_charge')))
check('Andrew\'s record joins 9968862/50 (1105053, Delivered 17 Sep) to P37 and 9968862/79 (1327211, Del Req) to P52 by his number; both were unjoined; nothing else on the lines moved',
      all(j(R(c, l))['key'] == ref and j(R(c, l))['via'] == 'asset number' and j(R(c, l))['state'] == 'same asset number' and MATCHED.search(j(R(c, l))['basis']) and j(brow[(c, l)])['key'] is None
          and {f for f in brow[(c, l)] if brow[(c, l)].get(f) != R(c, l)[f]} == {'match'} for (c, l), ref in RECORD.items())
      and R('9968862', 50)['status_as_written'] == 'Delivered' and R('9968862', 50)['start_date'] == '2026-09-17' and R('9968862', 79)['status_as_written'] == 'Del Req' and R('9968862', 79)['start_date'] is None)
check('a Pending line is not on hire: no start date, not delivered (v8.71\'s rule)', all(r['start_date'] is None and r['delivered'] is False for r in NR['rows'] if r['status_as_written'] == 'Pending'))
check('no rate of 0 anywhere (a 0 is no rate) and every delivered line is on hire from a date', not any(r['rate_1'] == 0 for r in NR['rows']) and all(r['start_date'] for r in NR['rows'] if r['delivered']))

# the export's own cells, when it is to hand
bp = os.environ.get('V895_BASEPLAN')
if bp and Path(bp).is_file():
    NEW, TABS = B.read_export(bp)
    bad = []
    for (c, l), d in NEW.items():
        f = B.raw_fields(d, c, TABS[c][0]); r = nrow.get((c, l))
        if r is None: bad.append((c, l, 'missing')); continue
        for k in B.CARRY:
            if f[k] != r.get(k): bad.append((c, l, k))
    check('every line\'s carried fields equal the 7 Oct export\'s cells (' + str(len(NEW)) + ' lines)', not bad and len(NEW) == 323, bad[:5])
else:
    print('skip  V895_BASEPLAN not set: the export\'s cells were not re-read')

# ---- 4. Andrew's matches win: no line is joined to a reference other than the one his record puts its number on
AND = json.loads((here.parent / 'andrew_4370.json').read_text())
of, _ = B.andrew_numbers(ND, AND)
contra = [(k, r['asset_no'], j(r)['key'] or j(r)['task_id'], of[str(r['asset_no'])]) for k, r in nrow.items() if r['asset_no_is_plant_number'] and str(r['asset_no']) in of and (j(r)['key'] or j(r)['task_id']) not in (None, of[str(r['asset_no'])])]
check('no line joins a reference that contradicts Andrew\'s record (shared record 4370 or the as-supplied record)', not contra, contra[:5])
unjoined = sorted(k for k, r in nrow.items() if r['asset_no_is_plant_number'] and str(r['asset_no']) in of and not (j(r)['key'] or j(r)['task_id']))
check('the only recorded numbers whose line is not joined are the two-line numbers v8.71 holds (9961265/12, 9968726/10, 9968862/110)',
      unjoined == [('9961265', 12), ('9968726', 10), ('9968862', 110)], unjoined)
check('the register\'s WC07 carries no numbers of its own (his are on the as-supplied record and the shared record, which the page reads live)', next(a for a in ND['assets'] if a['key'] == 'WC07')['asset_numbers'] == [] and next(a for a in BD['assets'] if a['key'] == 'WC07')['asset_numbers'] == [])
check('the supplement records the P52 correction with Andrew\'s words', sup[-1].get('register_corrected') and [x['was'] for x in sup[-1]['register_corrected']] == [WRONG] * 4 and all(x['now'] == RIGHT and x['ref'] == 'P52' for x in sup[-1]['register_corrected']) and '1327211 is correct' in (sup[-1].get('register_correction_basis') or ''), sup[-1].get('register_corrected'))

# ---- 5. what v8.71 derives: contracts, assignments, summary - recomputed here from the candidate's rows
TABS = {str(c['rental_contract']): (c['branch_code'], c['tab']) for c in NR['contracts']}
bc = {str(c['rental_contract']): c for c in BR['contracts']}; nc = {str(c['rental_contract']): c for c in NR['contracts']}
check('11 contracts, the same eleven', set(bc) == set(nc) and len(nc) == 11)
cbad = []
for con, c in nc.items():
    rs = [r for r in NR['rows'] if str(r['rental_contract']) == con]
    want = {'lines': len(rs), 'plant_numbers': sorted({r['asset_no'] for r in rs if r['asset_no_is_plant_number']}), 'locations': sorted({r['location'] for r in rs if r.get('location')}),
            'start_dates': sorted({r['contract_start'] for r in rs if r.get('contract_start')}), 'delivered_dates': sorted({r['start_date'] for r in rs if r.get('delivered') and r.get('start_date')}),
            'demob_dates': sorted({r['demob_date'] for r in rs if r.get('demob_date')}), 'delivery_numbers': sorted({r['delivery_number'] for r in rs if r.get('delivery_number')}),
            'matched': sum(1 for r in rs if r.get('match') and r['match'].get('to')),
            'assets': sorted(set(bc[con]['assets']) | {r['match']['key'] for r in rs if r.get('match') and r['match'].get('to') == 'asset' and r['match'].get('key')})}
    for k, v in want.items():
        if c.get(k) != v: cbad.append((con, k))
    others = {k: v for k, v in c.items() if k not in want}
    if others != {k: v for k, v in bc[con].items() if k not in want}: cbad.append((con, 'other fields'))
check('every contract summary is exactly what its lines give, and its other fields are the base\'s', not cbad, cbad[:6])
check('only 9961976, 9968862 and 9968955 change their summary', {con for con in nc if nc[con] != bc[con]} == {'9961976', '9968862', '9968955'})
check('9961976: 36 lines, 30 matched, two more plant numbers', nc['9961976']['lines'] == 36 and nc['9961976']['matched'] == 30 and set(nc['9961976']['plant_numbers']) - set(bc['9961976']['plant_numbers']) == {'1316182', '1316183'})
check('9968862: the new delivered date 7 Oct and two more matched lines (P37, P52 from his record)', {k for k in nc['9968862'] if nc['9968862'][k] != bc['9968862'][k]} == {'delivered_dates', 'matched'} and set(nc['9968862']['delivered_dates']) - set(bc['9968862']['delivered_dates']) == {'2026-10-07'} and nc['9968862']['matched'] - bc['9968862']['matched'] == 2)
check('9968955: 22 more matched lines, 22 Sep among its delivered dates, the three new dockets, the 20 numbers', nc['9968955']['matched'] - bc['9968955']['matched'] == 22 and '2026-09-22' in nc['9968955']['delivered_dates'] and set(nc['9968955']['delivery_numbers']) - set(bc['9968955']['delivery_numbers']) == {'26115307', '26115312', '26115316'} and set(nc['9968955']['plant_numbers']) - set(bc['9968955']['plant_numbers']) == set(WC07.values()))

BA, NA = BR['assignments'], NR['assignments']
check('assignments: the same references, only GN?, WC07, WC09, WC31 (the export) and P37, P52 (his record) change', set(BA) == set(NA) and {k for k in NA if NA[k] != BA.get(k)} == {'GN?', 'WC07', 'WC09', 'WC31', 'P37', 'P52'})
abad = []
for key in ('GN?', 'WC07', 'WC09', 'WC31', 'P37', 'P52'):
    lines = [r for r in NR['rows'] if r.get('match') and r['match'].get('to') == 'asset' and r['match'].get('key') == key]
    if not lines or key not in NA: abad.append(key); continue
    first = lines[0]; dl = next((r for r in lines if r.get('delivered')), None)
    want = {'branch_code': first['branch_code'], 'rental_contract': str(first['rental_contract']), 'via': first['match']['via'], 'basis': first['match']['basis'], 'lines': [f"{r['rental_contract']}/{r['line']}" for r in lines],
            'all_contracts': sorted({str(r['rental_contract']) for r in lines}), 'delivered': {'date': dl['start_date'], 'delivery_number': dl['delivery_number']} if dl else None}
    if NA[key] != want: abad.append(key)
check('each changed assignment is exactly what its joined lines give', not abad, abad)
check('WC07: KINP, contract 9968955, 19 lines, delivered 22 Sep on docket 26081411 (was by kind of item)', NA['WC07']['branch_code'] == 'KINP' and NA['WC07']['rental_contract'] == '9968955' and len(NA['WC07']['lines']) == 19 and NA['WC07']['delivered'] == {'date': '2026-09-22', 'delivery_number': '26081411'} and BA['WC07']['via'] == 'kind of item')
check('GN?: NVAC, contract 9961976, lines 42 and 43, not delivered (was by kind of item)', NA['GN?']['branch_code'] == 'NVAC' and NA['GN?']['lines'] == ['9961976/42', '9961976/43'] and NA['GN?']['delivered'] is None and BA['GN?']['via'] == 'kind of item')
check('WC09 and WC31 keep KINP and 9968955, now by their dockets, not delivered', all(NA[k]['branch_code'] == 'KINP' and NA[k]['rental_contract'] == '9968955' and NA[k]['via'] == 'delivery docket' and NA[k]['delivered'] is None and BA[k]['branch_code'] == 'KINP' and BA[k]['rental_contract'] == '9968955' for k in ('WC09', 'WC31')))
check('P37: KINP, contract 9968862, line 50, delivered 17 Sep on docket 26077069 (was by kind of item)', NA['P37']['branch_code'] == 'KINP' and NA['P37']['rental_contract'] == '9968862' and NA['P37']['lines'] == ['9968862/50'] and NA['P37']['via'] == 'asset number' and NA['P37']['delivered'] == {'date': '2026-09-17', 'delivery_number': '26077069'} and BA['P37']['via'] == 'kind of item')
check('P52: KINP, contract 9968862, now lines 79 (his number) and 81 (its docket), not delivered', NA['P52']['branch_code'] == 'KINP' and NA['P52']['rental_contract'] == '9968862' and NA['P52']['lines'] == ['9968862/79', '9968862/81'] and NA['P52']['delivered'] is None and BA['P52']['lines'] == ['9968862/81'])

BSM, NSM = BR['summary'], NR['summary']
states = [((r.get('match') or {}).get('state') or 'unmatched') for r in NR['rows']]
by = {}
for v in NA.values(): by[v.get('via')] = by.get(v.get('via'), 0) + 1
want = {'lines': 323, 'contracts': sorted(TABS), 'branches': sorted({b for b, _ in TABS.values()}), 'plant_numbers': len({r['asset_no'] for r in NR['rows'] if r['asset_no_is_plant_number']}),
        'miscellaneous_lines': sum(1 for r in NR['rows'] if not r['asset_no_is_plant_number']), 'same_asset_number': states.count('same asset number'), 'same_delivery_docket': states.count('same delivery docket'),
        'same_day_and_kind': states.count('same day and kind'), 'candidate': states.count('candidate'), 'ambiguous': states.count('ambiguous'), 'unmatched': states.count('unmatched'),
        'assets_assigned': len(NA), 'delivered_lines': sum(1 for r in NR['rows'] if r.get('delivered')), 'assigned_by': dict(sorted(by.items(), key=lambda x: str(x[0])))}
check('the summary counts are exactly what the lines give', all(NSM.get(k) == v for k, v in want.items()), {k: (NSM.get(k), v) for k, v in want.items() if NSM.get(k) != v})
check('the summary\'s other fields are the base\'s', {k: v for k, v in NSM.items() if k not in want} == {k: v for k, v in BSM.items() if k not in want})
check('summary: 323 lines, 164 plant numbers, 142 delivered lines, 137 joined by number, 30 by docket, 149 unjoined', NSM['lines'] == 323 and NSM['plant_numbers'] == 164 and NSM['delivered_lines'] == 142 and NSM['same_asset_number'] == 137 and NSM['same_delivery_docket'] == 30 and NSM['unmatched'] == 149)

# ---- 6. the plant lines' copies of their contract lines follow the rows (no copy is of a changed line, so they are identical)
check('plant_lines identical (no plant line carries a changed contract line)', BD['plant_lines'] == ND['plant_lines'])

print('identity895: ' + ('PASS - DATA identical to the base except DATA.rental_on_hire (the 7 Oct export\'s 25 changed and 2 added lines, the 2 joins from Andrew\'s record, and what v8.71 derives from them) and P52\'s number corrected to 1327211 in its four places' if not fails else 'FAIL - %d finding(s)' % len(fails)))
sys.exit(1 if fails else 0)
