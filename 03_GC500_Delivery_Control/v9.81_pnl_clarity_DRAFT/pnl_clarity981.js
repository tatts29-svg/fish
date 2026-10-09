/* Author: Andrew Fisher. Presentation only: all amounts retain their existing source models. */
(function (root) {
'use strict';
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
    '<span>Recorded</span><span style="text-align:right">' + price(row.recorded) + '</span>' +
    '<span>Forecast remaining</span><span style="text-align:right">' + price(remaining(row.recorded, row.job)) + '</span>' +
    '<span>Job forecast</span><b style="text-align:right">' + price(row.job) + '</b></div>' +
    (row.details ? '<details class="units925-edit"><summary>More info</summary><p>' + esc(row.details) + '</p></details>' : '') + '</article>';
}
function group(title, rows, total, revenue) {
  return '<div data-financial976>' + card({...total, label: title}) +
    '<details class="units925-edit"><summary>More info · ' + esc(title.toLowerCase()) + ' lines</summary>' +
    rows.map(row => card({code: row.code, label: label(row.line, revenue), recorded: row.now, job: row.job,
      details: [row.what, row.basis, row.missing && 'Unpriced: ' + row.missing].filter(Boolean).join(' · ')})).join('') + '</details></div>';
}
const priorPl = pl770Card;
pl770Card = function () {
  let P;
  try { P = pl770Model(); } catch (_) { return priorPl.apply(this, arguments); }
  // Recovery ratios stay sourced from the existing renderer. Do not recreate their calculation here.
  const legacy = document.createElement('div'); legacy.innerHTML = priorPl.apply(this, arguments);
  const recovery = [...legacy.querySelectorAll('.fin745-block')].find(n => /^Recovery/.test(n.querySelector('h3')?.textContent || ''));
  if (recovery) { recovery.querySelector('h3').textContent = 'Recovery'; recovery.querySelectorAll('.fin745-blockhead p').forEach(n => n.remove()); }
  const X = cj764Model(), gaps = X.gaps?.length || 0;
  const combined = branchFinancial978(pl752Rows(), moneySummary()).total;
  const checks = Object.entries(P.checks || {}).filter(([, value]) => value === false);
  const warnings = '<div class="filters" style="margin:8px 0">' +
    (gaps ? '<button class="chip warn" data-jump765="costs764">' + esc(gaps) + ' cost gaps</button>' : '') +
    (P.wages.unpricedHours ? '<button class="chip warn" data-jump765="finance745">' + esc(fmtNum(P.wages.unpricedHours)) + ' labour hours unpriced</button>' : '') + '</div>';
  const reconciliation = checks.length ? '<div class="notice warn">Financial reconciliation needs review<details><summary>More info</summary>' +
    checks.map(([key]) => '<p>' + esc(key) + '</p>').join('') + '</details></div>' : '';
  return '<section id="pl770" class="fin745 pl770 nosfold" aria-labelledby="pl770Title" data-pnl981>' +
    '<h2 id="pl770Title">P&amp;L · whole job</h2><p class="fin745-eyebrow">AUD EX GST · ' + esc(fmtDate(P.asAt)) + '</p>' +
    reconciliation + warnings +
    group('Revenue', P.rev, {recorded: P.revNow, job: P.revJob}, true) +
    group('Direct costs', P.cost, {recorded: P.direct, job: P.directJob}, false) +
    card({label: 'Overheads · travel, accommodation, meals and printing', recorded: P.over, job: P.overJob,
      details: 'Finance confirms any journal allocation.'}) +
    card({label: 'Wages · priced', recorded: P.wages.toDate, job: P.wages.job,
      details: 'Includes temporary staff and the salary allowance. Unpriced wage hours are excluded.'}) +
    '<div data-pnl981-resultcard>' + card({label: 'Difference so far — not a margin yet',
      recorded: combined.contribution, job: combined.contributionJob,
      details: 'Revenue less all priced costs, including overheads and priced wages.'}) + '</div>' +
    '<details class="units925-edit"><summary>More info · Revenue basis and recovery</summary>' +
    '<dl><dt>Recorded</dt><dd>Contract, card, docket and approved scope charges on the current record.</dd>' +
    '<dt>Job forecast</dt><dd>Recorded charges plus the remaining priced work for all scheduled equipment.</dd>' +
    '<dt>Onsite Revenue</dt><dd>Arrived equipment with its complete applicable charges.</dd>' +
    '<dt>Invoiced</dt><dd>Contract export status in Finance handover.</dd></dl>' + (recovery?.outerHTML || '') + '</details></section>';
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
    'Current record': 'Recorded', 'Allocated costs': 'Costs incl. overheads & wages',
    'Still to come': 'Forecast remaining', 'To job end': 'Job forecast', 'Of which to date': 'Recorded',
    'Revenue on the record': 'Recorded Revenue', 'Billed': 'Invoiced', 'Not yet billed': 'Not invoiced',
    'Labour we charge': 'Installation Revenue', 'Total labour we charge': 'Total Installation Revenue',
    'Labour — what we charge, and what it costs us': 'Installation Revenue and wages',
    'What we charge for labour': 'Installation Revenue', 'What the labour costs us': 'Wages',
    'Labour cost': 'Wages', 'Total labour cost priced': 'Total priced wages',
    'Charged so far': 'Recorded', 'Forecast to job end': 'Job forecast'};
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
  text(pane.querySelector('.hubhead .sub'), 'Coates → V8 Supercars · AUD ex GST');
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
  // Finance abbreviates these distinct source rows to "Rehire". Restore their identities,
  // checking both ordered amounts and stream before displaying any source association.
  const H = fh866Model(), source = cj764Model().rows;
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
function apply() {
  const pane = document.getElementById('pane-costs'); if (!pane) return;
  compactSummary(pane); compactHandover(pane);
  // Links must open their retained source section after the new disclosure has been inserted.
  pane.querySelectorAll('[data-jump765]').forEach(button => button.onclick = () => {
    const target = pane.querySelector('#' + button.dataset.jump765); if (!target) return;
    for (let n = target; n && n !== pane; n = n.parentElement) if (n.tagName === 'DETAILS') n.open = true;
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
  });
}
root.PnlClarity981 = {apply, label};
const renderBefore = renderCosts;
renderCosts = function () { const value = renderBefore.apply(this, arguments); apply(); return value; };
})(window);
