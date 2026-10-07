/* Author: Andrew Fisher. Proposed read-only Lighting scope projection.
 * Inputs are native verified work rows, active register rows, and confirmed map
 * groups. No delivery tick is interpreted here; completion comes only from the
 * native row's conflict-free complete + done + known quantity readings.
 * This file contains no operational records or financial values. */
function lighting894ProjectVerified(nativeRows, register, confirmation, numbersOf) {
  'use strict';
  const count = n => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  const keys = g => [...new Set([...(g.records || []), ...(g.callouts || [])].map(String))];
  const valid = confirmation && count(confirmation.towers) && confirmation.towers > 0
    && Array.isArray(confirmation.groups) && confirmation.groups.length > 0
    && confirmation.groups.every(g => g && count(g.scope) && g.scope > 0 && g.name
      && Array.isArray(g.records) && Array.isArray(g.callouts))
    && confirmation.groups.reduce((n, g) => n + g.scope, 0) === confirmation.towers;
  const active = new Map(register.map(a => [String(a.key), a]));
  const native = new Map(nativeRows.map(r => [String(r.key), r]));
  const memberships = new Map();
  if (valid) confirmation.groups.forEach((g, index) => keys(g).forEach(k => {
    if (!memberships.has(k)) memberships.set(k, []);
    memberships.get(k).push(index);
  }));
  // Declared aggregate references own their asset identifiers before keyed
  // callouts. A callout with independent identifiers joins its own map location.
  const order = [...new Set([
    ...(valid ? confirmation.groups.flatMap(g => g.records) : []),
    ...nativeRows.map(r => r.key)
  ].map(String))];
  const owners = new Map(), rows = [], aliases = [], issues = [];
  for (const key of order) {
    const source = native.get(key), asset = active.get(key);
    if (!source || !asset) continue;
    const ids = [...new Set((numbersOf(asset) || []).map(String).filter(Boolean))];
    const overlap = ids.filter(id => owners.has(id));
    if (overlap.length === ids.length && ids.length) {
      aliases.push({key, parents: [...new Set(overlap.map(id => owners.get(id)))]});
      continue;
    }
    const ambiguous = overlap.length > 0;
    const quantity = count(source.quantity) ? source.quantity : null;
    const review = !!(source.recordedComplete && !source.complete) || ambiguous || quantity == null;
    const done = !review && source.complete === true && count(source.done)
      ? Math.min(quantity, source.done) : 0;
    // A partial identity overlap cannot safely be split into individual units.
    // Keep it visible for review and give it no additional scope credit.
    const location = memberships.get(key) || [];
    const row = {...source, key, units: ambiguous ? 0 : quantity,
      doneUnits: done, done: done > 0 && done === quantity,
      review, identityReview: ambiguous, group: location.length === 1 ? location[0] : null,
      native: source, recordedQuantity: quantity, present: true};
    rows.push(row);
    if (ambiguous) issues.push(key + ': overlapping asset identifiers need review; no extra scope credit.');
    if (location.length > 1) issues.push(key + ': reference belongs to more than one confirmed location; no scope credit.');
    if (!ambiguous) ids.forEach(id => owners.set(id, key));
  }
  const groups = valid ? confirmation.groups.map((g, index) => {
    const records = rows.filter(r => r.group === index);
    const recorded = records.reduce((n, r) => n + (r.units || 0), 0);
    const delivered = records.reduce((n, r) => n + r.doneUnits, 0);
    const credited = Math.min(g.scope, delivered);
    let capacity = g.scope;
    const allocated = new Map();
    // Count verified completion first. This is a scope allocation, never a claim
    // that particular physical towers or individual identifiers were installed.
    const priority = records.slice().sort((a, b) => Number(b.done) - Number(a.done));
    priority.forEach(r => {
      const quantity = Math.min(capacity, r.units || 0);
      const done = Math.min(quantity, r.doneUnits);
      capacity -= quantity;
      const surplus = Math.max(0, (r.units || 0) - quantity);
      allocated.set(r.key, {...r.native, quantity, knownQuantity: quantity, done,
        remaining: quantity - done, left: quantity - done,
        complete: quantity > 0 && done === quantity,
        scope894: true, recordedQuantity894: r.recordedQuantity, surplus894: surplus,
        detail: [r.native.detail, 'Map scope at ' + g.name + ': ' + quantity
          + ' allocated; ' + (r.recordedQuantity == null ? 'quantity unconfirmed' : r.recordedQuantity + ' recorded')
          + (surplus ? '; ' + surplus + ' surplus to this location’s scope' : '')
          + (r.identityReview ? '; overlapping identifiers require review' : '') + '.'].filter(Boolean).join(' ')});
    });
    const scopeRows = records.map(r => allocated.get(r.key));
    if (capacity) scopeRows.push({key: null, label: g.name + ' · map scope without allocated recorded towers',
      quantity: capacity, knownQuantity: capacity, done: 0, remaining: capacity, left: capacity,
      complete: false, recordedComplete: false, scope894: true});
    return {name: String(g.name), callouts: g.callouts.map(String), scope: g.scope,
      records, recorded, delivered, credited, surplus: Math.max(0, recorded - g.scope), scopeRows};
  }) : [];
  const unallocated = valid ? rows.filter(r => r.group == null) : [];
  unallocated.forEach(r => issues.push(r.key + ': recorded tower is outside a unique confirmed location; no scope credit.'));
  const scopeRows = groups.flatMap(g => g.scopeRows);
  // Records outside a uniquely mapped location remain inspectable in Total,
  // explicitly with zero allocation; they do not manufacture a location.
  unallocated.forEach(r => scopeRows.push({...r.native, quantity: 0, done: 0,
    remaining: 0, left: 0, complete: false, scope894: true,
    recordedQuantity894: r.recordedQuantity,
    detail: [r.native.detail, 'No confirmed location allocation; '
      + (r.recordedQuantity == null ? 'quantity unconfirmed' : r.recordedQuantity + ' recorded towers')
      + ' remain on the equipment register.'].filter(Boolean).join(' ')}));
  aliases.forEach(a => issues.push(a.key + ' repeats asset identifiers counted with ' + a.parents.join(', ') + '; adds no tower.'));
  const credited = groups.reduce((n, g) => n + g.credited, 0);
  const review = rows.some(r => r.review) || issues.some(s => !s.includes('repeats asset identifiers'));
  const pct = valid ? credited / confirmation.towers * 100 : null;
  return {rows, groups, aliases, issues, scopeRows, confirmed: !!valid,
    recorded: rows.reduce((n, r) => n + (r.units || 0), 0),
    complete: rows.reduce((n, r) => n + r.doneUnits, 0), credited,
    review, reviewRefs: rows.filter(r => r.review).map(r => r.key),
    pctKind: review ? 'lower-bound' : 'confirmed',
    pct: pct == null ? null : (review ? Math.floor(pct * 100) : Math.round(pct * 100)) / 100};
}
if (typeof module !== 'undefined' && module.exports) module.exports = {lighting894ProjectVerified};
