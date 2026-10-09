#!/usr/bin/env python3
"""v6.77 (candidate, from v6.73) - WORDING FIXES D1-D16 from the 26 Sep re-audit, reusing the v6.74 wording only (no layout change; "race day" kept as Andrew's wording).

Originally: v6.74 - THE EXECUTIVE AUDIT, PART 1: WHAT THE NUMBERS MEAN (the CEO-presentation audit of 26 Sep 2026, DATA-01..10).

Nothing here changes a stored record or a calculation that money is made of. It changes what the page CLAIMS:
  DATA-01  unknown is not green - Coates Way lists what it cannot assess ("Not assessed - quote required")
  DATA-02  the Today gauge is "Deliveries due by today met"; the whole job is 764 quantified units + 26 references
           awaiting quantity, and its percentage is marked provisional
  DATA-03  the two Coates corporate measures read "Not measured by this system"; the job's own measures sit under
           their own names
  DATA-04  fence metres are "fence work on dockets", not fence standing (a clean-to-scrim conversion is in both)
  DATA-05  the money headline says "Forecast incomplete" and no longer leads with the $/h sensitivity
  DATA-06  the lines where Baseplan's prebill differs are called provisional in the headline, not netted
  DATA-07  race-weekend hours are "planned" until the day has been
  DATA-08  fencing money columns are "Client charge ex GST"; rates show the precision they are stored at
  DATA-09  fence exceptions by type (scrim, vehicle gates, CCB demarcation) on the plate and in Coates Way
  DATA-10  a removal shows the time the schedule writes for it, never the delivery's time; the 2019 closure drawing
           is badged reference-only
  plus UI-01/02 (phase and "event opens"), UI-03 (visible comments), DATA-12/13 (docket and contact wording),
  DATA-15 ("Delivery updates today").

  python3 patch_v674.py <page.html> [builder.py]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

HELPERS = r"""/* v6.74 - THE EXECUTIVE AUDIT (26 Sep 2026). Helpers its fixes share.
 A rate as it is stored: to the cent when it is whole cents, to four places when the card carries more, so a line's
 charge can be worked out again from what is on the screen ($16.1607 x 100 m = $1,616.07). */
const RATE_FMT = new Intl.NumberFormat('en-AU', {style:'currency', currency:'AUD', minimumFractionDigits:2, maximumFractionDigits:4});
const rateMoney = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null : RATE_FMT.format(Number(v));
/* Where a day sits in the programme whether or not a week sheet covers it: the phase around it and its day number,
 first sheet to last. A gap day inside the build is still the build (UI-01). */
function programmeDay(iso){
 const W = DATA.weeks || []; if (!W.length || !iso) return null;
 const start = W[0].start, end = W[W.length - 1].end;
 const days = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
 const total = days(start, end) + 1;
 if (iso < start) return {before: true, total, phase: null, wk: null, short: 'before the programme', words: 'before the programme starts on ' + fmtDay(start).dm};
 if (iso > end) return {after: true, total, phase: null, wk: null, short: 'after the programme', words: 'after the programme ended on ' + fmtDay(end).dm};
 const wk = weekOf(iso);
 const prev = [...W].reverse().find(w => w.end < iso) || null, next = W.find(w => w.start > iso) || null;
 const phase = wk ? wk.phase : prev && next && prev.phase !== next.phase ? next.phase : (prev || next || {}).phase || '';
 const n = days(start, iso) + 1, ph = phase ? phase + ' phase' : 'Programme';
 return {n, total, phase, wk, gap: !wk, short: `${ph} · day ${n} of ${total}`,
 words: `${ph} · day ${n} of ${total}${wk ? '' : ' · no programme sheet covers this day'}`};
}
/* Fencing types behind the programme by today, each in its own unit - early work on one type never clears a late
 one on another (DATA-09) */
function fenceGapsOf(ft){ return (ft || []).filter(t => t.planned != null && t.done < t.planned).map(t => ({name: t.name, unit: t.unit, done: t.done, planned: t.planned, short: Math.round((t.planned - t.done) * 100) / 100})); }
const fenceGapName = g => { const n = g.name.replace(/^Fence — /, ''); return n.charAt(0).toUpperCase() + n.slice(1); };
const fenceGapWords = g => `${fenceGapName(g)} ${fmtNum(g.short)}${g.unit === 'm' ? ' m' : ''}`;
/* The time a removal is written for, from the schedule row's own words ("5.00pm") - never the delivery's planned time
 to site. Where the row gives no time, there is none to show (DATA-10). */
