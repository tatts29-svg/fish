/* Author: Andrew Fisher. Monthly financial control: review records, never post to a ledger. */
const FIN745_UI = {month: '', person: '', form: null, error: '', message: ''};
const FIN745_WORDS = {salary: 'Salary', cna: 'Coates CNA', hire: 'Labour hire', confirmed: 'Hours confirmed', unconfirmed: 'Awaiting confirmation', forecast: 'Future plan', changed: 'Changed — review required', allocation: 'Allocation to Installation', accrual: 'Accrual — cost incurred, invoice/payroll outstanding', wip: 'WIP / cost deferral — Finance decision', reversal: 'Reversal', draft: 'Draft', review: 'For Finance review', approved: 'Approval recorded', posted: 'Posted externally — reference recorded', void: 'Withdrawn', unverified: 'Allocation not verified', needed: 'Allocation required', allocated: 'Already allocated — evidence recorded'};
function fin745MoneyText(n){ return n == null ? 'Not priced' : new Intl.NumberFormat('en-AU', {style: 'currency', currency: 'AUD'}).format(n); }
function fin745Hours(n){ return new Intl.NumberFormat('en-AU', {maximumFractionDigits: 2}).format(n || 0) + ' h'; }
function fin745MonthLabel(m){ return /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? new Date(m + '-01T00:00:00Z').toLocaleDateString('en-AU', {month: 'long', year: 'numeric', timeZone: 'Australia/Brisbane'}) : m; }
function fin745SelectedMonth(){ return FIN745_UI.month || todayIso().slice(0, 7); }
function fin745Button(label, action, key, disabled){ return `<button type="button" class="btn ghost sm" data-f745="${esc(action)}" data-key="${esc(key || '')}"${disabled ? ' disabled' : ''}>${esc(label)}</button>`; }
function fin745Card(label, value, note){ return `<div class="fin745-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`; }
function fin745People(rows){
 const out = new Map();
 rows.forEach(r => { if (!out.has(r.person)) out.set(r.person, {name: r.person, type: r.type, rows: [], confirmed: 0, pending: 0, future: 0, verified: 0, verifiedN: 0});
  const p = out.get(r.person); p.rows.push(r); p[r.status === 'confirmed' ? 'confirmed' : r.status === 'forecast' ? 'future' : 'pending'] += r.worked || 0;
  if (r.status === 'confirmed' && r.actualCost != null) { p.verified += r.actualCost; p.verifiedN++; }
 });
 return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function fin745Html(){
 const month = fin745SelectedMonth(), sum = fin745Summary(month), job = fin745Summary(), ro = !canEdit();
 const billing = fin745Latest('billing', month), bill = billing ? billing.payload : {expectedMonth: month, reason: ''};
 const journals = fin745List('journal').filter(e => [e.payload.workMonth, e.payload.postingMonth, e.payload.reversalMonth].includes(month));
 const people = fin745People(sum.rows), person = people.find(p => p.name === FIN745_UI.person), orphans = fin745Orphans();
 const futureRows = sum.rows.filter(r => r.status === 'forecast'), futureUnknown = futureRows.filter(r => r.calculatedCost == null).length;
 const futureValue = futureRows.length && futureUnknown === futureRows.length ? 'Not priced' : fin745MoneyText(sum.forecastCost);
 const jobValue = job.rows.length && job.unpricedCount === job.rows.length ? 'Not priced' : fin745MoneyText(job.expectedCost);
 return `<section id="finance745" class="fin745 nosfold" aria-labelledby="fin745Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">MONTH-END CONTROL · AUD EX GST</p><h2 id="fin745Title">Actuals, forecast &amp; Finance journals</h2><p>What has happened, what is still expected, and what Finance needs to review.</p></div>
 <div class="fin745-tools"><label for="fin745Month">Work month</label><input type="month" id="fin745Month" data-ro value="${esc(month)}"><div>${fin745Button('Export Finance CSV', 'csv')}${fin745Button('Export review backup', 'backup')}</div></div></div>
 <div class="fin745-guide"><b>Three separate dates:</b> work month · expected billing month · journal posting month. Delayed billing does not automatically move a cost. This page records proposals and external posting evidence; it does not post to Finance systems.</div>
 ${ro ? '<p class="fin745-readonly">View only. Open your usual edit link to confirm hours, set cost assumptions or record a Finance journal proposal.</p>' : ''}
 ${FIN745_UI.message ? `<p class="fin745-message" role="status">${esc(FIN745_UI.message)}</p>` : ''}
 <div class="fin745-metrics">
 ${fin745Card('Confirmed worked hours · this month', fin745Hours(sum.confirmedHours), fin745Hours(sum.pendingHours) + ' past hours awaiting confirmation or review')}
 ${fin745Card('Verified payroll / invoice cost · this month', sum.actualCostCount ? fin745MoneyText(sum.actualCost) : 'Not verified', sum.actualCostCount + ' shift costs evidenced; calculated wages are not ledger actuals')}
 ${fin745Card('Future planned labour · this month', futureValue, fin745Hours(sum.forecastHours) + ' future work; ' + futureUnknown + ' shifts unpriced')}
 ${fin745Card('Whole-job labour outlook', jobValue, (job.complete && !orphans.length ? 'All current hours priced' : 'PARTIAL — ' + fin745Hours(job.unpricedHours) + ' paid/allocation hours unpriced') + '; includes unresolved past estimates')}
 </div>
 <p class="fin745-basis">Whole-job outlook = verified cost where recorded, otherwise hours × cost rate, plus future plan and unconfirmed past estimates, each counted once. ${esc(fin745Hours(job.pendingHours))} past hours still need confirmation. This is labour only, not total project cost, customer charges, profit or an invoice. On-costs are included only where the entered rate basis says so. No hours beyond the running sheet are assumed.</p>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>1. Labour — ${esc(fin745MonthLabel(month))}</h3><p>Confirm worked hours explicitly. Use the Running sheet to correct or extend the plan.</p></div>${fin745Button('Open Running sheet', 'runsheet')}</div>
 <div class="fin745-table"><table><thead><tr><th>Person / type</th><th>Confirmed worked</th><th>Past, unconfirmed</th><th>Future planned</th><th>Verified cost</th><th>Cost rate / basis</th><th>Review</th></tr></thead><tbody>${people.length ? people.map(p => { const first = p.rows[0]; return `<tr><th scope="row">${esc(p.name)}<small>${esc(FIN745_WORDS[p.type] || 'Type not recorded')}</small></th><td>${esc(fin745Hours(p.confirmed))}</td><td>${esc(fin745Hours(p.pending))}</td><td>${esc(fin745Hours(p.future))}</td><td>${p.verifiedN ? esc(fin745MoneyText(p.verified)) : 'Not verified'}</td><td>${esc(fin745MoneyText(first.rate))}${first.rate != null ? ' / h' : ''}<small>${esc(first.rateBasis || 'No cost rate')}</small>${fin745Button('Set cost rate', 'rate', p.name, ro)}</td><td>${fin745Button(FIN745_UI.person === p.name ? 'Hide shifts' : 'Review shifts', 'person', p.name)}</td></tr>`; }).join('') : '<tr><td colspan="7">No usable labour shifts recorded for this month. Add the plan on the Running sheet; no actuals or forecasts have been invented.</td></tr>'}</tbody></table></div>
 ${person ? `<div class="fin745-shifts"><h4>${esc(person.name)} · source shifts</h4><p>Worked hours and paid/allocation hours are separate. Unknown cost is not zero.</p><div class="fin745-table"><table><thead><tr><th>Work date</th><th>Worked / paid h</th><th>Review state</th><th>Calculated cost</th><th>Verified cost</th><th>Allocation</th><th></th></tr></thead><tbody>${person.rows.map(r => `<tr><td>${esc(r.date)}<small>${esc(r.id)}</small></td><td>${esc(fin745Hours(r.worked))}<small>${esc(fin745Hours(r.paid))} paid / allocation</small></td><td><span class="fin745-state ${r.status === 'changed' ? 'fin745-alert' : ''}">${esc(FIN745_WORDS[r.status] || r.status)}</span></td><td>${esc(fin745MoneyText(r.calculatedCost))}</td><td>${r.actualCost != null && r.status === 'confirmed' ? esc(fin745MoneyText(r.actualCost)) : 'Not verified'}</td><td>${esc(FIN745_WORDS[r.allocation] || 'Allocation not verified')}</td><td>${fin745Button('Review / confirm', 'review', r.id, ro || r.status === 'forecast')}${r.review ? fin745Button('History', 'history-review', r.id) : ''}</td></tr>`).join('')}</tbody></table></div>
 ${fin745Button('Prepare allocation proposal', 'allocate', person.name, ro || !person.rows.some(r => r.status === 'confirmed' && r.allocation !== 'allocated'))}</div>` : ''}
 ${orphans.length ? `<p class="fin745-alert">${orphans.length} prior confirmation(s) have a missing source shift. Kept in review history and the backup; not silently counted as current actuals.</p>` : ''}</div>
 <div class="fin745-billing"><div><h3>2. Billing timing — ${esc(fin745MonthLabel(month))} work</h3><p>Expected billing: <b>${esc(fin745MonthLabel(bill.expectedMonth))} month-end</b>${billing ? '' : ' · normal expectation, not a confirmed invoice'}.</p><p>${bill.reason ? esc(bill.reason) : 'No billing deferral recorded.'}</p><small>Billing timing only. No pre-bill amount and no automatic journal or cost deferral.</small></div><div>${fin745Button('Update billing month', 'billing', month, ro)}${billing ? fin745Button('History', 'history-billing', month) : ''}</div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>3. Finance journal schedule</h3><p>Entries involving this work, posting or reversal month. Journals do not add to the labour totals above.</p></div>${fin745Button('Add journal proposal', 'journal', '', ro)}</div>
 <div class="fin745-table"><table><thead><tr><th>Proposal</th><th>Work → posting</th><th>Amount</th><th>State / evidence</th><th></th></tr></thead><tbody>${journals.length ? journals.map(e => { const p = e.payload, issues = fin745JournalIssues(e); return `<tr><td><b>${esc(FIN745_WORDS[p.type] || p.type)}</b><small>${esc(e.key)}</small><small>${esc(p.debit || 'Debit not set')} / ${esc(p.credit || 'Credit not set')}</small></td><td>${esc(p.workMonth)} → ${esc(p.postingMonth)}<small>${p.reversalMonth ? 'Reversal planned ' + esc(p.reversalMonth) : 'No reversal month recorded'}</small></td><td>${esc(fin745MoneyText(p.amount))}</td><td>${esc(FIN745_WORDS[p.status] || p.status)}<small>${esc(p.evidence)}</small>${p.externalRef ? `<small>External reference: ${esc(p.externalRef)}</small>` : ''}${issues.length ? `<small class="fin745-alert">${esc(issues.join(' · '))}</small>` : ''}</td><td>${fin745Button('Open proposal', 'journal', e.key, ro)}${fin745Button('History', 'history-journal', e.key)}</td></tr>`; }).join('') : '<tr><td colspan="5">No Finance journal proposals recorded for this month. Existing labour hire is not assumed to need another allocation.</td></tr>'}</tbody></table></div>
 <p class="fin745-basis">Allocation reclassifies a cost already incurred. Accrual records work received where the invoice/payroll is outstanding. WIP or cost deferral requires Finance’s decision. “Posted externally” means somebody recorded an external posting reference here—not that this page posted it.</p></div>
 ${fin745FormHtml()}
 <details class="fin745-history"><summary>Recorded review trail · ${Object.keys(S.finance745 || {}).length} revisions</summary><p>Each save keeps its previous revision. Source changes require review. Use Tools → Export or “Export review backup” for a complete client-side backup; the legacy service export does not include this new schedule.</p>${fin745HistoryHtml()}</details>
 <p class="fin745-author">Author: Andrew Fisher · Monthly financial control v7.45 · source record as currently received</p></section>`;
}
function fin745Field(key, label, type, value, options){
 const id = 'fin745_' + key, attrs = `id="${id}" data-finfield="${esc(key)}"`;
 let input;
 if (Array.isArray(options)) input = `<select ${attrs}>${options.map(([v, t]) => `<option value="${esc(v)}"${String(value) === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
 else if (type === 'textarea') input = `<textarea ${attrs} rows="3">${esc(Array.isArray(value) ? value.join('\n') : value == null ? '' : String(value))}</textarea>`;
 else if (type === 'checkbox') input = `<input ${attrs} type="checkbox"${value ? ' checked' : ''}>`;
 else input = `<input ${attrs} type="${type || 'text'}"${type === 'number' ? ' step="0.01" min="0"' : ''} value="${esc(value == null ? '' : String(value))}">`;
 return `<div class="fin745-field"><label for="${id}">${esc(label)}</label>${input}</div>`;
}
function fin745FormHtml(){
 const f = FIN745_UI.form; if (!f) return ''; const p = f.payload || {}, field = (key, label, type, opts) => fin745Field(key, label, type, p[key], opts);
 let body = '';
 if (f.kind === 'history') return `<div class="fin745-form" id="fin745Form" tabindex="-1"><h3>${esc(f.title)}</h3>${fin745History(f.targetKind, f.key).map(e => `<details open><summary>${esc(fmtStamp(e.at))} · ${esc(e.by)}</summary><pre>${esc(JSON.stringify(e.payload, null, 2))}</pre></details>`).join('')}${fin745Button('Close', 'cancel')}</div>`;
 if (f.kind === 'review') {
  const row = fin745Rows().find(r => r.id === f.key);
  body = `<p>${esc(row ? row.person + ' · ' + row.date + ' · ' + fin745Hours(row.worked) + ' worked' : 'Source no longer available')}.</p><p>Confirm against the timesheet. A calculated wage is not a verified payroll or supplier invoice amount.</p>` + field('confirmed', 'I have checked these recorded hours were worked', 'checkbox') + field('actualCost', 'Verified cost for this shift, AUD ex GST (optional)', 'number') + field('allocation', 'Has this cost already been allocated to Installation?', 'select', [['unverified', 'Not verified'], ['needed', 'Allocation required'], ['allocated', 'Already allocated — evidence required']]) + field('evidence', 'Timesheet / payroll / invoice / allocation evidence', 'textarea');
 } else if (f.kind === 'rate') body = `<p>Cost rate for ${esc(f.key)}, not the customer charge rate. Existing Salary/CNA/labour-hire pay rules still apply. A rate change flags affected confirmations for review.</p>` + field('rate', 'Cost per paid/allocation hour · AUD', 'number') + field('basis', 'Rate basis / source — state whether on-costs are included', 'textarea');
 else if (f.kind === 'billing') body = `<p>Work month stays ${esc(f.key)}. Expected invoicing is at the end of the selected month. This creates no invoice, journal or pre-bill amount.</p>` + field('expectedMonth', 'Expected billing month', 'month') + field('reason', 'Deferral reason / customer agreement', 'textarea');
 else if (f.kind === 'journal') body = `<p>Finance review schedule only. Enter Finance’s account codes and evidence; this does not post or transfer money.</p><div class="fin745-formgrid">` + field('type', 'Journal type', 'select', ['allocation', 'accrual', 'wip', 'reversal'].map(k => [k, FIN745_WORDS[k]])) + field('status', 'Recorded status', 'select', ['draft', 'review', 'approved', 'posted', 'void'].map(k => [k, FIN745_WORDS[k]])) + field('workMonth', 'Original work month', 'month') + field('postingMonth', 'Proposed / actual posting month', 'month') + field('reversalMonth', 'Planned reversal month (optional)', 'month') + field('amount', 'Journal amount · AUD ex GST', 'number') + field('debit', 'Debit account / cost centre', 'text') + field('credit', 'Credit account / cost centre', 'text') + field('approvedBy', 'Finance approver (required for approved / posted)', 'text') + field('externalRef', 'External posting reference (required for posted)', 'text') + field('linkedJournal', 'Original proposal ID (required for reversal)', 'text') + `</div>` + field('sourceIds', 'Source shift IDs (one per line; needed for a labour allocation)', 'textarea') + field('evidence', 'Source evidence / Finance approval reference', 'textarea') + field('note', 'Purpose, treatment and follow-up', 'textarea');
 return `<form class="fin745-form" id="fin745Form" tabindex="-1"><h3>${esc(f.title)}</h3>${body}${FIN745_UI.error ? `<p role="alert" class="fin745-alert">${esc(FIN745_UI.error)}</p>` : ''}<div class="fin745-formacts"><button type="submit" class="btn primary"${!canEdit() ? ' disabled' : ''}>Save ${f.kind === 'journal' ? 'proposal record' : 'review'}</button>${fin745Button('Cancel', 'cancel')}</div><p class="fin745-basis">Saved with the recorder’s name and time. Previous revisions remain in the review trail.</p></form>`;
}
function fin745HistoryHtml(){
 const events = Object.values(S.finance745 || {}).sort((a, b) => String(b.at).localeCompare(String(a.at)));
 return events.length ? `<ol>${events.map(e => `<li><b>${esc(e.kind)} · ${esc(e.key)}</b> — ${esc(e.by)} · ${esc(fmtStamp(e.at))}${fin745Button('Details', 'history-' + e.kind, e.key)}</li>`).join('')}</ol>` : '<p>No financial reviews have been saved. Source records and charges have not been changed by this release.</p>';
}
function fin745Open(kind, key, initial){
 const event = fin745Latest(kind, key);
 FIN745_UI.error = ''; FIN745_UI.message = '';
 FIN745_UI.form = {kind, key, prev: event ? event.id : null, title: ({review: 'Confirm hours and cost evidence', rate: 'Cost-rate assumption', billing: 'Expected billing month', journal: 'Finance journal proposal'})[kind], payload: Object.assign({}, initial, event ? event.payload : {})};
 if (kind === 'review') {
  const row = fin745Rows().find(r => r.id === key);
  if (row) {
   FIN745_UI.form.payload.fingerprint = row.fingerprint;
   if (row.status === 'changed') {
    Object.assign(FIN745_UI.form.payload, {confirmed: false, actualCost: null, allocation: 'unverified', evidence: ''});
    FIN745_UI.error = 'The source changed since the previous confirmation. Recheck the current hours and cost evidence. Earlier values remain in History; none are carried forward as verified.';
   }
  }
 }
 renderCosts(); const form = document.getElementById('fin745Form'); if (form) { form.scrollIntoView({block: 'center', behavior: 'auto'}); form.focus({preventScroll: true}); }
}
function fin745NewJournal(){ return {type: 'allocation', workMonth: fin745SelectedMonth(), postingMonth: fin745SelectedMonth(), reversalMonth: '', amount: '', sourceIds: [], evidence: '', debit: '', credit: '', status: 'draft', approvedBy: '', externalRef: '', linkedJournal: '', note: ''}; }
function fin745Download(name, content, type){ const url = URL.createObjectURL(new Blob([content], {type})), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function fin745CsvCell(v){ let t = v == null ? '' : String(v); if (/^[\s]*[=+\-@]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }
function fin745Csv(){
 const month = fin745SelectedMonth(), rows = [['Author: Andrew Fisher'], ['Monthly Finance review — proposals only, no ledger posting'], ['Work month', month], [], ['Shift ID', 'Person', 'Type', 'Work date', 'Review state', 'Worked hours', 'Paid / allocation hours', 'Calculated cost AUD', 'Verified cost AUD', 'Cost rate AUD/h', 'Rate basis', 'Allocation state', 'Evidence']];
 fin745Summary(month).rows.forEach(r => rows.push([r.id, r.person, FIN745_WORDS[r.type] || r.type, r.date, FIN745_WORDS[r.status] || r.status, r.worked, r.paid, r.calculatedCost, r.status === 'confirmed' ? r.actualCost : null, r.rate, r.rateBasis, FIN745_WORDS[r.allocation] || r.allocation, r.evidence]));
 const billing = fin745Latest('billing', month); rows.push([], ['Expected billing month', billing ? billing.payload.expectedMonth : month, billing ? billing.payload.reason : 'Normal month-end expectation; unconfirmed']);
 rows.push([], ['Proposal ID', 'Type', 'Work month', 'Posting month', 'Reversal month', 'Amount AUD', 'Status', 'Debit', 'Credit', 'Evidence', 'Finance approver', 'External reference', 'Linked journal', 'Source shifts', 'Review issues']);
 fin745List('journal').filter(e => [e.payload.workMonth, e.payload.postingMonth, e.payload.reversalMonth].includes(month)).forEach(e => { const p = e.payload; rows.push([e.key, FIN745_WORDS[p.type], p.workMonth, p.postingMonth, p.reversalMonth, p.amount, FIN745_WORDS[p.status], p.debit, p.credit, p.evidence, p.approvedBy, p.externalRef, p.linkedJournal, p.sourceIds.join('; '), fin745JournalIssues(e).join('; ')]); });
 return rows.map(r => r.map(fin745CsvCell).join(',')).join('\r\n');
}
function fin745Bind(){
 const root = document.getElementById('finance745'); if (!root) return;
 const month = root.querySelector('#fin745Month'); month.onchange = () => { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month.value)) return; FIN745_UI.month = month.value; FIN745_UI.person = ''; FIN745_UI.form = null; FIN745_UI.error = ''; renderCosts(); };
 root.querySelectorAll('[data-f745]').forEach(b => b.onclick = () => {
  const action = b.dataset.f745, key = b.dataset.key;
  if (b.disabled) return;
  if (action === 'csv') return fin745Download('GC500_Finance_' + fin745SelectedMonth() + '.csv', '\uFEFF' + fin745Csv(), 'text/csv;charset=utf-8');
  if (action === 'backup') return fin745Download('GC500_Finance_review_backup_' + todayIso() + '.json', JSON.stringify({author: 'Andrew Fisher', exported_at: new Date().toISOString(), records: {finance745: S.finance745 || {}, stamps: Object.fromEntries(Object.entries(S.stamps || {}).filter(([k]) => k.startsWith('finance745/'))), by: Object.fromEntries(Object.entries(S.by || {}).filter(([k]) => k.startsWith('finance745/')))}}, null, 2), 'application/json');
  if (action === 'runsheet') return go('runsheet');
  if (action === 'person') { FIN745_UI.person = FIN745_UI.person === key ? '' : key; renderCosts(); return; }
  if (action === 'cancel') { FIN745_UI.form = null; FIN745_UI.error = ''; renderCosts(); return; }
  if (action.startsWith('history-')) { FIN745_UI.form = {kind: 'history', targetKind: action.slice(8), key, title: 'Review history · ' + key}; renderCosts(); document.getElementById('fin745Form').scrollIntoView({block: 'center'}); return; }
  if (!mayWrite('a financial review')) return;
  if (action === 'review') { const r = fin745Rows().find(x => x.id === key); if (!r) return; return fin745Open('review', key, {confirmed: false, fingerprint: r.fingerprint, actualCost: null, allocation: 'unverified', evidence: ''}); }
  if (action === 'rate') { const r = fin745Rows().find(x => x.person === key); return fin745Open('rate', key, {rate: r ? r.rate : null, basis: ''}); }
  if (action === 'billing') return fin745Open('billing', key, {expectedMonth: key, reason: ''});
  if (action === 'journal') return fin745Open('journal', key || 'J-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), fin745NewJournal());
  if (action === 'allocate') { const rows = fin745Summary(fin745SelectedMonth()).rows.filter(r => r.person === key && r.status === 'confirmed' && r.allocation !== 'allocated'), p = fin745NewJournal(); p.sourceIds = rows.map(r => r.id); p.amount = rows.every(r => r.actualCost != null || r.calculatedCost != null) ? Math.round(rows.reduce((n, r) => n + (r.actualCost == null ? r.calculatedCost : r.actualCost), 0) * 100) / 100 : ''; p.note = 'Allocation to Installation for ' + key + '. Calculated costs need Finance verification; this is not additional job spend.'; return fin745Open('journal', 'J-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), p); }
 });
 const form = root.querySelector('form#fin745Form'); if (!form) return;
 const capture = input => { const f = FIN745_UI.form; if (!f || !f.payload) return; const key = input.dataset.finfield; f.payload[key] = input.type === 'checkbox' ? input.checked : key === 'sourceIds' ? input.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : ['actualCost', 'rate', 'amount'].includes(key) ? input.value.trim() === '' ? null : Number(input.value) : input.value; };
 form.querySelectorAll('[data-finfield]').forEach(i => { i.oninput = () => capture(i); i.onchange = () => capture(i); });
 form.onsubmit = e => { e.preventDefault(); form.querySelectorAll('[data-finfield]').forEach(capture); const f = FIN745_UI.form; const result = fin745Save(f.kind, f.key, f.payload, f.prev); if (!result.ok) { FIN745_UI.error = result.error; renderCosts(); const next = document.getElementById('fin745Form'); if (next) next.scrollIntoView({block: 'center'}); return; } FIN745_UI.form = null; FIN745_UI.error = ''; FIN745_UI.message = 'Review recorded. Check the shared-record footer for sync status. No accounting journal was posted.'; renderCosts(); };
}
