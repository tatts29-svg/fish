/* Author: Andrew Fisher. Read-only completeness labels; no financial or operational changes. */
(function (root) {
  'use strict';
  const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const toCents = value => amount(value) && Number.isSafeInteger(Math.round(value * 100)) ? Math.round(value * 100) : null;
  function project(source, cost, extra) {
    const quotes = source && Array.isArray(source.quotes) ? source.quotes : [];
    const ids = quotes.map(q => q && q.quote);
    const identified = quotes.length > 0 && ids.every(id => typeof id === 'string' && id.trim()) && new Set(ids).size === ids.length;
    const validGroups = quotes.every(q => q && Array.isArray(q.groups) && q.groups.length && q.groups.every(g => g && Array.isArray(g.lines) && g.lines.length));
    const lines = validGroups ? quotes.flatMap(q => q.groups.flatMap(g => g.lines)) : [];
    const priced = lines.filter(l => l && typeof l.description === 'string' && l.description.trim() && amount(l.unit_price) && amount(l.total_price)).length;
    const auth = source && source.authorisation;
    const approved = identified && !!auth && auth.state === 'approved' && Array.isArray(auth.applies_to) && ids.every(id => auth.applies_to.includes(id));
    const currentCents = toCents(cost && cost.total), knownCents = toCents(cost && cost.knownTotal), quotedCents = toCents(cost && cost.quotedTotal);
    const extraKnown = !!extra && extra.held === false && extra.state !== 'held' && toCents(extra.estimate) != null;
    const extraCents = extraKnown ? toCents(extra.estimate) : null;
    const complete = identified && validGroups && lines.length > 0 && priced === lines.length && approved && !!cost && cost.complete === true && Array.isArray(cost.issues) && cost.issues.length === 0 && currentCents != null && quotedCents != null && extraKnown;
    const combinedCents = complete && Number.isSafeInteger(currentCents + extraCents) ? currentCents + extraCents : null;
    return Object.freeze({
      complete: complete && combinedCents != null,
      label: complete && combinedCents != null ? 'All supplied rates recorded' : 'Supplier cost needs review',
      quotes: quotes.length, lines: lines.length, pricedLines: priced, approved,
      originalQuoteCost: quotedCents == null ? null : quotedCents / 100,
      currentCost: currentCents == null ? null : currentCents / 100,
      knownCost: knownCents == null ? null : knownCents / 100,
      additionalHireForecast: extraCents == null ? null : extraCents / 100,
      combinedEstimate: combinedCents == null ? null : combinedCents / 100,
      extraTransportUnconfirmed: !!(extra && (extra.additional > 0 || extra.held || extra.includedCurrentHire1094 && extra.required > extra.quoted)),
      hire: cost && cost.hire1094 || null,
      evidenceLabel: 'Invoice and PO reconciliation is a separate document check. Rate completion does not confirm an invoice, payment or final supplier total.'
    });
  }
  root.SupplierCostStatus1094 = {project};
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SupplierCostStatus1094;
})(typeof window === 'undefined' ? globalThis : window);

function epCostStatus1094Model() {
  return SupplierCostStatus1094.project(DATA.rehire_quotes, supplierService1068(), Supplier955.model());
}
function epCostStatus1094Label() {
  const status = epCostStatus1094Model();
  return status.label + (status.complete ? ' · cost estimate; invoice/PO check separate' : ' · full supplier cost not confirmed');
}
function epCostStatus1094Html() {
  const status = epCostStatus1094Model(), show = value => value == null ? 'unavailable' : money(value) + ' ex GST',
    hire = status.hire,
    detail = hire ? '<p>' + hire.rows.map(r => esc(r.item) + ': ' + (r.issue ? esc(r.issue) :
      esc(String(r.quantity)) + (r.separateRecordedVariation ? ' in quoted base hire' : ' confirmed received') +
      ' × ' + esc(money(r.rate)) + ' = ' + esc(show(r.amount)) +
      (r.separateRecordedVariation ? '; ' + esc(String(r.received)) + ' received in total, with additional hire recorded separately' : ''))).join('; ') + '.</p>' +
      (hire.excluded.length ? '<p class="w">Excluded from current supplier costs on Andrew’s instruction: ' +
        hire.excluded.map(r => esc(r.description) + ' × ' + esc(String(r.quotedQuantity))).join('; ') +
        '. The original quotation is kept for comparison.</p>' : '') +
      (hire.retained.length ? '<p class="w">Quote-only scope retained separately: ' + hire.retained.map(r => esc(r.description) +
        ' × ' + esc(String(r.quantity)) + ' · ' + esc(show(r.amount))).join('; ') +
        '. Current supplier allocation unconfirmed; these are allowances, not confirmed onsite units.</p>' : '') : '';
  const basis = '<p>' + status.pricedLines + ' of ' + status.lines + ' source lines priced across ' + status.quotes + ' quotes' +
    (status.approved ? ' · approved scope' : ' · scope approval needs review') + '.</p>' + detail +
    '<p class="w">Original quote cost: ' + esc(show(status.originalQuoteCost)) +
    ' — reference only, not added again. Combined priced estimate: ' + esc(show(status.combinedEstimate)) +
    '. Fixed and dated quoted allowances remain estimates until their scope and documents are reconciled. ' +
    esc(status.evidenceLabel) + (status.extraTransportUnconfirmed ? ' Additional transport for extra units remains unconfirmed.' : '') + '</p>';
  return '<div class="supplier-cost1094" data-supplier-cost1094><p><b>' + esc(status.label) +
    '</b> · Current cost estimate <b>' + esc(show(status.currentCost)) + '</b> · Additional hire forecast ' +
    esc(show(status.additionalHireForecast)) + '. Invoice and PO check separate.</p>' +
    moreInfo('presentation1094|supplier-cost-basis', basis) + '</div>';
}
