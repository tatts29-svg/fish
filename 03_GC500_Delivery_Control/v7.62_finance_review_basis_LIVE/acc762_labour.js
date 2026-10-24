/* Author: Andrew Fisher.
 * v7.62 — read-only labour forecast and workforce review.
 * Known amounts are subtotals when `complete` is false; missing figures are never free work.
 */
function acc761Labour(){
 const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
 const amount = n => typeof n === 'number' && Number.isFinite(n) ? n : null;
 const states = ['charged', 'expected', 'tocome', 'later'];
 const G = {install: 'install', steps: 'install', levelling: 'install', demob: 'install', cleaning: 'cleaning', fire_ext: 'fire_ext'};
 const mk = () => ({charged: 0, expected: 0, tocome: 0, later: 0, n: 0, unpriced: 0,
  unpricedByState: {charged: 0, expected: 0, tocome: 0, later: 0}});
 const groups = {install: mk(), cleaning: mk(), fire_ext: mk(), other: mk()}, demob = mk();
 const LP = labourPlan(), TK = pl760Ticks();
 const addSlot = (g, sl, st) => { g.n++; const v = amount(sl.value);
  if (v === null) { g.unpriced++; g.unpricedByState[st]++; } else g[st] += v; };
 (LP.slots || []).forEach(sl => {
  const st = states.includes(sl.state) ? sl.state : 'tocome';
  // Recorded ticks come from the same source as the P&L, including moved units.
  if (st !== 'charged') addSlot(groups[G[sl.key] || 'other'], sl, st);
  if (sl.key === 'demob') addSlot(demob, sl, st);
 });
 Object.keys(groups).forEach(key => { const g = groups[key], t = TK[key] || {};
  g.charged = amount(t.amount) === null ? 0 : t.amount;
  g.n += Number(t.ticks) || 0;
  g.unpricedByState.charged = Number(t.unknown) || 0;
  g.unpriced += g.unpricedByState.charged;
 });
 const per = mk();
 Object.values(groups).forEach(g => {
  states.forEach(st => { per[st] += g[st]; per.unpricedByState[st] += g.unpricedByState[st]; });
  per.n += g.n; per.unpriced += g.unpriced;
 });
 const finish = g => { states.forEach(st => { g[st] = r2(g[st]); });
  g.total = r2(states.reduce((sum, st) => sum + g[st], 0)); g.complete = g.unpriced === 0; };
 Object.values(groups).forEach(finish); finish(demob); finish(per);
 // The older slot model cannot identify which moved tick was demob. Keep this detail
 // explicitly partial if there are extra recorded ticks; the Install total above is complete.
 const slotCharged = r2((LP.slots || []).filter(sl => sl.state === 'charged').reduce((sum, sl) => sum + (amount(sl.value) || 0), 0));
 const movedCharged = r2(per.charged - slotCharged);
 demob.movedSplitUnknown = Math.abs(movedCharged) >= 0.01;
 if (demob.movedSplitUnknown) demob.complete = false;
 const race = (moneySummary().charge || {}).race || null;
 const scope = race ? amount(race.amount) : null;
 const scopePeople = race ? amount(race.people_amount) !== null ? race.people_amount : race.scope === false ? scope : null : null;
 const scopeSupport = race ? amount(race.at) !== null ? race.at : race.scope === false ? 0 : null : null;
 const scopeSplitComplete = scope !== null && scopePeople !== null && scopeSupport !== null && Math.abs(scope - scopePeople - scopeSupport) < 0.011;
 const labourOnlyTotal = r2(groups.install.total + (scopePeople || 0));
 const packageTotal = r2(per.total + (scope || 0));

 const workforce = () => ({cna: 0, salary: 0, hire: 0, unknownTypeHours: 0, hours: 0, grossHours: 0,
  cost: 0, unpriced: 0, unpricedCount: 0, shifts: 0, future: 0, confirmed: 0, pending: 0,
  confirmedHours: 0, pendingHours: 0, forecastHours: 0,
  confirmedPaidHours: 0, pendingPaidHours: 0, forecastPaidHours: 0,
  confirmedCost: 0, pendingCost: 0, forecastCost: 0, actualCost: 0, actualCostCount: 0,
  calculatedCostCount: 0, costsByType: {cna: 0, salary: 0, hire: 0, unknown: 0},
  unpricedByType: {cna: 0, salary: 0, hire: 0, unknown: 0}, hoursUnknown: 0});
 const rows = fin745Rows(todayIso()), months = {}, all = workforce(), peopleByKey = new Map();
 // fin745Rows exposes an actual cost only for a current, valid confirmation.
 // Retain that rule here as well if this helper receives a stale or amended row.
 const actualOf = row => row.status === 'confirmed' ? amount(row.actualCost) : null;
 const addWork = (target, row) => {
  const type = ['cna', 'salary', 'hire'].includes(row.type) ? row.type : 'unknown';
  const paid = amount(row.paid), gross = amount(row.worked);
  const actual = actualOf(row), cost = actual !== null ? actual : amount(row.calculatedCost);
  const status = row.status === 'confirmed' ? 'confirmed' : row.status === 'forecast' ? 'forecast' : 'pending';
  target.shifts++; target[status === 'forecast' ? 'future' : status]++;
  target.hours += paid || 0; target.grossHours += gross || 0;
  target[type === 'unknown' ? 'unknownTypeHours' : type] += paid || 0;
  target[status + 'Hours'] += gross || 0; target[status + 'PaidHours'] += paid || 0;
  if (paid === null || gross === null) target.hoursUnknown++;
  if (cost === null) { target.unpriced += paid || 0; target.unpricedCount++; target.unpricedByType[type] += paid || 0; }
  else { target.cost += cost; target[status + 'Cost'] += cost; target.costsByType[type] += cost;
   if (actual !== null) { target.actualCost += actual; target.actualCostCount++; }
   else target.calculatedCostCount++;
  }
 };
 rows.forEach(row => {
  const month = row.month || String(row.date || '').slice(0, 7);
  if (!months[month]) months[month] = workforce();
  const key = JSON.stringify([month, row.person, row.type]);
  if (!peopleByKey.has(key)) peopleByKey.set(key, Object.assign(workforce(), {month, person: row.person, type: row.type || 'unknown', dates: [], dayCount: 0}));
  const person = peopleByKey.get(key);
  if (row.date && !person.dates.includes(row.date)) person.dates.push(row.date);
  [months[month], all, person].forEach(target => addWork(target, row));
 });
 const finishWork = target => {
  Object.keys(target).forEach(key => { if (typeof target[key] === 'number') target[key] = r2(target[key]); });
  ['costsByType', 'unpricedByType'].forEach(key => Object.keys(target[key]).forEach(type => { target[key][type] = r2(target[key][type]); }));
  target.internalCost = r2(target.costsByType.cna + target.costsByType.salary);
  target.hireCost = target.costsByType.hire;
  target.complete = !target.unpricedCount && !target.hoursUnknown;
  if (target.dates) { target.dates.sort(); target.dayCount = target.dates.length; }
 };
 const people = [...peopleByKey.values()].sort((a, b) => a.month.localeCompare(b.month) || a.person.localeCompare(b.person) || a.type.localeCompare(b.type));
 [...Object.values(months), all, ...people].forEach(finishWork);
 const eventDays = typeof EVENT_DAYS !== 'undefined' ? EVENT_DAYS : [];
 const raceRows = rows.filter(row => eventDays.includes(row.date));
 return {groups, demob, per, scope, scopePeople, scopeSupport, scopeSplitComplete,
  scopeHours: race && race.hours, labourOnlyTotal, packageTotal,
  labourOnlyComplete: groups.install.complete && scopeSplitComplete,
  packageComplete: per.complete && scope !== null, movedCharged,
  months, all, people,
  raceHours: r2(raceRows.reduce((sum, row) => sum + (amount(row.paid) || 0), 0)),
  raceGrossHours: r2(raceRows.reduce((sum, row) => sum + (amount(row.worked) || 0), 0)),
  unpricedPeople: [...new Set(rows.filter(row => actualOf(row) === null && amount(row.calculatedCost) === null).map(row => row.person))].sort()};
}
