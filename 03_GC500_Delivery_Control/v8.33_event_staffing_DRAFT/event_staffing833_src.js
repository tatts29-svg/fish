/* Author: Andrew Fisher. Planned event roster reconciliation; no record writes or extra charges. */
function eventStaffing833(input) {
  const spec = input.spec || {}, dates = new Set(spec.dates || []), finance = input.finance || [];
  const round = n => Math.round(n * 100) / 100, number = n => typeof n === 'number' && Number.isFinite(n);
  const seenPeople = new Set(), expectedIds = new Set(), warnings = [];
  const rows = (spec.roster || []).filter(p => {
    if (!p.id || seenPeople.has(p.id)) { warnings.push('Duplicate or missing roster identity'); return false; }
    seenPeople.add(p.id); return true;
  }).map(p => {
    const wanted = new Set(p.shiftIds || []), expectedDates = p.shiftDates || {};
    const selected = finance.filter(r => wanted.has(r.id) && dates.has(r.date) && r.person === p.name && (!expectedDates[r.id] || expectedDates[r.id] === r.date));
    wanted.forEach(id => expectedIds.add(id));
    const distinct = new Map(); selected.forEach(r => { if (distinct.has(r.id)) warnings.push('Duplicate shift identity'); else distinct.set(r.id, r); });
    const shifts = [...distinct.values()], paidHours = round(shifts.reduce((s, r) => s + (number(r.paid) ? r.paid : 0), 0));
    const priced = shifts.filter(r => number(r.calculatedCost)), missing = [...wanted].filter(id => !distinct.has(id));
    const unpricedHours = round(shifts.filter(r => !number(r.calculatedCost)).reduce((s, r) => s + (number(r.paid) ? r.paid : 0), 0));
    const extra = finance.filter(r => r.person === p.name && dates.has(r.date) && !wanted.has(r.id));
    const changed = shifts.some(r => !r.source || r.source.start !== spec.start || r.source.finish !== spec.finish || r.source.break_min !== 0 || r.paid !== spec.paidHoursPerDay);
    const unresolvedShifts = missing.length + shifts.filter(r => !number(r.paid)).length;
    return {id: p.id, name: p.name, role: p.role, shifts, paidHours, unpricedHours, unresolvedShifts, pricedHours: round(paidHours - unpricedHours),
      knownCost: priced.length ? round(priced.reduce((s, r) => s + r.calculatedCost, 0)) : null,
      missing, extraIds: extra.map(r => r.id), changed, complete: !missing.length && !extra.length && !changed,
      forecastOnly: shifts.every(r => r.status === 'forecast')};
  });
  const unconfirmed = (spec.unconfirmed || []).map(p => {
    const shifts = finance.filter(r => (p.shiftIds || []).includes(r.id) && dates.has(r.date) && r.person === p.name);
    return {name: p.name, role: p.role, shiftIds: shifts.map(r => r.id), paidHours: round(shifts.reduce((s, r) => s + (number(r.paid) ? r.paid : 0), 0))};
  });
  const additional = finance.filter(r => dates.has(r.date) && !expectedIds.has(r.id) && !unconfirmed.some(p => p.shiftIds.includes(r.id)));
  const known = rows.filter(r => r.knownCost !== null), scope = input.scope || null;
  return {rows, unconfirmed, additional, warnings, placeholders: spec.placeholders || [], duties: spec.duties || [],
    expectedPeople: rows.length, expectedHours: round(rows.length * dates.size * (spec.paidHoursPerDay || 0)),
    paidHours: round(rows.reduce((s, r) => s + r.paidHours, 0)), unpricedHours: round(rows.reduce((s, r) => s + r.unpricedHours, 0)), unresolvedShifts: rows.reduce((s, r) => s + r.unresolvedShifts, 0),
    knownCost: known.length ? round(known.reduce((s, r) => s + r.knownCost, 0)) : null,
    complete: rows.every(r => r.complete) && !warnings.length,
    scopeTotal: scope ? scope.total : null, scopeStaffing: scope ? scope.people : null,
    fenceScope: scope ? (scope.lines || []).find(r => r.key === 'fence') || null : null,
    dates: spec.dates || [], start: spec.start, finish: spec.finish, paidHoursPerDay: spec.paidHoursPerDay};
}
function eventStaffingModel833() {
  return eventStaffing833({spec: DATA.event_staffing833, finance: fin745Rows(), scope: scopeFigures()});
}
function eventStaffingRole833(name, date) {
  const spec = DATA.event_staffing833 || {};
  if (date && !(spec.dates || []).includes(date)) return '';
  const person = (spec.roster || []).find(p => p.name === name);
  if (person) return person.role;
  const held = (spec.unconfirmed || []).find(p => p.name === name);
  return held ? held.role : '';
}
function eventStaffingCard833() {
  if (!DATA.event_staffing833) return '';
  const m = eventStaffingModel833(), h = n => esc(String(n)), cash = n => n == null ? 'Unpriced' : esc(money(n));
  const roster = m.rows.map(r => `<tr><td>${esc(r.name)}<br><span class="w">${esc(r.role)}</span></td><td>${h(r.paidHours)} h${!r.complete ? '<br><span class="w">Running sheet differs — review</span>' : ''}${r.unresolvedShifts ? `<br><span class="w">${h(r.unresolvedShifts)} shifts unresolved</span>` : ''}</td><td>${cash(r.knownCost)}${r.unpricedHours ? `<br><span class="w">${h(r.unpricedHours)} h unpriced</span>` : ''}${!r.forecastOnly ? '<br><span class="w">Check current Finance status</span>' : ''}</td></tr>`).join('');
  const uncertain = m.unconfirmed.map(r => `<li>${esc(r.name)} — ${esc(r.role)}; existing ${h(r.paidHours)} paid hours retained separately, confirmation outstanding.</li>`).join('');
  const placeholders = m.placeholders.map(p => `<li>${h(p.people)} × ${esc(p.role)} — names, shift times and Direct costs unconfirmed.</li>`).join('');
  const fence = m.fenceScope ? ` This includes the fence team allowance of ${h(m.fenceScope.hours)} person-hours (${cash(m.fenceScope.amount)}).` : '';
  const body = `<div class="card"><p>${h(m.expectedPeople)} confirmed daytime assignments · ${esc(m.dates.map(fmtDate).join(', '))} · ${esc(m.start)}–${esc(m.finish)} AEST · ${h(m.paidHoursPerDay)} paid hours each day. Planned shifts; Finance still controls confirmation of work and actual costs.</p>
    <div class="tblwrap"><table class="progtbl"><thead><tr><th>Person / operational role</th><th>Planned paid hours</th><th>Known wage forecast · ex GST</th></tr></thead><tbody>${roster}</tbody></table></div>
    <p><b>${h(m.paidHours)} planned paid hours</b> of ${h(m.expectedHours)} expected · ${cash(m.knownCost)} known wages · ${h(m.unpricedHours)} hours without a calculated pay cost${m.unresolvedShifts ? ` · ${h(m.unresolvedShifts)} planned shifts unresolved` : ''}. These running-sheet forecasts are counted once.</p>
    ${!m.complete ? '<p class="norate">A planned row is missing or the running sheet has changed. The current record takes precedence; reconcile it before relying on the full roster.</p>' : ''}
    <ul>${uncertain}${placeholders}${m.additional.length ? `<li>${h(m.additional.length)} other event shift records remain outside this confirmed roster; review them in the running sheet.</li>` : ''}</ul>
    <p>Customer event Revenue is already in the event labour scope: ${cash(m.scopeTotal)} including accommodation and travel.${fence} Operational job titles and paid hours do not add another hourly charge. Confirm any additional commercial scope separately.</p>
    <p>Advanced event crew cost remains unpriced until its hours and supplier terms are confirmed. Existing installation dockets remain counted in their own dates; their rate is not an agreed event-weekend crew rate.</p>
    <ul>${m.duties.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
    <p class="sub">Edit people, pay rates and shifts in the existing running sheet. An unknown wage or supplier price is not a zero cost.</p></div>`;
  return cj765Fold('event833', 'Event crew — planned cover and wage gaps', `${m.expectedPeople} daytime assignments · ${m.paidHours} paid hours projected · ${m.unpricedHours} hours unpriced${m.unresolvedShifts ? ' · ' + m.unresolvedShifts + ' shifts unresolved' : ''}`, body);
}
if (typeof module !== 'undefined' && module.exports) module.exports = {eventStaffing833};
