'use strict';
// Author: Andrew Fisher. Read-only financial assertions; this module performs no I/O.
// Inputs and failure details may contain private money. Persist failures only privately.
// auditFinancial944({models, contracts, units, accounts}, after, options)
// Aliases contractRows / ownershipRows / accruals are also accepted.
// models: the 16 named snapshots from the money audit. contractRows: [{rental,line,
// owner,charge}], where charge is a native contractCharge result or its amount.
// ownershipRows: flat rows or {ref: rows[]}; accruals: one acc761Model, an array,
// or an object keyed by month. Missing required inputs fail, rather than pass silently.

const MODEL_NAMES = Object.freeze(['money', 'costsJob', 'pnl', 'branches', 'transport',
  'reconciliation', 'rehire', 'contracts', 'quotes', 'labourRevenue', 'labourAllowance',
  'forecastBuildings', 'handover', 'costRows', 'costTotals', 'assets']);
const DEFAULT_CONTRACTS = Object.freeze(['9961976:31', '9961976:34']);
const DEFAULT_PLANT_CONTRACTS = Object.freeze(['9961976:31']);
const own = (x, k) => x != null && Object.prototype.hasOwnProperty.call(x, k);
const finite = n => typeof n === 'number' && Number.isFinite(n);
const round = n => Math.round(n * 100) / 100;
const canonical = x => Array.isArray(x) ? '[' + x.map(canonical).join(',') + ']'
  : x && typeof x === 'object' ? '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}'
    : JSON.stringify(x);
const equal = (a, b) => canonical(a) === canonical(b);
const without = (x, fields) => Object.fromEntries(Object.entries(x || {}).filter(([k]) => !fields.includes(k)));
const text = x => String(x == null ? '' : x).trim();
const keyOf = r => text(r.rental == null ? r.rental_contract : r.rental) + ':' + text(r.line);
const amountOf = r => r && r.charge && typeof r.charge === 'object' ? r.charge.amount : r && r.charge;
function ownerOf(value) {
  const raw = value && typeof value === 'object' ? value.owner : value;
  return text(raw).toLowerCase().replace(/^other:/, '').replace(/[ _]+/g, '-');
}
function unnamed(value) {
  return /^(?:|unknown|owner-to-confirm|supplier-not-named|supplier-not-on-the-record|supplier-to-confirm|unnamed-supplier)$/.test(ownerOf(value));
}
const coates = value => /^(?:coates|coates-hire)$/.test(ownerOf(value));
const sorted = xs => xs.slice().sort((a, b) => canonical(a).localeCompare(canonical(b)));
const sum = (xs, k) => round(xs.reduce((n, x) => n + (finite(x[k]) ? x[k] : 0), 0));

