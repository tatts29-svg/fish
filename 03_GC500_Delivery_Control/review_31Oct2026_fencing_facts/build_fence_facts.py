"""Author: Andrew Fisher. Fencing facts as at 31 Oct 2026: what Advanced has billed us against our dockets, what is on our
record that they have not billed, and what we billed the V8s (invoice 25122628). Read-only; from the live record (page v12.69),
Advanced's approved sheets, the purchase orders and the invoice text. Writes one HTML page to the scratchpad."""
import json, html, sys
from pathlib import Path
P = Path('/tmp/gc500-scratch/progress'); OUT = Path(sys.argv[1])
rows = json.load(open(P / 'fence_rows.json'))
m = lambda v: '${:,.2f}'.format(v)
e = html.escape
def table(head, body, cls=''):
    return '<div class="tw"><table class="%s"><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (cls, ''.join('<th>%s</th>' % h for h in head), ''.join('<tr>%s</tr>' % ''.join('<td>%s</td>' % c for c in r) for r in body))
billed = [
 ['Wk 6 · 9–12 Sep', '4647508 · 4918492', m(8992), 'No sheet. Our 6 dockets come to $10,144.00 at their rates, so $1,152.00 is not accounted for docket by docket'],
 ['Wk 5 · 14–18 Sep', '4647509 · 4922398', m(33670.50), '28 dockets $31,245.50 · 5 notes $425.00 · team leader 10 days $2,000.00'],
 ['Wk 4 · 21–25 Sep', '4647517 · 4926209', m(26695), '23 dockets $24,570.00 · 5 notes $525.00 · team leader 8 days $1,600.00'],
 ['Wk 3 · 28 Sep–2 Oct', '4647515 · 4929277', m(50154), '14 dockets $47,504.00 · 7 notes $650.00 · team leader 10 days $2,000.00'],
 ['Wk 2 · 6–9 Oct', '4647519 · 4936461', m(28246.50), '23 dockets $25,396.50 · 7 notes $1,250.00 · team leader 8 days $1,600.00'],
 ['Wk 1 · 12–16 Oct', '4647520 · 4934877', m(66272), '27 dockets $59,658.00 · 6 notes $1,250.00 · team leader 10 days $2,000.00 · weed mat 40 rolls $2,580.00 · shade cloth 4 rolls $784.00'],
 ['Collection', '4658850 · 4922343', m(195), 'Advanced invoice 93920, partial collection'],
 ['<b>Total</b>', '', '<b>' + m(214225) + '</b>', '115 dockets and 30 notes on their sheets, plus the 6 week 6 dockets'],
]
notb = [
 ['Docket 36524 · 17 Sep · Race admin · 137.5 m mesh fence · not on their week 5 sheet', '1', m(1375)],
 ['Note 24479 · 13 Oct · Philip Park compound · 0.5 h · not on their week 1 sheet', '1', m(50)],
 ['Event week dockets · 19–25 Oct', '48', m(34568.70)],
 ['Event week labour notes 24482–24492', '11 · 67 h', m(6700)],
 ['Event crew notes 24493–24495 · Fri 72 h, Sat 72 h, Sun 66.5 h · at the quote 27172 rate $142/h · not yet marked approved', '3 · 210.5 h', m(29891)],
 ['Demob week 1 dockets 36775, 36777–36783 · 26–29 Oct', '8', m(6625)],
 ['Demob week 1 notes 24496–24500, 24001, 24002', '7 · 14 h', m(1400)],
 ['<b>Total on our record, not billed</b>', '<b>57 dockets · 22 notes</b>', '<b>' + m(80609.70) + '</b>'],
]
inv = [
 ['1.8 m security fence', '8,609.5 m', '$16.16', m(139129.52)], ['1.8 m security fence with hoarding', '110 m', '$23.59', m(2594.90)],
 ['1.8 m fence with scrim', '3,143 m', '$16.16', m(50790.88)], ['Scrim (sale)', '3,143 m', '$9.34', m(29355.62)],
 ['Demarcation CCB', '4,603 m', '$13.08', m(60207.24)], ['Barrier, crowd control', '2,350 m', '$7.51', m(17648.50)],
 ['Barrier, crowd control flat feet', '220', '$7.51', m(1652.20)], ['Ped gates', '32', '$36.18', m(1157.76)],
 ['Fence relocation', '1,520 m', '$8.65', m(13148)], ['Event labour charge', '213 h', '$91.14', m(19412.82)],
 ['WB13 crash-rated water barrier (not fencing) · 19–26 Oct', '10 × 7 days', '$1.18 a day', m(82.60)],
 ['<b>Hire $286,411.60 + other $48,768.44</b>', '', '', '<b>' + m(335180.04) + '</b>'],
 ['LTD waiver charge (12.5% of hire, within 2 cents)', '', '', m(35801.43)],
 ['<b>Price excluding GST</b> · GST $37,098.14 · invoice total $408,079.61', '', '', '<b>' + m(370981.47) + '</b>'],
]
cmp_ = [
 ['Mesh fence, not braced', '8,609.5 m + 110 m hoarding', '9,730.5 m', '9,987.5 m (13,965 m on the papers less 3,977.5 m braced)'],
 ['Braced for scrim', '3,143 m (+ 3,143 m scrim sold)', '3,682.5 m', '3,977.5 m'],
 ['CCB, all types', '7,173 m (4,603 demarcation · 2,350 CCB · 220 flat feet)', '7,460.5 m (their sheets have one CCB line)', '7,527.5 m (5,062.5 demarcation · 2,195 event · 270 flat feet)'],
 ['Ped gates', '32', '22', '22'],
 ['Relocation', '1,520 m', '8.5 h relocation labour: 2 h on dockets 36510, 36525, 36528 + 6.5 h on six notes', '137.5 m (36510 50 m · 36525 60 m · 36528 27.5 m)'],
 ['Event labour', '213 h', '210.5 h (the 3 crew notes, not billed yet)', '—'],
 ['V gates · bases · weed mat · shade cloth · team leader · installer labour', 'not charged (your ruling, as in 2025)', 'billed: 216 V gates, 300 bases, 40 + 4 rolls, 46 days, 41 h on notes (wks 1–5)', '3 V gates · 216 blocks'],
]
diffs = [
 ['Mesh fence', '1,011 m fewer on our invoice, counting the hoarding as fence', m(16337.76) + ' · or 1,121 m = ' + m(18115.36) + ' if the hoarding is not part of the docket fence'],
 ['Braced for scrim', '539.5 m fewer (fence with scrim $16.16 + scrim $9.34)', m(13757.25)],
 ['CCB', '287.5 m fewer; the type split is not on Advanced\'s sheets', m(2159.13) + ' to ' + m(3760.50)],
 ['Ped gates', '10 more on our invoice', '−' + m(361.80)],
 ['Relocation', 'on our invoice; no docket or sheet adds to 1,520 m', '−' + m(13148)],
 ['Event labour', '2.5 h more on our invoice than Advanced\'s crew notes', '−' + m(227.85)],
]
unknown = [
 'Whether Advanced will bill docket 36524 ($1,375.00) and note 24479 ($50.00). Neither is on their sheets.',
 'Which week 6 dockets the $8,992.00 order covers. No sheet came with it; our 6 dockets come to $10,144.00 at their rates.',
 'Docket numbers in the runs that are not on our record: 36527, 36641, 36772, 36773, 36774, 36776. Missing, void or used elsewhere: not known.',
 'Demob weeks 2 and 3: no papers on the record yet. The page forecasts $750.00 for demob week 2; that is a forecast, not a docket.',
 'Whether the 110 m of hoarding on our invoice sits inside the docket fence metres. No docket or Advanced sheet names hoarding.',
 'Where the 9990776 quantities came from. The Baseplan reviews show them keyed as one block from Baseplan (4), 15 Oct, and changed later (fence 8,778 to 8,609.5 m in Baseplan (9)). Nothing we hold says who keyed them or from what.',
 'Why the waiver is on this invoice. It is on it, at 12.5% of hire; the 2025 invoice had none.',
 'One week 2 entry is set aside on the record (scrim 150 m at S10 from note 24472, 7 Oct) because its source changed after review; it is in no figure here.',
]
def chip(s):
    if s.startswith('Billed'): return '<span class="c ok">billed</span> ' + e(s.split(': ', 1)[1])
    if s.startswith('Week 6'): return '<span class="c amb">week 6, no sheet</span> ' + e(s)
    if s.startswith('NOT'): return '<span class="c bad">not on their sheet</span> ' + e(s)
    return '<span class="c bad">not billed yet</span> ' + e(s)
