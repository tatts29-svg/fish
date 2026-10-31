"""Author: Andrew Fisher. GC500 October month-end: every cost by supplier and month with its PO and invoice or receipt numbers and what to
accrue; labour by month and branch to 13 Nov; the 19 invoices, and the hire days on them by month. Read only, from the live record (12640),
the invoices and the POs, 31 Oct 2026. Writes an HTML page and a CSV.

    python3 -I build_monthend.py <out_dir>
"""
import csv, html, json, re, sys, datetime as dt, collections
from pathlib import Path
P = Path('/tmp/gc500-scratch/progress'); OUT = Path(sys.argv[1])
SP = Path('/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad')
r2 = lambda x: round(x + 1e-9, 2)
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
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads to date: figures from the schedule, not carrier invoices', 'none on the record', 'carrier invoices not on the record',
    13131.60, 5370.84, 0, None, 'the load dates; 14,647.65 of these figures carry no date (shown separately below)', 'check carrier invoices')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads to date with no date on the record', '', '', 0, 14647.65, 0, None, 'no date on the record: put in October until the carrier invoices date them', 'NOT DATED')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads still to come (forecast)', '', 'not invoiced', 0, 8796.65, 1873.88, None, 'planned dates', 'forecast')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads still to come with no date (averages)', '', 'not invoiced', 0, 0, 12990.03, None, 'no date on the record: put in November (demob)', 'NOT DATED')
JC = [('w/e 20 Sep', '4657010', 'invoice 3,023.70 (the running sheet says 3,023.85)', 3023.70, 'Sep', 0), ('w/e 27 Sep', '4660565', 'GC500 share 1,299.74', 1299.74, 'Sep', 0),
      ('w/e 4 Oct', '4661783', 'invoice 15294, 3,052.60 (the running sheet says 3,230.60)', 3052.60, 'Sep/Oct', 0), ('w/e 11 Oct', '4665091', 'no amount yet', 2539.92, 'Oct', 2539.92),
      ('w/e 18 Oct', '4667755 · 4668970', 'no amount yet', 6198.75, 'Oct', 6198.75), ('w/e 25 Oct', '4670882 · 4671825', 'no amount yet', 11774.71, 'Oct', 11774.71),
      ('w/e 1 Nov', 'none yet', 'not invoiced', 3835.37, 'Oct', 3835.37), ('w/e 8 Nov', 'none yet', 'not invoiced', 3023.85, 'Nov', 0)]
for wk, po, inv, amt, mo, acc in JC:
    sep = r2(3052.60 * 1960.64 / 3230.60) if wk == 'w/e 4 Oct' else (amt if mo == 'Sep' else 0); octv = r2(3052.60 - r2(3052.60 * 1960.64 / 3230.60)) if wk == 'w/e 4 Oct' else (amt if mo == 'Oct' else 0); nov = amt if mo == 'Nov' else 0
    add('Job Connect (labour hire)', 'KINP', 'Installs (as coded)', 'Running sheet ' + wk, po, inv, sep, octv, nov, acc if acc else 0,
        ('the invoice; split across the months by the running sheet’s days' if wk == 'w/e 4 Oct' else 'the invoice' if wk in ('w/e 20 Sep', 'w/e 27 Sep') else 'the running sheet’s paid hours at the record’s rates (estimate until invoiced)'),
        'ACCRUE (estimate)' if acc else ('invoiced' if mo != 'Nov' else 'November (estimate)'))
add('Accommodation (tracker)', 'KINP', '3520 · 3501', '100 priced nights on the tracker', 'none', 'on the tracker', 6370.36, 11851.89, 3801.71, None, 'the night’s date', 'check how they were paid')
add('Accommodation (tracker)', 'KINP', '3520 · 3501', 'Alfie Harris: 12 nights at their own average, 213.13 (until the invoice comes)', 'none', 'invoice to come', 0, 2557.61, 0, 2557.61, 'nights not dated on the record: put in October', 'ACCRUE · NOT DATED')
add('Meals and expenses (tracker)', 'KINP', '3520 · 3501', 'Meals, expenses and equipment R&M', 'none', 'on the tracker', 2621.53, 2642.79, 400.00, None, 'the date on each line', 'actual')
add('Salary allowance', 'KINP', '3210', 'Salary allowance (forecast, job end)', 'none', 'payroll', 5160.64, 6672.34, 2867.02, None, 'no dates on the record: split by the salaried hours on the running sheet (198 · 256 · 110 h)', 'allocated')
for po, sup, br, gl, what, d, amt in [('4655573', 'Bunnings', 'STPS', '201.STPS.2144.0', 'Star pickets', '18 Sep', 100.00), ('4663216', 'CCI Supplies', 'STPS', '201.STPS.2144.0', 'Cable ties', '7 Oct', 2538.64),
                                     ('4666720', 'BSF Mobile Cranes', 'KINP', '201.KINP.2144.0', 'Building unloads (completed order)', '15 Oct', 2896.00), ('4670270', 'Event Elec', 'NVAC', '201.NVAC.2144.0', 'Concert generator sync (completed order)', '23 Oct', 579.68),
                                     ('4670876', 'Bunnings', 'KINP', '201.KINP.2144.0', 'Hand soap', '24 Oct', 180.00), ('4669481', 'Bunnings', 'NVAC', '201.NVAC.2150.0', 'Siphon hose (completed order)', '26 Oct', 42.34)]:
    add(sup, br, gl, what, po, 'PO ' + d, amt if 'Sep' in d else 0, 0 if 'Sep' in d else amt, 0, None, 'the PO date', 'check invoice')
