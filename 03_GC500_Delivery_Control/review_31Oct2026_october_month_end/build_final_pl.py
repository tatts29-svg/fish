"""Author: Andrew Fisher. GC500 final P&L by branch and month, from the 19 invoices (31 Oct 2026). Read only.

Superseded by the final P&L pack (build_monthend.py, 31 Oct 2026). Revenue basis: the invoice month (all 19 dated 27-30 Oct 2026, so
October); Andrew's call is still open on moving the hire days that fall in November (default: October as invoiced). The damage
waiver is its own line (Andrew: "add the waiver"), and November's forecast billing (the generator pick-up charge). The fencing stays as invoiced on 25122628 (Andrew,
31 Oct 2026: "v8s stay as is"), so nothing more is billed on it. Costs: the page's cost streams at job end in the management view (people's costs on KINP, 29 Oct ruling;
revenue stays on the invoicing branch, 31 Oct ruling), plus the six purchase orders; all in October with the invoices that
carry the work (Andrew: "all our labour from our staff september. october . november fall in to october invoices"), except
the fencing's demob week 2 cost (a forecast), which falls in November.

    python3 -I build_final_pl.py <rev_by_branch.json> <out_dir>
"""
import csv, html, json, sys
from pathlib import Path

rev = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2])
B = ['KINP', 'STPS', 'NVAC', 'MEAD']
NAMES = {'KINP': 'KINP · Brisbane Portables', 'STPS': 'STPS · Brisbane Traffic', 'NVAC': 'NVAC · North Power and HVAC', 'MEAD': 'MEAD · Brisbane Mechanical Specialist'}   # the record's branch names
r2 = lambda x: round(x + 1e-9, 2)
m = lambda x: ('−' if x < -0.004 else '') + '{:,.2f}'.format(abs(x)) if abs(x) > 0.004 else '—'

# ---- revenue
R = {b: {'Sep': {}, 'Oct': {}, 'Nov': {}} for b in B}
for b in B:
    a = rev[b]
    R[b]['Oct'] = {'Hire': a.get('hire', 0), 'Other charges (labour, transport, consumables)': a.get('other', 0),
                   'Stock sold (scrim, consumables)': a.get('sales', 0), 'Damage waiver (12.5% of hire)': a.get('waiver', 0),
                   'Environmental charge': a.get('env', 0)}
# Andrew, 31 Oct 2026: "v8s stay as is" - the fencing stays as invoiced on 25122628; no November fencing billing
R['STPS']['Nov'] = {}
R['NVAC']['Nov'] = {'Generator pick-up charge, 29 Oct (not on the invoice)': 839.07}

# ---- costs (management view, job end) and the purchase orders
C = {b: {'Sep': {}, 'Oct': {}, 'Nov': {}} for b in B}
C['KINP']['Oct'] = {'Toilets, rehire (Event Portables)': 101747.00, 'Other rehire': 3806.31, 'Transport (cartage)': 42073.62,
                    'Labour hire (Sep, Oct and Nov shifts)': 34926.79, 'Salary allowance': 14700.00, 'Accommodation': 24581.57,
                    'Meals, expenses and equipment R&M': 5664.32,
                    'Consumables (POs: cranes 2,896.00, soap 180.00, concert sync 579.68)': 3655.68}
C['STPS']['Oct'] = {'Fencing, Advanced invoiced and receipted (weeks 1–6 and one collection)': 214225.00,
                    'Fencing, Advanced not invoiced yet: accrue (event week 71,159.70 on PO 4647522 · demob week 1 8,025.00 on PO 4647523, both open)': 79184.70, 'Other rehire': 1364.23, 'Transport (cartage)': 4186.02,
                    'Consumables (POs: cable ties 2,538.64, star pickets 100.00)': 2638.64}
C['STPS']['Nov'] = {'Fencing, demob week 2 (forecast)': 750.00}
C['NVAC']['Oct'] = {'Transport (cartage)': 9313.78, 'Consumables (PO: siphon hose 42.34)': 42.34}
C['MEAD']['Oct'] = {'Transport (cartage)': 1237.23}

