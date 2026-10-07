/* Author: Andrew Fisher. v8.94: the Lighting scope counts real towers once, against the map's scope, and the whole job is not
 * shown as verified unless that scope is settled.
 *
 * What was wrong: the Lighting register carried 25 towers over 21 rows and read 20% complete. 18 of those rows are not
 * towers anyone has supplied: 13 circuit light-spread fans (LTC01–LTC12, LTC14) read off the D024 sheet, which are the big
 * screens' symbols (Andrew, 8 Oct 2026: "Yes they big screens not light's"); 4 keyed callouts (LT01–LT04) with no asset
 * number, hire or delivery; and NVLT, a copy of T0002 carrying one of T0002's own asset numbers. The towers on record are
 * T0002 ×5, LT05 and LT06: 7.
 *
 * The scope is the map (Andrew, 8 Oct 2026: "What ever the map says. If its 6 its 6"): the 6 lighting towers D024 keys,
 * 4 at the BSF storage yard, Molendinar, and 2 at the Seaway car park transporter compound. Each location credits the
 * towers verified complete at it (complete on the record, a known quantity, no conflict), up to the number D024 keys there, so the
 * fifth tower on record at Molendinar is surplus to the plan
 * (Andrew, 8 Oct 2026: "Lets go by d024") and is said, not counted. Lighting = credited ÷ 6; today 4 of 6.
 *
 * The projection (the v8.82 audit, rebased): drawing-only D024 symbols and source-row copies leave the equipment register
 * (buildAllAssets / allAssets), their charge lines go empty, the circuit fans become big-screen symbols, and every one of
 * them stays reachable — assetOf, the map's callouts and pins, the finder, #asset/ links and the drawer — with a notice
 * saying what it is. Evidence promotes a row: record an asset number, hire or a delivery against it and it is a tower again.
 *
 * Two states. Confirmed (the release carries scope_confirmed.json): Lighting is confirmed against the map's scope and the
 * whole job reads under the v8.85 seven-group rule; all five lights go green only at a confirmed 100%. Unconfirmed (no
 * file, or one that does not add up): Lighting reads "Complete in recorded scope" over unique recorded equipment and the
 * whole-job figure is unavailable, because an unconfirmed total is neither a value nor a minimum. Presentation and
 * projection only: no record, DATA, hire or money changes, and nothing is written. */
