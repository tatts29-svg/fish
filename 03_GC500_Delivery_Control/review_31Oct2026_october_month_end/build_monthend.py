"""Author: Andrew Fisher. GC500 October month-end: every cost by supplier and month with its PO and invoice or receipt numbers and what to
accrue; labour by month and branch to 13 Nov; the 18 invoices to the V8s, and their hire by month. Read only, from the live record (12676),
the invoices and the POs, 31 Oct 2026. Writes an HTML page and a CSV.

    python3 -I build_monthend.py <out_dir>
"""
import csv, html, json, re, sys, datetime as dt, collections
from pathlib import Path
P = Path('/tmp/gc500-scratch/progress'); OUT = Path(sys.argv[1])
SP = Path('/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad')
r2 = lambda x: round(x + 1e-9, 2)
hd = lambda x: ('{:,.2f}'.format(x)).rstrip('0').rstrip('.')   # hours as the source has them (133.78, 2,304.78, 36)
m = lambda x: '' if x is None else (('−' if x < -0.004 else '') + '{:,.2f}'.format(abs(x)) if abs(x) > 0.004 else '—')
e = html.escape
MO = ['Sep', 'Oct', 'Nov']

# ---------------- costs by supplier and month (management view, job end; the P&L's 544,097.23 + 750.00 November forecast)
C = []   # (supplier, branch, account, what, po, invoice/receipt, Sep, Oct, Nov, accrue_oct, basis, status)
def add(*a): C.append(a)
add('Advanced Temporary Fencing', 'STPS', '2126 · 2142', 'Fencing weeks 6–1 (9 Sep–16 Oct) and a partial collection',
    '4647508 · 4647509 · 4647515 · 4647517 · 4647519 · 4647520 · 4658850', 'receipts 4918492 · 4922398 · 4929277 · 4926209 · 4936461 · 4934877 · 4922343 (Advanced inv GC220926, 93920)',
    99664.50, 114560.50, 0, 0, 'by the date on each docket, note and sheet line', 'invoiced and receipted')
add('Advanced Temporary Fencing', 'STPS', '2126 41,193.70 · 2142 37,991.00', 'Event week 19–25 Oct (48 dockets, 11 notes, race crew 210.5 h) and demob week 1 26–29 Oct (8 dockets, 7 notes)',
    '4647522 (event week) · 4647523 (demob), both open', 'nothing invoiced on either yet', 0, 79184.70, 0, 79184.70, 'our dockets and notes at Advanced’s rates', 'ACCRUE')
add('Advanced Temporary Fencing', 'STPS', '2126', 'Demob week 2 (forecast; no papers yet)', '4647523 (demob), open', 'not invoiced', 0, 0, 750.00, 0, 'the page’s forecast', 'November forecast')
add('Event Portables', 'KINP', '2126 · 3325', 'Toilet hire Q6845, servicing Q6844 (event nights 23–25 Oct), pit lane Q6847 (22 Oct), build toilets Q6846 (14 Sep–25 Oct, quoted 4,850.00)',
    'none on the record', 'no invoice on the record', 1963.10, 99783.90, 0, 101747.00,
    'Q6846 by its days (17 of 42 in September); the rest is event hire and servicing in October', 'ACCRUE (September’s part as a catch-up)')
add('Premiair Services', 'KINP cost · STPS revenue', '2126', 'Eight sub-hired boards on 9961265, 8–28 Oct (estimate; line 15, 536.10, taken out: it is not on the contract in Baseplan (12))', 'none on the record', 'no invoice yet',
    0, 3270.21, 0, 3270.21, 'the keyed cost rate 53.61 a day × each line’s hire days, all in October', 'ACCRUE (estimate)')
add('United Rentals (Royal Wolf)', 'STPS cost · KINP revenue', '2126', 'Refrigerated container, 9974042 line 2, on site 13–30 Oct (cost once)', 'none on the record', 'no invoice on the record',
    0, 1364.23, 0, 1364.23, 'delivered 13 Oct, picked up 30 Oct', 'ACCRUE')
# every transport row by its own date on the schedule (Codex audit F03): the recorded figures, the forecasts on loads with no figure, and the planned loads, each once
TR = collections.defaultdict(float)
for t_ in json.load(open(P / 'dated_costs.json'))['transport']:
    mo_ = {'2026-09': 'Sep', '2026-10': 'Oct', '2026-11': 'Nov'}[(t_['d'] or '')[:7]]
    TR[('rec', mo_)] += t_.get('actual') or 0; TR[('plan' if t_.get('planned') else 'fc', mo_)] += t_.get('f') or 0
TR = {k: r2(v) for k, v in TR.items()}
assert abs(sum(v for k, v in TR.items() if k[0] == 'rec') - 33150.09) < 0.005 and abs(sum(v for k, v in TR.items() if k[0] != 'rec') - 23660.56) < 0.005, TR
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads to date: the figures on the schedule (the carriers’ minimums, such as “$290+”), not carrier invoices', 'none on the record', 'carrier invoices not on the record',
    TR.get(('rec', 'Sep'), 0), TR.get(('rec', 'Oct'), 0), TR.get(('rec', 'Nov'), 0), None, 'each load’s date on the schedule (the work date, not an invoice date)', 'recorded figure · check carrier invoices')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads on the schedule with no figure recorded: forecast at the average for the load', '', 'not invoiced',
    TR.get(('fc', 'Sep'), 0), TR.get(('fc', 'Oct'), 0), TR.get(('fc', 'Nov'), 0), None, 'each load’s date on the schedule', 'forecast')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads still to come (planned)', '', 'not invoiced', TR.get(('plan', 'Sep'), 0), TR.get(('plan', 'Oct'), 0), TR.get(('plan', 'Nov'), 0), None, 'planned dates', 'forecast')
JC = [('w/e 20 Sep', '4657010', 'invoice 3,023.70 (the running sheet says 3,023.85)', 3023.70, 'Sep', 0), ('w/e 27 Sep', '4660565', 'GC500 share 1,299.74', 1299.74, 'Sep', 0),
      ('w/e 4 Oct', '4661783', 'invoice 15294, 3,052.60 (the running sheet says 3,230.60)', 3052.60, 'Sep/Oct', 0), ('w/e 11 Oct', '4665091', 'no amount yet', 2539.92, 'Oct', 2539.92),
      ('w/e 18 Oct', '4667755 · 4668970', 'no amount yet', 6198.75, 'Oct', 6198.75), ('w/e 25 Oct', '4670882 · 4671825', 'no amount yet', 11774.71, 'Oct', 11774.71),
      ('w/e 1 Nov', 'none yet', 'not invoiced', 3835.37, 'Oct', 3835.37), ('w/e 8 Nov', 'none yet', 'not invoiced', 3023.85, 'Nov', 0)]
for wk, po, inv, amt, mo, acc in JC:
    sep = r2(3052.60 * 1960.64 / 3230.60) if wk == 'w/e 4 Oct' else (amt if mo == 'Sep' else 0); octv = r2(3052.60 - r2(3052.60 * 1960.64 / 3230.60)) if wk == 'w/e 4 Oct' else (amt if mo == 'Oct' else 0); nov = amt if mo == 'Nov' else 0
    add('Job Connect (labour hire)', 'KINP', 'Installs (as coded)', 'Running sheet ' + wk, po, inv, sep, octv, nov, acc if acc else 0,
        ('the invoice; split across the months by the running sheet’s days' if wk == 'w/e 4 Oct' else 'the invoice' if wk in ('w/e 20 Sep', 'w/e 27 Sep') else 'the running sheet’s paid hours at the record’s rates (estimate until invoiced)'),
        'ACCRUE (estimate)' if acc else ('invoiced' if mo != 'Nov' else 'November (estimate)'))
add('Accommodation (tracker)', 'KINP', '3520 · 3501', '97 nights on the tracker (all but Ludwig Chee’s three event nights and Alfie Harris’s twelve below)', 'none', 'on the tracker', 6370.36, r2(11851.89 - 655.71), 3801.71, None, 'the night’s date', 'check how they were paid')
add('Accommodation (tracker)', 'NVAC', '3520 · 3501', 'Ludwig Chee: 3 event nights, 23–25 Oct, at 218.57 (with his hours on NVAC)', 'none', 'on the tracker', 0, 655.71, 0, None, 'the night’s date', 'check how they were paid')
ALF_RATE = 223.63   # Alfie Harris's nightly rate on the tracker for 26–29 Oct and 2–5 Nov (his latest priced nights)
ALF_OCT = r2(8 * ALF_RATE); ALF_NOV = r2(4 * ALF_RATE); ALF_TOT = r2(ALF_OCT + ALF_NOV)   # 8 unpriced nights in October, 4 in November
assert (ALF_OCT, ALF_NOV, ALF_TOT) == (1789.04, 894.52, 2683.56), (ALF_OCT, ALF_NOV)
ACCOM = r2(22023.96 + ALF_TOT)   # 100 priced nights on the tracker + Alfie's 12 unpriced nights
add('Accommodation (tracker)', 'KINP', '3520 · 3501', 'Alfie Harris: 12 nights at 223.63 a night, his rate on the tracker for 26–29 Oct and 2–5 Nov (on the record from 1 Nov): 8 in October (5, 12–15, 23–25 Oct) and 4 in November (9–12 Nov)', 'none', 'invoice to come',
    0, ALF_OCT, ALF_NOV, ALF_OCT, 'each night’s date at 223.63', 'ACCRUE the October nights · November forecast')
add('Meals and expenses (tracker)', 'KINP', '3520 · 3501', 'Meals, expenses and equipment R&M, to 31 Oct', 'none', 'on the tracker', 2621.53, 2642.79, 0, None, 'the date on each line', 'recorded on the tracker (paid not evidenced)')
add('Meals and expenses (tracker)', 'KINP', '3520 · 3501', 'Alfie Harris’s meals away from home, 2–5 Nov (4 × 100.00), recorded ahead of the dates', 'none', 'on the tracker', 0, 0, 400.00, None, 'the date on each line', 'November forecast (recorded ahead)')
SALH = collections.defaultdict(float)
for r_ in csv.reader(open(SP / 'GC500_labour_by_month_and_branch.csv', encoding='utf-8-sig')):
    if r_ and r_[0][:4] == '2026' and r_[3] == 'Salary' and '2026-09-14' <= r_[0] <= '2026-11-13': SALH[{'09': 'Sep', '10': 'Oct', '11': 'Nov'}[r_[0][5:7]]] += float(r_[4] or 0)
