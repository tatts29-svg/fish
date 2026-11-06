/* Author: Andrew Fisher. v8.41 read-only fencing work by type.
 * Keep metres, gates and recorded hours separate. Scrim, relocation and removal
 * are work, not additional unique fence length. No financial or record mutation.
 */
function todayFencingSummary841(asOf) {
  const day = asOf || todayIso();
  const health = typeof todayWorkHealth840 === 'function' ? todayWorkHealth840()
    : {ready: false, loading: true, stale: false, basis: 'Waiting for shared progress records'};
  const number = value => value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  const round = value => Math.round(value * 100) / 100;
  const definitions = [
    {id: 'clean', label: 'Clean fence', unit: 'm', kind: 'fence', note: 'Recorded work, not unique physical fence length.'},
    {id: 'scrim', label: 'Braced for scrim', unit: 'm', kind: 'fence', note: 'May include bracing added to fence already standing.'},
    {id: 'v_gates', label: 'Vehicle gates', unit: 'each', kind: 'gates', note: 'Gates are counted separately from fence metres.'},
    {id: 'ped_gates', label: 'Pedestrian gates', unit: 'each', kind: 'gates', note: 'Gates are counted separately from fence metres.'},
    {id: 'ccb_event', label: 'Crowd control · event', unit: 'm', kind: 'barriers', note: 'Crowd-control barrier work in metres.'},
    {id: 'ccb_demarc', label: 'Crowd control · demarcation', unit: 'm', kind: 'barriers', note: 'Crowd-control barrier work in metres.'},
    {id: 'relocation', label: 'Relocations', unit: 'm', kind: 'movement', note: 'Moving existing fence is not additional installed length.'},
    {id: 'removal', label: 'Removals during build', unit: 'm', kind: 'movement', note: 'Build-phase removal work only; Demob is excluded.'}
  ];
  const empty = def => ({...def, recorded: null, planned: null, remaining: null,
    pct: null, offProgramme: null, recordCount: 0, issues: [], loading: health.loading,
    missing: !health.ready, scope: 'Build programme', comparison: 'Recorded work / full Build plan'});
  const result = {summaryRows: definitions.map(empty), health, loading: health.loading,
    asOf: day, issues: [], basis: 'Each line compares dated, usable work recorded in the Build programme with its own full Build plan. Different types and units are never added together.'};
  if (!health.ready) { result.basis = health.basis; return result; }
  const columns = typeof FCOL !== 'undefined' ? FCOL : [];
  const weeks = DATA.weeks || [];
  const build = weeks.filter(w => w.phase === 'Build');
  const buildNames = new Set(build.map(w => w.sheet));
  const plans = build.map(week => ({week, plan: typeof progSheetOf === 'function' ? progSheetOf(week.sheet) : null}));
  const dockets = allDockets();
  const classified = dockets.map(d => {
    if (!d.date || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return {d, state: 'undated'};
    if (d.date > day) return {d, state: 'future'};
    if (!d.usable) return {d, state: 'unusable'};
    const datedWeek = weeks.find(w => w.start && w.end && w.start <= d.date && w.end >= d.date);
    if (datedWeek && datedWeek.phase !== 'Build') return {d, state: 'outside-build'};
    if (!buildNames.has(d.week) || (datedWeek && datedWeek.sheet !== d.week)) return {d, state: 'unplaced'};
    return {d, state: (d.scope || 'programme') === 'programme' ? 'included' : 'off-programme'};
  });
  const fill = (row, column, programme) => {
    let total = 0, planKnown = programme && build.length > 0;
    if (programme) {
      const seen = new Set();
      for (const {plan} of plans) {
        const n = plan ? number((plan.totals || {})[column.programme_type]) : null;
        if (!plan || !(plan.year === 2026 || plan.rolled_forward) || !plan.sheet ||
            seen.has(plan.sheet) || n == null || n < 0 || (row.unit === 'each' && !Number.isInteger(n))) {
          planKnown = false; continue;
        }
        seen.add(plan.sheet); total += n;
      }
    }
    let recorded = 0, offProgramme = 0, undated = 0, unusable = 0, unplaced = 0;
    for (const {d, state} of classified) {
      const raw = (d.quantities || {})[column.key];
      if (raw == null || String(raw).trim() === '') continue;
      const n = number(raw);
      if (state === 'future' || state === 'outside-build') continue;
      if (n == null || n < 0 || (row.unit === 'each' && !Number.isInteger(n))) { unusable++; continue; }
      if (n === 0) continue;
      if (state === 'undated') { undated++; continue; }
      if (state === 'unusable') { unusable++; continue; }
      if (state === 'unplaced') { unplaced++; continue; }
      if (state === 'off-programme') { offProgramme += n; continue; }
      recorded += n; row.recordCount++;
    }
    row.recorded = round(recorded);
    row.offProgramme = round(offProgramme);
    row.planned = planKnown ? round(total) : null;
    row.remaining = row.planned == null ? null : round(Math.max(0, row.planned - recorded));
    row.pct = row.planned > 0 ? round(Math.min(100, recorded / row.planned * 100)) : null;
    row.missing = programme && !planKnown;
    if (programme && !planKnown) row.issues.push('Full Build plan unconfirmed; remaining quantity and percentage are unavailable.');
    if (undated) row.issues.push(undated + ' undated record(s) excluded.');
    if (unusable) row.issues.push(unusable + ' unusable quantity or record(s) excluded.');
    if (unplaced) row.issues.push(unplaced + ' record(s) without a matching Build week excluded.');
    if (offProgramme) row.issues.push(round(offProgramme) + ' ' + row.unit + ' outside the programme scope is excluded from the comparison.');
    if (planKnown && recorded > total) row.issues.push('Recorded work exceeds this Build plan; the excess is not treated as another work type.');
    return row;
  };
  result.summaryRows.forEach(row => {
    const matches = columns.filter(c => c.key === row.id);
    const column = matches.length === 1 ? matches[0] : null;
    if (!column || column.unit !== row.unit || !column.programme_type) {
      row.missing = true;
      row.issues.push('A unique programme column with the expected unit is unavailable.');
      return;
    }
    fill(row, column, true);
  });
  // These are useful recorded activities, but no source programme denominator exists.
  for (const def of [
    {id: 'fence_blocks', label: 'Fence blocks', unit: 'each', kind: 'recorded-only', note: 'Blocks recorded on usable Build dockets; no programme total is supplied.'},
    {id: 'labour', label: 'Labour recorded', unit: 'h', kind: 'recorded-only', note: 'Hours recorded in this docket column only; this is not a complete labour total.'}
  ]) {
    const matches = columns.filter(c => c.key === def.id);
    const column = matches.length === 1 ? matches[0] : null;
    if (!column || column.programme_type || (def.unit === 'h' ? column.unit !== 'hr' && column.unit !== 'h' : column.unit !== def.unit)) continue;
    const row = fill(empty(def), column, false);
    if (row.recorded > 0 || row.offProgramme > 0 || row.issues.length) {
      row.comparison = 'Recorded only · no programme total';
      result.summaryRows.push(row);
    }
  }
  if (health.stale) result.issues.push(health.basis + '.');
  result.issues.push('Clean fence, scrim and movements may concern the same fence. No combined fencing percentage or unique-length total is inferred.');
  return result;
}
