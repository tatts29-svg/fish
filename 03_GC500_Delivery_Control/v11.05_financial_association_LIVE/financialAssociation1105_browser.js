/* Author: Andrew Fisher. Existing native Costs handler remains the only writer. */
(function () {
  'use strict';
  const API = window.FinancialAssociation1105;
  const data = document.getElementById('financial-association1105-data');
  if (!API || !data) throw Error('Financial association input is unavailable');
  const entries = JSON.parse(data.textContent);
  if (!Array.isArray(entries) || entries.length !== 1) throw Error('Exactly one financial association is required');
  const input = API.validate(entries[0]);
  const projected = API.project(ONHIRE_ROWS, input);
  if (projected.changed) ONHIRE_ROWS.push(projected.row);
  const source = projected.row, sourceKey = API.key(source), binding = input.binding;
  const isTarget = r => API.overrideEligible(r) && API.key(r) === sourceKey;
  const entered = v => v != null && String(v).trim() !== '';
  function scopes() {
    return allAssets().flatMap(a => {
      const raw = (S.added || []).filter(r => r.key === a.key);
      const units = gcModel925(a, {loading:false}).rows;
      return chargeLines(a).map(line => ({
        ref:a.key, item:line.item, quantity:qtyOf(line),
        active:!a._cancelled && !a.rest_of && !a.relocation && !movedAway(a.key),
        branch:branchOf(a.key)?.code, contract:contractOf(a.key)?.id,
        nativeAdded:raw.length === 1,
        // Source-derived rental numbers cannot serve as evidence for their own association.
        nativeNumbers:raw.length === 1 ? (raw[0].asset_numbers || []).slice() : [],
        units:units.filter(u => u.item === line.item),
        conflictingRate:entered(S.rates?.[a.discipline + '|' + line.item]),
        conflictingWeeks:entered(S.weeks?.[a.key]),
        conflictingMinimum:entered(S.minDays?.[a.discipline + '|' + line.item])
      }));
    });
  }
  let readingBinding = false, reenteredBinding = false;
  function status() {
    if (readingBinding) { reenteredBinding = true; return {ok:false, reason:'Native identity verification needs review'}; }
    readingBinding = true; reenteredBinding = false;
    try {
      return holdAssets(() => heldMemo('financialAssociation1105Binding', () => {
        const result = API.bindingStatus(input, scopes());
        return reenteredBinding ? {ok:false, reason:'Native identity verification needs review'} : result;
      }));
    } finally { readingBinding = false; }
  }
  function override() { return S.lineRates?.[input.financialRule.nativeOverrideKey]; }
  const previousRate = lr748For;
  lr748For = function (row) {
    if (!isTarget(row)) return previousRate.apply(this, arguments);
    if (!status().ok) return null;
    return previousRate.call(this, API.calculationCopy(row));
  };
  const previousCharge = contractCharge;
  contractCharge = function (row) {
    if (!isTarget(row)) return previousCharge.apply(this, arguments);
    return API.price(row, status(), override(), copy => previousCharge.call(this, copy));
  };
  const previousFallback = rateFor;
  rateFor = function (discipline, item, ref) {
    const original = previousFallback.apply(this, arguments);
    if (ref !== binding.ref || item !== binding.requestedItem) return original;
    return API.rateFallback(original, source, status(), override(), ref, item);
  };
  window.financialAssociation1105Status = status;
  window.financialAssociation1105Readback = function () {
    return {status:status(), key:sourceKey, overrideKey:input.financialRule.nativeOverrideKey,
      override:API.readOverride(override()), charge:contractCharge(source),
      sourceRate:source.rate_1, rawSource:source[API.tag].rawSourceRow,
      window:input.financialRule, sourceCount:ONHIRE_ROWS.filter(r => API.key(r) === sourceKey).length};
  };
  sharedCache975();
})();