tot = [r2(sum(r[i] for r in C)) for i in (6, 7, 8)]
assert abs(sum(tot) - 543382.98) < 0.01, (tot, sum(tot))   # the P&L's job costs (with the 750.00 November fencing forecast), at Job Connect's invoices and without Premiair line 15
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
        'Wayne Crimmin': ('STPS', 'Coates wages'), 'Frank Devilles': ('BFIS', 'Coates wages (employment and pay basis unconfirmed on the record)'),
        'Ludwig Chee': ('NSNA', 'Coates wages (employment and pay basis unconfirmed on the record)'), 'Daniel Gough': ('KINP', 'Labour hire, Job Connect, 55.70 an hour'),
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
CON = collections.defaultdict(float); CONP = collections.defaultdict(float)
CLABEL = {'9961976': ('NVAC', 'generators', 'named on the note'), '9972648': ('STPS', 'water barriers', 'named on the note'),
          'KINP': ('KINP', 'everything else: buildings, toilets, the concert, site days', 'KINP; no contract number needed (your call, 31 Oct)')}
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
assert abs(sum(CON.values()) - sum(PH.values())) < 0.01 and set(c for c, _ in CON) <= set(CLABEL), set(c for c, _ in CON) - set(CLABEL)

# ---------------- revenue: the 19 invoices, and the hire days on their dated lines by month
inv = json.load(open(P / 'invoices.json'))
def parse(s): return dt.datetime.strptime(s, '%d/%m/%Y %H:%M')
def split(a, b):
    out = {'Sep': 0.0, 'Oct': 0.0, 'Nov': 0.0}; tot_h = (b - a).total_seconds()
    if tot_h <= 0: out['Oct'] = 1.0; return out
    for mo, (s, t) in {'Sep': (dt.datetime(2026, 9, 1), dt.datetime(2026, 10, 1)), 'Oct': (dt.datetime(2026, 10, 1), dt.datetime(2026, 11, 1)), 'Nov': (dt.datetime(2026, 11, 1), dt.datetime(2026, 12, 1))}.items():
        ov = (min(b, t) - max(a, s)).total_seconds()
        if ov > 0: out[mo] = ov / tot_h
    return out
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
    REV.append({'inv': i['invoice'], 'date': i['date'], 'contract': i['contract'], 'branch': i.get('bp_branch'), 'ex': i.get('ex_gst') or 0, 'waiver': w, 'env': env,
                'hire': {k: r2(v) for k, v in hire.items()}, 'wsplit': {k: r2(v) for k, v in ws.items()}, 'undated': r2(undated)})
assert abs(sum(r['ex'] for r in REV) - 1003037.12) < 0.01
RT = {k: r2(sum(r['hire'][k] + r['wsplit'][k] for r in REV)) for k in MO}
UND = r2(sum(r['undated'] + r['env'] for r in REV))