function outTimeOf(events){
 for (const e of events || []) { const m = String(e.note || '').match(/\b(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)\b/i);
 if (m) { let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return String(h).padStart(2, '0') + ':' + (m[2] || '00'); } }
 return null;
}
const outTimeHtml = events => { const t = outTimeOf(events); return t ? `<b title="the time the schedule row writes for this removal">${esc(t)}</b>` : '<span class="todo" title="the schedule row gives no time for this removal">time to confirm</span>'; };
/* Race-weekend hours are worked only once the day has been (DATA-07) */
function raceHoursWord(){ const td = todayIso(), D = (typeof EVENT_DAYS !== 'undefined' && EVENT_DAYS) || DATA.race_days || [];
 if (!D.length) return 'planned'; if (D.every(d => d > td)) return 'planned'; if (D.every(d => d <= td)) return 'worked'; return 'worked and planned'; }
function completionAsOf("""

CW_TARGETS = r"""function cwTargets(){
 /* v6.74 (DATA-03) - Coates's fleet redline and fleet utilisation are measured across the fleet, over time. This
 record holds neither, so it says so; the job's own nearest measures sit beside them under their own names and
 never stand in for them. */
 const P = progressAsOf(todayIso());
 const all = P.all;
 const bdAll = allBreakdowns(), bdOpen = bdAll.filter(b => b.open);
 const onSite = all.onsite, due = all.due;
 return [
 {n: '15', unit: '%', what: 'Redline — fleet unavailable', why: 'Daily management discipline.', here: null,
 says: 'Not measured by this system — the redline is fleet time unavailable, and this record holds only the breakdowns people type in on this job. None typed in is not the same as none.',
 job: {what: 'Breakdowns recorded on this job', v: `${fmtNum(bdOpen.length)} open`, of: `of ${fmtNum(bdAll.length)} recorded`}},
 {n: '65', unit: '%', what: 'Fleet time utilisation', why: 'Fleet matched to demand.', here: null,
 says: 'Not measured by this system — utilisation is on-hire time over available time across the fleet, and this record has no availability data.',
 job: {what: 'Job delivery adherence', v: due ? `${fmtNum(onSite)} of ${fmtNum(due)}` : 'nothing due yet', of: 'references due by today on site'}},
 ];
}
/* v6.74 (DATA-01) - what this record cannot assess, said as unknown rather than left to read as green */
function cwUnknowns(){
 const out = [];
 if (!fenceQuote()) out.push(['Fencing against its quote', 'Not assessed — quote required. No quoted quantities are entered, so no line can be called over or under.']);
 out.push(['Fleet unavailable', 'Not measured by this system — breakdowns are typed in by people on this job.']);
 const M = typeof moneySummary === 'function' ? moneySummary(todayIso()) : null;
 if (M && M.missing.length) out.push(['Commercial result', `Forecast incomplete — ${M.missing.length} cost or charge item${M.missing.length === 1 ? '' : 's'} not in the figures yet (${M.missing_short.join(' · ')}).`]);
 return out;
}
"""

CW_CSS = """
/* v6.74 - the audit: a measure this record cannot take reads as unknown, never green */
.cwkpi.unk{--acc:var(--mute)}
.cwkpi.unk .cwkv{color:var(--mute);font-size:15px}
.cwkpi .cwjob{display:block;margin-top:6px;font-size:12px;color:var(--ink)}
.cwunk{margin-top:12px;border:1px dashed var(--line);border-radius:10px;padding:10px 12px}
.cwunk ul{margin:6px 0 0;padding-left:18px}
.cwunk li{margin:3px 0;font-size:13px}
.cprov{display:block;font-style:normal;font-size:11.5px;color:var(--mute);margin-top:2px}
.frc{font-size:11px;color:var(--mute);font-weight:400}
</style>"""


def between(t, a, b, new, what, need):
    i = t.find(a); j = t.find(b, i + 1) if i >= 0 else -1
    if i < 0 or j < 0 or j - i > 8000:
        if need: sys.exit('not found: ' + what)
        print('  skip', what); return t
    return t[:i] + new + t[j:]


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)

    # helpers, before completionAsOf
    t = R("function completionAsOf(asOf, X){", HELPERS + "asOf, X){", 'helpers')

    # DATA-02 - the whole job: quantified units and the references still to be quantified
    t = R("""return {on, onDue, onEarly, pace, plan, all, pct, planPct, points, race, toRace, word, cls, why,
 shortfall, P: X.P, X};""", """/* v6.74 (DATA-02) - a reference the schedule gives no quantity for counts as one thing to deliver, but it is
 not a measured quantity: the whole job is said as the units that ARE quantified plus the references awaiting one */
 const refsNoQty = rows.reduce((s, r) => s + (r.asked && r.a && !r.a.relocation ? chargeLines(r.a).filter(l => l.quantity == null).length : 0), 0);
 return {on, onDue, onEarly, pace, plan, all, pct, planPct, points, race, toRace, word, cls, why,
 shortfall, refsNoQty, quantified: all - refsNoQty, P: X.P, X};""", 'completion return')
    t = R("""<div><b>${fmtNum(C.all)}</b><span>units on the whole job</span></div>
 <div class="cwpc"><span><i class="on"></i>${pc1(C.pct)}% recorded</span>""",
          """<div><b>${fmtNum(C.quantified != null ? C.quantified : C.all)}</b><span>${C.refsNoQty ? 'quantified units' : 'units'} on the whole job${C.refsNoQty ? `<em class="cprov">+ ${fmtNum(C.refsNoQty)} reference${C.refsNoQty === 1 ? '' : 's'} awaiting quantity confirmation</em>` : ''}</span></div>
 <div class="cwpc"><span${C.refsNoQty ? ' title="provisional — each reference awaiting a quantity counts as one until it is confirmed"' : ''}><i class="on"></i>${pc1(C.pct)}% recorded${C.refsNoQty ? ' · provisional' : ''}</span>""", 'whole tile')
    t = R("<div class=\"hubtitle\"><h3>How far through the job we are</h3>", "<div class=\"hubtitle\"><h3>Deliveries due by today met</h3>", 'today gauge title')

    # UI-02 - the date the event opens, said as that
    # UI-01 - a gap day is still the build
    t = R("""<div class="sub">${wk ? esc(weekWords(wk)) : 'outside every week on the 2026 schedule'}""",
          """<div class="sub">${wk ? esc(weekWords(wk)) : esc((programmeDay(today) || {}).words || 'outside the 2026 programme')}""", 'today sub')
    t = R("""asOf < ((DATA.weeks || [])[0] || {}).start ? 'before the programme' : 'between programme weeks');""",
          """asOf < ((DATA.weeks || [])[0] || {}).start ? 'before the programme' : (((programmeDay(asOf) || {}).phase || 'between programme weeks') + (programmeDay(asOf) ? ' phase, no programme sheet today' : '')));""", 'email phase')
    for k in range(3):
        t = t.replace("'outside every week sheet on the programme'", "'no programme sheet covers this day'", 1)

    # DATA-15
    t = R("<div class=\"hubtitle\"><h3>Delivered today</h3>", "<div class=\"hubtitle\"><h3>Delivery updates today</h3>", 'delivered today')

    # DATA-03 / DATA-01 - Coates Way
    t = between(t, "function cwTargets(){", "/* The third ring asks four things", CW_TARGETS, 'cwTargets', need)
    t = R("""if (P.all.overdue) out.push({""", """/* v6.74 (DATA-09) - a fencing type behind the programme is red on its own, whatever the other types did early */
 fenceGapsOf(fenceTypes(P)).forEach(g => out.push({
 what: `Fencing behind the 2026 programme — ${esc(fenceGapName(g))}: ${esc(fmtNum(g.done))} of ${esc(fmtNum(g.planned))}${g.unit === 'm' ? ' m' : ''} due by today`,
 cause: null, action: null, owner: null, when: null, pillar: 'Operations', go: () => { state.tab = 'fencing'; render(); }}));
 if (P.all.overdue) out.push({""", 'cwReds fence')
    t = R("""const ok = k.good && k.good(k.here);
 return `<div class="cwkpi${ok ? ' good' : ' watch'}">""", """const ok = k.here != null && k.good && k.good(k.here);
 return `<div class="cwkpi${k.here == null ? ' unk' : ok ? ' good' : ' watch'}">""", 'cw kpi class')
    t = R("""<div class="cwkh"><b class="cwkv">${esc(String(k.here))}${esc(k.unit)}</b>
 <span class="cwks">${esc(k.says)}</span></div></div>`; }).join('')}</div>`""",
          """<div class="cwkh"><b class="cwkv">${k.here == null ? 'Not measured by this system' : esc(String(k.here)) + esc(k.unit)}</b>
 <span class="cwks">${esc(k.says)}</span>${k.job ? `<span class="cwjob">${esc(k.job.what)}: <b>${esc(k.job.v)}</b> ${esc(k.job.of)}</span>` : ''}</div></div>`; }).join('')}</div>`""", 'cw kpi value')
    t = R("""<p class="sub">The targets of Coates's eight that this job's own record can read.</p>""",
          """<p class="sub">Two of Coates's eight targets sit closest to this job. Neither is measured by this record, and it says so; the job's own nearest measure is under each, under its own name.</p>""", 'cw sub')
    t = R(""": '<div class="notice"><b>Nothing is red on this job today</b>No open breakdown, no overdue reference, no variance without authority and no fencing line over its quote. That is the scorecard saying green, not the page saying nothing.</div>'}""",
          """: '<div class="notice"><b>Nothing red on what this record measures</b>No open breakdown recorded, no overdue reference, no variance without authority and no fencing type behind the programme. What it cannot assess is listed below — not assessed is not green.</div>'}
 ${(() => { const U = cwUnknowns(); return U.length ? `<div class="cwunk"><b>Not assessed</b><ul>${U.map(([a, b]) => `<li><b>${esc(a)}</b> — ${esc(b)}</li>`).join('')}</ul></div>` : ''; })()}""", 'no reds')
    # DATA-12 / DATA-13 - the pillar rows say what they count
    t = R("""rows: [['On this job', `${fmtNum(crew.total)} named — ${fmtNum(crew.coates)} Coates, ${fmtNum(crew.fencing)} Advanced Temporary Fencing`],""",
          """rows: [['Contacts on the record', `${fmtNum(crew.total)} — ${fmtNum(crew.coates)} Coates, ${fmtNum(crew.fencing)} Advanced Temporary Fencing${crew.other ? `, ${fmtNum(crew.other)} other` : ''}`],""", 'contacts')
    t = R("""['Crews on the record', `${fmtNum(prestartsFor('coates').length)} Coates""", """['Pre-start documents by crew', `${fmtNum(prestartsFor('coates').length)} Coates""", 'prestart crews')
    t = R("""['Dockets signed', `${fmtNum(dockets.length)} · ${fmtNum(usable.length)} priced`],""",
          """['Fencing dockets', (() => { const part = usable.filter(d => d.cost_state === 'partly priced').length; return `${fmtNum(dockets.length)} recorded · ${fmtNum(usable.length - part)} fully priced${part ? ` · ${fmtNum(part)} partly priced` : ''}${dockets.length > usable.length ? ` · ${fmtNum(dockets.length - usable.length)} not usable` : ''}`; })()],""", 'dockets row')
    t = R("""return {total: people.length, fencing: fencing, coates: people.length - fencing - people.filter(p => p.group === 'other').length};""",
          """const other = people.filter(p => p.group === 'other').length;
 return {total: people.length, fencing: fencing, other: other, coates: people.length - fencing - other};""", 'crewCount')
    # UI-03 - build notes that were printing on the page
    t = R("""the hall beyond the windscreen">`} /* v6.00 - the hero is the cog's own loop; the still is its poster */""",
          """the hall beyond the windscreen">`}""", 'comment v6.00')
    t = R("""<button class="btn primary" id="cwOpenMachine" type="button"${DATA.edition === 'hosted' ? '' : ' hidden'}>Open the machine</button> /* v6.01 - the plan-on-satellite and 3D-proof buttons live on the Map tab only */""",
          """<button class="btn primary" id="cwOpenMachine" type="button"${DATA.edition === 'hosted' ? '' : ' hidden'}>Open the machine</button>""", 'comment v6.01')

    # DATA-05 / DATA-06 - the money headline
    t = R("""${M.difference0 < 0 ? esc(money0(-M.difference0)) + ' behind' : esc(money0(M.difference0)) + ' ahead'} so far.</b> Not a margin yet — ${pl(M.missing.length, 'thing')} not in it.${M.breakeven != null ? ` The biggest is the crew's wages: ${esc(fmtNum(M.breakeven_hours))} h on the tracker with no wage rate, and the difference so far covers them only up to ${esc(money(M.breakeven))} an hour on average.` : ''}</div>""",
          """ difference so far ${sd(M.difference0)}.</b> <span class="chip act">Forecast incomplete</span> Not a margin and not a profit — ${pl(M.missing.length, 'item')} not in it yet${M.breakeven_hours ? `, the biggest the crew's wages (${esc(fmtNum(M.breakeven_hours))} h with no wage rate)` : ''}.${M.charge.contracts_differs ? ` <b>Provisional:</b> ${pl(M.charge.contracts_differs, 'contract line')} with the charge basis unresolved — ${esc(money0(M.charge.differs_charge))} by the rule, ${esc(money0(M.charge.differs_prebill))} prebilled. Counted by the rule until the branch settles each line; the two are not netted.` : ''}</div>""", 'costs verdict')
    t = R("""<p class="mline">Not a margin yet — ${M.missing_short.length} thing${M.missing_short.length === 1 ? '' : 's'} not in it${M.breakeven != null ? `; the crew's wages are the biggest, ${esc(fmtNum(M.breakeven_hours))} h with no rate — the difference covers them up to ${esc(money(M.breakeven))} an hour` : ''}.</p>""",
          """<p class="mline"><b>Forecast incomplete</b> — not a margin: ${M.missing_short.length} thing${M.missing_short.length === 1 ? '' : 's'} not in it yet (${esc(M.missing_short.join(' · '))}).</p>""", 'wwa mline')
    t = R("""${M.breakeven != null ? ` For scale only: the difference so far divided by these hours is ${esc(money(M.breakeven))} an hour — arithmetic on the two figures, not a rate anybody gave.` : ''}</p>` : ''}""",
          """</p>` : ''}""", 'breakeven hint')

    # DATA-07 - race-weekend hours planned until the day has been
    t = R("""<div class="l">Race weekend — worked</div>""", """<div class="l">Race weekend — ${esc(raceHoursWord())}</div>""", 'race kpi')
    t = R("""the tracker's race-day hours are shown here as worked, in hours only, and counted with the wages.""",
          """the tracker's race-day hours are shown here in hours only, as ${esc(raceHoursWord())} (a day still to come is planned), and counted with the wages.""", 'race note')

    # DATA-08 - the fencing money columns are what Coates charges; rates at the precision they are stored
    th_old = '<th class="num">Cost</th>'
    th_new = '<th class="num" title="what Coates charges the V8s at the 2026 card, ex GST — what Coates pays is on the rates table and the purchase orders">Client charge <small>ex GST</small></th>'
    a = t.find('<h3>Rates — what we charge, what we pay</h3>'); b = t.find('function docketLines(d){')
    seg_s, seg_e = (a, t.find('${cw4OpenCard()}', a)) if a >= 0 else (-1, -1)
    if seg_s >= 0 and seg_e > seg_s and t.count(th_old, seg_s, seg_e) == 4:
        t = t[:seg_s] + t[seg_s:seg_e].replace(th_old, th_new) + t[seg_e:]
    elif need: sys.exit('fencing Cost headers: %d' % (t.count(th_old, seg_s, seg_e) if seg_s >= 0 else -1))
    t = R("""<span class="w">${c.settled_by ? 'settled' : 'card'} ${esc(money(c.rate))}</span>""", """<span class="w">${c.settled_by ? 'settled' : 'card'} ${esc(rateMoney(c.rate))}</span>""", 'rate card')
    t = R("""${r.value != null ? `<b>${esc(money(r.value))}</b><span class="w">${esc(per)}""", """${r.value != null ? `<b>${esc(rateMoney(r.value))}</b><span class="w">${esc(per)}""", 'rate value')
    t = R("""${pr.value != null ? `<b>${esc(money(pr.value))}</b><span class="w">${esc(per)}""", """${pr.value != null ? `<b>${esc(rateMoney(pr.value))}</b><span class="w">${esc(per)}""", 'paid value')
    t = R("""return d.lines.length ? d.lines.map(l => `<b>${esc(fmtQty(l.qty, l.unit))}</b> ${esc(l.name)}${""",
          """return d.lines.length ? d.lines.map(l => `<b>${esc(fmtQty(l.qty, l.unit))}</b> ${esc(l.name)}${l.cost != null && l.rate != null ? ` <span class="frc">× ${esc(rateMoney(l.rate))} = ${esc(money(l.cost))}</span>` : ''}${""", 'docket calc')

    # DATA-04 / DATA-09 - the fence plate
    t = R("""const F = fenceMetres(P), ft = fenceTypes(P), fd = fenceDerived();""", """const F = fenceMetres(P), ft = fenceTypes(P), fd = fenceDerived(), gaps = fenceGapsOf(ft);""", 'plate vars')
    t = R("""<div class="n">${esc(fmtNum(F.done))}<small> of ${esc(fmtNum(F.total))} m temporary fence installed</small></div>""",
          """<div class="n">${esc(fmtNum(F.done))}<small> of ${esc(fmtNum(F.total))} m of fence work on dockets</small></div>""", 'plate n')
    t = R("""<span>Areas ticked done</span><b>${P.areas ? `${P.areasDone} of ${P.areas}` : '<small>none named on a docket yet</small>'}</b>""",
          """${gaps.length ? `<span class="bad">Behind the programme by type</span><b class="bad">${esc(gaps.map(fenceGapWords).join(' · '))}</b>` : ''}
 <span title="the areas the crew have named on a docket, ticked finished — not every area on the programme">Docket areas ticked done</span><b>${P.areas ? `${P.areasDone} of ${P.areas}` : '<small>none named on a docket yet</small>'}</b>""", 'plate areas')
    t = R("""programme is every 2026 week. Metres and gates are never added together.""",
          """programme is every 2026 week. Metres and gates are never added together. The metres are work on the dockets, not fence standing: a run put in as clean fence and later converted to scrim is on both dockets (36505 then 36539, 97.5 m at Cypress Carpark), and removals are not taken off. Early work on one type never makes up for a type behind.""", 'plate note')
    t = R("""m temporary fence installed${F.planned ? ` (${fmtNum(F.planned)} m planned by this day)` : ''}${P.areas ? ` · areas ticked complete ${P.areasDone} of ${P.areas}` : ''}`);""",
          """m of fence work on dockets${F.planned ? ` (${fmtNum(F.planned)} m planned by this day)` : ''}${(() => { const g = fenceGapsOf(fenceTypes(P)); return g.length ? ' · behind by type: ' + g.map(fenceGapWords).join(', ') : ''; })()}${P.areas ? ` · docket areas ticked complete ${P.areasDone} of ${P.areas}` : ''}`);""", 'email fence')

    # DATA-10 - removals show their own time; the 2019 drawing is reference only
    t = R(""": `<b>${d.eta ? esc(d.eta) : '—'}</b>`}""", """: outTimeHtml(events)}""", 'card out time')
    t = R("""aria-label="Planned time to site for ${esc(a.key)}">` : (d.eta ? esc(d.eta) : '<span class="todo">—</span>')}""",
          """aria-label="Planned time to site for ${esc(a.key)}">` : outTimeHtml(events)}""", 'table out time')
    t = R("""<figcaption>${esc(bd.title || 'Master layout')}""",
          """<figcaption>${bd.project_no ? `<span class="chip act" title="the base drawing under the handwriting is an earlier project's; the 2026 closure authority is to be confirmed with the project owner">Reference only — 2026 closure authority to confirm</span> ` : ''}${esc(bd.title || 'Master layout')}""", 'drawing badge')

    # CSS
    i = t.find('</style>')
    if i >= 0: t = t[:i] + CW_CSS + t[i + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