SAL = {k: r2(v) for k, v in zip(('Sep', 'Oct', 'Nov'), [14700.0 * SALH[k] / sum(SALH.values()) for k in ('Sep', 'Oct', 'Nov')])}
SAL['Nov'] = r2(14700.0 - SAL['Sep'] - SAL['Oct'])
assert dict(SALH) == {'Sep': 143.0, 'Oct': 256.0, 'Nov': 110.0} and (SAL['Sep'], SAL['Oct'], SAL['Nov']) == (4129.86, 7393.32, 3176.82), (SALH, SAL)
add('Salary allowance', 'KINP', '3210', 'Salary allowance (forecast, job end): the record’s window 14 Sep–13 Nov (labourAllowance858)', 'none', 'payroll', SAL['Sep'], SAL['Oct'], SAL['Nov'], None,
    'split by the salaried hours inside the window (143 · 256 · 110 h; the 55 h before 14 Sep are outside it)', 'allocated')
for po, sup, br, gl, what, d, amt in [('4655573', 'Bunnings', 'STPS', '201.STPS.2144.0', 'Star pickets', '18 Sep', 100.00), ('4663216', 'CCI Supplies', 'STPS', '201.STPS.2144.0', 'Cable ties', '7 Oct', 2538.64),
                                     ('4666720', 'BSF Mobile Cranes', 'KINP', '201.KINP.2144.0', 'Building unloads (completed order)', '15 Oct', 2896.00), ('4670270', 'Event Elec', 'NVAC', '201.NVAC.2144.0', 'Concert generator sync (completed order)', '23 Oct', 579.68),
                                     ('4670876', 'Bunnings', 'KINP', '201.KINP.2144.0', 'Hand soap', '24 Oct', 180.00), ('4669481', 'Bunnings', 'NVAC', '201.NVAC.2150.0', 'Siphon hose (completed order)', '26 Oct', 42.34)]:
    add(sup, br, gl, what, po, 'PO ' + d, amt if 'Sep' in d else 0, 0 if 'Sep' in d else amt, 0, None, 'the PO date', 'check invoice')
tot = [r2(sum(r[i] for r in C)) for i in (6, 7, 8)]
assert abs(sum(tot) - 543508.93) < 0.01, (tot, sum(tot))
assert (tot[0], tot[1], tot[2]) == (147015.00, 379690.51, 16803.42), tot   # Codex's bridge after F03, F04 and the F05 window   # the P&L's job costs (with the 750.00 November fencing forecast), at Job Connect's invoices and without Premiair line 15
acc_total = r2(sum(r[9] for r in C if r[9]))

# ---------------- labour by month and branch (the running sheet, to 13 Nov)
rows = list(csv.reader(open(SP / 'GC500_labour_by_month_and_branch.csv', encoding='utf-8-sig')))
L = collections.defaultdict(float); LH = collections.defaultdict(float)
mon = {'September': 'Sep', 'October': 'Oct', 'November (forecast)': 'Nov'}
for r in rows[2:]:
    if not (r and r[0][:4] == '2026'): continue
    mo = mon.get(r[1]);  typ = r[3]
    for seg in re.split(r', | · ', r[6]):
        g = re.match(r'^(KINP|STPS|NVAC|MEAD) ([\d.]+) h$', seg.strip())
        if g: L[(typ, g.group(1), mo)] += float(g.group(2))
    if typ == 'Labour hire':
        try: LH[mo] += float(r[5])
        except ValueError: pass
assert abs(sum(LH.values()) - 34926.79) < 0.01
HOME = {'Aaron Zelvis': ('KINP', 'Coates wages'), 'Alfie Harris': ('NTSP', 'Coates wages'), 'Andrew Fisher': ('NOIS', 'Salary'), 'Jayden Paul': ('KINP', 'Coates wages'),
        'Wayne Crimmin': ('STPS', 'Coates wages'), 'Frank Devilles': ('BFIS', 'Coates wages · event weekend mechanic / electrician, charged to NVAC 9961976; pay basis not on the record'),
        'Ludwig Chee': ('NSNA', 'Coates wages · event weekend mechanic / electrician, charged to NVAC 9961976; pay basis not on the record'), 'Daniel Gough': ('KINP', 'Labour hire, Job Connect, 55.70 an hour'),
        'Kyle Gover': ('KINP', 'Labour hire, Job Connect, 53.05 an hour'), 'Eric Lucian': ('NOIS', 'Labour hire, 55.70 an hour; the record: home branch NOIS, charge branch KINP')}
PH = collections.defaultdict(float); PC = collections.defaultdict(float)
for r in rows[2:]:
    if not (r and r[0][:4] == '2026'): continue
    who, mo, h = r[2], mon.get(r[1]), float(r[4] or 0)
    cost = float(r[5]) if r[3] == 'Labour hire' and r[5] not in ('', 'hours only') else 0.0
    for seg in re.split(r', | · ', r[6]):
        g = re.match(r'^(KINP|STPS|NVAC|MEAD) ([\d.]+) h$', seg.strip())
        if g:
            PH[(who, mo, g.group(1))] += float(g.group(2))
            if cost and h: PC[(who, mo, g.group(1))] += cost * float(g.group(2)) / h
assert set(p for p, _, _ in PH) <= set(HOME), set(p for p, _, _ in PH) - set(HOME)
assert abs(sum(PC.values()) - 34926.79) < 0.01
LHB = collections.defaultdict(float)   # labour hire cost by receiving branch and month, the running sheet's basis (the P&L carries Job Connect's invoices where received)
for (who_, mo_, b_), v_ in PC.items():
    if HOME[who_][1].startswith('Labour hire'): LHB[(b_, mo_)] += v_
assert abs(sum(LHB.values()) - sum(LH.values())) < 0.01
CON = collections.defaultdict(float); CONP = collections.defaultdict(float)
CLABEL = {'9961976': ('NVAC', 'generators; the event weekend’s mechanic and electrician', 'named on the running sheet note; the event weekend’s mechanic and electrician'), '9972648': ('STPS', 'water barriers', 'named on the note'),
          'KINP': ('KINP', 'everything else: buildings, toilets, the concert, site days', 'KINP (no contract number)')}
KINP_CON = {'9968862', '9968955', '9994954', '9968929', 'none'}
for r in rows[2:]:
    if not (r and r[0][:4] == '2026'): continue
    who, mo = r[2], mon.get(r[1]); segs = [x.strip() for x in r[8].split(' · ')]
    brh = {g.group(1): float(g.group(2)) for g in (re.match(r'^(KINP|STPS|NVAC|MEAD) ([\d.]+) h$', x.strip()) for x in re.split(r', | · ', r[6])) if g}
    named_kinp = 0.0
    for i, x in enumerate(segs):
        g = re.match(r'^(Generators|Water barriers) (\d{7,8}) (KINP|STPS|NVAC|MEAD)$', x)
        if g and i + 1 < len(segs):
            hh = re.match(r'^([\d.]+) h$', segs[i + 1])
            if hh:
                ck = 'KINP' if g.group(3) == 'KINP' else g.group(2)
                CON[(ck, mo)] += float(hh.group(1)); CONP[(who, ck, mo)] += float(hh.group(1))
                if g.group(3) == 'KINP': named_kinp += float(hh.group(1))
    rest = brh.get('KINP', 0) - named_kinp
    cs = collections.Counter()
    for x in segs:
        g = re.match(r'^(\d{7,8}) (in|out)[^:]*: (.+)$', x)
        if g: cs[g.group(1)] += len([y for y in g.group(3).split(',') if y.strip()])
    if rest > 1e-9:
        if cs:
            t_ = sum(cs.values())
            for c_, n_ in cs.items(): CON[('KINP', mo)] += rest * n_ / t_; CONP[(who, 'KINP', mo)] += rest * n_ / t_
        else: CON[('KINP', mo)] += rest; CONP[(who, 'KINP', mo)] += rest
# Andrew, 29 Oct: "So labour costs for nvac for my mechanic and electrician should this go to nvac over event ?" (answered yes: NVAC bills the
# Event Gen Tech); 31 Oct, asked which roles Frank and Ludwig did over the event weekend: "Mechanic and electrician." Both sets of hours go to NVAC.
ROLE_MOVE = {'Frank Devilles': ('NVAC', '9961976'), 'Ludwig Chee': ('NVAC', '9961976')}
for who_, (br_, con_) in ROLE_MOVE.items():
    for mo_ in MO:
        h_ = PH.pop((who_, mo_, 'KINP'), 0)
        if h_:
            PH[(who_, mo_, br_)] += h_; L[('Coates wages', 'KINP', mo_)] -= h_; L[('Coates wages', br_, mo_)] += h_
        hc_ = CONP.pop((who_, 'KINP', mo_), 0)
        if hc_:
            CONP[(who_, con_, mo_)] += hc_; CON[('KINP', mo_)] -= hc_; CON[(con_, mo_)] += hc_
assert abs(sum(CON.values()) - sum(PH.values())) < 0.01 and set(c for c, _ in CON) <= set(CLABEL), set(c for c, _ in CON) - set(CLABEL)

# ---------------- revenue: the 18 invoices to the V8s, and the hire on their dated lines by month
inv = json.load(open(P / 'invoices.json'))
BR_FIX = {'25120652': 'STPS', '25120689': 'STPS'}   # Codex audit F02: header "Branch Staplyton (S)", Sales Analysis Code STPS-CON
CUST = {}   # every invoice left is to the V8s
for i_ in inv:
    if i_['invoice'] in BR_FIX: i_['bp_branch'] = BR_FIX[i_['invoice']]
