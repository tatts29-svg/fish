#!/usr/bin/env python3
"""v6.78 (draft, on top of the v6.77 candidate) - THE RUNNING SHEET and THE QUESTIONS PAGE (Andrew, 26 Sep 2026).

RUNNING SHEET - "I want to be able to put someone's start times and finish times and it tallies up with how many hours
they did on that day ... meal cost, accommodation cost, R&M cost, consumables cost, stationery cost for each worker ...
salary, labour hire or Coates CNA employee ... a running sheet, 4 people but option to add more ... editable ... option
to add the rate of pay if available."
 * One row per person per day. Start and finish are typed (or changed) and the hours, the normal / x1.5 / x2 split, the
   pay (where a rate is entered) and the day's total work themselves out.
 * It is a view over the SAME lines the Costs tab reads (the tracker's shifts, nights, meals and expenses, changed and
   added to on the page), so nothing is counted twice: a time changed here is the time on Costs.
 * The pay rules are Andrew's, and they are editable in the sheet's settings box:
     Coates CNA  - normal day 7.6 h; the next 2 h x1.5; the rest x2
     Labour hire - normal day 7.5 h; the next 2 h x1.5; the rest x2
     Saturday    - the first 2 h x1.5, the rest x2 (both types)
     Sunday      - every hour x2 (both types)
     Weekdays take a 30-minute unpaid break (typed break minutes win); weekend breaks are paid
     Salary      - hours only, no penalty rates
 * A person's type and pay rate are set once and apply to every day. R&M, consumables and stationery are one expense
   line per person per day each. Wages worked out here are shown on the sheet and on Costs, and are not added to the
   known-cost total until the rates are confirmed.
QUESTIONS - "keep questions away from the main info, let's have a page for questions, by branch, fencing, transport,
labour." Every open question the record raises, in one place, grouped, each with where it lives and an answer box that
carries the name of whoever answered it.

  python3 patch_v678.py <page.html> [builder.py]
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

JS = r"""/* ================================================================== v6.78 - THE RUNNING SHEET
 Andrew's pay rules, 26 Sep 2026, held in the shared record's runRules map so a change reaches every copy. */
const RUN_DEF = {cna_ord: 7.6, lh_ord: 7.5, ot_x15: 2, sat_x15: 2, wd_break: 30};
const RUN_RULE_WORDS = {cna_ord: 'Coates CNA — normal hours a weekday', lh_ord: 'Labour hire — normal hours a weekday', ot_x15: 'Weekday overtime hours at ×1.5 before ×2',
 sat_x15: 'Saturday hours at ×1.5 before ×2', wd_break: 'Weekday unpaid break (minutes) where none is typed'};
