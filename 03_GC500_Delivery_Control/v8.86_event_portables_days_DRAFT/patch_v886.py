# Author: Andrew Fisher. v8.86 Event Portables load days: the supplier's load day (delivery plan v10, 3 Oct 2026) becomes
# the page's planned delivery day for every reference on the plan. A day recorded on the shared record always wins.
# Needs v8.84 and v8.85 first: live, or chained in the same build:
#   toolchain/build.sh v8.86 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.86_event_portables_days_DRAFT/patch_v886.py
#
# Andrew, 7 Oct 2026 13:15 AEST: "can we also look at delievies im sure we changed these the wc and we had deliveruies
# days for these from Evenportables.."  Approved 8 Oct 2026 00:20 AEST: "Approved and get everything done".
#
# How: each schedule row the plan moves gets the v5.54 source correction (date / date_as_written / date_correction),
# written into DATA at the build - so the row's day IS the load day on every day list, count, card, drop sheet, run
# sheet and loading sheet, with the workbook's day beside it as "moved from" and the plan named as the source. The
# page's own rule keeps a date Andrew has recorded on the shared record above the plan (effectiveDates). Four small
# code changes let a reference whose rows split across days (WC09) list each row on its own day.
import datetime, json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); s = p.read_text()
assert 'where885-style' in s and s.count(' · v8.85') == 1, 'v8.85 must be applied first'
for need in ('function effectiveDates(', 'function dateCorrectionOf(', 'function programmeDaysBefore801(', 'function movedOffDay(',
             'function movedOffLine(', 'function whereChip(', 'function dayCard(', 'function dayRows(', 'function daily821Model(',
             'function epRecLine819(', 'const EP819 = ', 'function rowOff(', 'function rowOffWords(', 'function fmtDay('):
    assert need in s, 'v8.86 needs ' + need
assert 'ep886-style' not in s and 'function rowDay886(' not in s and 'epRecLine819Before886' not in s, 'v8.86 already applied'

# ---- the plan, as Andrew has it (meet_points_03Oct2026/event_portables_plan.json, v10, 3 Oct 2026)
PLAN = json.loads((here.parent / 'meet_points_03Oct2026' / 'event_portables_plan.json').read_text(encoding='utf-8'))
assert PLAN['version'] == 'v10' and PLAN['prepared'] == '2026-10-03', 'the plan is v10 of 3 Oct 2026'
assert [l['date'] for l in PLAN['loads']] == ['2026-10-09', '2026-10-13', '2026-10-15', '2026-10-19', '2026-10-19'], 'five loads: Fri 9, Tue 13, Thu 15, Mon 19 and Mon 19 Oct'
CANCELLED = {c['ref'] for c in PLAN['cancelled'] if c['ref'] != 'WC09'}          # WC32, WC66: on no load, never touched
assert CANCELLED == {'WC32', 'WC66'}
# Off the plan on the record (Andrew Fisher, 7 Oct 2026, record 4126 -> 4131): T0089 (1 FWF, Event Elec) was taken off its
# day, and its asset deleted on 6 Oct as "Not on this job" - "T0089 off the plan, so load 1 is 23 FWF". The supplier plan
# v10 still lists it on Load 1, stop 1. Its row stays where the record put it; the load says so at run time (ep886.js).
OFF_PLAN = {'T0089': 'Event Elec (T0089)'}

SOURCE_SHORT = 'Event Portables plan v10, 3 Oct'
SOURCE = 'Event Portables delivery plan v10 (to quote Q6845), prepared 3 Oct 2026'
STATED_ON = '2026-10-03'
APPROVED_AT = '2026-10-07T14:20:00Z'     # 8 Oct 2026 00:20 AEST, "Approved and get everything done"
BASIS = "The supplier's load day is the page's planned delivery day; a day recorded on the shared record always wins"
SINGLE = 'single dated event only'
SPAN = 'derived from the first and last scheduled dates for this reference — a planning span, not a confirmed on-hire period'