function lighting894MapList(){ const L = window.Lighting894; return L && L.mapList ? L.mapList() : allAssets(); }
function lighting894Context(key){ const L = window.Lighting894; return L && L.contextOf ? L.contextOf(key) : null; }
(() => {
 'use strict';
 if (window.Lighting894) return;
 const CONFIRMED = /*__CONFIRMED894__*/null; /* patch_v894: scope_confirmed.json ({towers, by, on, words, groups[]}), or null */
 const BOQ = /*__BOQ894__*/null;             /* patch_v894: the Schedule (5) BOQ light-tower count when V882_SCHEDULE is given */
 const SHEET = 'D024-26003-02';
 /* page text carries no personal attributions (the build scrubs them): the words and their source are in the README.
  * 8 Oct 2026, on whether the 13 circuit fans are big screens rather than towers: "Yes they big screens not light's". */
 const SETTLED = 'confirmed 8 Oct 2026';
 /* every function this release wraps or reads must be there; otherwise nothing changes and the page says so once */
 const missing = [];
 if (typeof buildAllAssets !== 'function') missing.push('buildAllAssets');
 if (typeof allAssets !== 'function') missing.push('allAssets');
 if (typeof assetOf !== 'function') missing.push('assetOf');
 if (typeof chargeLines !== 'function') missing.push('chargeLines');
 if (typeof drawerTidy !== 'function') missing.push('drawerTidy');
 if (typeof todayGroupDetails841 !== 'function') missing.push('todayGroupDetails841');
 if (typeof todayWorkSummary848 !== 'function') missing.push('todayWorkSummary848');
 if (typeof progress881Model !== 'function') missing.push('progress881Model');
 if (typeof renderToday_held !== 'function') missing.push('renderToday_held');
 if (typeof deliveryOf !== 'function') missing.push('deliveryOf');
 if (typeof deliveryAsOf !== 'function') missing.push('deliveryAsOf');
 if (typeof assetNumbersOf !== 'function') missing.push('assetNumbersOf');
 if (typeof rentalOf !== 'function') missing.push('rentalOf');
 if (typeof unitsOf !== 'function') missing.push('unitsOf');
 if (typeof movedAway !== 'function') missing.push('movedAway');
 if (typeof unitsAsked !== 'function') missing.push('unitsAsked');
 if (typeof todayWorkDay841 !== 'function') missing.push('todayWorkDay841');
 if (typeof heldMemo !== 'function') missing.push('heldMemo');
 if (typeof todayWorkMetrics840 !== 'function') missing.push('todayWorkMetrics840');
 if (missing.length) { console.error('Lighting scope: missing ' + missing.join(', ') + '; nothing changed'); return; }
 const build0 = buildAllAssets, asset0 = assetOf, lines0 = chargeLines, tidy0 = drawerTidy, groups0 = todayGroupDetails841,
  summary0 = todayWorkSummary848, model0 = progress881Model, held0 = renderToday_held;
 const text = v => String(v == null ? '' : v), html = v => typeof esc === 'function' ? esc(text(v)) : text(v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
 const day = v => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(v)); if (!m) return text(v); const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return t.getUTCDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t.getUTCMonth()] + ' ' + t.getUTCFullYear(); };
 const pctText = n => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, n)).toLocaleString('en-AU', {maximumFractionDigits: 2}) : '—';
 const list = (xs, last) => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' ' + (last || 'and') + ' ' + xs[xs.length - 1];
 const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

 /* 1. the projection: what each row is, worked out once per register build */
 let ctx = null; /* the rows the register leaves out, and the counts behind the words; refreshed by every build */
 const empty = () => ({rows: [], byKey: new Map(), keyed: 0, symbols: 0, screens: 0, aliases: []});
 function isScreen(a){ return !!a && a.origin === 'drawing' && a.drawing === SHEET && a.tower_series === 'circuit'; }
 function drawingOnly(a){
  if (!a || a.origin !== 'drawing' || a.drawing !== SHEET || !['keyed', 'circuit'].includes(a.tower_series) || (a.events || []).length) return false;
  const d = deliveryOf(a.key);
  return !assetNumbersOf(a).length && !rentalOf(a.key) && !d.done && !(d.recorded && d.state === 'on site') && !(unitsOf(a.key) || []).length;
 }
 function aliasOf(a, rows){
  if (!a || !a._added || !a.source_row || a.discipline !== 'Lighting towers') return null;
  const parent = rows.find(x => x.key === a.source_row && !x._cancelled && !x.relocation && !movedAway(x.key));
  if (!parent || parent.discipline !== 'Lighting towers') return null;
  const nums = assetNumbersOf(a), own = assetNumbersOf(parent);
  return nums.length && nums.every(n => own.includes(n)) ? {parent: parent.key, numbers: nums} : null;
 }
 function project(a, rows){
  const symbol = drawingOnly(a), alias = symbol ? null : aliasOf(a, rows);
  if (!symbol && !alias) return a;
  const out = Object.assign({}, a, {_mapContext894: symbol, _sourceAlias894: alias});
  /* a fan with no evidence against it is the big screen's symbol; one somebody has recorded a tower against stays a tower */
  if (symbol && isScreen(a)) Object.assign(out, {discipline: 'Big screens', product: 'Big Screen', item_types: ['Big Screen'], _screenSymbol894: true,
   name: 'Big screen ' + text(a.key).replace(/^\D+/, '') + ' · D024 drawing symbol'});
  return out;
 }
 buildAllAssets = function (){ /* v8.94 wrap: buildAllAssets */
  const rows = build0.apply(this, arguments), keep = [], out = [];
  for (const a of rows) { const p = project(a, rows); (p._mapContext894 || p._sourceAlias894 ? out : keep).push(p); }
  ctx = {rows: out, byKey: new Map(out.map(a => [a.key, a])), keyed: rows.filter(a => a.drawing === SHEET && a.tower_series === 'keyed' && !a._cancelled).length,
   symbols: out.filter(a => a._mapContext894).length, screens: out.filter(a => a._screenSymbol894).length,
   aliases: out.filter(a => a._sourceAlias894).map(a => ({key: a.key, parent: a._sourceAlias894.parent}))};
  return keep;
 };
 function context(){ if (!ctx) { try { allAssets(); } catch (e) {} } return ctx || empty(); }
 function contextOf(key){ return context().byKey.get(key) || null; }
 /* the register's own lookup first; a row the register leaves out is still found, so a pin, a link or the finder opens it */
 assetOf = function (key){ return asset0.apply(this, arguments) || contextOf(key); }; /* v8.94 wrap: assetOf */
 chargeLines = function (a){ return a && (a._mapContext894 || a._sourceAlias894) ? [] : lines0.apply(this, arguments); }; /* v8.94 wrap: chargeLines */
 try { if (typeof ASSETS_HELD !== 'undefined' && ASSETS_HELD) HELD_STALE775 = true; } catch (e) {} /* a list built before this ran is rebuilt on its next read */

 /* 2. the audit behind the words: the towers on record, the map's scope by location, what each location credits */
 const scopeOk = c => !!c && Number.isInteger(Number(c.towers)) && Number(c.towers) > 0 && Array.isArray(c.groups) && c.groups.length > 0
  && c.groups.every(g => g && Number.isInteger(Number(g.scope)) && Number(g.scope) > 0 && Array.isArray(g.records) && text(g.name))
  && c.groups.reduce((n, g) => n + Number(g.scope), 0) === Number(c.towers);

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

 function audit(asOf, suppliedArea){
  const d = asOf || todayWorkDay841();
  const read = () => {
   const register = allAssets(), c = context();
   const towers = register.filter(a => !a._cancelled && a.discipline === 'Lighting towers' && !a.relocation && !a.rest_of && !movedAway(a.key));
   const native = suppliedArea || todayWorkMetrics840(d).find(a => a.id === 'lighting');
   const p = lighting894ProjectVerified(native && native.rows || [], towers, CONFIRMED, assetNumbersOf);
   const confirmed = scopeOk(CONFIRMED) && p.confirmed;
   const invalid = CONFIRMED && !confirmed ? 'the scope confirmation is invalid, so the scope stays unconfirmed' : null;
   const groups = p.groups.map(g => ({...g, records: g.records.map(r => {
    const dd = deliveryAsOf(r.key, d);
    return {...r, onSite: !!(dd && dd.recorded && (dd.state === 'on site' || dd.done)),
     state: r.review ? 'review required' : r.done ? 'complete' : dd && dd.recorded ? text(dd.state) : 'no record'};
   })}));
   const scope = confirmed ? Number(CONFIRMED.towers) : null;
   return {...p, asOf: d, keyed: c.keyed, symbols: c.symbols, screens: c.screens,
    aliases: c.aliases.concat(p.aliases.map(a => ({key: a.key, parent: a.parents.join(', ')}))), boq: BOQ,
    confirmed, confirmation: confirmed ? CONFIRMED : null, invalid, groups, scope,
    left: confirmed ? scope - p.credited : null,
    surplus: groups.filter(g => g.surplus > 0), state: confirmed ? 'confirmed' : 'unconfirmed'};
  };
  return suppliedArea ? read() : heldMemo('lighting894|' + d, read);
 }

 const W = {
  rows: a => a.rows.map(r => r.key + (r.units == null ? ' (quantity unconfirmed)' : r.units > 1 ? ' ×' + r.units : '')).join(', ') || 'none',
  boq: a => a.boq != null ? 'The Schedule (5) BOQ lists ' + plural(a.boq, 'light tower', 'light towers') + '.' : 'The Schedule (5) BOQ reconciliation is still to be done.',
  symbols: a => (a.screens ? a.screens + ' circuit light-spread fans on D024 are big-screen symbols (' + SETTLED + ')' : 'the D024 drawing-only symbols are map context')
   + (a.aliases.length ? ', and ' + list(a.aliases.map(x => x.key)) + (a.aliases.length === 1 ? ' is a copy counted with ' : ' are copies counted with ') + list([...new Set(a.aliases.map(x => x.parent))]) : '')
   + '; ' + (a.screens && a.aliases.length ? 'neither adds' : 'none of them adds') + ' a tower.',
  who: a => a.confirmation ? 'by ' + text(a.confirmation.by) + ' on ' + day(a.confirmation.on) : '',
  quote: a => a.confirmation && a.confirmation.words ? ' — “' + text(a.confirmation.words) + '”' : '',
  invalid: a => a.invalid ? ' ' + a.invalid.charAt(0).toUpperCase() + a.invalid.slice(1) + '.' : '',
  places: a => a.groups.map(g => g.scope + ' at the ' + g.name).join('; '),
  keys: g => g.records.map(r => r.key).join(', '),
  group: g => g.records.some(r => r.review) ? W.keys(g) + ' requires review, ' + g.credited + ' verified complete credited'
   : g.delivered > 0 ? W.keys(g) + ': ' + g.delivered + ' verified complete, credited ' + g.credited + (g.surplus ? ', ' + g.surplus + ' surplus to the plan' : '')
   : g.records.some(r => r.onSite) ? W.keys(g) + ' on site, not yet complete, credited 0'
   : g.records.every(r => !r.present) ? 'no record on the register yet, credited 0'
   : W.keys(g) + (g.records.length === 1 ? ' is' : ' are') + ' not on site, credited 0',
  place: g => g.records.some(r => r.review) ? W.keys(g) + ' at the ' + g.name + ' requires review, ' + g.credited + ' verified complete credited'
   : g.delivered > 0 ? W.keys(g) + ': ' + g.delivered + ' verified complete at the ' + g.name + ', credited ' + g.credited + (g.surplus ? ', ' + g.surplus + ' surplus to the plan' : '')
   : g.records.some(r => r.onSite) ? W.keys(g) + ' at the ' + g.name + ' on site, not yet complete, credited 0'
   : g.records.every(r => !r.present) ? 'no record yet at the ' + g.name + ', credited 0'
   : W.keys(g) + ' at the ' + g.name + (g.records.length === 1 ? ' is' : ' are') + ' not on site, credited 0',
  today: a => 'today ' + a.credited + ' of ' + a.scope + ' (' + a.groups.map(W.place).join('; ') + ')',
  /* the surplus is a quantity on record against the map's scope, apart from completion */
  surplusNote: g => W.keys(g) + ' has ' + plural(g.recorded, 'tower', 'towers') + ' on record for the ' + g.name + '; D024 needs ' + g.scope + ', so ' + g.surplus + (g.surplus === 1 ? ' is' : ' are') + ' surplus to the plan.',
  surplusWords: a => a.surplus.map(W.surplusNote).join(' '),
  tag: a => a.confirmed ? 'Counted against the map’s ' + a.scope + ' towers' : 'Complete in recorded scope · scope unconfirmed',
  chipTitle: a => a.confirmed ? 'Counted against the map’s scope: the ' + a.scope + ' lighting towers keyed on D024 (' + W.places(a) + '), confirmed ' + W.who(a) + '. ' + a.credited + ' of ' + a.scope + ' credited today.'
   : 'Complete in recorded scope: ' + a.complete + ' of ' + a.recorded + ' towers on record. The job’s lighting scope is unconfirmed (' + a.recorded + ' on record, D024 keys ' + a.keyed + ').' + W.invalid(a),
  chipAria: (a, pct) => a.confirmed ? 'Lighting: ' + pct + '% complete, counted against the map’s ' + a.scope + ' towers (' + a.credited + ' credited). Scope confirmed ' + W.who(a) + '. Go to the Lighting card.'
   : 'Lighting: ' + pct + '% complete in recorded scope, ' + a.complete + ' of ' + a.recorded + ' towers on record. The job’s lighting scope is unconfirmed. Go to the Lighting card.',
  card: a => a.confirmed ? 'Counted against the map’s ' + a.scope + ' keyed towers on D024 — ' + a.groups.map(g => g.scope + ' at the ' + g.name).join(', ') + ' — confirmed ' + W.who(a) + '.'
   : 'Scope unconfirmed: ' + a.recorded + ' towers on record, D024 keys ' + a.keyed + '; ' + (a.boq != null ? 'Schedule (5) BOQ ' + a.boq : 'Schedule (5) BOQ reconciliation still to be done') + '. The reading covers recorded equipment only.' + W.invalid(a),
  whole: 'Whole job unavailable until the Lighting scope is confirmed',
  lights: 'Whole job unavailable until the Lighting scope is confirmed. No milestone lights are lit.',
  basis: a => a.confirmed
   ? ' Lighting is counted against the map’s scope: the ' + a.scope + ' lighting towers keyed on D024 (' + W.places(a) + '), confirmed ' + W.who(a) + W.quote(a) + '. Each location credits the towers verified complete at it (complete on the record, a known quantity, no conflict), up to the number D024 keys there: ' + W.today(a) + '.'
    + (a.surplus.length ? ' ' + W.surplusWords(a) + (a.confirmation.surplus && a.confirmation.surplus.words ? ' (' + day(a.confirmation.surplus.on || a.confirmation.on) + ': “' + text(a.confirmation.surplus.words) + '”)' : '') : '')
    + ' The ' + W.symbols(a).replace(/^the /, '') + ' ' + W.boq(a)
   : ' Lighting counts complete towers over unique recorded equipment: ' + W.rows(a) + ' — ' + a.recorded + ' towers, ' + a.complete + ' complete. D024 keys ' + a.keyed + ' lighting callouts; ' + W.symbols(a) + ' ' + W.boq(a)
    + ' Until the job’s lighting scope is confirmed, Lighting reads as complete in recorded scope and the whole-job figure is unavailable: the seven-group average needs every group’s scope settled, and an unconfirmed total is not a minimum, so no ≥ is shown.' + W.invalid(a),
  fold: a => a.confirmed
   ? 'Lighting scope: the map’s ' + a.scope + ' keyed towers on D024, confirmed ' + W.who(a) + '. ' + a.groups.map(g => g.name.charAt(0).toUpperCase() + g.name.slice(1) + ': D024 keys ' + g.scope + '; ' + W.group(g) + '.').join(' ')
    + ' ' + a.recorded + ' towers on current equipment references (' + W.rows(a) + '). ' + W.symbols(a).replace(/^./, ch => ch.toUpperCase()) + ' ' + W.boq(a)
   : 'Lighting scope: ' + a.recorded + ' towers on current equipment references (' + W.rows(a) + '); D024 keys ' + a.keyed + ' lighting callouts. ' + W.boq(a) + ' ' + W.symbols(a).replace(/^./, ch => ch.toUpperCase())
    + ' The scope is unconfirmed, so the percentage covers recorded equipment only.' + W.invalid(a),
  summaryBasis: a => a.confirmed ? ' Counted against the map’s scope: the ' + a.scope + ' lighting towers keyed on D024, confirmed ' + W.who(a) + '; each location credits the towers verified complete at it, up to the number D024 keys there.' + (a.surplus.length ? ' ' + W.surplusWords(a) : '')
   : ' The job’s lighting scope is unconfirmed: ' + a.recorded + ' towers on record, D024 keys ' + a.keyed + '; ' + W.boq(a) + ' This percentage covers unique recorded equipment only.' + W.invalid(a)
 };

 /* 3. the readings: Lighting against the map's scope when it is confirmed; over recorded scope, labelled, when it is not */
 let last = null, lastModel = null; /* the summary the model is about to read, and the model the card just drew: no second pass */
 todayWorkSummary848 = function (...args){ /* v8.94 wrap: todayWorkSummary848 */
  const r = summary0.apply(this, args), x = r && r.byId && r.byId.lighting;
  if (x && r.health && r.health.ready) try {
   const a = audit(args[0] || r.asOf, Array.isArray(args[1]) ? args[1].find(a => a.id === 'lighting') : null); x.scope894 = a;
   if (a.confirmed) {
    x.total = a.scope; x.done = a.credited; x.left = a.left; x.pct = a.pct; x.knownTotal = a.scope;
    x.pctKind = a.pctKind; x.pctLabel = a.review ? 'At least confirmed complete against the map’s scope' : 'Confirmed complete against the map’s scope';
    x.reviewRefs = a.reviewRefs;
    x.reviewQuantity = a.scopeRows.filter(row => row.recordedComplete && !row.complete).reduce((n, row) => n + row.quantity, 0);
    x.issues = [...new Set([...(x.issues || []), ...a.issues])];
   } else if (x.pctKind === 'confirmed' || x.pctKind === 'lower-bound') { x.pctKind = 'recorded-scope'; x.pctLabel = 'Complete in recorded scope'; }
   x.basis = text(x.basis) + W.summaryBasis(a);
  } catch (err) { console.error('Lighting scope', err); }
  last = r; return r;
 };
 progress881Model = function (...args){ /* v8.94 wrap: progress881Model */
  const m = model0.apply(this, args);
  try {
   const s = args[1] || (last && last.asOf === (args[0] || (m && m.day)) ? last : null), x = s && s.byId && s.byId.lighting, a = x && x.scope894;
   const row = m && Array.isArray(m.rows) ? m.rows.find(r => r.id === 'lighting') : null;
   if (row && a) {
    row.scope894 = a.state; row.audit894 = a;
    if (a.confirmed) row.basis = (a.review ? 'At least confirmed completion' : 'Confirmed completion') + ' against the map’s scope: ' + a.scope + ' towers keyed on D024, ' + W.who(a);
    else {
     const pct = typeof x.pct === 'number' && Number.isFinite(x.pct) ? Math.max(0, Math.min(100, x.pct)) : null;
     row.min = pct; row.max = pct; row.provisional = true; row.basis = 'Complete in recorded scope (unique recorded equipment); the job’s lighting scope is unconfirmed';
     m.ready = false; m.pct = null; m.reached = 0; m.allGreen = false; m.provisional = true; m.unavailable894 = 'lighting';
    }
   }
  } catch (err) { console.error('Lighting scope', err); }
  lastModel = m; return m;
 };
 todayGroupDetails841 = function (...args){ /* v8.94 wrap: todayGroupDetails841 */
  const r = groups0.apply(this, args);
  try { if (r && r.lighting && r.health && r.health.ready && Array.isArray(r.lighting.notes) && !r.lighting.notes.some(n => /^Lighting scope:/.test(text(n)))) r.lighting.notes.push(W.fold(audit(args[0] || r.asOf))); }
  catch (err) { console.error('Lighting scope', err); }
  return r;
 };

 /* 4. the same words where people read the Lighting figure: the Where we are chip and caption, its basis, and the Lighting card */
 function decorate(){
  const el = document.getElementById('where885'), chip = document.getElementById('w885-jump-lighting'), card = document.getElementById('tw840-card-lighting');
  if (!el && !card) return;
  const d = todayWorkDay841(), a = audit(d);
  const model = el ? (lastModel && lastModel.day === d ? lastModel : progress881Model(d)) : null, row = model && model.rows ? model.rows.find(r => r.id === 'lighting') : null;
  const pct = pctText(row ? row.min : null);
  if (chip && !chip.querySelector('.w894-scope')) {
   chip.insertAdjacentHTML('beforeend', '<span class="w894-scope" data-w894-state="' + html(a.state) + '">' + html(W.tag(a)) + '</span>');
   chip.setAttribute('aria-label', W.chipAria(a, pct)); chip.title = W.chipTitle(a);
  }
  if (el && model && !model.ready && model.unavailable894 === 'lighting') {
   const cap = el.querySelector('.w885-caption');
   if (cap && !cap.classList.contains('w894-whole')) { cap.textContent = W.whole; cap.classList.add('w894-whole'); }
   const lights = el.querySelector('.w885-lights[role="img"]');
   if (lights && lights.getAttribute('aria-label') !== W.lights) lights.setAttribute('aria-label', W.lights);
   const sr = el.querySelector('.w885-reading .w885-sr');
   if (sr && !sr.dataset.w894) { sr.textContent = 'Unavailable until the Lighting scope is confirmed'; sr.dataset.w894 = '1'; }
  }
  const basis = el && el.querySelector('.w885-basis p');
  if (basis && !basis.dataset.w894) { basis.textContent += W.basis(a); basis.dataset.w894 = a.state; }
  if (card) {
   /* full-width lines under the card's header row (icon · name · Play), never inside it */
   const head = card.querySelector('.tw840-top') || card.querySelector('.tw840-scope');
   if (head && !card.querySelector('.w894-card-scope')) head.insertAdjacentHTML('afterend', '<div class="w894-card-notes"><p class="w894-card-scope" data-w894-state="' + html(a.state) + '">' + html(W.card(a)) + '</p>'
    + (a.surplus.length ? '<p class="w894-card-over">' + html(W.surplusWords(a)) + '</p>' : '') + '</div>');
   const lamps = card.querySelector('.tw846-lights[role="img"]');
   if (lamps && !a.confirmed && /confirmed complete/.test(lamps.getAttribute('aria-label') || '')) lamps.setAttribute('aria-label', lamps.getAttribute('aria-label').replace('confirmed complete', 'complete in recorded scope'));
  }
 }
 renderToday_held = function (...args){ const r = held0.apply(this, args); try { decorate(); } catch (err) { console.error('Lighting scope', err); } return r; }; /* v8.94 wrap: renderToday_held */

 /* 5. the drawer says what the row is; a source row names the copy counted with it, and any surplus against the map */
 function notice(a){
  const dr = document.getElementById('drawer'); if (!dr || !a || dr.querySelector('.lighting894-notice')) return;
  let words = null, open = null;
  if (a._sourceAlias894) words = a.key + ' is a copy of ' + a._sourceAlias894.parent + ' — counted with ' + a._sourceAlias894.parent + '. Its asset number is one of ' + a._sourceAlias894.parent + '’s, so this row adds no tower to the Lighting count; its own history stays here.';
  else if (a._screenSymbol894) words = 'D024 big-screen symbol — map context only (' + SETTLED + '). The sheet’s legend lists big screens apart from lighting towers and numbers them beside these light-spread fans; this is not a lighting tower and is not counted as one.';
  else if (a._mapContext894) words = 'D024 lighting callout — map context only. No asset number, hire or delivery is recorded against it, so it is not counted as a supplied tower. Record one here and it joins the Lighting count.';
  else {
   const parts = [], copies = context().aliases.filter(x => x.parent === a.key);
   if (copies.length) { parts.push(list(copies.map(x => x.key)) + (copies.length === 1 ? ' is a copy of this row (same asset number) and is counted here.' : ' are copies of this row (same asset numbers) and are counted here.')); open = copies.map(x => x.key); }
   try { const au = audit(todayWorkDay841()); au.surplus.filter(g => g.records.some(r => r.key === a.key)).forEach(g => parts.push(W.surplusNote(g))); } catch (e) {}
   if (parts.length) words = parts.join(' ');
  }
  if (!words) return;
  const p = document.createElement('p'); p.className = 'lighting894-notice'; p.dataset.kind = a._sourceAlias894 ? 'copy' : a._screenSymbol894 ? 'screen' : a._mapContext894 ? 'callout' : 'source';
  p.textContent = words;
  (open || []).forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.className = 'linkish'; b.textContent = 'Open ' + k; b.setAttribute('aria-label', 'Open ' + k); b.onclick = ev => { ev.stopPropagation(); if (typeof openAsset === 'function') openAsset(k); }; p.append(' ', b); });
  const body = dr.querySelector('.db') || dr;
  body.prepend(p);
  /* the drawer's own composition prepends its status card and its Prev/Next after this runs; the notice is read first */
  queueMicrotask(() => { if (p.isConnected && body.firstChild !== p) body.prepend(p); });
 }
 drawerTidy = function (a){ const r = tidy0.apply(this, arguments); try { notice(a); } catch (err) { console.error('Lighting scope', err); } return r; }; /* v8.94 wrap: drawerTidy */

 window.Lighting894 = {
  version: 'v8.94', audit, decorate, contextOf, mapList: () => allAssets().concat(context().rows), context: () => context(), confirmation: CONFIRMED,
  report: () => { const a = audit(todayWorkDay841()), chip = document.getElementById('w885-jump-lighting'), card = document.getElementById('tw840-card-lighting'), el = document.getElementById('where885');
   return {version: 'v8.94', state: a.state, scope: a.scope, credited: a.credited, left: a.left, pct: a.pct, recorded: a.recorded, complete: a.complete, keyed: a.keyed, symbols: a.symbols, screens: a.screens, aliases: a.aliases, boq: a.boq, invalid: a.invalid,
    groups: a.groups.map(g => ({name: g.name, scope: g.scope, records: g.records.map(r => r.key + ':' + r.units + ':' + r.state), recorded: g.recorded, delivered: g.delivered, credited: g.credited, surplus: g.surplus})),
    chip: chip ? chip.querySelectorAll('.w894-scope').length : 0, card: card ? card.querySelectorAll('.w894-card-scope').length : 0, over: card ? card.querySelectorAll('.w894-card-over').length : 0,
    whole: el ? el.querySelectorAll('.w894-whole').length : 0, basis: !!(el && el.querySelector('.w885-basis p') && el.querySelector('.w885-basis p').dataset.w894)}; }
 };
 try { decorate(); } catch (err) { console.error('Lighting scope', err); }
})();