# ---------------- CSV
with (OUT / 'GC500_October_month_end.csv').open('w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['Author: Andrew Fisher', 'GC500 October month-end: costs by supplier and month, accruals, labour, invoices', 'as at 31 Oct 2026', 'AUD ex GST', 'record 12640'])
    w.writerow(['Supplier', 'Branch', 'Account', 'What', 'PO', 'Invoice / receipt', 'September', 'October', 'November', 'Accrue at 31 Oct', 'How dated', 'Status'])
    for r in C: w.writerow(list(r[:6]) + ['%.2f' % r[6], '%.2f' % r[7], '%.2f' % r[8], '' if r[9] is None else '%.2f' % r[9], r[10], r[11]])
    w.writerow(['Total', '', '', '', '', '', '%.2f' % tot[0], '%.2f' % tot[1], '%.2f' % tot[2], '%.2f' % acc_total, '', ''])
    w.writerow([]); w.writerow(['Invoice', 'Date', 'Contract', 'Branch', 'Ex GST', 'Waiver', 'Hire+waiver days in Sep', 'in Oct', 'in Nov', 'Lines with no dates (services, sales)'])
    for r in REV: w.writerow([r['inv'], r['date'], r['contract'], r['branch'], '%.2f' % r['ex'], '%.2f' % r['waiver']] + ['%.2f' % (r['hire'][k] + r['wsplit'][k]) for k in MO] + ['%.2f' % (r['undated'] + r['env'])])
    w.writerow([]); w.writerow(['Labour', 'Branch', 'September h', 'October h', 'November h (to 13 Nov)'])
    for typ in ('Coates wages', 'Salary', 'Labour hire'):
        for b in ('KINP', 'STPS', 'NVAC'):
            vals = [L.get((typ, b, k), 0) for k in MO]
            if any(vals): w.writerow([typ, b] + ['%.1f' % v for v in vals])
    w.writerow(['Labour hire cost', ''] + ['%.2f' % LH.get(k, 0) for k in MO])
    w.writerow([]); w.writerow(['Staff hours by contract', 'Branch', 'What', 'How', 'September h', 'October h', 'November h (to 13 Nov)'])
    for c_ in ['KINP', '9972648', '9961976']:
        hs = [CON.get((c_, k), 0) for k in MO]
        if any(hs): w.writerow([c_] + list(CLABEL[c_]) + ['%.1f' % v for v in hs])
    w.writerow([]); w.writerow(['Person', 'Home branch', 'Contract', 'September h', 'October h', 'November h (to 13 Nov)'])
    for who in sorted(HOME):
        for c_ in ['KINP', '9972648', '9961976']:
            hs = [CONP.get((who, c_, k), 0) for k in MO]
            if any(hs): w.writerow([who, HOME[who][0], c_ if c_ != 'KINP' else 'KINP'] + ['%.1f' % v for v in hs])
    w.writerow([]); w.writerow(['Person', 'Type', 'Home branch (record)', 'Journal', 'Receiving branch', 'September h', 'October h', 'November h (to 13 Nov)', 'Labour hire $'])
    for who in sorted(HOME):
        home, typ = HOME[who]
        for b in ('KINP', 'STPS', 'NVAC'):
            hs = [PH.get((who, k, b), 0) for k in MO]
            if any(hs): w.writerow([who, typ, home, ('stays' if b == home else home + ' -> ' + b) + {'STPS': ' (9972648)', 'NVAC': ' (9961976)'}.get(b, ''), b] + ['%.1f' % v for v in hs] + ['%.2f' % sum(PC.get((who, k, b), 0) for k in MO)])


# ---------------- accruals beside what we charged the V8s for the same work (Andrew, 31 Oct: "we need to understand what we charged v8s
#                  for to do with this and state we are still waiting for invoice and this is the esitimate cost. And we do same with fencing")
ACC = [
 ('Event Portables (toilets) — no invoice yet; estimated cost from their four quotes at what was supplied', [
   ('Toilet hire: their 195 FWF at 90.07, 6 pee panels, 2 × 16-pan blocks', '25122322 FWF lines + L98 · 25123999 L19', 27300.93, 'Q6845 hire', 28675.00),
   ('Pump-outs and servicing (their 702 FWF services include our FWF they cleaned)', '25122322 L141 (702 FWF) · L142 (24 tanks)', 66145.14, 'Q6844: 702 FWF, 18 tanks, 51 block cleans', 41772.00),
   ('Toilet transport (all toilets, ours and theirs; our carriers’ cost for our own toilets sits in the transport line, not here)', '25122322 L147, L148, L149, L162, L167 (45,215.00) · 25123999 L18 (2,000.00)', 47215.00, 'Q6845: their delivery and pickup', 13500.00),
   ('Water truck and pre-fill', 'not charged', 0.00, 'Q6844', 9600.00),
   ('Build-period water deliveries and tank', 'not matched to a line', 0.00, 'Q6846', 4850.00),
   ('Pit lane party Porta Lisa', 'not charged', 0.00, 'Q6847', 3350.00)]),
 ('Advanced Temporary Fencing — part invoiced; the event week and demob week 1 part is an estimate, invoices still to come', [
   ('Fencing, all of it (one block to 13 Nov)', '25122628 fencing lines 335,097.44 + waiver 35,791.11', 370888.55, 'invoiced and receipted, weeks 1–6 and a collection', 214225.00),
   ('', '', None, 'ESTIMATE, invoice still to come: event week (PO 4647522) 71,159.70 + demob week 1 (PO 4647523) 8,025.00', 79184.70)]),
 ('Premiair Services — no invoice yet; estimated cost from the cost rate keyed on 9961265', [
   ('Sub-hired VMS boards, eight lines', '25125589 (9961265) lines 13, 24–26, 28–31', 2787.72, 'cost rate 53.61 a day × hire days (line 15 taken out: not on the contract)', 3270.21)]),
 ('Royal Wolf (United Rentals) — no invoice yet; estimated cost from the cost rate keyed on 9974042', [
   ('Refrigerated container, with its share of delivery and pickup', '25124058 L2 1,428.00 + L3/L4 1,000.00', 2428.00, 'cost rate, once', 1364.23)]),
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
ACC_HTML = tbl(['What', 'Where we charged the V8s (invoice · line)', '#Charged to the V8s', 'Cost basis', '#Cost (estimate where no invoice)'], arow)
crow = ''.join("<tr class='%s'><td><b>%s</b><br><span class='w'>%s</span></td><td>%s</td><td>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'><b>%s</b></td><td><span class='w'>%s</span></td></tr>" % (
    'acc' if r[9] else ('nd' if 'NOT DATED' in r[11] else ''), e(r[0]), e(r[3]), e(r[4]), e(r[5]), m(r[6]), m(r[7]), m(r[8]), m(r[9]) if r[9] else '', e(r[11] + ' · ' + r[10])) for r in C)
crow += "<tr class='sub'><td>Total costs</td><td></td><td></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td></td></tr>" % (m(tot[0]), m(tot[1]), m(tot[2]), m(acc_total))
lrow = ''
for typ in ('Coates wages', 'Salary', 'Labour hire'):
    for b in ('KINP', 'STPS', 'NVAC'):
        vals = [L.get((typ, b, k), 0) for k in MO]
        if any(vals): lrow += "<tr><td>%s</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (e(typ), b, ''.join("<td class='n'>%s</td>" % ('{:,.1f}'.format(v) if v else '—') for v in vals), '{:,.1f}'.format(sum(vals)))
lrow += "<tr class='sub'><td>Labour hire cost</td><td>KINP</td>%s<td class='n'>%s</td></tr>" % (''.join("<td class='n'>%s</td>" % m(LH.get(k, 0)) for k in MO), m(sum(LH.values())))
rrow = ''.join("<tr><td>%s</td><td>%s</td><td>%s · %s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (
    e(r['inv']), e(r['date'] or ''), e(r['contract'] or ''), e(r['branch'] or ''), m(r['ex']), m(r['hire']['Sep'] + r['wsplit']['Sep']), m(r['hire']['Oct'] + r['wsplit']['Oct']), m(r['hire']['Nov'] + r['wsplit']['Nov']), m(r['undated'] + r['env'])) for r in REV)
rrow += "<tr class='sub'><td>19 invoices</td><td></td><td></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (m(sum(r['ex'] for r in REV)), m(RT['Sep']), m(RT['Oct']), m(RT['Nov']), m(UND))
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
            "" if b == home else " class='acc'", e(who), e(typ), home, e(move), ''.join("<td class='n'>%s</td>" % ('{:,.1f}'.format(v) if v else '—') for v in hs),
            '{:,.1f}'.format(sum(hs)), m(sum(cs)) if sum(cs) else '')