# ---- DATA: parse, prove the round trip, move the rows
m = re.search(r'const DATA\s*=\s*', s); start = m.end()
D, n = json.JSONDecoder().raw_decode(s[start:]); orig = s[start:start + n]
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == orig, 'DATA does not round-trip byte for byte - stopping'
byk = {a['key']: a for a in D['assets']}
unref = {r['task_id']: r for r in D['unreferenced']}
def disp(iso): return datetime.date.fromisoformat(iso).strftime('%d %b')
changes, same, skipped, unmatched = [], [], [], []

def correct(row, load, key, item, qty):
    old = row['date']
    if old == load['date']:
        same.append({'key': key, 'task_id': row.get('task_id'), 'item': item, 'qty': qty, 'date': old, 'load': load['n']}); return
    assert not row.get('date_correction') and row.get('date_as_written') in (None, old), (key, item, 'already carries a correction')
    row['date_as_written'] = old
    row['date_correction'] = {'as_written': old, 'stated_by': SOURCE_SHORT, 'stated_on': STATED_ON, 'recorded_at': APPROVED_AT,
                              'source': SOURCE, 'load': load['n'], 'load_date': load['date'], 'zone': load['zone'], 'basis': BASIS, 'plan886': True}
    row['date'] = load['date']
    if 'date_display' in row: row['date_display'] = disp(load['date'])
    changes.append({'key': key, 'task_id': row.get('task_id'), 'item': item, 'qty': qty, 'from': old, 'to': load['date'], 'load': load['n']})

for L in PLAN['loads']:
    for st in L['stops']:
        for dr in st['drops']:
            ref = dr.get('ref')
            if ref:
                assert ref not in CANCELLED, ref + ' is cancelled and must not be on a load'
                a = byk.get(ref); assert a, ref + ' is not in DATA.assets'
                want = [('FWF', dr['fwf'])] + ([('Pee Panel', dr['pee_panels'])] if dr.get('pee_panels') else [])
                for item, qty in want:
                    # the plan (prepared 3 Oct) moves rows scheduled on or after that day; a row before it was already
                    # delivered when the plan was made (WC67: 2 FWF on site since 1 Oct, 2 more on Load 2)
                    evs = [e for e in a['events'] if e.get('movement') == 'place' and e.get('item') == item and e.get('date') and e['date'] >= PLAN['prepared']]
                    assert len(evs) == 1, (ref, item, 'expected one placement row dated on or after the plan, found', len(evs))
                    e = evs[0]
                    assert e.get('quantity_raw') == qty, (ref, item, 'plan quantity', qty, 'schedule quantity', e.get('quantity_raw'))
                    correct(e, L, ref, item, qty)
            elif dr.get('task_ref'):
                tid = dr['task_ref']
                if tid in OFF_PLAN:
                    skipped.append({'load': L['n'], 'task_ref': tid, 'name': dr['name'], 'fwf': dr['fwf'], 'why': 'off the plan on the record (Andrew Fisher, 7 Oct 2026): the row stays where the record put it'}); continue
                r = unref.get(tid); assert r, tid + ' is not an unreferenced schedule row'
                assert r.get('item') == 'FWF' and str(r.get('quantity_display')) == str(dr['fwf']), (tid, 'quantity differs from the plan')
                correct(r, L, tid, 'FWF', dr['fwf'])
            else:
                unmatched.append({'load': L['n'], 'name': dr['name'], 'fwf': dr['fwf'], 'why': 'no WC number and no task reference: nothing on the page carries this drop yet'})