function auditFinancial944(before, after, options = {}) {
  const failures = [], review = [], checks = [];
  let present = [];
  const check = (name, ok, expected, actual) => {
    checks.push({name, ok: !!ok});
    if (!ok) failures.push({name, expected, actual});
  };
  const same = (name, a, b) => check(name, equal(a, b), a, b);
  const near = (name, actual, expected, tolerance = 0.000001) =>
    check(name, finite(actual) && finite(expected) && Math.abs(actual - expected) <= tolerance, expected, actual);
  const B = before && (before.models || before), A = after && (after.models || after);
  if (!B || !A) {
    check('Both model snapshots exist', false, 'before and after objects', {before: !!B, after: !!A});
    return result();
  }
  present = MODEL_NAMES.filter(k => {
    check('Model present: ' + k, own(B, k) && own(A, k), true, {before: own(B, k), after: own(A, k)});
    return own(B, k) && own(A, k);
  });
  const bRows = before.contractRows || before.contracts, aRows = after.contractRows || after.contracts;
  check('Per-contract snapshots supplied', Array.isArray(bRows) && Array.isArray(aRows), 'two arrays', {before: typeof bRows, after: typeof aRows});
  const bm = new Map((Array.isArray(bRows) ? bRows : []).map(r => [keyOf(r), r]));
  const am = new Map((Array.isArray(aRows) ? aRows : []).map(r => [keyOf(r), r]));
  if (Array.isArray(bRows) && Array.isArray(aRows)) {
    check('Contract snapshot identities unique', bm.size === bRows.length && am.size === aRows.length, true, {before: bm.size, after: am.size});
    same('Same contract lines', [...bm.keys()].sort(), [...am.keys()].sort());
    for (const [key, b] of bm) {
      const a = am.get(key); if (!a) continue;
      same('Native contract charge unchanged: ' + key, b.charge, a.charge);
      if (!unnamed(b.owner) && !coates(b.owner)) same('Named contract supplier retained: ' + key, ownerOf(b.owner), ownerOf(a.owner));
      else check('Unconfirmed contract owner is Coates: ' + key, coates(a.owner), 'coates', ownerOf(a.owner));
    }
  }
  const affected = options.reclassifiedContracts || DEFAULT_CONTRACTS;
  const marked = options.plantContracts || DEFAULT_PLANT_CONTRACTS;
  let delta = 0, plantDelta = 0, unpriced = 0, plantUnpriced = 0;
  for (const key of affected) {
    const b = bm.get(key), a = am.get(key);
    check('Reclassified contract exists: ' + key, !!b && !!a, true, {before: !!b, after: !!a});
    if (!b || !a) continue;
    const amount = amountOf(b);
    check('Reclassified charge finite or unpriced: ' + key, amount == null || finite(amount), 'finite number or null', amount);
    if (finite(amount)) delta += amount; else unpriced++;
    if (marked.includes(key)) { if (finite(amount)) plantDelta += amount; else plantUnpriced++; }
    check('Reclassified contract now Coates: ' + key, coates(a.owner), 'coates', ownerOf(a.owner));
  }
  delta = round(delta); plantDelta = round(plantDelta);

  // Everything except the three classification models must retain all values.
  // One known obsolete explanatory clause is permitted in Costs to job end.
  for (const key of present.filter(k => !['pnl', 'branches', 'rehire'].includes(k))) {
    if (key === 'costsJob') {
      const clean = x => ({...x, gaps: (x.gaps || []).map(g => ({...g,
        what: text(g.what).replace(/ and the 5 t forklift hired in/g, '')}))});
      same('Unchanged model: costsJob (obsolete forklift clause excluded)', clean(B[key]), clean(A[key]));
    } else if (key === 'transport') {
      // The transport snapshot embeds the same P&L and Costs-to-job-end models.
      // Verify each copy against its independently audited canonical model, then
      // retain a strict comparison of every other transport field.
      for (const [embedded, canonicalName] of [['P', 'pnl'], ['X', 'costsJob']]) {
        same('Original transport embedded model matches canonical: ' + embedded, B[canonicalName], B.transport[embedded]);
        same('Updated transport embedded model matches canonical: ' + embedded, A[canonicalName], A.transport[embedded]);
      }
      same('Unchanged transport fields outside verified model copies', without(B.transport, ['P', 'X']), without(A.transport, ['P', 'X']));
    } else same('Unchanged model: ' + key, B[key], A[key]);
  }

  if (present.includes('branches')) {
    const oldBranches = new Map(B.branches.map(r => [r.code, r])), newBranches = new Map(A.branches.map(r => [r.code, r]));
    same('Same financial branches', [...oldBranches.keys()].sort(), [...newBranches.keys()].sort());
    for (const [code, b] of oldBranches) {
      const a = newBranches.get(code); if (!a) continue;
      if (code !== (options.reclassifiedBranch || 'NVAC')) { same('Unchanged branch: ' + code, b, a); continue; }
      const moving = ['plantLines', 'plantCharge', 'plantUnrated', 'plantWhat'];
      same('All other NVAC branch fields unchanged', without(b, moving), without(a, moving));
      near('NVAC plant Rehire charge decreases by marked-line charge', a.plantCharge, b.plantCharge - plantDelta);
      same('NVAC plant Rehire line count decreases', b.plantLines - marked.length, a.plantLines);
      same('NVAC plant unpriced count decreases only for unpriced marked lines', b.plantUnrated - plantUnpriced, a.plantUnrated);
      check('NVAC remaining plant descriptions are retained originals', Array.isArray(a.plantWhat) && a.plantWhat.every(v => b.plantWhat.includes(v)), 'subset of original descriptions', a.plantWhat);
      if (a.plantLines === 0) same('No current unnamed plant descriptions remain', [], a.plantWhat);
    }
  }

  if (present.includes('rehire')) {
    const b = B.rehire, a = A.rehire;
    const removed = (b.groups || []).filter(g => g.branch === (options.reclassifiedBranch || 'NVAC') && unnamed(g.supplier));
    check('Expected unnamed Rehire group identified', removed.length > 0, 'at least one scoped group', removed.length);
    near('Removed Rehire revenue equals contract delta', sum(removed, 'rev'), delta);
    same('Removed Rehire lines match affected contracts', affected.length, removed.reduce((n, g) => n + g.lines, 0));
    check('Removed groups contain no supplier costs or future money', removed.every(g => (g.cost == null || g.cost === 0) && !g.costToCome && !g.revToCome && !g.installation), true, removed.map(g => ({cost: g.cost, costToCome: g.costToCome, revToCome: g.revToCome, installation: g.installation})));
    const retained = (b.groups || []).filter(g => !removed.includes(g));
    const semantic = g => without(g, ['basis', 'rule', 'notes']);
    same('Every named Rehire group and its financial fields retained', sorted(retained.map(semantic)), sorted((a.groups || []).map(semantic)));
    for (const k of ['asAt', 'revenueNow', 'revenueJob']) same('Rehire overall job context unchanged: ' + k, b[k], a[k]);
    for (const k of ['rev', 'revJob']) near('Rehire total decrease: ' + k, a.totals[k], b.totals[k] - delta);
    for (const k of ['revToCome', 'cost', 'costToCome', 'costJob']) same('Rehire amount unchanged: ' + k, b.totals[k], a.totals[k]);
    same('Rehire line count decreases', b.totals.lines - affected.length, a.totals.lines);
    same('Rehire missing-cost count decreases only for removed groups', b.totals.costMissing - removed.filter(g => g.cost == null).length, a.totals.costMissing);
    for (const [k, denominator, numerator] of [['share', a.revenueJob, a.totals.revJob], ['shareNow', a.revenueNow, a.totals.rev]]) {
      if (denominator) near('Rehire share reconciles: ' + k, a.totals[k], numerator / denominator, 1e-10);
      else same('Rehire share retains null for no denominator: ' + k, null, a.totals[k]);
    }
    const rebuild = groups => {
      const by = new Map();
      groups.forEach(g => {
        const v = by.get(g.branch) || {branch: g.branch, groups: 0, revJob: 0, costJob: 0, costMissing: 0};
        v.groups++; v.revJob = round(v.revJob + (g.revJob || 0)); v.costJob = round(v.costJob + (g.costJob || 0));
        if (g.cost == null) v.costMissing++; by.set(g.branch, v);
      });
      return sorted([...by.values()]);
    };
    same('Rehire branch model reconciles with retained groups', rebuild(a.groups || []), sorted(a.byBranch || []));
    const destination = options.coverageDestination || 'notCounted';
    for (const k of ['lines', 'coatesOwn', 'notCounted', 'inGroups']) {
      const adjustment = k === 'inGroups' ? -affected.length : k === destination ? affected.length : 0;
      same('Contract coverage: ' + k, b.coverage[k] + adjustment, a.coverage[k]);
    }
    check('Every contract line remains covered exactly once', a.coverage.adds === true && a.coverage.lines === a.coverage.inGroups + a.coverage.notCounted + a.coverage.coatesOwn, true, a.coverage);
    const oldOther = new Map((b.others || []).map(g => [g.branch + '|' + g.family, g]));
    const newOther = new Map((a.others || []).map(g => [g.branch + '|' + g.family, g]));
    const movedOther = (options.reclassifiedBranch || 'NVAC') + '|forklift';
    for (const key of new Set([...oldOther.keys(), ...newOther.keys()])) {
      if (key !== movedOther || destination !== 'notCounted') { same('Unchanged other hire group: ' + key, oldOther.get(key), newOther.get(key)); continue; }
      const old = oldOther.get(key) || {n: 0, rev: 0, items: []}, next = newOther.get(key);
      check('Reclassified lines visible in other hire group', !!next, true, !!next);
      if (next) {
        same('Other Coates hire line count increases', old.n + affected.length, next.n);
        near('Other Coates hire charge increases by delta', next.rev, old.rev + delta);
        check('Existing other-hire source item descriptions retained', old.items.every(v => next.items.includes(v)), true, next.items);
      }
    }
  }

  if (present.includes('pnl')) {
    const b = B.pnl, a = A.pnl, move = ['rev', 'rehireTotal', 'rhCover'];
    same('P&L totals, direct costs and recovery inputs unchanged', without(b, move), without(a, move));
    const old = new Map(b.rev.map(r => [r.key, r])), next = new Map(a.rev.map(r => [r.key, r]));
    same('Same P&L revenue lines', [...old.keys()].sort(), [...next.keys()].sort());
    for (const [key, row] of old) {
      const updated = next.get(key); if (!updated) continue;
      if (!['hire', 'rehire'].includes(key)) { same('Unchanged P&L revenue line: ' + key, row, updated); continue; }
      same('Hire/Rehire ledger identity unchanged: ' + key, without(row, ['now', 'job', 'basis', 'what']), without(updated, ['now', 'job', 'basis', 'what']));
      for (const k of ['now', 'job']) near('P&L transfer: ' + key + '.' + k, updated[k], row[k] + (key === 'hire' ? delta : -delta));
    }
    near('P&L source Rehire total decreases by delta', a.rehireTotal, b.rehireTotal - delta);
    if (present.includes('rehire')) {
      const R = A.rehire, denominator = R.totals.costJob + sum(R.groups, 'installation');
      if (denominator > 0) near('Rehire combined cover recalculated without changing its costs', a.rhCover, R.totals.revJob / denominator, 1e-10);
      else same('Rehire combined cover unavailable without costs', null, a.rhCover);
    }
    check('P&L native financial ties pass', Object.values(a.checks || {}).every(v => v !== false), true, a.checks);
  }

  auditOwnership(before.ownershipRows || before.units, after.ownershipRows || after.units);
  auditAccruals(before.accruals || before.accounts, after.accruals || after.accounts);
  return result();

  function auditOwnership(oldInput, nextInput) {
    const flatten = input => Array.isArray(input) ? input : input && typeof input === 'object'
      ? Object.entries(input).flatMap(([ref, rows]) => (Array.isArray(rows) ? rows : rows.rows || []).map(r => ({ref, ...r}))) : null;
    const old = flatten(oldInput), next = flatten(nextInput);
    check('Per-reference ownership snapshots supplied', !!old && !!next, 'arrays or reference maps', {before: !!old, after: !!next});
    if (!old || !next) return;
    const key = r => text(r.id) ? JSON.stringify([r.ref, r.id])
      : JSON.stringify([r.ref, text(r.nativeId), text(r.assetNo == null ? r.asset_no : r.assetNo), text(r.item)]);
    const groups = rows => { const m = new Map(); rows.forEach(r => { const k = key(r); m.set(k, (m.get(k) || []).concat(r)); }); return m; };
    const b = groups(old), a = groups(next);
    same('Same reference unit identities', [...b.keys()].sort(), [...a.keys()].sort());
    for (const [k, rows] of b) {
      const out = a.get(k) || []; same('Same unit count: ' + k, rows.length, out.length);
      const stable = r => Object.fromEntries(['id', 'ref', 'assetNo', 'asset_no', 'nativeId', 'item', 'sourceKey', 'source', 'physical', 'sourceToken'].filter(f => own(r, f)).map(f => [f, r[f]]));
      same('Unit identity, product and source unchanged: ' + k, sorted(rows.map(stable)), sorted(out.map(stable)));
      const legacyLabel = r => unnamed(r.owner) && /^Sub-hire:\s*Supplier not named$/i.test(text(r.label));
      const labels = r => ({item: r.item, label: r.label});
      const expectedLabels = rows.map(r => ({item: r.item, label: legacyLabel(r) ? r.item : r.label}));
      const actualLabels = out.map(r => {
        const original = rows.find(b => legacyLabel(b) && b.item === r.item);
        return original && coates(r.owner) && (r.label === original.label || r.label === original.item)
          ? {item: r.item, label: original.item} : labels(r);
      });
      same('Only obsolete unnamed-supplier label may become its existing item: ' + k, sorted(expectedLabels), sorted(actualLabels));
      same('Named per-unit owners retained; unknown owners default to Coates: ' + k,
        rows.map(r => unnamed(r.owner) || coates(r.owner) ? 'coates' : ownerOf(r.owner)).sort(),
        out.map(r => coates(r.owner) ? 'coates' : ownerOf(r.owner)).sort());
    }
    review.push('Per-unit ID/photo-alias and loading ownership tests remain the parent test’s responsibility; this helper checks owner, count, description and number.');
  }

  function auditAccruals(oldInput, nextInput) {
    const flatten = input => Array.isArray(input) ? input : input && Array.isArray(input.revenue) ? [input]
      : input && typeof input === 'object' ? Object.values(input) : null;
    const old = flatten(oldInput), next = flatten(nextInput);
    check('Finance month allocation snapshots supplied', !!old && !!next, 'acc761Model snapshots', {before: !!old, after: !!next});
    if (!old || !next) return;
    const a = new Map(next.map(m => [m.month, m]));
    same('Same accounting months', old.map(m => m.month).sort(), next.map(m => m.month).sort());
    const contractLabel = s => /^(?:Hire|Rehire|Toilet Hire|Toilet Rehire) Revenue — (?:daily contract|event) allocation$/.test(s);
    const sources = model => (model.revenue || []).flatMap(row => {
      const src = row.extra && row.extra.sources;
      if (!Array.isArray(src)) return [{missingSourceShape: true, row}];
      return src.map(source => ({branch: row.branch, stream: source.source === 'contract export' && contractLabel(row.stream) ? 'contract ownership allocation' : row.stream, source}));
    });
    for (const b of old) {
      const n = a.get(b.month); if (!n) continue;
      same('Accounting non-Revenue fields unchanged: ' + b.month, without(b, ['revenue']), without(n, ['revenue']));
      same('All accounting Revenue source amounts and evidence retained: ' + b.month, sorted(sources(b)), sorted(sources(n)));
      for (const [i, row] of (n.revenue || []).entries()) {
        const src = row.extra && row.extra.sources;
        check('Accounting source shape: ' + b.month + '/' + i, Array.isArray(src), true, !!src);
        if (!Array.isArray(src)) continue;
        near('Accounting group reconciles to unchanged source charges: ' + b.month + '/' + i, row.amount, sum(src, 'amount'));
      }
    }
    review.push('Accounting sources do not include contract/line IDs in native acc761Model. Parent must separately assert target Hire/Rehire labels for known Coates and named-supplier examples; source conservation and label-change scope are checked here.');
  }

  function result() {
    return {summary: {ok: failures.length === 0, checks: checks.length, passed: checks.filter(c => c.ok).length,
      failed: failures.length, modelsCompared: present.length,
      reclassifiedContracts: (options.reclassifiedContracts || DEFAULT_CONTRACTS).length, reviewItems: review.length},
    failures, review};
  }
}

module.exports = {auditFinancial944, MODEL_NAMES, DEFAULT_CONTRACTS, DEFAULT_PLANT_CONTRACTS};
