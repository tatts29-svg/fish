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
add('Premiair Services', 'KINP cost · STPS revenue', '2126', 'Nine sub-hired boards on 9961265, 8–28 Oct (calculated estimate)', 'none on the record', 'no invoice on the record',
    0, 3806.31, 0, 3806.31, 'the hire days on each line, all in October', 'ACCRUE')
add('United Rentals (Royal Wolf)', 'STPS cost · KINP revenue', '2126', 'Refrigerated container, 9974042 line 2, on site 13–30 Oct (cost once)', 'none on the record', 'no invoice on the record',
    0, 1364.23, 0, 1364.23, 'delivered 13 Oct, picked up 30 Oct', 'ACCRUE')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads to date: figures from the schedule, not carrier invoices', 'none on the record', 'carrier invoices not on the record',
    13131.60, 5370.84, 0, None, 'the load dates; 14,647.65 of these figures carry no date (shown separately below)', 'check carrier invoices')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads to date with no date on the record', '', '', 0, 14647.65, 0, None, 'no date on the record: put in October until the carrier invoices date them', 'NOT DATED')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads still to come (forecast)', '', 'not invoiced', 0, 8796.65, 1873.88, None, 'planned dates', 'forecast')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads still to come with no date (averages)', '', 'not invoiced', 0, 0, 12990.03, None, 'no date on the record: put in November (demob)', 'NOT DATED')
JC = [('w/e 20 Sep', '4657010', 'invoice amount 3,023.70', 3023.85, 'Sep', 0), ('w/e 27 Sep', '4660565', 'GC500 share 1,299.74', 1299.74, 'Sep', 0),
      ('w/e 4 Oct', '4661783', 'invoice 15294, 3,052.60', 3230.60, 'Sep/Oct', 0), ('w/e 11 Oct', '4665091', 'no amount yet', 2539.92, 'Oct', 2539.92),
      ('w/e 18 Oct', '4667755 · 4668970', 'no amount yet', 6198.75, 'Oct', 6198.75), ('w/e 25 Oct', '4670882 · 4671825', 'no amount yet', 11774.71, 'Oct', 11774.71),
      ('w/e 1 Nov', 'none yet', 'not invoiced', 3835.37, 'Oct', 3835.37), ('w/e 8 Nov', 'none yet', 'not invoiced', 3023.85, 'Nov', 0)]
for wk, po, inv, amt, mo, acc in JC:
    sep = 1960.64 if wk == 'w/e 4 Oct' else (amt if mo == 'Sep' else 0); octv = 1269.96 if wk == 'w/e 4 Oct' else (amt if mo == 'Oct' else 0); nov = amt if mo == 'Nov' else 0
    add('Job Connect (labour hire)', 'KINP', '3210 · 2143', 'Running sheet ' + wk, po, inv, sep, octv, nov, acc if acc else 0,
        'the running sheet’s paid hours at the record’s rates' + (' (the sheet is 178.00 over the invoice)' if wk == 'w/e 4 Oct' else '') + (' (0.15 over the invoice)' if wk == 'w/e 20 Sep' else ''),
        'ACCRUE' if acc else ('invoiced · the running sheet is 178.00 over it: the P&L carries 178.00 more than the invoice' if wk == 'w/e 4 Oct' else ('November' if mo == 'Nov' else 'invoiced')))
