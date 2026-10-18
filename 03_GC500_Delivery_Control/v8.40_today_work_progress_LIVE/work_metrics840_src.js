/* Author: Andrew Fisher. v8.40 Today: read-only workstream progress.
 * Explicit completion ticks are distinct from rental/delivery status. No source
 * records, quantities, completion requirements or operational controls are changed.
 * Public source contains logic only; all figures are read from the existing page.
 */
function todayWorkHealth840() {
  const hosted = typeof DATA !== 'undefined' && DATA.edition === 'hosted';
  const sync = typeof SYNC !== 'undefined' ? SYNC : null;
  const required = ['delivery', 'supplied', 'added', 'items', 'qtys', 'aside',
    'moves', 'givenRefs', 'descs', 'rental', 'fenceDockets', 'deleted',
    'assetNumbers', 'accessories', 'units'];
  const ready = !hosted || !!(sync && sync.first && required.every(k => sync.first.has(k)));
  const status = sync ? sync.status : (hosted ? 'connecting' : 'file');
  const loading = !ready && status !== 'unreachable' && status !== 'revoked';
  const stale = ready && hosted && status !== 'live';
  return {ready, loading, stale, status, basis: !ready
    ? (loading ? 'Waiting for shared progress records' : 'Shared progress records unavailable')
    : stale ? 'Last received records · connection unavailable'
    : hosted ? 'Shared progress records' : 'Records in this copy'};
}