# the reference's own span follows its rows, by the builder's rule (first and last dated row; days; weeks to one decimal)
for k in sorted({c['key'] for c in changes if c['key'] in byk}):
    a = byk[k]; ds = sorted(e['date'] for e in a['events'] if e.get('date'))
    assert a.get('duration_state') in (SINGLE, SPAN), (k, a.get('duration_state'))
    a['first_date'], a['last_date'] = ds[0], ds[-1]
    days = (datetime.date.fromisoformat(ds[-1]) - datetime.date.fromisoformat(ds[0])).days
    a['days_between_first_and_last'] = days or None
    a['weeks_between_first_and_last'] = round(days / 7, 1) if days else None
    a['duration_state'] = SPAN if days else SINGLE
for k in ('T0089', 'WC32', 'WC66'):
    assert all(c['key'] != k for c in changes), k + ' must not move'
assert not any(e.get('date_correction') for e in byk['WC09']['events'] if e.get('item') == 'Toilet Block 6m'), 'the WC09 toilet blocks stay on their day'
assert changes, 'nothing to move - the plan already matches the page'
s = s[:start] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[start + n:]

# ---- what the page needs at run time
EP886 = {'version': PLAN['version'], 'prepared': STATED_ON, 'source': SOURCE_SHORT, 'approved_at': APPROVED_AT,
         'loads': [{'n': L['n'], 'date': L['date'], 'zone': L['zone'], 'fwf': L['fwf']} for L in PLAN['loads']],
         'off_plan': [{'load': x['load'], 'task_ref': x['task_ref'], 'name': x['name'], 'fwf': x['fwf']} for x in skipped],
         'unmatched': [{'load': x['load'], 'name': x['name'], 'fwf': x['fwf']} for x in unmatched]}
data = 'const EP886 = ' + json.dumps(EP886, ensure_ascii=False, separators=(',', ':')) + ';\n'
for bad, what in ((r'\$\s?\d', 'a dollar figure'), (r'(?<!\d)(?:\+?61\s?|0)[2-478](?:[\s-]?\d){8}(?!\d)', 'a phone number'), (r'(?i)site\s?iq', 'SiteIQ'), (r'</script', 'a closing tag'), (r'(?i)\b(?:codex|claude|chatgpt|openai|anthropic|gpt-?\d)', 'an agent or model name')):
    assert not re.search(bad, data), 'the plan data carries ' + what + ' - stopping'
js = data + (here / 'ep886.js').read_text()
css = (here / 'ep886.css').read_text()
assert '</script' not in js and '</style' not in css

# ---- 1. effectiveDates: a correction moves its own rows; the reference's first day and the day as written are read across
#         every row, so a reference with moved and unmoved rows (WC09) is not said to have moved as a whole
s = rep(s, """ const corr = !d.date ? dateCorrectionOf(a) : null;
 if (corr) return {in: inPlan, in_plan: corr.as_written || inPlan, in_moved: true, in_by: corr.stated_by, in_at: corr.recorded_at || corr.stated_on,
 in_where: 'schedule correction', in_correction: corr,
 out: d.out_date || outPlan, out_plan: outPlan, out_moved: !!(d.out_date && d.out_date !== outPlan), out_by: d.out_by, out_at: d.out_at};""",
 """ const corr = !d.date ? dateCorrectionOf(a) : null;
 if (corr) { /* v8.86 - the correction moves its own rows (WC09: the FWF and pee panels go with the Event Portables load, the
 6 m toilet blocks keep their day); the reference's first day and the day as written are read across every row */
 const ins886 = (a.events || []).filter(e => e && e.movement !== 'remove' && e.date);
 const written886 = ins886.map(e => e.date_as_written || e.date).sort()[0] || corr.as_written || inPlan;
 const moved886 = !!(inPlan && written886 && inPlan !== written886);
 return {in: inPlan, in_plan: written886, in_moved: moved886, in_by: corr.stated_by, in_at: corr.recorded_at || corr.stated_on,
 in_where: moved886 ? 'schedule correction' : d.date_where, in_correction: corr,
 out: d.out_date || outPlan, out_plan: outPlan, out_moved: !!(d.out_date && d.out_date !== outPlan), out_by: d.out_by, out_at: d.out_at}; }""",
 'effectiveDates correction branch', str(p))