# Andrew, 1 Nov: "Good pick up.. remove Invoice 25124396 please." It is invoiced to Gold Coast Helitours (CASH-STPS), not the V8s; no cost on the record ties to it
REMOVED = [i_ for i_ in inv if i_['invoice'] == '25124396']
inv = [i_ for i_ in inv if i_['invoice'] != '25124396']
assert len(REMOVED) == 1 and abs(REMOVED[0]['ex_gst'] - 1974.05) < 0.005 and len(inv) == 18
def parse(s): return dt.datetime.strptime(s, '%d/%m/%Y %H:%M')
def split(a, b):
    out = {'Sep': 0.0, 'Oct': 0.0, 'Nov': 0.0}; tot_h = (b - a).total_seconds()
    if tot_h <= 0: out['Oct'] = 1.0; return out
    for mo, (s, t) in {'Sep': (dt.datetime(2026, 9, 1), dt.datetime(2026, 10, 1)), 'Oct': (dt.datetime(2026, 10, 1), dt.datetime(2026, 11, 1)), 'Nov': (dt.datetime(2026, 11, 1), dt.datetime(2026, 12, 1))}.items():
        ov = (min(b, t) - max(a, s)).total_seconds()
        if ov > 0: out[mo] = ov / tot_h
    return out
def cents(raw, total):   # split total (to the cent) in proportion to raw; the leftover cents go to the largest remainders, once
    tc = int(round(total * 100)); s_ = sum(raw.values())
    if tc == 0: return {k: 0.0 for k in raw}
    exact = {k: (raw[k] / s_ * tc if s_ else (tc if k == 'Oct' else 0)) for k in raw}
    base = {k: int(exact[k] // 1) for k in raw}; left = tc - sum(base.values())
    for k in sorted(raw, key=lambda k: -(exact[k] - base[k]))[:left]: base[k] += 1
    return {k: base[k] / 100 for k in raw}
REV = []
for i in sorted(inv, key=lambda i: (i.get('bp_branch') or '', i['invoice'])):
    hire = {'Sep': 0.0, 'Oct': 0.0, 'Nov': 0.0}; undated = 0.0; hire_tot = 0.0
    for l in i['lines']:
        amt = l['line_total'] or 0
        if l.get('from') and l.get('to'):
            sp = split(parse(l['from']), parse(l['to']))
            for k in hire: hire[k] += amt * sp[k]
            hire_tot += amt
        else: undated += amt
    w = (i.get('waiver') or 0); env = r2((i.get('ex_gst') or 0) - sum((l['line_total'] or 0) for l in i['lines']) - w)
    ws = {k: (w * hire[k] / hire_tot if hire_tot else (w if k == 'Oct' else 0)) for k in hire}
    # one model for every output (Codex, code review of v1.2): the services stay as sourced (the undated lines, plus any remainder the line
    # parser missed); the hire lines and their waiver are split across the months by days on hire, and the cents are reconciled once
    ex_ = i.get('ex_gst') or 0; svc = r2(undated + env); hw = r2(ex_ - svc)
    mm = cents({k: hire[k] + ws[k] for k in MO}, hw)
    assert abs(sum(mm.values()) + svc - ex_) < 0.005, (i['invoice'], mm, svc, ex_)
    REV.append({'inv': i['invoice'], 'date': i['date'], 'contract': i['contract'], 'branch': i.get('bp_branch'), 'ex': ex_, 'waiver': w, 'm': mm, 'svc': svc, 'cust': CUST.get(i['invoice'], 'V8 Supercars')})
assert abs(sum(r['ex'] for r in REV) - 1001063.07) < 0.005
RT = {k: r2(sum(r['m'][k] for r in REV)) for k in MO}
UND = r2(sum(r['svc'] for r in REV))
assert abs(sum(RT.values()) + UND - 1001063.07) < 0.005, (RT, UND)

# ---------------- where things match up (Andrew, 31 Oct: "We need to make sire we mention hire contract nos.and p/o numbers so we know where
#                  things maych up"): each cost's PO, and the hire contract and V8s invoice it's charged on, from the record, the invoices and Baseplan (12).
#                  Where nothing ties a cost to one contract, it says so; nothing is guessed.
INV_OF = {i['contract']: i['invoice'] for i in inv}; BR_OF = {i['contract']: i.get('bp_branch') for i in inv}; EX_OF = {i['contract']: i.get('ex_gst') or 0 for i in inv}
assert len(INV_OF) == 18
def on(*cs): return ' · '.join('%s (inv %s)' % (c, INV_OF[c]) for c in cs)
def onit(i):   # what's on the contract: its biggest lines on the invoice (hire and sales); refs, transport, labour and recharges left out
    agg = collections.defaultdict(float); disp = {}
    for l in i['lines']:
        d = re.sub(r'\s{2,}', ' ', (l.get('desc') or '').strip())
        if not d or re.search(r'transport|waiver|install|labour|accom|delivery|pick ?up', d, re.I): continue
        d = re.sub(r'\s*[-(]\s*(for|per)?\s*$', '', d); d = re.sub(r'\s+x$', '', d)
        for _ in range(2): d = re.sub(r'^(?:(?:CP|P|WC|GN|WB|VMS|FR|LT)\d+[A-Z]?|\d+T)\s+', '', d)
        d = re.sub(r'\s*[&-]\s*$', '', d); k_ = d.lower()
        agg[k_] += l.get('line_total') or 0; disp.setdefault(k_, d)
    out = []
    for k_, _ in sorted(agg.items(), key=lambda kv: -kv[1]):
        if any(o.lower().startswith(k_) or k_.startswith(o.lower()) for o in out): continue
        out.append(disp[k_])
        if len(out) == 3: break
    return ', '.join(out) or '—'
ONIT = {i['contract']: onit(i) for i in inv}
_bp = json.load(open(P / 'bp12.json')); _dd2c = {str(r['Delivery Docket']): str(r['Hire Agreement']) for r in _bp['Delivery Dockets']}
TDOC = {'all': collections.defaultdict(float)}; TDOC_N = collections.Counter()
for t in json.load(open(P / 'dated_all.json'))['tFig']:   # every carrier figure to date: its delivery docket -> the hire contract (Baseplan (12) docket list)
    ev = t.get('event') or {}; a = t.get('amount') or 0; grp = 'all'
    nums = re.findall(r'\b(2\d{7})\b', ev.get('dd') or ''); cs = sorted({_dd2c[x] for x in nums if x in _dd2c})
    k = ' + '.join(cs) if cs else ('docket ' + ', '.join(nums) + ' not in Baseplan (12)' if nums else 'no docket on the record')
    TDOC[grp][k] = r2(TDOC[grp][k] + a); TDOC_N[(grp, k)] += 1
assert abs(sum(TDOC['all'].values()) - 33150.09) < 0.005, TDOC
def docs(grp):
    ks = sorted(TDOC[grp], key=lambda k: (not k[0].isdigit(), -TDOC[grp][k]))
    return 'by the delivery docket on each load: ' + ' · '.join('%s %s (%d load%s)' % (k, m(TDOC[grp][k]), TDOC_N[(grp, k)], '' if TDOC_N[(grp, k)] == 1 else 's') for k in ks)
ACCOM_ETC = 'the V8s pay ACCOM / ETC on 9968862 (inv 25122058) L82 and 9968955 (inv 25122322) L118, 13,850.00 each'
CONS_ON = {'4655573': 'contract not named on the PO (STPS GL)', '4663216': on('9990776') + ': the PO says “for the GC500 fencing”',
           '4666720': 'contract not named on the PO; the buildings are hired on 9968862 (40 building lines) and 9994954 (3)',
           '4670270': on('9994954') + ' L11 Labour Charge Sync: the PO’s note says so', '4670876': 'contract not named on the PO (KINP GL)',
           '4669481': 'contract not named on the PO (NVAC GL)'}
def charged_on(r):
    sup, what, po = r[0], r[3], r[4]
    if sup.startswith('Advanced'): return on('9990776')
    if sup == 'Event Portables': return on('9968955', '9994954') + ' (the lines are in section 1b)'
    if sup.startswith('Premiair'): return on('9961265') + ' lines 13, 24–26, 28–31'
    if sup.startswith('United Rentals'): return on('9974042') + ' L2–L4'
    if sup.startswith('Carriers'):
        if what.startswith('Loads to date'): return docs('all')
        return 'not tied: forecast loads have no figure or docket yet'
    if sup.startswith('Job Connect'):
        return 'KINP work (no contract number)' + (' · Kyle Gover’s 8 h on 15 Oct: ' + on('9972648') + ', water barriers' if 'w/e 18 Oct' in what else '')
    if sup.startswith('Accommodation'): return ('his hours sit on ' + on('9961976') + '; ' + ACCOM_ETC) if what.startswith('Ludwig') else ACCOM_ETC
    if sup.startswith('Meals'): return 'no line of its own on the invoices'
    if sup.startswith('Salary'): return 'not a line on the invoices; the PM’s labour is charged on ' + on('9968862', '9968955') + ', 15 h each'
    if po in CONS_ON: return CONS_ON[po]
    raise ValueError(('no match-up for', r[:5]))
CH = [charged_on(r) for r in C]
MU = collections.defaultdict(list)   # hire contract -> our costs against it: (what, PO, amount, status)
MU['9990776'] += [('Advanced: fencing weeks 6–1 and a partial collection', '4647508 · 4647509 · 4647515 · 4647517 · 4647519 · 4647520 · 4658850', 214225.00, 'invoiced and receipted'),
                  ('Advanced: event week, 19–25 Oct', '4647522 (open)', 71159.70, 'ESTIMATE, accrued'), ('Advanced: demob week 1, 26–29 Oct', '4647523 (open)', 8025.00, 'ESTIMATE, accrued'),
                  ('Advanced: demob week 2', '4647523 (open)', 750.00, 'November forecast'), ('CCI Supplies: cable ties for the GC500 fencing', '4663216', 2538.64, 'PO; check invoice')]
MU['9968955'] += [('Event Portables: toilet hire, servicing and transport (shared with 9994954)', 'none on the record', 101747.00, 'ESTIMATE, accrued; no invoice')]
MU['9994954'] += [('Event Portables: L18 transport and L19 hire', 'none on the record', None, 'in the 101,747.00 under 9968955'), ('Event Elec: sync the concert generators (L11)', '4670270', 579.68, 'PO, completed')]
MU['9961976'] += [('Ludwig Chee: 3 event nights, with his hours', 'none', 655.71, 'on the tracker')]
MU['9961265'] += [('Premiair: eight sub-hired VMS boards (lines 13, 24–26, 28–31)', 'none on the record', 3270.21, 'ESTIMATE, accrued; no invoice')]
MU['9972648'] += [('Job Connect: Kyle Gover 8 h on the water barriers, 15 Oct', '4668970', 460.78, 'ESTIMATE, accrued with w/e 18 Oct')]
MU['9974042'] += [('United Rentals (Royal Wolf): refrigerated container (L2)', 'none on the record', 1364.23, 'ESTIMATE, accrued; no invoice')]
for k in TDOC['all']:
    if k[0].isdigit():
        for c_ in k.split(' + '): assert c_ in INV_OF, c_
        MU[k] += [('Carriers: loads with this contract’s docket', 'none on the record', TDOC['all'][k], '%d load%s; figures from the schedule' % (TDOC_N[('all', k)], '' if TDOC_N[('all', k)] == 1 else 's'))]
NOTE = {'9968862': 'the V8s pay ACCOM / ETC here (L82, 13,850.00) and the PM’s labour (15 h)', '9968955': 'the V8s pay ACCOM / ETC here (L118, 13,850.00) and the PM’s labour (15 h)',
        '9961976': 'staff hours here: %s h (the generators %s h; Frank Devilles and Ludwig Chee %s h, wages are hours only)' % (hd(sum(CON.get(('9961976', k), 0) for k in MO)), hd(sum(CON.get(('9961976', k), 0) for k in MO) - 72), '72'),
        '9972648': 'staff hours here: %s h on the water barriers' % hd(sum(CON.get(('9972648', k), 0) for k in MO))}
_nd = r2(sum(v for g_ in TDOC for k, v in TDOC[g_].items() if k.startswith('no docket'))); _nb = r2(sum(v for g_ in TDOC for k, v in TDOC[g_].items() if k.startswith('docket ')))
NT = [('Job Connect labour hire: KINP work (no contract number)', '4657010 · 4660565 · 4661783 (invoiced) · 4665091 · 4667755 · 4668970 · 4670882 · 4671825 (accrued) · none yet for w/e 1 and 8 Nov', r2(34748.64 - 460.78), 'invoices where received; estimates accrued'),
      ('Carriers: loads to date with no docket on the record', 'none on the record', _nd, 'figures from the schedule; the carrier invoices will tie them'),
      ('Carriers: docket 26095295, not in Baseplan (12)', 'none on the record', _nb, 'figures from the schedule'),
      ('Carriers: forecast loads (no figure recorded, and planned)', 'none on the record', r2(sum(v for k, v in TR.items() if k[0] != 'rec')), 'forecast; no figure or docket yet'),
      ('Accommodation: 97 priced nights and Alfie Harris’s 12 nights', 'none', r2(ACCOM - 655.71), ACCOM_ETC),
      ('Meals, expenses and equipment R&M', 'none', 5664.32, 'no line of its own on the invoices'),
      ('Salary allowance', 'payroll', 14700.00, 'the PM’s labour is charged on 9968862 and 9968955'),
      ('Bunnings: star pickets', '4655573', 100.00, 'contract not named on the PO (STPS GL)'),
      ('BSF Mobile Cranes: building unloads', '4666720', 2896.00, 'contract not named on the PO; the buildings are hired on 9968862 (40 lines) and 9994954 (3)'),
      ('Bunnings: hand soap', '4670876', 180.00, 'contract not named on the PO (KINP GL)'),
      ('Bunnings: siphon hose', '4669481', 42.34, 'contract not named on the PO (NVAC GL)')]
MU_TOT = r2(sum(x[2] or 0 for v in MU.values() for x in v)); NT_TOT = r2(sum(x[2] for x in NT))
assert abs(MU_TOT + NT_TOT - 543508.93) < 0.005, (MU_TOT, NT_TOT, MU_TOT + NT_TOT)
ORDER_C = sorted(INV_OF, key=lambda c: ({'KINP': 0, 'STPS': 1, 'NVAC': 2, 'MEAD': 3}.get(BR_OF[c], 9), c))
def pos_of(c):
    ps = []
    for x in MU.get(c, []):
        for t_ in re.findall(r'\b4\d{6}\b', x[1]):
            if t_ not in ps: ps.append(t_)
    return ' · '.join(ps) if ps else 'no PO on the record against it'
# ---------------- CSV
with (OUT / 'GC500_October_month_end.csv').open('w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['Author: Andrew Fisher', 'GC500 October month-end: costs by supplier and month, accruals, labour, invoices', 'as at 31 Oct 2026', 'AUD ex GST', 'record 12676'])
    w.writerow(['Supplier', 'Branch', 'Account', 'What', 'PO', 'Invoice / receipt', 'Charged on (hire contract · V8s invoice)', 'September', 'October', 'November', 'Accrue at 31 Oct', 'How dated', 'Status'])
    for r, ch_ in zip(C, CH): w.writerow(list(r[:6]) + [ch_, '%.2f' % r[6], '%.2f' % r[7], '%.2f' % r[8], '' if r[9] is None else '%.2f' % r[9], r[10], r[11]])
    w.writerow(['Total', '', '', '', '', '', '', '%.2f' % tot[0], '%.2f' % tot[1], '%.2f' % tot[2], '%.2f' % acc_total, '', ''])
    w.writerow([]); w.writerow(['Invoice', 'Date', 'Contract', 'Branch', 'Ex GST', 'Waiver', 'Sep hire incl. waiver, AUD ex GST (by days on hire)', 'Oct hire, AUD ex GST', 'Nov hire, invoiced in Oct, AUD ex GST', 'Services, sales, other, AUD ex GST (no dates)', 'POs against this contract'])
    for r in REV: w.writerow([r['inv'], r['date'], r['contract'], r['branch'], '%.2f' % r['ex'], '%.2f' % r['waiver']] + ['%.2f' % r['m'][k] for k in MO] + ['%.2f' % r['svc'], pos_of(r['contract'])])
    w.writerow([]); w.writerow(['Labour', 'Branch', 'September h', 'October h', 'November h (to 13 Nov)'])
    for typ in ('Coates wages', 'Salary', 'Labour hire'):
        for b in ('KINP', 'STPS', 'NVAC'):
            vals = [L.get((typ, b, k), 0) for k in MO]
            if any(vals): w.writerow([typ, b] + ['%.2f' % v for v in vals])
    for b_ in ('KINP', 'STPS', 'NVAC', 'MEAD'):
        vals_ = [LHB.get((b_, k), 0) for k in MO]
        if any(vals_): w.writerow(['Labour hire cost (running sheet basis; the P&L uses Job Connect’s invoices where received)', b_] + ['%.2f' % v for v in vals_])
    w.writerow([]); w.writerow(['Staff hours by contract', 'Branch', 'What', 'How', 'September h', 'October h', 'November h (to 13 Nov)'])
    for c_ in ['KINP', '9972648', '9961976']:
        hs = [CON.get((c_, k), 0) for k in MO]
        if any(hs): w.writerow([c_] + list(CLABEL[c_]) + ['%.2f' % v for v in hs])
    w.writerow([]); w.writerow(['Person', 'Home branch', 'Contract', 'September h', 'October h', 'November h (to 13 Nov)'])
    for who in sorted(HOME):
        for c_ in ['KINP', '9972648', '9961976']:
            hs = [CONP.get((who, c_, k), 0) for k in MO]
            if any(hs): w.writerow([who, HOME[who][0], c_ if c_ != 'KINP' else 'KINP'] + ['%.2f' % v for v in hs])
    w.writerow([]); w.writerow(['Person', 'Type', 'Home branch (record)', 'Journal', 'Receiving branch', 'September h', 'October h', 'November h (to 13 Nov)', 'Labour hire $'])
    for who in sorted(HOME):
        home, typ = HOME[who]
        for b in ('KINP', 'STPS', 'NVAC'):
            hs = [PH.get((who, k, b), 0) for k in MO]
            if any(hs): w.writerow([who, typ, home, ('stays' if b == home else home + ' -> ' + b) + {'STPS': ' (9972648)', 'NVAC': ' (9961976)'}.get(b, ''), b] + ['%.2f' % v for v in hs] + ['%.2f' % sum(PC.get((who, k, b), 0) for k in MO)])


# ---------------- accruals beside what we charged the V8s for the same work (Andrew, 31 Oct: "we need to understand what we charged v8s
#                  for to do with this and state we are still waiting for invoice and this is the esitimate cost. And we do same with fencing")
ACC = [
 ('Event Portables (toilets) — no PO or invoice on the record; estimated cost from their four quotes at what was supplied', [
   ('Toilet hire: their 195 FWF at 90.07, 6 pee panels, 2 × 16-pan blocks', '9968955 · 25122322 FWF lines + L98 · 9994954 · 25123999 L19', 27300.93, 'Q6845 hire', 28675.00),
   ('Pump-outs and servicing (their 702 FWF services include our FWF they cleaned)', '9968955 · 25122322 L141 (702 FWF) · L142 (24 tanks)', 66145.14, 'Q6844: 702 FWF, 18 tanks, 51 block cleans', 41772.00),
   ('Toilet transport (all toilets, ours and theirs; our carriers’ cost for our own toilets sits in the transport line, not here)', '9968955 · 25122322 L147, L148, L149, L162, L167 (45,215.00) · 9994954 · 25123999 L18 (2,000.00) and L24 FWF (1,235.00)', 48450.00, 'Q6845: their delivery and pickup', 13500.00),
   ('Water truck and pre-fill', 'no identified matching charge', 0.00, 'Q6844', 9600.00),
   ('Build-period water deliveries and tank', 'no identified matching charge', 0.00, 'Q6846', 4850.00),
   ('Pit lane party Porta Lisa', 'no identified matching charge', 0.00, 'Q6847', 3350.00)]),
 ('Advanced Temporary Fencing — POs 4647508–4647520 and 4658850 invoiced; the event week (PO 4647522) and demob week 1 (PO 4647523) part is an estimate, invoices still to come', [
   ('Fencing, all of it (one block to 13 Nov)', '9990776 · 25122628 fencing lines 335,097.44 + waiver 35,791.11 (leaves out WB13, a water barrier on the same invoice: L1 82.60 plus its waiver)', 370888.55, 'invoiced and receipted, weeks 1–6 and a collection (the cost side runs to demob week 1; the 750.00 week 2 forecast is outside this comparison)', 214225.00),
   ('', '', None, 'ESTIMATE, invoice still to come: event week (PO 4647522) 71,159.70 + demob week 1 (PO 4647523) 8,025.00', 79184.70)]),
 ('Premiair Services — no PO or invoice on the record; estimated cost from the cost rate keyed on 9961265', [
   ('Sub-hired VMS boards, eight lines', '9961265 · 25125589 lines 13, 24–26, 28–31', 2787.72, 'cost rate 53.61 a day × hire days (line 15 taken out: not on the contract)', 3270.21)]),
 ('Royal Wolf (United Rentals) — no PO or invoice on the record; estimated cost from the cost rate keyed on 9974042', [
   ('Refrigerated container, with its share of delivery and pickup', '9974042 · 25124058 L2 1,428.00 + an equal share of the joint delivery and pickup L3/L4 (1,000.00; not an itemised amount)', 2428.00, 'cost rate, once', 1364.23)]),
]
arow = ''
for head, lines in ACC:
    ch = r2(sum(l[2] or 0 for l in lines)); co = r2(sum(l[4] or 0 for l in lines))
    arow += "<tr class='sec2'><td colspan='5'><b>%s</b></td></tr>" % e(head)
    for what, where, c, basis, cost in lines:
        arow += "<tr><td>%s</td><td><span class='w'>%s</span></td><td class='n'>%s</td><td><span class='w'>%s</span></td><td class='n'>%s</td></tr>" % (e(what), e(where), m(c) if c is not None else '<em>see note</em>' if where else '', e(basis), m(cost))
    arow += "<tr class='sub'><td>Total</td><td></td><td class='n'>%s</td><td>Charged less estimated cost: %s</td><td class='n'>%s</td></tr>" % (m(ch), m(r2(ch - co)), m(co))
# ---------------- HTML
def tbl(head, body, cls=''):
    return "<div class='wrap'><table class='%s'><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>" % (cls, ''.join('<th%s>%s</th>' % (" class='n'" if h.startswith('#') else '', e(h.lstrip('#'))) for h in head), body)
def pof(p_): return 'no PO on the record' if p_.startswith('none') else ('paid through payroll' if p_ == 'payroll' else 'PO ' + p_)
urow = ''
for c_ in ORDER_C:
    its = MU.get(c_, [])
    cell = '<br>'.join('%s · <span class=\'w\'>%s · %s</span>%s' % (e(a_), e(pof(p_)), e(st_), (' · <b>' + m(v_) + '</b>') if v_ is not None else '') for a_, p_, v_, st_ in its) or "<span class='w'>no supplier PO or cost on the record against it</span>"
    if c_ in NOTE: cell += "<br><span class='w'>" + e(NOTE[c_]) + '</span>'
    tc_ = r2(sum(x[2] or 0 for x in its))
    urow += "<tr><td><b>%s</b> · %s</td><td>%s</td><td class='n'>%s</td><td><span class='w'>%s</span></td><td>%s</td><td class='n'>%s</td></tr>" % (e(c_), e(BR_OF[c_] or ''), e(INV_OF[c_]), m(EX_OF[c_]), e(ONIT[c_]), cell, m(tc_) if tc_ else '—')
urow += "<tr class='sec2'><td colspan='6'><b>Not tied to one hire contract</b> <span class='w'>(the record, the PO and Baseplan (12) don't name one)</span></td></tr>"
for a_, p_, v_, st_ in NT:
    urow += "<tr><td>—</td><td></td><td></td><td></td><td>%s · <span class='w'>%s · %s</span></td><td class='n'>%s</td></tr>" % (e(a_), e(pof(p_)), e(st_), m(v_))
urow += "<tr class='sub'><td>The job</td><td>18 invoices</td><td class='n'>%s</td><td><span class='w'>plus the November forecast %s (NVAC generator pick-up, not invoiced yet)</span></td><td>All costs: tied to a contract %s · not tied %s</td><td class='n'>%s</td></tr>" % (
    m(sum(EX_OF.values())), m(839.07), m(MU_TOT), m(NT_TOT), m(r2(MU_TOT + NT_TOT)))
MATCH_HTML = ("<h2>3b · Where things match up: hire contract, V8s invoice, our POs and costs</h2><p class='s'>Every hire contract we invoiced, what's on it, and the purchase orders and costs that sit against it. "
              "Carriers are tied by the delivery docket on each load (Baseplan (12)'s docket list names the hire contract). Where the record, the PO or Baseplan (12) doesn't tie a cost to one contract, it's listed under the contracts and says so: nothing here is guessed.</p>"
              + tbl(['Hire contract · branch', 'V8s invoice', '#Ex GST', 'What’s on it (the invoice’s biggest lines)', 'Our POs and costs against it', '#Costs against it'], urow))
ACC_HTML = tbl(['What', 'Where we charged the V8s (hire contract · invoice · line)', '#Charged to the V8s', 'Cost basis', '#Cost (estimate where no invoice)'], arow)
crow = ''.join("<tr class='%s'><td><b>%s</b><br><span class='w'>%s</span></td><td>%s</td><td>%s</td><td><span class='w'>%s</span></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'><b>%s</b></td><td><span class='w'>%s</span></td></tr>" % (
    'acc' if r[9] else ('nd' if 'NOT DATED' in r[11] else ''), e(r[0]), e(r[3]), e(r[4]), e(r[5]), e(ch_), m(r[6]), m(r[7]), m(r[8]), m(r[9]) if r[9] else '', e(r[11] + ' · ' + r[10])) for r, ch_ in zip(C, CH))
crow += "<tr class='sub'><td>Total costs</td><td></td><td></td><td></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td></td></tr>" % (m(tot[0]), m(tot[1]), m(tot[2]), m(acc_total))
lrow = ''
for typ in ('Coates wages', 'Salary', 'Labour hire'):
    for b in ('KINP', 'STPS', 'NVAC'):
        vals = [L.get((typ, b, k), 0) for k in MO]
        if any(vals): lrow += "<tr><td>%s</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (e(typ), b, ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in vals), hd(sum(vals)))
for b_ in ('KINP', 'STPS', 'NVAC', 'MEAD'):
    vals_ = [LHB.get((b_, k), 0) for k in MO]
    if any(vals_): lrow += "<tr class='sub'><td>Labour hire cost (running sheet basis)</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (b_, ''.join("<td class='n'>%s</td>" % m(v) for v in vals_), m(sum(vals_)))
rrow = ''.join("<tr><td>%s</td><td>%s</td><td>%s · %s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td><span class='w'>%s</span></td></tr>" % (
    e(r['inv']), e(r['date'] or ''), e(r['contract'] or ''), e((r['branch'] or '') + ('' if r['cust'] == 'V8 Supercars' else ' · to ' + r['cust'])), m(r['ex']), m(r['m']['Sep']), m(r['m']['Oct']), m(r['m']['Nov']), m(r['svc']), e(pos_of(r['contract']))) for r in REV)
rrow += "<tr class='sub'><td>18 invoices</td><td></td><td></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td></td></tr>" % (m(sum(r['ex'] for r in REV)), m(RT['Sep']), m(RT['Oct']), m(RT['Nov']), m(UND))
prow = ''
for who in sorted(HOME, key=lambda w: (HOME[w][1].startswith('Labour hire'), w)):
    home, typ = HOME[who]
    for b in ('KINP', 'STPS', 'NVAC'):
        hs = [PH.get((who, k, b), 0) for k in MO]
        if not any(hs): continue
        cs = [PC.get((who, k, b), 0) for k in MO]
        cn = {'STPS': ' (9972648, water barriers)', 'NVAC': ' (9961976, generators)'}.get(b, '')
        move = ('stays on ' + b if b == home else 'journal ' + home + ' → ' + b) + cn
        prow += "<tr%s><td><b>%s</b><br><span class='w'>%s</span></td><td>%s</td><td><b>%s</b></td>%s<td class='n'>%s</td><td class='n'>%s</td></tr>" % (
            "" if b == home else " class='acc'", e(who), e(typ), home, e(move), ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in hs),
            hd(sum(hs)), m(sum(cs)) if sum(cs) else '')
PERSON_HTML = tbl(['Person · type', 'Home branch', 'Journal', '#Sep h', '#Oct h', '#Nov h (to 13 Nov)', '#Total h', '#Labour hire $'], prow)
order_c = ['KINP', '9972648', '9961976']
crow2 = ''
for c_ in order_c:
    hs = [CON.get((c_, k), 0) for k in MO]
    if not any(hs): continue
    br_, what_, how_ = CLABEL[c_]
    crow2 += "<tr><td><b>%s</b> · %s<br><span class='w'>%s · %s</span></td>%s<td class='n'><b>%s</b></td></tr>" % (e(c_ if c_ != 'KINP' else 'KINP'), br_, e(what_), e(how_), ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in hs), hd(sum(hs)))
crow2 += "<tr class='sub'><td>All staff hours</td>%s<td class='n'>%s</td></tr>" % (''.join("<td class='n'>%s</td>" % hd(sum(CON.get((c_, k), 0) for c_ in order_c)) for k in MO), hd(sum(CON.values())))
CON_HTML = tbl(['Contract · branch', '#Sep h', '#Oct h', '#Nov h (to 13 Nov)', '#Total h'], crow2)
prow2 = ''
for who in sorted(HOME, key=lambda w: (HOME[w][1].startswith('Labour hire'), w)):
    for c_ in order_c:
        hs = [CONP.get((who, c_, k), 0) for k in MO]
        if not any(hs): continue
        prow2 += "<tr><td>%s</td><td>%s</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (e(who), HOME[who][0], e(c_ if c_ != 'KINP' else 'KINP (no contract number)'), ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in hs), hd(sum(hs)))
CONP_HTML = tbl(['Person', 'Home branch', 'Contract', '#Sep h', '#Oct h', '#Nov h', '#Total h'], prow2)
css = """:root{--ink:#1d2730;--mute:#6b7681;--line:#e3e7eb;--bg:#f7f8f6;--card:#fff;--accent:#9c470c;--sub:#f1f4f6;--acc:#fff4e5;--nd:#fdecea}
@media (prefers-color-scheme:dark){:root{--ink:#e6eaee;--mute:#9aa5b0;--line:#2b343c;--bg:#14191e;--card:#1b2228;--accent:#f0a46a;--sub:#222b33;--acc:#33281a;--nd:#3a1f1c}}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}main{max-width:1180px;margin:0 auto;padding:20px 16px 40px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:26px 0 8px;color:var(--accent)}.s{color:var(--mute);margin:0 0 12px}.w{color:var(--mute);font-size:12px}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px;background:var(--card);border:1px solid var(--line)}th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)}.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}tr.sub td{font-weight:700;background:var(--sub)}tr.sec2 td{background:var(--sub);font-size:13px}tr.acc td{background:var(--acc)}tr.nd td{background:var(--nd)}
ul{margin:6px 0 0 18px}li{margin:3px 0}.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:12px 0}.k div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.k b{display:block;font-size:20px}
@page{size:A4 landscape;margin:9mm}
@media print{:root{--ink:#000;--mute:#3d4650;--line:#b9c0c6;--bg:#fff;--card:#fff;--accent:#7a3500;--sub:#eef1f3;--acc:#fff1dc;--nd:#fde5e2}
html,body{background:#fff!important;color:#000;font-size:8.5px}main{max-width:none;padding:0}h1{font-size:15px}h2{font-size:11.5px;margin:12px 0 4px;break-after:avoid;page-break-after:avoid}h3{font-size:10px;break-after:avoid}
.s,.w{font-size:8px}.wrap{overflow:visible!important}table{min-width:0!important;width:100%!important;font-size:7.6px}th,td{padding:2px 4px;overflow-wrap:anywhere}th{font-size:7px}
thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}.k{grid-template-columns:repeat(4,1fr)}.k b{font-size:13px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}"""
body = f"""<main><h1>GC500 P&amp;L, final · pack v1.8</h1><p class='s'>As at 31 Oct 2026 · AUD ex GST · from the live record (12676), the 18 invoices to the V8s and the purchase orders · Author: Andrew Fisher</p>
<div class='k'><div><span class='w'>To accrue at 31 Oct (costs for work done, not invoiced)</span><b>{m(acc_total)}</b></div><div><span class='w'>Costs by month of work</span><b>Sep {m(tot[0])}</b><span class='w'>Oct {m(tot[1])} · Nov {m(tot[2])}</span></div>
<div><span class='w'>Invoiced to the V8s (all 18 in October)</span><b>{m(sum(r['ex'] for r in REV))}</b><span class='w'>hire days: Sep {m(RT['Sep'])} · Oct {m(RT['Oct'])} · Nov {m(RT['Nov'])}; services {m(UND)}</span></div></div>
<h2>1 · Costs by supplier and month, with what to accrue</h2><p class='s'>Each line names its purchase order and the hire contract and V8s invoice it's charged on (section 3b groups them by contract). Orange rows: accrue at 31 Oct (they reverse on 1 Nov and the invoice lands against them). Red rows: the record carries no date; where they sit is said on the row.</p>
{tbl(['Supplier · what', 'PO', 'Invoice / receipt', 'Charged on (hire contract · V8s invoice)', '#Sep', '#Oct', '#Nov', '#Accrue 31 Oct', 'Status · how dated'], crow)}
<h2>1b · Accruals beside what we charged the V8s</h2><p class='s'>Each accrued supplier next to what we charged the V8s for the same work. Where no supplier invoice has been seen, the cost is an estimate and says so; it is replaced when the invoice comes. Charges are before the damage waiver except the fencing, which shows its invoice in full.</p>
""" + ACC_HTML + f"""
<h2>2 · Labour by month and branch, to 13 Nov</h2><p class='s'>Hours from the running sheet, allocated by the job’s rules (KINP rule, the water barriers on STPS, the generators at 1.5 h in and out, the event weekend’s mechanic and electrician on NVAC). Coates wages and salary are hours only. The labour hire cost rows are the running sheet’s ({m(34926.79)}), by the branch that received the hours; the P&L carries Job Connect’s invoices where received and the running sheet where not ({m(34748.64)}, section 1).</p>
{tbl(['Type', 'Branch', '#September h', '#October h', '#November h (to 13 Nov)', '#Total h'], lrow)}
<h2>2b · Labour by person: home branch, and where the cost is journaled to</h2><p class='s'>Home branch from each person's row on the record. Journal to: the job’s allocation rules (the people's costs on KINP; water barriers on STPS; the generators at 1.5 h in and out on NVAC; Frank Devilles and Ludwig Chee, the event weekend’s mechanic and electrician, on NVAC). Coates wages and salary are hours (finance applies the pay cost); labour hire is dollars at the record's rates. Branch names for NOIS, NTSP, BFIS and NSNA aren't on the record.</p>
""" + PERSON_HTML + f"""
<h2>2c · Staff hours by contract</h2><p class='s'>Outside KINP, the contract is named: the water barriers on 9972648 (STPS) and the generators on 9961976 (NVAC), from the hours on the running sheet's notes; Frank Devilles and Ludwig Chee, the event weekend’s mechanic and electrician (23–25 Oct, 36 h each), on 9961976. NVAC bills one Event Gen Tech, the event labour scope's one a day: 31.55 h, {m(4735.97)} on 25121022 (the invoice prints 31), and 4.5 h, {m(675.50)} on KINP's 25123999 (the invoice prints 4). Worked hours and billed hours are different facts. Everything else is KINP (no contract number). Labour hire costs are coded to Installs.</p>
""" + CON_HTML + f"""
<h3>By person and contract</h3>
""" + CONP_HTML + f"""
<h2>3 · The 18 invoices, and their hire split across the months (AUD ex GST)</h2><p class='s'>Invoice 25124396 (9994248, {m(1974.05)}) is not GC500 revenue: it is invoiced to Gold Coast Helitours, not V8 Supercars, and no cost on the record ties to it. All 18 are dated 27–30 Oct, and the revenue is booked in the invoice month, October. The November column is the hire for days in November on these October invoices: shown for information, not moved. Each month's hire $ is the invoice's dated hire lines and the damage waiver on them (AUD ex GST), split across the months by the days on hire, from the invoice's own on/off-hire times; the cents are reconciled once, so each row adds to its ex GST exactly. Services and sales carry no dates on the invoice; they're in the services column. The last column is the purchase orders against each contract; section 3b has the detail.</p>
{tbl(['Invoice', 'Date', 'Contract · branch', '#Ex GST', '#Sep hire (AUD ex GST)', '#Oct hire (AUD ex GST)', '#Nov hire, invoiced in Oct (AUD ex GST)', '#Services, sales, other (AUD ex GST, no dates)', 'POs against this contract'], rrow)}
{MATCH_HTML}
<h2>4 · Dates and estimates: what the record gives, and what it can't</h2><ul>
<li>Transport: every load is dated by the schedule (the work date). The figures are the schedule's (the carriers' minimums), not carrier invoices; the invoices will confirm the amounts and their own dates.</li>
<li>Alfie Harris's 12 nights at 223.63 a night (on the record from 1 Nov): 8 in October ({m(ALF_OCT)}, accrued) and 4 in November ({m(ALF_NOV)}, forecast), until the invoice comes.</li>
<li>The salary allowance ({m(14700)}) covers the record's window, 14 Sep–13 Nov; it's split by the salaried hours inside it (the 55 h before 14 Sep are outside it).</li>
<li>Event Portables: no invoice or PO on the record; costed from their four approved quotes. Q6846 is at its quoted 4,850.00.</li>
<li>Service lines on the invoices (transport, install and demob, pump-outs, labour, accommodation recharges, scrim, toilet paper): {m(UND)}, no dates on the invoice. Dating them to the work needs each one matched to the record; that's the next piece.</li></ul>
</main>"""
# ---------------- the final P&L pack: summary by branch, journals, open items, and an Excel workbook (appended to build_monthend.py)
REV_B = collections.defaultdict(float)
for r in REV: REV_B[r['branch']] += r['ex']
REV_B = {b: r2(v) for b, v in REV_B.items()}
NOV_REV = {'NVAC': 839.07}            # the generator pick-up charge of 29 Oct, not on an invoice yet (forecast)
COST_B = {   # management view, job end; people's costs on KINP (29 Oct ruling) except labour hire on the water barriers (Kyle Gover, 8 h on 9972648)
             # and Ludwig Chee's three event nights, which follow his hours to NVAC (Andrew, 31 Oct)
 'KINP': [('Event Portables, toilets (estimate; no PO or invoice on the record; charged on 9968955 and 9994954)', 101747.00),
          ('Premiair, sub-hired VMS boards (estimate; no PO on the record; charged on 9961265)', 3270.21),
          ('Transport, carriers (no POs or carrier invoices on the record; by load)', 42073.62),
          ('Labour hire, coded to Installs: Job Connect POs 4657010 · 4660565 · 4661783 · 4665091 · 4667755 · 4668970 · 4670882 · 4671825 (invoices where received, the running sheet where not)', r2(34748.64 - 460.78)),
          ('Salary allowance (payroll; the PM’s labour is charged on 9968862 and 9968955)', 14700.00),
          ('Accommodation (the V8s pay ACCOM / ETC on 9968862 L82 and 9968955 L118)', r2(ACCOM - 655.71)),
          ('Meals, expenses and equipment R&M', 5664.32),
          ('Consumables: POs 4666720 BSF cranes 2,896.00 · 4670876 soap 180.00', 3076.00)],
 'STPS': [('Fencing, Advanced: invoiced and receipted, POs 4647508 · 4647509 · 4647515 · 4647517 · 4647519 · 4647520 · 4658850 (charged on 9990776)', 214225.00),
          ('Fencing, Advanced: estimate, invoices still to come on POs 4647522 and 4647523 (charged on 9990776)', 79184.70),
          ('Fencing, Advanced: demob week 2, PO 4647523 (forecast)', 750.00),
          ('Royal Wolf, refrigerated container (estimate; no PO on the record; charged on 9974042)', 1364.23),
          ('Transport, carriers (no POs or carrier invoices on the record; by load)', 4186.02),
          ('Labour hire on the water barriers: Kyle Gover 8 h on 15 Oct, PO 4668970, on 9972648 (journal from KINP)', 460.78),
          ('Consumables: POs 4663216 cable ties for the fencing 2,538.64 (9990776) · 4655573 star pickets 100.00', 2638.64)],
 'NVAC': [('Transport, carriers (no POs or carrier invoices on the record; by load)', 9313.78),
          ('Accommodation: Ludwig Chee’s three event nights, 23–25 Oct (with his hours on 9961976; journal from KINP)', 655.71),
          ('Consumables: POs 4669481 siphon hose 42.34 · 4670270 concert generator sync 579.68 (charged on 9994954 L11)', 622.02)],
 'MEAD': [('Transport, carriers (no POs or carrier invoices on the record; by load)', 1237.23)]}
CB = {b: r2(sum(v for _, v in LL)) for b, LL in COST_B.items()}
assert abs(sum(CB.values()) - 543508.93) < 0.005, CB
assert abs(sum(REV_B.values()) - 1001063.07) < 0.005, REV_B
JOB_REV, JOB_COST = r2(sum(REV_B.values()) + sum(NOV_REV.values())), r2(sum(CB.values()))
srow = ''
for b in ('KINP', 'STPS', 'NVAC', 'MEAD'):
    rv = r2(REV_B.get(b, 0) + NOV_REV.get(b, 0)); d = r2(rv - CB[b])
    srow += "<tr><td><b>%s</b></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (
        e({'KINP': 'KINP · Brisbane Portables', 'STPS': 'STPS · Brisbane Traffic', 'NVAC': 'NVAC · North Power and HVAC', 'MEAD': 'MEAD · Brisbane Mechanical Specialist'}[b]),
        m(REV_B.get(b, 0)), m(NOV_REV.get(b, 0)), m(rv), m(CB[b]), m(d), '{:.1%}'.format(d / rv))