PERSON_HTML = tbl(['Person · type', 'Home branch', 'Journal', '#Sep h', '#Oct h', '#Nov h (to 13 Nov)', '#Total h', '#Labour hire $'], prow)
order_c = ['KINP', '9972648', '9961976']
crow2 = ''
for c_ in order_c:
    hs = [CON.get((c_, k), 0) for k in MO]
    if not any(hs): continue
    br_, what_, how_ = CLABEL[c_]
    crow2 += "<tr><td><b>%s</b> · %s<br><span class='w'>%s · %s</span></td>%s<td class='n'><b>%s</b></td></tr>" % (e(c_ if c_ != 'KINP' else 'KINP'), br_, e(what_), e(how_), ''.join("<td class='n'>%s</td>" % ('{:,.1f}'.format(v) if v else '—') for v in hs), '{:,.1f}'.format(sum(hs)))
crow2 += "<tr class='sub'><td>All staff hours</td>%s<td class='n'>%s</td></tr>" % (''.join("<td class='n'>%s</td>" % '{:,.1f}'.format(sum(CON.get((c_, k), 0) for c_ in order_c)) for k in MO), '{:,.1f}'.format(sum(CON.values())))
CON_HTML = tbl(['Contract · branch', '#Sep h', '#Oct h', '#Nov h (to 13 Nov)', '#Total h'], crow2)
prow2 = ''
for who in sorted(HOME, key=lambda w: (HOME[w][1].startswith('Labour hire'), w)):
    for c_ in order_c:
        hs = [CONP.get((who, c_, k), 0) for k in MO]
        if not any(hs): continue
        prow2 += "<tr><td>%s</td><td>%s</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (e(who), HOME[who][0], e(c_ if c_ != 'KINP' else 'KINP (no contract number)'), ''.join("<td class='n'>%s</td>" % ('{:,.1f}'.format(v) if v else '—') for v in hs), '{:,.1f}'.format(sum(hs)))