add('Accommodation (tracker)', 'KINP', '3520 · 3501', '100 priced nights on the tracker', 'none', 'on the tracker', 6370.36, 11851.89, 3801.71, None, 'the night’s date', 'check how they were paid')
add('Accommodation (tracker)', 'KINP', '3520 · 3501', 'Alfie Harris: 12 nights at their own average, 213.13 (until the invoice comes)', 'none', 'invoice to come', 0, 2557.61, 0, 2557.61, 'nights not dated on the record: put in October', 'ACCRUE · NOT DATED')
add('Meals and expenses (tracker)', 'KINP', '3520 · 3501', 'Meals, expenses and equipment R&M', 'none', 'on the tracker', 2621.53, 2642.79, 400.00, None, 'the date on each line', 'actual')
add('Salary allowance', 'KINP', '3210', 'Salary allowance (forecast, job end)', 'none', 'payroll', 5143.62, 6672.34, 2884.04, None, 'no dates on the record: split by the salaried hours on the running sheet (198 · 256 · 110 h)', 'allocated')
for po, sup, br, gl, what, d, amt in [('4655573', 'Bunnings', 'STPS', '201.STPS.2144.0', 'Star pickets', '18 Sep', 100.00), ('4663216', 'CCI Supplies', 'STPS', '201.STPS.2144.0', 'Cable ties', '7 Oct', 2538.64),
                                     ('4666720', 'BSF Mobile Cranes', 'KINP', '201.KINP.2144.0', 'Building unloads (completed order)', '15 Oct', 2896.00), ('4670270', 'Event Elec', 'NVAC', '201.NVAC.2144.0', 'Concert generator sync (completed order)', '23 Oct', 579.68),
                                     ('4670876', 'Bunnings', 'KINP', '201.KINP.2144.0', 'Hand soap', '24 Oct', 180.00), ('4669481', 'Bunnings', 'NVAC', '201.NVAC.2150.0', 'Siphon hose (completed order)', '26 Oct', 42.34)]:
    add(sup, br, gl, what, po, 'PO ' + d, amt if 'Sep' in d else 0, 0 if 'Sep' in d else amt, 0, None, 'the PO date', 'check invoice')
tot = [r2(sum(r[i] for r in C)) for i in (6, 7, 8)]
assert abs(sum(tot) - 544097.23) < 0.01, (tot, sum(tot))   # the P&L's job costs, which carry the 750.00 November fencing forecast
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
    w.writerow([]); w.writerow(['Person', 'Type', 'Home branch (record)', 'Journal', 'Receiving branch', 'September h', 'October h', 'November h (to 13 Nov)', 'Labour hire $'])
    for who in sorted(HOME):
        home, typ = HOME[who]
        for b in ('KINP', 'STPS', 'NVAC'):
            hs = [PH.get((who, k, b), 0) for k in MO]
            if any(hs): w.writerow([who, typ, home, 'stays' if b == home else home + ' -> ' + b, b] + ['%.1f' % v for v in hs] + ['%.2f' % sum(PC.get((who, k, b), 0) for k in MO)])

# ---------------- HTML
def tbl(head, body, cls=''):
    return "<div class='wrap'><table class='%s'><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>" % (cls, ''.join('<th%s>%s</th>' % (" class='n'" if h.startswith('#') else '', e(h.lstrip('#'))) for h in head), body)
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
        move = 'stays on ' + b if b == home else 'journal ' + home + ' → ' + b
        prow += "<tr%s><td><b>%s</b><br><span class='w'>%s</span></td><td>%s</td><td><b>%s</b></td>%s<td class='n'>%s</td><td class='n'>%s</td></tr>" % (
            "" if b == home else " class='acc'", e(who), e(typ), home, e(move), ''.join("<td class='n'>%s</td>" % ('{:,.1f}'.format(v) if v else '—') for v in hs),
            '{:,.1f}'.format(sum(hs)), m(sum(cs)) if sum(cs) else '')
