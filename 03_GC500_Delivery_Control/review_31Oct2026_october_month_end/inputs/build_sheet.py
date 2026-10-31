"""Author: Andrew Fisher. GC500 labour by month and branch, from the record, on the project manager's rules of 31 Oct 2026
(the KINP rule, the water barriers on STPS, and the generators at 1.5 h in and 1.5 h out each). Read only.

    python3 -I build_sheet.py <labour_register.json> <out_dir>
"""
import csv, html, json, re, sys
from collections import defaultdict
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
d = json.loads(src.read_text(encoding='utf-8'))
rows = [r for r in d['rows'] if not r.get('raceCrew')]
BR = ['KINP', 'STPS', 'NVAC']
MONTHS = [('2026-09', 'September'), ('2026-10', 'October'), ('2026-11', 'November (forecast)')]
TYPE = {'External': 'Labour hire', 'Internal CNA': 'Coates wages', 'Salary': 'Salary'}
r2 = lambda x: round(x + 1e-9, 2)
money = lambda x: '{:,.2f}'.format(x)
hrs = lambda x: ('{:,.1f}'.format(x) if abs(x - round(x)) > 1e-9 else '{:,.0f}'.format(x))
hcsv = lambda x: ('%.2f' % x).rstrip('0').rstrip('.')   # the CSV keeps the source's precision (Codex audit F09: 11.38 h, not 11.4); the page still shows one decimal

out_rows, cell = [], defaultdict(lambda: [0.0, 0.0])
gens = defaultdict(dict)
for r in sorted(rows, key=lambda x: (x['date'], x['person'])):
    m = r['month']
    if m not in dict(MONTHS): continue
    h = float(r['hours'] or 0)
    split = {k: float(v) for k, v in (r.get('split') or {}).items()}
    left = max(0.0, h - sum(split.values()))
    by = dict(split)
    if left > 1e-9: by['KINP'] = by.get('KINP', 0.0) + left
    priced = r['type'] == 'External' and r['cost'] is not None
    cost = float(r['cost'] or 0) if priced else 0.0
    for b, bh in by.items():
        c = cell[(m, b)]; c[1] += bh
        if priced and h > 0: c[0] += cost * bh / h
    how = 'KINP rule' if not split else ('from the note' + (', rest KINP' if left > 1e-9 else ''))
    note = r.get('note') or ''
    # the generator words on the note: "Generators <contract> <branch> · <n> h · GN04 mob, GN10 mob" (one 1.5 h per unit)
    segs = [s.strip() for s in note.split(' · ')]
    for i, s in enumerate(segs):
        g = re.match(r'^Generators (\d+) (KINP|STPS|NVAC|MEAD)$', s)
        if not g or i + 2 >= len(segs): continue
        hm = re.match(r'^(\d+(?:\.\d+)?) h$', segs[i + 1])
        units = re.findall(r'(GN[\w?-]+) (mob|demob)( \((\d+) units\))?', segs[i + 2])
        if not hm or not units: continue
        n_units = sum(int(u[3]) if u[3] else 1 for u in units)
        each = float(hm.group(1)) / n_units
        for u, way, _, k in units:
            gens[u][way] = {'date': r['date'], 'person': r['person'], 'hours': each * (int(k) if k else 1), 'units': int(k) if k else 1,
                            'contract': g.group(1), 'branch': g.group(2)}
    out_rows.append({'date': r['date'], 'month': dict(MONTHS)[m], 'person': r['person'], 'type': TYPE.get(r['type'], r['type']), 'hours': h,
                     'cost': cost if priced else None, 'by': by, 'how': how, 'note': note,
                     'cls': 'nvac' if by.get('NVAC') else ('stps' if by.get('STPS') else '')})

# generators still on site take theirs as they leave (GN18, GN19 and the concert pair)
STILL = {'GN18': ('9961976', 'NVAC', 1), 'GN19': ('9961976', 'NVAC', 1), 'GN?': ('9994954', 'KINP', 2)}

tot_cost = sum(c[0] for c in cell.values())
lh = float(d.get('lhJob') or 0)
if abs(tot_cost - lh) > 0.01: raise SystemExit('labour hire does not tie: %.2f vs %.2f' % (tot_cost, lh))

