/* Author: Andrew Fisher. v8.43: one read-only instrument per native item type.
 * Preserve exact source names and source quantity boundaries. A reference-level
 * Complete tick is not evidence of partially installed units. No record, price,
 * native group model or fencing calculation is changed here.
 */
function todayTypeMetrics843(asOf, suppliedGroups, suppliedSummary) {
  const day = asOf || (/^\d{4}-\d{2}-\d{2}$/.test(typeof state !== 'undefined' && state.asOf || '') ? state.asOf : todayIso());
  let groups = suppliedGroups, summary = suppliedSummary;
  if (!groups || !summary) {
    const areas = todayWorkMetrics840(day);
    groups = groups || todayGroupDetails841(day, areas);
    summary = summary || todayWorkSummary842(day, areas, groups, todayFencingSummary841(day));
  }
  const health = groups.health || todayGroupHealth841();
  const cards = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'equipment'];
  const result = {asOf: day, health, byCard: Object.fromEntries(cards.map(id => [id, []])), instruments: [],
    coverage: {ready: !!health.ready, allRepresented: false, sourceTypeIds: [], representedTypeIds: [], issues: []}};
  if (!health.ready) { result.coverage.issues.push(health.basis); return result; }
  const number = n => typeof n === 'number' && Number.isFinite(n);
  const round = n => Math.round(n * 100) / 100;
  const identity = (card, group, name) => 'type843-' + encodeURIComponent(JSON.stringify([card, group, name]));
  const nativeRows = new Map(dsnState(day).rows.map(r => [r.a.key, r]));
  const sourceIds = [], typeAreas = [], pending = [];
  const mainReview = new Set(Object.values(summary.byId || {}).flatMap(area => area.reviewRefs || []));
  for (const cardId of cards) {
    for (const group of (groups[cardId] || {}).groups || []) {
      for (const type of group.types || []) {
        const id = identity(cardId, group.id, type.name);
        sourceIds.push(id);
        const unitKnown = group.name !== 'Track mat' && !/unconfirmed/i.test(type.unit || '');
        const keys = [...new Set(type.keys || [])];
        const issues = (type.issues || []).slice(), rows = [];
        for (const key of keys) {
          const native = nativeRows.get(key);
          if (!native || native.a._cancelled || native.reloc || native.a.relocation || native.a.rest_of ||
              typeof movedAway === 'function' && movedAway(key)) {
            issues.push(key + ': active native type reading unavailable.');
            result.coverage.issues.push('An instrument reference is absent or excluded in the native reading.');
            continue;
          }
          // Each native item Map entry is counted once, even if several charge lines share its exact name.
          let lines = (native.cls || []).filter(line => line.item === type.name);
          if (!lines.length && type.name === 'Item description unconfirmed') lines = (native.cls || []).filter(line => !line.item);
          const values = lines.map(line => qtyOf(line));
          const valid = value => unitKnown && number(value) && value >= 0 && Number.isInteger(value);
          const knownQuantity = values.reduce((n, value) => n + (valid(value) ? value : 0), 0);
          const quantityKnown = values.length > 0 && values.every(valid);
          const d = native.d || {}, recordedComplete = !!d.done;
          const shorts = typeof shortOf === 'function' ? shortOf(native.a) : [];
          const itemShort = recordedComplete && shorts.some(short => lines.some(line => line.item === short.item));
          const referenceReview = recordedComplete && mainReview.has(key);
          const conflict = itemShort || referenceReview;
          const complete = recordedComplete && !conflict;
          const done = unitKnown ? (complete ? knownQuantity : 0) : null;
          const quantity = quantityKnown ? knownQuantity : null;
          const onSite = lines.length ? [...new Set(lines.map(line => line.item))].reduce((n, item) => n + (native.onBy.get(item) || 0), 0) : null;
          const rowIssues = [];
          if (itemShort) rowIssues.push('This item has a recorded shortage; its Complete tick requires review.');
          else if (referenceReview) rowIssues.push('Completion on this shared reference requires review; this item is not separately claimed to be short.');
          if (!quantityKnown) rowIssues.push(unitKnown ? 'Whole-unit quantity is unconfirmed; no schedule fallback is counted as physical completion.' : 'The source does not resolve this item’s physical unit.');
          const status = conflict ? itemShort ? 'Item shortage · completion requires review' : 'Reference completion requires review'
            : !unitKnown ? 'Physical unit unconfirmed'
            : !quantityKnown ? recordedComplete ? 'Complete recorded · quantity unconfirmed' : 'Quantity unconfirmed'
            : complete ? 'Confirmed complete'
            : d.recorded && d.state === 'on site' ? d.where === 'rental' ? 'On hire · arrival and completion unconfirmed' : 'On site · completion not recorded' : 'Completion not recorded';
          rows.push({key, name: native.a.name || key, quantity, knownQuantity: unitKnown ? knownQuantity : null,
            done, left: quantity == null || done == null ? null : Math.max(0, quantity - done),
            remaining: quantity == null || done == null ? null : Math.max(0, quantity - done),
            onSite, complete, recordedComplete, conflict, conflictReason: itemShort ? 'item-short' : referenceReview ? 'reference-review' : null,
            status, issues: rowIssues});
        }
        const knownTotal = unitKnown && number(type.knownQuantity) ? type.knownQuantity : null;
        const total = unitKnown && type.quantityKnown && knownTotal != null ? knownTotal : null;
        const done = unitKnown && number(type.knownComplete) ? type.knownComplete : null;
        const rowKnown = rows.reduce((n, row) => n + (number(row.knownQuantity) ? row.knownQuantity : 0), 0);
        const rowDone = rows.reduce((n, row) => n + (number(row.done) ? row.done : 0), 0);
        if (unitKnown && (knownTotal == null || done == null || round(rowKnown) !== round(knownTotal) || round(rowDone) !== round(done))) {
          result.coverage.issues.push('A native type quantity does not reconcile to its reference breakdown.');
          issues.push('Reference quantities require review against the native type summary.');
        }
        if (!unitKnown) issues.push('Mats versus metres is unresolved; the native schedule and on-site readings are retained without a physical completion percentage.');
        const scopeNote = cardId === 'toilets' && /tank/i.test(type.name)
          ? /toilet|\bfwf\b|pan\s*block|pee\s*panel/i.test(type.name)
            ? 'Mixed toilet and tank wording is retained as one source type; no split into toilet or tank units is inferred.'
            : 'Separate amenities item; excluded from the toilet-unit headline.'
          : '';
        if (scopeNote) issues.push(scopeNote);
        const basis = 'Each source type retains its own quantity. Confirmed completion follows the reference Complete tick, excluding item shortages and shared-reference completion reviews. On site / on hire retains the native rental-or-person item reading; it is not installation evidence.';
        issues.push('Plan counts are references containing this type; a mixed reference appears in each relevant type and those reference counts must not be added together.');
        if (day < todayIso()) issues.push('Complete and arrival records replay to this day; item descriptions, quantities and supplied-shortage evidence are current values.');
        const item = {id, kind: 'asset-type', cardId, groupId: group.id, groupName: group.name,
          name: type.name, unit: type.unit || 'items', total, knownTotal, scheduleTotal: type.total,
          done, onSite: type.onSite, onSiteLabel: 'On site / on hire', keys, rows, basis, scopeNote, issues, quantityKnown: total != null,
          unitKnown, drilldown: {tab: 'plant', group: group.name}, sourceType: type};
        pending.push(item);
        typeAreas.push({id, name: type.name, scope: group.name + ' · ' + type.name, unit: item.unit,
          total, knownTotal, done, rows, shortConflictRefs: rows.filter(row => row.conflict).length,
          unknownQuantityRefs: rows.filter(row => row.quantity == null).length, issues: []});
      }
    }
  }
  // One batch reuses the unchanged v8.42 reference-plan and lower-bound rules.
  // All inputs are supplied, so this does not rebuild fencing or the main metrics per type.
  typeAreas.health = health;
  const projected = todayWorkSummary842(day, typeAreas, groups, {summaryRows: []});
  for (const item of pending) {
    const reading = projected.byId[item.id];
    Object.assign(item, {left: reading.left, pct: reading.pct, pctKind: reading.pctKind, pctLabel: reading.pctLabel,
      reviewQuantity: reading.reviewQuantity, reviewRefs: reading.reviewRefs,
      unquantifiedRefs: reading.unquantifiedRefs, plan: reading.plan});
    result.byCard[item.cardId].push(item); result.instruments.push(item);
  }
  for (const row of summary.fencingRows || []) {
    const id = 'type843-fence-' + encodeURIComponent(row.id);
    sourceIds.push(id);
    const item = {...row, id, fenceId: row.id, sourceRow: row, kind: 'fence-work', cardId: 'fencing',
      groupId: 'Build programme', groupName: 'Build programme', name: row.label,
      keys: [], rows: [], onSite: null, reviewQuantity: null, reviewRefs: [],
      drilldown: {tab: 'fencing'}, basis: row.plan && row.plan.basis || row.note || 'Recorded Build work by type.'};
    result.byCard.fencing.push(item); result.instruments.push(item);
  }
  const represented = result.instruments.map(item => item.id);
  const unique = new Set(sourceIds).size === sourceIds.length && new Set(represented).size === represented.length;
  const sourcesCovered = groups.allGroupsCovered !== false && !(groups.__coverage && groups.__coverage.allRepresented === false);
  if (!sourcesCovered) result.coverage.issues.push('Native group coverage is not complete.');
  if (!unique) result.coverage.issues.push('Two source types have the same displayed identity; no distinct variants are merged.');
  result.coverage.sourceTypeIds = sourceIds;
  result.coverage.representedTypeIds = represented;
  result.coverage.allRepresented = sourcesCovered && unique && !result.coverage.issues.length &&
    sourceIds.length === represented.length && sourceIds.every(id => represented.includes(id));
  return result;
}