CONP_HTML = tbl(['Person', 'Home branch', 'Contract', '#Sep h', '#Oct h', '#Nov h', '#Total h'], prow2)
css = """:root{--ink:#1d2730;--mute:#6b7681;--line:#e3e7eb;--bg:#f7f8f6;--card:#fff;--accent:#9c470c;--sub:#f1f4f6;--acc:#fff4e5;--nd:#fdecea}
@media (prefers-color-scheme:dark){:root{--ink:#e6eaee;--mute:#9aa5b0;--line:#2b343c;--bg:#14191e;--card:#1b2228;--accent:#f0a46a;--sub:#222b33;--acc:#33281a;--nd:#3a1f1c}}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}main{max-width:1180px;margin:0 auto;padding:20px 16px 40px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:26px 0 8px;color:var(--accent)}.s{color:var(--mute);margin:0 0 12px}.w{color:var(--mute);font-size:12px}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px;background:var(--card);border:1px solid var(--line)}th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)}.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}tr.sub td{font-weight:700;background:var(--sub)}tr.sec2 td{background:var(--sub);font-size:13px}tr.acc td{background:var(--acc)}tr.nd td{background:var(--nd)}
ul{margin:6px 0 0 18px}li{margin:3px 0}.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:12px 0}.k div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.k b{display:block;font-size:20px}"""
body = f"""<main><h1>GC500 P&amp;L, final</h1><p class='s'>As at 31 Oct 2026 · AUD ex GST · from the live record (12640), the 19 invoices and the purchase orders · Author: Andrew Fisher</p>
<div class='k'><div><span class='w'>To accrue at 31 Oct (costs for work done, not invoiced)</span><b>{m(acc_total)}</b></div><div><span class='w'>Costs by month of work</span><b>Sep {m(tot[0])}</b><span class='w'>Oct {m(tot[1])} · Nov {m(tot[2])}</span></div>
<div><span class='w'>Invoiced to the V8s (all 19 in October)</span><b>{m(sum(r['ex'] for r in REV))}</b><span class='w'>hire days: Sep {m(RT['Sep'])} · Oct {m(RT['Oct'])} · Nov {m(RT['Nov'])}; services {m(UND)}</span></div></div>
<h2>1 · Costs by supplier and month, with what to accrue</h2><p class='s'>Orange rows: accrue at 31 Oct (they reverse on 1 Nov and the invoice lands against them). Red rows: the record carries no date; where they sit is said on the row.</p>
{tbl(['Supplier · what', 'PO', 'Invoice / receipt', '#Sep', '#Oct', '#Nov', '#Accrue 31 Oct', 'Status · how dated'], crow)}
<h2>1b · Accruals beside what we charged the V8s</h2><p class='s'>Each accrued supplier next to what we charged the V8s for the same work. Where no supplier invoice has been seen, the cost is an estimate and says so; it is replaced when the invoice comes. Charges are before the damage waiver except the fencing, which shows its invoice in full.</p>
""" + ACC_HTML + """
<h2>2 · Labour by month and branch, to 13 Nov</h2><p class='s'>Hours from the running sheet on your rules (KINP rule, the water barriers on STPS, the generators at 1.5 h in and out). Coates wages and salary are hours only.</p>
{tbl(['Type', 'Branch', '#September h', '#October h', '#November h (to 13 Nov)', '#Total h'], lrow)}
<h2>2b · Labour by person: home branch, and where the cost is journaled to</h2><p class='s'>Home branch from each person's row on the record. Journal to: your rules (the people's costs on KINP; water barriers on STPS; the generators at 1.5 h in and out on NVAC). Coates wages and salary are hours (finance applies the pay cost); labour hire is dollars at the record's rates. Branch names for NOIS, NTSP, BFIS and NSNA aren't on the record.</p>
""" + PERSON_HTML + """
<h2>2c · Staff hours by contract</h2><p class='s'>Outside KINP, the contract is named: the water barriers on 9972648 (STPS) and the generators on 9961976 (NVAC), from the hours on the running sheet's notes. Everything else is KINP, with no contract number (your call, 31 Oct). Labour hire costs are coded to Installs.</p>
""" + CON_HTML + """
<h3>By person and contract</h3>
""" + CONP_HTML + """
<h2>3 · The 19 invoices, and the hire days on them by month</h2><p class='s'>All 19 are dated 27–30 Oct. For each invoice, its dated hire lines (and the waiver on them) by the days on hire in each month, from the invoice's own on/off-hire times. Services and sales carry no dates on the invoice; they're in the last column.</p>
{tbl(['Invoice', 'Date', 'Contract · branch', '#Ex GST', '#Hire days in Sep', '#in Oct', '#in Nov', '#Services and sales (no dates)'], rrow)}
<h2>4 · What the record can't date yet</h2><ul>
<li>Transport: {m(14647.65)} of the load figures to date and {m(12990.03)} of the loads still to come carry no date. The carrier invoices will date them.</li>
<li>Alfie Harris's 12 nights ({m(2557.61)}) have no dates; they're in October until the invoice comes.</li>
<li>The salary allowance ({m(14700)}) has no dates; it's split by the salaried hours on the running sheet.</li>
<li>Event Portables: no invoice or PO on the record; the four quotes were approved on your word. Q6846 is at its quoted 4,850.00.</li>
<li>Service lines on the invoices (transport, install and demob, pump-outs, labour, accommodation recharges, scrim, toilet paper): {m(UND)}, no dates on the invoice. Dating them to the work needs each one matched to the record; that's the next piece.</li></ul>
</main>"""
# ---------------- the final P&L pack: summary by branch, journals, open items, and an Excel workbook (appended to build_monthend.py)
REV_B = collections.defaultdict(float)
for r in REV: REV_B[r['branch']] += r['ex']
REV_B = {b: r2(v) for b, v in REV_B.items()}
NOV_REV = {'NVAC': 839.07}            # the generator pick-up charge of 29 Oct, not on an invoice yet (forecast)
COST_B = {   # management view, job end; people's costs on KINP (29 Oct ruling) except labour hire on water barriers (Kyle Gover, 8 h on 9972648)
 'KINP': [('Event Portables, toilets (estimate, no invoice yet)', 101747.00), ('Premiair, sub-hired VMS boards (estimate)', 3270.21), ('Transport, carriers', 42073.62),
          ('Labour hire, coded to Installs (Job Connect: invoices where received, the running sheet where not)', r2(34748.64 - 460.78)), ('Salary allowance', 14700.00),
          ('Accommodation', 24581.57), ('Meals, expenses and equipment R&M', 5664.32), ('Consumables: POs 4666720 BSF cranes 2,896.00 · 4670876 soap 180.00', 3076.00)],
 'STPS': [('Fencing, Advanced: invoiced and receipted', 214225.00), ('Fencing, Advanced: estimate, invoices still to come (POs 4647522, 4647523)', 79184.70),
          ('Fencing, Advanced: demob week 2 (forecast)', 750.00), ('Royal Wolf, refrigerated container (estimate)', 1364.23), ('Transport, carriers', 4186.02),
          ('Labour hire on the water barriers, 9972648 (journal from KINP)', 460.78), ('Consumables: POs 4663216 cable ties 2,538.64 · 4655573 star pickets 100.00', 2638.64)],
 'NVAC': [('Transport, carriers', 9313.78), ('Consumables: POs 4669481 siphon hose 42.34 · 4670270 concert sync 579.68', 622.02)],
 'MEAD': [('Transport, carriers', 1237.23)]}