# ------------------------------------------------------------------ CSV
csv_path = out / 'GC500_labour_by_month_and_branch.csv'
with csv_path.open('w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['Author: Andrew Fisher', "GC500 labour by month and branch, from the record, on the project manager's rules of 31 Oct 2026", 'as at ' + d['asAt'], 'record ' + str(d['record'])])
    w.writerow(['Date', 'Month', 'Person', 'Type', 'Hours', 'Labour hire cost (AUD ex GST)', 'Branch and hours', 'How', 'Note on the record'])
    for o in out_rows:
        w.writerow([o['date'], o['month'], o['person'], o['type'], hcsv(o['hours']), '%.2f' % o['cost'] if o['cost'] is not None else 'hours only',
                    ', '.join('%s %s h' % (b, hcsv(o['by'][b])) for b in BR + ['MEAD'] if o['by'].get(b)), o['how'], o['note']])
    w.writerow([])
    w.writerow(['Generators', 'Contract', 'Branch', 'In: day', 'In: person', 'In: hours', 'Out: day', 'Out: person', 'Out: hours', 'Hours'])
    for u in sorted(set(gens) | set(STILL), key=lambda x: (x == 'GN?', x)):
        gi, go = gens[u].get('mob'), gens[u].get('demob')
        c, b, k = (gi or go or {}).get('contract') or STILL[u][0], (gi or go or {}).get('branch') or STILL[u][1], (gi or {}).get('units', 1)
        w.writerow([u + (' (%d units)' % k if k > 1 else ''), c, b, gi['date'] if gi else '', gi['person'] if gi else '', hrs(gi['hours']) if gi else '',
                    go['date'] if go else 'still on site', go['person'] if go else '', hrs(go['hours']) if go else '1.5 h each when it leaves',
                    hrs((gi['hours'] if gi else 0) + (go['hours'] if go else 0))])

# ------------------------------------------------------------------ HTML
e = html.escape
def sum_cell(m, b):
    c = cell.get((m, b), [0.0, 0.0])
    return '<td>%s<small>%s</small></td>' % (money(c[0]) if c[0] > 0.004 else '—', hrs(c[1]) + ' h' if c[1] > 1e-9 else '—')
sum_rows = ''
for m, name in MONTHS:
    tc, th = sum(cell.get((m, b), [0, 0])[0] for b in BR), sum(cell.get((m, b), [0, 0])[1] for b in BR)
    sum_rows += '<tr><th>%s</th>%s<td>%s<small>%s h</small></td></tr>' % (e(name), ''.join(sum_cell(m, b) for b in BR), money(tc), hrs(th))
tb = {b: [sum(cell.get((m, b), [0, 0])[i] for m, _ in MONTHS) for i in (0, 1)] for b in BR}
sum_rows += "<tr class='tot'><th>Total</th>%s<td>%s<small>%s h</small></td></tr>" % (
    ''.join('<td>%s<small>%s h</small></td>' % (money(tb[b][0]) if tb[b][0] > 0.004 else '—', hrs(tb[b][1])) for b in BR),
    money(sum(v[0] for v in tb.values())), hrs(sum(v[1] for v in tb.values())))

gen_rows, gin, gout = '', 0.0, 0.0
for u in sorted(set(gens) | set(STILL), key=lambda x: (x == 'GN?', x)):
    gi, go = gens[u].get('mob'), gens[u].get('demob')
    b = (gi or go or {}).get('branch') or STILL[u][1]
    k = (gi or {}).get('units', 1)
    gin += gi['hours'] if gi else 0; gout += go['hours'] if go else 0
    first = lambda x: x.split(' ')[0]
    gen_rows += "<tr class='%s'><td>%s</td><td>%s</td><td>%s</td><td class='n'>%s</td><td>%s</td><td class='n'>%s</td></tr>" % (
        'nvac' if b == 'NVAC' else '', e(u + (' (%d units)' % k if k > 1 else '')), b,
        e('%s · %s' % (gi['date'][5:], first(gi['person']))) if gi else '—', hrs(gi['hours']) if gi else '',
        e('%s · %s' % (go['date'][5:], first(go['person']))) if go else '<em>still on site: %s h when it leaves</em>' % hrs(1.5 * STILL[u][2]),
        hrs(go['hours']) if go else '')

body = ''
for m, name in MONTHS:
    mr = [o for o in out_rows if o['month'] == name]
    body += "<div class='wrap'><h2>%s <span>%d rows</span></h2><table class='reg'><thead><tr><th>Date</th><th>Person</th><th>Type</th><th class='n'>Hours</th><th class='n'>Labour hire</th><th>Branch and hours</th><th>How</th><th>Note on the record</th></tr></thead><tbody>" % (e(name), len(mr))
    for o in mr:
        body += "<tr class='%s'><td>%s</td><td>%s</td><td>%s</td><td class='n'>%s</td><td class='n'>%s</td><td>%s</td><td class='how'>%s</td><td class='note'>%s</td></tr>" % (
            o['cls'], o['date'][5:], e(o['person']), e(o['type']), hrs(o['hours']), money(o['cost']) if o['cost'] is not None else '<em>hours only</em>',
            e(', '.join('%s %s h' % (b, hrs(o['by'][b])) for b in BR + ['MEAD'] if o['by'].get(b))), e(o['how']), e(o['note']))
    body += '</tbody></table></div>'

old = Path(sys.argv[3]).read_text(encoding='utf-8') if len(sys.argv) > 3 else ''
style = old[old.index('<style>'):old.index('</style>') + 8] if '<style>' in old else '<style></style>'
page = ('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 labour by month</title>\n'
        + style + '</head><body><main>\n<h1>GC500 labour by month and branch</h1>\n'
        + '<p class="sub">From the record as at %s (record %s) · AUD ex GST · labour hire at the rates on the record; Coates wages and salary in hours only · the Advanced race crew left out (a fencing cost).</p>\n' % (e(d['asAt']), d['record'])
        + '<ul><li><b>Water barriers</b> on 9972648: the hours you gave, on STPS.</li>'
        + '<li><b>Generators</b>: 1.5 h on the day each one came in and 1.5 h on the day it left, 3 h a generator, against its contract: 9961976 on NVAC, the concert pair on 9994954 KINP. Done by Aaron; Alfie where Aaron was off or his day was full; then Daniel. "This is labour to install and demob, this is the labour charge" (31 Oct 2026).</li>'
        + '<li><b>Everyone else working</b> on KINP: "Kinp is easy just assign who ever is working to that" (31 Oct 2026).</li>'
        + '<li>Still to come: the S08 run\'s demob on Tue 3 Nov, 4 h on STPS; GN18 and GN19 out (1.5 h each, NVAC) and the concert pair out (3 h, KINP), each on the day it leaves.</li></ul>\n'
        + '<div class="wrap" style="margin-top:12px"><table class="sum"><thead><tr><th></th><th class="n">KINP</th><th class="n">STPS</th><th class="n">NVAC</th><th class="n">All</th></tr></thead><tbody>'
        + sum_rows + '</tbody></table></div>\n'
        + '<p class="key">Each cell: labour hire dollars, with all hours under it.<b style="background:var(--stps)"></b>STPS hours on the row<b style="background:var(--nvac)"></b>NVAC hours on the row</p>\n'
        + "<div class='wrap'><h2>Generators <span>%s h in, %s h out so far</span></h2><table class='reg'><thead><tr><th>Generator</th><th>Branch</th><th>In</th><th class='n'>Hours</th><th>Out</th><th class='n'>Hours</th></tr></thead><tbody>%s</tbody></table></div>\n" % (hrs(gin), hrs(gout), gen_rows)
        + body + '\n<p class="key">Author: Andrew Fisher. Read only: nothing on the record was changed to make this list.</p>\n</main></body></html>\n')
(out / 'GC500_labour_by_month_and_branch.html').write_text(page, encoding='utf-8')

print('record', d['record'], 'rows', len(out_rows), '| labour hire', money(tot_cost), 'ties to', money(lh))
for m, name in MONTHS:
    print(' ', name, ' | '.join('%s $%s %s h' % (b, money(cell.get((m, b), [0, 0])[0]), hrs(cell.get((m, b), [0, 0])[1])) for b in BR))
print('  Total', ' | '.join('%s $%s %s h' % (b, money(tb[b][0]), hrs(tb[b][1])) for b in BR))
print('generators: in %s h, out %s h' % (hrs(gin), hrs(gout)))
for u in sorted(gens, key=lambda x: (x == 'GN?', x)):
    print('  ', u, {k: (v['date'], v['person'].split(' ')[0], v['hours'], v['branch']) for k, v in gens[u].items()})
