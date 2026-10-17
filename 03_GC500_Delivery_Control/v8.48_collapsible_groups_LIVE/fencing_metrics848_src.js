/* Author: Andrew Fisher. v8.48 installation work by type with classification certainty.
 * Keep metres, gates and recorded hours separate. Scrim, relocation and removal
 * are work, not additional unique fence length. No financial or record mutation.
 */
function fenceInstallationDocketState848(docket, asOf) {
  const d = docket || {}, day = asOf || todayIso();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') && Number.isFinite(Date.parse(d.date + 'T00:00:00Z')) && new Date(d.date + 'T00:00:00Z').toISOString().slice(0, 10) === d.date;
  if (!validDate) return 'undated';
  if (d.date > day) return 'future';
  if (!d.usable) return 'unusable';
  const weeks = typeof DATA === 'undefined' ? [] : DATA.weeks || [];
  const datedWeeks = weeks.filter(w => w.start && w.end && w.start <= d.date && w.end >= d.date);
  if (datedWeeks.length > 1) return 'unplaced';
  const datedWeek = datedWeeks[0];
  if (datedWeek && !['Build', 'Event'].includes(datedWeek.phase)) return 'outside-build';
  const mapped = fenceInstallationWeeks847().filter(w => w.sheet === d.week);
  if (mapped.length !== 1 || datedWeek && datedWeek.sheet !== d.week) return 'unplaced';
  return ['programme', 'compound'].includes(d.scope || 'programme') ? 'included' : 'off-programme';
}
function fenceProgressEvidence848(asOf, options) {
  const day = asOf || todayIso(), input = options || {}, own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  const catalogue = own(input, 'catalogue') ? input.catalogue : typeof FENCE_PROGRESS848 === 'undefined' ? null : FENCE_PROGRESS848;
  const records = own(input, 'records') ? input.records : typeof allDockets === 'function' ? allDockets() : [];
  const books = {red:records, green:own(input, 'serviceNotes') ? input.serviceNotes : typeof serviceNoteRows === 'function' ? serviceNoteRows() : [],
    blue:own(input, 'collections') ? input.collections : typeof collectionRows === 'function' ? collectionRows() : []};
  const fields = {red:['id','docket_no','date','week','scope','usable','quantities','components','location','note'],
    green:['id','note_no','date','week','usable','location','note','crew_note','labour_hours','metres'],
    blue:['id','collection_no','date','week','usable','location','note','collected','matches']};
  const numberKeys = {red:'docket_no',green:'note_no',blue:'collection_no'};
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
    : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}' : JSON.stringify(value);
  const snapshot = (record, keys) => Object.fromEntries(keys.map(k => [k, record[k] == null ? null : record[k]]));
  const result = {state:'ready', operations:[], planAllowances:[], issues:[], pending:[]};
  if (!catalogue || catalogue.schema !== 1 || !Array.isArray(catalogue.sources) || !Array.isArray(catalogue.operations) || !Array.isArray(catalogue.plan_allowances)) {
    result.state = 'unavailable'; result.issues.push('Reviewed physical-work evidence is unavailable.'); return result;
  }
  let files = own(input, 'files') ? input.files : null;
  if (!own(input, 'files') && typeof photoIndex === 'function') {
    try { const index = photoIndex(); files = index.state === 'ready' ? index.files : null; } catch (_) {}
  }
  const sourceCheck = item => {
    if (!Array.isArray(item.source_ids) || !item.source_ids.length || new Set(item.source_ids).size !== item.source_ids.length) return 'The reviewed source list is incomplete.';
    for (const id of item.source_ids) {
      const matches = catalogue.sources.filter(s => s && s.id === id), file = own(files, id) ? files[id] : null;
      if (matches.length !== 1 || !/^[a-f0-9]{64}$/.test(matches[0].sha256 || '')) return 'The reviewed source identity is incomplete or ambiguous.';
      if (!file || file.sha256 !== matches[0].sha256) return 'The reviewed source checksum is unavailable or has changed.';
    }
    return null;
  };
  const recordCheck = item => {
    if (!Array.isArray(item.records) || !item.records.length) return {error:'A reviewed physical operation has no source record.'};
    const selected = [], seen = new Set();
    for (const ref of item.records) {
      const keys = fields[ref.book], identity = ref.book + ':' + ref.record_id;
      if (!keys || seen.has(identity) || !ref.expected || canonical(Object.keys(ref.expected).sort()) !== canonical(keys.slice().sort())) return {error:'A reviewed record signature is incomplete or duplicated.'};
      seen.add(identity);
      const matches = (books[ref.book] || []).filter(r => String(r.id || '') === String(ref.record_id || '') || String(r[numberKeys[ref.book]] || '') === String(ref.number || ''));
      if (matches.length !== 1 || String(matches[0].id || '') !== String(ref.record_id || '') || String(matches[0][numberKeys[ref.book]] || '') !== String(ref.number || '') || canonical(snapshot(matches[0], keys)) !== canonical(ref.expected)) return {error:'A reviewed physical-work record is changed, missing or ambiguous.'};
      selected.push({book:ref.book, record:matches[0]});
    }
    return {selected};
  };
  const reject = (item, reason) => { result.state = 'review-needed'; result.pending.push({id:item.id, type:item.type, reason}); result.issues.push(reason); };
  const allItems = catalogue.operations.concat(catalogue.plan_allowances), seenPrimary = new Set();
  for (const item of allItems) {
    if (!item || !item.id || allItems.filter(other => other && other.id === item.id).length !== 1 || !['relocation','removal','reinstatement','clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc'].includes(item.type) || item.unit !== (['v_gates','ped_gates'].includes(item.type) ? 'each' : 'm') || typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.unit === 'each' && !Number.isInteger(item.quantity) || typeof item.basis !== 'string' || !item.basis.trim()) {
      reject(item || {}, 'A reviewed physical quantity has an invalid identity, unit or basis.'); continue;
    }
    const checked = recordCheck(item), sourceError = sourceCheck(item);
    if (checked.error || sourceError) { reject(item, checked.error || sourceError); continue; }
    const primary = checked.selected[0], record = primary.record;
    const signature = primary.book + ':' + record.id + ':' + item.type;
    if (seenPrimary.has(signature)) { reject(item, 'The same source operation would be counted twice.'); continue; }
    seenPrimary.add(signature);
    const isAllowance = catalogue.plan_allowances.includes(item);
    const state = fenceInstallationDocketState848({...record, usable:record.usable !== false, scope:record.scope || 'programme'}, isAllowance && record.date > day ? record.date : day);
    if (state === 'future' || state === 'outside-build') continue;
    if (state !== 'included') { reject(item, 'A reviewed physical operation lacks a usable installation date or week.'); continue; }
    if (catalogue.operations.includes(item)) {
      if (!['relocation','removal','reinstatement'].includes(item.type) || primary.book === 'red') { reject(item, 'Only separately reviewed movement records may add physical work.'); continue; }
      const expectedOverlap = item.red_overlap;
      const currentOverlap = records.filter(r => Number((r.quantities || {})[item.type]) > 0).map(r => snapshot(r, fields.red)).sort((a, b) => String(a.id).localeCompare(String(b.id)));
      if (!Array.isArray(expectedOverlap) || canonical(currentOverlap) !== canonical(expectedOverlap)) { reject(item, 'Movement overlap has changed since source review.'); continue; }
      const paperSources = (item.source_refs || []).filter(ref => item.source_ids.includes(ref.id) && Number.isInteger(ref.page) && ref.page > 0).map(ref => ({id:ref.id,page:ref.page}));
      result.operations.push({id:item.id, type:item.type, quantity:item.quantity, unit:item.unit, date:record.date, location:record.location || '', book:primary.book, recordId:String(record.id), number:String(record[numberKeys[primary.book]]), paperSourceIds:item.source_ids.slice(), paperSources, evidence:checked.selected.map(ref => ({book:ref.book, recordId:String(ref.record.id), number:String(ref.record[numberKeys[ref.book]]), basis:item.basis})), basis:item.basis});
    } else {
      const plan = typeof progSheetOf === 'function' ? progSheetOf(item.week) : null;
      const planSnapshot = plan ? snapshot(plan, ['sheet','totals']) : null;
      if (primary.book !== 'red' || Number((record.quantities || {})[item.type]) !== item.quantity || !item.expected_plan || canonical(planSnapshot) !== canonical(item.expected_plan) || !item.unquantified) { reject(item, 'An unquantified source-plan allowance has changed since review.'); continue; }
      let closedAsBuilt = false;
      if (item.closed_as_built === true && item.completion && item.completion.name === record.location) {
        const current = own(input, 'completions') ? (input.completions || {})[item.completion.name] : typeof fenceAreaDone === 'function' ? fenceAreaDone(item.completion.name) : null;
        closedAsBuilt = !!(current && current.done && current.by && current.at && canonical(current) === canonical(item.completion.expected));
        if (!closedAsBuilt) result.issues.push('The reviewed area closeout has changed or is unavailable; this source allowance is shown as a minimum.');
      }
      result.planAllowances.push({id:item.id, type:item.type, quantity:item.quantity, closedAsBuilt, recordedByDay:record.date <= day ? item.quantity : 0, unit:item.unit, date:record.date, recordId:String(record.id), number:String(record.docket_no), paperSourceIds:item.source_ids.slice(), basis:item.basis});
    }
  }
  // A duplicated primary invalidates both entries, rather than retaining the first.
  const duplicates = allItems.filter(item => item && item.records && item.records[0]).filter(item => allItems.filter(other => other && other.records && other.records[0] && other.type === item.type && other.records[0].book === item.records[0].book && other.records[0].record_id === item.records[0].record_id).length > 1);
  const duplicateIds = new Set(duplicates.map(item => item.id));
  result.operations = result.operations.filter(item => !duplicateIds.has(item.id)); result.planAllowances = result.planAllowances.filter(item => !duplicateIds.has(item.id));
  result.issues = [...new Set(result.issues)];
  return result;
}
function todayFencingSummary848(asOf) {
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
    {id: 'removal', label: 'Removed or stacked down', unit: 'm', kind: 'movement', note: 'Gross Build and Event removal or stack-down work; subsequent reinstatement is a separate activity. Demob is excluded.'}
  ];
  const empty = def => ({...def, recorded: null, planned: null, remaining: null,
    pct: null, offProgramme: null, recordCount: 0, issues: [], loading: health.loading,
    missing: !health.ready, scope: 'Installation programme · Build + Event', comparison: 'Recorded work / installation scope', confirmedRecorded: null, pendingRecorded: 0, totalRange:null, recordedRange: null, doneRange: null, leftRange: null, pctRange: null, undatedRecorded: null, compoundRecorded: 0, unquantifiedPlan:false, asBuiltAllowance:false, sourcePlannedTotal:null, knownPlanRecorded:null, unquantifiedRecorded:0, extraWorkRecorded:0, evidencePending:false, classificationPending: false, classificationPendingMetres: 0, sourceProvisional: false, sourceIssues: []});
  const result = {summaryRows: definitions.map(empty), health, loading: health.loading,
    asOf: day, issues: [], basis: 'Each line compares dated, usable programme and compound installation work recorded during Build and Event weeks with its own full installation plan. CCB subtype allocations remain unconfirmed while classification evidence is pending. Different types and units are never added together.'};
  if (!health.ready) { result.basis = health.basis; return result; }
  const columns = typeof FCOL !== 'undefined' ? FCOL : [];
  const weeks = DATA.weeks || [];
  const build = fenceInstallationWeeks847();
  const buildNames = new Set(build.map(w => w.sheet));
  const plans = build.map(week => ({week, plan: typeof progSheetOf === 'function' ? progSheetOf(week.sheet) : null}));
  const dockets = allDockets();
  const classified = dockets.map(d => ({d, state:fenceInstallationDocketState848(d, day)}));
  const evidence = fenceProgressEvidence848(day, {records:dockets});
  result.evidence = evidence;
  result.activities = evidence.operations.filter(operation => operation.type === 'reinstatement');
  result.issues.push(...evidence.issues);
  result.classification = fenceCcbSummary847(classified.filter(r => r.state === 'included').map(r => r.d), {records:dockets});
  result.scope = 'Installation programme · Build + Event';
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
        if ((plan.days || []).some(entry => number((entry.totals || {})[column.programme_type]) > 0 && /source\s+conflicts?\s+awaiting\s+confirmation/i.test(String(entry.basis || '')))) {
          row.sourceProvisional = true;
          row.sourceIssues.push(plan.sheet + ': the installation total includes a source quantity awaiting confirmation.');
        }
      }
    }
    let recorded = 0, offProgramme = 0, undated = 0, undatedRecorded = 0, compoundRecorded = 0, unusable = 0, unplaced = 0;
    for (const {d, state} of classified) {
      const raw = (d.quantities || {})[column.key];
      if (raw == null || String(raw).trim() === '') continue;
      const n = number(raw);
      if (state === 'future' || state === 'outside-build') continue;
      if (n == null || n < 0 || (row.unit === 'each' && !Number.isInteger(n))) { unusable++; continue; }
      if (n === 0) continue;
      if (state === 'undated') { undated++; undatedRecorded += n; continue; }
      if (state === 'unusable') { unusable++; continue; }
      if (state === 'unplaced') { unplaced++; continue; }
      if (state === 'off-programme') { offProgramme += n; continue; }
      recorded += n; row.recordCount++;
      if (d.scope === 'compound') compoundRecorded += n;
    }
    row.redRecorded = round(recorded);
    const operations = evidence.operations.filter(operation => operation.type === row.id);
    row.extraWorkRecorded = round(operations.reduce((sum, operation) => sum + operation.quantity, 0));
    recorded += row.extraWorkRecorded; row.recordCount += operations.length;
    row.recorded = round(recorded);
    row.undatedRecorded = round(undatedRecorded);
    row.compoundRecorded = round(compoundRecorded);
    row.offProgramme = round(offProgramme);
    row.planned = planKnown ? round(total) : null;
    row.remaining = row.planned == null ? null : round(Math.max(0, row.planned - recorded));
    row.pct = row.planned > 0 ? round(recorded / row.planned * 100) : null;
    row.missing = programme && !planKnown;
    row.sourcePlannedTotal = row.planned;
    row.knownPlanRecorded = row.recorded;
    const allowances = evidence.planAllowances.filter(allowance => allowance.type === row.id);
    if (allowances.length) {
      row.unquantifiedPlan = !allowances.every(allowance => allowance.closedAsBuilt); row.asBuiltAllowance = !row.unquantifiedPlan; row.sourceProvisional = true;
      row.unquantifiedRecorded = round(allowances.reduce((sum, allowance) => sum + allowance.recordedByDay, 0));
      row.knownPlanRecorded = round(recorded - row.unquantifiedRecorded);
      if (planKnown) {
        const minimumTotal = round(total + allowances.reduce((sum, allowance) => sum + allowance.quantity, 0));
        if (row.asBuiltAllowance) {
          row.planned = minimumTotal; row.remaining = round(Math.max(0, minimumTotal - recorded));
          row.pct = minimumTotal > 0 ? round(recorded / minimumTotal * 100) : null;
        } else {
          row.totalRange = {min:minimumTotal, max:null};
          row.leftRange = {min:round(Math.max(0, minimumTotal - recorded)), max:null};
          row.pctRange = minimumTotal > 0 ? {min:null, max:round(recorded / minimumTotal * 100)} : null;
        }
      }
      if (row.unquantifiedPlan) { row.planned = null; row.remaining = null; row.pct = null; }
      row.sourceIssues.push(row.asBuiltAllowance ? 'The original source TBC allowance is replaced in progress scope by the recorded as-built quantity for its signed-complete area. Original plan quantities are retained.' : 'The source plan leaves part of this scope unquantified. Its already recorded work is included once in the minimum total; the original numeric-plan balance is preserved.');
      row.sourceIssues.push(...allowances.map(allowance => allowance.basis));
    }
    if (['ccb_event','ccb_demarc'].includes(row.id)) {
      row.confirmedRecorded = result.classification.confirmedByType[row.id];
      row.pendingRecorded = result.classification.pendingByType[row.id];
      row.classificationPending = result.classification.pendingCount > 0;
      row.classificationPendingMetres = result.classification.pendingMetres;
      if (row.classificationPending) {
        row.pct = null; row.remaining = null;
        row.recordedRange = {min:round(row.confirmedRecorded), max:round(row.confirmedRecorded + result.classification.pendingMetres)};
        row.doneRange = {...row.recordedRange};
        if (row.planned != null) row.leftRange = {min:round(Math.max(0, row.planned - row.recordedRange.max)), max:round(Math.max(0, row.planned - row.recordedRange.min))};
        if (row.planned > 0) row.pctRange = {min:round(row.recordedRange.min / row.planned * 100), max:round(row.recordedRange.max / row.planned * 100)};
        row.issues.push('CCB classification is pending for ' + result.classification.pendingMetres + ' m across ' + result.classification.pendingCount + ' docket(s). Recorded retains the current column allocation; Done, Left and percentage use the confirmed quantity plus a shared pending-category range; the current allocation is preserved separately, without a definite subtype pace.');
      }
    }
    row.issues.push(...row.sourceIssues);
    if (programme && !planKnown) row.issues.push('Full installation plan unconfirmed; remaining quantity and percentage are unavailable.');
    if (undated) row.issues.push(undated + ' undated record(s), totalling ' + round(undatedRecorded) + ' ' + row.unit + ', are shown separately and not added to dated Done; overlap is not resolved.');
    if (unusable) row.issues.push(unusable + ' unusable quantity or record(s) excluded.');
    if (unplaced) row.issues.push(unplaced + ' record(s) without a matching Build or Event week excluded.');
    if (offProgramme) row.issues.push(round(offProgramme) + ' ' + row.unit + ' outside the programme scope is excluded from the comparison.');
    if (planKnown && recorded > total) row.issues.push('Recorded work exceeds this installation plan; the excess is not treated as another work type.');
    if (evidence.state === 'unavailable' || evidence.pending.some(pending => pending.type === row.id || !pending.type)) {
      row.evidencePending = true;
      row.recorded = null; row.planned = null; row.remaining = null; row.pct = null;
      row.totalRange = null; row.recordedRange = null; row.doneRange = null; row.leftRange = null; row.pctRange = null;
      row.issues.push('A required physical-work or source-plan review is unavailable or has changed; source quantities remain in details while comparison awaits review.');
    }
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
    {id: 'fence_blocks', label: 'Fence blocks', unit: 'each', kind: 'recorded-only', note: 'Blocks recorded on usable Build or Event dockets; no programme total is supplied.'},
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