srow += "<tr class='sub'><td>The job</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (
    m(sum(REV_B.values())), m(sum(NOV_REV.values())), m(JOB_REV), m(JOB_COST), m(JOB_REV - JOB_COST), '{:.1%}'.format((JOB_REV - JOB_COST) / JOB_REV))
crowB = ''
for b, LL in COST_B.items():
    crowB += "<tr class='sec2'><td colspan='2'><b>%s</b></td></tr>" % b
    for k, v in LL: crowB += "<tr><td>%s</td><td class='n'>%s</td></tr>" % (e(k), m(v))
    crowB += "<tr class='sub'><td>%s costs</td><td class='n'>%s</td></tr>" % (b, m(CB[b]))
JOURNALS = [
 ('Accrual · Advanced, event week', '4647522', '9990776 (inv 25122628)', '2126 Rehire 34,568.70 · 2142 Installation 36,591.00', 'STPS', 71159.70),
 ('Accrual · Advanced, demob week 1', '4647523', '9990776 (inv 25122628)', '2126 Rehire 6,625.00 · 2142 Installation 1,400.00', 'STPS', 8025.00),
 ('Accrual · Event Portables (estimate)', 'none on the record', '9968955 (inv 25122322) · 9994954 (inv 25123999)', '2126 · 3325 (toilet pump-outs)', 'KINP', 101747.00),
 ('Accrual · Job Connect, w/e 11 Oct to 1 Nov (estimate)', '4665091 · 4667755 · 4668970 · 4670882 · 4671825 · none for w/e 1 Nov', 'KINP work, no contract number (Kyle Gover’s 8 h on 15 Oct: 9972648)', 'Installs (as coded)', 'KINP', 24348.75),
 ('Accrual · Premiair (estimate)', 'none on the record', '9961265 (inv 25125589)', '2126', 'KINP (cost SA KINP-SUB)', 3270.21),
 ('Accrual · Royal Wolf (estimate)', 'none on the record', '9974042 (inv 25124058)', '2126', 'STPS (cost SA STPS-SUB)', 1364.23),
 ('Accrual · accommodation, Alfie Harris’s 8 October nights at 223.63 (estimate; the 4 November nights, 894.52, are November forecast)', 'none', 'job-wide (the V8s pay ACCOM / ETC on 9968862 L82 and 9968955 L118)', '3520 · 3501', 'KINP', ALF_OCT)]
