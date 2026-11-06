/* Author: Andrew Fisher
 * Monthly Financial Control. A review schedule, not a ledger or an automatic cost transfer.
 * One append-only map is synced document by document; source costs and rates are never changed here.
 */
function fin745ModelMarker() { return 'monthly-financial-control-v7.45'; }
function fin745Plain(v) { return !!v && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null); }
function fin745Text(v, max) { return typeof v === 'string' && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v); }
function fin745Month(v) { return typeof v === 'string' && /^(20\d{2})-(0[1-9]|1[0-2])$/.test(v); }
function fin745Date(v) { return typeof v === 'string' && /^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v; }
function fin745Money(v) { return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000000000 && Math.abs(v * 100 - Math.round(v * 100)) < 0.0001; }
function fin745Round(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
function fin745SnapshotValid(v) {
 const keys = ['id', 'person', 'type', 'date', 'worked', 'paid', 'rate', 'rateBasis', 'calculatedCost', 'fingerprint', 'reviewId', 'actualCost', 'allocation', 'reviewEvidence'];
 return fin745Plain(v) && Object.keys(v).every(k => keys.includes(k)) && fin745Text(v.id, 240) && !!v.id.trim() && fin745Text(v.person, 240) && !!v.person.trim()
  && ['', 'salary', 'cna', 'hire'].includes(v.type) && fin745Date(v.date) && ['worked', 'paid'].every(k => v[k] === null || typeof v[k] === 'number' && Number.isFinite(v[k]) && v[k] >= 0 && v[k] <= 24)
  && ['rate', 'calculatedCost'].every(k => v[k] === null || fin745Money(v[k])) && fin745Text(v.rateBasis, 1000) && fin745Text(v.fingerprint, 100) && !!v.fingerprint.trim()
  && (v.reviewId === undefined || v.reviewId === null || fin745Text(v.reviewId, 180)) && (v.actualCost === undefined || v.actualCost === null || fin745Money(v.actualCost))
  && (v.allocation === undefined || ['unverified', 'needed', 'allocated'].includes(v.allocation)) && (v.reviewEvidence === undefined || fin745Text(v.reviewEvidence, 2000));
}
function fin745Clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
function fin745Stable(v) { return v === undefined ? 'null' : v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(fin745Stable).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + fin745Stable(v[k])).join(',') + '}'; }
function fin745Fingerprint(v) {
 const s = fin745Stable(v); let h = 2166136261;
 for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
 return 'f745-' + (h >>> 0).toString(16).padStart(8, '0') + '-' + s.length;
}
function fin745Events() { return Object.values(S.finance745 || {}).filter(e => fin745Plain(e) && ['review', 'rate', 'billing', 'journal'].includes(e.kind)); }
function fin745History(kind, key) { return fin745Events().filter(e => e.kind === kind && e.key === key).sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(b.id).localeCompare(String(a.id))); }
function fin745Leaves(kind, key) {
 const h = fin745History(kind, key), parents = new Set(h.map(e => e.prev).filter(Boolean));
 return h.filter(e => !parents.has(e.id));
}
function fin745Latest(kind, key) { return fin745Leaves(kind, key)[0] || fin745History(kind, key)[0] || null; }
function fin745List(kind) { return [...new Set(fin745Events().filter(e => e.kind === kind).map(e => e.key))].map(k => fin745Latest(kind, k)).filter(Boolean).sort((a, b) => String(a.key).localeCompare(String(b.key))); }
function fin745Conflicts(kind, key) {
 const h = fin745History(kind, key), leaves = fin745Leaves(kind, key), ids = new Set(h.map(e => e.id));
 const out = [];
 if (leaves.length > 1) out.push('Concurrent revisions need Finance review; neither revision has been discarded.');
 if (h.some(e => e.prev && !ids.has(e.prev))) out.push('A previous revision is not available yet.');
 if (h.length && !leaves.length) out.push('Revision history contains a cycle.');
 return out;
}
function fin745Rows(asOf) {
 const td = asOf || todayIso(), list = ourCosts(), people = new Map(list.filter(c => c.kind === 'person' && c.usable).map(c => [c.person, c]));
 return list.filter(c => c.kind === 'labour' && c.usable && c.id && c.person && fin745Date(c.date)).map(c => {
  const person = people.get(c.person) || {}, type = runType(person.type || c.type), worked = runWorked(c), paid = runHours(c);
  const override = fin745Latest('rate', c.person), overrideOK = override && !fin745Conflicts('rate', c.person).length && !fin745ValidateRecordEvent(override).length;
  const rate = overrideOK ? override.payload.rate : override ? null : runRateOf(person);
  const rateBasis = overrideOK ? override.payload.basis : override ? 'Conflicting or invalid Finance rate — review required' : rate == null ? '' : 'Running sheet hourly pay rate';
  const split = paid != null && Number.isFinite(paid) && paid >= 0 && type ? splitHoursFor(paid, c.date, type) : null;
  const calculatedCost = split && rate != null ? runPay(split, rate) : null;
  const source = {id: String(c.id), person: c.person, type, date: c.date, start: c.start || null, finish: c.finish || null, break_min: c.break_min == null ? null : c.break_min, hours: c.hours == null ? null : c.hours, worked, paid, split, rate, rateBasis, payRules: S.runRules || {}};
  const fingerprint = fin745Fingerprint(source), review = fin745Latest('review', String(c.id));
  const validReview = review && !fin745ValidateRecordEvent(review).length && !fin745Conflicts('review', String(c.id)).length;
  const confirmed = !!(validReview && review.payload.confirmed && review.payload.fingerprint === fingerprint && c.date <= td);
  const status = c.date > td ? 'forecast' : review && review.payload.confirmed && (!validReview || review.payload.fingerprint !== fingerprint) ? 'changed' : confirmed ? 'confirmed' : 'unconfirmed';
  return {id: String(c.id), person: c.person, type, date: c.date, month: c.date.slice(0, 7), worked, paid, rate, rateBasis, calculatedCost, fingerprint, review, status,
   actualCost: confirmed && review.payload.actualCost != null ? review.payload.actualCost : null,
   allocation: confirmed ? review.payload.allocation : 'unverified', evidence: review && review.payload.evidence || '', source};
 }).sort((a, b) => a.date.localeCompare(b.date) || a.person.localeCompare(b.person) || a.id.localeCompare(b.id));
}
function fin745Orphans() {
 const ids = new Set(fin745Rows().map(r => r.id));
 return fin745List('review').filter(e => e.payload && e.payload.confirmed && !ids.has(e.key)).map(e => ({id: e.key, event: e, review: e, snapshot: e.payload.snapshot || null, issue: 'Confirmed source is removed or no longer usable; its review remains in history.'}));
}
function fin745Summary(month, asOf) {
 const rows = fin745Rows(asOf).filter(r => !month || r.month === month);
 const orphanCount = fin745Orphans().filter(o => !month || o.snapshot && o.snapshot.date.slice(0, 7) === month).length;
 const out = {rows, confirmedHours: 0, pendingHours: 0, forecastHours: 0, confirmedPaidHours: 0, pendingPaidHours: 0, forecastPaidHours: 0, actualCost: 0, actualCostCount: 0, calculatedConfirmedCost: 0, forecastCost: 0, pendingCost: 0, expectedCost: 0, unpricedHours: 0, unpricedCount: 0, orphanCount, complete: orphanCount === 0};
 rows.forEach(r => {
  const hours = Number.isFinite(r.worked) ? r.worked : 0, paid = Number.isFinite(r.paid) ? r.paid : 0, cost = r.actualCost != null ? r.actualCost : r.calculatedCost;
  if (r.status === 'confirmed') { out.confirmedHours += hours; out.confirmedPaidHours += paid; if (r.actualCost != null) { out.actualCost += r.actualCost; out.actualCostCount++; } if (r.calculatedCost != null) out.calculatedConfirmedCost += r.calculatedCost; }
  else if (r.status === 'forecast') { out.forecastHours += hours; out.forecastPaidHours += paid; if (cost != null) out.forecastCost += cost; }
  else { out.pendingHours += hours; out.pendingPaidHours += paid; if (cost != null) out.pendingCost += cost; }
  if (cost == null) { out.unpricedHours += paid; out.unpricedCount++; out.complete = false; } else out.expectedCost += cost;
 });
 Object.keys(out).forEach(k => { if (typeof out[k] === 'number') out[k] = fin745Round(out[k]); });
 return out;
}
/* Structural checks are deliberately independent of current shifts: later edits must never erase history. */
function fin745ValidateRecordEvent(e) {
 const errors = [], fail = s => errors.push(s), hasText = (v, max) => fin745Text(v, max) && v.trim().length > 0;
 if (!fin745Plain(e)) return ['Finance event must be an object.'];
 if (Object.keys(e).some(k => !['id', 'kind', 'key', 'prev', 'at', 'by', 'payload'].includes(k))) fail('Unknown Finance event field.');
 if (!hasText(e.id, 180) || /[/.]/.test(e.id) || ['__proto__', 'constructor', 'prototype'].includes(e.id)) fail('Invalid Finance event ID.');
 if (!['review', 'rate', 'billing', 'journal'].includes(e.kind)) fail('Unknown Finance event kind.');
 if (!hasText(e.key, 240) || ['__proto__', 'constructor', 'prototype'].includes(e.key)) fail('Invalid Finance record key.');
 if (e.prev !== null && (!hasText(e.prev, 180) || e.prev === e.id)) fail('Invalid previous revision.');
 if (!hasText(e.at, 40) || !/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.at) || Number.isNaN(Date.parse(e.at)) || new Date(e.at).toISOString() !== e.at) fail('Invalid Finance event time.');
 if (!hasText(e.by, 160)) fail('Finance event needs the recorder name.');
 if (!fin745Plain(e.payload)) return errors.concat('Finance payload must be an object.');
 const p = e.payload;
 const allowed = {rate: ['rate', 'basis'], billing: ['expectedMonth', 'reason'], review: ['confirmed', 'fingerprint', 'actualCost', 'allocation', 'evidence', 'snapshot'], journal: ['type', 'workMonth', 'postingMonth', 'reversalMonth', 'amount', 'sourceIds', 'evidence', 'debit', 'credit', 'status', 'approvedBy', 'externalRef', 'linkedJournal', 'note', 'sourceSnapshots']}[e.kind];
 if (allowed && Object.keys(p).some(k => !allowed.includes(k))) fail('Unknown Finance payload field.');
 let bytes; try { bytes = JSON.stringify(e).length; } catch (_) { return errors.concat('Finance event is not serialisable.'); }
 if (bytes > 200000) fail('Finance event is too large.');
 if (e.kind === 'rate') {
  if (!fin745Money(p.rate)) fail('Hourly rate must be a non-negative amount with at most two decimal places.');
  if (!hasText(p.basis, 1000)) fail('Give the source and basis of this hourly cost rate.');
 }
 if (e.kind === 'billing') {
  if (!fin745Month(e.key) || !fin745Month(p.expectedMonth) || p.expectedMonth < e.key) fail('Billing month must be the work month or later.');
  if (!fin745Text(p.reason, 2000) || p.expectedMonth > e.key && !p.reason.trim()) fail('Give the reason for later billing.');
 }
 if (e.kind === 'review') {
  if (typeof p.confirmed !== 'boolean') fail('Confirmation must be yes or no.');
  if (!hasText(p.fingerprint, 100)) fail('Shift fingerprint is required.');
  if (p.actualCost !== null && !fin745Money(p.actualCost)) fail('Actual cost must be blank or a non-negative amount with at most two decimal places.');
  if (!['unverified', 'needed', 'allocated'].includes(p.allocation)) fail('Choose the allocation status.');
  if (!fin745Text(p.evidence, 2000)) fail('Evidence must be readable text, at most 2,000 characters.');
  if (p.confirmed && (p.actualCost !== null || p.allocation === 'allocated') && !String(p.evidence || '').trim()) fail('Evidence is required for an actual cost or completed allocation.');
  if (!p.confirmed && (p.actualCost !== null || p.allocation !== 'unverified')) fail('Confirm the source before recording actual costs or allocations.');
  if (p.snapshot !== undefined && (!fin745SnapshotValid(p.snapshot) || p.snapshot.id !== e.key || p.snapshot.fingerprint !== p.fingerprint)) fail('Invalid original source snapshot.');
  if (p.confirmed && !p.snapshot) fail('Confirmed review needs its original source snapshot.');
  const recordedDay = Number.isFinite(Date.parse(e.at)) ? new Date(Date.parse(e.at) + 10 * 60 * 60 * 1000).toISOString().slice(0, 10) : '';
  if (p.confirmed && p.snapshot && recordedDay && p.snapshot.date > recordedDay) fail('A review cannot confirm a source before its work date (AEST).');
 }
 if (e.kind === 'journal') {
  if (!['allocation', 'accrual', 'wip', 'reversal'].includes(p.type)) fail('Choose a journal type.');
  if (!fin745Month(p.workMonth) || !fin745Month(p.postingMonth)) fail('Choose valid work and posting months.');
  if (p.reversalMonth !== '' && (!fin745Month(p.reversalMonth) || p.reversalMonth < p.postingMonth)) fail('Reversal month cannot precede the posting month.');
  if (!fin745Money(p.amount) || p.amount <= 0) fail('Journal amount must be positive, with at most two decimal places.');
  if (!Array.isArray(p.sourceIds) || p.sourceIds.length > 500 || p.sourceIds.some(id => !hasText(id, 240)) || new Set(p.sourceIds).size !== p.sourceIds.length) fail('Journal source IDs must be a unique list of at most 500 shifts.');
  if (p.sourceSnapshots !== undefined && (!Array.isArray(p.sourceSnapshots) || p.sourceSnapshots.length > 500 || p.sourceSnapshots.some(s => !fin745SnapshotValid(s) || !Array.isArray(p.sourceIds) || !p.sourceIds.includes(s.id)))) fail('Invalid journal source snapshots.');
  if (!hasText(p.evidence, 2000)) fail('Journal evidence is required.');
  ['debit', 'credit', 'approvedBy', 'externalRef', 'linkedJournal'].forEach(k => { if (!fin745Text(p[k], 240)) fail('Invalid ' + k + '.'); });
  if (!fin745Text(p.note, 4000)) fail('Journal note must be at most 4,000 characters.');
  if (!['draft', 'review', 'approved', 'posted', 'void'].includes(p.status)) fail('Choose a journal status.');
  if (['approved', 'posted'].includes(p.status) && (!hasText(p.approvedBy, 240) || !hasText(p.debit, 240) || !hasText(p.credit, 240) || p.debit.trim() === p.credit.trim())) fail('Approval needs the actual reviewer and separate debit/credit accounts.');
  if (p.status === 'posted' && !hasText(p.externalRef, 240)) fail('Posted journals need the external ledger reference.');
  if (p.type === 'allocation' && Array.isArray(p.sourceIds) && !p.sourceIds.length) fail('An allocation must name the source shifts.');
  if (p.type === 'reversal' && !hasText(p.linkedJournal, 240)) fail('A reversal must identify the original journal.');
 }
 return errors;
}
function fin745Snapshot(r) {
 return {id: r.id, person: r.person, type: r.type, date: r.date, worked: r.worked, paid: r.paid, rate: r.rate, rateBasis: r.rateBasis, calculatedCost: r.calculatedCost, fingerprint: r.fingerprint};
}
/* A proposal/approval is not a reversal in the ledger. Only an evidenced posted reversal releases its reservation. */
function fin745JournalReversed(event) {
 if (!event || event.kind !== 'journal' || !event.payload || event.payload.status !== 'posted' || event.payload.type === 'reversal' || fin745Conflicts('journal', event.key).length) return false;
 const p = event.payload;
 return fin745List('journal').some(e => {
  const r = e.payload;
  return r && r.type === 'reversal' && r.status === 'posted' && r.linkedJournal === event.key && r.amount === p.amount && r.debit === p.credit && r.credit === p.debit
   && r.postingMonth >= p.postingMonth && !fin745Conflicts('journal', e.key).length && !fin745ValidateRecordEvent(e).length;
 });
}
function fin745JournalIssues(event) {
 if (!event || event.kind !== 'journal') return ['Journal not found.'];
 const issues = fin745ValidateRecordEvent(event).concat(fin745Conflicts('journal', event.key)), p = event.payload || {}, rows = new Map(fin745Rows().map(r => [r.id, r]));
 if (!Array.isArray(p.sourceIds)) return issues;
 p.sourceIds.forEach(id => {
  const r = rows.get(id), old = (p.sourceSnapshots || []).find(x => x.id === id);
  if (!r) issues.push(id + ': source has been removed or is not usable.');
  else { if (r.month !== p.workMonth) issues.push(id + ': source is outside the work month.');
   if (old && old.fingerprint !== r.fingerprint) issues.push(id + ': source changed after this journal revision.');
   if (old && old.reviewId !== undefined && (old.reviewId !== (r.review ? r.review.id : null) || old.actualCost !== r.actualCost || old.allocation !== r.allocation || old.reviewEvidence !== undefined && old.reviewEvidence !== r.evidence)) issues.push(id + ': actual-cost or allocation review changed after this journal revision.');
   if (p.type === 'allocation' && r.status !== 'confirmed') issues.push(id + ': source hours are not currently confirmed.');
   if (p.type === 'allocation' && r.allocation === 'allocated') issues.push(id + ': source is already marked allocated; check for double counting.');
  }
 });
 if (p.type === 'allocation' && p.status !== 'void' && !fin745JournalReversed(event)) fin745List('journal').filter(e => e.key !== event.key && e.payload.type === 'allocation' && e.payload.status !== 'void' && !fin745JournalReversed(e)).forEach(e => {
  if ((e.payload.sourceIds || []).some(id => p.sourceIds.includes(id))) issues.push('Source shifts overlap allocation journal ' + e.key + '.');
 });
 if (p.type === 'reversal') {
  const linked = fin745Latest('journal', p.linkedJournal), original = linked && linked.payload;
  if (!original || !['approved', 'posted'].includes(original.status) || original.type === 'reversal' || p.linkedJournal === event.key) issues.push('Reversal must link an approved or posted original journal.');
  else {
   if (p.status === 'posted' && original.status !== 'posted') issues.push('Post the original journal in the ledger before marking its reversal posted.');
   if (p.amount !== original.amount || p.debit !== original.credit || p.credit !== original.debit) issues.push('Reversal amount and reversed accounts must match the original journal.');
   if (p.postingMonth < original.postingMonth) issues.push('Reversal cannot precede the original posting month.');
   if (fin745Conflicts('journal', p.linkedJournal).length) issues.push('Original journal has conflicting revisions.');
  }
  if (p.status !== 'void' && fin745List('journal').some(e => e.key !== event.key && e.payload.type === 'reversal' && e.payload.status !== 'void' && e.payload.linkedJournal === p.linkedJournal)) issues.push('An active reversal already exists for this journal.');
 }
 return [...new Set(issues)];
}
function fin745Save(kind, key, payload, expectedPrev) {
 if (!mayWrite('monthly financial control')) return {ok: false, error: 'View only — open your usual edit link to save.'};
 const who = whoAmI(); if (!who) return {ok: false, error: 'Enter your name before saving.'};
 if (arguments.length < 4) return {ok: false, error: 'Reload this item before saving; its previous revision was not supplied.'};
 const previous = fin745Latest(kind, key), prevId = previous ? previous.id : null;
 if (expectedPrev !== prevId || fin745Conflicts(kind, key).length) return {ok: false, error: 'This item changed on another screen or has conflicting revisions. Reload and review it before saving.'};
 let p; try { p = fin745Clone(payload); } catch (_) { return {ok: false, error: 'Finance entry could not be read.'}; }
 if (!fin745Plain(p)) return {ok: false, error: 'Finance entry must be an object.'};
 const at = new Date().toISOString(), id = 'F745-' + Date.now().toString(36) + '-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
 const event = {id, kind, key, prev: prevId, at, by: String(who).trim(), payload: p}, rows = fin745Rows(), row = rows.find(r => r.id === key);
 if (kind === 'review') {
  if (!row) return {ok: false, error: 'This source shift is missing or is no longer usable.'};
  if (p.fingerprint !== row.fingerprint) return {ok: false, error: 'The source hours or rate changed. Reload and review the current shift.'};
  if (p.confirmed && row.date > todayIso()) return {ok: false, error: 'Future hours are forecast; they cannot be confirmed as actuals.'};
  p.snapshot = fin745Snapshot(row);
 }
 if (kind === 'rate' && !ourCosts().some(c => c.person === key && c.usable)) return {ok: false, error: 'Choose a person present in the running sheet.'};
 if (kind === 'journal') p.sourceSnapshots = Array.isArray(p.sourceIds) ? p.sourceIds.map(id => rows.find(r => r.id === id)).filter(Boolean).map(r => Object.assign(fin745Snapshot(r), {reviewId: r.review ? r.review.id : null, actualCost: r.actualCost, allocation: r.allocation, reviewEvidence: r.evidence})) : [];
 const errors = fin745ValidateRecordEvent(event);
 if (kind === 'journal' && !errors.length) {
  if (previous && ['review', 'approved', 'posted'].includes(p.status) && fin745JournalIssues(previous).some(s => s.includes('changed after this journal revision'))) errors.push('The source evidence changed after the previous journal revision. Review the amount and save a fresh draft before review, approval or posting.');
  const hasPostedReversal = previous && fin745List('journal').some(e => e.payload.type === 'reversal' && e.payload.status === 'posted' && e.payload.linkedJournal === key);
  if (previous && (previous.payload.status === 'posted' || hasPostedReversal)) {
   const locked = ['type', 'workMonth', 'postingMonth', 'reversalMonth', 'amount', 'sourceIds', 'debit', 'credit', 'approvedBy', 'externalRef', 'linkedJournal'];
   if (p.status !== previous.payload.status || locked.some(k => fin745Stable(p[k]) !== fin745Stable(previous.payload[k]))) errors.push('A posted journal, or an original with a posted reversal, cannot be changed or voided. Keep its history and record the correction separately.');
   p.sourceSnapshots = fin745Clone(previous.payload.sourceSnapshots || []);
  }
  if (p.status !== 'void') errors.push(...fin745JournalIssues(event));
 }
 if (errors.length) return {ok: false, error: [...new Set(errors)].join(' ')};
 if (Object.prototype.hasOwnProperty.call(S.finance745 || {}, id)) return {ok: false, error: 'New revision ID collision. Please try again.'};
 const fields = ['finance745', 'stamps', 'by', 'saved', 'changes'], had = {}, before = {};
 fields.forEach(k => { had[k] = Object.prototype.hasOwnProperty.call(S, k); before[k] = fin745Clone(S[k]); });
 try {
  S.finance745 = S.finance745 || {}; S.finance745[id] = event; stampIt('finance745', id, who);
  if (!save()) throw new Error('This browser could not save the Finance entry. Nothing was queued by this entry.');
  return {ok: true, event};
 } catch (err) {
  fields.forEach(k => { if (had[k]) S[k] = before[k]; else delete S[k]; });
  return {ok: false, error: String(err && err.message || 'Finance entry could not be saved.')};
 }
}