PERSON_HTML = tbl(['Person · type', 'Home branch', 'Journal', '#Sep h', '#Oct h', '#Nov h (to 13 Nov)', '#Total h', '#Labour hire $'], prow)
css = """:root{--ink:#1d2730;--mute:#6b7681;--line:#e3e7eb;--bg:#f7f8f6;--card:#fff;--accent:#9c470c;--sub:#f1f4f6;--acc:#fff4e5;--nd:#fdecea}
@media (prefers-color-scheme:dark){:root{--ink:#e6eaee;--mute:#9aa5b0;--line:#2b343c;--bg:#14191e;--card:#1b2228;--accent:#f0a46a;--sub:#222b33;--acc:#33281a;--nd:#3a1f1c}}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}main{max-width:1180px;margin:0 auto;padding:20px 16px 40px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:26px 0 8px;color:var(--accent)}.s{color:var(--mute);margin:0 0 12px}.w{color:var(--mute);font-size:12px}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px;background:var(--card);border:1px solid var(--line)}th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)}.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}tr.sub td{font-weight:700;background:var(--sub)}tr.acc td{background:var(--acc)}tr.nd td{background:var(--nd)}
ul{margin:6px 0 0 18px}li{margin:3px 0}.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:12px 0}.k div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.k b{display:block;font-size:20px}"""
body = f"""<main><h1>GC500 October month-end</h1><p class='s'>As at 31 Oct 2026 · AUD ex GST · from the live record (12640), the 19 invoices and the purchase orders · Author: Andrew Fisher</p>
<div class='k'><div><span class='w'>To accrue at 31 Oct (costs for work done, not invoiced)</span><b>{m(acc_total)}</b></div><div><span class='w'>Costs by month of work</span><b>Sep {m(tot[0])}</b><span class='w'>Oct {m(tot[1])} · Nov {m(tot[2])}</span></div>
<div><span class='w'>Invoiced to the V8s (all 19 in October)</span><b>{m(sum(r['ex'] for r in REV))}</b><span class='w'>hire days: Sep {m(RT['Sep'])} · Oct {m(RT['Oct'])} · Nov {m(RT['Nov'])}; services {m(UND)}</span></div></div>
<h2>1 · Costs by supplier and month, with what to accrue</h2><p class='s'>Orange rows: accrue at 31 Oct (they reverse on 1 Nov and the invoice lands against them). Red rows: the record carries no date; where they sit is said on the row.</p>
{tbl(['Supplier · what', 'PO', 'Invoice / receipt', '#Sep', '#Oct', '#Nov', '#Accrue 31 Oct', 'Status · how dated'], crow)}
<h2>2 · Labour by month and branch, to 13 Nov</h2><p class='s'>Hours from the running sheet on your rules (KINP rule, the water barriers on STPS, the generators at 1.5 h in and out). Coates wages and salary are hours only.</p>
{tbl(['Type', 'Branch', '#September h', '#October h', '#November h (to 13 Nov)', '#Total h'], lrow)}
<h2>2b · Labour by person: home branch, and where the cost is journaled to</h2><p class='s'>Home branch from each person's row on the record. Journal to: your rules (the people's costs on KINP; water barriers on STPS; the generators at 1.5 h in and out on NVAC). Coates wages and salary are hours (finance applies the pay cost); labour hire is dollars at the record's rates. Branch names for NOIS, NTSP, BFIS and NSNA aren't on the record.</p>
""" + PERSON_HTML + """
<h2>3 · The 19 invoices, and the hire days on them by month</h2><p class='s'>All 19 are dated 27–30 Oct. For each invoice, its dated hire lines (and the waiver on them) by the days on hire in each month, from the invoice's own on/off-hire times. Services and sales carry no dates on the invoice; they're in the last column.</p>
{tbl(['Invoice', 'Date', 'Contract · branch', '#Ex GST', '#Hire days in Sep', '#in Oct', '#in Nov', '#Services and sales (no dates)'], rrow)}
<h2>4 · What the record can't date yet</h2><ul>
<li>Transport: {m(14647.65)} of the load figures to date and {m(12990.03)} of the loads still to come carry no date. The carrier invoices will date them.</li>
<li>Alfie Harris's 12 nights ({m(2557.61)}) have no dates; they're in October until the invoice comes.</li>
<li>The salary allowance ({m(14700)}) has no dates; it's split by the salaried hours on the running sheet.</li>
<li>Event Portables: no invoice or PO on the record; the four quotes were approved on your word. Q6846 is at its quoted 4,850.00.</li>
<li>Service lines on the invoices (transport, install and demob, pump-outs, labour, accommodation recharges, scrim, toilet paper): {m(UND)}, no dates on the invoice. Dating them to the work needs each one matched to the record; that's the next piece.</li></ul>
</main>"""
(OUT / 'GC500_October_month_end.html').write_text('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 October month-end</title><style>' + css + '</style></head><body>' + body + '</body></html>', encoding='utf-8')
print('costs Sep %.2f Oct %.2f Nov %.2f = %.2f · accrue %.2f' % (tot[0], tot[1], tot[2], sum(tot), acc_total))
print('revenue hire days Sep %.2f Oct %.2f Nov %.2f · undated %.2f · total %.2f' % (RT['Sep'], RT['Oct'], RT['Nov'], UND, RT['Sep'] + RT['Oct'] + RT['Nov'] + UND))
print('labour hire cost by month', {k: round(v, 2) for k, v in LH.items()})
for typ in ('Coates wages', 'Salary', 'Labour hire'): print(typ, {(b, k): round(L.get((typ, b, k), 0), 1) for b in ('KINP', 'STPS', 'NVAC') for k in MO if L.get((typ, b, k))})
