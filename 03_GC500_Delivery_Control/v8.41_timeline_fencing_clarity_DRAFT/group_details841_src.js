/* Author: Andrew Fisher. v8.41: one home for the existing By group detail.
 * Read native quantities and financial models; never write or price a record.
 * Schedule counts, physical completion, and programme work remain separate.
 */
function todayGroupHealth841() {
  const base = todayWorkHealth840();
  const hosted = typeof DATA !== 'undefined' && DATA.edition === 'hosted';
  const required = ['rates', 'lineRates', 'accRates', 'fenceRates', 'fenceCosts',
    'weeks', 'serviceNotes', 'fenceDone', 'breakdowns', 'contracts', 'hireStart',
    'minDays', 'labour', 'eventHours', 'variances'];
  const ready = base.ready && (!hosted || typeof SYNC !== 'undefined' && SYNC.first && required.every(k => SYNC.first.has(k)));
  const loading = !ready && base.status !== 'unreachable' && base.status !== 'revoked';
  return {...base, ready, loading, basis: ready ? base.basis : loading
    ? 'Waiting for shared group and cost records' : 'Shared group and cost records unavailable'};
}

function todayGroupDetails841(asOf, workAreas) {
  const day = asOf || (/^\d{4}-\d{2}-\d{2}$/.test(typeof state !== 'undefined' && state.asOf || '') ? state.asOf : todayIso());
  const health = todayGroupHealth841();
  const round = n => Math.round(n * 100) / 100;
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const aliases = {'Access & plant': 'Forklifts & access', 'Variable message signs': 'VMS boards', 'Ground protection': 'Track mat'};
  const words = typeof PLANT_GROUP_WORDS !== 'undefined' ? PLANT_GROUP_WORDS : {
    Access: 'Forklifts & access', VMS: 'VMS boards', Trakmat: 'Track mat', WFB: 'Water-filled barriers',
    Toilet: 'Toilets & amenities', 'Portable Building': 'Portable buildings', Generator: 'Generators', 'Light Tower': 'Lighting towers'};
  const canonical = name => aliases[name] || name || 'Uncategorised';
  const groupOf = a => canonical(words[a.product] || a.product || a.discipline);
  const owner = name => ({'Portable buildings': 'buildings', 'Toilets & amenities': 'toilets',
    Generators: 'generators', 'Lighting towers': 'lighting', Fencing: 'fencing'}[canonical(name)] || 'equipment');
  const ids = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'equipment'];
  const result = Object.fromEntries(ids.map(id => [id, {id, asOf: day, health, loading: health.loading,
    basis: 'On site follows the native rental or delivery reading. Complete follows recorded Complete ticks; on site does not establish completion.',
    groups: [], money: [], comparisons: [], facts: [], notes: [], issues: [], programmeRows: [],
    drilldown: {tab: id === 'fencing' ? 'fencing' : 'plant'}}]));
  result.health = health; result.asOf = day;
  result.allGroupsCovered = false;
  result.__coverage = {ready: health.ready, allRepresented: false, sourceGroupIds: [], mappedGroupIds: [],
    sourceKeys: [], representedKeys: [], sourceMoneyIds: [], mappedMoneyIds: []};
  if (!health.ready) { ids.forEach(id => result[id].issues.push(health.basis)); return result; }
  const X = dsnState(day), areas = workAreas || todayWorkMetrics840(day);
  const progress = new Map(areas.filter(a => a.id !== 'fencing').flatMap(a => a.rows.map(r => [r.key, r])));
  const nativeGroups = typeof DSN_GROUPS !== 'undefined' ? DSN_GROUPS : [];
  const grouped = new Map();
  for (const row of X.rows) {
    if (row.a._cancelled) continue;
    const name = groupOf(row.a);
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push(row);
  }
  for (const [name, rows] of grouped) {
    const card = result[owner(name)];
    const def = nativeGroups.find(g => canonical(g.disc) === name || canonical(g.name) === name);
    const excluded = rows.filter(r => r.reloc || r.a.relocation || r.a.rest_of || typeof movedAway === 'function' && movedAway(r.a.key));
    const excludedKeys = new Set(excluded.map(r => r.a.key));
    const placed = rows.filter(r => !excludedKeys.has(r.a.key));
    const unit = name === 'Track mat' ? 'schedule quantity · unit unconfirmed'
      : def && typeof dsnGroupWord === 'function' ? dsnGroupWord(def, placed, 2) || 'schedule quantity'
      : 'units';
    const cnt = rs => round(rs.reduce((n, r) => n + r.asked, 0));
    const group = {id: name, name, unit, keys: placed.map(r => r.a.key),
      drilldown: {tab: 'plant', group: name}, types: [], facts: [], notes: [], issues: [],
      summary: {total: cnt(placed), onSite: round(placed.reduce((n, r) => n + r.unitsOn, 0)),
        due: cnt(placed.filter(r => r.due)), overdue: cnt(placed.filter(r => r.overdue)),
        next: cnt(placed.filter(r => r.next && !r.on)), noRecord: cnt(placed.filter(r => r.norecord)),
        nextDays: typeof PROG_NEXT_DAYS === 'number' ? PROG_NEXT_DAYS : null},
      excluded: excluded.map(r => ({key: r.a.key, name: r.a.name || r.a.key,
        reason: r.reloc || r.a.relocation ? 'Relocation' : r.a.rest_of ? 'Follow-up delivery; order remains on the parent' : 'Moved to another reference'}))};
    const byType = new Map();
    for (const r of placed) {
      const items = new Set([...(r.askedBy || new Map()).keys(), ...r.cls.map(l => l.item)]);
      const shorts = typeof shortOf === 'function' ? shortOf(r.a) : [];
      for (const item of items) {
        const type = byType.get(item) || {name: item || 'Item description unconfirmed', unit: name === 'Track mat' ? unit : 'items',
          total: 0, onSite: 0, complete: 0, remaining: 0, knownComplete: 0, knownQuantity: 0,
          quantityKnown: true, completionKnown: true, noQuantityLines: 0, keys: [], issues: [],
          basis: 'Schedule total and on-site count use the native item reading. Complete is the known item quantity on references marked Complete.'};
        const lines = r.cls.filter(l => l.item === item), quantities = lines.map(l => qtyOf(l));
        const known = quantities.length > 0 && quantities.every(q => finite(q) && q >= 0);
        const quantity = quantities.reduce((n, q) => n + (finite(q) && q >= 0 ? q : 0), 0);
        const matchedShort = !!r.d.done && shorts.some(s => s.item === item);
        // Main instrument completion is deliberately conservative for physical-item conflicts.
        const main = progress.get(r.a.key);
        const conflict = matchedShort || !!r.d.done && main && main.recordedComplete && !main.complete;
        type.total += r.askedBy.get(item) || 0;
        // Read the map once: repeated lines with the same item must not multiply on-site quantities.
        type.onSite += r.onBy.get(item) || 0;
        type.knownQuantity += quantity;
        type.quantityKnown = type.quantityKnown && known;
        type.completionKnown = type.completionKnown && !conflict && (!r.d.done || known);
        if (r.d.done && !conflict) type.knownComplete += quantity;
        type.noQuantityLines += lines.filter(l => l.quantity == null).length;
        type.keys.push(r.a.key);
        if (conflict) type.issues.push(r.a.key + ': Complete recorded with a short-delivery conflict; quantity requires review.');
        if (!known) type.issues.push(r.a.key + ': quantity unconfirmed; no one-unit completion is inferred.');
        byType.set(item, type);
      }
    }
    group.types = [...byType.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)).map(t => {
      for (const key of ['total', 'onSite', 'knownComplete', 'knownQuantity']) t[key] = round(t[key]);
      t.complete = t.completionKnown ? t.knownComplete : null;
      t.remaining = t.quantityKnown && t.completionKnown ? round(Math.max(0, t.knownQuantity - t.knownComplete)) : null;
      if (t.noQuantityLines) t.issues.push(t.noQuantityLines + ' schedule line(s) have no quantity and retain the native one-position count in Total; completion quantity remains unconfirmed.');
      return t;
    });
    const numbers = placed.reduce((n, r) => n + r.nums.filter(x => !isMiscRow(x)).length, 0);
    const subhires = placed.reduce((n, r) => n + (r.subs || []).length, 0);
    const accessories = placed.reduce((n, r) => n + r.accs.length, 0);
    const person = placed.filter(r => r.on && !r.byRental).reduce((n, r) => n + r.unitsOn, 0);
    group.facts.push({label: 'Asset numbers on hire', value: numbers, unit: 'asset numbers'},
      {label: 'Subhired, no Coates asset number', value: subhires, unit: 'machines'},
      {label: 'Set by a person on site', value: person, unit},
      {label: 'Accessories on hire', value: accessories, unit: 'lines', note: 'Attachments are not additional machines.'});
    if (def && def.what) group.notes.push(def.what + '.');
    if (excluded.length) group.notes.push(excluded.length + ' relocation, follow-up or moved reference(s) are kept outside the order totals; open Equipment to review them.');
    if (numbers + subhires && group.summary.total > numbers + subhires) group.notes.push('The schedule order and rental machine counts are different readings. Repeated schedule work fronts are retained as written; later deliveries versus movements are not inferred.');
    const unpriced = rows.filter(r => r.t.total == null).length;
    if (unpriced) group.notes.push(unpriced + ' of ' + rows.length + ' references are not priced in full; see Pricing.');
    if (name === 'Water-filled barriers' && typeof barrierQty === 'function') {
      const bq = barrierQty();
      group.facts.push({label: 'On the K220 master sheet', value: bq.master, unit: 'barriers'},
        {label: 'On the K221–K231 detail sheets', value: bq.detail, unit: 'barriers'});
      group.notes.push('Schedule work fronts and drawing counts have no row-to-zone key. These separate sources are not added together or reconciled here.');
    }
    if (name === 'Track mat') group.issues.push('The schedule does not resolve mats versus metres. These quantities have no inferred physical unit.');
    card.groups.push(group);
  }
  // Exact native financial buckets, each owned once. No inferred direct-cost allocation.
  const charges = tradeCharges();
  for (const [disc, charge] of charges) {
    result[owner(disc)].money.push({id: 'contract|' + disc, group: canonical(disc),
      label: canonical(disc) + ' · Revenue charged on contracts', kind: 'revenue', amount: charge.charge0,
      rawAmount: charge.charge, lines: charge.lines, unrated: charge.unrated,
      basis: 'Current native contract charges, ex GST. Includes only this trade’s classified contract lines; transport and other job-level charges stay in Costs. Not limited to the selected day.',
      drilldown: {tab: 'costs'}});
  }
  for (const [disc, value] of X.byDisc) {
    result[owner(disc)].comparisons.push({id: 'schedule|' + disc, group: disc,
      hire: value.hire0, transport: value.transport0, refs: value.n,
      basis: 'Original schedule discipline at the current card rates, for comparison only; never added to Revenue. Product groups can differ from schedule disciplines.',
      drilldown: {tab: 'pricing'}});
  }
  const fence = result.fencing, P = X.P;
  fence.basis = 'Build work is above. The following native comparison covers the whole 2026 programme, including Demob; it is not an extra Build quantity.';
  fence.programmeRows = fenceTypes(P).map(t => ({id: t.key, name: t.name, fullName: t.type, unit: t.unit,
    total: t.total, planned: t.planned, recorded: round(t.done), remaining: round(Math.max(0, t.total - t.done)),
    behind: t.planned != null && t.done < t.planned ? round(t.planned - t.done) : 0,
    basis: 'Native whole-programme comparison: all 2026 or rolled-forward sheets; dated programme work by the selected day. Work quantities are not unique standing fence length.'}));
  fence.facts.push({label: 'Docket areas ticked done', value: P.areasDone, total: P.areas, unit: 'named docket areas', note: 'Only areas named on dockets, not every area on the programme.'},
    {label: 'Open fencing breakdowns', value: P.fenceBd || 0, unit: 'breakdowns'});
  if (P.notRolled && P.notRolled.length) fence.issues.push(P.notRolled.length + ' programme sheet(s) not rolled forward.');
  const fd = fenceDerived(), green = typeof greenBookTotals === 'function' ? greenBookTotals() : null;
  fence.money.push({id: 'fence-revenue', label: 'Dockets · Revenue at the 2026 card', kind: 'revenue', amount: fd.charged,
    basis: 'Native usable docket Revenue, current cumulative record; not limited to the selected day.', drilldown: {tab: 'fencing'}},
    {id: 'fence-cost', label: 'Dockets · Direct costs paid to Advanced', kind: 'direct-cost', amount: fd.cost,
      basis: 'Native docket Rehire + Installation — external contractors. Current cumulative record; not limited to the selected day.', drilldown: {tab: 'fencing'}});
  if (green && green.notes) fence.money.push({id: 'green-book', label: 'Green book · Advanced labour and truck hours', kind: 'direct-cost',
    amount: green.rate != null ? green.amount : null, lines: green.notes, unrated: green.unpriced,
    basis: 'Native green-book Installation — external contractors, separate from docket costs; current cumulative record, not limited to the selected day.', drilldown: {tab: 'fencing'}});
  fence.notes.push('Clean fence, scrim, relocation and removal may describe work on the same fence. Types and units are never summed into a single completion percentage.');
  result.equipment.notes.push('VMS, access, water barriers, furniture, track mat and other equipment retain separate quantities and units. The forklift/access completion reading does not describe the whole Equipment category.');
  for (const id of ids) {
    if (day < todayIso()) result[id].notes.push('Delivery lights and Complete ticks replay to the selected day. Order quantities, supplied records and financial rates are current values without historical replay.');
    if (health.stale) result[id].issues.push(health.basis + '.');
  }
  const sourceGroupIds = ['fencing', ...new Set(X.rows.filter(r => !r.a._cancelled).map(r => r.a.discipline || 'Uncategorised'))];
  const represented = ids.flatMap(id => result[id].groups.flatMap(g => g.keys.concat(g.excluded.map(r => r.key))));
  const sourceKeys = X.rows.filter(r => !r.a._cancelled).map(r => r.a.key);
  const sourceMoneyIds = [...charges.keys()].map(d => 'contract|' + d).concat([...X.byDisc.keys()].map(d => 'schedule|' + d),
    ['fence-revenue', 'fence-cost'], green && green.notes ? ['green-book'] : []);
  const mappedMoneyIds = ids.flatMap(id => result[id].money.concat(result[id].comparisons).map(m => m.id));
  const sameOnce = (source, mapped) => source.length === mapped.length && new Set(mapped).size === mapped.length && source.every(key => mapped.includes(key));
  const allRepresented = sameOnce(sourceKeys, represented) && sameOnce(sourceMoneyIds, mappedMoneyIds);
  result.allGroupsCovered = allRepresented;
  result.__coverage = {ready: true, allRepresented, sourceGroupIds,
    mappedGroupIds: allRepresented ? sourceGroupIds.slice() : [], sourceKeys, representedKeys: represented,
    sourceMoneyIds, mappedMoneyIds};
  return result;
}