assert abs(sum(j[5] for j in JOURNALS) - acc_total) < 0.005, (sum(j[5] for j in JOURNALS), acc_total)
MOVES = [   # zero-net interbranch schedule at 31 Oct (Codex audit F11): cost journals between branches, not accruals; labour hours moves are in section 2b
 ('Branch move · labour hire, Kyle Gover 8 h on the water barriers (15 Oct)', '4668970', '9972648 (inv 25125600)', 'Installs (as coded)', 'KINP −460.78 · STPS +460.78', 460.78),
 ('Branch move · accommodation, Ludwig Chee’s 3 event nights (23–25 Oct), with his hours', 'none', '9961976 (inv 25121022), with his hours', '3520 · 3501', 'KINP −655.71 · NVAC +655.71', 655.71)]
jrow = ''.join("<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class='n'>%s</td></tr>" % (e(a), e(b_), e(k_), e(c_), e(d_), m(v)) for a, b_, k_, c_, d_, v in JOURNALS)
jrow += "<tr class='sub'><td>Accruals at 31 Oct (each reverses on 1 Nov; the invoice lands against it)</td><td></td><td></td><td></td><td></td><td class='n'>%s</td></tr>" % m(acc_total)
mrow = ''.join("<tr class='acc'><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class='n'>%s</td></tr>" % (e(a), e(b_), e(k_), e(c_), e(d_), m(v)) for a, b_, k_, c_, d_, v in MOVES)
mrow += "<tr class='sub'><td>Net across the branches (each move takes from one and adds to the other; job cost and accruals don't change)</td><td></td><td></td><td></td><td></td><td class='n'>0.00</td></tr>"
OPEN = [        'Event Portables hire: the 195 units include 7 received at references an earlier other-contract rule leaves out (735.00 at 105.00 if they are not GC500’s). Map them against Event Portables’ invoice; nothing deducted.',
        'Event Portables: their invoice; check block cleans (51 done, no identified matching charge), water (9,600.00, no identified matching charge), Porta Lisa (3,350.00, no identified matching charge), tank pump-outs (18 done, 24 charged).',
        'Advanced: invoices for POs 4647522 and 4647523; possible extra 2,577.00 (36524, note 24479, the week 6 balance) not accrued.',
        'Premiair and Royal Wolf: invoices; VMS19 and VMS20 billed to the V8s at 0.00; the keyed Premiair cost rate equals the V8s rate.',
        'Job Connect: invoices for w/e 11 Oct to 8 Nov; the running sheet is 178.15 over the invoices received (the P&L uses the invoices).',
        'Transport: the figures are the schedule’s (the carriers’ minimums), not carrier invoices; 23,660.56 is forecast (loads with no figure, and planned loads).',
        'Supplier side: estimates stay estimates until the invoices come; six POs carry no invoice status on the record; Coates wages are hours only (no pay rate applied).',
        'Carriers to a contract: 17,603.97 of the loads to date carry no docket that Baseplan (12) ties to a hire contract (17,033.97 with no docket; docket 26095295, 570.00, not in Baseplan (12)). The carrier invoices or the dockets will tie them.',
        'On the page but on no invoice: the line-by-line list (KINP 5,268.23 · STPS 20,206.68 · NVAC 943.55 · MEAD 2,769.70): to chase or drop.',
        'Possible extra revenue: WB02 to 3 Nov (about 1,500.00), WB03 (354.00), concert contract 9994954 still on site, generator hire after 28 Oct and fuel, 350 kVA transport (1,200.00); and a VMS credit if 10001927 and 9961265 carry the same boards (−1,072.20).']
