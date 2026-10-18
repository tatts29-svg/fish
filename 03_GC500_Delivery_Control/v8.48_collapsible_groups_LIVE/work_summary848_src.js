/* Author: Andrew Fisher. Read-only installation-programme adapter.
 * Equipment keeps the native v8.42 reading. Fencing compares Build + Event work,
 * with classification and source uncertainty carried through to its display.
 */
function todayWorkSummary848(asOf, suppliedAreas, suppliedGroups, suppliedFencing) {
  const day = asOf || (/^\d{4}-\d{2}-\d{2}$/.test(typeof state !== 'undefined' && state.asOf || '') ? state.asOf : todayIso());
  const areas = suppliedAreas || todayWorkMetrics840(day);
  const fencing = suppliedFencing || todayFencingSummary848(day);
  const health = areas.health || todayWorkHealth840();
  const result = todayWorkSummary842(day, areas, suppliedGroups, {summaryRows:[]});
  const number = n => typeof n === 'number' && Number.isFinite(n);
  const round = n => Math.round(n * 100) / 100;
  const isoDay = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
  };
  const noPlan = (unit, basis, label) => ({status:'unknown', provisional:false, provisionalReason:null,
    classificationPending:false, label, delta:null, planned:null, actual:null, actualLabel:'Installation work recorded',
    unit, basis, behind:null, early:null, overdueRefs:[], earlyRefs:[], undatedRefs:[], unrecordedRefs:[], rentalOnlyRefs:[], issues:[]});
  const weeks = fenceInstallationWeeks847();
  const columns = typeof FCOL !== 'undefined' ? FCOL : [];
  const planBasis = 'Installation programme · Build + Event. Dated, usable programme and compound installation work is compared only with the same type’s dated installation plan by the selected day. Demob, yard work and undated quantities are excluded from dated Done. Classification must be confirmed before a definite CCB subtype pace is shown.';
  const buildPlan = row => {
    const plan = noPlan(row.unit, planBasis, 'Dated installation plan unconfirmed');
    plan.actual = row.evidencePending ? null : number(row.knownPlanRecorded) ? row.knownPlanRecorded : number(row.recorded) ? row.recorded : null;
    if (row.unquantifiedPlan || row.asBuiltAllowance) {
      plan.provisional = true; plan.provisionalReason = 'source-scope';
      plan.actualLabel = 'Work recorded against the quantified plan';
      plan.basis += ' The dated comparison excludes work whose original source planned quantity was TBC; that work remains in Done and the reconciled installation scope.';
    }
    if (row.classificationPending) {
      plan.classificationPending = true; plan.provisional = true; plan.provisionalReason = 'classification';
      plan.label = 'CCB classification needs review'; plan.actualLabel = 'Current recorded allocation';
    }
    if (!health.ready) { plan.issues.push(health.basis); return plan; }
    const matches = columns.filter(c => c.key === row.id && c.programme_type && c.unit === row.unit);
    if (matches.length !== 1 || !weeks.length) { plan.issues.push('A unique programme column and installation-week scope are required.'); return plan; }
    const column = matches[0], seen = new Set();
    let planned = 0;
    const warnings = [];
    for (const week of weeks) {
      if (!isoDay(week.start)) { plan.issues.push('An installation week has no usable start date.'); continue; }
      if (week.start > day) continue;
      const sheet = progSheetOf(week.sheet);
      if (!sheet || !sheet.sheet || !sheet.rolled_forward || seen.has(sheet.sheet) || !Array.isArray(sheet.days) || !sheet.days.length) {
        plan.issues.push('A started installation week has no unique rolled-forward daily programme.'); continue;
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
            plan.provisional = true; plan.provisionalReason = 'source-dates';
            warnings.push('This type includes a dated source quantity marked source conflicts awaiting confirmation; its pace comparison is provisional.');
          }
        }
      }
      if (!valid || Math.abs(dailyTotal - full) > 0.005) {
        plan.issues.push('A started installation sheet has invalid dates, quantities or incomplete daily coverage for this type.'); continue;
      }
      const value = plannedToDay(sheet, day, column.programme_type);
      if (!number(value) || value < 0 || row.unit === 'each' && !Number.isInteger(value)) plan.issues.push('The dated installation quantity for this type is unavailable.');
      else planned += value;
    }
    const invalid = plan.issues.length > 0;
    plan.issues.push(...new Set(warnings));
    if (invalid || plan.actual == null) return plan;
    plan.planned = round(planned);
    if (row.classificationPending) {
      plan.status = 'unknown'; plan.classificationPending = true; plan.provisional = true; plan.provisionalReason = 'classification';
      plan.label = 'CCB classification needs review'; plan.actualLabel = 'Current recorded allocation';
      plan.issues.push('Pending CCB allocations may belong to either subtype; current recorded quantities do not establish ahead, behind or completion.');
      return plan;
    }
    plan.delta = round(plan.actual - plan.planned);
    plan.behind = Math.max(0, -plan.delta); plan.early = Math.max(0, plan.delta);
    plan.status = plan.delta < 0 ? 'behind' : plan.delta > 0 ? 'ahead' : 'on-plan';
    plan.label = plan.delta ? Math.abs(plan.delta) + ' ' + row.unit + (plan.delta < 0 ? ' behind' : ' ahead of') + ' installation plan'
      : plan.planned ? 'On installation plan for this type' : 'No installation work planned by this day';
    if (plan.provisional) plan.label = 'Provisional: ' + (plan.delta
      ? Math.abs(plan.delta) + ' ' + row.unit + (plan.delta < 0 ? ' behind' : ' ahead of') + ' current dated installation plan'
      : 'matches current dated installation plan');
    return plan;
  };
  result.fencingRows = (fencing.summaryRows || []).map(row => {
    const plan = buildPlan(row);
    const total = health.ready && number(row.planned) ? row.planned : null;
    const done = health.ready && number(row.recorded) ? row.recorded : null;
    const pct = !row.classificationPending && total > 0 && done != null ? round(done / total * 100) : null;
    const label = row.id === 'labour' ? 'Docket labour column' : row.label;
    const extra = row.id === 'labour' ? ['This docket column excludes green-book crew hours; it is not total crew labour.'] : [];
    return {...row, label, total, done, left: row.classificationPending || total == null || done == null ? null : round(Math.max(0, total - done)),
      pct, doneRange:row.recordedRange || null, leftRange:row.leftRange || null, pctRange:row.pctRange || null, pctKind: row.pctRange ? 'bounded-work' : pct == null ? 'unknown' : row.sourceProvisional ? 'provisional-work' : 'recorded-work', pctLabel: row.sourceProvisional ? 'Recorded against provisional installation plan' : 'Installation work recorded',
      plannedByDay: plan.planned, plan, issues: [...(row.issues || []), ...plan.issues, ...extra]};
  });
  if (result.byId.fencing) {
    result.byId.fencing.rows = result.fencingRows;
    result.byId.fencing.basis = 'Each type keeps its own Build + Event unit. Dated programme and compound work plus reviewed green/blue movement evidence are counted once. Ranges preserve unsettled categories and minimums preserve unquantified scope. Recorded work is not unique standing fence length; no combined fencing percentage is calculated.';
  }
  return result;
}