MONTHS = ['Sep', 'Oct', 'Nov']
tot = lambda d: r2(sum(d.values()))
summary = {}
for b in B:
    s = {}
    for mo in MONTHS:
        s[mo] = (tot(R[b][mo]), tot(C[b][mo]))
    s['Job'] = (r2(sum(s[mo][0] for mo in MONTHS)), r2(sum(s[mo][1] for mo in MONTHS)))
    summary[b] = s
job = {k: (r2(sum(summary[b][k][0] for b in B)), r2(sum(summary[b][k][1] for b in B))) for k in MONTHS + ['Job']}

# ---- checks against the sources
assert abs(sum(summary[b]['Oct'][0] for b in B) - 1003037.12) < 0.01, 'October revenue must equal the 19 invoices'
assert abs(job['Job'][1] - (537760.57 + 6336.66)) < 0.01, 'costs must equal the page at job end plus the six POs'

POSSIBLE = [
    ('STPS', 'WB02: 34 barriers billed for 7 days, on site to Tue 3 Nov (about)', 1500.00),
    ('STPS', 'WB03: billed to 19 Oct; the record has the 30 barriers leaving 29 Oct', 354.00),
    ('STPS', 'VMS02, VMS03, VMS07 on both 10001927 and 9961265 for the event week, if the same boards (a credit)', -1072.20),
    ('KINP', 'Concert contract 9994954: billed to 26 Oct; three buildings, two generators and the WC09 toilet block still on site', None),
    ('NVAC', 'Generators: hire after 28 Oct on GN18, GN19, GN01 and the Molendinar light towers; fuel (no line yet)', None),
    ('NVAC', 'Generator transport covers 12 of 13 generators (the 350 kVA or the spare, 2 legs at 600.00)', 1200.00),
]