PACK_HTML = ("<h2>0 · The job by branch</h2><p class='s'>Revenue is the 18 invoices to V8 Supercars (all October; 25124396, 1,974.05, is invoiced to Gold Coast Helitours and is not GC500 revenue) plus November's forecast; the two scrim invoices 25120652 and 25120689 are STPS on their headers and Baseplan (12)'s sales codes; costs are the management view at job end, by the branch that carries them. Labour hire on the water barriers is journaled to STPS, and Ludwig Chee's three event nights to NVAC with his hours; the rest of the people's costs sit on KINP. Revenue is booked in October, the invoice month; the November hire days on those invoices are shown in section 3.</p>"
  + tbl(['Branch', '#Invoiced (Oct)', '#November forecast', '#Revenue', '#Costs', '#Difference', '#Kept'], srow)
  + "<h3>Costs by branch</h3>" + tbl(['Cost', '#Amount'], crowB)
  + "<h2>4 · Journals at 31 Oct</h2>" + tbl(['Journal', 'PO', 'Hire contract (where charged)', 'Account', 'Branch', '#Amount'], jrow)
  + "<h3>Branch moves at 31 Oct (cost journals, not accruals)</h3>" + tbl(['Journal', 'PO', 'Hire contract', 'Account', 'Legs (zero net)', '#Amount'], mrow)
  + "<p class='s'>Labour journals (hours; Coates wages and salary are hours only): see section 2b, each person from their home branch to the branch of the work, with the contract named outside KINP.</p>"
  + "<h2>5 · Open items</h2><ul>" + ''.join('<li>' + e(o) + '</li>' for o in OPEN) + "</ul>")

