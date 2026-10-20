/* Author: Andrew Fisher. Current received supplier hire at established quote rates.
   A read-only projection. Original quotes, customer rates and native records are preserved. */
(function (root) {
  'use strict';
  const mappings = [
    {item: 'FWF', description: 'Fleet Fresh Flush Toilet'},
    {item: 'Pee Panels', description: 'Pee Panel'},
    {item: '16Pan Block', description: '16 Pan Toilet Block'}
  ];
  // Explicit current-scope exclusion; the source quotation remains intact.
  const exclusions = [
    {item: 'Accessible Toilet', description: 'Comfort Inn  Accessible Toilet'},
    {item: 'VIP 5 Star Combo Toilet Block', description: 'VIP 5 Star Combo Toilet Block'}
  ];
  const integer = n => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  const type = s => String(s || '').trim().toLowerCase().replace(/[\s-]+/g, '');
  const matches = (a, b) => type(a).replace(/panels$/, 'panel') === type(b).replace(/panels$/, 'panel');
  const sum = values => {
    if (values.some(v => !Number.isSafeInteger(v) || v < 0)) return null;
    const total = values.reduce((a, b) => a + BigInt(b), 0n);
    return total <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(total) : null;
  };
  function hire(source, inventory, extra, arithmetic) {
    const {cents, multiply} = arithmetic, issues = [], rows = [], excluded = [];
    const quotes = source && Array.isArray(source.quotes) ? source.quotes : [];
    const found = quotes.filter(q => q && q.quote === 'Q6845');
    const quote = found.length === 1 ? found[0] : null;
    const sourceReady = quote && Array.isArray(quote.groups) && quote.groups.length > 0 &&
      quote.groups.every(g => g && Array.isArray(g.lines) && g.lines.every(l => l && typeof l === 'object'));
    const lines = sourceReady ? quote.groups.flatMap(g => g.lines) : [];
    const inventoryReady = inventory && Array.isArray(inventory.inventory) && Array.isArray(inventory.issues) &&
      !inventory.issues.length && Array.isArray(inventory.conflicts) && !inventory.conflicts.length;
    const approved = source && source.authorisation && source.authorisation.state === 'approved' &&
      Array.isArray(source.authorisation.applies_to) && source.authorisation.applies_to.includes('Q6845');
    for (const mapping of mappings) {
      const sources = lines.filter(l => l && l.description === mapping.description);
      const line = sources.length === 1 ? sources[0] : null;
      const current = inventoryReady ? inventory.inventory.filter(r => matches(r.item, mapping.item)) : [];
      const keys = current.map(r => JSON.stringify([r.ref, r.item]));
      const valid = inventoryReady && current.length > 0 && new Set(keys).size === keys.length &&
        current.every(r => integer(r.received) && r.received > 0 && !r.dispatchHold && !r.locationConflict &&
          !r.receiptDateIssue1006 && !(r.collectionIssues || []).length);
      const received = valid ? sum(current.map(r => r.received)) : null;
      let issue = !quote || !approved ? 'The matching approved supplier hire quote needs review.' :
        !line || !integer(line.qty) || cents(line.total_price) == null ||
        multiply(line.qty, line.unit_price) !== cents(line.total_price) ? 'Supplier hire needs one reconciled source quantity and unit rate.' :
        received == null ? 'Confirmed supplier receipt quantity needs review; absence is not a cancellation.' : '';
      const isBlock = mapping.item === '16Pan Block';
      const separate = isBlock && extra && extra.state === 'recorded-variation';
      if (isBlock && (!extra || extra.held)) issue = 'Additional supplier block coverage needs review.';
      if (separate && (!integer(extra.required) || received > extra.required ||
          current.some(r => r.ref !== extra.ref)))
        issue = 'Received supplier blocks exceed the separately recorded variation coverage; reconcile the additional hire.';
      // An actual additional-hire entry already replaces the previous forecast. Leave that
      // recorded charge in its own ledger; do not absorb and charge it again here.
      const quantity = separate && line ? line.qty : received;
      const amountCents = !issue ? multiply(quantity, line.unit_price) : null;
      if (!issue && amountCents == null) issue = 'Supplier hire amount exceeds the supported amount.';
      if (issue) issues.push(mapping.item + ': ' + issue);
      rows.push({...mapping, quote: 'Q6845', quantity, received, quotedQuantity: line ? line.qty : null,
        rate: !issue ? Number(line.unit_price) : null, amount: amountCents == null ? null : amountCents / 100,
        amountCents, quotedAmountCents: line ? cents(line.total_price) : null, issue,
        separateRecordedVariation: !!separate,
        refs: current.map(r => ({ref: r.ref, quantity: r.received})),
        basis: separate ? 'Original hire plus a separately recorded additional-hire cost.' :
          'Confirmed received supplier quantity at the established quote rate, once for the quoted event period.'});
    }
    for (const mapping of exclusions) {
      const sources = lines.filter(l => l && l.description === mapping.description);
      const line = sources.length === 1 ? sources[0] : null;
      const current = inventoryReady ? inventory.inventory.filter(r => matches(r.item, mapping.item)) : [];
      const issue = !inventoryReady ? 'Current supplier inventory needs review before applying the scope exclusion.' :
        current.some(r => r.received > 0 || (r.numbers || []).length) ? 'New supplier equipment conflicts with the excluded quote-only scope; review the current requirement.' :
        !quote || !approved || !line || !integer(line.qty) || cents(line.total_price) == null ||
        multiply(line.qty, line.unit_price) !== cents(line.total_price) ? 'Excluded supplier quote line needs one reconciled source amount.' : '';
      if (issue) issues.push(mapping.item + ': ' + issue);
      excluded.push({...mapping, quote: 'Q6845', quantity: 0, received: 0, rate: line ? line.unit_price : null,
        amount: issue ? null : 0, amountCents: issue ? null : 0, quotedQuantity: line ? line.qty : null,
        quotedAmountCents: line ? cents(line.total_price) : null, issue,
        basis: 'Quote-only item excluded from the current supplier scope by Andrew; original quote retained for comparison.'});
    }
    const retained = lines.filter(l => !mappings.concat(exclusions).some(m => m.description === l.description)).map(l =>
      ({description: l.description, quantity: l.qty, rate: l.unit_price, amount: l.total_price,
        basis: 'Quote-only allowance; current supplier allocation is unconfirmed. Not an onsite count or cancellation.'}));
    return {complete: !issues.length, issues, rows, excluded, retained, retainedCents: sum(retained.map(l => cents(l.amount)))};
  }
  function project(cost, hireModel, arithmetic) {
    if (!cost) return cost;
    const {cents} = arithmetic, issues = [...(cost.issues || []), ...hireModel.issues];
    const quotes = cost.quotes.map(q => {
      if (q.quote !== 'Q6845') return q;
      let known = cents(q.knownSubtotal1068), invalidOriginal = false;
      const groups = (Array.isArray(q.groups) ? q.groups : []).map(g => ({...g, lines: (g && Array.isArray(g.lines) ? g.lines : []).map(line => {
        if (!line || typeof line !== 'object') return line;
        const r = hireModel.rows.concat(hireModel.excluded).find(x => x.description === line.description);
        if (!r) return line;
        if (known == null || r.quotedAmountCents == null) invalidOriginal = true;
        else known = known - r.quotedAmountCents + (r.amountCents || 0);
        return {...line, qty: r.quantity, unit_price: r.rate, total_price: r.amount,
          quotedQuantity1094: line.qty, quotedAmount1094: line.total_price, hireIssue1094: r.issue};
      })}));
      const fixed = cents(q.knownCostTotal1068) == null || cents(q.knownSubtotal1068) == null ? null :
        cents(q.knownCostTotal1068) - cents(q.knownSubtotal1068);
      const total = invalidOriginal || known == null || fixed == null ? null : sum([known, fixed]);
      const complete = q.costComplete1068 && hireModel.complete && total != null;
      return {...q, groups, sub_total: complete ? known / 100 : null, knownSubtotal1068: invalidOriginal || known == null ? null : known / 100,
        quotedGST1094: q.gst, quotedGross1094: q.total_amount, quotedAmount1094: q.quoted_amount,
        gst: null, total_amount: null, quoted_amount: null,
        costComplete1068: complete, costTotal1068: complete ? total / 100 : null,
        costTotalCents1068: complete ? total : null, knownCostTotal1068: total == null ? null : total / 100,
        knownCostTotalCents1068: total,
        costBasis1068: 'Confirmed received hire and site servicing at supplier quote rates; explicitly excluded quote-only items removed from current costs and fixed allowances retained.'};
    });
    const known = sum(quotes.map(q => q.knownCostTotalCents1068));
    const complete = cost.complete && hireModel.complete && known != null && quotes.every(q => q.costComplete1068);
    if (!complete && !issues.length) issues.push('Full supplier hire cost needs review.');
    return {...cost, quotes, complete, issues: [...new Set(issues)], total: complete ? known / 100 : null,
      knownTotal: known == null ? null : known / 100, hire1094: hireModel};
  }
  function forecast(extra, hireModel, arithmetic) {
    const block = hireModel.rows.find(r => r.item === '16Pan Block');
    if (!extra || !block || block.issue || block.separateRecordedVariation || extra.held) return extra;
    const received = block.refs.filter(r => r.ref === extra.ref).reduce((n, r) => n + r.quantity, 0);
    const additional = Math.max(0, extra.required - received), cents = arithmetic.multiply(additional, block.rate);
    if (!integer(extra.required) || cents == null) return {...extra, held: true, state: 'held',
      reason: 'Remaining supplier block hire needs a confirmed quantity and rate.'};
    return {...extra, additional, estimate: cents / 100, state: additional ? 'received-and-remaining' : 'included-current-hire',
      includedCurrentHire1094: true, received1094: received,
      reason: 'Confirmed received supplier blocks are included once in current hire; only the uncovered required quantity remains forecast.'};
  }
  const api = {mappings, exclusions, hire, project, forecast};
  root.SupplierHire1094 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

function supplierHire1094Model() {
  return heldMemo('supplierHire1094', () => SupplierHire1094.hire(DATA.rehire_quotes,
    Supplier996.model(), Supplier955.originalModel1094(), SupplierService1068));
}
function supplierForecast1094(extra) { return SupplierHire1094.forecast(extra, supplierHire1094Model(), SupplierService1068); }
function supplierForecastWords1094(f) {
  return 'Confirmed received supplier blocks are included once in current hire. ' +
    (f.additional ? String(f.additional) + ' required blocks remain forecast at ' + money(f.estimate) + ' ex GST.' :
      'No duplicate additional-hire forecast remains.') + ' Additional transport remains unconfirmed.';
}
/* One supplier projection feeds Costs, Rehire, Finance and monthly allocation. */
if (typeof document !== 'undefined') {
  const originalDecorate1094 = SupplierService1068.decorate;
  SupplierService1068.decorate = function () {
    const result = originalDecorate1094.apply(this, arguments);
    return result ? {...result, supplier1068: SupplierHire1094.project(result.supplier1068, supplierHire1094Model(), SupplierService1068)} : result;
  };
}
