/* Author: Andrew Fisher. Presentation only: all amounts retain their existing source models. */
(function (root) {
'use strict';
const customer = Object.freeze({name: 'V8 Supercars Aust Pty', code: 'V8SU0845', site: 'QLD_GOLD COAST 600'});
const precise = n => typeof n === 'number' && Number.isFinite(n);
const remaining = (a, b) => precise(a) && precise(b) ? Math.round((b - a) * 100) / 100 : null;
const price = n => precise(n) ? esc(money(n)) : '<span class="pl-todo">Unpriced</span>';
const labels = {
  'Transport': 'Transport Revenue',
  'Labour Install': 'Installation',
  'Labour — Install': 'Installation',
  'Re Hire Contract Costs': 'Rehire',
  'Installation - External Contractors': 'Installation — external contractors',
  'Installation - Internal Labour': 'Installation — internal labour'
};
function label(value, revenue) {
  if (value === 'Transport' && !revenue) return 'Transport (cartage)';
  return labels[value] || value;
}
function card(row) {
  return '<article class="card" style="min-width:0;margin:8px 0;padding:12px"><b>' +
    (row.code ? '<span class="chip ref mono">' + esc(row.code) + '</span> ' : '') + esc(row.label) + '</b>' +
    '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;margin:10px 0">' +
    '<span>Current record</span><span style="text-align:right">' + price(row.recorded) + '</span>' +
    '<span>Additional forecast</span><span style="text-align:right">' + price(remaining(row.recorded, row.job)) + '</span>' +
    '<span>Job forecast</span><b style="text-align:right">' + price(row.job) + '</b></div>' +
    (row.details ? '<details class="units925-edit"><summary>More info</summary><p>' + esc(row.details) + '</p></details>' : '') + '</article>';
}
function groups(P) {
  const r2 = n => Math.round(n * 100) / 100;
  function combine(label, source, predicate) {
    const rows = source.filter(predicate);
    const sum = key => rows.some(r => precise(r[key])) ? r2(rows.reduce((n, r) => n + (precise(r[key]) ? r[key] : 0), 0)) : null;
    return {label, rows, recorded: sum('now'), job: sum('job'),
      unpriced: rows.filter(r => !precise(r.now) || !precise(r.job)).length};
  }
  const revenue = [
    combine('Hire Revenue', P.rev, r => r.code === '1005'),
    combine('Rehire Revenue', P.rev, r => r.code === '1010'),
    combine('Transport Revenue', P.rev, r => ['1030 · 1031', '1032'].includes(r.code)),
    combine('Other Revenue', P.rev, r => ['1020', '1047', '1025', '1015'].includes(r.code)),
    combine('Revenue · allocation pending', P.rev, r => !['1005', '1010', '1030 · 1031', '1032', '1020', '1047', '1025', '1015'].includes(r.code))
  ].filter(r => r.rows.length);
  const costs = [
    combine('Total Repairs & Maintenance', P.cost, r => r.code === '2357'),
    combine('Transport', P.cost, r => ['2120 · 2140', '3325'].includes(r.code)),
    combine('Rehire', P.cost, r => r.code === '2126'),
    combine('Other Direct Costs', P.cost, r => ['2144', '2142'].includes(r.code)),
    combine('Direct costs · allocation pending', P.cost, r => !['2357', '2120 · 2140', '3325', '2126', '2144', '2142'].includes(r.code))
  ].filter(r => r.rows.length);
  return {revenue, costs, checks: {
    revenue: r2(revenue.reduce((n, r) => n + r.recorded, 0)) === P.revNow,
    revenueJob: r2(revenue.reduce((n, r) => n + r.job, 0)) === P.revJob,
    costs: r2(costs.reduce((n, r) => n + r.recorded, 0)) === P.direct,
    costsJob: r2(costs.reduce((n, r) => n + r.job, 0)) === P.directJob
  }};
}
function statement(rows) {
  const cells = row => [row.recorded, remaining(row.recorded, row.job), row.job].map(n =>
    '<td class="num">' + price(n) + '</td>').join('');
  return '<div class="branch978-desktop tblwrap"><table class="pl-tbl"><thead><tr>' +
    '<th>GC500</th><th class="num">Current record</th><th class="num">Additional forecast</th><th class="num">Job forecast</th>' +
    '</tr></thead><tbody>' + rows.map(row => row.section ? '<tr><th colspan="4">' + esc(row.section) + '</th></tr>' :
      '<tr' + (row.total ? ' class="tot"' : '') + (row.result ? ' data-pnl981-resultcard' : '') + '><td>' +
      (row.total ? '<b>' : '') + esc(row.label) + (row.total ? '</b>' : '') +
      (row.unpriced ? ' <span class="chip warn">' + row.unpriced + ' unpriced</span>' : '') + '</td>' + cells(row) + '</tr>').join('') +
    '</tbody></table></div><div class="branch978-mobile">' + rows.map(row => row.section ? '<h3>' + esc(row.section) + '</h3>' :
      '<div' + (row.result ? ' data-pnl981-resultcard' : '') + '>' + card({...row, label: row.label + (row.unpriced ? ' · ' + row.unpriced + ' unpriced' : '')}) + '</div>').join('') + '</div>';
}
function sources(G) {
  const section = (title, rows, revenue) => '<h3>' + esc(title) + '</h3>' + rows.map(group =>
    '<details class="units925-edit"><summary>' + esc(group.label) + '</summary>' + group.rows.map(row =>
      card({code: row.code, label: label(row.line, revenue), recorded: row.now, job: row.job,
        details: [row.what, row.basis, row.missing && 'Unpriced: ' + row.missing].filter(Boolean).join(' · ')})).join('') + '</details>').join('');
  return section('Revenue', G.revenue, true) + section('Direct costs', G.costs, false);
}
function failedChecks(P, G) {
  return [...Object.entries(P.checks || {}).map(([key, value]) => ['ledger.' + key, value]),
    ...Object.entries(G.checks || {}).map(([key, value]) => ['groups.' + key, value])].filter(([, value]) => value === false);
}
const priorPl = pl770Card;
pl770Card = function () {
  let P;
  try { P = pl770Model(); } catch (_) { return priorPl.apply(this, arguments); }
  // Recovery ratios stay sourced from the existing renderer. Do not recreate their calculation here.
  const legacy = document.createElement('div'); legacy.innerHTML = priorPl.apply(this, arguments);
  const recovery = [...legacy.querySelectorAll('.fin745-block')].find(n => /^Recovery/.test(n.querySelector('h3')?.textContent || ''));
  if (recovery) {
    recovery.querySelector('h3').textContent = 'Recovery'; recovery.querySelectorAll('.fin745-blockhead p').forEach(n => n.remove());
    [...recovery.querySelectorAll('tbody > tr')].forEach((row, index) => {
      const ratio = P.rec[index]; if (!ratio || row.children.length < 4 || !row.children[0].textContent.includes(ratio.name)) return;
      text(row.children[0], ratio.name === 'Installation Recovery' ? 'Labour Recovery — Installation' :
        ratio.name === 'Consumables Recovery' ? 'Consumable Recovery' : ratio.name);
      text(row.children[2], precise(ratio.now) ? (ratio.now * 100).toFixed(1) + '%' : 'Unavailable');
      text(row.children[3], precise(ratio.job) ? (ratio.job * 100).toFixed(1) + '%' : 'Unavailable');
    });
  }
  const X = cj764Model(), gaps = X.gaps?.length || 0;
  const combined = branchFinancial978(pl752Rows(), moneySummary()).total, G = groups(P);
  const checks = failedChecks(P, G);
  const warnings = '<div class="filters" style="margin:8px 0">' +
    (gaps ? '<button class="chip warn" data-jump765="costs764">' + esc(gaps) + ' cost gaps</button>' : '') +
    (P.wages.unpricedHours ? '<button class="chip warn" data-jump765="finance745">' + esc(fmtNum(P.wages.unpricedHours)) + ' labour hours unpriced</button>' : '') + '</div>';
  const reconciliation = checks.length ? '<div class="notice warn">Financial reconciliation needs review<details><summary>More info</summary>' +
    checks.map(([key]) => '<p>' + esc(key) + '</p>').join('') + '</details></div>' : '';
  const rows = [
    {section: 'Revenue'}, ...G.revenue,
    {label: 'Total Revenue · priced', recorded: P.revNow, job: P.revJob, total: true},
    {section: 'Direct costs'}, ...G.costs,
    {label: 'Total Direct Costs · priced', recorded: P.direct, job: P.directJob, total: true},
    {label: 'Gross Margin · known costs', recorded: P.gm.now, job: P.gm.job, total: true},
    {section: 'Overheads and wages'},
    {label: 'Direct Staff · priced wages', recorded: P.wages.toDate, job: P.wages.job},
    {label: 'Travel, accommodation, meals and printing', recorded: P.over, job: P.overJob},
    {label: 'Difference so far — not a margin yet', recorded: combined.contribution, job: combined.contributionJob, total: true, result: true}
  ];
  return '<section id="pl770" class="fin745 pl770 nosfold" aria-labelledby="pl770Title" data-pnl981>' +
    '<h2 id="pl770Title">Whole-job operational forecast</h2><p class="fin745-eyebrow">AUD EX GST · ' + esc(fmtDate(P.asAt)) + '</p>' +
    '<p data-pnl981-basis>Operational forecast · costs include estimates and commitments</p>' +
    reconciliation + warnings + statement(rows) +
    '<details class="units925-edit"><summary>More info · ledger lines and sources</summary>' + sources(G) + '</details>' +
    '<details class="units925-edit"><summary>More info · Revenue basis and recovery</summary>' +
    '<dl><dt>Current record</dt><dd>Contract, card, docket and approved scope charges on the current record. Cost estimates and commitments are not confirmation of receipt or a posted P&amp;L expense. Check PO receipt and branch allocation in Finance.</dd>' +
    '<dt>Job forecast</dt><dd>Current record plus additional forecast. Includes equipment, fencing and other job work.</dd>' +
    '<dt>Onsite Revenue</dt><dd>Arrived equipment with its complete applicable charges. This is a Revenue subtotal, not an extra amount to add to the whole-job forecast.</dd>' +
    '<dt>Invoiced</dt><dd>Contract export status in Finance handover.</dd>' +
    '<dt>Gross Margin · known costs</dt><dd>Revenue less the known direct costs; excludes overheads and unpriced costs.</dd>' +
    '<dt>Difference so far</dt><dd>Revenue less all priced costs, including overheads and priced wages.</dd>' +
    '<dt>Direct Staff</dt><dd>Priced wages and salary allowance. Any journal to Installation remains a Finance allocation.</dd>' +
    '<dt>EBITDA, depreciation and EBIT</dt><dd>Incomplete job-cost basis; no final result reported.</dd></dl>' +
    (recovery?.outerHTML || '') + '</details></section>';
};

const priorOnsite = onsiteCompleteHtml979;
onsiteCompleteHtml979 = function () {
  const box = document.createElement('div'); box.innerHTML = priorOnsite.apply(this, arguments);
  const section = box.querySelector('[data-onsite979]');
  if (!section) return box.innerHTML;
  section.querySelector(':scope > b').textContent = 'Onsite equipment · complete charges';
  section.querySelector(':scope > small').textContent = 'Priced Revenue subtotal · AUD ex GST';
  const map = {'Hire': 'Hire / Rehire Revenue', 'Work': 'Installation & cleaning Revenue',
    'Delivery / pickup': 'Transport Revenue', 'Total': 'Priced Revenue', 'Priced total': 'Priced Revenue'};
  section.querySelectorAll('th,dt').forEach(n => { if (map[n.textContent]) n.textContent = map[n.textContent]; });
  const basis = section.querySelector(':scope > details > p');
  if (basis) basis.textContent = 'Arrived equipment: full applicable charges, including future cleaning, demob and pickup. Physical completion and invoicing are separate.';
  const detail = section.querySelector(':scope > details');
  if (detail) {
    text(detail.querySelector(':scope > summary'), 'More info · branch split and rate holds');
    section.querySelectorAll(':scope > .branch978-desktop,:scope > .branch978-mobile').forEach(n => detail.insertBefore(n, basis));
  }
  return box.innerHTML;
};

function text(node, value) { if (node) node.textContent = value; }
function fold(node, title, key) {
  if (!node || node.closest('[data-pnl981-fold]')) return;
  const d = document.createElement('details'); d.className = 'plfold765'; d.dataset.pnl981Fold = key;
  d.dataset.sfold = 'pnl981|' + key; d.open = SFOLD_OPEN.has(d.dataset.sfold);
  const summary = document.createElement('summary'); summary.textContent = title;
  node.before(d); d.append(summary, node);
}
function foldProse(scope, key) {
  if (!scope) return;
  const candidates = [...scope.querySelectorAll('p.fin745-basis,p.pl-note,p.maphint,.fin745-heading p:not(.fin745-eyebrow),.fin745-blockhead p')];
  candidates.forEach((n, index) => {
    if (n.closest('details') || n.querySelector('input,select,textarea,button') || !n.textContent.trim()) return;
    // Keep live discrepancy notices outside the closed source disclosure.
    const warnings = [...n.querySelectorAll('.fh866-todo,.notice.warn,[role="alert"]')];
    warnings.forEach(w => n.before(w));
    fold(n, 'More info', key + '-basis-' + index);
  });
}
function normaliseLabels(scope) {
  const map = {'Provisional contribution': 'Difference so far', 'V8 charges': 'Revenue',
    'Allocated costs': 'Costs incl. overheads & wages',
    'Still to come': 'Additional forecast', 'To job end': 'Job forecast', 'Of which to date': 'Current record',
    'Revenue on the record': 'Recorded Revenue', 'Billed': 'Invoiced', 'Not yet billed': 'Not invoiced',
    'Labour we charge': 'Installation Revenue', 'Total labour we charge': 'Total Installation Revenue',
    'Labour — what we charge, and what it costs us': 'Installation Revenue and wages',
    'What we charge for labour': 'Installation Revenue', 'What the labour costs us': 'Wages',
    'Labour cost': 'Wages', 'Total labour cost priced': 'Total priced wages',
    'Charged so far': 'Current record', 'Forecast to job end': 'Job forecast'};
  scope.querySelectorAll('th,h2,h3,h4,b,span,td').forEach(n => {
    if (n.children.length) return;
    const value = n.textContent.trim(); if (map[value]) n.textContent = map[value];
  });
}
function compactSummary(pane) {
  if (!pane.querySelector('#pl770')) return;
  // These five glance tiles repeat figures already held in P&L, labour and month-end.
  pane.querySelector('#costs765')?.remove();
  text(pane.querySelector('.hubhead h2'), 'P&L');
  pane.querySelector(':scope > .maphint')?.remove();
  const branch = pane.querySelector('[data-branch978]');
  if (branch) {
    text(branch.querySelector(':scope > h4'), 'By branch · Revenue and Coates costs');
    fold(branch, 'More info · Branch split', 'branch');
  }
  const labour = pane.querySelector('#labour865');
  if (labour) {
    labour.querySelector('.fin745-metrics')?.remove(); // Totals are already in its source tables.
    labour.querySelectorAll('.fin745-heading p:not(.fin745-eyebrow)').forEach(n => n.remove());
    foldProse(labour, 'labour');
    fold(labour, 'More info · Installation Revenue and wages', 'labour');
  }
  const summaryNames = {pl752: 'More info · contract and docket sources', costs764: 'More info · forecast and unpriced costs',
    rehire766: 'More info · Rehire Revenue and Rehire costs', accruals761: 'More info · month-end accruals',
    finance745: 'More info · wage rates and Finance controls'};
  pane.querySelectorAll('details.costs-audit-fold[data-costs-audit]').forEach(d => {
    const title = summaryNames[d.dataset.costsAudit]; if (!title) return;
    const summary = d.querySelector(':scope > summary');
    text(summary?.querySelector('b'), title); summary?.querySelector('small')?.remove();
  });
  text(pane.querySelector('#cj765monthend'), 'Finance');
  text(pane.querySelector('#cj765detail'), 'Source records');
  pane.querySelectorAll(':scope > details.plfold765 > summary > small').forEach(n => n.remove());
  const recon = pane.querySelector('#recon888 > summary');
  if (recon) { const first = recon.querySelector('b,strong'); if (first && /Everything reconciles/.test(first.textContent)) text(first, 'Reconciliation'); recon.querySelectorAll('small').forEach(n => n.remove()); }
  normaliseLabels(pane);
}
function compactHandover(pane) {
  const section = pane.querySelector('#handover866'); if (!section) return;
  text(section.querySelector('#fh866Title'), 'Finance handover');
  section.querySelector('.fin745-heading p:not(.fin745-eyebrow)')?.remove();
  const metrics = section.querySelector('.fh866-metrics');
  if (metrics) {
    // Demob and unbilled amounts are already in the tables; retain unique receipt-status counts.
    [...metrics.children].slice(2).forEach(n => n.remove());
  }
  const blocks = [...section.querySelectorAll(':scope > .fin745-block')];
  blocks.forEach((block, i) => {
    const heading = block.querySelector('.fin745-blockhead h3');
    if (i === 0) text(heading, 'Purchase orders');
    if (i === 1) text(heading, 'Coates costs by branch · job forecast');
    if (i === 2) text(heading, 'Demob costs · included in job forecast');
    if (i === 3) { text(heading, heading.textContent.replace(/^4\. Invoice by/, 'Invoice by')); }
    foldProse(block, 'handover-' + i);
  });
  const wageHeadings = [...(blocks[1]?.querySelectorAll(':scope > h4.fh868-h') || [])];
  if (wageHeadings.length) {
    const detail = document.createElement('div');
    wageHeadings[0].before(detail);
    wageHeadings.forEach(heading => {
      const table = heading.nextElementSibling;
      detail.append(heading);
      if (table?.classList.contains('fin745-table')) detail.append(table);
    });
    fold(detail, 'More info · wages by person and branch allocation', 'finance-wages');
  }
  // Finance abbreviates these distinct source rows to "Rehire". Restore their identities,
  // checking both ordered amounts and stream before displaying any source association.
  const H = fh866Model(), source = cj764Model().rows;
  const poNote = metrics?.children[1]?.querySelector('small');
  if (H.noValue) text(poNote, fmtNum(H.noValue) + ' purchase orders unpriced');
  else poNote?.remove();
  const costRows = [...(blocks[1]?.querySelector(':scope > .fin745-table')?.querySelectorAll('tbody > tr') || [])];
  H.costs.forEach((cost, i) => {
    const row = costRows[i]; if (!row || row.children.length !== H.cols.length + 4) return;
    if (cost.stream === 'Salary allowance') {
      row.children[1].textContent = '—';
      row.children[1].title = 'Salary allowance; no supplier purchase order linked';
      return;
    }
    const src = source[i];
    if (!src || cost.stream !== src.stream.replace(/ — .*$/, '') || cost.toDate !== (src.toDate || 0) || cost.toCome !== (src.toCome || 0)) return;
    const title = document.createElement('b');
    title.textContent = cost.stream === 'Fencing' ? 'Fencing — Advanced Temporary Fencing' :
      cost.stream === 'Toilets' ? 'Event Portables' : src.stream;
    const reference = String(src.note || '').match(/contract\s+(\d+)\s+line\s+(\d+)/i);
    row.children[0].replaceChildren(title);
    if (reference) {
      const detail = document.createElement('small'); detail.style.display = 'block';
      detail.textContent = 'Contract ' + reference[1] + ' · line ' + reference[2]; row.children[0].append(detail);
    }
  });
  normaliseLabels(section);
}
function handoverExport(H) {
  const source = cj764Model().rows;
  return {...H, costs: H.costs.map((cost, i) => {
    if (cost.stream === 'Salary allowance') return {...cost, pos: []};
    const src = source[i];
    if (!src || cost.stream !== src.stream.replace(/ — .*$/, '') || cost.toDate !== (src.toDate || 0) || cost.toCome !== (src.toCome || 0)) return cost;
    const reference = String(src.note || '').match(/contract\s+(\d+)\s+line\s+(\d+)/i);
    const name = cost.stream === 'Fencing' ? 'Fencing — Advanced Temporary Fencing' : cost.stream === 'Toilets' ? 'Event Portables' : src.stream;
    return {...cost, stream: name + (reference ? ' · contract ' + reference[1] + ' line ' + reference[2] : '')};
  })};
}
// Presentation copies for exports: amounts, branch allocations and source models are untouched.
const previousCsv = fh866Csv, previousText = fh866Text;
fh866Csv = function (H) {
  const identity = [['Customer', customer.name], ['Customer code', customer.code], ['Site code', customer.site]];
  return identity.map(row => row.map(fin745CsvCell).join(',')).join('\r\n') + '\r\n' + previousCsv.call(this, handoverExport(H));
};
fh866Text = function (H) {
  return 'Customer: ' + customer.name + '\nCustomer code: ' + customer.code + '\nSite code: ' + customer.site + '\n\n' + previousText.call(this, handoverExport(H));
};
function apply() {
  const pane = document.getElementById('pane-costs'); if (!pane) return;
  compactSummary(pane); compactHandover(pane);
  let identity = pane.querySelector('[data-pnl981-customer], .hubhead .sub');
  if (!identity) {
    identity = document.createElement('p'); identity.className = 'sub';
    const navigation = pane.querySelector(':scope > .finance857-nav');
    if (navigation) navigation.after(identity); else pane.prepend(identity);
  }
  identity.dataset.pnl981Customer = '';
  text(identity, 'Customer: ' + customer.name + ' · Customer code: ' + customer.code + ' · Site: ' + customer.site);
  // Links must open their retained source section after the new disclosure has been inserted.
  pane.querySelectorAll('[data-jump765]').forEach(button => button.onclick = () => {
    const target = pane.querySelector('#' + button.dataset.jump765); if (!target) return;
    for (let n = target; n && n !== pane; n = n.parentElement) if (n.tagName === 'DETAILS') n.open = true;
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
  });
}
root.PnlClarity981 = {apply, label, groups, failedChecks, handoverExport, customer};
const renderBefore = renderCosts;
renderCosts = function () { const value = renderBefore.apply(this, arguments); apply(); return value; };
})(window);
