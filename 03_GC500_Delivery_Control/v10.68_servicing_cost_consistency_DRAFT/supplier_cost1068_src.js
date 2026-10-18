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
  const safe = value => {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    const n = Number(value), d = decimal(n / 100);
    // Existing page consumers use dollar Numbers: do not hand them a cent they cannot preserve.
    return d && (d[0] * 200n + d[1]) / (d[1] * 2n) === value ? n : null;
  };
  const rounded = (n, d) => safe((n * 200n + d) / (d * 2n));
  const cents = value => { const v = decimal(value); return v ? rounded(v[0], v[1]) : null; };
  const multiply = (quantity, rate) => {
    const q = decimal(quantity), r = decimal(rate);
    return q && r ? rounded(q[0] * r[0], q[1] * r[1]) : null;
  };
  const amount = c => c == null ? null : c / 100;
  const sum = values => values.some(v => v == null) ? null : safe(values.reduce((a, b) => a + BigInt(b), 0n));
  const knownSum = values => { const known = values.filter(v => v != null); return known.length ? sum(known) : null; };
  const signature = (quote, description) => JSON.stringify([quote, description]);

  function project(source, definitions, quantities, requiredCardLines) {
    const issues = [], lines = [], quotes = [];
    const allQuotes = source && Array.isArray(source.quotes) ? source.quotes : [];
    definitions = Array.isArray(definitions) ? definitions : [];
    quantities = Array.isArray(quantities) ? quantities : [];
    const addIssue = message => { if (!issues.includes(message)) issues.push(message); };
    let serviceIncomplete = false;
    const serviceIssue = message => { serviceIncomplete = true; addIssue(message); };
    if (!allQuotes.length) addIssue('Supplier quotes are unavailable.');
    if (!definitions.length) serviceIssue('Supplier servicing lines are unavailable.');
    const matches = new Map(), replacements = new Map(), heldQuotes = new Set(), quoteIds = new Map();
    for (const q of allQuotes) {
      if (!q || typeof q !== 'object' || typeof q.quote !== 'string' || !q.quote.trim()) {
        addIssue('Supplier quote identity is unavailable.'); continue;
      }
      quoteIds.set(q.quote, (quoteIds.get(q.quote) || 0) + 1);
    }
    for (const [id, count] of quoteIds) if (count !== 1) {
      heldQuotes.add(id); addIssue(id + ': supplier quote is duplicated; all copies are held.');
    }
    const required = new Set([...(Array.isArray(requiredCardLines) ? requiredCardLines : []), ...quantities.map(l => l && l.card_line).filter(Boolean)]);
    for (const cardLine of required) if (!definitions.some(d => d && d.card_line === cardLine)) {
      serviceIssue(cardLine + ': supplier servicing mapping is unavailable.');
      const qs = quantities.filter(l => l && l.card_line === cardLine).map(l => l.quote).filter(q => quoteIds.has(q));
      // With no original quote identity there is no safe way to distinguish an unpriced service from other lines.
      (qs.length ? qs : [...quoteIds.keys()]).forEach(q => heldQuotes.add(q));
    }
    if (!definitions.length) quoteIds.forEach((_, q) => heldQuotes.add(q));
    // A lost quote identity cannot safely identify which original service quantities to remove.
    for (const d of definitions) if (d && d.card_line && !quoteIds.has(d.quote)) {
      serviceIssue(d.card_line + ': supplier quote identity is unavailable.');
      quoteIds.forEach((_, q) => heldQuotes.add(q));
    }
    for (const q of allQuotes) {
      if (!q || !quoteIds.has(q.quote)) continue;
      if (!Array.isArray(q.groups) || q.groups.some(g => !g || !Array.isArray(g.lines))) {
        heldQuotes.add(q.quote); addIssue(q.quote + ': supplier quote lines are unavailable.'); continue;
      }
      for (const g of q.groups) for (const l of g.lines) {
        if (!l || typeof l !== 'object') { heldQuotes.add(q.quote); addIssue(q.quote + ': supplier quote line is unavailable.'); continue; }
        const key = signature(q.quote, l.description), found = matches.get(key) || [];
        found.push({quote: q, line: l}); matches.set(key, found);
      }
    }
    for (const d of definitions) {
      if (!d || !d.card_line) { serviceIssue('Supplier servicing mapping is unavailable.'); quoteIds.forEach((_, q) => heldQuotes.add(q)); continue; }
      const key = signature(d.quote, d.description), found = matches.get(key) || [];
      if (!found.length) heldQuotes.add(d.quote);
      const units = quantities.filter(l => l && l.card_line === d.card_line);
      let error = '';
      if (definitions.filter(x => x && (signature(x.quote, x.description) === key || x.card_line === d.card_line)).length !== 1) error = 'Supplier servicing source is duplicated.';
      else if (heldQuotes.has(d.quote) || found.length !== 1) error = 'Supplier servicing rate needs one matching quote line.';
      else if (units.length !== 1 || decimal(units[0].qty) == null) error = 'Site servicing quantity is unavailable.';
      else if (cents(found[0].line.total_price) == null) error = 'Original supplier service amount is unavailable.';
      const rate = found.length === 1 ? found[0].line.unit_price : null;
      const qty = units.length === 1 ? units[0].qty : null;
      const value = !error ? multiply(qty, rate) : null;
      if (!error && value == null) error = 'Supplier servicing rate is unavailable or exceeds the supported amount.';
      if (error) serviceIssue(d.card_line + ': ' + error);
      const row = {quote: d.quote, description: d.description, card_line: d.card_line,
        quantity: qty, rate: error || decimal(rate) == null ? null : Number(rate), amount: amount(value),
        amountCents: value, quotedQuantity: found.length === 1 ? found[0].line.qty : null,
        quotedAmount: found.length === 1 ? found[0].line.total_price : null, issue: error};
      lines.push(row); replacements.set(key, row);
    }
    for (const q of allQuotes) {
      if (!q || typeof q !== 'object') continue;
      let adjustment = 0n, reconciled = quoteIds.has(q.quote) && !heldQuotes.has(q.quote), complete = reconciled;
      const groups = (Array.isArray(q.groups) ? q.groups : []).map(g => ({...g, lines: (g && Array.isArray(g.lines) ? g.lines : []).map(l => {
        if (!l || typeof l !== 'object') return l;
        const r = replacements.get(signature(q.quote, l.description));
        if (!r) return {...l};
        const old = cents(l.total_price);
        if (old == null) { reconciled = complete = false; addIssue(q.quote + ': supplier quote subtotal cannot be reconciled.'); }
        else adjustment -= BigInt(old);
        if (r.amountCents != null) adjustment += BigInt(r.amountCents); else complete = false;
        return {...l, qty: r.quantity, unit_price: r.rate, total_price: r.amount,
          quotedQuantity1068: l.qty, quotedAmount1068: l.total_price, serviceIssue1068: r.issue};
      })}));
      const subtotal = cents(q.sub_total), delivery = cents(q.delivery_charge), pickup = cents(q.pickup);
      const adjusted = subtotal == null || !reconciled ? null : safe(BigInt(subtotal) + adjustment);
      if (adjusted == null || delivery == null || pickup == null) {
        complete = false; addIssue(q.quote + ': supplier quote total is unavailable.');
      }
      const totalCents = adjusted == null || !reconciled ? null : sum([adjusted, delivery, pickup]);
      if (adjusted != null && delivery != null && pickup != null && totalCents == null) {
        complete = false; addIssue(q.quote + ': supplier quote total exceeds the supported amount.');
      }
      const knownCents = reconciled && adjusted != null ? knownSum([adjusted, delivery, pickup]) : null;
      if (reconciled && adjusted != null && knownCents == null) addIssue(q.quote + ': known supplier subtotal exceeds the supported amount.');
      quotes.push({...q, groups, sub_total: complete ? amount(adjusted) : null,
        quotedSubtotal1068: q.sub_total, knownSubtotal1068: amount(adjusted), costComplete1068: complete,
        costTotal1068: complete ? amount(totalCents) : null, costTotalCents1068: complete ? totalCents : null,
        knownCostTotal1068: amount(knownCents), knownCostTotalCents1068: knownCents,
        costBasis1068: 'Site servicing quantities at supplier quote rates; other quoted lines unchanged.'});
    }
    const knownTotal = knownSum(quotes.map(q => q.knownCostTotalCents1068));
    const knownService = knownSum(lines.map(l => l.amountCents));
    const quotedService = lines.length ? sum([...new Map(lines.map(l => [signature(l.quote, l.description), cents(l.quotedAmount)])).values()]) : null;
    const quotedTotal = source && source.totals ? sum([cents(source.totals.sub_totals), cents(source.totals.delivery_and_pickup)]) : null;
    if (quotes.some(q => q.knownCostTotalCents1068 != null) && knownTotal == null) addIssue('Supplier cost exceeds the supported amount.');
    if (lines.some(l => l.amountCents != null) && knownService == null) serviceIssue('Supplier servicing cost exceeds the supported amount.');
    return {complete: issues.length === 0, issues, lines, quotes,
      total: issues.length ? null : amount(knownTotal), knownTotal: amount(knownTotal),
      serviceTotal: !lines.length || serviceIncomplete ? null : amount(knownService), serviceKnownTotal: amount(knownService),
      quotedServiceTotal: amount(quotedService), quotedTotal: amount(quotedTotal)};
  }

  function decorate(service, source, definitions, requiredCardLines) {
    if (!service) return service;
    const model = project(source, definitions, service.card_lines, requiredCardLines);
    const enrich = line => {
      if (line.card_line == null) return line; // Water and other at-cost customer lines are unchanged.
      const rows = model.lines.filter(r => r.card_line === line.card_line);
      const row = rows.length === 1 ? rows[0] : null;
      return {...line, their_rate: row ? row.rate : null, their_amount: row ? row.amount : null,
        quote_their_amount1068: row ? row.quotedAmount : null,
        supplier_issue1068: row ? row.issue : 'Supplier servicing mapping is unavailable or duplicated.'};
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
function supplierKnownWords1068(value) { return value == null ? 'no verified subtotal' : money(value) + ' ex GST known subtotal'; }