# ---------------- Excel workbook
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.worksheet.page import PageMargins
wb = Workbook(); MONEY = '#,##0.00;[Red]-#,##0.00'; HOURS = '#,##0.0'
def sheet(title, head, rows, money_cols=(), hour_cols=(), widths=None, first=False):
    ws = wb.active if first else wb.create_sheet()
    ws.title = title[:31]; ws.append(head)
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='1D2730'); c.alignment = Alignment(wrap_text=True, vertical='top')
    for r in rows: ws.append(list(r))
    for col in money_cols:
        for cell in ws.iter_rows(min_row=2, min_col=col, max_col=col):
            for c in cell: c.number_format = MONEY
    for col in hour_cols:
        for cell in ws.iter_rows(min_row=2, min_col=col, max_col=col):
            for c in cell: c.number_format = HOURS
    for i, w in enumerate(widths or [], 1): ws.column_dimensions[get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            if isinstance(c.value, str): c.alignment = Alignment(wrap_text=True, vertical='top')
            elif c.value is not None: c.alignment = Alignment(vertical='top')
    ws.freeze_panes = 'A2'
    ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True); ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.page_margins = PageMargins(left=0.4, right=0.4, top=0.7, bottom=0.6, header=0.3, footer=0.3)
    ws.print_title_rows = '1:1'; ws.print_area = 'A1:%s%d' % (get_column_letter(ws.max_column), ws.max_row)
    ws.oddHeader.left.text = 'GC500 P&&L pack v1.8 · ' + title; ws.oddHeader.right.text = 'As at 31 Oct 2026 · AUD, ex GST · record 12676'
    ws.oddFooter.left.text = 'Author: Andrew Fisher · private to the job team'; ws.oddFooter.right.text = 'Page &P of &N'
    return ws
