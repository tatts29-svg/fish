"""Author: Andrew Fisher. Expose customer evidence from the existing crew resolver.

The existing resolver already distinguishes source-confirmed customer membership
from later supplier-pricing checks. Keep every supplier result unchanged and add
one aggregate over those same validated groups; never parse the notes again.
"""


def patch(text, rep, path):
    if 'customerAggregate12451' in text:
        raise ValueError('v12.45.1 customer evidence reader already applied')
    start = text.index('function resolve(env) {')
    end = text.index('\nconst api = {version:', start)
    original = text[start:end]
    part = rep(original,
        '  const notes = env.notes || [], byId = {}, byDate = {}, issues = [], groups = new Map();',
        '  const notes = env.notes || [], byId = {}, byDate = {}, issues = [], groups = new Map(), customerErrors12451 = new Map();',
        'retain the existing source-validation result', path)
    part = rep(part,
        '    const customerScopeConfirmed = errors.length === 0;',
        '    const customerSourceErrors12451 = errors.slice();\n    const customerScopeConfirmed = errors.length === 0;',
        'separate source errors from subsequent supplier-only checks', path)
    part = rep(part,
        '    byId[id] = row;',
        '    customerErrors12451.set(row, customerSourceErrors12451);\n    byId[id] = row;',
        'retain validation without adding fields to supplier rows', path)
    old = "  const days = Object.values(byDate).sort((a,b) => a.date.localeCompare(b.date));\n  return {byId, byDate, days, issues, hours: rounded(sumDecimal(days.map(x=>x.hours))), amount: rounded(sumDecimal(days.map(x=>x.amount)))};"
    new = """  const days = Object.values(byDate).sort((a,b) => a.date.localeCompare(b.date));
  /* customerAggregate12451: one existing source-confirmed aggregate per event day.
     Supplier quote/rate/journal checks retain their own result above. */
  const customerDays12451 = [], customerIssues12451 = [];
  groups.forEach((rows, day) => {
    if (rows.length !== 1) {
      customerIssues12451.push({date: day, reason: 'More than one whole-day crew total is linked to this date.'});
      return;
    }
    const row = rows[0];
    if (!row.customerScopeConfirmed) {
      customerIssues12451.push({id: row.id, date: day, errors: customerErrors12451.get(row).slice()});
      return;
    }
    customerDays12451.push({id: row.id, date: day, hours: row.hours});
  });
  customerDays12451.sort((a,b) => a.date.localeCompare(b.date));
  const expectedCustomerDays12451 = [...new Set(env.days || [])].sort();
  if (!expectedCustomerDays12451.length)
    customerIssues12451.push({reason: 'The customer event dates are unavailable.'});
  for (const day of expectedCustomerDays12451) if (!groups.has(day))
    customerIssues12451.push({date: day, reason: 'Documented customer crew hours are unavailable for this date.'});
  const customerComplete12451 = expectedCustomerDays12451.length > 0 && !customerIssues12451.length &&
    customerDays12451.length === expectedCustomerDays12451.length &&
    customerDays12451.every((day, index) => day.date === expectedCustomerDays12451[index]);
  const customer = {complete: customerComplete12451,
    hours: customerComplete12451 ? rounded(sumDecimal(customerDays12451.map(day=>day.hours))) : null,
    days: customerDays12451, issues: customerIssues12451};
  return {byId, byDate, days, issues, hours: rounded(sumDecimal(days.map(x=>x.hours))), amount: rounded(sumDecimal(days.map(x=>x.amount))), customer};"""
    part = rep(part, old, new, 'customer evidence from the existing validated groups', path)
    text = rep(text, original, part, 'add customer aggregate without altering supplier results', path)
    old = 'const empty = {byId: {}, byDate: {}, days: [], issues: [], hours: 0, amount: 0};'
    new = "const empty = {byId: {}, byDate: {}, days: [], issues: [], hours: 0, amount: 0, customer: {complete: false, hours: null, days: [], issues: [{reason: 'Documented customer crew hours are unavailable.'}]}};"
    return rep(text, old, new, 'empty native reader exposes unavailable customer evidence', path)