# ---- CSV
with (out / 'GC500_final_PL_by_branch_and_month.csv').open('w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['Author: Andrew Fisher', 'GC500 final P&L by branch and month, from the 19 invoices', 'as at 31 Oct 2026', 'AUD ex GST'])
    w.writerow(['Branch', 'Line', 'Kind', 'September', 'October', 'November', 'Job'])
    for b in B:
        keys = []
        for mo in MONTHS: keys += [k for k in R[b][mo] if k not in keys]
        for k in keys: w.writerow([b, k, 'revenue'] + ['%.2f' % R[b][mo].get(k, 0) for mo in MONTHS] + ['%.2f' % sum(R[b][mo].get(k, 0) for mo in MONTHS)])
        keys = []
        for mo in MONTHS: keys += [k for k in C[b][mo] if k not in keys]
        for k in keys: w.writerow([b, k, 'cost'] + ['%.2f' % C[b][mo].get(k, 0) for mo in MONTHS] + ['%.2f' % sum(C[b][mo].get(k, 0) for mo in MONTHS)])
        w.writerow([b, 'Difference', 'difference'] + ['%.2f' % (summary[b][k][0] - summary[b][k][1]) for k in MONTHS + ['Job']])
    w.writerow(['Job', 'Revenue', 'total'] + ['%.2f' % job[k][0] for k in MONTHS + ['Job']])
    w.writerow(['Job', 'Costs', 'total'] + ['%.2f' % job[k][1] for k in MONTHS + ['Job']])
    w.writerow(['Job', 'Difference', 'total'] + ['%.2f' % (job[k][0] - job[k][1]) for k in MONTHS + ['Job']])
    w.writerow([])
    w.writerow(['Possible, not in the totals'])
    for b, t, v in POSSIBLE: w.writerow([b, t, 'possible', '', '', '%.2f' % v if v is not None else 'to price', ''])
    w.writerow([])
    w.writerow(['Fencing accrual to journal, October (STPS)'])
    w.writerow(['PO', 'Week', 'What', 'Account', 'Amount'])
    for a, b_, c, g, v in [('4647522', 'Event week, 19–25 Oct', '48 dockets', 'Rehire 2126', 34568.70), ('4647522', 'Event week, 19–25 Oct', '11 labour notes, 67 h at 100.00', 'Installation 2142', 6700.00), ('4647522', 'Event week, 23–25 Oct', 'Crew notes 24493–24495, 210.5 h at 142.00', 'Installation 2142', 29891.00), ('4647523', 'Demob week 1, 26–29 Oct', '8 dockets', 'Rehire 2126', 6625.00), ('4647523', 'Demob week 1, 26–28 Oct', '7 labour notes, 14 h at 100.00', 'Installation 2142', 1400.00)]: w.writerow([a, b_, c, g, '%.2f' % v])
    w.writerow(['', '', 'Total to accrue', '', '79184.70'])

# ---- HTML
e = html.escape

# ---- the fencing, for the journal (Andrew, 31 Oct 2026: "lets get the P&L sorted please the fencing part we need to know what
#      is still owing and what has not been Invoiced as this need to be journled"); from review_31Oct2026_fencing_facts/
F_REV = [('Invoice 25122628 lines (9990776, 28 Oct; incl. the 82.60 WB13 water barrier line)', 335180.04), ('Damage waiver on it (12.5% of hire)', 35801.43)]
F_BILLED = [('4647520 · receipt 4934877', 'Week 1, 12–16 Oct', 66272.00), ('4647519 · receipt 4936461', 'Week 2, 6–9 Oct', 28246.50),
            ('4647515 · receipt 4929277', 'Week 3, 28 Sep–2 Oct', 50154.00), ('4647517 · receipt 4926209', 'Week 4, 21–25 Sep', 26695.00),
            ('4647509 · receipt 4922398', 'Week 5, 14–18 Sep', 33670.50), ('4647508 · receipt 4918492', 'Week 6, 9–12 Sep (no sheet)', 8992.00),
            ('4658850 · receipt 4922343', 'Partial collection, Advanced invoice 93920', 195.00)]
F_ACCRUE = [('4647522', 'Event week, 19–25 Oct', '48 dockets', 'Rehire 2126', 34568.70),
            ('4647522', 'Event week, 19–25 Oct', '11 labour notes, 67 h at 100.00', 'Installation 2142', 6700.00),
            ('4647522', 'Event week, 23–25 Oct', 'Crew notes 24493–24495, 210.5 h at 142.00 (quote 27172)', 'Installation 2142', 29891.00),
            ('4647523', 'Demob week 1, 26–29 Oct', '8 dockets', 'Rehire 2126', 6625.00),
            ('4647523', 'Demob week 1, 26–28 Oct', '7 labour notes, 14 h at 100.00', 'Installation 2142', 1400.00)]
F_NOMATCH = [('Fence relocation, 1,520 m at 8.65', 13148.00, 'our dockets show 137.5 m (36510, 36525, 36528); Advanced billed 8.5 h of relocation labour, 850.00'),
             ('Security fence with hoarding, 110 m at 23.59', 2594.90, 'no docket or Advanced sheet names hoarding'),
             ('Ped gates: 32 invoiced, 22 on the dockets', 361.80, 'the 10 extra at 36.18'),
             ('Event labour: 213 h invoiced, 210.5 h on the crew notes', 227.85, 'the 2.5 h extra at 91.14'),
             ('WB13 water barrier, 10 for 7 days', 82.60, 'a water barrier line on the fencing contract, not fencing')]
F_NOTCHARGED = [('V gates, 216 on their sheets at 50.00', 10800.00), ('Team leader, 46 days at 200.00', 9200.00), ('Installer and relocation labour notes billed, 41 h at 100.00', 4100.00),
                ('Weed mat, 40 rolls', 2580.00), ('Shade cloth, 4 rolls', 784.00), ('Bases, 300 at 1.00', 300.00), ('Partial collection, 4658850', 195.00)]
F_POSS = [('Docket 36524, 17 Sep, Race admin, 137.5 m: not on their week 5 sheet', 1375.00), ('Note 24479, 13 Oct, 0.5 h: not on their week 1 sheet', 50.00),
          ('Week 6: their order 8,992.00 against our 6 dockets 10,144.00 (your 23 Oct ruling: the order stands)', 1152.00),
          ('Demob weeks 2 and 3 (November work; no papers yet; the page forecasts 750.00 for week 2)', None)]
fr, fb, fa = r2(sum(v for _, v in F_REV)), r2(sum(v for *_, v in F_BILLED)), r2(sum(v for *_, v in F_ACCRUE))
assert abs(fr - 370981.47) < 0.005 and abs(fb - 214225.00) < 0.005 and abs(fa - 79184.70) < 0.005
assert abs(fb + fa - C['STPS']['Oct']['Fencing, Advanced invoiced and receipted (weeks 1–6 and one collection)'] - C['STPS']['Oct']['Fencing, Advanced not invoiced yet: accrue (event week 71,159.70 on PO 4647522 · demob week 1 8,025.00 on PO 4647523, both open)']) < 0.005
acc = {}
for *_, gl, v in F_ACCRUE: acc[gl] = r2(acc.get(gl, 0) + v)
row = lambda cells, cls='': "<tr%s>%s</tr>" % (" class='%s'" % cls if cls else '', ''.join(cells))
td = lambda v, n=False: "<td%s>%s</td>" % (" class='n'" if n else '', v)
FENCE_HTML = ("<h2>Fencing: for the journal <span>STPS · October · AUD ex GST</span></h2>"
 "<p class='note'>The V8s stay as invoiced (your call, 31 Oct). Advanced's 214,225.00 is invoiced and receipted against their approved sheets and the purchase orders; the 79,184.70 is an ESTIMATE, our dockets and notes at their rates, until their invoices for POs 4647522 and 4647523 come.</p>"
 "<div class='wrap'><table><thead><tr><th>Fencing, October</th><th class='n'>Amount</th></tr></thead><tbody>"
 + ''.join(row([td(e(k)), td(m(v), 1)]) for k, v in F_REV)
 + row([td('Revenue'), td(m(fr), 1)], 'sub')
 + row([td('Advanced, invoiced and receipted'), td(m(fb), 1)]) + row([td('Advanced, not invoiced yet: accrue'), td(m(fa), 1)])
 + row([td('Costs'), td(m(fb + fa), 1)], 'sub') + row([td('Difference (%.1f%% of fencing revenue)' % (100 * (fr - fb - fa) / fr)), td(m(fr - fb - fa), 1)], 'dif')
 + "</tbody></table></div>"
 "<h3>Accrual to journal: October work Advanced hasn't invoiced yet</h3><div class='wrap'><table><thead><tr><th>PO</th><th>Week</th><th>What</th><th>Account</th><th class='n'>Amount</th></tr></thead><tbody>"
 + ''.join(row([td(e(a)), td(e(b)), td(e(c)), td(e(g)), td(m(v), 1)]) for a, b, c, g, v in F_ACCRUE)
 + row([td('Total to accrue'), td(''), td(''), td(''), td(m(fa), 1)], 'sub') + "</tbody></table></div>"
 "<p class='note'>The journal: debit Rehire 2126 " + m(acc['Rehire 2126']) + " and Installation, external contractors 2142 " + m(acc['Installation 2142']) + " on STPS; credit accrued expenses " + m(fa) + "; it reverses on 1 Nov and Advanced's invoice lands against it. It sits against this year's open purchase orders 4647522 (event week) and 4647523 (demob), with nothing invoiced on either yet: a manual journal, or the orders receipted in October as weeks 1–6 were, whichever finance uses. The account numbers are the ones the page carries for these categories; the full code is yours to confirm with finance.</p>"
 "<h3>Already invoiced by Advanced and receipted</h3><div class='wrap'><table><thead><tr><th>Order · receipt</th><th>Week</th><th class='n'>Amount</th></tr></thead><tbody>"
 + ''.join(row([td(e(a)), td(e(b)), td(m(v), 1)]) for a, b, v in F_BILLED) + row([td('Total'), td(''), td(m(fb), 1)], 'sub') + "</tbody></table></div>"
 "<h3>On our V8s invoice, with nothing to match it against</h3><div class='wrap'><table><thead><tr><th>Line</th><th class='n'>Amount</th><th>What we hold</th></tr></thead><tbody>"
 + ''.join(row([td(e(a)), td(m(v), 1), td(e(c))]) for a, v, c in F_NOMATCH) + "</tbody></table></div>"
 "<h3>Charged by Advanced, not on our V8s invoice</h3><div class='wrap'><table><thead><tr><th>What</th><th class='n'>Amount</th></tr></thead><tbody>"
 + ''.join(row([td(e(a)), td(m(v), 1)]) for a, v in F_NOTCHARGED) + "</tbody></table></div>"
 "<p class='note'>V gates, bases and materials: not charged, as last year (your ruling). Team leader days and labour notes aren't on our invoice either.</p>"
 "<h3>Possible extra from Advanced, not accrued</h3><div class='wrap'><table><thead><tr><th>What</th><th class='n'>Amount</th></tr></thead><tbody>"
 + ''.join(row([td(e(a)), td(m(v) if v is not None else '<em>no papers yet</em>', 1)]) for a, v in F_POSS) + "</tbody></table></div>")
def block(b):
    rows = ''
    def sect(title, D, cls):
        nonlocal rows
        keys = []
        for mo in MONTHS: keys += [k for k in D[mo] if k not in keys]
        rows += "<tr class='sec'><th colspan='5'>%s</th></tr>" % title
        for k in keys:
            vals = [D[mo].get(k, 0) for mo in MONTHS]
            rows += "<tr class='%s'><td>%s</td>%s<td class='n'>%s</td></tr>" % (cls, e(k), ''.join("<td class='n'>%s</td>" % m(v) for v in vals), m(sum(vals)))
        rows += "<tr class='sub'><td>%s</td>%s<td class='n'>%s</td></tr>" % ('Revenue' if cls == 'rev' else 'Costs', ''.join("<td class='n'>%s</td>" % m(tot(D[mo])) for mo in MONTHS), m(sum(tot(D[mo]) for mo in MONTHS)))
    sect('Revenue', R[b], 'rev'); sect('Costs', C[b], 'cost')
    rows += "<tr class='dif'><td>Difference</td>%s</tr>" % ''.join("<td class='n'>%s</td>" % m(summary[b][k][0] - summary[b][k][1]) for k in MONTHS + ['Job'])
    rj, cj = summary[b]['Job']
    return "<section><h2>%s <span>%s of revenue kept</span></h2><table><thead><tr><th></th><th class='n'>Sep</th><th class='n'>Oct</th><th class='n'>Nov</th><th class='n'>Job</th></tr></thead><tbody>%s</tbody></table></section>" % (e(NAMES[b]), '{:.1%}'.format((rj - cj) / rj) if rj else '—', rows)

sumrows = ''.join("<tr><td>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (
    e(b), m(summary[b]['Oct'][0]), m(summary[b]['Nov'][0]), m(summary[b]['Job'][0]), m(summary[b]['Job'][1]), m(summary[b]['Job'][0] - summary[b]['Job'][1])) for b in B)
