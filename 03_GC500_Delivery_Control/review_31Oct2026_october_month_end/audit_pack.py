"""Author: Andrew Fisher. Independent audit of the GC500 P&L pack: recomputes the figures from the source data (not from the
builder) and checks the workbook, page and CSV agree with them and with each other, to the cent. Read only.

    python3 -I audit_pack.py <pack_dir> <progress_dir> [<alfie_nights.json> [<dated_costs_now.json>]]

<pack_dir> holds GC500_PL_final.xlsx/.html, GC500_October_month_end.csv and GC500_labour_by_month_and_branch.csv;
<progress_dir> holds the private inputs (invoices.json, dated_costs.json, cost_sources.json, bp12.json, dated_all.json),
captured at record 12640; <alfie_nights.json> is inputs/alfie_nights.cjs's read and <dated_costs_now.json> is
inputs/dated_costs.cjs run with OUT=..., both on the record as it now stands (12715: Alfie's nine nights priced, his 23-25 Oct
nights taken off (12685); Daniel Gough's ten days 2-13 Nov put back, Aaron Zelvis's Fridays 6 and 13 Nov off and Alfie Harris's
Mondays 2 and 9 Nov from 06:00 (12715)). transport_loads.json (inputs/transport_loads.cjs) is read from the same folder as <dated_costs_now.json>.
"""
import csv, html, json, re, sys, collections
from pathlib import Path
import openpyxl

PK, PR = Path(sys.argv[1]), Path(sys.argv[2])
ALF = Path(sys.argv[3]) if len(sys.argv) > 3 else None
NOW = Path(sys.argv[4]) if len(sys.argv) > 4 else None
r2 = lambda x: round(x + 1e-9, 2)
fmt = lambda x: '{:,.2f}'.format(x)
OK, BAD = [], []
def check(name, cond, detail=''):
    (OK if cond else BAD).append(name + ('' if cond else '  <-- ' + str(detail)))
def eq(name, a, b, tol=0.005):
    check(name, abs((a or 0) - (b or 0)) < tol, '%s vs %s' % (a, b))

wb = openpyxl.load_workbook(PK / 'GC500_PL_final.xlsx', data_only=True)
H = open(PK / 'GC500_PL_final.html', encoding='utf-8').read()
HT = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', H)))
CS = list(csv.reader(open(PK / 'GC500_October_month_end.csv', encoding='utf-8-sig')))
LAB = list(csv.reader(open(PK / 'GC500_labour_by_month_and_branch.csv', encoding='utf-8-sig')))
rows = lambda name: [r for r in wb[name].iter_rows(min_row=2, values_only=True)]

# ------------------------------------------------------------------ revenue, from the invoices
inv = json.load(open(PR / 'invoices.json')); inv = inv if isinstance(inv, list) else list(inv.values())
check('19 invoices in the source', len(inv) == 19, len(inv))
eq('the 19 invoices total', sum(i['ex_gst'] for i in inv), 1003037.12)
OUT = {'25124396'}                                          # invoiced to Gold Coast Helitours, not V8 Supercars
FIX = {'25120652': 'STPS', '25120689': 'STPS'}              # invoice header "Branch Staplyton (S)", Sales Analysis Code STPS-CON
keep = [i for i in inv if i['invoice'] not in OUT]
REV_TOT = r2(sum(i['ex_gst'] for i in keep)); eq('18 invoices to V8 Supercars', REV_TOT, 1001063.07)
REVB = collections.defaultdict(float)
for i in keep: REVB[FIX.get(i['invoice'], i.get('bp_branch'))] += i['ex_gst']
rv = [r for r in rows('Revenue by invoice') if r and r[0] and r[4] != 'removed' and not str(r[0]).startswith('Total')]   # v1.13: column 4 is the V8s PO
check('revenue sheet: 18 invoices', len(rv) == 18, len(rv))
src = {i['invoice']: i for i in keep}
for r in rv:
    i = src.get(r[0]); check('revenue sheet row is a source invoice: %s' % r[0], i is not None)
    if not i: continue
    eq('ex GST matches the invoice: %s' % r[0], r[5], i['ex_gst'])
    eq('months + services = ex GST: %s' % r[0], sum((r[k] or 0) for k in (7, 8, 9, 10)), r[5])
    check('branch: %s' % r[0], r[4].split(' ')[0] == FIX.get(i['invoice'], i.get('bp_branch')), r[4])
rem = [r for r in rows('Revenue by invoice') if r and r[4] == 'removed']
check('25124396 shown as removed, with no amount', len(rem) == 1 and rem[0][0] == '25124396' and all(x is None for x in rem[0][5:11]), rem)
summ = {r[0]: r for r in rows('Summary') if r and r[0] in ('KINP', 'STPS', 'NVAC', 'MEAD', 'The job')}
for b in ('KINP', 'STPS', 'NVAC', 'MEAD'): eq('branch revenue %s' % b, summ[b][1], REVB[b])
eq('revenue: invoices + November forecast', summ['The job'][3], REV_TOT + 839.07)
check('the 839.07 forecast sits on NVAC', abs(summ['NVAC'][2] - 839.07) < 0.005, summ['NVAC'][2])

# ------------------------------------------------------------------ costs, from the record's dated pieces
cs = [r for r in rows('Costs by supplier') if r and r[0] and r[0] != 'Total']
col = lambda i: r2(sum((r[i] or 0) for r in cs))
SEP, OCT, NOV, ACC = col(7), col(8), col(9), col(10)
JOB = r2(SEP + OCT + NOV)
dc = json.load(open(PR / 'dated_costs.json'))
T = collections.defaultdict(float)
for t in dc['transport']:
    mo = (t['d'] or '')[:7]; T[('rec', mo)] += t.get('actual') or 0; T[('plan' if t.get('planned') else 'fc', mo)] += t.get('f') or 0
# ------------------------------------------------------------------ v1.13: Schedule 17, read again from the workbook itself, against the record's loads
S17P = (NOW.parent / 'sched17_transport.json') if NOW else None
S17X = Path('/tmp/gc500-scratch/upload_sched17/schedule17.xlsx')
TLP0 = (NOW.parent / 'transport_loads.json') if NOW else None
S17 = json.load(open(S17P)) if S17P and S17P.exists() else None
check('Schedule 17 corrections and the workbook are beside the record captures', bool(S17) and S17X.exists() and bool(TLP0) and TLP0.exists())
if S17 and S17X.exists():
    import hashlib, datetime as _dt
    check('Schedule 17 workbook is the reviewed one (SHA-256)', hashlib.sha256(S17X.read_bytes()).hexdigest() == S17['sha256'])
    _wb17 = openpyxl.load_workbook(S17X, read_only=True, data_only=True); R17 = []
    for _ws in _wb17.worksheets:
        if _ws.title in ('BOQ', 'Labour'): continue
        _it = list(_ws.iter_rows(values_only=True))
        if not _it: continue
        _hd = [str(h).strip().lower() if h is not None else '' for h in _it[0]]; _ddc = _hd.index('dd') if 'dd' in _hd else None
        for _n, _r in enumerate(_it[1:], start=2):
            _cells = ['' if c is None else (c.date().isoformat() if isinstance(c, _dt.datetime) else str(c)) for c in (_r or ())]
            _amts = sorted({float(x.replace(',', '')) for c in _cells for x in re.findall(r'\$\s*([\d,]+(?:\.\d+)?)', c)})
            if not _amts: continue
            check('Schedule 17 %s row %d: one figure' % (_ws.title, _n), len(_amts) == 1, _amts)
            _d = _cells[0]; _mm = re.match(r'\w+day (\d+)\w* (\w+)', _d)
            if _mm: _d = '2026-%02d-%02d' % ({'September': 9, 'October': 10}[_mm.group(2)], int(_mm.group(1)))
            R17.append({'sheet': _ws.title, 'row': _n, 'date': _d, 'item': (_cells[2] if len(_cells) > 2 else '').strip().lower(), 'amt': _amts[0],
                        'dds': set(re.findall(r'\b2\d{7}\b', _cells[_ddc] if _ddc is not None and _ddc < len(_cells) else ''))})
    check('Schedule 17: 72 rows carry a figure, 35,186.85', len(R17) == 72 and abs(sum(x['amt'] for x in R17) - 35186.85) < 0.005, (len(R17), sum(x['amt'] for x in R17)))
    TL0 = json.load(open(TLP0))['loads']
    for l in TL0: l['_dd'] = set(re.findall(r'\b2\d{7}\b', l.get('dd') or ''))
    CH17 = {(c['s17'][0], c['s17'][1]): c for c in S17['changes']}
    for c in S17['changes']:
        x = [r for r in R17 if (r['sheet'], r['row']) == tuple(c['s17'])]
        check('Schedule 17 %s row %d has %s and docket %s (%s)' % (c['s17'][0], c['s17'][1], fmt(c['amount']), c['dd'], c['ref']), len(x) == 1 and abs(x[0]['amt'] - c['amount']) < 0.005 and set(re.findall(r'\b2\d{7}\b', c['dd'])) <= x[0]['dds'] | {d for d in re.findall(r'\b2\d{7}\b', c['dd']) if not x[0]['dds']}, x)
        if c['kind'] == 'missing': check('%s: no load on the record carries its docket' % c['ref'], not [l for l in TL0 if l['_dd'] & set(re.findall(r'\b2\d{7}\b', c['dd']))])
        else:
            mt = c['match']; h = [l for l in TL0 if l['key'] == mt['key'] and l['d'] == mt['d'] and l['planned'] == mt['planned'] and (not mt.get('item') or l['item'] == mt['item'])]
            check('%s: the record’s load is %s' % (c['ref'], 'a forecast of ' + fmt(c['was']) if c['kind'] == 'forecast' else 'at nil'), len(h) == 1 and not h[0]['actual'] and ((c['kind'] == 'forecast' and abs((h[0]['f'] or 0) - c['was']) < 0.005) or (c['kind'] == 'priced' and not h[0]['f'])), h)
    OD = {('Week 3', 25): 'WC60', ('Week 3', 26): 'WC60', ('Week 3', 4): 'WC01'}   # the same money on another docket
    eq('Schedule 17: WC60’s rows (290.00 + 580.00) = WC60’s 870.00 on the record', sum(r['amt'] for r in R17 if OD.get((r['sheet'], r['row'])) == 'WC60'), sum(l['actual'] or 0 for l in TL0 if l['key'] == 'WC60' and not l['planned']))
    eq('Schedule 17: WC01’s 570.00 = the record’s', sum(r['amt'] for r in R17 if OD.get((r['sheet'], r['row'])) == 'WC01'), sum(l['actual'] or 0 for l in TL0 if l['key'] == 'WC01' and not l['planned']))
    _used = set(); _tied = []
    for r in sorted((r for r in R17 if (r['sheet'], r['row']) not in CH17 and (r['sheet'], r['row']) not in OD), key=lambda r: (not r['dds'])):
        hit = [i for i, l in enumerate(TL0) if i not in _used and l['actual'] and abs(l['actual'] - r['amt']) < 0.005 and r['dds'] & l['_dd']]   # by docket, else by date and item
        hit = hit or [i for i, l in enumerate(TL0) if i not in _used and l['actual'] and abs(l['actual'] - r['amt']) < 0.005 and l['d'] == r['date'] and (l['item'] or '').strip().lower() == r['item']]
        if hit: _used.add(hit[0]); _tied.append(r)
        else: check('Schedule 17 %s row %d (%s) ties to a load on the record' % (r['sheet'], r['row'], fmt(r['amt'])), False)
    check('Schedule 17: 57 rows tie to the record’s loads to the cent, 29,406.85', len(_tied) == 57 and abs(sum(r['amt'] for r in _tied) - 29406.85) < 0.005, (len(_tied), sum(r['amt'] for r in _tied)))
    _rest = [l for i, l in enumerate(TL0) if l['actual'] and i not in _used and l['key'] not in ('WC60', 'WC01')]
    check('the record’s only figures Schedule 17 leaves blank: the 15 and 17 Sep fencing loads, 1,151.62 each', sorted((l['d'], l['actual']) for l in _rest) == [('2026-09-15', 1151.62), ('2026-09-17', 1151.62)], [(l['key'], l['d'], l['actual']) for l in _rest])
    for c in S17['changes']:   # what the pack's carrier rows should carry: Schedule 17's figure in its month, the forecast it replaces out of the same month
        mo = c['date'][:7]; T[('rec', mo)] += c['amount']
        if c['kind'] == 'forecast': T[('fc', mo)] -= c['was']