dk = [[e(r['week']), e(r['docket']), e(r['date']), e(r['location']), e(r['on the signed paper']), m(float(r['Advanced at their rates $'])), chip(r['Advanced status'])] for r in rows['dockets']]
nt = [[e(r['week']), e(r['note']), e(r['date'] or ''), e(r['location']), e(str(r['hours'])), m(float(r['Advanced $'])), e(r['event crew']), chip(r['Advanced status'])] for r in rows['notes']]
css = """
:root{--bg:#f6f7f9;--card:#fff;--ink:#16181d;--mute:#5d6470;--line:#e2e5ea;--ok:#1d7a46;--okb:#e3f4ea;--bad:#a8321e;--badb:#fbe9e5;--amb:#8a5a00;--ambb:#fdf1d8;--acc:#0b5cad}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#111418;--card:#1a1e24;--ink:#e8eaee;--mute:#9aa3ae;--line:#2b313a;--ok:#5fd08f;--okb:#15301f;--bad:#ff8a73;--badb:#3a1d17;--amb:#f3c25a;--ambb:#352a10;--acc:#6fb2ff}}
:root[data-theme="dark"]{--bg:#111418;--card:#1a1e24;--ink:#e8eaee;--mute:#9aa3ae;--line:#2b313a;--ok:#5fd08f;--okb:#15301f;--bad:#ff8a73;--badb:#3a1d17;--amb:#f3c25a;--ambb:#352a10;--acc:#6fb2ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:20px 16px 60px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 8px}p.s{color:var(--mute);margin:0 0 14px;font-size:13.5px}
.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:14px 0}.k div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.k b{display:block;font-size:22px;font-variant-numeric:tabular-nums}.k span{color:var(--mute);font-size:13px}
.tw{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;min-width:640px;font-size:13.5px}table.big{min-width:900px}
th,td{padding:7px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-size:12px;color:var(--mute);font-weight:600;white-space:nowrap}
td:nth-child(n){font-variant-numeric:tabular-nums}tr:last-child td{border-bottom:0}.c{display:inline-block;padding:1px 7px;border-radius:99px;font-size:11.5px;font-weight:600;margin-right:4px}
.ok{background:var(--okb);color:var(--ok)}.bad{background:var(--badb);color:var(--bad)}.amb{background:var(--ambb);color:var(--amb)}ul{margin:6px 0 0;padding-left:20px}li{margin:4px 0}
details{margin-top:10px}summary{cursor:pointer;color:var(--acc);font-weight:600;padding:6px 0}table.big td{font-size:12.5px}
"""
body = f"""<main><h1>GC500 fencing facts</h1>
<p class="s">As at 31 Oct 2026 · AUD ex GST · from the live record, Advanced's approved sheets, the purchase orders and invoice 25122628. Nothing here is estimated; what isn't known is listed as not known.</p>
<div class="k"><div><span>Advanced has billed us (receipted)</span><b>{m(214225)}</b><span>weeks 1–6 + one collection</span></div>
<div><span>On our record, Advanced hasn't billed</span><b>{m(80609.70)}</b><span>{m(79184.70)} event week + demob week 1, plus 36524 and 24479</span></div>
<div><span>We invoiced the V8s (25122628)</span><b>{m(370981.47)}</b><span>{m(335180.04)} + waiver {m(35801.43)}, billed to 13 Nov</span></div></div>
<h2>1 · What Advanced has billed us</h2><p class="s">Their rates on the sheets: mesh fence $10/m · braced for scrim $24.40/m · CCB $5.40/m (one line, no type split) · ped gate $61 · V gate $50 · bases $1 · labour $100/h · team leader $200/day · weed mat $64.50/roll · shade cloth $196/roll. Collection forms are listed on their sheets at $0.</p>
{table(['Week', 'Order · receipt', 'Billed', 'What is in it'], billed)}
<h2>2 · On our record, not billed by Advanced yet</h2><p class="s">At their rates. Purchase orders 4647522 (event week) and 4647523 (demob) have no amount yet.</p>
{table(['What', 'Count', 'At their rates'], notb)}
<h2>3 · What we invoiced the V8s</h2><p class="s">Invoice 25122628 · contract 9990776 (STPS) · dated 28 Oct 2026 · every fencing hire line 19 Oct 09:00 to 13 Nov 17:00, block charge.</p>
{table(['Line', 'Qty', 'Rate', 'Amount'], inv)}
<h2>4 · Our V8s invoice beside Advanced's quantities and our dockets</h2><p class="s">Advanced's quantities = their sheets for weeks 1–5, our dockets for week 6, 36524, event week and demob week 1 (your rule of 25 Oct: what they bill us is what we bill the V8s).</p>
{table(['Item', 'V8s invoice', "Advanced's quantities", 'Our signed dockets'], cmp_)}
<p class="s" style="margin-top:10px">The differences at our invoice's own rates (positive = less on our invoice than Advanced's quantities):</p>
{table(['Item', 'Difference', 'At our invoice rates'], diffs)}
<h2>5 · Not known</h2><ul>{''.join('<li>' + e(u) + '</li>' for u in unknown)}</ul>
<h2>6 · Every docket and note</h2>
<details><summary>All {len(dk)} dockets: billed or not</summary>{table(['Week', 'Docket', 'Date', 'Location', 'On the signed paper', 'Advanced at their rates', 'Advanced'], dk, 'big')}</details>
<details><summary>All {len(nt)} labour notes: billed or not</summary>{table(['Week', 'Note', 'Date', 'Location', 'Hours', 'Advanced', 'Event crew', 'Advanced'], nt, 'big')}</details>
</main>"""
OUT.write_text('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 fencing facts</title><style>' + css + '</style></head><body>' + body + '</body></html>', encoding='utf-8')
print('wrote', OUT, OUT.stat().st_size)
