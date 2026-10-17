/* Author: Andrew Fisher. Supplier servicing cost follows the shared site quantities.
   Pure cost projection: never writes a quote, a record, a rate or a service tick. */
(function (root) {
  'use strict';
  const decimal = value => {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const s = String(value).trim();
    if (!s || !Number.isFinite(Number(s)) || Number(s) < 0) return null;
    const m = /^(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(s);
    if (!m) return null;
    const exponent = Number(m[3] || 0) - (m[2] || '').length;
    if (Math.abs(exponent) > 24) return null;
    const numerator = BigInt(m[1] + (m[2] || ''));
    return exponent >= 0 ? [numerator * 10n ** BigInt(exponent), 1n]
      : [numerator, 10n ** BigInt(-exponent)];
  };
  const rounded = (n, d) => {
    const cents = (n * 100n * 2n + d) / (d * 2n);
    return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
  };
  const cents = value => { const v = decimal(value); return v ? rounded(v[0], v[1]) : null; };
  const multiply = (quantity, rate) => {
    const q = decimal(quantity), r = decimal(rate);
    return q && r ? rounded(q[0] * r[0], q[1] * r[1]) : null;
  };
  const amount = c => c == null ? null : c / 100;
  const sum = values => {
    if (values.some(v => v == null)) return null;
    const total = values.reduce((a, b) => a + BigInt(b), 0n);
    return total <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(total) : null;
  };
  const signature = (quote, description) => JSON.stringify([quote, description]);

  function project(source, definitions, quantities) {
    const issues = [], lines = [], quotes = [], allQuotes = source && Array.isArray(source.quotes) ? source.quotes : [];
    definitions = Array.isArray(definitions) ? definitions : [];
    quantities = Array.isArray(quantities) ? quantities : [];
    const addIssue = message => { if (!issues.includes(message)) issues.push(message); };
    if (!Array.isArray(allQuotes) || !allQuotes.length) addIssue('Supplier quotes are unavailable.');
    if (!Array.isArray(definitions) || !definitions.length) addIssue('Supplier servicing lines are unavailable.');
    const matches = new Map(), replacements = new Map(), heldQuotes = new Set();
    for (const q of allQuotes || []) for (const g of q.groups || []) for (const l of g.lines || []) {
      const key = signature(q.quote, l.description), found = matches.get(key) || [];
      found.push({quote: q, line: l}); matches.set(key, found);
    }
    for (const d of definitions || []) {
      const key = signature(d.quote, d.description), found = matches.get(key) || [];
      if (!found.length) heldQuotes.add(d.quote);
      const units = (quantities || []).filter(l => l.card_line === d.card_line);
      let error = '';
      if (definitions.filter(x => signature(x.quote, x.description) === key || x.card_line === d.card_line).length !== 1) error = 'Supplier servicing source is duplicated.';
      else if (found.length !== 1) error = 'Supplier servicing rate needs one matching quote line.';
      else if (units.length !== 1 || decimal(units[0].qty) == null) error = 'Site servicing quantity is unavailable.';
      else if (cents(found[0].line.total_price) == null) error = 'Original supplier service amount is unavailable.';
      const rate = found.length === 1 ? found[0].line.unit_price : null;
      const qty = units.length === 1 ? units[0].qty : null;
      const value = !error ? multiply(qty, rate) : null;
      if (!error && value == null) error = 'Supplier servicing rate is unavailable or exceeds the supported amount.';
      if (error) addIssue(d.card_line + ': ' + error);
      const row = {quote: d.quote, description: d.description, card_line: d.card_line,
        quantity: qty, rate: decimal(rate) == null ? null : Number(rate), amount: amount(value),
        amountCents: value, quotedQuantity: found.length === 1 ? found[0].line.qty : null,
        quotedAmount: found.length === 1 ? found[0].line.total_price : null, issue: error};
      lines.push(row);
      // All ambiguous matching copies are held rather than retaining a quoted quantity as an actual cost.
      replacements.set(key, row);
    }
    for (const q of allQuotes || []) {
      let adjustment = 0n, known = !heldQuotes.has(q.quote);
      const groups = (q.groups || []).map(g => ({...g, lines: (g.lines || []).map(l => {
        const r = replacements.get(signature(q.quote, l.description));
        if (!r) return {...l};
        const old = cents(l.total_price);
        if (old == null) { known = false; addIssue(q.quote + ': supplier quote subtotal cannot be reconciled.'); }
        else adjustment -= BigInt(old);
        if (r.amountCents != null) adjustment += BigInt(r.amountCents);
        return {...l, qty: r.quantity, unit_price: r.rate, total_price: r.amount,
          quotedQuantity1068: l.qty, quotedAmount1068: l.total_price, serviceIssue1068: r.issue};
      })}));
      const subtotal = cents(q.sub_total), delivery = cents(q.delivery_charge == null ? 0 : q.delivery_charge), pickup = cents(q.pickup == null ? 0 : q.pickup);
      const adjusted = subtotal == null || !known ? null : BigInt(subtotal) + adjustment;
      if (adjusted == null || adjusted < 0n || adjusted > BigInt(Number.MAX_SAFE_INTEGER) || delivery == null || pickup == null) {
        addIssue(q.quote + ': supplier quote total is unavailable.');
      }
      const valid = adjusted != null && adjusted >= 0n && adjusted <= BigInt(Number.MAX_SAFE_INTEGER);
      const totalCents = valid ? sum([Number(adjusted), delivery, pickup]) : null;
      quotes.push({...q, groups, sub_total: valid ? amount(Number(adjusted)) : null,
        quotedSubtotal1068: q.sub_total, costTotal1068: amount(totalCents), costTotalCents1068: totalCents,
        costBasis1068: 'Site servicing quantities at supplier quote rates; other quoted lines unchanged.'});
    }
    const knownTotal = sum(quotes.map(q => q.costTotalCents1068 == null ? 0 : q.costTotalCents1068));
    const knownService = sum(lines.map(l => l.amountCents == null ? 0 : l.amountCents));
    const quotedService = sum([...new Map(lines.map(l => [signature(l.quote, l.description), cents(l.quotedAmount)])).values()]);
    const quotedTotal = source && source.totals ? sum([cents(source.totals.sub_totals), cents(source.totals.delivery_and_pickup == null ? 0 : source.totals.delivery_and_pickup)]) : null;
    if (knownTotal == null || knownService == null) addIssue('Supplier cost exceeds the supported amount.');
    return {complete: issues.length === 0, issues, lines, quotes,
      total: issues.length ? null : amount(knownTotal), knownTotal: amount(knownTotal),
      serviceTotal: !lines.length || lines.some(l => l.issue) ? null : amount(knownService), serviceKnownTotal: amount(knownService),
      quotedServiceTotal: amount(quotedService), quotedTotal: amount(quotedTotal)};
  }

  function decorate(service, source, definitions) {
    if (!service) return service;
    const model = project(source, definitions, service.card_lines);
    const enrich = line => {
      const rows = model.lines.filter(r => r.card_line === line.card_line);
      return rows.length === 1 ? {...line, their_rate: rows[0].rate, their_amount: rows[0].amount,
        quote_their_amount1068: rows[0].quotedAmount, supplier_issue1068: rows[0].issue} : line;
    };
    return {...service, lines: service.lines.map(enrich), card_lines: service.card_lines.map(enrich),
      their_total: model.serviceTotal, quote_their_total1068: model.quotedServiceTotal, supplier1068: model};
  }
  function summary(model, money) {
    if (!model) return 'Supplier servicing cost is unavailable.';
    const priced = model.serviceTotal == null ? (model.serviceKnownTotal == null ? 'unavailable' : money(model.serviceKnownTotal) + ' known') + '; incomplete' : money(model.serviceTotal);
    const quoted = model.quotedServiceTotal == null ? 'not available' : money(model.quotedServiceTotal);
    return 'Supplier servicing estimate on the site count: ' + priced + ' ex GST. Original quote servicing: ' + quoted + ' ex GST, reference only.' +
      (model.issues.length ? ' ' + model.issues.join(' ') : '');
  }
  const api = {project, decorate, summary, cents, multiply};
  root.SupplierService1068 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

function supplierService1068() {
  const read = () => { const service = servicing748(); return service && service.supplier1068; };
  return typeof heldMemo === 'function' ? heldMemo('supplierService1068', read) : read();
}
function supplierCostQuotes1068() { const model = supplierService1068(); return model ? model.quotes : []; }
function supplierCostWords1068(model) { return SupplierService1068.summary(model || supplierService1068(), money); }