sumrows += "<tr class='dif'><td>The job</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (
    m(job['Oct'][0]), m(job['Nov'][0]), m(job['Job'][0]), m(job['Job'][1]), m(job['Job'][0] - job['Job'][1]))
poss = ''.join("<tr><td>%s</td><td>%s</td><td class='n'>%s</td></tr>" % (e(b), e(t), m(v) if v is not None else '<em>to price</em>') for b, t, v in POSSIBLE)

page = """<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 final P&amp;L</title>
<style>
:root{--ink:#1d2730;--mute:#6b7681;--line:#e3e7eb;--bg:#f7f8f6;--card:#fff;--accent:#9c470c;--sub:#f1f4f6;--dif:#eaf3ea}
@media (prefers-color-scheme:dark){:root{--ink:#e6eaee;--mute:#9aa5b0;--line:#2b343c;--bg:#14191e;--card:#1b2228;--accent:#f0a46a;--sub:#222b33;--dif:#1f2d22}}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
main{max-width:1060px;margin:0 auto;padding:20px 16px 40px}h1{font-size:22px;margin:0 0 4px}.sub{color:var(--mute);margin:0 0 14px}
h2{font-size:16px;margin:26px 0 8px;color:var(--accent)}h2 span{font-size:12.5px;color:var(--mute);font-weight:500;margin-left:8px}h3{font-size:14px;margin:18px 0 6px}
table{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--mute)}
.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}tr.sec th{background:var(--sub);text-transform:none;letter-spacing:0;font-size:12.5px;color:var(--ink)}
tr.sub td{font-weight:600}tr.dif td{font-weight:700;background:var(--dif)}ul{margin:8px 0 0 18px}li{margin:3px 0}.wrap{overflow-x:auto}em{color:var(--mute)}
.note{color:var(--mute);font-size:12.5px;margin:8px 0 0}
</style></head><body><main>
<h1>GC500 final P&amp;L by branch and month</h1>
<p class="sub">From the 19 invoices, as at 31 Oct 2026 · AUD ex GST · Author: Andrew Fisher</p>
<ul>
<li><b>October</b> is everything invoiced: all 19 invoices are dated 27–30 Oct, so September's hire and work are in them too. Costs sit with the invoices that carry the work, and all our staff labour (September, October and November shifts) is in October, as you said.</li>
<li><b>November</b> is what's still to bill: the generator pick-up charge. The fencing stays as invoiced on 25122628 (your call, 31 Oct: "v8s stay as is"), so nothing more is billed on it. The fencing's demob week 2 cost (a $750.00 forecast) falls in November.</li>
<li><b>Damage waiver</b> is its own revenue line, from the invoices.</li>
<li><b>Branches:</b> revenue stays on the branch that invoices it; the people's costs sit on KINP; the concert generator sync is on KINP with its charge. Coates wages are hours only.</li>
</ul>
<h2>The job</h2><div class="wrap"><table><thead><tr><th>Branch</th><th class="n">October (invoiced)</th><th class="n">November (to bill)</th><th class="n">Revenue</th><th class="n">Costs</th><th class="n">Difference</th></tr></thead><tbody>""" + sumrows + """</tbody></table></div>
<p class="note">Difference is revenue less the direct costs known so far. Advanced's invoices for event week and demob week 1 are still to come; the P&amp;L carries them as an accrual of 79,184.70, from our dockets and notes at Advanced's rates (see Fencing, below).</p>
""" + ''.join("<div class='wrap'>" + block(b) + "</div>" for b in B) + """
""" + FENCE_HTML + """
<h2>Possible, not in the totals</h2><div class="wrap"><table><thead><tr><th>Branch</th><th>What</th><th class="n">About</th></tr></thead><tbody>""" + poss + """</tbody></table></div>
<p class="note">Not charged, as last year: V gates, bases, materials and the removal of the crowd control barriers (Andrew: "if we never charged last year what make you think we charge this year"). We wear the materials Advanced charged us, 3,559.00.</p>
<p class="note">Also on the page but not on any invoice: KINP 5,268.23, STPS 20,206.68 (beyond the fencing), NVAC 943.55, MEAD 2,769.70. The line-by-line list of these comes next, for you to chase or drop.</p>
</main></body></html>
"""
(out / 'GC500_final_PL_by_branch_and_month.html').write_text(page, encoding='utf-8')
for b in B:
    s = summary[b]
    print(b, 'Oct %s/%s  Nov %s/%s  Job rev %.2f cost %.2f diff %.2f' % (s['Oct'][0], s['Oct'][1], s['Nov'][0], s['Nov'][1], s['Job'][0], s['Job'][1], s['Job'][0] - s['Job'][1]))
print('JOB rev %.2f cost %.2f diff %.2f (%.1f%%) | Oct rev %.2f Nov rev %.2f' % (job['Job'][0], job['Job'][1], job['Job'][0] - job['Job'][1], 100 * (job['Job'][0] - job['Job'][1]) / job['Job'][0], job['Oct'][0], job['Nov'][0]))
