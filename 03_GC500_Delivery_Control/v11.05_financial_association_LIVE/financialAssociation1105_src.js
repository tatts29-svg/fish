/* Author: Andrew Fisher. One privately evidenced hire association; pure projection only. */
(function (root) {
  'use strict';
  const tag = 'financialAssociation1105';
  const rowFields = ['line','status_as_written','item_type_code','item','description','quantity','price','rate_1','rate_2','rate_3','rate_4','rate_5','expected_term_date','number_of_days','sales_analysis_code','contract_start','start_time_as_written','rate_type','delivery_number','booked_delivery_date','booked_pickup_date','minimum_days','serial','rate_id','rate_classification','hold_billing','rental_contract','branch_code','asset_no','asset_no_is_plant_number','what','family','kind','charge_line','subhired','supplier_sub_rental','start_date','start_time','term_date','demob_date','delivered'];
  const text = v => typeof v === 'string' ? v.trim() : String(v == null ? '' : v);
  const clone = v => JSON.parse(JSON.stringify(v));
  const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
  const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  const key = r => text(r.rental_contract) + '|' + r.line;
  const rateKey = r => 'c|' + key(r);
  const ensure = (ok, reason) => { if (!ok) throw Error(reason); };
  const object = x => x && typeof x === 'object' && !Array.isArray(x);
  const exactKeys = (x, allowed, required = allowed) => object(x) && Object.keys(x).every(k => allowed.includes(k)) && required.every(k => Object.hasOwn(x, k));
  const cents = x => typeof x === 'number' && Number.isFinite(x) && x >= 0 && Number.isSafeInteger(Math.round(x * 100)) && Math.abs(Math.round(x * 100) - x * 100) < 1e-7;
  const day = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
  function validate(input) {
    ensure(exactKeys(input, ['schema','mode','source','rawSourceRow','row','binding','financialRule','guards','status'], ['schema','mode','source','rawSourceRow','row','binding','financialRule']), 'Unexpected association fields');
    ensure(input.schema === 2 && input.mode === 'single-own-fleet-access-full-event-native-override', 'Unsupported association schema');
    const r = input.row, raw = input.rawSourceRow, b = input.binding, f = input.financialRule, s = input.source;
    ensure(exactKeys(raw, rowFields) && exactKeys(r, rowFields.concat('register_type')), 'Unexpected source row fields');
    ensure(exactKeys(s, ['file','sha256','sheet','row','cells','excluded_columns','basis']), 'Unexpected source provenance fields');
    ensure(/^[a-f0-9]{64}$/.test(s.sha256) && text(s.file) && text(s.sheet) && Number.isSafeInteger(s.row) && s.row > 1, 'Source provenance is incomplete');
    ensure(object(s.cells) && Object.keys(s.cells).every(k => rowFields.includes(k)) && ['rate_1','line','item','quantity'].every(k => /^[A-Z]+[1-9]\d*$/.test(s.cells[k] || '')) && Object.values(s.cells).every(c => /^[A-Z]+[1-9]\d*$/.test(c) && Number(c.match(/\d+$/)[0]) === s.row), 'Source cells are invalid');
    ensure(Array.isArray(s.excluded_columns) && s.excluded_columns.every(v => typeof v === 'string') && typeof s.basis === 'string', 'Source provenance is malformed');
    ensure(/^\d+$/.test(text(r.rental_contract)) && Number.isSafeInteger(r.line) && r.line > 0, 'Invalid source line identity');
    ensure(/^\d{5,9}$/.test(text(r.asset_no)) && r.asset_no_is_plant_number === true && text(r.item) === text(r.asset_no), 'Exact fleet identity is required');
    ensure(r.quantity === 1 && cents(r.rate_1) && r.kind === 'access' && r.family === 'access' && r.charge_line === false && r.subhired === false && r.supplier_sub_rental === null, 'Unsupported hire source');
    ensure([r.price,r.rate_2,r.rate_3,r.rate_4,r.rate_5].every(v => v === 0 || v === null) && r.hold_billing === false, 'Unrelated or held charges are not allowed');
    ensure(typeof r.branch_code === 'string' && /^[A-Z0-9-]+$/.test(r.branch_code) && r.sales_analysis_code === r.branch_code + '-HIR', 'Hire category and branch must agree');
    ensure(r.rate_type === 'W' && r.item_type_code === 1, 'Unexpected source type');
    ensure(['start_date','start_time','term_date','demob_date'].every(k => r[k] === null) && r.delivered === false && r.minimum_days === null, 'Financial evidence must not infer onsite dates or minimums');
    ensure(['contract_start','expected_term_date','booked_delivery_date','booked_pickup_date'].every(k => r[k] === null || day(r[k])), 'Source date is invalid');
    const sourceCopy = {...r}; delete sourceCopy.register_type; sourceCopy.minimum_days = raw.minimum_days;
    ensure(equal(sourceCopy, raw), 'Raw source evidence differs from the projection');
    ensure(raw.minimum_days === null || Number.isSafeInteger(raw.minimum_days) && raw.minimum_days >= 0, 'Source minimum is invalid');
    ensure(exactKeys(b, ['ref','assetNo','requestedItem','quantity','owner','branch','contract','line']) && typeof b.ref === 'string' && /^[A-Z][A-Z0-9?_/-]{0,39}$/.test(b.ref) && text(b.requestedItem) && b.requestedItem === r.register_type, 'Invalid native binding');
    ensure(b.assetNo === text(r.asset_no) && b.quantity === 1 && b.owner === 'coates' && b.branch === r.branch_code && b.contract === text(r.rental_contract) && b.line === r.line, 'Native binding and source disagree');
    ensure(exactKeys(f, ['nativeOverrideKey','basis','from','to','dayCount','quantity','requiresExplicitNativeOverride','sourceRateDoesNotImplyEventTotal']), 'Unexpected financial rule fields');
    ensure(f.nativeOverrideKey === rateKey(r) && f.basis === 'whole-event' && f.quantity === 1 && f.requiresExplicitNativeOverride === true && f.sourceRateDoesNotImplyEventTotal === true, 'Only an explicit whole-event native override is supported');
    ensure(day(f.from) && day(f.to) && f.to >= f.from && Number.isSafeInteger(f.dayCount) && f.dayCount > 0 && f.dayCount <= 31 && (Date.parse(f.to) - Date.parse(f.from)) / 86400000 + 1 === f.dayCount, 'Invalid event window');
    return input;
  }
  function expectedRow(input) {
    validate(input);
    return {...clone(input.row), match: {state:'confirmed native fleet association', to:'asset', key:input.binding.ref, task_id:null, via:'exact native identity', basis:'Financial source association only; onsite records remain authoritative.'},
      [tag]: {schema:1, source:clone(input.source), rawSourceRow:clone(input.rawSourceRow), binding:clone(input.binding), financialRule:clone(input.financialRule)}};
  }
  function project(rows, input) {
    ensure(Array.isArray(rows), 'Source rows are required');
    const projected = expectedRow(input), matches = rows.filter(r => key(r) === key(projected));
    ensure(matches.length <= 1, 'Duplicate source line');
    ensure(!rows.some(r => key(r) !== key(projected) && !r.charge_line && r.asset_no_is_plant_number === true && text(r.asset_no) === input.binding.assetNo), 'Fleet already has a hire association');
    if (matches.length) { ensure(equal(matches[0], projected), 'Conflicting source line'); return {rows, row:matches[0], changed:false}; }
    return {rows:rows.concat(projected), row:projected, changed:true};
  }
  function overrideEligible(row) { return !!row && row[tag]?.schema === 1 && row[tag]?.financialRule?.nativeOverrideKey === rateKey(row); }
  function calculationCopy(row) { return overrideEligible(row) ? {...row, rate_1:null} : row; }
  function bindingStatus(input, scopes) {
    validate(input);
    if (!Array.isArray(scopes)) return {ok:false, reason:'Native identity is unavailable'};
    const b = input.binding, target = scopes.filter(s => s.ref === b.ref && s.item === b.requestedItem);
    if (target.length !== 1) return {ok:false, reason:'Native reference/item needs review'};
    const s = target[0];
    if (!s.active || s.quantity !== 1 || s.branch !== b.branch || s.contract !== b.contract || s.nativeAdded !== true) return {ok:false, reason:'Native scope or attribution needs review'};
    const physical = (s.units || []).filter(u => u.physical === true && u.source !== 'history');
    if (physical.length !== 1 || physical[0].owner !== 'coates' || text(physical[0].assetNo) !== b.assetNo || physical[0].item !== b.requestedItem || s.nativeNumbers?.filter(n => text(n) === b.assetNo).length !== 1) return {ok:false, reason:'Native fleet identity needs review'};
    const claims = scopes.filter(x => x.active && (x.units || []).some(u => u.physical === true && u.source !== 'history' && text(u.assetNo) === b.assetNo));
    if (claims.length !== 1 || claims[0] !== s) return {ok:false, reason:'Fleet identity has conflicting assignments'};
    if (s.conflictingRate || s.conflictingWeeks || s.conflictingMinimum) return {ok:false, reason:'An existing rate or period override needs review'};
    return {ok:true, reason:null};
  }
  function readOverride(value) {
    if (!['string','number'].includes(typeof value) || String(value).trim() === '') return null;
    const n = Number(value); return cents(n) && n <= 1000000 ? n : null;
  }
  function price(row, binding, value, readCharge) {
    if (!overrideEligible(row)) return readCharge(row);
    const amount = readOverride(value), rule = row[tag].financialRule;
    if (!binding?.ok || amount === null) return {amount:null, basis:binding?.ok ? 'Whole-event hire override is not recorded.' : binding?.reason || 'Native binding needs review', how:'pending', days:null, daily:false, financialAssociation1105:true};
    const result = readCharge(calculationCopy(row));
    // A changed calculator must never silently reinterpret the recorded full-event amount.
    if (result?.amount !== amount || result.daily !== false) return {amount:null, basis:'Whole-event calculation needs review.', how:'pending', days:null, daily:false, financialAssociation1105:true};
    return {...result, basis:'Recorded whole-event hire override; ' + rule.from + ' to ' + rule.to + ' (' + rule.dayCount + ' days), quantity applied once. Original source rate retained as evidence.', financialAssociation1105:true, sourceRate1105:row.rate_1};
  }
  function rateFallback(previous, row, binding, value, ref, item) {
    if (previous?.value != null || !overrideEligible(row) || !binding?.ok || row[tag].binding.ref !== ref || row.register_type !== item) return previous;
    const amount = readOverride(value);
    return amount === null ? previous : {...previous, value:amount, per:'flat', source:'contract', sourceContractLine:key(row), financialAssociation1105:true};
  }
  const api = {validate, project, expectedRow, overrideEligible, calculationCopy, bindingStatus, readOverride, price, rateFallback, key, rateKey, tag};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FinancialAssociation1105 = api;
})(typeof window !== 'undefined' ? window : null);