function todayWorkMetrics840(asOf) {
  const day = asOf || todayIso();
  const health = todayWorkHealth840();
  const round = n => Math.round(n * 100) / 100;
  const number = n => n == null || String(n).trim() === '' || !Number.isFinite(Number(n)) ? null : Number(n);
  const quantity = l => {
    const n = typeof qtyOf === 'function' ? qtyOf(l) : number(l && l.quantity);
    return n != null && n >= 0 && Number.isInteger(n) ? n : null;
  };
  const definitions = [
    {id: 'buildings', name: 'Buildings', group: 'Portable buildings', unit: 'buildings',
      scope: 'Portable buildings, ticket boxes and containers',
      accepts: /building|ticket\s*box|\bcont(?:ainer)?\b/i},
    {id: 'toilets', name: 'Toilets', group: 'Toilets & amenities', unit: 'toilet units',
      scope: 'Toilet units, blocks, trailers and pee panels',
      accepts: /toilet|\bfwf\b|pan\s*block|pee\s*panel/i},
    {id: 'generators', name: 'Generators', group: 'Generators', unit: 'generators',
      scope: 'Generators', accepts: /generator|\d\s*kva\b|\bkva\b/i},
    {id: 'lighting', name: 'Lighting', group: 'Lighting towers', unit: 'towers',
      scope: 'Lighting towers', accepts: /light(?:ing)?\s*tower/i},
    {id: 'equipment', name: 'Equipment', group: 'Forklifts & access', unit: 'machines',
      scope: 'Forklifts & access', accepts: /forklift|telehandler|scissor|boom\s*lift|cherry\s*picker|\bewp\b|access\s*platform/i}
  ];
  const groupWords = {Access: 'Forklifts & access', VMS: 'VMS boards', Trakmat: 'Track mat',
    WFB: 'Water-filled barriers', Toilet: 'Toilets & amenities',
    'Portable Building': 'Portable buildings', Generator: 'Generators', 'Light Tower': 'Lighting towers'};
  const groupOf = a => groupWords[a.product] || a.product ||
    (a.discipline === 'Access & plant' ? 'Forklifts & access' : a.discipline);
  const empty = d => ({id: d.id, name: d.name, unit: d.unit, scope: d.scope,
    groupName: d.group || null, total: null, done: null, remaining: null, pct: null,
    unitsComplete: null, left: null, knownTotal: null, completeRefs: 0, totalRefs: 0,
    unknownQuantityRefs: 0, shortConflictRefs: 0, unrecordedRefs: 0,
    rows: [], issues: [], notes: [], missing: !health.ready, loading: health.loading,
    health, asOf: day, basis: health.basis,
    drilldown: {tab: d.id === 'fencing' ? 'fencing' : 'plant', group: d.group || null}});
  const fenceDefinition = {id: 'fencing', name: 'Fencing', unit: 'm', scope: 'Clean fence work recorded'};
  if (!health.ready) {
    const pending = [definitions[0], definitions[1], fenceDefinition, ...definitions.slice(2)].map(empty);
    pending.health = health;
    return pending;
  }
  const live = allAssets().filter(a => !a._cancelled && !a.relocation && !a.rest_of &&
    !(typeof movedAway === 'function' && movedAway(a.key)));
  const ancillary = /tank|sink|fridge|refrigerator(?!\s*cont)|chair|table|desk|stair|step|tynes?|tines?|attachment|forklift\s*forks/i;
  const areas = definitions.map(def => {
    const area = empty(def);
    let knownTotal = 0, done = 0, unknown = false, excluded = 0;
    const members = live.filter(a => groupOf(a) === def.group);
    for (const a of members) {
      const lines = chargeLines(a) || [];
      const selected = [], undecided = [];
      for (const line of lines) {
        const item = String(line.item || '').trim();
        // Separate ancillary lines are omitted; mixed toilet/tank wording cannot be split safely.
        const accessory = ancillary.test(item);
        const separatePart = /\b(?:tynes?|tines?|attachments?|forks)\b|^(?:stairs?|steps?|fridge|chairs?|tables?|desks?|cables?)\b/i.test(item);
        if (separatePart) { excluded++; continue; }
        if (accessory && !def.accepts.test(item)) { excluded++; continue; }
        if (!item || !def.accepts.test(item) || (def.id === 'toilets' && /tank/i.test(item))) {
          undecided.push(line); continue;
        }
        selected.push(line);
      }
      if (!selected.length && !undecided.length && lines.length) continue;
      const quantities = selected.map(quantity);
      const rowUnknown = !lines.length || undecided.length > 0 || quantities.some(q => q == null);
      const known = quantities.reduce((sum, q) => sum + (q == null ? 0 : q), 0);
      if (!rowUnknown && known === 0) continue;
      const d = deliveryAsOf(a.key, day);
      const shorts = typeof shortOf === 'function' ? shortOf(a) : [];
      const conflict = !!d.done && shorts.some(s => selected.some(l => l.item === s.item));
      const complete = !!d.done && !conflict;
      const contribution = complete ? known : 0;
      const status = conflict ? 'Completion tick needs review · short delivery recorded'
        : rowUnknown ? (complete ? 'Completion recorded · quantity to confirm' : 'Quantity or item scope to confirm')
        : complete ? 'Recorded complete'
        : d.recorded && d.state === 'on site' ? 'On site · completion not recorded'
        : d.recorded && d.state === 'in transit' ? 'In transit · completion not recorded'
        : d.recorded ? 'Completion not recorded' : 'No completion record';
      const detail = [selected.map(l => String(l.item || '')).join(', '),
        rowUnknown ? 'Unquantified or unclassified scope is not replaced with one unit.' : '',
        conflict ? 'The complete tick conflicts with a recorded short quantity; no partial completion is inferred.' : '',
        d.levelled ? 'Positioned and levelled recorded.' : '', d.steps ? 'Steps installed recorded.' : ''].filter(Boolean).join(' ');
      area.rows.push({key: a.key, name: a.name || a.key, label: a.name || a.key,
        quantity: rowUnknown ? null : known, knownQuantity: known, complete, recordedComplete: !!d.done,
        done: contribution, remaining: rowUnknown || conflict ? null : known - contribution,
        status, detail, levelled: !!d.levelled, steps: !!d.steps});
      knownTotal += known; done += contribution;
      if (rowUnknown) { unknown = true; area.unknownQuantityRefs++; }
      if (conflict) area.shortConflictRefs++;
      if (complete) area.completeRefs++;
      if (!d.recorded && !d.done) area.unrecordedRefs++;
    }
    area.totalRefs = area.rows.length;
    area.knownTotal = knownTotal;
    area.total = unknown ? null : knownTotal;
    area.done = done;
    area.remaining = area.total == null || area.shortConflictRefs ? null : Math.max(0, area.total - done);
    area.pct = area.total > 0 && !area.shortConflictRefs ? round(done / area.total * 100) : null;
    area.unitsComplete = done; area.left = area.remaining;
    area.missing = unknown || area.shortConflictRefs > 0 || !area.total;
    area.basis = 'Recorded complete ticks across the whole active scope, including work not due yet.';
    area.notes.push('On site and on hire do not establish completion. Levelling and steps remain separate recorded checks.');
    if (def.id === 'toilets') area.notes.push('Blocks and trailers count as units, not individual pans. Waste tanks and separate accessories are excluded.');
    if (def.id === 'equipment') area.notes.push('This card covers forklifts and access machines. VMS, barriers, furniture and track mat remain in Equipment detail.');
    if (excluded) area.notes.push('Separate ancillary item lines are excluded from this count.');
    if (unknown) area.issues.push('Quantity or item scope is unconfirmed on ' + area.unknownQuantityRefs + ' reference(s); whole-scope percentage is unavailable.');
    if (area.shortConflictRefs) area.issues.push('A completion tick conflicts with a recorded short delivery on ' + area.shortConflictRefs + ' reference(s); completion percentage needs review.');
    if (!area.totalRefs) area.issues.push('No active quantified scope is recorded for this category.');
    if (day < todayIso()) area.notes.push('Completion ticks are replayed to this day; order quantities and supplied records show their current values.');
    if (health.stale) area.issues.push(health.basis + '.');
    return area;
  });

  const fence = empty(fenceDefinition);
  fence.basis = 'Dated, usable clean-fence work in the Build programme only; metres of recorded work, not unique physical fence length.';
  const columns = typeof FCOL !== 'undefined' ? FCOL : [];
  const cleanColumns = columns.filter(c => c.unit === 'm' && /Temporary Fence/i.test(c.programme_type || '') && /Clean/i.test(c.programme_type || ''));
  const buildWeeks = (DATA.weeks || []).filter(w => w.phase === 'Build');
  const clean = cleanColumns.length === 1 ? cleanColumns[0] : null;
  const buildNames = new Set(buildWeeks.map(w => w.sheet));
  let total = 0, planKnown = !!clean && buildWeeks.length > 0;
  const sheets = new Set();
  for (const week of buildWeeks) {
    const sheet = typeof progSheetOf === 'function' ? progSheetOf(week.sheet) : null;
    const value = sheet && clean ? number((sheet.totals || {})[clean.programme_type]) : null;
    if (!sheet || !(sheet.year === 2026 || sheet.rolled_forward) || value == null || value < 0 || !sheet.sheet || sheets.has(sheet.sheet)) {
      planKnown = false; continue;
    }
    sheets.add(sheet.sheet); total += value;
  }
  let fenceDone = 0, undated = 0, offPlan = 0, invalid = 0, unplaced = 0;
  for (const d of allDockets()) {
    if (!clean) break;
    const n = number((d.quantities || {})[clean.key]);
    if (n == null || n < 0) { if ((d.quantities || {})[clean.key] != null) invalid++; continue; }
    if (n === 0) continue;
    if (!d.date || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) { undated++; continue; }
    if (d.date > day) continue;
    if (!d.usable) { invalid++; continue; }
    if ((d.scope || 'programme') !== 'programme') { offPlan += n; continue; }
    const datedWeek = (DATA.weeks || []).find(w => w.start && w.end && w.start <= d.date && w.end >= d.date);
    // A Demob date cannot become installation just because its docket carries a Build week label.
    if (datedWeek && datedWeek.phase !== 'Build') continue;
    if (!buildNames.has(d.week) || (datedWeek && datedWeek.sheet !== d.week)) { unplaced++; continue; }
    fenceDone += n;
    fence.rows.push({key: null, name: 'Docket ' + (d.docket_no || d.id || 'record'),
      label: 'Docket ' + (d.docket_no || d.id || 'record'), quantity: n,
      complete: true, done: n, remaining: null, status: 'Clean fence work recorded',
      detail: d.date + ' · ' + d.week, docketId: d.id || null});
  }
  fence.knownTotal = round(total);
  fence.total = planKnown ? round(total) : null;
  fence.done = clean ? round(fenceDone) : null;
  fence.remaining = fence.total == null || fence.done == null ? null : round(Math.max(0, fence.total - fence.done));
  fence.pct = fence.total > 0 && fence.done != null ? round(Math.min(100, fence.done / fence.total * 100)) : null;
  fence.unitsComplete = fence.done; fence.left = fence.remaining;
  fence.totalRefs = fence.rows.length; fence.completeRefs = fence.rows.length;
  fence.missing = !planKnown || !fence.total || !clean;
  fence.notes.push('Scrim, relocations, removals, gates, CCB and off-programme work are excluded.');
  if (!planKnown) fence.issues.push('The full clean-fence Build programme is not quantified; percentage and remaining metres are unavailable.');
  if (!clean) fence.issues.push('A unique clean-fence metre column could not be identified.');
  if (undated) fence.issues.push(undated + ' clean-fence record(s) have no usable date and are excluded.');
  if (invalid) fence.issues.push(invalid + ' clean-fence record(s) need review and are excluded.');
  if (unplaced) fence.issues.push(unplaced + ' clean-fence record(s) have no matching Build week and are excluded.');
  if (offPlan) fence.notes.push(round(offPlan) + ' m of off-programme clean work is kept outside this comparison.');
  if (fence.total != null && fenceDone > fence.total) fence.issues.push('Recorded clean work exceeds the programme quantity; the work records are not unique physical fence length.');
  if (health.stale) fence.issues.push(health.basis + '.');
  areas.splice(2, 0, fence);
  areas.health = health;
  return areas;
}
