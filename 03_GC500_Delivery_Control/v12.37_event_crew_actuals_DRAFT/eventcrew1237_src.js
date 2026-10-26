/* Author: Andrew Fisher. Explicit aggregate event-crew evidence, counted once. */
(function (root) {
'use strict';
/* Decimal source values stay exact through products and sums; round money once
   at its note/line boundary. No change to unrelated native price calculations. */
function decimal(value) {
  const s = String(value), m = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(s);
  if (!m || !Number.isFinite(Number(s))) throw new TypeError('A finite decimal is required.');
  const places = (m[3] || '').length - Number(m[4] || 0);
  let n = BigInt(m[2] + (m[3] || '')) * (m[1] === '-' ? -1n : 1n), d = 1n;
  if (places >= 0) d = 10n ** BigInt(places); else n *= 10n ** BigInt(-places);
  return {n, d};
}
function plus(a, b) { const d = a.d > b.d ? a.d : b.d; return {n: a.n * (d / a.d) + b.n * (d / b.d), d}; }
function times(values) { return values.map(decimal).reduce((a,b)=>({n:a.n*b.n,d:a.d*b.d}), {n:1n,d:1n}); }
function rounded(a, places = 2) {
  const sign = a.n < 0n ? -1n : 1n, v = (a.n < 0n ? -a.n : a.n) * 10n ** BigInt(places);
  return Number(sign * ((2n * v + a.d) / (2n * a.d))) / 10 ** places;
}
function exactText(a) {
  const sign = a.n < 0n ? '-' : '', n = a.n < 0n ? -a.n : a.n, places = a.d.toString().length - 1;
  const s = n.toString().padStart(places + 1, '0');
  return sign + (places ? s.slice(0, -places) + '.' + s.slice(-places) : s);
}
const sumDecimal = values => values.map(decimal).reduce(plus, {n:0n,d:1n});
const round = n => rounded(decimal(n));
const product = (hours, rate) => rounded(times([hours, rate]));
const plain = x => !!x && typeof x === 'object' && !Array.isArray(x);
const text = x => typeof x === 'string' && x.trim().length > 0;
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x + 'T00:00:00Z')) && new Date(x + 'T00:00:00Z').toISOString().slice(0, 10) === x;
const number = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const paper = x => String(x == null ? '' : x).trim().replace(/\s+/g, '');
const sourceOf = n => ({note_no: paper(n.note_no || n.docket_no), date: n.date, labour_hours: Number(n.labour_hours)});
function makeAllocation(note, env, confirmation) {
  const c = confirmation || {};
  return {version: 1, kind: 'event-crew-day', scope_key: env.scopeKey, scope_document: env.scopeDocument,
    roster_group: env.group, quote: String(env.quote && env.quote.number || ''), source: sourceOf(note),
    confirmed_by: c.by, confirmed_on: c.on, confirmation: c.text};
}
function resolve(env) {
  const notes = env.notes || [], byId = {}, byDate = {}, issues = [], groups = new Map();
  const deleted = id => typeof env.deleted === 'function' ? env.deleted(id) : (env.deleted || []).includes(id);
  const active = notes.filter(n => n && !deleted(n.id));
  const counts = new Map(), ids = new Map(); active.forEach(n => {const k = paper(n.note_no || n.docket_no); counts.set(k, (counts.get(k) || 0) + 1); ids.set(String(n.id || ''), (ids.get(String(n.id || '')) || 0) + 1);});
  active.filter(n => Object.prototype.hasOwnProperty.call(n, 'event_allocation')).forEach(n => {
    const a = n.event_allocation, errors = [], src = sourceOf(n), id = String(n.id || '');
    const fail = s => errors.push(s);
    if (!plain(a)) fail('Event allocation is not an object.');
    else {
      const allowed = ['version','kind','scope_key','scope_document','roster_group','quote','source','confirmed_by','confirmed_on','confirmation'];
      if (Object.keys(a).some(k => !allowed.includes(k))) fail('Unknown event allocation field.');
      if (a.version !== 1 || a.kind !== 'event-crew-day') fail('Unsupported event allocation.');
      if (a.scope_key !== env.scopeKey || a.scope_document !== env.scopeDocument || a.roster_group !== env.group || a.quote !== String(env.quote && env.quote.number || '')) fail('Event scope, roster or quote no longer matches.');
      if (!plain(a.source) || Object.keys(a.source).sort().join('|') !== 'date|labour_hours|note_no' || a.source.note_no !== src.note_no || a.source.date !== src.date || a.source.labour_hours !== src.labour_hours) fail('The source paper, date or hours changed; review the allocation again.');
      if (!text(a.confirmed_by) || !text(a.confirmation) || !date(a.confirmed_on) || (env.today && a.confirmed_on > env.today)) fail('Named, dated scope confirmation is required.');
    }
    if (!id || ids.get(id) !== 1 || !/^\d{3,8}$/.test(src.note_no) || counts.get(src.note_no) !== 1) fail('The source paper and record identity must be unique.');
    if (n.usable === false || (!text(n.recorded_by) && !env.sourceNotes?.includes(id))) fail('The note is not usable or has no named recorder.');
    if (!date(src.date) || !(env.days || []).includes(src.date)) fail('The note date is outside this event.');
    if (!number(src.labour_hours) || src.labour_hours <= 0 || src.labour_hours > 10000 || round(src.labour_hours) !== src.labour_hours) fail('Total person-hours must be finite and positive, to two decimals.');
    if ((env.financeConflicts || {})[src.date]?.length) fail('Existing Finance review or journal coverage needs reconciliation.');
    if ((env.rateConflicts || {})[src.date]?.length) fail('Different or unresolved supplier rates cannot be split across aggregate hours.');
    if ((env.invalidSupplierClaims || []).some(c=>c && (String(c.id || '') === id || c.book === 'green' && paper(c.number) === src.note_no))) fail('Matching supplier allocation is invalid or conflicted; reconcile its source before replacing the crew forecast.');
    let rate = Object.prototype.hasOwnProperty.call(env.ratesByDay || {}, src.date) ? env.ratesByDay[src.date] : env.supplierRate ?? env.quote?.rate;
    if (!number(rate)) fail('The event supplier rate needs review.');
    const approved = (env.approvedPrices || {})[id]; let amount = number(rate) && number(src.labour_hours) ? product(src.labour_hours, rate) : null;
    if (approved) {
      if (approved.date !== src.date || approved.hours !== src.labour_hours || !number(approved.amount)) fail('Approved supplier quantities conflict with this aggregate note.');
      else {amount = approved.amount; rate = number(approved.rate) ? approved.rate : null;}
    }
    const row = {id, date: src.date, note_no: src.note_no, hours: src.labour_hours, rate, amount, approved: !!approved, allocation: a, shiftIds: (env.shiftIdsByDay || {})[src.date] || [], status: errors.length ? 'review' : 'valid', errors};
    byId[id] = row;
    const g = groups.get(src.date) || []; g.push(row); groups.set(src.date, g);
  });
  groups.forEach((rows, day) => {
    if (rows.length > 1) rows.forEach(r => {r.status = 'review'; r.errors.push('More than one whole-day crew total is linked to this date.');});
    if (rows.length === 1 && rows[0].status === 'valid') byDate[day] = rows[0];
    rows.filter(r => r.status !== 'valid').forEach(r => issues.push({id: r.id, date: day, note_no: r.note_no, errors: r.errors}));
  });
  const days = Object.values(byDate).sort((a,b) => a.date.localeCompare(b.date));
  return {byId, byDate, days, issues, hours: rounded(sumDecimal(days.map(x=>x.hours))), amount: rounded(sumDecimal(days.map(x=>x.amount)))};
}
const api = {version: 'v12.37', round, product, sourceOf, makeAllocation, resolve};
root.EventCrew1237 = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof document === 'undefined') return;
function noteSources() {
  return [...(FCOM.service_notes || []), ...(S.serviceNotes || []).filter(n=>n&&n.id&&!tombedHere(n.id)).map(n=>({...n, usable: !!n.date && Number(n.labour_hours)>0 && !!n.recorded_by}))];
}
function environment() {
  const W = root.Workforce1010, Q = W.QUOTE, notes = noteSources();
  const env = {notes, days: W.DATES.slice(), scopeKey: 'fence', scopeDocument: SCOPE?.document, group: W.GROUP_ID,
    quote: Q, today: todayIso(), deleted: tombedHere, sourceNotes: (FCOM.service_notes || []).map(n=>n.id), supplierRate: Q.rate, ratesByDay: {}, rateConflicts: {}, financeConflicts: {}, shiftIdsByDay: {}, approvedPrices: {}, invalidSupplierClaims: []};
  const pr = fenceCostFor('labour'), typed = pr && pr.source === 'typed' && number(pr.value);
  if (typed) env.supplierRate = pr.value;
  const raw = ourCosts(), people = raw.filter(r => r.kind === 'person'), events = typeof fin745List === 'function' ? fin745List('journal') : [];
  W.DATES.forEach(day => {
    const rates = [], evidence = [], ids = W.NAMES.map(name => W.shiftId(name, day));
    W.NAMES.forEach(name => {
      const p = people.find(x => x.person === name), override = fin745Latest('rate', name);
      if (override) {
        if (fin745Conflicts('rate', name).length || fin745ValidateRecordEvent(override).length) evidence.push(name);
        else rates.push({value: override.payload.rate, explicit: true});
      } else rates.push({value: p && p.pay_rate != null ? Number(p.pay_rate) : Q.rate, explicit: p && !p.workforce1010 && Number(p.pay_rate) !== Q.rate});
    });
    if (rates.some(x => x.explicit)) {
      const unique = [...new Set(rates.map(x => x.value))];
      if (unique.length !== 1 || !number(unique[0]) || (typed && unique[0] !== pr.value)) evidence.push('Supplier rates differ.');
      else env.ratesByDay[day] = unique[0];
    }
    if (evidence.length) env.rateConflicts[day] = evidence;
    const conflicts = [], sourceRows = raw.filter(r => r.kind === 'labour' && W.isPerson(r.person) && r.date === day);
    env.shiftIdsByDay[day] = sourceRows.filter(r => ids.includes(r.id)).map(r => r.id);
    sourceRows.filter(r => !ids.includes(r.id) || r.roster_basis !== 'forecast').forEach(r => conflicts.push(r.id));
    ids.forEach(id => {const r = fin745Latest('review', id); if (r && r.payload && r.payload.confirmed) conflicts.push(id);});
    events.filter(e => e.kind === 'journal' && e.payload && (e.payload.status !== 'void' || fin745Conflicts('journal', e.key).length) && e.payload.type !== 'reversal' && !(typeof fin745JournalReversed === 'function' && fin745JournalReversed(e))).forEach(e => {
      if ((e.payload.sourceIds || []).some(id => ids.includes(id))) conflicts.push(e.id);
    });
    if (conflicts.length) env.financeConflicts[day] = conflicts;
  });
  if (typeof supplierPricing1014 === 'function') {
    const pricing = supplierPricing1014();
    (pricing.orders || []).filter(o=>o.valid===false).forEach(o=>(o.records || []).forEach(r=>env.invalidSupplierClaims.push({id:r.id,book:r.book,number:r.number,po:o.number,errors:(o.errors || []).slice()})));
  }
  if (typeof supplierEntry1014 === 'function') notes.filter(n=>n.event_allocation).forEach(n=>{
    const p=supplierEntry1014('green',n.id); if(!p)return;
    const lines=p.lines||[], rates=[...new Set(lines.map(l=>l.rate))];
    env.approvedPrices[n.id]={date:p.date,hours:round(lines.reduce((s,l)=>s+Number(l.qty||0),0)),amount:p.amount,rate:rates.length===1?rates[0]:null};
  });
  return env;
}
const empty = {byId: {}, byDate: {}, days: [], issues: [], hours: 0, amount: 0};
function model() {
  if (!root.Workforce1010) return empty;
  if (![...(FCOM.service_notes || []), ...(S.serviceNotes || [])].some(n => n && Object.prototype.hasOwnProperty.call(n, 'event_allocation'))) return empty;
  const key = 'eventcrew1237-model';
  if (RENDER_MEMO.has(key)) return RENDER_MEMO.get(key);
  const result = resolve(environment()); RENDER_MEMO.set(key, result); return result;
}
function status(note) { return model().byId[String(note && note.id || '')] || null; }
function covered(row) { const r = row && (row.shift || row), found = r && model().byDate[r.date]; return found && found.shiftIds.includes(r.id) ? found : null; }
function active(row) { return !covered(row); }
function price(note, ordinary) { const found = status(note); return found?.status === 'valid' ? {value: found.rate, amount: found.amount, source: found.approved ? 'approved supplier pricing' : 'confirmed event-crew allocation', by: found.allocation.confirmed_by} : ordinary; }
function cost(note, ordinary) { const found = status(note); return found?.status === 'valid' ? found.amount : ordinary; }
function capture(input, who) {
  if (!Object.prototype.hasOwnProperty.call(input, 'event_allocation')) return {value: null, errors: []};
  const env = environment(), note = {...input, id: '__new_event_note__', recorded_by: who, note_no: paper(input.note_no), labour_hours: round(Number(input.labour_hours))};
  env.notes = env.notes.concat(note);
  const row = resolve(env).byId[note.id], errors = row ? row.errors.slice() : ['Event allocation could not be checked.'];
  if (input.event_allocation?.confirmed_by !== who) errors.push('The named operator must confirm this scope allocation.');
  return {value: errors.length ? null : JSON.parse(JSON.stringify(input.event_allocation)), errors};
}
function applyScope(m) {
  if (!m) return m;
  const current = model(), line = m.lines.find(l => l.key === 'fence');
  if (!line || !line.days.some(d => current.byDate[d.date])) return m;
  line.days.forEach(d => {const found = current.byDate[d.date]; if (!found) return;
    d.source_hours = d.hours; d.source_per = d.per; d.per = null; d.hours = found.hours; d.amount = Number(exactText(times([found.hours, line.rate])));
    d.event_note1237 = found; d.aggregate1237 = true;
  });
  const hours = line.days.map(d=>d.aggregate1237?decimal(d.hours):times([d.per || 0, d.people]));
  const exactHours = hours.reduce(plus,{n:0n,d:1n}), exactAmount = times([exactText(exactHours),line.rate]);
  line.hours = rounded(exactHours,4); line.amount_exact = Number(exactText(exactAmount)); line.amount = rounded(exactAmount);
  const amounts = m.lines.map(l=>l===line?exactText(exactAmount):l.amount_exact);
  m.people = rounded(sumDecimal(amounts)); m.hours = rounded(sumDecimal(m.lines.map(l=>l.hours))); m.total = rounded(sumDecimal(amounts.concat(m.at)));
  m.eventCrew1237 = current; return m;
}
function noteWords(note) { const r = status(note); return !r ? '' : r.status === 'valid' ? 'Existing event crew · ' + r.hours + ' total person-hours · customer Revenue in the event scope; supplier invoice/payment unverified' : 'Event allocation needs review: ' + r.errors.join(' ') + ' Existing pricing retained; no forecast replaced.'; }
function rowWords(row) { const r = covered(row); return r ? 'Original planned shift · covered by service note ' + r.note_no + ' (' + r.hours + ' total crew hours). No individual actual hours allocated.' : ''; }
function dayHtml(day) {
  const m = model(), d = m.byDate[day], errors = m.issues.filter(r=>r.date===day);
  const warning = errors.length ? '<p class="norate" data-event-review1237>Event allocation needs review: '+errors.map(r=>esc(r.note_no+': '+r.errors.join(' '))).join(' · ')+'</p>' : '';
  if (!d) return warning;
  const original = ourCosts().filter(r=>d.shiftIds.includes(r.id));
  return warning + '<div class="fin745-block" data-event-day1237="'+esc(day)+'"><h3>Event crew · signed service note '+esc(d.note_no)+'</h3><p><b>'+esc(fmtNum(d.hours))+' total person-hours · '+esc(money(d.amount))+'</b> at the linked supplier rate. Customer Revenue is in the event scope. Invoice/payment unverified.</p><details class="sfold"><summary>Original roster · replaced by this crew total</summary><div class="sfoldbody"><p>No individual actual hours have been allocated.</p><div class="tblwrap"><table class="progtbl"><thead><tr><th>Original source</th><th>Planned start</th><th>Planned finish</th><th>Planned hours</th></tr></thead><tbody>'+original.map(r=>'<tr><td>'+esc(r.person)+'</td><td>'+esc(r.start||'—')+'</td><td>'+esc(r.finish||'—')+'</td><td>'+esc(runWorked(r)==null?'—':fmtNum(runWorked(r)))+'</td></tr>').join('')+'</tbody></table></div></div></details></div>';
}
function scopeHtml(line, ro) {
  return '<tr data-scope-line="fence" data-event-scope1237><td><b>'+esc(line.role)+'</b><br><span class="w">Crew totals; no individual actual-hour split</span></td><td>'+esc(money(line.rate))+(ro?'':'<br><input class="rate scopein" inputmode="decimal" data-scope="rate|fence|" value="'+(line.rate_typed?esc(String(line.rate)):'')+'" placeholder="'+esc(String(line.rate))+'" aria-label="Customer event crew rate per person-hour">')+'</td>'+line.days.map(d=>'<td class="num"><b>'+esc(fmtNum(d.hours))+' h</b><br><span class="w">'+(d.aggregate1237?'Recorded crew total · note '+esc(d.event_note1237.note_no):'Scope plan · '+esc(String(d.people))+' people')+'</span>'+(!ro&&!d.aggregate1237?'<br><input class="rate scopein hrs" inputmode="decimal" data-scope="hours|fence|'+esc(d.day)+'" value="'+(d.per_typed?esc(String(d.per)):'')+'" placeholder="'+esc(String(d.per))+'" aria-label="Planned customer hours per person on '+esc(d.day)+'"> h each':'')+'</td>').join('')+'<td class="num"><b>'+esc(fmtNum(line.hours))+' h</b><br>'+esc(money(line.amount))+'</td></tr>';
}
Object.assign(api, {environment, model, status, covered, active, price, cost, capture, applyScope, noteWords, rowWords, dayHtml, scopeHtml, noteSources});
})(typeof window !== 'undefined' ? window : globalThis);