car = [r for r in cs if r[0].startswith('Carriers')]
want = [(T[('rec', '2026-09')], T[('rec', '2026-10')], T[('rec', '2026-11')]), (T[('fc', '2026-09')], T[('fc', '2026-10')], T[('fc', '2026-11')]), (T[('plan', '2026-09')], T[('plan', '2026-10')], T[('plan', '2026-11')])]
check('three carrier rows', len(car) == 3, len(car))
for k, (r, w) in enumerate(zip(car, want)):
    for j, mo in enumerate(('Sep', 'Oct', 'Nov')): eq('carriers row %d %s = the transport rows by date' % (k + 1, mo), r[7 + j], w[j])
acc = [x for x in dc['exp'] if x['k'] == 'accommodation' and x['amount']]
A = {m: r2(sum(x['amount'] for x in acc if x['d'][:7] == m)) for m in ('2026-09', '2026-10', '2026-11')}
eq('tracker accommodation Sep', A['2026-09'], 6370.36); eq('tracker accommodation Oct', A['2026-10'], 11851.89); eq('tracker accommodation Nov', A['2026-11'], 3801.71)
accr = [r for r in cs if r[0].startswith('Accommodation')]
k97 = [r for r in accr if r[3].startswith('97 ')][0]; lud = [r for r in accr if r[3].startswith('Ludwig')][0]; alf = [r for r in accr if r[3].startswith('Alfie')][0]
eq('97 nights row Oct = tracker Oct less Ludwig 655.71', k97[8], A['2026-10'] - 655.71); eq('Ludwig row = 3 x 218.57', lud[8], 3 * 218.57)
check('Ludwig row on NVAC', lud[1] == 'NVAC', lud[1])
NINE = ('2026-10-05', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12')   # v1.12: Alfie's five priced nights (12–15 Oct off the record on 1 Nov, 12727)
OFF3 = ('2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-23', '2026-10-24', '2026-10-25')   # taken off the record on 1 Nov (12685: 23–25 Oct; 12727: 12–15 Oct): he did not work then
if ALF:
    al = json.load(open(ALF))['alfie']
    un = [x for x in al if x['d'] in NINE]   # unpriced to 12640, at 223.63 from 12676
    check("Alfie's 5 nights carry 223.63 on the record (12727), as the pack says", len(un) == 5 and all(x['amt'] == 223.63 for x in un), [(x['d'], x['amt']) for x in un])
    check("Alfie's 12-15 and 23-25 Oct nights are off the record (12727)", not [x for x in al if x['d'] in OFF3], [x['d'] for x in al if x['d'] in OFF3])
    late = [x['amt'] for x in al if x['amt'] is not None and ('2026-10-26' <= x['d'] <= '2026-10-29' or '2026-11-02' <= x['d'] <= '2026-11-05')]
    check("Alfie's rate on 26-29 Oct and 2-5 Nov is 223.63 on all 8 nights", len(late) == 8 and set(late) == {223.63}, late)
    n_oct = sum(1 for x in un if x['d'][:7] == '2026-10'); n_nov = sum(1 for x in un if x['d'][:7] == '2026-11')
    check('Alfie nights in the pack: 1 Oct (5 Oct), 4 Nov', (n_oct, n_nov) == (1, 4), (n_oct, n_nov))
    eq('Alfie Oct = 1 x 223.63', alf[8], r2(n_oct * 223.63)); eq('Alfie Nov = 4 x 223.63', alf[9], r2(n_nov * 223.63)); eq('Alfie accrues October only', alf[10], r2(n_oct * 223.63))
DAN10 = ('2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13')
if NOW:   # the record as it now stands (12715): the 12640 lines less Alfie's three 23-25 Oct nights, his nine priced (12685); Daniel's ten November days back (12715)
    dn = json.load(open(NOW))
    for k in ('transport', 'transportWeights', 'fencingWeeks'):
        check('record now: %s unchanged since 12640' % k, json.dumps(dn[k], sort_keys=True) == json.dumps(dc[k], sort_keys=True))
    la_, lb_ = collections.Counter((x['d'], x['c']) for x in dc['labour']), collections.Counter((x['d'], x['c']) for x in dn['labour'])
    check("record now: labour hire = the 12640 shifts plus Daniel Gough's ten days 2-13 Nov at 634.98, nothing else", not (la_ - lb_) and sorted((lb_ - la_).elements()) == [(d, 634.98) for d in DAN10], (sorted((la_ - lb_).elements()), sorted((lb_ - la_).elements())))
    is9 = lambda x: x['k'] == 'accommodation' and x.get('who') == 'Alfie Harris' and x['d'] in NINE
    key = lambda x, blank: json.dumps({**{kk: vv for kk, vv in x.items() if kk not in ('who', 'id', 'keys')}, **({'amount': None} if blank else {})}, sort_keys=True)
    was_, now_ = collections.Counter(key(x, False) for x in dc['exp']), collections.Counter(key(x, is9(x)) for x in dn['exp'])
    gone = [json.loads(g) for g in (was_ - now_).elements()]; extra = list((now_ - was_).elements())
    check('record now: the 12640 cost lines less seven unpriced accommodation nights (12-15 and 23-25 Oct), Alfie\'s five priced', not extra and len(gone) == 7 and sorted(g['d'] for g in gone) == list(OFF3) and all(g['k'] == 'accommodation' and g['amount'] is None for g in gone), (gone, extra))
    n9 = [x for x in dn['exp'] if is9(x)]
    check('record now: Alfie\'s 5 nights at 223.63', len(n9) == 5 and all(x['amount'] == 223.63 for x in n9), [(x['d'], x['amount']) for x in n9])
    check('record now: no Alfie night on 12-15 or 23-25 Oct', not [x for x in dn['exp'] if x['k'] == 'accommodation' and x.get('who') == 'Alfie Harris' and x['d'] in OFF3])
    accn = [x for x in dn['exp'] if x['k'] == 'accommodation']
    check('record now: 105 accommodation lines, none unpriced', len(accn) == 105 and all(x['amount'] not in (None, '') for x in accn), len(accn))
    for j, m in enumerate(('2026-09', '2026-10', '2026-11')):
        eq('pack accommodation %s = the record now, to the cent' % m, sum((r[7 + j] or 0) for r in accr), r2(sum((x['amount'] or 0) for x in accn if x['d'][:7] == m)))
    eq('pack accommodation total = the record now (23,142.11)', sum((r[7] or 0) + (r[8] or 0) + (r[9] or 0) for r in accr), 23142.11)
meals = [x for x in dc['exp'] if x['k'] in ('meals', 'misc') and x['amount']]
M = {m: r2(sum(x['amount'] for x in meals if x['d'][:7] == m)) for m in ('2026-09', '2026-10', '2026-11')}
mr = [r for r in cs if r[0].startswith('Meals')]
eq('meals Sep', sum((r[7] or 0) for r in mr), M['2026-09']); eq('meals Oct', sum((r[8] or 0) for r in mr), M['2026-10']); eq('meals Nov', sum((r[9] or 0) for r in mr), M['2026-11'])
SALH = collections.defaultdict(float)
for r in LAB[2:]:
    if r and r[0][:4] == '2026' and r[3] == 'Salary' and '2026-09-14' <= r[0] <= '2026-11-13': SALH[r[0][5:7]] += float(r[4] or 0)
tot_h = sum(SALH.values()); sal = [r for r in cs if r[0].startswith('Salary')][0]
eq('salary Sep (in-window hours)', sal[7], r2(14700 * SALH['09'] / tot_h)); eq('salary Oct, with November’s share (all labour in October)', sal[8], r2(14700 - r2(14700 * SALH['09'] / tot_h))); eq('salary Nov: none (in October)', sal[9] or 0, 0); eq('salary total 14,700.00', sal[7] + sal[8] + (sal[9] or 0), 14700)
LHW = collections.defaultdict(float)
import datetime as dt
for r in LAB[2:]:
    if r and r[0][:4] == '2026' and r[3] == 'Labour hire' and r[5] not in ('', 'hours only'):
        d = dt.date.fromisoformat(r[0]); we = d + dt.timedelta(days=(6 - d.weekday())); LHW[we.isoformat()] += float(r[5])
LHWP = collections.defaultdict(float)   # labour hire by person and week on the running sheet
for r in LAB[2:]:
    if r and r[0][:4] == '2026' and r[3] == 'Labour hire' and r[5] not in ('', 'hours only'):
        d = dt.date.fromisoformat(r[0]); LHWP[(r[2], (d + dt.timedelta(days=(6 - d.weekday()))).isoformat())] += float(r[5])
# the shifts as Andrew set them on 1 Nov (Mon 2 - Fri 13 Nov): Daniel 06:30-17:00, Andrew 06:00-17:00, Alfie Mon 06:00 else 06:30 (to 17:00), Aaron Mon-Thu 06:00-17:00
LROW = collections.defaultdict(list)
for r in LAB[2:]:
    if r and r[0][:4] == '2026': LROW[(r[2], r[0])].append(r)
WANT = {'Daniel Gough': lambda wd: 10.5, 'Andrew Fisher': lambda wd: 11.0, 'Alfie Harris': lambda wd: 11.0 if wd == 0 else 10.5, 'Aaron Zelvis': lambda wd: None if wd == 4 else 11.0}
for who_, f_ in WANT.items():
    got_ = [(d, [float(x[4]) for x in LROW.get((who_, d), [])]) for d in DAN10]
    check('labour sheet: %s Mon-Fri 2-13 Nov as set on the record (%s)' % (who_, 'Mon-Thu, no Fridays' if who_ == 'Aaron Zelvis' else 'Monday 11 h, other days 10.5 h' if who_ == 'Alfie Harris' else '%s h a day' % f_(0)),
          all(g == ([f_(dt.date.fromisoformat(d).weekday())] if f_(dt.date.fromisoformat(d).weekday()) is not None else []) for d, g in got_), got_)
check("labour sheet: Daniel's ten November days at 634.98 each on the running sheet", all(len(LROW.get(('Daniel Gough', d), [])) == 1 and LROW[('Daniel Gough', d)][0][5] == '634.98' for d in DAN10))
jc = {r[3].replace('Running sheet ', ''): r for r in cs if r[0].startswith('Job Connect')}
JCPO = json.load(open(NOW.parent / 'jc_pos.json'))['amounts'] if NOW and (NOW.parent / 'jc_pos.json').exists() else {}
JCP = json.load(open(NOW.parent / 'jc_pos.json')).get('po_amounts', {}) if NOW and (NOW.parent / 'jc_pos.json').exists() else {}
check("Daniel Gough's POs 4674224 (w/e 8 Nov) and 4674225 (w/e 15 Nov), 3,052.60 each, are in the private PO file", {k: (v['amount'], v['we'], v['who']) for k, v in JCP.items()} == {'4674224': (3052.60, '2026-11-08', 'Daniel Gough'), '4674225': (3052.60, '2026-11-15', 'Daniel Gough')}, JCP)
if '4674224' in JCP:
    eq('Job Connect w/e 8 Nov = PO 4674224 (Daniel) + Kyle Gover on the running sheet', sum((jc['w/e 8 Nov'][k] or 0) for k in (7, 8, 9)), r2(JCP['4674224']['amount'] + LHW['2026-11-08'] - LHWP[('Daniel Gough', '2026-11-08')]))
    eq('Job Connect w/e 8 Nov: Kyle Gover on the running sheet = 3,023.85', LHWP[('Kyle Gover', '2026-11-08')], 3023.85)
if '4674225' in JCP:
    eq('Job Connect w/e 15 Nov = PO 4674225 (Daniel; nobody else on the running sheet that week)', sum((jc['w/e 15 Nov'][k] or 0) for k in (7, 8, 9)), JCP['4674225']['amount'])
    eq('running sheet w/e 15 Nov is Daniel alone', LHW['2026-11-15'], LHWP[('Daniel Gough', '2026-11-15')])
    check('Job Connect’s November weeks are not accrued, and sit in October with the rest of the labour', all((jc[k][10] or 0) == 0 and (jc[k][7] or 0) == 0 and (jc[k][9] or 0) == 0 and (jc[k][8] or 0) > 0 and 'taken in October' in str(jc[k][12]) for k in ('w/e 8 Nov', 'w/e 15 Nov')))
for we, key in (('2026-10-11', 'w/e 11 Oct'), ('2026-10-18', 'w/e 18 Oct'), ('2026-10-25', 'w/e 25 Oct'), ('2026-11-01', 'w/e 1 Nov')) + ((('2026-11-08', 'w/e 8 Nov'),) if '4674224' not in JCP else ()):
    if key == 'w/e 11 Oct' and '4665091' in JCPO: eq('Job Connect w/e 11 Oct = PO 4665091 (its one PO)', sum((jc[key][k] or 0) for k in (7, 8, 9)), JCPO['4665091']); continue
    if key == 'w/e 25 Oct' and {'4670882', '4671825'} <= set(JCPO): eq('Job Connect w/e 25 Oct = POs 4670882 + 4671825 (its two POs)', sum((jc[key][k] or 0) for k in (7, 8, 9)), r2(JCPO['4670882'] + JCPO['4671825'])); continue
    eq('Job Connect %s = running sheet week' % key, sum((jc[key][k] or 0) for k in (7, 8, 9)), LHW[we])
pos = {o['number']: o for o in json.load(open(PR / 'cost_sources.json'))['pos']}
for po, key in (('4657010', 'w/e 20 Sep'), ('4660565', 'w/e 27 Sep'), ('4661783', 'w/e 4 Oct')):
    eq('Job Connect %s = PO %s' % (key, po), sum((jc[key][k] or 0) for k in (7, 8, 9)), float(pos[po]['amount']))
eq('Advanced invoiced POs = 214,225.00', sum(float(pos[p]['amount']) for p in ('4647508', '4647509', '4647515', '4647517', '4647519', '4647520', '4658850')), 214225.00)
adv = [r for r in cs if r[0].startswith('Advanced')]
eq('Advanced invoiced row = the POs', sum((adv[0][k] or 0) for k in (7, 8, 9)), 214225.00)
eq('Event Portables = the four quotes', sum((r[7] or 0) + (r[8] or 0) + (r[9] or 0) for r in cs if r[0] == 'Event Portables'), 42175.00 + 51372.00 + 4850.00 + 3350.00)
POSYS = json.load(open(NOW.parent / 'po_system.json'))['pos'] if NOW and (NOW.parent / 'po_system.json').exists() else {}   # v1.13: Coates' system, 1 Nov (private)
PONOW = json.load(open(NOW.parent / 'po_record_now.json')) if NOW and (NOW.parent / 'po_record_now.json').exists() else None   # v1.13: the record's POs read after the 4669481 correction
check('the six consumables POs as Coates’ system has them are beside the record captures', len(POSYS) == 6, sorted(POSYS))
for po in ('4655573', '4663216', '4666720', '4670270', '4670876', '4669481'):
    row = [r for r in cs if r[4] == po][0]; amt_ = (row[7] or 0) + (row[8] or 0) + (row[9] or 0)
    if po in POSYS: eq('consumables PO %s at its amount in Coates’ system (qty × unit cost, ex GST)' % po, amt_, r2(POSYS[po]['qty'] * POSYS[po]['unit_cost']))
    if PONOW: eq('consumables PO %s = the record as it now stands (%s)' % (po, PONOW['version']), amt_, float(PONOW['pos'][po]['amount']))   # v1.13: 4669481 corrected to 42.33 on 1 Nov (12727 -> 12729)
    elif po == '4669481': eq('PO 4669481: the record (12640 capture) carries 42.34, one cent over the system’s 2 × 21.1650', float(pos[po]['amount']) - amt_, 0.01)
    else: eq('consumables PO %s = the record' % po, amt_, float(pos[po]['amount']))
check('every PO on the record is in the pack', all(any(p in str(r[4]) for r in cs) for p in pos), [p for p in pos if not any(p in str(r[4]) for r in cs)])

# ------------------------------------------------------------------ the pack's own cross-foots
cb = [r for r in rows('Costs by branch') if r and r[0] and not str(r[0]).startswith('Total')]
CBB = collections.defaultdict(float)
for r in cb: CBB[r[0]] += r[2]
eq('costs by supplier = costs by branch', JOB, sum(CBB.values()))
for b in ('KINP', 'STPS', 'NVAC', 'MEAD'): eq('summary costs %s = costs by branch' % b, summ[b][4], CBB[b])
eq('summary job cost = costs by supplier', summ['The job'][4], JOB)
eq('difference = revenue - costs', summ['The job'][5], summ['The job'][3] - JOB)
mu = [r for r in rows('Match-up by contract') if r]
job_row = [r for r in mu if r[0] == 'The job'][0]
eq('match-up: tied + untied = job cost', job_row[8], JOB)   # v1.13: column 3 is the V8s PO
eq('match-up: the costs listed add to the job cost', sum((r[8] or 0) for r in mu if r[0] != 'The job'), JOB)
eq('match-up: invoices = 18-invoice revenue', job_row[4], REV_TOT)
check('match-up: 18 contracts', len({r[0] for r in mu if r[0] and r[0][0].isdigit()}) == 18)
jn = [r for r in rows('Journals') if r and r[0]]
accr_j = [r for r in jn if str(r[0]).startswith('Accrual')]
eq('journals = the accrue column', sum(r[5] for r in accr_j), ACC)
check('journals total row', any(r[0] == 'Total, accruals through 31 Oct (prepared for Finance)' and abs(r[5] - ACC) < 0.005 for r in jn))
moves = [r for r in jn if str(r[0]).startswith('Branch move ·')]   # the two moves, not the header row above them
check('branch moves net to zero (two legs each)', all(re.search(r'−([\d,.]+) · \w+ \+([\d,.]+)', r[4]) and re.search(r'−([\d,.]+)', r[4]).group(1) == re.search(r'\+([\d,.]+)', r[4]).group(1) for r in moves) and len(moves) == 2, [r[4] for r in moves])
lp = [r for r in rows('Labour by person') if r and r[0]]
eq('labour hours = the labour register', sum((r[6] or 0) + (r[7] or 0) for r in lp), sum(float(r[4] or 0) for r in LAB[2:] if r and r[0][:4] == '2026'))
eq('labour hire $ by person = running sheet', sum((r[8] or 0) for r in lp), sum(float(r[5]) for r in LAB[2:] if r and r[0][:4] == '2026' and r[3] == 'Labour hire' and r[5] not in ('', 'hours only')))
eq('running sheet labour hire, job end (12715) = 41,276.59', sum(LHW.values()), 41276.59)
eq('P&L labour hire: invoices and PO amounts where there are any, the running sheet where not', sum((r[7] or 0) + (r[8] or 0) + (r[9] or 0) for r in cs if r[0].startswith('Job Connect')),
   r2(sum(LHW.values()) - 178.15 - LHW['2026-10-11'] + JCPO.get('4665091', LHW['2026-10-11']) - LHW['2026-10-25'] + (JCPO['4670882'] + JCPO['4671825'] if {'4670882', '4671825'} <= set(JCPO) else LHW['2026-10-25'])
      - (LHWP[('Daniel Gough', '2026-11-08')] - JCP['4674224']['amount'] if '4674224' in JCP else 0) - (LHWP[('Daniel Gough', '2026-11-15')] - JCP['4674225']['amount'] if '4674225' in JCP else 0)))
eq('the running sheet was 178.15 over the three invoices to 4 Oct', sum(LHW[w] for w in ('2026-09-20', '2026-09-27', '2026-10-04')) - sum(float(pos[p]['amount']) for p in ('4657010', '4660565', '4661783')), 178.15)

# ------------------------------------------------------------------ the CSV and the page say the same
tot_csv = [r for r in CS if r and r[0] == 'Total'][0]
eq('CSV Sep total', float(tot_csv[7]), SEP); eq('CSV Oct total', float(tot_csv[8]), OCT); eq('CSV Nov total', float(tot_csv[9]), NOV); eq('CSV accrue total', float(tot_csv[10]), ACC)
for label, v in (('job cost', JOB), ('accruals', ACC), ('revenue', summ['The job'][3]), ('18 invoices', REV_TOT), ('difference', summ['The job'][5]), ('Sep costs', SEP), ('Oct costs', OCT), ('Nov costs', NOV)):
    check('page shows %s %s' % (label, fmt(v)), fmt(v) in HT, fmt(v))
check('no unformatted placeholders on the page', not re.search(r'\{[a-zA-Z_]+\(', H))
prov = re.compile(r"your word|your call|your rule|\byou\b|\byour\b|ruling|on Andrew|Andrew’s word|Andrew's word|\(Andrew,|Codex|Claude|19 invoices", re.I)
texts = [HT] + [c for ws in wb.worksheets for row in ws.iter_rows(values_only=True) for c in row if isinstance(c, str)] + [c for row in CS for c in row]
bad = sorted({m.group(0) for t in texts for m in prov.finditer(t)})
check('facts only: no "your word", "your call", "Andrew, <date>", agent names or "19 invoices" in the outputs', not bad, bad)

# ------------------------------------------------------------------ v1.9: Premiair, transport by branch, forecast docket ties, references, layout
bp = json.load(open(PR / 'bp12.json'))
SUPX = (NOW.parent / 'suppliers.xlsx') if NOW else None
if SUPX and SUPX.exists():
    sx = openpyxl.load_workbook(SUPX, read_only=True, data_only=True)
    def subl(sh):
        rr = list(sx[sh].iter_rows(values_only=True)); return [dict(zip(rr[0], x)) for x in rr[1:] if x and x[0]]
    PRB = collections.defaultdict(float)
    for x in subl('9961265'):
        check('suppliers 9961265 L%s: days x daily rate = its price, account 2126' % x['Sub Rental Line No'], abs(x['Days Charged'] * x['Daily Cost Rate'] - x['GST Excl Price']) < 0.005 and x['Account Code'] == 2126)
        PRB[x['Minor Code']] += x['GST Excl Price']
    v11 = bpl = [x for x in bp['1000192'] if x.get('Line') == 1][0]
    import math
    d11 = math.ceil((dt.datetime.fromisoformat(v11['Term Date'][:10] + 'T' + v11['Term Time']) - dt.datetime.fromisoformat(v11['Start Date'][:10] + 'T' + v11['Start Time'])).total_seconds() / 86400)
    check('VMS11 on 10001927 L1 has no sub-rental line (no supplier on the line)', not v11.get('Supplier Sub Rental'))
    PRB['KINP'] += d11 * 36.25
    PRB = {k: r2(v) for k, v in PRB.items()}
    prem = [r for r in cs if r[0].startswith('Premiair')][0]
    eq('Premiair = the 9961265 cost lines + VMS11 at 36.25 x %d days' % d11, prem[8], r2(sum(PRB.values())))
    cbr = collections.defaultdict(float)
    for r in cb: cbr[(r[0], r[1])] += r[2]
    eq('Premiair on KINP (Costs by branch)', sum(v for (b, k), v in cbr.items() if b == 'KINP' and k.startswith('Premiair')), PRB['KINP'])
    eq('Premiair on NVAC: VMS24, its cost line 201.NVAC.2126', sum(v for (b, k), v in cbr.items() if b == 'NVAC' and k.startswith('Premiair')), PRB['NVAC'])
    rwl = subl('9974042'); rw = [r for r in cs if r[0].startswith('United Rentals')][0]
    eq('Royal Wolf = its cost line on 9974042 (its system line total, 32 days charged)', rw[8], r2(sum(x['GST Excl Price'] for x in rwl)))
else:
    check('the suppliers export (sub-hire cost lines) is beside the record captures', False)
cbr = collections.defaultdict(float)
for r in cb: cbr[(r[0], r[1])] += r[2]
# ------------------------------------------------------------------ v1.14: the two forklift POs (Coates' system, 1 Nov, private), a cost to Coates; their hire lines on 9961976 are own use at 0.00
FPO_ = json.load(open(NOW.parent / 'forklift_pos.json'))['pos'] if NOW and (NOW.parent / 'forklift_pos.json').exists() else {}
check('the two forklift POs as Coates’ system has them are beside the record captures', sorted(FPO_) == ['4647983', '4654789'], sorted(FPO_))
_days = lambda t: 7 * int(re.search(r'(\d+)\s*x\s*weeks', t).group(1)) + (int(re.search(r'\+(\d+)days', t).group(1)) if '+' in t else 0)
for po_, ln_ in (('4647983', 31), ('4654789', 34)):
    rr_ = [r for r in cs if str(r[4]).startswith(po_)]
    check('forklift PO %s: one row in the costs' % po_, len(rr_) == 1, len(rr_))
    if len(rr_) != 1 or po_ not in FPO_: continue
    p_ = FPO_[po_]; ex_ = r2(sum(l['qty'] * l['unit_cost'] for l in p_['lines'])); l_ = [x for x in bp['9961976'] if x['Line'] == ln_][0]
    eq('forklift PO %s at its amount in Coates’ system (qty × unit cost, ex GST)' % po_, sum((rr_[0][k] or 0) for k in (7, 8, 9)), ex_)
    eq('forklift PO %s: the screen’s Ordered (GST inclusive) = the lines’ Price Incl' % po_, p_['ordered_inc'], r2(sum(l['price_inc'] for l in p_['lines'])))
    check('forklift PO %s on %s, the branch it is raised on' % (po_, p_['branch']), rr_[0][1] == p_['branch'], (rr_[0][1], p_['branch']))
    check('forklift PO %s is not in the accruals (its status is from Coates’ system)' % po_, not rr_[0][10], rr_[0][10])
    check('9961976 L%d (%s) is own use at 0.00 on Baseplan (12): not charged to the V8s' % (ln_, l_['Description'][:34]), all((l_.get(k) or 0) == 0 for k in ('Price', 'Rate 1', 'Billed Amount', 'Prebill Amount')))
    eq('forklift PO %s on Costs by branch (%s)' % (po_, p_['branch']), sum(v for (b, k), v in cbr.items() if b == p_['branch'] and k.startswith('Forklift re-hire') and po_ in k), ex_)
    MB_ = collections.defaultdict(float)
    if po_ == '4647983':   # each PO line in the month it mostly falls in, the lines in turn from the hire start on L31
        d0 = dt.date.fromisoformat(l_['Start Date'][:10])
        for li in p_['lines']:
            n_ = _days(li['what']); days_ = [d0 + dt.timedelta(days=k) for k in range(n_)]; d0 += dt.timedelta(days=n_)
            MB_[collections.Counter(x.strftime('%m') for x in days_).most_common(1)[0][0]] += li['qty'] * li['unit_cost']
        check('4647983: the hire on 9961976 L31 starts 11 Sep and the lines run 21, 30 and 14 days', l_['Start Date'][:10] == '2026-09-11' and [_days(li['what']) for li in p_['lines']] == [21, 30, 14])
    else:
        check('4654789: AT009 on 9961976 L34, 17–18 Sep', l_['Start Date'][:10] == '2026-09-17' and l_['Expected Term Date'][:10] == '2026-09-18'); MB_['09'] += ex_
    check('forklift PO %s by month = its lines’ dates (Sep %s · Oct %s · Nov %s)' % ((po_,) + tuple(fmt(MB_[k]) for k in ('09', '10', '11'))), all(abs((rr_[0][7 + j] or 0) - MB_[k]) < 0.005 for j, k in enumerate(('09', '10', '11'))), rr_[0][7:10])
    mf_ = [r for r in mu if r[0] == '9961976' and str(r[7]) == po_]
    check('match-up: PO %s against 9961976 at %s' % (po_, fmt(ex_)), len(mf_) == 1 and abs((mf_[0][8] or 0) - ex_) < 0.005, mf_)
TLP = (NOW.parent / 'transport_loads.json') if NOW else None
if TLP and TLP.exists():
    TLd = json.load(open(TLP))['loads']; amt_ = lambda l: (l['actual'] or 0) if l['actual'] else (l['f'] or 0)
    if S17:   # v1.13: Schedule 17's figures on the loads they change; the loads it adds
        for c in S17['changes']:
            if c['kind'] == 'missing':
                TLd.append({'key': c['ref'], 'd': c['date'], 'b': c['branch'], 'src': 'schedule17', 'item': c['item'], 'discipline': c['discipline'], 'actual': c['amount'], 'f': None, 'planned': False, 'dd': c['dd']}); continue
            mt = c['match']
            for l in TLd:
                if l['key'] == mt['key'] and l['d'] == mt['d'] and l['planned'] == mt['planned'] and (not mt.get('item') or l['item'] == mt['item']): l.update(actual=c['amount'], f=None, dd=((l['dd'] or '') + ' ' + c['dd']).strip())
    TB2 = collections.defaultdict(float)
    for l in TLd:
        a_ = amt_(l)
        if not a_: continue
        if (l['discipline'] or '') == 'Generators': b_ = 'NVAC'          # v1.13, Andrew, 1 Nov: generators and forklifts belong to their branches
        elif (l['discipline'] or '') == 'Access & plant': b_ = 'MEAD'
        elif l['b']: b_ = l['b']
        elif l['src'] == 'fencing' or (l['discipline'] or '').lower() == 'fencing': b_ = 'STPS'
        else:
            it = (l['item'] or '').upper()
            b_ = 'MEAD' if it.startswith('FORKLIFT') else 'STPS' if it.startswith('VMS') else 'NVAC' if it.startswith('100KVA') else 'KINP' if it.startswith(('BUILDING', 'EVENT CONTAINER', 'FRIDGE')) else None
        if b_ is None: check('every transport load has a branch rule (%s %s)' % (l['d'], l['item']), False)
        else: TB2[b_] += a_
    eq('transport loads = the carriers rows', sum(TB2.values()), sum((r[7] or 0) + (r[8] or 0) + (r[9] or 0) for r in car))
    for b in ('KINP', 'STPS', 'NVAC', 'MEAD'):
        eq('transport %s on Costs by branch = its loads (record branch, else what the load carries)' % b, sum(v for (bb, k), v in cbr.items() if bb == b and k.startswith('Transport')), r2(TB2[b]))
    dd2c = {str(x['Delivery Docket']): str(x['Hire Agreement']) for x in bp['Delivery Dockets']}
    FT = collections.defaultdict(float); fmiss = fnone = 0.0
    for l in TLd:
        if l['actual'] or not l['f']: continue
        nums = re.findall(r'\b(2\d{7})\b', l['dd'] or ''); cs_ = sorted({dd2c[x] for x in nums if x in dd2c})
        if cs_: FT[' + '.join(cs_)] += l['f']
        elif nums: fmiss += l['f']
        else: fnone += l['f']
    muf = collections.defaultdict(float)
    for r in mu:
        if r[0] and r[0][0].isdigit() and str(r[6]).startswith('Carriers: forecast load'): muf[r[0]] += r[8] or 0
    check('match-up: forecast loads tied by their docket = the loads', {k: r2(v) for k, v in muf.items()} == {k: r2(v) for k, v in FT.items()}, (dict(muf), dict(FT)))
    eq('match-up: forecast loads with no docket', sum((r[8] or 0) for r in mu if r[0] == 'not tied to one contract' and str(r[6]).startswith('Carriers: forecast loads with no docket')), fnone)
    eq('match-up: the forecast load with a docket not in Baseplan (12)', sum((r[8] or 0) for r in mu if r[0] == 'not tied to one contract' and str(r[6]).startswith('Carriers: a forecast load with a docket')), fmiss)
alltext = ' '.join(texts)
check('no invoice-line numbers in contract-line form (L82, L118, 9994954 L11)', not re.search(r'\bL82\b|\bL118\b|9994954[^.;]{0,40}\bL11\b', alltext))
check('contract lines L140, L163 and L13 are named', all(x in HT for x in ('L140', 'L163', 'L13')))
check('PM labour 15.22 h, not "15 h"', '15.22 h' in HT and not re.search(r'(?<![\d.,])15 h\b', alltext))   # v1.12: a decimal such as 27.15 h is not "15 h"
check('Q6846 is water deliveries and a drinking-water tank', 'drinking-water tank' in HT and 'build toilets' not in alltext)
check('page title names the pack', 'October month-end' not in re.findall(r'<title>([^<]*)</title>', H)[0])
check('accommodation rows carry account 3520', all(r[2] == '3520' for r in accr), [r[2] for r in accr])
ev = [r for r in LAB[2:] if r and r[0][:4] == '2026' and r[2] in ('Frank Devilles', 'Ludwig Chee')]
check('labour sheet: the event pair on NVAC (6 rows, no KINP hours)', len(ev) == 6 and all(r[6].startswith('NVAC') and 'KINP' not in r[6] for r in ev), [r[6] for r in ev])
ct = [r for r in CS if r and r[0] == 'Total, 18 invoices']
check('CSV: revenue total row = the 18 invoices', len(ct) == 1 and abs(float(ct[0][4]) - REV_TOT) < 0.005)
check('CSV: the November forecast row and the removed 25124396 row', any(r and r[0] == 'November forecast' and r[4] == '839.07' for r in CS) and any(r and r[0] == '25124396' and r[3] == 'removed' for r in CS))
rvt = [r for r in rows('Revenue by invoice') if r and str(r[0]).startswith('Total')]
check('workbook: revenue total row = the 18 invoices', len(rvt) == 1 and abs(rvt[0][5] - REV_TOT) < 0.005)
cst = [r for r in rows('Costs by supplier') if r and r[0] == 'Total']
check('workbook: costs by supplier total row', len(cst) == 1 and all(abs(cst[0][7 + j] - v) < 0.005 for j, v in enumerate((SEP, OCT, NOV, ACC))))
cbt = [r for r in rows('Costs by branch') if r and str(r[0]).startswith('Total')]
check('workbook: costs by branch totals (four branches and the job)', len(cbt) == 5 and abs([r for r in cbt if r[0] == 'Total, the job'][0][2] - JOB) < 0.005 and all(abs(r[2] - CBB[r[0][6:]]) < 0.005 for r in cbt if r[0] != 'Total, the job'))
check('workbook: accruals vs charges, a total per supplier', len([r for r in rows('Accruals vs charges') if r and str(r[0]).startswith('Total, ')]) == 4)
check('workbook: hours shown to two decimals', all(c.number_format == '#,##0.00' for row in wb['Labour by person'].iter_rows(min_row=2, min_col=7, max_col=8) for c in row if c.value is not None))
TITLE16 = 'GC500 P&L · job position at 31 Oct 2026 · pack v1.16'
check('page title and heading: the dated job position, pack v1.16 (Codex v1.15 recheck item 4)', html.unescape(re.findall(r'<title>([^<]*)</title>', H)[0]) == TITLE16 == html.unescape(re.sub(r'<[^>]+>', '', re.findall(r'<h1>(.*?)</h1>', H)[0])), (re.findall(r'<title>([^<]*)</title>', H), re.findall(r'<h1>(.*?)</h1>', H)))
check('the page names record 12727 and Daniel Gough’s POs 4674224 and 4674225', all(x in HT for x in ('record (12727)', '4674224', '4674225')))
# v1.14: no further Job Connect paperwork is held (1 Nov); the weeks without an invoice are carried at the running sheet or the PO amounts, and every running-sheet week has its row
check('open items: the Job Connect weeks without an invoice are carried at the running sheet, no further paperwork held', any('Carried at the running sheet until invoiced: w/e 18 Oct' in str(r[0]) and 'no further Job Connect paperwork is held' in str(r[0]) and 'Still needed' not in str(r[0]) for r in rows('Open items') if r))
_wk = lambda w: 'w/e %d %s' % (int(w[8:10]), {'09': 'Sep', '10': 'Oct', '11': 'Nov'}[w[5:7]])
check('every Job Connect week on the running sheet has its row in the costs (w/e 20 Sep to w/e 15 Nov)', sorted(_wk(w) for w in LHW) == sorted(jc) and len(jc) == 9, (sorted(_wk(w) for w in LHW), sorted(jc)))
check('PO 4658653 is not in the pack (no running-sheet week is without its PO or invoice)', not any('4658653' in t for t in texts) and '4658653' not in H)
# v1.11: Job Connect's supplier in Coates' system (code and registered name, from the private PO file) on every Job Connect line, its accrual and its open item
JCS_ = json.load(open(NOW.parent / 'jc_pos.json')).get('supplier', {}) if NOW and (NOW.parent / 'jc_pos.json').exists() else {}
_nm = ' '.join(w if '/' in w else w.capitalize() for w in str(JCS_.get('name', '')).split())
check('Job Connect supplier code and name are in the private PO file', bool(JCS_.get('code')) and bool(_nm) and JCS_.get('trading_as') == 'Job Connect', JCS_)
check('every Job Connect line names the supplier (%s, %s)' % (JCS_.get('code'), _nm), all((JCS_.get('code', '?') in r[0]) and (_nm in r[0]) for r in cs if r[0].startswith('Job Connect')) and sum(1 for r in cs if r[0].startswith('Job Connect')) == 9)
check('the Job Connect accrual and open item name the supplier', any(str(r[0]).startswith('Accrual · Job Connect (' + _nm) and JCS_.get('code', '?') in str(r[0]) for r in jn) and any(str(r[0]).startswith('Job Connect (' + _nm) for r in rows('Open items') if r))
epj = [r for r in jn if str(r[0]).startswith('Accrual · Event Portables')]
check('journals: Event Portables split 2126 hire / 3325 servicing = 101,747.00', len(epj) == 2 and abs(sum(r[5] for r in epj) - 101747.00) < 0.005 and any('3325' in r[3] for r in epj) and any('2126' in r[3] for r in epj))
# ------------------------------------------------------------------ v1.10: the final P&L as data (what the page's P&L tab carries) = the workbook, to the cent
JP = PK / 'GC500_PL_final.json'
if JP.exists():
    J = json.load(open(JP, encoding='utf-8'))
    check('final P&L data: pack v1.16 on record 12727, as at 31 Oct 2026', (J['pack'], J['record'], J['asAt']) == ('v1.16', 12727, '2026-10-31'), (J['pack'], J['record'], J['asAt']))
    eq('final P&L data: revenue = the summary', J['revenue']['total'], summ['The job'][3]); eq('final P&L data: 18 invoices', J['revenue']['invoices'], REV_TOT)
    eq('final P&L data: November forecast 839.07', J['revenue']['novForecast'], 839.07)
    for k_, v_ in (('sep', SEP), ('oct', OCT), ('nov', NOV), ('total', JOB)): eq('final P&L data: costs %s = the costs by supplier' % k_, J['costs'][k_], v_)
    eq('final P&L data: to accrue = the journals', J['accrue'], ACC); eq('final P&L data: difference = the summary', J['difference'], summ['The job'][5])
    for bj in J['branches']:
        sb = summ[bj['b']]
        check('final P&L data: %s invoiced, forecast, revenue, costs, difference = the summary' % bj['b'], all(abs(a - (b or 0)) < 0.005 for a, b in zip((bj['invoiced'], bj['novForecast'], bj['revenue'], bj['costs'], bj['difference']), sb[1:6])), (bj, sb))
        eq('final P&L data: %s cost lines add to its costs' % bj['b'], sum(v for _, v in J['branchLines'][bj['b']]), bj['costs'])
    check('final P&L data: every cost line = the costs by supplier sheet (%d lines)' % len(cs), len(J['lines']) == len(cs) and all(l['supplier'] == r[0] and all(abs(l[k] - (r[i] or 0)) < 0.005 for k, i in (('sep', 7), ('oct', 8), ('nov', 9), ('accrue', 10))) for l, r in zip(J['lines'], cs)))
    eq('final P&L data: suppliers add to the job cost', sum(x['total'] for x in J['suppliers']), JOB)
    check('final P&L data: the journals = the accruals on the Journals sheet', len(J['journals']) == len(accr_j) and all(abs(j['amount'] - r[5]) < 0.005 for j, r in zip(J['journals'], accr_j)))
    check('final P&L data: the open items = the Open items sheet', J['open'] == [r[0] for r in rows('Open items') if r and r[0]])
    check('final P&L data: facts only (no "your word", agent names)', not prov.search(json.dumps(J, ensure_ascii=False)), sorted({m.group(0) for m in prov.finditer(json.dumps(J, ensure_ascii=False))}))
else:
    check('final P&L data (GC500_PL_final.json) is beside the pack', False)
# ------------------------------------------------------------------ v1.12: labour charged by branch, worked out again from the invoices; the EP 7 units not mentioned
LCA = collections.defaultdict(float); LCN = collections.Counter(); LCX = []
for i in keep:
    b = FIX.get(i['invoice'], i.get('bp_branch'))
    for l in i['lines']:
        if re.search(r'\bLABOUR\b', l.get('raw') or ''): LCA[b] += l['line_total']; LCN[b] += 1; LCX.append((b, i['invoice'], l['line_total']))
LCA = {b: r2(LCA.get(b, 0)) for b in ('KINP', 'STPS', 'NVAC', 'MEAD')}
check('labour charged, from the invoices: 26 lines coded LABOUR', sum(LCN.values()) == 26, dict(LCN))
lcs = {r[0]: r for r in rows('Labour charged') if r and r[0] in ('KINP', 'STPS', 'NVAC', 'MEAD', 'Total, the job')}
for b in ('KINP', 'STPS', 'NVAC', 'MEAD'): eq('labour charged %s (workbook) = the invoices\' LABOUR lines' % b, lcs[b][1], LCA[b])
eq('labour charged, the job (workbook) = the invoices', lcs['Total, the job'][1], sum(LCA.values()))
lhb = {b: r2(sum(v for (bb, k), v in cbr.items() if bb == b and k.startswith('Labour hire'))) for b in ('KINP', 'STPS', 'NVAC', 'MEAD')}
for b in ('KINP', 'STPS', 'NVAC', 'MEAD'):
    eq('labour hire already in Installs %s = Costs by branch' % b, lcs[b][3] or 0, lhb[b]); eq('left for people\'s cost %s = charged less labour hire' % b, lcs[b][4] or 0, r2(LCA[b] - lhb[b]))
lls = [r for r in rows('Labour lines') if r and r[0] in ('KINP', 'STPS', 'NVAC', 'MEAD')]
check('Labour lines sheet: every LABOUR line, amount for amount', sorted((r[0], str(r[1]), round(r[8], 2)) for r in lls) == sorted((b, str(iv), round(a, 2)) for b, iv, a in LCX), len(lls))
if JP.exists():
    LJ = J.get('labourCharged', {})
    check('final P&L data: labour charged by branch = the invoices, and what is left = charged less labour hire', all(abs(x['charged'] - LCA[x['b']]) < 0.005 and abs(x['installLabourHire'] - lhb[x['b']]) < 0.005 and abs(x['left'] - r2(LCA[x['b']] - lhb[x['b']])) < 0.005 for x in LJ.get('branches', [])) and len(LJ.get('branches', [])) == 4)
    check('final P&L data: the 26 labour lines', len(LJ.get('lines', [])) == 26 and abs(sum(x['amount'] for x in LJ['lines']) - sum(LCA.values())) < 0.005)
check('the page has the labour-charged section and its total', '2d · Labour we charged the V8s, by branch' in HT and fmt(sum(LCA.values())) in HT)
check('the Event Portables units at excluded references are not mentioned (Andrew, 1 Nov)', not any(('195 units' in t) or ('735.00' in t) for t in texts + [json.dumps(J, ensure_ascii=False) if JP.exists() else '']))
# ------------------------------------------------------------------ v1.15: every PO and every hire contract named, and everything ties (Andrew, 1 Nov:
#                                                                     "Please make sure we mentioned purchase order numbers. And hire contract numbers. Everything must talk to each other.")
check('Costs by supplier: every line names its PO, or says there is none', all(str(r[4] or '').strip() for r in cs), [r[0] for r in cs if not str(r[4] or '').strip()])
check('Costs by supplier: every line names the hire contract it is charged on, or why none', all(str(r[6] or '').strip() for r in cs), [r[0] for r in cs if not str(r[6] or '').strip()])
check('Costs by branch: every line names its POs, or says there is none', all(re.search(r'\bPOs?\b|no PO', str(r[1])) for r in cb), [r[1][:60] for r in cb if not re.search(r'\bPOs?\b|no PO', str(r[1]))])
check('Journals: every accrual and branch move names its PO, or says there is none', all(str(r[1] or '').strip() for r in accr_j + moves), [r[0] for r in accr_j + moves if not str(r[1] or '').strip()])
pr_ = [r for r in rows('Purchase orders') if r and r[0]]
pre = [r for r in pr_ if re.fullmatch(r'4\d{6}', str(r[0]))]; prn = [r for r in pr_ if r[0] == 'none']
PO_LINES = set(re.findall(r'\b4\d{6}\b', ' '.join(str(r[4]) for r in cs)))
check('PO register: every PO number on the cost lines, once each (%d)' % len(pre), sorted(r[0] for r in pre) == sorted(PO_LINES) and len(pre) == len(PO_LINES) == 27, sorted(PO_LINES ^ {r[0] for r in pre}))
check('PO register: every PO on the record is in it', set(pos) <= {r[0] for r in pre}, sorted(set(pos) - {r[0] for r in pre}))
PA = {r[0]: r[5] for r in pre}
for p_ in ('4647508', '4647509', '4647515', '4647517', '4647519', '4647520', '4658850', '4657010', '4660565', '4661783'):
    eq('PO register %s = its amount on the record' % p_, PA[p_], float(pos[p_]['amount']))
eq('PO register 4647522 = the event-week accrual (Journals)', PA['4647522'], [r[5] for r in accr_j if r[1] == '4647522'][0])
eq('PO register 4647523 = the demob week 1 accrual + the demob week 2 forecast', PA['4647523'], [r[5] for r in accr_j if r[1] == '4647523'][0] + sum((r[9] or 0) for r in cs if r[0].startswith('Advanced') and str(r[4]).startswith('4647523 (demob), open')))
for p_ in ('4665091', '4670882', '4671825'):
    if p_ in JCPO: eq('PO register %s = its Job Connect invoice' % p_, PA[p_], JCPO[p_])
for p_ in ('4674224', '4674225'):
    if p_ in JCP: eq('PO register %s = its PO amount (November)' % p_, PA[p_], JCP[p_]['amount'])
check('the record names the people on each w/e 18 Oct PO', pos['4667755']['what'].startswith('Eric Lucian and Daniel Gough') and pos['4668970']['what'].startswith('Kyle Gover'), (pos['4667755']['what'], pos['4668970']['what']))
eq('PO register 4667755 = the running sheet for Daniel Gough and Eric Lucian, w/e 18 Oct', PA['4667755'], LHWP[('Daniel Gough', '2026-10-18')] + LHWP[('Eric Lucian', '2026-10-18')])
eq('PO register 4668970 = the running sheet for Kyle Gover, w/e 18 Oct', PA['4668970'], LHWP[('Kyle Gover', '2026-10-18')])
for p_ in POSYS: eq('PO register %s = Coates’ system (qty × unit cost)' % p_, PA[p_], r2(POSYS[p_]['qty'] * POSYS[p_]['unit_cost']))
FPO2 = json.load(open(NOW.parent / 'forklift_pos.json'))['pos'] if NOW and (NOW.parent / 'forklift_pos.json').exists() else {}
for p_ in FPO2: eq('PO register %s = Coates’ system (its lines’ qty × unit cost)' % p_, PA[p_], r2(sum(l['qty'] * l['unit_cost'] for l in FPO2[p_]['lines'])))
prt = {r[0]: r[5] for r in pr_ if str(r[0]).startswith(('Total', 'The job'))}
eq('PO register: the POs add to their total row', sum(r[5] for r in pre), prt.get('Total, 27 POs'))
eq('PO register: the costs with no PO add to their total row', sum(r[5] for r in prn), prt.get('Total, no PO'))
eq('PO register: with a PO + no PO = the job cost', sum(r[5] for r in pre) + sum(r[5] for r in prn), JOB); eq('PO register: its job cost row', prt.get('The job cost'), JOB)
NOPO_SUP = collections.defaultdict(float)
for r in prn: NOPO_SUP[r[1]] += r[5]
CS_SUP = collections.defaultdict(float)
for r in cs:
    if str(r[4]).startswith('none'): CS_SUP[r[0]] += (r[7] or 0) + (r[8] or 0) + (r[9] or 0)
jcn_ = [k for k in NOPO_SUP if k.startswith('Job Connect')]   # Job Connect is checked on its own below (one of its no-PO weeks shares a line with PO 4674224)
check('PO register: every cost line with no PO is listed with why, supplier by supplier', all(abs(NOPO_SUP[k] - v) < 0.005 for k, v in CS_SUP.items() if v and not k.startswith('Job Connect')) and set(NOPO_SUP) == set(k for k, v in CS_SUP.items() if v) and len(jcn_) == 1, {k: (round(NOPO_SUP[k], 2), round(v, 2)) for k, v in CS_SUP.items()})
eq('PO register: Job Connect weeks with no PO yet = w/e 1 Nov + Kyle Gover’s w/e 8 Nov on the running sheet', NOPO_SUP[jcn_[0]] if jcn_ else 0, LHW['2026-11-01'] + LHWP[('Kyle Gover', '2026-11-08')])
check('the page has section 3c and the PO and no-PO totals', '3c · Every purchase order in the costs' in HT and fmt(sum(r[5] for r in pre)) in HT and fmt(sum(r[5] for r in prn)) in HT)
if JP.exists():
    check('final P&L data: each cost line carries its hire contract, as on Costs by supplier', len(J['lines']) == len(cs) and all(l['contract'] == r[6] and l['po'] == r[4] for l, r in zip(J['lines'], cs)))
    check('final P&L data: the 18 invoices, each with its hire contract, the V8s’ PO, branch and amount, as on Revenue by invoice',
          len(J['invoices']) == 18 and all((x['inv'], x['contract'], x['customerPO'], x['branch']) == (r[0], r[2], r[3], r[4].split(' ')[0]) and abs(x['ex'] - r[5]) < 0.005 for x, r in zip(J['invoices'], rv)))
    eq('final P&L data: the invoices add to the 18-invoice revenue', sum(x['ex'] for x in J['invoices']), REV_TOT)
    check('final P&L data: the November forecast line is 9961976 L61, 839.07 on NVAC', [(x['contract'], x['line'], x['branch'], x['amount']) for x in J['novForecastLines']] == [('9961976', 'L61', 'NVAC', 839.07)])
    MUR = collections.defaultdict(float); MUI = {}
    for r in mu:
        if r[0] and r[0][0].isdigit(): MUR[r[0]] += r[8] or 0; MUI.setdefault(r[0], (r[2], r[3], r[4]))
    check('final P&L data: every hire contract, its V8s PO, invoice, revenue and the costs against it, as on the match-up sheet',
          len(J['contracts']) == 18 and all((x['customerPO'], x['invoice']) == (MUI[x['contract']][0], MUI[x['contract']][1]) and abs(x['revenue'] - MUI[x['contract']][2]) < 0.005 and abs(x['costTotal'] - MUR[x['contract']]) < 0.005 for x in J['contracts']))
    eq('final P&L data: costs not tied to one contract = the match-up sheet', sum(x['amount'] for x in J['notTied']), sum((r[8] or 0) for r in mu if r[0] == 'not tied to one contract'))
    eq('final P&L data: tied + not tied = the job cost', J['matchTotals']['tied'] + J['matchTotals']['notTied'], JOB)
    check('final P&L data: the PO register = the Purchase orders sheet, PO for PO', [(x['po'], x['amount']) for x in J['purchaseOrders']] == [(r[0], r[5]) for r in pre] and abs(J['poTotals']['total'] - JOB) < 0.005)
# ------------------------------------------------------------------ v1.15: the event-night block cleans tie (Event Portables' 51 = L142 24 + L143 24 + the WC-TV block's 3)
_l = {x['Line']: x for x in bp['9968955']}
check('9968955 L142: 24 tank pump-outs at 624.60, billed 14,990.40', (_l[142]['Quantity'], _l[142]['Price'], round(_l[142]['Billed Amount'], 2)) == (24, 624.6, 14990.4), (_l[142]['Quantity'], _l[142]['Price'], _l[142]['Billed Amount']))
check('9968955 L143: Cleaning & Restock Sewer Connect, 24 at 260.25, billed 0.00', (_l[143]['Item'], _l[143]['Quantity'], _l[143]['Price'], _l[143]['Billed Amount']) == ('CLEAN', 24, 260.25, 0), (_l[143]['Item'], _l[143]['Quantity'], _l[143]['Price'], _l[143]['Billed Amount']))
check('9973977 (the WC-TV block) has no cleaning line', not any(re.search(r'clean', str(x.get('Description')) + str(x.get('Item')), re.I) for x in bp['9973977']))
_ep = json.load(open(PR / 'ep_detail.json'))
_eps = json.dumps(_ep); _m = re.search(r'"description": "Toilet Block Cleaning", "card_line": "Sewer Connect Units Clean & Restock", "quantity": (\d+), "rate": (\d+)', _eps)
check('Event Portables cleaned 51 blocks at 185.00 (Q6844) = 18 tank + 6 WC31 + 24 sewer-connected + 3 WC-TV', bool(_m) and int(_m.group(1)) == 51 == 18 + 6 + 24 + 3 and int(_m.group(2)) == 185, _m and _m.groups())
check('the open items say how the 51 block cleans tie and what L143 is', any('WC09, WC15, WC16 and WC17' in str(r[0]) and 'T0243' in str(r[0]) for r in rows('Open items') if r) and any('the eight sewer-connected blocks WC09, WC15, WC16 and WC17' in str(r[0]) and '780.75' in str(r[0]) for r in rows('Open items') if r))
# ------------------------------------------------------------------ v1.16: Codex's v1.15 recheck corrections (PACK_v115_RECHECK.md items 1-5 and 7; item 6 is the tab's print strip)
_alltx = texts + ([json.dumps(J, ensure_ascii=False)] if JP.exists() else [])
_fk = [r for r in cs if r[0].startswith('Queensland Forklifts') and str(r[4]).startswith('4647983')]
check('item 1: the 4647983 forklift line says its months are estimated from the PO’s durations, not service dates', len(_fk) == 1 and 'months estimated' in str(_fk[0][11]) and 'not service dates' in str(_fk[0][11]) and 'months estimated' in str(_fk[0][12]), _fk and (_fk[0][11], _fk[0][12]))
if JP.exists():
    _fj = [l for l in J['lines'] if l['supplier'].startswith('Queensland Forklifts') and str(l['po']).startswith('4647983')]
    check('item 1: the data carries the same qualification', len(_fj) == 1 and 'not service dates' in _fj[0]['basis'] and 'months estimated' in _fj[0]['status'])
check('item 1: the open items and the PO register qualify the forklift months', any('months estimated from the PO’s approximate durations (not service dates)' in str(r[0]) for r in rows('Open items') if r) and any(r[0] == '4647983' and 'months estimated' in str(r[6]) for r in pre))
check('item 2: Royal Wolf is described by its system line total (1,364.23 for 32 days; 42.63 a day is rounded)', '1,364.23 for 32 days' in HT and '32 × 42.63 is 1,364.16' in HT and not any('32 days at 42.63' in t for t in _alltx))
_rwc = [r for r in cs if 'Royal Wolf' in r[0]]
check('item 2: the Royal Wolf cost line’s basis names the line total and the rounded rate', len(_rwc) == 1 and '1,364.23 for 32 days' in str(_rwc[0][3]) and 'rounded' in str(_rwc[0][3]) and '32 × 42.63 is 1,364.16' in str(_rwc[0][3]), _rwc and _rwc[0][3])
if JP.exists():
    _fr = [x for x in J['labourCharged']['lines'] if x.get('hours') is not None and abs(float(x['hours']) - round(float(x['hours']))) > 1e-9]
    _nw = {5: 'Five', 6: 'Six', 7: 'Seven'}.get(len(_fr))
    check('item 3: the labour note’s count = the lines with part hours (%d)' % len(_fr), bool(_nw) and any(t.startswith(_nw + ' lines print whole hours but charge part hours') for t in J['labourCharged']['notes']) and not any('Five lines print' in t for t in _alltx if _nw != 'Five'), (len(_fr), [t[:40] for t in J['labourCharged']['notes']]))
for t_ in ('Difference so far', 'not a margin yet', 'Accruals through 31 Oct (the journals prepared for Finance', 'carrier loads and the consumables and forklift POs are not in them: Finance to confirm',
           'Coates wages are hours only, not yet costed', '1 · Costs by supplier and month, with the accruals through 31 Oct', '5 · Journals prepared for Finance, through 31 Oct', 'Accruals through 31 Oct, prepared for Finance (each reverses on 1 Nov'):
    check('item 4: the page says “%s”' % t_, t_ in HT)
check('item 4: no “To accrue”, “, final ·” or “Journals at 31 Oct” left on the page or in the workbook', not any(re.search(r'To accrue|, final ·|Journals at 31 Oct|Accrue 31 Oct|Accrue at 31 Oct', t) for t in texts), sorted({m_.group(0) for t in texts for m_ in re.finditer(r'To accrue|, final ·|Journals at 31 Oct|Accrue 31 Oct|Accrue at 31 Oct', t)}))
check('item 4: the revenue tile shows the 18 invoices and the November forecast, each with its figure', ('the 18 invoices ' + fmt(REV_TOT)) in HT and 'the November forecast 839.07 (9961976 L61), not invoiced yet' in HT)
check('item 4: the accrual column carries the same name (workbook and CSV)', wb['Costs by supplier'].cell(1, 11).value == 'Accruals through 31 Oct' == CS[1][10], (wb['Costs by supplier'].cell(1, 11).value, CS[1][10:11]))
check('item 4: the Summary sheet note shows the invoices and the forecast, each with its figure, and says the difference is not a margin yet', any(isinstance(c, str) and ('the 18 invoices, ' + fmt(REV_TOT)) in c and 'the November forecast, 839.07' in c and 'not a margin yet' in c for row in wb['Summary'].iter_rows(values_only=True) for c in row))
_wbm = openpyxl.load_workbook(PK / 'GC500_PL_final.xlsx')
for sh_ in ('Schedule 17 transport', 'Labour charged', 'Summary'):
    ws_ = _wbm[sh_]; nc_ = ws_.max_column; mr_ = {r.min_row: r for r in ws_.merged_cells.ranges}
    notes_ = [c[0] for c in ws_.iter_rows(min_row=2) if isinstance(c[0].value, str) and len(c[0].value) > 40 and all(x.value in (None, '') for x in c[1:])]
    tw_ = sum((ws_.column_dimensions[openpyxl.utils.get_column_letter(i_)].width or 10) for i_ in range(1, nc_ + 1))
    ok_ = [c for c in notes_ if c.row in mr_ and (mr_[c.row].min_col, mr_[c.row].max_col, mr_[c.row].max_row) == (1, nc_, c.row) and c.alignment.wrap_text and (ws_.row_dimensions[c.row].height or 0) >= 15 * -(-len(c.value) // max(1, int(tw_ * 1.05))) - 0.01]
    check('item 5: %s, every note row spans the table (A to %s) and is tall enough for its text (%d notes)' % (sh_, openpyxl.utils.get_column_letter(nc_), len(notes_)), len(notes_) > 0 and len(ok_) == len(notes_), [(c.row, c.value[:40]) for c in notes_ if c not in ok_])
if S17: check('item 5: the Schedule 17 notes are in the merged rows, word for word', all(any(c.value == t for c in _wbm['Schedule 17 transport']['A']) for t in (J['schedule17']['notes'] if JP.exists() else [])))
_pc = re.search(r'@media print\{(.*?)\}\s*</style>', H, re.S) or re.search(r'@media print\s*\{(.*)', H, re.S)
check('item 7: the print styles set readable text (body 11px, tables 10px, headings 9.5px)', bool(_pc) and 'font-size:11px' in _pc.group(1) and 'table{min-width:0!important;width:100%!important;font-size:10px}' in _pc.group(1) and 'th{font-size:9.5px}' in _pc.group(1))
# ------------------------------------------------------------------ v1.16: all the labour in October (Andrew, 1 Nov 2026: "We want all labour costs. As in all hrs to all fall into october ... from november for. Coates wages. Salary. Job connect")
_labl = [r for r in cs if r[0].startswith(('Salary', 'Job Connect'))]
check('labour in October: no salary or Job Connect line carries a November amount (%d lines)' % len(_labl), len(_labl) == 10 and all(not (r[9] or 0) for r in _labl), [(r[0][:12], r[3], r[9]) for r in _labl if r[9]])
_nlh = r2(sum((r[9] or 0) for r in cs if r[0].startswith(('Salary', 'Job Connect', 'Coates'))))
eq('labour in October: the November column holds no labour', _nlh, 0)
_regN = collections.defaultdict(float); _regO = collections.defaultdict(float)
for r in LAB[2:]:
    if r and r[0][:4] == '2026':
        (_regN if r[0][5:7] == '11' else _regO if r[0][5:7] == '10' else collections.defaultdict(float))[r[2]] += float(r[4] or 0)
_lpO = collections.defaultdict(float)
for r in lp: _lpO[r[0]] += (r[7] or 0)
check('labour in October: each person’s October hours = the register’s October + November hours (Labour by person)', all(abs(_lpO[w] - (_regO[w] + _regN[w])) < 0.005 for w in set(_regO) | set(_regN)), {w: (round(_lpO[w], 2), round(_regO[w] + _regN[w], 2)) for w in set(_regO) | set(_regN) if abs(_lpO[w] - (_regO[w] + _regN[w])) >= 0.005})
_lph = [c.value for c in wb['Labour by person'][1]]
check('labour in October: the hours tables have September and October columns only (workbook, page, CSV)', _lph[6:9] == ['Sep h', 'Oct h (with 1–13 Nov)', 'Labour hire $ (running sheet)'] and len(_lph) == 9 and 'November h (to 13 Nov)' not in H and '#Nov h' not in H and not any('November h' in ' '.join(r) for r in CS if r), _lph)
_cwN = r2(sum(float(r[4] or 0) for r in LAB[2:] if r and r[0][5:7] == '11' and r[3] == 'Coates wages'))
check('labour in October: the open item for Finance names November’s labour (3,176.82 salary, 9,129.05 Job Connect, %s h of Coates wages) and keeps it out of the accruals' % fmt(_cwN), any(str(r[0]).startswith('Labour in October:') and '3,176.82' in str(r[0]) and '9,129.05' in str(r[0]) and (('{:,.2f}'.format(_cwN)).rstrip('0').rstrip('.') + ' h of Coates wages') in str(r[0]) and 'Finance to confirm whether to provision it' in str(r[0]) for r in rows('Open items') if r))
eq('labour in October: the accruals are unchanged (work done to 31 Oct)', ACC, 195076.18)
eq('labour in October: November’s labour moved = 12,305.87 (October up, November down by it)', r2(OCT - 379590.09), 12305.87)
# ------------------------------------------------------------------ v1.16: the elite check of live v12.75 (1 Nov 2026), the findings verified against the sources
_PSY = json.load(open(NOW.parent / 'po_system.json'))['pos'] if NOW and (NOW.parent / 'po_system.json').exists() else {}
_cons = {str(r[4]): r for r in cs if str(r[4]) in _PSY}
check('elite pos-03: each consumables PO’s cost line says what Coates’ system says (%d)' % len(_cons), len(_cons) == 6 and all(str(r[12]) == ('invoiced (completed in Coates’ system)' if _PSY[k]['fully_invoiced'] else 'received in full, not invoiced: check invoice' if _PSY[k]['fully_received'] else 'nothing received yet: check invoice') for k, r in _cons.items()), {k: r[12] for k, r in _cons.items()})
_advreg = {r[0]: r for r in pre if r[0] in ('4647508', '4647509', '4647515', '4647517', '4647519', '4647520', '4658850')}
check('elite pos-05: Advanced’s seven orders are receipted, an Advanced invoice named only where the record has one (4647509 GC220926, 4658850 93920)', len(_advreg) == 7 and not any('and invoiced' in str(r[6]) for r in _advreg.values()) and 'Advanced invoice GC220926' in str(_advreg['4647509'][6]) and 'Advanced invoice 93920' in str(_advreg['4658850'][6]) and all('Advanced invoice' not in str(r[6]) for k, r in _advreg.items() if k not in ('4647509', '4658850')) and not any('invoiced and receipted' in t for t in texts), {k: r[6] for k, r in _advreg.items()})
check('elite pos-06: 4658850 is described from the record’s note (a partial collection, Advanced INV 93920)', str(_advreg['4658850'][2]).startswith('partial collection (Advanced INV 93920)') and not any('no description on the PO' in str(r[2]) for r in pre), _advreg['4658850'][2])
_epj = [r for r in jn if str(r[0]).startswith('Accrual · Event Portables, hire')]
check('elite pos-07: the Event Portables 2126 journal names the water and the pit-lane trailer, and its parts add to it (42,175.00 + 14,450.00 + 3,350.00)', len(_epj) == 1 and 'water' in _epj[0][0] and 'Q6847 pit-lane trailer 3,350.00' in _epj[0][0] and abs(42175.00 + 14450.00 + 3350.00 - _epj[0][5]) < 0.005 and abs(4850.00 + 9600.00 - 14450.00) < 0.005, _epj and _epj[0][:1])
_cnp = [r for r in prn if str(r[1]).startswith('Carriers')]
check('elite pos-09: the carrier rows with no figure are called forecasts in the no-PO list', len(_cnp) == 3 and sum('forecast' in str(r[6]) for r in _cnp) == 2 and sum('the schedule’s figures' in str(r[6]) for r in _cnp) == 1, [r[6] for r in _cnp])
_EPQ = json.load(open(PR / 'ep_detail.json'))['svc']['quotes']
check('elite pos-10: the Event Portables quotes are unsigned with no PO, and the pack says so (no “approved”)', all(str(q.get('signed', '')).startswith('no') and not q.get('purchase_order_no') for q in _EPQ) and 'four quotes (unsigned; no PO on them)' in HT and not any('approved quotes' in t for t in texts))
_EW = json.load(open(NOW.parent / 'jc_pos.json')).get('eric_week', {}) if NOW and (NOW.parent / 'jc_pos.json').exists() else {}
check('elite pos-11: Eric Lucian’s week is in the private Job Connect file with its source, and the open item uses it', _EW.get('amount') == 2435.83 and str(_EW.get('given', '')).startswith('Andrew Fisher, 31 Oct 2026') and any(('Eric Lucian’s week (w/e 18 Oct) is ' + fmt(_EW['amount'])) in str(r[0]) for r in rows('Open items') if r))
_b9 = {x['Line']: x for x in bp['9994954']}
check('elite revenue-06: on 9994954, Event Portables’ units are L19, L21 and L22; L18 is the transport of Coates’ WC09 blocks', _b9[18]['Description'] == 'Transport Charge Toilet Block' and 'Pee Panels' in _b9[19]['Description'] and 'FWF' in _b9[21]['Description'] and 'FWF' in _b9[22]['Description'] and any('Event Portables: L19 (6 pee panels), L21 (10 FWF at WC09) and L22 (3 FWF at WC10)' in str(r[6]) for r in mu if r and r[0] == '9994954') and not any('L18 transport and L19 hire' in t for t in texts))
_b4 = {x['Line']: x for x in bp['9992300']}
check('elite revenue-07: 9992300 L4 is a scissor lift “With Operator Protection”, not a line with an operator', 'With Operator Protection' in _b4[4]['Description'] and not any(re.search(r'the one line with an operator|Scissor Lift With Operator(?! Protection)', t) for t in texts + ([json.dumps(J, ensure_ascii=False)] if JP.exists() else [])) and any('none supplies an operator' in t for t in (J['labourCharged']['notes'] if JP.exists() else [])))
_ih = [i for i, r in enumerate(CS) if r and r[0] == 'Invoice']
_ir = [r for r in CS[_ih[0] + 1:] if r and re.fullmatch(r'\d{8}', r[0]) and r[3] != 'removed'] if _ih else []
_rvpo = {str(r[0]): str(r[3]) for r in rv}
check('elite revenue-08: the CSV’s invoice rows carry the V8s’ PO, as the workbook does (%d)' % len(_ir), bool(_ih) and CS[_ih[0]][-1] == 'V8s PO (on the contract)' and len(_ir) == 18 and all(r[-1] == _rvpo[r[0]] for r in _ir), _ir[:1])
# ------------------------------------------------------------------ v1.13: section 2e on the page, the workbook and the data; the V8s' PO on every contract
if S17:
    s17w = [r for r in rows('Schedule 17 transport') if r and r[0] and r[0] in {c['ref'] for c in S17['changes']}]
    check('workbook: Schedule 17 sheet, the 12 changes at their figures', len(s17w) == 12 and all(abs(r[5] - c['amount']) < 0.005 and abs(r[7] - (c['amount'] - (c.get('was') or 0))) < 0.005 for r, c in zip(s17w, S17['changes'])), len(s17w))
    eq('Schedule 17: the 12 changes add 1,826.39 to the costs', sum(c['amount'] - (c.get('was') or 0) for c in S17['changes']), 1826.39)
    check('the page has section 2e and its net change', '2e · Transport checked against Schedule 17' in HT and '+1,826.39' in HT)
    if JP.exists(): check('final P&L data: Schedule 17, net 1,826.39, 12 changes', abs(J['schedule17']['net'] - 1826.39) < 0.005 and len(J['schedule17']['changes']) == 12)
CHD = (NOW.parent / 'contract_headers.json') if NOW else None
if CHD and CHD.exists():
    CPO_ = {c: h['customer_po'] for c, h in json.load(open(CHD))['contracts'].items()}
    check('contract headers: all 18 invoiced contracts', set(CPO_) == {i['contract'] for i in keep}, set(CPO_) ^ {i['contract'] for i in keep})
    check('revenue sheet: each invoice carries its contract’s V8s PO', all(str(r[3]).startswith(CPO_[r[2]]) for r in rv), [(r[2], r[3]) for r in rv if not str(r[3]).startswith(CPO_.get(r[2], '?'))])
    check('match-up sheet: each contract carries its V8s PO', all(str(r[2]).startswith(CPO_[r[0]]) for r in mu if r[0] in CPO_ and r[2]) and len({r[0] for r in mu if r[0] in CPO_ and r[2]}) == 18)
    check('the page shows each contract’s PO', all(('PO ' + p_) in HT for p_ in set(CPO_.values())))
    if JP.exists(): check('final P&L data: the contract POs', all(str(J['contractPOs'][c]).startswith(p_) for c, p_ in CPO_.items()))
else:
    check('contract headers (the V8s’ POs) are beside the record captures', False)
print('AUDIT: %d checks, %d pass, %d fail' % (len(OK) + len(BAD), len(OK), len(BAD)))
print('job cost %s · Sep %s · Oct %s · Nov %s · accruals %s · revenue %s · difference %s' % (fmt(JOB), fmt(SEP), fmt(OCT), fmt(NOV), fmt(ACC), fmt(summ['The job'][3]), fmt(summ['The job'][5])))
for b in BAD: print('FAIL', b)
sys.exit(1 if BAD else 0)
