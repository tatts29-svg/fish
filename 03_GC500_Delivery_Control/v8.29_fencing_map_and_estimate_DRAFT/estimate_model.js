/* Author: Andrew Fisher. Private, pure programme estimate model. No record writes.
 * Native runtime integration: pass DATA.fencing, FCOL, fenceRateFor,
 * fenceCostFor and fenceQuote by reference. Do not replace any native helper.
 */
'use strict';

function fencingWorkingEstimate829(input) {
  const { fencing, columns, fenceRateFor, fenceCostFor, fenceQuote } = input;
  if (!fencing || !Array.isArray(columns) ||
      [fenceRateFor, fenceCostFor, fenceQuote].some(fn => typeof fn !== 'function')) {
    throw new TypeError('Native fencing data, columns and pricing/quote helpers are required.');
  }
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const quantity = v => {
    if (typeof v !== 'number' && typeof v !== 'string') return null;
    if (typeof v === 'string' && v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const canonicalUnit = unit => ({ m: 'm', each: 'each', hr: 'hr' })[unit] || null;
  const columnsByType = new Map(columns.filter(c => c.programme_type).map(c => [c.programme_type, c]));
  const byKey = new Map(columns.map(c => [c.key, c]));
  const unitOf = (type, column) => canonicalUnit(column && column.unit) || (/\(m\)/.test(type) ? 'm' : /Gates/.test(type) ? 'each' : null);
  const price = (column, unit, qty, side, mayValue, withheldReason) => {
    if (!column) return { amount: null, rate: null, state: 'unpriced', reason: 'No native rate category for this programme type.' };
    const native = (side === 'Revenue' ? fenceRateFor : fenceCostFor)(column.key);
    if (!native || typeof native !== 'object') return { amount: null, rate: null, state: 'unpriced', reason: 'Native rate helper returned no rate.' };
    const rate = quantity(native.value);
    const card = native.card || column;
    // A native typed rate is expressed in the column's quantity unit. The native
    // cost helper itself blocks the untyped $/hr relocation rate on a metre row.
    const rateUnit = side === 'Direct costs' && native.source !== 'typed'
      ? canonicalUnit(card.cost_unit || card.unit)
      : canonicalUnit(card.unit);
    const basis = { rate, rateUnit, source: native.source || null, by: native.by || null,
      at: native.at || null, inclusion: native.inclusion ? { ...native.inclusion } : null,
      hourlyRate: quantity(native.hourly) };
    if (qty == null) return { ...basis, amount: null, state: 'unpriced', reason: 'Invalid or missing quantity.' };
    if (!unit || rateUnit !== unit) return { ...basis, amount: null, state: 'unpriced', reason: 'Rate unit does not match planning quantity; hours or a matching native typed rate are required.' };
    if (rate == null) return { ...basis, amount: null, state: 'unpriced', reason: 'No applicable native rate.' };
    if (native.source === 'included' && rate === 0) return { ...basis, amount: 0, state: 'included', reason: 'No separate customer charge; included in the per-metre price.' };
    if (!mayValue) return { ...basis, amount: null, state: 'withheld', reason: withheldReason };
    return { ...basis, amount: round(qty * rate), state: 'estimated', reason: 'Planning quantity at the current native rate; AUD ex GST.' };
  };
  const base = {
    author: 'Andrew Fisher', currency: 'AUD', gstBasis: 'ex GST',
    title: 'Fencing working estimate', grandTotal: null,
    quantityLabel: 'Programme work quantities — includes reused stock',
    hireReconciliationLabel: 'Hire stock to reconcile',
    fullJobQuote: false, uniqueHireInventoryEstablished: false,
    completionEvidenceUsed: false,
    exclusions: [
      'Programme movements are not unique hire inventory; stockpile, reuse, installation and removal may refer to the same stock.',
      'Labour hours, team-leader basis, transport and unquantified work are not established by these programme totals.',
      'No ledger, native quote, rates, quantities, overrides, approvals or completion records are changed.'
    ]
  };
  const existing = fenceQuote();
  if (existing && existing.qty) {
    const lines = Object.entries(existing.qty).map(([key, value]) => {
      const column = byKey.get(key), qty = quantity(value), unit = canonicalUnit(column && column.unit);
      return { key, name: column ? column.name_as_written : key, unit,
        planningQuantity: qty, uniqueHireQuantity: null, quantityBasis: 'existing native quote',
        Revenue: price(column, unit, qty, 'Revenue', true),
        directCosts: price(column, unit, qty, 'Direct costs', true) };
    });
    return { ...base, mode: 'existing-native-quote', title: 'Existing fencing quote',
      quoteWhere: existing._where || null, quote: { ...existing, qty: { ...existing.qty } },
      lines, excludedReferenceSheets: [],
      message: 'The existing native fencing quote takes precedence. Per-line values use current native rates; this helper adds no programme quantities or grand total.' };
  }
  const groups = new Map(), excludedReferenceSheets = [], sourceIssues = [], preservedUpdates = [];
  const invalidTypes = new Set();
  (fencing.week_sheets || []).forEach((sheet, sheetIndex) => {
    const path = `DATA.fencing.week_sheets[${sheetIndex}]`;
    if (sheet.rolled_forward !== true || sheet.year !== 2026 || /decon|deconstruction/i.test(`${sheet.sheet} ${sheet.phase}`)) {
      excludedReferenceSheets.push({ sheet: sheet.sheet, year: sheet.year, sourcePath: path,
        quantities: { ...(sheet.totals || {}) }, reason: 'Demob/reference programme; not current 2026 unique hire or priced scope.' });
      return;
    }
    if (sheet.plan_update) preservedUpdates.push({ sheet: sheet.sheet,
      sourcePath: `${path}.plan_update`, file: sheet.plan_update.file || null,
      sha256: sheet.plan_update.sha256 || null, sha256_16: sheet.plan_update.sha256_16 || null,
      basis: sheet.totals_basis || sheet.plan_update.basis || null });
    Object.entries(sheet.totals || {}).forEach(([type, value]) => {
      const qty = quantity(value), sourcePath = `${path}.totals[${JSON.stringify(type)}]`;
      if (qty == null) { invalidTypes.add(type); sourceIssues.push({ sourcePath, type, reason: 'Invalid quantity; category amount withheld.' }); return; }
      if (!qty) return;
      const column = columnsByType.get(type);
      if (!groups.has(type)) groups.set(type, { key: column ? column.key : null, name: type,
        unit: unitOf(type, column), planningQuantity: 0, uniqueHireQuantity: null,
        quantityBasis: 'Programme work quantities — includes reused stock',
        sourceRows: [], workCategory: /Relocation/.test(type) ? 'relocation service' : /Removal/.test(type) ? 'removal work' : 'installation / stock / reuse scope' });
      const group = groups.get(type);
      group.planningQuantity += qty;
      group.sourceRows.push({ sheet: sheet.sheet, phase: sheet.phase, quantity: qty, sourcePath,
        basis: sheet.totals_basis || null, updatedPlan: !!sheet.plan_update });
    });
  });
  const lines = Array.from(groups.values()).map(group => {
    const column = columnsByType.get(group.name);
    const service = group.key === 'relocation' || group.key === 'removal';
    const reason = 'Hire amount withheld: programme work movements do not establish unique chargeable hire inventory.';
    const qty = invalidTypes.has(group.name) ? null : round(group.planningQuantity);
    return { ...group, planningQuantity: qty,
      Revenue: price(column, group.unit, qty, 'Revenue', service, reason),
      directCosts: price(column, group.unit, qty, 'Direct costs', service, reason) };
  });
  return { ...base, mode: 'programme-work-movements', lines, sourceIssues,
    excludedReferenceSheets, preservedUpdates,
    message: 'Hire stock to reconcile. Service estimates use the units shown; gates and removal follow the native included-price rules.' };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { fencingWorkingEstimate829 };