CB = {b: r2(sum(v for _, v in LL)) for b, LL in COST_B.items()}
assert abs(sum(CB.values()) - 543382.98) < 0.005, CB
assert abs(sum(REV_B.values()) - 1003037.12) < 0.005, REV_B
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
 ('Accrual · Advanced, event week', '4647522', '2126 Rehire 34,568.70 · 2142 Installation 36,591.00', 'STPS', 71159.70),
 ('Accrual · Advanced, demob week 1', '4647523', '2126 Rehire 6,625.00 · 2142 Installation 1,400.00', 'STPS', 8025.00),
 ('Accrual · Event Portables (estimate)', 'none on the record', '2126 · 3325 (toilet pump-outs)', 'KINP', 101747.00),
 ('Accrual · Job Connect, w/e 11 Oct to 1 Nov (estimate)', '4665091 · 4667755 · 4668970 · 4670882 · 4671825 · none for w/e 1 Nov', 'Installs (as coded)', 'KINP', 24348.75),
 ('Accrual · Premiair (estimate)', 'none on the record', '2126', 'KINP (cost SA KINP-SUB)', 3270.21),
 ('Accrual · Royal Wolf (estimate)', 'none on the record', '2126', 'STPS (cost SA STPS-SUB)', 1364.23),
 ('Accrual · accommodation, Alfie Harris 12 nights (estimate)', 'none', '3520 · 3501', 'KINP', 2557.61)]