ws_sum = sheet('Summary', ['Branch', 'Invoiced (Oct)', 'November forecast', 'Revenue', 'Costs', 'Difference'],
      [[b, REV_B.get(b, 0), NOV_REV.get(b, 0), r2(REV_B.get(b, 0) + NOV_REV.get(b, 0)), CB[b], r2(REV_B.get(b, 0) + NOV_REV.get(b, 0) - CB[b])] for b in ('KINP', 'STPS', 'NVAC', 'MEAD')]
      + [['The job', r2(sum(REV_B.values())), r2(sum(NOV_REV.values())), JOB_REV, JOB_COST, r2(JOB_REV - JOB_COST)], [],
         ['As at 31 Oct 2026 · AUD, ex GST · from the live record (12676), the 18 invoices to V8 Supercars (25124396, to Gold Coast Helitours, is not GC500 revenue), the purchase orders and Baseplan (12) · pack v1.8'],
         ['Revenue is booked in October, the invoice month; the November forecast is the 839.07 NVAC generator pick-up, not invoiced yet. Costs are the management view at job end.']],
      money_cols=range(2, 7), widths=[14, 16, 18, 16, 16, 16], first=True)
for r_ in (ws_sum.max_row - 1, ws_sum.max_row):
    ws_sum.merge_cells(start_row=r_, start_column=1, end_row=r_, end_column=6); ws_sum.row_dimensions[r_].height = 30
sheet('Revenue by invoice', ['Invoice', 'Date', 'Contract', 'Branch', 'Ex GST (booked in October)', 'Damage waiver', 'Sep hire incl. waiver, AUD ex GST (by days on hire)', 'Oct hire, AUD ex GST', 'Nov hire, invoiced in Oct, AUD ex GST', 'Services, sales, other, AUD ex GST (no dates)', 'POs against this contract'],
      [[r['inv'], r['date'], r['contract'], r['branch'] + ('' if r['cust'] == 'V8 Supercars' else ' · to ' + r['cust']), r['ex'], r['waiver'], r['m']['Sep'], r['m']['Oct'], r['m']['Nov'], r['svc'], pos_of(r['contract'])] for r in REV] + [[]] + [[i_['invoice'], i_['date'], i_['contract'], 'removed', None, None, None, None, None, None, 'Invoiced to Gold Coast Helitours, not V8 Supercars (ex GST 1,974.05): not GC500 revenue'] for i_ in REMOVED],
      money_cols=range(5, 11), widths=[10, 10, 10, 7, 14, 12, 14, 12, 14, 15, 30])
mu_rows = []
for c_ in ORDER_C:
    its = MU.get(c_, []) or [('no supplier PO or cost on the record against it', '', None, '')]
    for j_, (a_, p_, v_, st_) in enumerate(its):
        mu_rows.append([c_, BR_OF[c_], INV_OF[c_], EX_OF[c_] if j_ == 0 else None, ONIT[c_] if j_ == 0 else '', a_, p_, v_, st_ + ((' · ' + NOTE[c_]) if (c_ in NOTE and j_ == 0) else '')])
for a_, p_, v_, st_ in NT: mu_rows.append(['not tied to one contract', '', '', None, '', a_, p_, v_, st_])
mu_rows.append(['The job', '', '18 invoices', r2(sum(EX_OF.values())), 'plus the November forecast 839.07 (NVAC, not invoiced yet)', 'All costs', '', r2(MU_TOT + NT_TOT), 'tied to a contract %.2f · not tied %.2f' % (MU_TOT, NT_TOT)])
sheet('Match-up by contract', ['Hire contract', 'Branch', 'V8s invoice', 'Invoice ex GST', 'What’s on it (the invoice’s biggest lines)', 'Our cost against it', 'PO', 'Cost', 'Status · notes'], mu_rows, money_cols=[4, 8], widths=[14, 7, 10, 12, 28, 34, 24, 12, 40])
sheet('Costs by supplier', ['Supplier', 'Branch', 'Account', 'What', 'PO', 'Invoice / receipt', 'Charged on (hire contract · V8s invoice)', 'September', 'October', 'November', 'Accrue at 31 Oct', 'How dated', 'Status'],
      [list(r[:6]) + [ch_, r[6], r[7], r[8], r[9] if r[9] else None, r[10], r[11]] for r, ch_ in zip(C, CH)], money_cols=range(8, 12), widths=[16, 9, 11, 30, 16, 20, 32, 11, 11, 11, 12, 22, 14])
sheet('Costs by branch', ['Branch', 'Cost', 'Amount'], [[b, k, v] for b, LL in COST_B.items() for k, v in LL], money_cols=[3], widths=[8, 80, 14])
sheet('Accruals vs charges', ['Supplier', 'What', 'Where we charged the V8s', 'Charged to the V8s', 'Cost basis', 'Cost (estimate where no invoice)'],
      [[head.split(' — ')[0], w_, wh, c_, bs, co] for head, lines in ACC for w_, wh, c_, bs, co in lines], money_cols=[4, 6], widths=[18, 34, 32, 13, 32, 14])
sheet('Journals', ['Journal', 'PO', 'Hire contract (where charged)', 'Account', 'Branch', 'Amount'], [list(j) for j in JOURNALS] + [['Total accruals', '', '', '', '', acc_total], [], ['Branch moves at 31 Oct (cost journals, not accruals; zero net)', '', '', '', 'Legs', '']] + [list(j) for j in MOVES] + [['Net across the branches', '', '', '', '', 0.0]], money_cols=[6], widths=[40, 26, 30, 28, 16, 12])
lab_rows = []
for who in sorted(HOME):
    home, typ = HOME[who]
    for b in ('KINP', 'STPS', 'NVAC'):
        hs = [PH.get((who, k, b), 0) for k in MO]
        if any(hs): lab_rows.append([who, typ, home, b, {'STPS': '9972648', 'NVAC': '9961976'}.get(b, ''), 'stays' if b == home else home + ' → ' + b] + [r2(x) for x in hs] + [r2(sum(PC.get((who, k, b), 0) for k in MO))])
sheet('Labour by person', ['Person', 'Type', 'Home branch', 'Branch of the work', 'Contract (outside KINP)', 'Journal', 'Sep h', 'Oct h', 'Nov h (to 13 Nov)', 'Labour hire $ (running sheet)'],
      lab_rows, money_cols=[10], hour_cols=[7, 8, 9], widths=[16, 40, 12, 12, 14, 16, 9, 9, 12, 16])
sheet('Open items', ['Open item'], [[o] for o in OPEN], widths=[160])
wb.save(OUT / 'GC500_PL_final.xlsx')
print('pack: revenue', JOB_REV, 'costs', JOB_COST, 'difference', r2(JOB_REV - JOB_COST), '| branches', CB, '| accrue', acc_total)

new_tiles = ("<div class='k'><div><span class='w'>Revenue (18 invoices + November forecast)</span><b>%s</b><span class='w'>all invoiced in October, including %s of hire (with waiver) for days in November</span></div><div><span class='w'>Costs (management view, job end)</span><b>%s</b></div>"
             "<div><span class='w'>Difference</span><b>%s</b><span class='w'>%s of revenue kept</span></div><div><span class='w'>To accrue at 31 Oct (estimates where no invoice)</span><b>%s</b></div></div>\n") % (
             m(JOB_REV), m(RT['Nov']), m(JOB_COST), m(JOB_REV - JOB_COST), '{:.1%}'.format((JOB_REV - JOB_COST) / JOB_REV), m(acc_total))
import re as _re
body = _re.sub(r"<div class='k'>.*?</div></div>\n", lambda _m: new_tiles, body, count=1, flags=_re.S)
body = body.replace("<h2>1 · Costs by supplier and month, with what to accrue</h2>", PACK_HTML.split('<h2>4 · Journals')[0] + "<h2>1 · Costs by supplier and month, with what to accrue</h2>")
body = body.replace('</main>', '<h2>4 · Journals' + PACK_HTML.split('<h2>4 · Journals')[1] + '</main>')
body = body.replace('<h2>5 · Open items', '<h2>6 · Open items').replace('<h2>4 · Journals', '<h2>5 · Journals')   # one number per section
(OUT / 'GC500_PL_final.html').write_text('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 October month-end</title><style>' + css + '</style></head><body>' + body + '</body></html>', encoding='utf-8')
print('costs Sep %.2f Oct %.2f Nov %.2f = %.2f · accrue %.2f' % (tot[0], tot[1], tot[2], sum(tot), acc_total))
print('revenue hire $ by days on hire Sep %.2f Oct %.2f Nov %.2f · undated %.2f · total %.2f' % (RT['Sep'], RT['Oct'], RT['Nov'], UND, RT['Sep'] + RT['Oct'] + RT['Nov'] + UND))
print('labour hire cost by month', {k: round(v, 2) for k, v in LH.items()})
for typ in ('Coates wages', 'Salary', 'Labour hire'): print(typ, {(b, k): round(L.get((typ, b, k), 0), 1) for b in ('KINP', 'STPS', 'NVAC') for k in MO if L.get((typ, b, k))})
