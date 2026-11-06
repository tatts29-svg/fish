/* Author: Andrew Fisher. v8.42: visible quantities and honestly scoped progress.
 * A conflicting Complete tick contributes no confirmed units. Delivery dates are
 * not installation deadlines. Work types, metres and gates remain independent.
 * All source records and native financial calculations are read-only.
 */
function todayWorkSummary842(asOf, suppliedAreas, suppliedGroups, suppliedFencing) {
  const day = asOf || (/^\d{4}-\d{2}-\d{2}$/.test(typeof state !== 'undefined' && state.asOf || '') ? state.asOf : todayIso());
  const areas = suppliedAreas || todayWorkMetrics840(day);
  const fencing = suppliedFencing || todayFencingSummary841(day);
  const health = areas.health || todayWorkHealth840();
  const number = n => typeof n === 'number' && Number.isFinite(n);
  const isoDay = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const round = n => Math.round(n * 100) / 100;
  const lowerPct = (n, total) => Math.floor(n / total * 10000) / 100;
  const word = (n, single, plural) => n + ' ' + (n === 1 ? single : plural);
  const result = {asOf: day, health, byId: {}, fencingRows: []};
  const nativeRows = health.ready ? new Map(dsnState(day).rows.map(r => [r.a.key, r])) : new Map();
  const noPlan = (unit, basis, label) => ({status: 'unknown', provisional: false, label, delta: null, planned: null, actual: null,
    actualLabel: unit === 'references' ? 'Due references on site' : 'Build work recorded', unit, basis,
    behind: null, early: null, overdueRefs: [], earlyRefs: [], undatedRefs: [], unrecordedRefs: [], rentalOnlyRefs: [], issues: []});
  const onsiteBasis = 'On-site plan · references. Current scheduled arrival dates are compared with an explicit on-site record or Complete tick by the selected day. Rental-only on-hire is not arrival proof. This is not an installation deadline.';
  const onsitePlan = area => {
    const plan = noPlan('references', onsiteBasis, 'On-site plan unavailable');
    if (!health.ready) { plan.issues.push(health.basis); return plan; }
    let due = 0, dueOnSite = 0, dated = 0, missing = 0;
    for (const row of area.rows || []) {
      const native = nativeRows.get(row.key);
      if (!native) { missing++; plan.undatedRefs.push(row.key); continue; }
      const date = native.st && native.st.in;
      const d = native.d || {};
      const onSite = !!d.done || !!(d.recorded && d.state === 'on site' && d.where !== 'rental');
      if (d.recorded && d.state === 'on site' && d.where === 'rental' && !d.done) plan.rentalOnlyRefs.push(row.key);
      if (!isoDay(date)) { plan.undatedRefs.push(row.key); continue; }
      dated++;
      if (date <= day) {
        due++;
        if (onSite) dueOnSite++;
        else { plan.overdueRefs.push(row.key); if (!d.recorded) plan.unrecordedRefs.push(row.key); }
      } else if (onSite) plan.earlyRefs.push(row.key);
    }
    plan.planned = due; plan.actual = dueOnSite;
    plan.behind = plan.overdueRefs.length; plan.early = plan.earlyRefs.length;
    // A missing due arrival is not offset by a different reference arriving early.
    plan.delta = plan.behind ? -plan.behind : plan.early;
    if (plan.behind) { plan.status = 'behind'; plan.label = word(plan.behind, 'reference', 'references') + ' behind on-site plan'; }
    else if (plan.undatedRefs.length || !dated) {
      plan.status = 'unknown'; plan.label = dated ? 'Dated references on plan · dates missing' : 'On-site dates unconfirmed';
    } else if (plan.early) { plan.status = 'ahead'; plan.label = word(plan.early, 'reference', 'references') + ' ahead of on-site plan'; }
    else { plan.status = 'on-plan'; plan.label = due ? 'On-site plan met for references due' : 'No references due on site yet'; }
    if (plan.undatedRefs.length) plan.issues.push(word(plan.undatedRefs.length, 'reference has', 'references have') + ' no usable scheduled arrival date; the dated comparison is partial.');
    if (missing) plan.issues.push(word(missing, 'reference is', 'references are') + ' absent from the native status reading.');
    if (plan.rentalOnlyRefs.length) plan.issues.push(word(plan.rentalOnlyRefs.length, 'reference is', 'references are') + ' on hire without explicit arrival evidence.');
    if (day < todayIso()) plan.issues.push('Arrival history is replayed; rescheduled dates and supplied quantities retain their current values.');
    return plan;
  };
  for (const area of areas) {
    const rows = area.rows || [];
    const conflicts = area.id === 'fencing' ? [] : rows.filter(r => r.recordedComplete && !r.complete);
    const total = health.ready && number(area.total) ? area.total : null;
    const done = health.ready && number(area.done) ? area.done : null;
    const reviewKnown = conflicts.every(r => number(r.quantity));
    const reviewQuantity = health.ready && reviewKnown ? round(conflicts.reduce((n, r) => n + r.quantity, 0)) : null;
    const lowerBound = conflicts.length > 0 || (area.shortConflictRefs || 0) > 0;
    const pct = area.id !== 'fencing' && total > 0 && done != null ? lowerBound ? lowerPct(done, total) : round(done / total * 100) : null;
    result.byId[area.id] = {id: area.id, name: area.name, scope: area.scope, unit: area.unit,
      total: area.id === 'fencing' ? null : total, done: area.id === 'fencing' ? null : done,
      left: area.id !== 'fencing' && total != null && done != null ? round(Math.max(0, total - done)) : null,
      pct, pctKind: pct == null ? 'unknown' : lowerBound ? 'lower-bound' : 'confirmed',
      pctLabel: lowerBound ? 'At least confirmed complete' : 'Confirmed complete',
      reviewQuantity, reviewRefs: conflicts.map(r => r.key), unquantifiedRefs: area.unknownQuantityRefs || 0,
      knownTotal: health.ready && number(area.knownTotal) ? area.knownTotal : null,
      basis: 'Confirmed complete uses the existing conflict-free Complete ticks. Not confirmed includes outstanding work and any quantity requiring review; it does not infer partial installation.',
      issues: (area.issues || []).slice(), health, loading: health.loading,
      plan: area.id === 'fencing' ? null : onsitePlan(area)};
  }
  const weeks = typeof DATA !== 'undefined' ? (DATA.weeks || []).filter(w => w.phase === 'Build') : [];
  const columns = typeof FCOL !== 'undefined' ? FCOL : [];
  const planBasis = 'Build programme · work by type. Dated, usable on-programme work is compared only with the same type’s dated Build plan by the selected day. Demob and off-programme work are excluded.';
  const buildPlan = row => {
    const plan = noPlan(row.unit, planBasis, 'Dated Build plan unconfirmed');
    plan.actual = number(row.recorded) ? row.recorded : null;
    if (!health.ready) { plan.issues.push(health.basis); return plan; }
    const matches = columns.filter(c => c.key === row.id && c.programme_type && c.unit === row.unit);
    if (matches.length !== 1 || !weeks.length) { plan.issues.push('A unique programme column and Build-week scope are required.'); return plan; }
    const column = matches[0], seen = new Set();
    let planned = 0;
    const warnings = [];
    for (const week of weeks) {
      if (!isoDay(week.start)) { plan.issues.push('A Build week has no usable start date.'); continue; }
      if (week.start > day) continue;
      const sheet = progSheetOf(week.sheet);
      if (!sheet || !sheet.sheet || !sheet.rolled_forward || seen.has(sheet.sheet) || !Array.isArray(sheet.days) || !sheet.days.length) {
        plan.issues.push('A started Build week has no unique rolled-forward daily programme.'); continue;
      }
      seen.add(sheet.sheet);
      const full = (sheet.totals || {})[column.programme_type];
      const dates = new Set();
      let dailyTotal = 0, valid = number(full) && full >= 0;
      for (const entry of sheet.days) {
        const value = (entry.totals || {})[column.programme_type];
        const dateOK = isoDay(entry.date) && !dates.has(entry.date);
        dates.add(entry.date);
        // Sparse zero cells are accepted only when the daily sum reconciles to the full type total.
        if (!dateOK || value != null && (!number(value) || value < 0 || row.unit === 'each' && !Number.isInteger(value))) valid = false;
        else dailyTotal += value == null ? 0 : value;
        if (dateOK && number(value) && value > 0 && entry.date <= day) {
          if (entry.date < week.start || isoDay(week.end) && entry.date > week.end) warnings.push('A source-authored programme date falls outside its mapped week; the explicit date is retained, not shifted.');
          if (/source\s+conflicts?\s+awaiting\s+confirmation/i.test(String(entry.basis || ''))) {
            plan.provisional = true;
            warnings.push('This type includes a dated source quantity marked source conflicts awaiting confirmation; its pace comparison is provisional.');
          }
        }
      }
      if (!valid || Math.abs(dailyTotal - full) > 0.005) {
        plan.issues.push('A started Build sheet has invalid dates, quantities or incomplete daily coverage for this type.'); continue;
      }
      const value = plannedToDay(sheet, day, column.programme_type);
      if (!number(value) || value < 0 || row.unit === 'each' && !Number.isInteger(value)) plan.issues.push('The dated Build quantity for this type is unavailable.');
      else planned += value;
    }
    const invalid = plan.issues.length > 0;
    plan.issues.push(...new Set(warnings));
    if (invalid || plan.actual == null) return plan;
    plan.planned = round(planned); plan.delta = round(plan.actual - plan.planned);
    plan.behind = Math.max(0, -plan.delta); plan.early = Math.max(0, plan.delta);
    plan.status = plan.delta < 0 ? 'behind' : plan.delta > 0 ? 'ahead' : 'on-plan';
    plan.label = plan.delta ? Math.abs(plan.delta) + ' ' + row.unit + (plan.delta < 0 ? ' behind' : ' ahead of') + ' Build plan'
      : plan.planned ? 'On Build plan for this type' : 'No Build work planned by this day';
    if (plan.provisional) plan.label = 'Provisional: ' + (plan.delta
      ? Math.abs(plan.delta) + ' ' + row.unit + (plan.delta < 0 ? ' behind' : ' ahead of') + ' current dated Build plan'
      : 'matches current dated Build plan');
    return plan;
  };
  result.fencingRows = (fencing.summaryRows || []).map(row => {
    const plan = buildPlan(row);
    const total = health.ready && number(row.planned) ? row.planned : null;
    const done = health.ready && number(row.recorded) ? row.recorded : null;
    const pct = total > 0 && done != null ? round(done / total * 100) : null;
    const label = row.id === 'labour' ? 'Docket labour column' : row.label;
    const extra = row.id === 'labour' ? ['This docket column excludes green-book crew hours; it is not total crew labour.'] : [];
    return {...row, label, total, done, left: total == null || done == null ? null : round(Math.max(0, total - done)),
      pct, pctKind: pct == null ? 'unknown' : 'recorded-work', pctLabel: 'Build work recorded',
      plannedByDay: plan.planned, plan, issues: [...(row.issues || []), ...plan.issues, ...extra]};
  });
  if (result.byId.fencing) {
    result.byId.fencing.rows = result.fencingRows;
    result.byId.fencing.basis = 'Every Build work type retains its own programme quantity and unit. Recorded work is not unique standing fence length; no combined fencing percentage is calculated.';
  }
  return result;
}