assert abs(sum(j[4] for j in JOURNALS) - acc_total) < 0.005, (sum(j[4] for j in JOURNALS), acc_total)
jrow = ''.join("<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class='n'>%s</td></tr>" % (e(a), e(b_), e(c_), e(d_), m(v)) for a, b_, c_, d_, v in JOURNALS)
jrow += "<tr class='sub'><td>Accruals at 31 Oct (each reverses on 1 Nov; the invoice lands against it)</td><td></td><td></td><td></td><td class='n'>%s</td></tr>" % m(acc_total)
OPEN = ['November revenue: kept in October as invoiced (hire days falling in November shown for information). Your call if they move.',
        'Frank Devilles and Ludwig Chee: on KINP until you confirm their event roles (Gen Tech on NVAC 9961976; VMS movers on STPS 9961265; or toilets on KINP).',
        'Event Portables: their invoice; check block cleans (51 done, none charged), water (9,600.00, not charged), Porta Lisa (3,350.00, not charged), tank pump-outs (18 done, 24 charged).',
        'Advanced: invoices for POs 4647522 and 4647523; possible extra 2,577.00 (36524, note 24479, the week 6 balance) not accrued.',
        'Premiair and Royal Wolf: invoices; VMS19 and VMS20 billed to the V8s at 0.00; the keyed Premiair cost rate equals the V8s rate.',
        'Job Connect: invoices for w/e 11 Oct to 8 Nov; the running sheet is 178.15 over the invoices received (the P&L uses the invoices).',
        'Transport: 27,637.68 of loads carry no date on the record; the carrier invoices will date them.',
        'On the page but on no invoice: the line-by-line list (KINP 5,268.23 · STPS 20,206.68 · NVAC 943.55 · MEAD 2,769.70) for you to chase or drop.',
        'Possible extra revenue: WB02 to 3 Nov (about 1,500.00), WB03 (354.00), concert contract 9994954 still on site, generator hire after 28 Oct and fuel, 350 kVA transport (1,200.00); and a VMS credit if 10001927 and 9961265 carry the same boards (−1,072.20).']
PACK_HTML = ("<h2>0 · The job by branch</h2><p class='s'>Revenue is the 19 invoices (all October) plus November's forecast; costs are the management view at job end, by the branch that carries them. Labour hire on the water barriers is journaled to STPS; the rest of the people's costs sit on KINP.</p>"
  + tbl(['Branch', '#Invoiced (Oct)', '#November forecast', '#Revenue', '#Costs', '#Difference', '#Kept'], srow)
  + "<h3>Costs by branch</h3>" + tbl(['Cost', '#Amount'], crowB)
  + "<h2>4 · Journals at 31 Oct</h2>" + tbl(['Journal', 'PO', 'Account', 'Branch', '#Amount'], jrow)
  + "<p class='s'>Labour journals (hours; Coates wages and salary are hours only): see section 2b, each person from their home branch to the branch of the work, with the contract named outside KINP.</p>"
  + "<h2>5 · Open items</h2><ul>" + ''.join('<li>' + e(o) + '</li>' for o in OPEN) + "</ul>")

# ---------------- Excel workbook
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
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
    ws.freeze_panes = 'A2'
    return ws
sheet('Summary', ['Branch', 'Invoiced (Oct)', 'November forecast', 'Revenue', 'Costs', 'Difference'],
      [[b, REV_B.get(b, 0), NOV_REV.get(b, 0), r2(REV_B.get(b, 0) + NOV_REV.get(b, 0)), CB[b], r2(REV_B.get(b, 0) + NOV_REV.get(b, 0) - CB[b])] for b in ('KINP', 'STPS', 'NVAC', 'MEAD')]
      + [['The job', r2(sum(REV_B.values())), r2(sum(NOV_REV.values())), JOB_REV, JOB_COST, r2(JOB_REV - JOB_COST)]], money_cols=range(2, 7), widths=[14, 16, 18, 16, 16, 16], first=True)
