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
rv = [r for r in rows('Revenue by invoice') if r and r[0] and r[3] != 'removed' and not str(r[0]).startswith('Total')]
check('revenue sheet: 18 invoices', len(rv) == 18, len(rv))
src = {i['invoice']: i for i in keep}
for r in rv:
    i = src.get(r[0]); check('revenue sheet row is a source invoice: %s' % r[0], i is not None)
    if not i: continue
    eq('ex GST matches the invoice: %s' % r[0], r[4], i['ex_gst'])
    eq('months + services = ex GST: %s' % r[0], sum((r[k] or 0) for k in (6, 7, 8, 9)), r[4])
    check('branch: %s' % r[0], r[3].split(' ')[0] == FIX.get(i['invoice'], i.get('bp_branch')), r[3])
rem = [r for r in rows('Revenue by invoice') if r and r[3] == 'removed']
check('25124396 shown as removed, with no amount', len(rem) == 1 and rem[0][0] == '25124396' and all(x is None for x in rem[0][4:10]), rem)
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
NINE = ('2026-10-05', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12')
OFF3 = ('2026-10-23', '2026-10-24', '2026-10-25')   # taken off the record on 1 Nov (12685): he did not work then
if ALF:
    al = json.load(open(ALF))['alfie']
    un = [x for x in al if x['d'] in NINE]   # unpriced to 12640, at 223.63 from 12676
    check("Alfie's 9 nights carry 223.63 on the record (12685), as the pack says", len(un) == 9 and all(x['amt'] == 223.63 for x in un), [(x['d'], x['amt']) for x in un])
    check("Alfie's 23-25 Oct nights are off the record (12685)", not [x for x in al if x['d'] in OFF3], [x['d'] for x in al if x['d'] in OFF3])
    late = [x['amt'] for x in al if x['amt'] is not None and ('2026-10-26' <= x['d'] <= '2026-10-29' or '2026-11-02' <= x['d'] <= '2026-11-05')]
    check("Alfie's rate on 26-29 Oct and 2-5 Nov is 223.63 on all 8 nights", len(late) == 8 and set(late) == {223.63}, late)
    n_oct = sum(1 for x in un if x['d'][:7] == '2026-10'); n_nov = sum(1 for x in un if x['d'][:7] == '2026-11')
    check('Alfie nights in the pack: 5 Oct, 4 Nov', (n_oct, n_nov) == (5, 4), (n_oct, n_nov))
    eq('Alfie Oct = 5 x 223.63', alf[8], r2(n_oct * 223.63)); eq('Alfie Nov = 4 x 223.63', alf[9], r2(n_nov * 223.63)); eq('Alfie accrues October only', alf[10], r2(n_oct * 223.63))
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
    check('record now: the 12640 cost lines less three unpriced accommodation nights on 23-25 Oct, Alfie\'s nine priced', not extra and len(gone) == 3 and sorted(g['d'] for g in gone) == list(OFF3) and all(g['k'] == 'accommodation' and g['amount'] is None for g in gone), (gone, extra))
    n9 = [x for x in dn['exp'] if is9(x)]
    check('record now: Alfie\'s 9 nights at 223.63', len(n9) == 9 and all(x['amount'] == 223.63 for x in n9), [(x['d'], x['amount']) for x in n9])
    check('record now: no Alfie night on 23-25 Oct', not [x for x in dn['exp'] if x['k'] == 'accommodation' and x.get('who') == 'Alfie Harris' and x['d'] in OFF3])
    accn = [x for x in dn['exp'] if x['k'] == 'accommodation']
    check('record now: 109 accommodation lines, none unpriced', len(accn) == 109 and all(x['amount'] not in (None, '') for x in accn), len(accn))
    for j, m in enumerate(('2026-09', '2026-10', '2026-11')):
        eq('pack accommodation %s = the record now, to the cent' % m, sum((r[7 + j] or 0) for r in accr), r2(sum((x['amount'] or 0) for x in accn if x['d'][:7] == m)))
    eq('pack accommodation total = the record now (24,036.63)', sum((r[7] or 0) + (r[8] or 0) + (r[9] or 0) for r in accr), 24036.63)
meals = [x for x in dc['exp'] if x['k'] in ('meals', 'misc') and x['amount']]
M = {m: r2(sum(x['amount'] for x in meals if x['d'][:7] == m)) for m in ('2026-09', '2026-10', '2026-11')}
mr = [r for r in cs if r[0].startswith('Meals')]
eq('meals Sep', sum((r[7] or 0) for r in mr), M['2026-09']); eq('meals Oct', sum((r[8] or 0) for r in mr), M['2026-10']); eq('meals Nov', sum((r[9] or 0) for r in mr), M['2026-11'])
SALH = collections.defaultdict(float)
for r in LAB[2:]:
    if r and r[0][:4] == '2026' and r[3] == 'Salary' and '2026-09-14' <= r[0] <= '2026-11-13': SALH[r[0][5:7]] += float(r[4] or 0)
tot_h = sum(SALH.values()); sal = [r for r in cs if r[0].startswith('Salary')][0]
eq('salary Sep (in-window hours)', sal[7], r2(14700 * SALH['09'] / tot_h)); eq('salary Oct', sal[8], r2(14700 * SALH['10'] / tot_h)); eq('salary total 14,700.00', sal[7] + sal[8] + sal[9], 14700)
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
    check('Job Connect November weeks are not accrued, and sit in November', all((jc[k][10] or 0) == 0 and (jc[k][7] or 0) == 0 and (jc[k][8] or 0) == 0 for k in ('w/e 8 Nov', 'w/e 15 Nov')))
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
for po in ('4655573', '4663216', '4666720', '4670270', '4670876', '4669481'):
    row = [r for r in cs if r[4] == po][0]; eq('consumables PO %s at its amount' % po, (row[7] or 0) + (row[8] or 0) + (row[9] or 0), float(pos[po]['amount']))
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
eq('match-up: tied + untied = job cost', job_row[7], JOB)
eq('match-up: the costs listed add to the job cost', sum((r[7] or 0) for r in mu if r[0] != 'The job'), JOB)
eq('match-up: invoices = 18-invoice revenue', job_row[3], REV_TOT)
check('match-up: 18 contracts', len({r[0] for r in mu if r[0] and r[0][0].isdigit()}) == 18)
jn = [r for r in rows('Journals') if r and r[0]]
accr_j = [r for r in jn if str(r[0]).startswith('Accrual')]
eq('journals = the accrue column', sum(r[5] for r in accr_j), ACC)
check('journals total row', any(r[0] == 'Total accruals' and abs(r[5] - ACC) < 0.005 for r in jn))
moves = [r for r in jn if str(r[0]).startswith('Branch move ·')]   # the two moves, not the header row above them
check('branch moves net to zero (two legs each)', all(re.search(r'−([\d,.]+) · \w+ \+([\d,.]+)', r[4]) and re.search(r'−([\d,.]+)', r[4]).group(1) == re.search(r'\+([\d,.]+)', r[4]).group(1) for r in moves) and len(moves) == 2, [r[4] for r in moves])
lp = [r for r in rows('Labour by person') if r and r[0]]
eq('labour hours = the labour register', sum((r[6] or 0) + (r[7] or 0) + (r[8] or 0) for r in lp), sum(float(r[4] or 0) for r in LAB[2:] if r and r[0][:4] == '2026'))
eq('labour hire $ by person = running sheet', sum((r[9] or 0) for r in lp), sum(float(r[5]) for r in LAB[2:] if r and r[0][:4] == '2026' and r[3] == 'Labour hire' and r[5] not in ('', 'hours only')))
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
    eq('Royal Wolf = its cost line on 9974042 (32 days at 42.63)', rw[8], r2(sum(x['GST Excl Price'] for x in rwl)))
else:
    check('the suppliers export (sub-hire cost lines) is beside the record captures', False)
cbr = collections.defaultdict(float)
for r in cb: cbr[(r[0], r[1])] += r[2]
TLP = (NOW.parent / 'transport_loads.json') if NOW else None
if TLP and TLP.exists():
    TLd = json.load(open(TLP))['loads']; amt_ = lambda l: (l['actual'] or 0) if l['actual'] else (l['f'] or 0)
    TB2 = collections.defaultdict(float)
    for l in TLd:
        a_ = amt_(l)
        if not a_: continue
        if l['b']: b_ = l['b']
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
        if r[0] and r[0][0].isdigit() and str(r[5]).startswith('Carriers: forecast load'): muf[r[0]] += r[7] or 0
    check('match-up: forecast loads tied by their docket = the loads', {k: r2(v) for k, v in muf.items()} == {k: r2(v) for k, v in FT.items()}, (dict(muf), dict(FT)))
    eq('match-up: forecast loads with no docket', sum((r[7] or 0) for r in mu if r[0] == 'not tied to one contract' and str(r[5]).startswith('Carriers: forecast loads with no docket')), fnone)
    eq('match-up: the forecast load with a docket not in Baseplan (12)', sum((r[7] or 0) for r in mu if r[0] == 'not tied to one contract' and str(r[5]).startswith('Carriers: a forecast load with a docket')), fmiss)
alltext = ' '.join(texts)
check('no invoice-line numbers in contract-line form (L82, L118, 9994954 L11)', not re.search(r'\bL82\b|\bL118\b|9994954[^.;]{0,40}\bL11\b', alltext))
check('contract lines L140, L163 and L13 are named', all(x in HT for x in ('L140', 'L163', 'L13')))
check('PM labour 15.22 h, not "15 h"', '15.22 h' in HT and not re.search(r'\b15 h\b', alltext))
check('Q6846 is water deliveries and a drinking-water tank', 'drinking-water tank' in HT and 'build toilets' not in alltext)
check('page title names the pack', 'October month-end' not in re.findall(r'<title>([^<]*)</title>', H)[0])
check('accommodation rows carry account 3520', all(r[2] == '3520' for r in accr), [r[2] for r in accr])
ev = [r for r in LAB[2:] if r and r[0][:4] == '2026' and r[2] in ('Frank Devilles', 'Ludwig Chee')]
check('labour sheet: the event pair on NVAC (6 rows, no KINP hours)', len(ev) == 6 and all(r[6].startswith('NVAC') and 'KINP' not in r[6] for r in ev), [r[6] for r in ev])
ct = [r for r in CS if r and r[0] == 'Total, 18 invoices']
check('CSV: revenue total row = the 18 invoices', len(ct) == 1 and abs(float(ct[0][4]) - REV_TOT) < 0.005)
check('CSV: the November forecast row and the removed 25124396 row', any(r and r[0] == 'November forecast' and r[4] == '839.07' for r in CS) and any(r and r[0] == '25124396' and r[3] == 'removed' for r in CS))
rvt = [r for r in rows('Revenue by invoice') if r and str(r[0]).startswith('Total')]
check('workbook: revenue total row = the 18 invoices', len(rvt) == 1 and abs(rvt[0][4] - REV_TOT) < 0.005)
cst = [r for r in rows('Costs by supplier') if r and r[0] == 'Total']
check('workbook: costs by supplier total row', len(cst) == 1 and all(abs(cst[0][7 + j] - v) < 0.005 for j, v in enumerate((SEP, OCT, NOV, ACC))))
cbt = [r for r in rows('Costs by branch') if r and str(r[0]).startswith('Total')]
check('workbook: costs by branch totals (four branches and the job)', len(cbt) == 5 and abs([r for r in cbt if r[0] == 'Total, the job'][0][2] - JOB) < 0.005 and all(abs(r[2] - CBB[r[0][6:]]) < 0.005 for r in cbt if r[0] != 'Total, the job'))
check('workbook: accruals vs charges, a total per supplier', len([r for r in rows('Accruals vs charges') if r and str(r[0]).startswith('Total, ')]) == 4)
check('workbook: hours shown to two decimals', all(c.number_format == '#,##0.00' for row in wb['Labour by person'].iter_rows(min_row=2, min_col=7, max_col=9) for c in row if c.value is not None))
check('page title is pack v1.10', html.unescape(re.findall(r'<title>([^<]*)</title>', H)[0]) == 'GC500 P&L, final · pack v1.10', re.findall(r'<title>([^<]*)</title>', H))
check('the page names record 12715 and Daniel Gough’s POs 4674224 and 4674225', all(x in HT for x in ('record (12715)', '4674224', '4674225')))
check('open items name the invoices still to come on 4674224 and 4674225', any('the invoices on 4674224 and 4674225' in str(r[0]) for r in rows('Open items') if r))
epj = [r for r in jn if str(r[0]).startswith('Accrual · Event Portables')]
check('journals: Event Portables split 2126 hire / 3325 servicing = 101,747.00', len(epj) == 2 and abs(sum(r[5] for r in epj) - 101747.00) < 0.005 and any('3325' in r[3] for r in epj) and any('2126' in r[3] for r in epj))
# ------------------------------------------------------------------ v1.10: the final P&L as data (what the page's P&L tab carries) = the workbook, to the cent
JP = PK / 'GC500_PL_final.json'
if JP.exists():
    J = json.load(open(JP, encoding='utf-8'))
    check('final P&L data: pack v1.10 on record 12715, as at 31 Oct 2026', (J['pack'], J['record'], J['asAt']) == ('v1.10', 12715, '2026-10-31'), (J['pack'], J['record'], J['asAt']))
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
print('AUDIT: %d checks, %d pass, %d fail' % (len(OK) + len(BAD), len(OK), len(BAD)))
print('job cost %s · Sep %s · Oct %s · Nov %s · accruals %s · revenue %s · difference %s' % (fmt(JOB), fmt(SEP), fmt(OCT), fmt(NOV), fmt(ACC), fmt(summ['The job'][3]), fmt(summ['The job'][5])))
for b in BAD: print('FAIL', b)
sys.exit(1 if BAD else 0)