# ---- 2. the day lists: a corrected row lands on its own corrected day; "moved from" is the day as written
s = rep(s, """ const on = isOut ? (eff.out_moved ? eff.out : e.date) : (eff.in_moved ? eff.in : e.date);
 /* where it moved FROM: the row's day — which, for a day corrected at the source, is the day as written */
 const moved = isOut ? (eff.out_moved ? e.date : null) : (eff.in_moved ? (eff.in_where === 'schedule correction' ? (e.date_as_written || e.date) : e.date) : null);""",
 """ const corrIn = !isOut && !!eff.in_correction; /* v8.86 - a correction at the source: each row keeps its own corrected day */
 const on = isOut ? (eff.out_moved ? eff.out : e.date) : corrIn ? e.date : (eff.in_moved ? eff.in : e.date);
 /* where it moved FROM: the day as written where the source corrected the row, else the row's own day. A day recorded on
 the page moves every row of the reference to it, and the schedule's day (as written) is what it moved from. */
 const moved = isOut ? (eff.out_moved ? e.date : null) : corrIn ? (e.date_correction ? (e.date_as_written || null) : null)
 : (eff.in_moved || e.date_correction ? ([e.date_as_written, e.date].find(x => x && x !== on) || null) : null);""",
 'programmeDaysBefore801 row day', str(p))

# ---- 3. moved off this day: the rows that moved, item by item, and the source on the line
s = rep(s, """ if (e.date_correction && e.date_as_written === iso && !out.some(x => x.key === a.key)) out.push({key: a.key, what: (a.item_types || []).join(', ') || a.product || e.item || '', to: e.date, corr: e.date_correction});""",
 """ if (e.date_correction && e.date_as_written === iso) { /* v8.86 - the rows that moved, item by item (WC09: the FWF and pee panels, not the toilet blocks) */
 const have = out.find(x => x.key === a.key), what = (e.quantity_display && e.quantity_display !== 'blank' ? e.quantity_display + ' × ' : '') + (e.item || (a.item_types || []).join(', ') || a.product || '');
 if (have) { if (have.what.indexOf(what) < 0) have.what += ', ' + what; } else out.push({key: a.key, what, to: e.date, corr: e.date_correction}); }""",
 'movedOffDay rows', str(p))
s = rep(s, """<b>${esc(m.key)}</b> ${esc(m.what)} — ${esc(fmtDate(c.stated_on || ''))}`;""",
 """<b>${esc(m.key)}</b> ${esc(m.what)} — ${esc(fmtDate(c.stated_on || ''))}${c.stated_by ? ' · ' + esc(c.stated_by) : ''}`; /* v8.86 - the source named */""",
 'movedOffLine source', str(p))
s = rep(s, """title="corrected out loud by the person who owns the job and applied at the build (sources/2026_Schedule/corrections.json) — the workbook still reads the day as written, beside it">schedule correction</span>'""",
 """title="corrected at the source and applied at the build — from sources/2026_Schedule/corrections.json, or from the Event Portables delivery plan v10 of 3 Oct 2026 for the supplier’s load days — the workbook still reads the day as written, beside it">schedule correction</span>'""",
 'whereChip words', str(p))

# ---- 4. the day table and the delivery card: the row's own day in the date box, the source beside "moved from"
s = rep(s, """ <div class="mv"><input type="date" data-${isIn ? 'date' : 'outdate'}="${esc(a.key)}" value="${esc((isIn ? eff.in : eff.out) || '')}\"""",
 """ <div class="mv"><input type="date" data-${isIn ? 'date' : 'outdate'}="${esc(a.key)}" value="${esc(rowDay886(a, events, eff, isIn) || '')}\"""",
 'dayRows date box', str(p))