sheet('Revenue by invoice', ['Invoice', 'Date', 'Contract', 'Branch', 'Ex GST', 'Damage waiver', 'Hire days in Sep (with waiver)', 'in Oct', 'in Nov', 'Services, sales, other (no dates)'],
      [[r['inv'], r['date'], r['contract'], r['branch'], r['ex'], r['waiver'], r2(r['hire']['Sep'] + r['wsplit']['Sep']), r2(r['hire']['Oct'] + r['wsplit']['Oct']), r2(r['hire']['Nov'] + r['wsplit']['Nov']), r2(r['ex'] - sum(r['hire'][k] + r['wsplit'][k] for k in MO))] for r in REV],
      money_cols=range(5, 11), widths=[11, 11, 11, 8, 14, 14, 16, 14, 14, 18])
sheet('Costs by supplier', ['Supplier', 'Branch', 'Account', 'What', 'PO', 'Invoice / receipt', 'September', 'October', 'November', 'Accrue at 31 Oct', 'How dated', 'Status'],
      [list(r[:6]) + [r[6], r[7], r[8], r[9] if r[9] else None, r[10], r[11]] for r in C], money_cols=range(7, 11), widths=[22, 14, 16, 48, 26, 30, 13, 13, 13, 14, 40, 22])
sheet('Costs by branch', ['Branch', 'Cost', 'Amount'], [[b, k, v] for b, LL in COST_B.items() for k, v in LL], money_cols=[3], widths=[8, 80, 14])
sheet('Accruals vs charges', ['Supplier', 'What', 'Where we charged the V8s', 'Charged to the V8s', 'Cost basis', 'Cost (estimate where no invoice)'],
      [[head.split(' — ')[0], w_, wh, c_, bs, co] for head, lines in ACC for w_, wh, c_, bs, co in lines], money_cols=[4, 6], widths=[24, 48, 44, 16, 44, 18])
sheet('Journals', ['Journal', 'PO', 'Account', 'Branch', 'Amount'], [list(j) for j in JOURNALS] + [['Total accruals', '', '', '', acc_total]], money_cols=[5], widths=[50, 40, 40, 22, 14])
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

new_tiles = ("<div class='k'><div><span class='w'>Revenue (19 invoices + November forecast)</span><b>%s</b></div><div><span class='w'>Costs (management view, job end)</span><b>%s</b></div>"
             "<div><span class='w'>Difference</span><b>%s</b><span class='w'>%s of revenue kept</span></div><div><span class='w'>To accrue at 31 Oct (estimates where no invoice)</span><b>%s</b></div></div>\n") % (
             m(JOB_REV), m(JOB_COST), m(JOB_REV - JOB_COST), '{:.1%}'.format((JOB_REV - JOB_COST) / JOB_REV), m(acc_total))
import re as _re
body = _re.sub(r"<div class='k'>.*?</div></div>\n", lambda _m: new_tiles, body, count=1, flags=_re.S)
body = body.replace("<h2>1 · Costs by supplier and month, with what to accrue</h2>", PACK_HTML.split('<h2>4 · Journals')[0] + "<h2>1 · Costs by supplier and month, with what to accrue</h2>")
body = body.replace('</main>', '<h2>4 · Journals' + PACK_HTML.split('<h2>4 · Journals')[1] + '</main>')
(OUT / 'GC500_PL_final.html').write_text('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 October month-end</title><style>' + css + '</style></head><body>' + body + '</body></html>', encoding='utf-8')
print('costs Sep %.2f Oct %.2f Nov %.2f = %.2f · accrue %.2f' % (tot[0], tot[1], tot[2], sum(tot), acc_total))
print('revenue hire days Sep %.2f Oct %.2f Nov %.2f · undated %.2f · total %.2f' % (RT['Sep'], RT['Oct'], RT['Nov'], UND, RT['Sep'] + RT['Oct'] + RT['Nov'] + UND))
print('labour hire cost by month', {k: round(v, 2) for k, v in LH.items()})
for typ in ('Coates wages', 'Salary', 'Labour hire'): print(typ, {(b, k): round(L.get((typ, b, k), 0), 1) for b in ('KINP', 'STPS', 'NVAC') for k in MO if L.get((typ, b, k))})