function runRule(k){ const v = (S.runRules || {})[k], n = Number(v); return v != null && String(v).trim() !== '' && Number.isFinite(n) && n >= 0 ? n : RUN_DEF[k]; }
function setRunRule(k, v){
 if (!mayWrite('running sheet rule')) return; const who = whoAmI(); if (!who) return;
 const s = String(v == null ? '' : v).trim();
 if (s !== '' && !(Number.isFinite(Number(s)) && Number(s) >= 0)) { flash('That has to be a number — or leave it empty for the standard figure.'); return; }
 S.runRules = S.runRules || {}; if (s === '') delete S.runRules[k]; else S.runRules[k] = s;
 stampIt('runRules', k, who); save(); render();
}
/* the three kinds of worker, whatever the tracker called them */
function runType(t){ const s = String(t || '').toLowerCase(); return /salary/.test(s) ? 'salary' : /external|hire/.test(s) ? 'hire' : /cna|internal|coates/.test(s) ? 'cna' : ''; }
const RUN_TYPE_WORD = {salary: 'Salary', hire: 'Labour hire', cna: 'Coates CNA', '': 'type not set'};
const RUN_TYPE_STORE = {salary: 'Salary', hire: 'External', cna: 'Internal CNA'};
function runIsWeekend(iso){ const d = new Date(String(iso) + 'T00:00:00').getDay(); return d === 0 || d === 6; }
/* the break taken off a shift: what is typed, else the weekday standard; weekend breaks are paid */
function runBreak(c){ if (c.break_min != null && String(c.break_min).trim() !== '' && Number.isFinite(Number(c.break_min))) return Number(c.break_min); return runIsWeekend(c.date) ? 0 : runRule('wd_break'); }
/* the hours of a shift: from start and finish, less the break, whenever both are there; else the hours typed */
function runHours(c){
 if (c.start && c.finish) { const h = shiftHours(c.start, c.finish, runBreak(c)); if (h != null) return h; }
 const n = Number(c.hours); return c.hours != null && String(c.hours).trim() !== '' && Number.isFinite(n) ? n : null;
}
function splitHoursFor(h, iso, type){
 const wd = new Date(String(iso) + 'T00:00:00').getDay(), x = Math.max(0, Number(h) || 0), r2 = n => Math.round(n * 100) / 100, t = runType(type);
 if (t === 'salary') return {ordinary: r2(x), at_1_5: 0, at_2: 0, salary: true};
 if (wd === 0) return {ordinary: 0, at_1_5: 0, at_2: r2(x)};
 if (wd === 6) { const a = Math.min(x, runRule('sat_x15')); return {ordinary: 0, at_1_5: r2(a), at_2: r2(x - a)}; }
 const ord = t === 'hire' ? runRule('lh_ord') : runRule('cna_ord'), X = runRule('ot_x15');
 const o = Math.min(x, ord), a = Math.min(Math.max(x - ord, 0), X);
 return {ordinary: r2(o), at_1_5: r2(a), at_2: r2(Math.max(x - ord - X, 0))};
}
/* pay for a split, where the person has a rate: normal x1, then x1.5 and x2; salary is the rate times the hours */
function runPay(split, rate){ if (rate == null) return null; return Math.round((split.ordinary + 1.5 * split.at_1_5 + 2 * split.at_2) * rate * 100) / 100; }
const RUN_MISC = [['R&M', 'rm', 'R&M'], ['Consumables', 'cons', 'Consumables'], ['Stationery', 'stat', 'Stationery']];
function runMiscId(person, date, type){ return 'W-E-' + ourSlug(person) + '-' + String(date).replace(/-/g, '') + '-' + ourSlug(type); }
/* everything the sheet shows for one day, read off ourCosts() - the list Costs reads */
function runDay(iso){
 const L = ourCosts(), r2 = n => Math.round(n * 100) / 100;
 const people = L.filter(c => c.kind === 'person' && c.usable);
 const pmap = new Map(people.map(p => [p.person, p]));
 const names = new Set(people.map(p => p.person));
 L.filter(c => c.date === iso && c.person && ['labour', 'meals', 'accommodation'].includes(c.kind)).forEach(c => names.add(c.person));
 L.filter(c => c.date === iso && c.kind === 'misc' && c.who && pmap.has(c.who)).forEach(c => names.add(c.who));
 const rows = [...names].sort((a, b) => a.localeCompare(b)).map(n => {
 const P = pmap.get(n) || {person: n}, type = runType(P.type);
 const rate = P.pay_rate != null && String(P.pay_rate).trim() !== '' && Number.isFinite(Number(P.pay_rate)) ? Number(P.pay_rate) : null;
 const shift = L.find(c => c.kind === 'labour' && c.person === n && c.date === iso) || null;
 const h = shift ? runHours(shift) : null, sp = h != null ? splitHoursFor(h, iso, P.type) : null;
 const meal = L.find(c => c.kind === 'meals' && c.person === n && c.date === iso) || null;
 const night = L.find(c => c.kind === 'accommodation' && c.person === n && c.date === iso) || null;
 const misc = {}; RUN_MISC.forEach(([lab, k, typ]) => { misc[k] = L.find(c => c.id === runMiscId(n, iso, typ)) || null; });
 const pay = sp ? runPay(sp, rate) : null;
 const money = [pay, meal && meal.amount, night && night.amount, ...RUN_MISC.map(([, k]) => misc[k] && misc[k].amount)].filter(v => v != null && Number.isFinite(Number(v)));
 return {name: n, P, type, rate, shift, hours: h, split: sp, brk: shift ? runBreak(shift) : null, pay, meal, night, misc, total: money.length ? r2(money.reduce((s, v) => s + Number(v), 0)) : null};
 });
 const team = L.filter(c => c.date === iso && c.kind === 'misc' && !RUN_MISC.some(([, , typ]) => c.id === runMiscId(c.who || '', iso, typ)) && !(c.who && pmap.has(c.who) && RUN_MISC.some(([, , typ]) => c.id === runMiscId(c.who, iso, typ))));
 return {iso, rows, team};
}
/* the whole job, person by person: to date and the rest planned */
function runTotals(){
 const L = ourCosts(), td = todayIso(), r2 = n => Math.round(n * 100) / 100;
 const pmap = new Map(L.filter(c => c.kind === 'person' && c.usable).map(p => [p.person, p]));
 const per = new Map(), P0 = n => { if (!per.has(n)) { const P = pmap.get(n) || {}; per.set(n, {name: n, type: runType(P.type), rate: P.pay_rate != null && String(P.pay_rate).trim() !== '' ? Number(P.pay_rate) : null,
 hours: 0, to_date: 0, ordinary: 0, at_1_5: 0, at_2: 0, pay: 0, pay_hours_unrated: 0, meals: 0, nights: 0, accommodation: 0, rm: 0, cons: 0, stat: 0}); } return per.get(n); };
 L.filter(c => c.kind === 'labour' && c.usable && c.person).forEach(c => { const x = P0(c.person), h = runHours(c); if (h == null) return;
 const sp = splitHoursFor(h, c.date, (pmap.get(c.person) || {}).type); x.hours += h; if (c.date <= td) x.to_date += h;
 x.ordinary += sp.ordinary; x.at_1_5 += sp.at_1_5; x.at_2 += sp.at_2;
 const p = runPay(sp, x.rate); if (p != null) x.pay += p; else x.pay_hours_unrated += h; });
 L.filter(c => c.kind === 'meals' && c.person && c.amount != null).forEach(c => { P0(c.person).meals += Number(c.amount) || 0; });
 L.filter(c => c.kind === 'accommodation' && c.person).forEach(c => { const x = P0(c.person); x.nights++; if (c.amount != null) x.accommodation += Number(c.amount) || 0; });
 L.filter(c => c.kind === 'misc' && c.who && c.amount != null).forEach(c => { RUN_MISC.forEach(([, k, typ]) => { if (c.id === runMiscId(c.who, c.date, typ)) P0(c.who)[k] += Number(c.amount) || 0; }); });
 const rows = [...per.values()].map(x => { Object.keys(x).forEach(k => { if (typeof x[k] === 'number' && k !== 'rate' && k !== 'nights') x[k] = r2(x[k]); }); x.total = r2(x.pay + x.meals + x.accommodation + x.rm + x.cons + x.stat); return x; })
 .sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name));
 const all = rows.reduce((s, x) => { ['hours', 'to_date', 'ordinary', 'at_1_5', 'at_2', 'pay', 'pay_hours_unrated', 'meals', 'nights', 'accommodation', 'rm', 'cons', 'stat', 'total'].forEach(k => s[k] = r2((s[k] || 0) + x[k])); return s; }, {});
 return {rows, all};
}
/* the writes - each goes through the same line the Costs tab's forms use */
function runSetShift(person, iso, patch){
 const id = 'W-L-' + ourSlug(person) + '-' + String(iso).replace(/-/g, '');
 const f = Object.assign({}, patch); if ('start' in f || 'finish' in f || 'break_min' in f) f.hours = '';
 return ourRawOf(id) && !tombedHere(id) ? setOurCost(id, f) : !!addOurCost('labour', Object.assign({person, date: iso}, f));
}
function runSetMoney(kind, person, iso, v){
 const id = (kind === 'meals' ? 'W-M-' : 'W-A-') + ourSlug(person) + '-' + String(iso).replace(/-/g, '');
 const s = String(v == null ? '' : v).replace(/[$,\s]/g, '');
 if (s === '' && kind === 'meals') { if (ourRawOf(id) && !tombedHere(id)) removeOurCost(id); return; }
 return ourRawOf(id) && !tombedHere(id) ? setOurCost(id, {amount: s}) : !!addOurCost(kind, {person, date: iso, amount: s});
}
function runSetMisc(person, iso, type, v){
 if (!mayWrite('running sheet line')) return; const who = whoAmI(); if (!who) return;
 const id = runMiscId(person, iso, type), s = String(v == null ? '' : v).replace(/[$,\s]/g, '');
 if (s === '') { if (ourRawOf(id) && !tombedHere(id)) removeOurCost(id); return; }
 if (!Number.isFinite(Number(s))) { flash('That has to be a number, ex GST.'); return; }
 const now = new Date().toISOString(), prior = ourRawOf(id);
 const line = Object.assign({}, prior && !tombedHere(id) ? prior : {id, side: 'ours', kind: 'misc', category: 'Misc and other expenses', from: 'page', recorded_by: who, recorded_on: now, at: now, by: who},
 {date: iso, type, who: person, description: type + ' — ' + person, amount: Math.round(Number(s) * 100) / 100, updated_at: now, updated_by: who});
 if (tombedHere(id)) untomb(id, who);
 S.costs = (S.costs || []).filter(c => c.id !== id); S.costs.push(line);
 stampIt('ourcost', id, who); save(); render();
}
function runAddPerson(name, type){
 const n = String(name || '').replace(/\s+/g, ' ').trim(); if (!n) { flash('Put the person’s name in first.'); return; }
 if (ourCosts().some(c => c.kind === 'person' && c.person.toLowerCase() === n.toLowerCase())) { flash(n + ' is already on the sheet.'); return; }
 setOurPerson(n, {type: RUN_TYPE_STORE[type] || ''}); render();
}
function runShiftDay(iso, d){ const x = new Date(iso + 'T00:00:00'); x.setDate(x.getDate() + d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function renderRunsheet(){ return holdAssets(renderRunsheet_held); }
function renderRunsheet_held(){
 const iso = /^\d{4}-\d{2}-\d{2}$/.test(state.runDay || '') ? state.runDay : todayIso();
 const D = runDay(iso), T = runTotals(), ed = canEdit(), f = fmtDay(iso), wk = runIsWeekend(iso);
 const m = v => v == null || v === '' ? '' : String(Math.round(Number(v) * 100) / 100);
 const inp = (attrs, val, ph, w) => ed ? `<input ${attrs} value="${esc(val == null ? '' : val)}" placeholder="${esc(ph || '')}" style="width:${w || 72}px">` : (val == null || val === '' ? '<span class="todo">—</span>' : esc(val));
 const cellMoney = (attr, v) => inp(`type="text" inputmode="decimal" ${attr}`, m(v), '$', 70);
 const tot = k => D.rows.reduce((s, r) => s + (r[k] == null ? 0 : Number(r[k])), 0);
 const sumSplit = k => D.rows.reduce((s, r) => s + (r.split ? r.split[k] : 0), 0);
 const hh = v => v == null ? '<span class="todo">—</span>' : esc(fmtNum(Math.round(v * 100) / 100));
 const mz = v => v ? esc(money(v)) : '—';
 $('#pane-runsheet').innerHTML = paneHeadingHtml('runsheet') + `
 <div class="card runsheet">
 <div class="hubtitle"><h3>Running sheet — ${esc(fmtDate(iso))}</h3><span class="chip ${wk ? 'act' : 'ref'}">${new Date(iso + 'T00:00:00').getDay() === 0 ? 'Sunday — all ×2, paid break' : new Date(iso + 'T00:00:00').getDay() === 6 ? 'Saturday — first ' + runRule('sat_x15') + ' h ×1.5, then ×2, paid break' : 'Weekday — ' + runRule('wd_break') + ' min unpaid break'}</span></div>
 <div class="rsnav"><button class="btn" data-rsday="${runShiftDay(iso, -1)}">← ${esc(fmtDay(runShiftDay(iso, -1)).dm)}</button>
 <input type="date" id="rsDate" value="${esc(iso)}" aria-label="Day on the running sheet" data-ro>
 <button class="btn" data-rsday="${runShiftDay(iso, 1)}">${esc(fmtDay(runShiftDay(iso, 1)).dm)} →</button>
 <button class="btn ghost" data-rsday="${todayIso()}">Today</button></div>
 <p class="sub">Type or change anyone's start and finish — the hours, the normal / ×1.5 / ×2 split, the pay (where a rate is entered) and the day's total work themselves out. Every change carries your name and time and is the same line the Costs tab reads. Amounts ex GST.${ed ? '' : ' <b>View only</b> — open the editing link to change a line.'}</p>
 <div class="tblwrap"><table class="rstbl"><thead><tr><th>Person</th><th>Type</th><th>Start</th><th>Finish</th><th class="num" title="unpaid break in minutes — empty takes the standard">Break</th><th class="num">Hours</th><th class="num">Normal</th><th class="num">×1.5</th><th class="num">×2</th><th class="num">Rate $/h</th><th class="num">Pay</th><th class="num">Meals</th><th class="num">Accom.</th><th class="num">R&amp;M</th><th class="num">Consum.</th><th class="num">Station.</th><th class="num">Day total</th><th>Note</th></tr></thead><tbody>
 ${D.rows.map(r => { const n = esc(r.name); return `<tr>
 <td><b>${n}</b>${r.P.employer ? `<br><span class="w">${esc(r.P.employer)}</span>` : ''}</td>
 <td>${ed ? `<select data-rstype="${n}" aria-label="Type for ${n}">${['', 'cna', 'hire', 'salary'].map(t => `<option value="${t}"${r.type === t ? ' selected' : ''}>${t ? RUN_TYPE_WORD[t] : '—'}</option>`).join('')}</select>` : esc(RUN_TYPE_WORD[r.type])}</td>
 <td>${inp(`type="time" step="60" data-rsf="start" data-rsp="${n}"`, r.shift && r.shift.start, '', 92)}</td>
 <td>${inp(`type="time" step="60" data-rsf="finish" data-rsp="${n}"`, r.shift && r.shift.finish, '', 92)}</td>
 <td class="num">${inp(`type="text" inputmode="numeric" data-rsf="break_min" data-rsp="${n}"`, r.shift && r.shift.break_min != null && String(r.shift.break_min) !== '' ? r.shift.break_min : '', r.shift ? String(r.brk) : '', 48)}</td>
 <td class="num"><b>${hh(r.hours)}</b></td><td class="num">${hh(r.split && r.split.ordinary)}</td><td class="num">${hh(r.split && r.split.at_1_5)}</td><td class="num">${hh(r.split && r.split.at_2)}</td>
 <td class="num">${inp(`type="text" inputmode="decimal" data-rsrate="${n}"`, r.rate != null ? m(r.rate) : '', 'optional', 64)}</td>
 <td class="num">${r.pay != null ? esc(money(r.pay)) : r.hours != null ? '<span class="w" title="no pay rate entered for this person">no rate</span>' : '<span class="todo">—</span>'}</td>
 <td class="num">${cellMoney(`data-rsm="meals" data-rsp="${n}"`, r.meal && r.meal.amount)}</td>
 <td class="num">${cellMoney(`data-rsm="accommodation" data-rsp="${n}"`, r.night && r.night.amount)}${r.night && r.night.rate_from === 'person' ? '<br><span class="w">their rate</span>' : ''}</td>
 ${RUN_MISC.map(([lab, k, typ]) => `<td class="num">${cellMoney(`data-rsx="${esc(typ)}" data-rsp="${n}"`, r.misc[k] && r.misc[k].amount)}</td>`).join('')}
 <td class="num"><b>${r.total != null ? esc(money(r.total)) : '—'}</b></td>
 <td>${inp(`type="text" data-rsf="note" data-rsp="${n}"`, r.shift && r.shift.note, '', 130)}</td></tr>`; }).join('')}
 <tr class="total"><td><b>The day</b></td><td>${D.rows.length} people</td><td></td><td></td><td></td>
 <td class="num"><b>${hh(tot('hours'))}</b></td><td class="num">${hh(sumSplit('ordinary'))}</td><td class="num">${hh(sumSplit('at_1_5'))}</td><td class="num">${hh(sumSplit('at_2'))}</td><td></td>
 <td class="num">${tot('pay') ? esc(money(tot('pay'))) : '—'}</td><td class="num">${mz(D.rows.reduce((s, r) => s + (r.meal && r.meal.amount != null ? Number(r.meal.amount) : 0), 0))}</td>
 <td class="num">${mz(D.rows.reduce((s, r) => s + (r.night && r.night.amount != null ? Number(r.night.amount) : 0), 0))}</td>
 ${RUN_MISC.map(([, k]) => `<td class="num">${mz(D.rows.reduce((s, r) => s + (r.misc[k] && r.misc[k].amount != null ? Number(r.misc[k].amount) : 0), 0))}</td>`).join('')}
 <td class="num"><b>${mz(tot('total'))}</b></td><td></td></tr></tbody></table></div>
 ${D.team.length ? `<p class="norate">Also on this day, not against one person: ${D.team.map(c => `${esc(c.description || c.type || 'expense')}${c.amount != null ? ' ' + esc(money(c.amount)) : ''}`).join(' · ')}.</p>` : ''}
 ${ed ? `<div class="rsadd"><input id="rsNewName" placeholder="Add a person — name" style="width:200px"><select id="rsNewType">${['cna', 'hire', 'salary'].map(t => `<option value="${t}">${RUN_TYPE_WORD[t]}</option>`).join('')}</select><button class="btn" id="rsAdd">Add person</button><span class="w">They go on the sheet for every day; type their times on the days they work.</span></div>` : ''}
 <details class="sfold" data-sfold="runsheet|rules"${SFOLD_OPEN.has('runsheet|rules') ? ' open' : ''}><summary>Pay rules — change them here</summary><div class="sfoldbody">
 <table class="rsrules"><tbody>${Object.keys(RUN_DEF).map(k => `<tr><td>${esc(RUN_RULE_WORDS[k])}</td><td class="num">${ed ? `<input type="text" inputmode="decimal" data-rsrule="${k}" value="${esc((S.runRules || {})[k] != null ? S.runRules[k] : '')}" placeholder="${esc(String(RUN_DEF[k]))}" style="width:70px">` : esc(String(runRule(k)))}</td><td class="w">${(S.runRules || {})[k] != null ? 'changed by ' + esc(stampBy('runRules', k) || 'unnamed') : 'standard'}</td></tr>`).join('')}</tbody></table>
 <p class="norate">Coates CNA and labour hire: the normal hours above, then the overtime hours at ×1.5, then ×2. Saturday: the Saturday hours at ×1.5, then ×2. Sunday: every hour ×2. Weekend breaks are paid. Salary: hours only, no penalty rates. A break typed on a line always wins over the standard.</p>
 </div></details>
 </div>
 <div class="card"><div class="hubtitle"><h3>Running totals — the whole job</h3><span class="chip ref">to date and planned</span></div>
 <div class="tblwrap"><table class="rstbl"><thead><tr><th>Person</th><th>Type</th><th class="num">Hours</th><th class="num">to date</th><th class="num">Normal</th><th class="num">×1.5</th><th class="num">×2</th><th class="num">Pay</th><th class="num">Meals</th><th class="num">Nights</th><th class="num">Accom.</th><th class="num">R&amp;M</th><th class="num">Consum.</th><th class="num">Station.</th><th class="num">Total</th></tr></thead><tbody>
 ${T.rows.map(x => `<tr><td><b>${esc(x.name)}</b></td><td>${esc(RUN_TYPE_WORD[x.type])}</td><td class="num">${hh(x.hours)}</td><td class="num">${hh(x.to_date)}</td><td class="num">${hh(x.ordinary)}</td><td class="num">${hh(x.at_1_5)}</td><td class="num">${hh(x.at_2)}</td>
 <td class="num">${x.pay ? esc(money(x.pay)) : x.hours ? '<span class="w">no rate</span>' : '—'}</td><td class="num">${x.meals ? esc(money(x.meals)) : '—'}</td><td class="num">${x.nights || '—'}</td><td class="num">${x.accommodation ? esc(money(x.accommodation)) : x.nights ? '<span class="w">no rate</span>' : '—'}</td>
 <td class="num">${x.rm ? esc(money(x.rm)) : '—'}</td><td class="num">${x.cons ? esc(money(x.cons)) : '—'}</td><td class="num">${x.stat ? esc(money(x.stat)) : '—'}</td><td class="num"><b>${esc(money(x.total) || '—')}</b></td></tr>`).join('')}
 <tr class="total"><td><b>Everyone</b></td><td></td><td class="num"><b>${hh(T.all.hours)}</b></td><td class="num">${hh(T.all.to_date)}</td><td class="num">${hh(T.all.ordinary)}</td><td class="num">${hh(T.all.at_1_5)}</td><td class="num">${hh(T.all.at_2)}</td>
 <td class="num">${T.all.pay ? esc(money(T.all.pay)) : '—'}</td><td class="num">${T.all.meals ? esc(money(T.all.meals)) : '—'}</td><td class="num">${T.all.nights || '—'}</td><td class="num">${T.all.accommodation ? esc(money(T.all.accommodation)) : '—'}</td>
 <td class="num">${T.all.rm ? esc(money(T.all.rm)) : '—'}</td><td class="num">${T.all.cons ? esc(money(T.all.cons)) : '—'}</td><td class="num">${T.all.stat ? esc(money(T.all.stat)) : '—'}</td><td class="num"><b>${esc(money(T.all.total) || '—')}</b></td></tr></tbody></table></div>
 <p class="norate">${T.all.pay_hours_unrated ? `<b>${esc(fmtNum(T.all.pay_hours_unrated))} h</b> have no pay rate yet, so no wage is put on them. ` : ''}Wages worked out here are not added to the known-cost total on Costs until the rates are confirmed.</p></div>`;
 const pane = $('#pane-runsheet');
 pane.querySelectorAll('[data-rsday]').forEach(b => b.onclick = () => { state.runDay = b.dataset.rsday; renderRunsheet(); });
 const dt = pane.querySelector('#rsDate'); if (dt) dt.onchange = () => { if (/^\d{4}-\d{2}-\d{2}$/.test(dt.value)) { state.runDay = dt.value; renderRunsheet(); } };
 pane.querySelectorAll('[data-rsf]').forEach(i => i.onchange = () => { runSetShift(i.dataset.rsp, iso, {[i.dataset.rsf]: i.value}); render(); });
 pane.querySelectorAll('[data-rsm]').forEach(i => i.onchange = () => { runSetMoney(i.dataset.rsm, i.dataset.rsp, iso, i.value); render(); });
 pane.querySelectorAll('[data-rsx]').forEach(i => i.onchange = () => runSetMisc(i.dataset.rsp, iso, i.dataset.rsx, i.value));
 pane.querySelectorAll('[data-rsrate]').forEach(i => i.onchange = () => { const s = String(i.value || '').replace(/[$,\s]/g, ''); if (s !== '' && !Number.isFinite(Number(s))) { flash('The rate has to be a number of dollars an hour.'); return; } setOurPerson(i.dataset.rsrate, {pay_rate: s}); render(); });
 pane.querySelectorAll('[data-rstype]').forEach(s => s.onchange = () => { setOurPerson(s.dataset.rstype, {type: RUN_TYPE_STORE[s.value] || ''}); render(); });
 pane.querySelectorAll('[data-rsrule]').forEach(i => i.onchange = () => setRunRule(i.dataset.rsrule, i.value));
 const ad = pane.querySelector('#rsAdd'); if (ad) ad.onclick = () => runAddPerson(pane.querySelector('#rsNewName').value, pane.querySelector('#rsNewType').value);
}
/* ================================================================== v6.78 - THE QUESTIONS PAGE
 Every open question the record raises, worked out from the record each time - so a question that gets answered in
 the record (a rate typed, a branch put on, a quote entered) drops off by itself - grouped the way Andrew asked:
 by branch, fencing, transport, labour, then the schedule and the plant. An answer typed here is kept with its name
 and time; it records the answer, and the figure it settles is still changed where it lives. */
function qAnswer(id){ return (S.answers || {})[id] || ''; }
function setQAnswer(id, v){
 if (!mayWrite('answer')) return; const who = whoAmI(); if (!who) return;
 const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 600);
 S.answers = S.answers || {}; if (!s) delete S.answers[id]; else S.answers[id] = s;
 stampIt('answers', id, who); save(); render();
}
function questionsList(){
 const td = todayIso(), Q = [], add = (group, id, q, why, go) => Q.push({group, id, q, why, go});
 let M = null; try { M = moneySummary(td); } catch (e) {}
 /* by branch */
 try { const R = branchRollup(td);
 R.branches.forEach(g => { const c = g.contract || {}; const code = g.code || 'no branch';
 if (c.unknown) add('By branch', 'br-norate-' + code, `${code}: ${c.unknown} contract line${c.unknown === 1 ? '' : 's'} with no rate — what is each one charged?`, 'Unknown, not nought — they are not in the charges until a rate is on them.', 'pricing');
 (c.differs || []).forEach((x, i) => add('By branch', 'br-diff-' + code + '-' + i, contractDiffWords(x), 'The rule and Baseplan\'s prebill read differently — which is the correct bill?', 'costs')); });
 if (R.none && R.none.lines && R.none.lines.length) add('By branch', 'br-none', `${R.none.lines.length} schedule line${R.none.lines.length === 1 ? ' has' : 's have'} no branch — which branch carries ${R.none.lines.length === 1 ? 'it' : 'them'}?`, 'A line with no branch carries no branch revenue or cost.', 'plant');
 } catch (e) {}
 /* fencing */
 if (!fenceQuote()) add('Fencing', 'fe-quote', 'What quantities does Advanced Temporary Fencing\'s quote cover?', 'Until the quote is entered, no fencing line can be called over or under.', 'fencing');
 try { (typeof FCOL !== 'undefined' ? FCOL : []).filter(c => c.card_state !== 'matched' && !c.settled_by && fenceRateFor(c.key).value == null).forEach(c => add('Fencing', 'fe-rate-' + c.key, `No charge rate for "${c.name_as_written}" — what do we charge for it?`, (c.card_why || 'The 2026 card has no line for it.') + ' A docket with it is not priced until a rate is typed.', 'fencing')); } catch (e) {}
 try { fenceGapsOf(fenceTypes(progressAsOf(td))).forEach(g => add('Fencing', 'fe-gap-' + ourSlug(g.name), `${fenceGapName(g)}: ${fmtNum(g.done)} of ${fmtNum(g.planned)}${g.unit === 'm' ? ' m' : ''} due by today — what is the plan to catch up, and by when?`, 'Early work on other fencing types does not make it up.', 'fencing')); } catch (e) {}
 add('Fencing', 'fe-closure', 'Is the fencing closure plan (drawn on the 2019 base, project 19003 rev 13) approved for 2026?', 'The gates and fence lines printed under the handwriting are last year\'s.', 'fencing');
 /* transport */
 if (M) M.missing.filter(s => /transport/i.test(s)).forEach((s, i) => add('Transport', 'tr-miss-' + i, s.charAt(0).toUpperCase() + s.slice(1) + ' — when will the rest be known?', 'Transport not on the record is not in the known costs.', 'costs'));
 try { const O = ourCosts().filter(c => c.kind === 'transport' && c.usable && c.amount == null); if (O.length) add('Transport', 'tr-await', `${O.length} of our transport line${O.length === 1 ? ' is' : 's are'} waiting for a cost — what did ${O.length === 1 ? 'it' : 'they'} cost?`, 'Our cost, not a charge.', 'costs'); } catch (e) {}
 /* labour */
 try { const T = runTotals(); const nr = T.rows.filter(x => x.rate == null && x.hours); if (nr.length) add('Labour', 'lb-rates', `Pay rates for ${nr.map(x => x.name).join(', ')} — what are they?`, `${fmtNum(T.all.pay_hours_unrated)} h on the running sheet have no rate, so no wage is put on them.`, 'runsheet');
 const na = T.rows.filter(x => x.nights && !x.accommodation); if (na.length) add('Labour', 'lb-nights', `Accommodation rate a night for ${na.map(x => x.name).join(', ')}?`, `${na.reduce((s, x) => s + x.nights, 0)} nights have no rate.`, 'runsheet'); } catch (e) {}
 try { const LP = labourPlan(); if (LP.all.unpriced) add('Labour', 'lb-noqty', `${LP.all.unpriced} labour lines sit on references with no readable quantity — how many units are they?`, 'No labour figure can be put on them until the quantity is known.', 'pricing'); } catch (e) {}
 if (M) M.missing.filter(s => /event staff|not on the tracker/i.test(s)).forEach((s, i) => add('Labour', 'lb-miss-' + i, s.charAt(0).toUpperCase() + s.slice(1) + ' — who, and at what cost?', 'Not on the record, so not in the costs.', 'costs'));
 /* schedule and plant */
 try { const X = dsnState(td); const nq = X.rows.filter(r => r.noQty && !r.reloc).map(r => r.a.key); if (nq.length) add('Schedule & plant', 'sp-noqty', `${nq.length} references carry no quantity in the schedule (${nq.slice(0, 8).join(', ')}${nq.length > 8 ? ', …' : ''}) — how many units is each?`, 'Each is counted as one until confirmed.', 'plant'); } catch (e) {}
 (DATA.open_items || []).filter(o => !/closed|resolved/i.test(String(o.status || ''))).forEach(o => add('Schedule & plant', 'oi-' + o.id, `${o.id} — ${o.title}`, o.finding || '', 'about'));
 return Q;
}
function renderQuestions(){ return holdAssets(renderQuestions_held); }
function renderQuestions_held(){
 const Q = questionsList(), ed = canEdit();
 const groups = ['By branch', 'Fencing', 'Transport', 'Labour', 'Schedule & plant'];
 const open = Q.filter(q => !qAnswer(q.id)).length;
 $('#pane-questions').innerHTML = paneHeadingHtml('questions') + `
 <div class="card"><div class="hubtitle"><h3>Questions</h3><span class="chip ${open ? 'act' : 'ok'}">${open} open · ${Q.length - open} answered</span></div>
 <p class="sub">Every open question the record raises, in one place, so the main pages can stay on the facts. They are worked out from the record each time: when the answer goes in where it lives — a rate typed, a branch put on, a quote entered — the question drops off by itself. An answer typed here is kept with your name and time.</p>
 <div class="qjump">${groups.map(g => { const n = Q.filter(q => q.group === g).length; return n ? `<a class="chip ref" href="#questions" data-qg="${esc(g)}">${esc(g)} · ${n}</a>` : ''; }).join(' ')}</div></div>
 ${groups.map(g => { const L = Q.filter(q => q.group === g); if (!L.length) return '';
 return `<div class="card qgroup" id="qg-${esc(ourSlug(g))}"><h3>${esc(g)} <span class="chip ref">${L.length}</span></h3><ol class="qlist">${L.map(q => { const a = qAnswer(q.id);
 return `<li class="${a ? 'answered' : ''}"><b>${esc(q.q)}</b>${q.why ? `<span class="qwhy">${esc(q.why)}</span>` : ''}
 <span class="qact"><button type="button" class="linkish" data-qgo="${esc(q.go)}">Open where it lives →</button></span>
 ${ed ? `<label class="qans"><span class="vh">Answer</span><input data-qa="${esc(q.id)}" value="${esc(a)}" placeholder="Type the answer — it keeps your name"></label>` : a ? `<span class="qansv">Answer: ${esc(a)}</span>` : ''}
 ${a ? `<span class="edby">${esc(stampBy('answers', q.id) || 'unnamed')}</span>` : ''}</li>`; }).join('')}</ol></div>`; }).join('')}`;
 const pane = $('#pane-questions');
 pane.querySelectorAll('[data-qgo]').forEach(b => b.onclick = () => go(b.dataset.qgo));
 pane.querySelectorAll('[data-qa]').forEach(i => i.onchange = () => setQAnswer(i.dataset.qa, i.value));
 pane.querySelectorAll('[data-qg]').forEach(a => a.onclick = e => { e.preventDefault(); const el = document.getElementById('qg-' + ourSlug(a.dataset.qg)); if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); });
}
function renderToday(){"""

CSS = """
/* v6.78 - the running sheet and the questions page */
.rstbl{font-size:12.5px} .rstbl td,.rstbl th{padding:5px 6px;vertical-align:middle;white-space:nowrap}
.rstbl input,.rstbl select{font:inherit;font-size:12.5px;padding:3px 5px;border:1px solid var(--rule);border-radius:5px;background:#fff}
.rstbl td.num input{text-align:right}
.rstbl .w{font-size:11px;color:var(--mute)}
.rsnav{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0 8px}
.rsadd{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:10px 0 4px} .rsadd input,.rsadd select{font:inherit;padding:5px 7px;border:1px solid var(--rule);border-radius:6px}
.rsrules{min-width:0;width:auto} .rsrules td{padding:4px 8px;font-size:13px;white-space:normal}
.qlist{margin:0;padding-left:22px} .qlist li{margin:0 0 12px;line-height:1.4}
.qlist li.answered b{color:var(--mute);text-decoration:line-through}
.qwhy{display:block;font-size:12.5px;color:var(--ink2)} .qact{display:block;margin-top:2px;font-size:12.5px}
.qans input{margin-top:5px;width:min(560px,100%);font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--rule);border-radius:6px}
.qansv{display:block;margin-top:4px;font-size:13px;color:var(--green)}
.qjump{display:flex;flex-wrap:wrap;gap:6px}
</style>"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R("function renderToday(){", JS, 'running sheet + questions js')
    # the two pages: in TABS (Tools, not the top row), panes and the router
    t = R("""['pricing','Pricing'],['timeline','Timeline'],['about','About this file']];""",
          """['pricing','Pricing'],['timeline','Timeline'],['runsheet','Running sheet'],['questions','Questions'],['about','About this file']];""", 'tabs')
    t = R("""<section class="pane" id="pane-prestarts"></section>""", """<section class="pane" id="pane-prestarts"></section>
  <section class="pane" id="pane-runsheet"></section>
  <section class="pane" id="pane-questions"></section>""", 'panes')
    t = R(""" else if (state.tab === 'timeline') renderTimeline();
 else renderAbout();""", """ else if (state.tab === 'timeline') renderTimeline();
 else if (state.tab === 'runsheet') renderRunsheet();
 else if (state.tab === 'questions') renderQuestions();
 else renderAbout();""", 'router')
    # the shared record carries the pay rules and the answers
    t = R(""" minDays:{},""", """ minDays:{},
 /* v6.78 - the running sheet's pay rules (Andrew's, editable) and the answers typed on the Questions page */
 runRules:{}, answers:{},""", 'S defaults')
    t = R(""" minDays: {kind: 'value', get: () => S.minDays, set: v => S.minDays = v},""",
          """ minDays: {kind: 'value', get: () => S.minDays, set: v => S.minDays = v},
 runRules: {kind: 'value', get: () => S.runRules, set: v => S.runRules = v},
 answers: {kind: 'value', get: () => S.answers, set: v => S.answers = v},""", 'sync colls')
    t = R("""labour: (j && j.labour) || {}, eventHours: (j && j.eventHours) || {}, minDays: (j && j.minDays) || {},""",
          """labour: (j && j.labour) || {}, eventHours: (j && j.eventHours) || {}, minDays: (j && j.minDays) || {}, runRules: (j && j.runRules) || {}, answers: (j && j.answers) || {},""", 'import load')
    t = R("""labour: S.labour || {}, eventHours: S.eventHours || {}, minDays: S.minDays || {},""",
          """labour: S.labour || {}, eventHours: S.eventHours || {}, minDays: S.minDays || {}, runRules: S.runRules || {}, answers: S.answers || {},""", 'export')
    for old in ["'minDays', 'fixes', 'entries', 'places']", "'minDays', 'fixes', 'entries', 'places', 'givenRefs']"]:
        if t.count(old) == 1: t = t.replace(old, old[:-1] + ", 'runRules', 'answers']")
        elif need: sys.exit('list not unique: ' + old)
    i = t.find("'minDays']", t.find('const known = ['))
    if i > 0: t = t[:i] + "'minDays', 'runRules', 'answers']" + t[i + len("'minDays']"):]
    # a person's pay rate, and the three kinds of worker
    t = R("""{name: 'accommodation_rate', label: 'Rate a night ex GST', type: 'money'},""",
          """{name: 'accommodation_rate', label: 'Rate a night ex GST', type: 'money'},
 {name: 'pay_rate', label: 'Pay rate $/h (optional)', type: 'money'},""", 'person pay rate')
    # one reading of a shift's hours and its split, everywhere (Costs included)
    t = R("""const h = has(c.hours) ? num(c.hours) : shiftHours(c.start, c.finish, c.break_min);
 if (has(c.hours) && (h == null || h < 0 || h > 24)) P.push('the hours are not a number of hours in a day');""",
          """const h = (c.start && c.finish && shiftHours(c.start, c.finish, 0) != null) ? runHours(c) : has(c.hours) ? num(c.hours) : shiftHours(c.start, c.finish, c.break_min); /* v6.78 - the running sheet's reading */
 if (has(c.hours) && (h == null || h < 0 || h > 24)) P.push('the hours are not a number of hours in a day');""", 'grade hours')
    t = R("""const b = splitHours(h, s.date);""", """const b = splitHoursFor(h, s.date, personOf(s.person).type); /* v6.78 - by the person's type */""", 'tracker split')
    i = t.find('</style>')
    if i >= 0: t = t[:i] + CSS + t[i + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