s = rep(s, """moved from ${esc(fmtDay(moved_from).dm)}</span>` : ''}</div></td>
 <td class="refcell" data-label="GC500 ID">""",
 """moved from ${esc(fmtDay(moved_from).dm)}</span>` : ''}${isIn ? ep886Source(events) : ''}</div></td>
 <td class="refcell" data-label="GC500 ID">""",
 'dayRows source', str(p))
s = rep(s, """ const day = isIn ? eff.in : eff.out;
 const dow = day ? fmtDay(day).dow : '';""",
 """ const day = rowDay886(a, events, eff, isIn); /* v8.86 - the row's own day */
 const dow = day ? fmtDay(day).dow : '';""",
 'dayCard day', str(p))
s = rep(s, """moved from ${esc(fmtDay(moved_from).dm)}</span>` : ''}</div>
 </section>
 <section class="dcp dcqty">""",
 """moved from ${esc(fmtDay(moved_from).dm)}</span>` : ''}${isIn ? ep886Source(events) : ''}</div>
 </section>
 <section class="dcp dcqty">""",
 'dayCard source', str(p))

# ---- 5. the reference drawer: where the plan moved some rows of a reference and not others, say which
s = rep(s, """ : a.first_date ? ' · plan date' : 'no date on the schedule'}</div></div>
 <div class="f"><label for="eta-${esc(a.key)}">""",
 """ : a.first_date ? ' · plan date' : 'no date on the schedule'}</div>${ep886DrawerLines(a)}</div>
 <div class="f"><label for="eta-${esc(a.key)}">""",
 'drawer rows', str(p))

# ---- 5b. the drawer's In tile (v8.16): the rows the plan moved, where the reference's own first day did not
s = rep(s, """: a.first_date ? 'on the plan' : '') + (d.state === 'on site' ? ' · arrived' : '')""",
 """: a.first_date ? 'on the plan' : '') + ep886InWhy(a, eff) + (d.state === 'on site' ? ' · arrived' : '')""",
 'drawer In tile', str(p))

# ---- 6. v8.21's installer text: "Date needs confirmation" only on a row carrying what the supplier delivers
s = rep(s, """.map(l=>l.date).filter(date=>date&&date!==iso))]:[];""",
 """.map(l=>l.date).filter(date=>date&&date!==iso&&ep886Covers(r)))]:[];""",
 'daily821 date warning', str(p))

# ---- 7. the supplier card's record line: a drop the record has taken off the plan is said on its load (ep886.js)
s = rep(s, 'function epRecLine819(l, days){', 'function epRecLine819Before886(l, days){', 'epRecLine819 rename', str(p))

# ---- 8. the footer, the look and the code
s = rep(s, ' · v8.85', ' · v8.86', 'release footer', str(p))
s = s.replace('</head>', '<style id="ep886-style">' + css + '</style>\n</head>', 1)
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="ep886-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)

# ---- what moved, for the evidence and the identity check
out = {'plan': PLAN['version'], 'prepared': PLAN['prepared'], 'source': SOURCE_SHORT, 'approved_at': APPROVED_AT,
       'moved': changes, 'already_on_the_load_day': same, 'off_plan': skipped, 'unmatched': unmatched}
p.with_name('ep886_changes.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
print('v8.86 applied: %d rows moved to their Event Portables load day, %d already on it, %d off the plan, %d with nothing to carry them' % (len(changes), len(same), len(skipped), len(unmatched)))
for c in changes: print('  %-6s %-6s %-10s x%-3s %s -> %s  (Load %d)' % (c['key'], c['task_id'], c['item'], c['qty'], c['from'], c['to'], c['load']))
for x in skipped: print('  off the plan: %s (Load %d) - %s' % (x['name'], x['load'], x['why']))
for x in unmatched: print('  unmatched: %s x%d (Load %d) - %s' % (x['name'], x['fwf'], x['load'], x['why']))
