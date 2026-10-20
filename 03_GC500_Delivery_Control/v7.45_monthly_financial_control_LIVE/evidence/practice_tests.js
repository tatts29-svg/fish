// Author: Andrew Fisher.
// Browser practice only: public view URL, GET-only harness, every sync write captured locally.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {open} = require('../../toolchain/harness/open_page');
const pageFile = process.env.PAGE || path.resolve(__dirname, '../../build/GC500_v7.45/GC500_Delivery_Control_hosted.html');
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');

async function run(mobile) {
 const name = mobile ? 'phone' : 'desktop', checks = [], result = {author: 'Andrew Fisher', mobile, sha256, checks};
 let s;
 const check = (name, pass, detail) => { checks.push({name, pass: !!pass, ...(detail === undefined ? {} : {detail})}); console.log((pass ? 'PASS ' : 'FAIL ') + (mobile ? 'phone ' : 'desktop ') + name); };
 try {
  s = await open({pageFile, hash: '#costs', mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: 1});
  const p = s.page, consoleErrors = [];
  // The app scrolls inside <main>, not the document. Capture the real viewport,
  // never a tall element screenshot extending through a clipped scroll container.
  const screenshot = async (selector, filename) => {
   await p.evaluate(selector => { const element = document.querySelector(selector), main = document.querySelector('main'); main.scrollTop += element.getBoundingClientRect().top - main.getBoundingClientRect().top - 12; const flash = document.querySelector('#flash'); if (flash) { window.__flashVisibility = flash.style.visibility; flash.style.visibility = 'hidden'; } }, selector);
   await p.screenshot({path: path.join(__dirname, filename + '_' + name + '.png'), animations: 'disabled'});
   await p.evaluate(() => { const flash = document.querySelector('#flash'); if (flash) flash.style.visibility = window.__flashVisibility || ''; });
  };
  p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  await p.waitForFunction(() => typeof fin745ModelMarker === 'function' && SYNC.status === 'live', null, {timeout: 240000});
  await p.evaluate(() => { go('costs'); FIN745_UI.month = '2026-09'; renderCosts(); });
  const section = p.locator('#finance745');
  await section.waitFor({state: 'visible'});
  const initial = await p.evaluate(() => {
   const state = JSON.stringify(S), answer = fin745Save('billing', '2026-09', {expectedMonth: '2026-10', reason: 'Practice only'}, null);
   const rows = fin745Rows(), summary = fin745Summary();
   return {readonly: !canEdit(), disabled: [...document.querySelectorAll('#finance745 [data-f745="billing"], #finance745 [data-f745="rate"], #finance745 [data-f745="journal"]')].every(b => b.disabled), refused: !answer.ok, unchanged: JSON.stringify(S) === state, unpriced: summary.unpricedCount, incomplete: !summary.complete, count: rows.length, reviews: Object.keys(S.finance745 || {}).length, refs: allAssets().length, hasMoneyValidator: fin745Money(15.25) === true && fin745Money('15.25') === false && fin745Money(15.251) === false && fin745Money(-1) === false && typeof fin745MoneyText(15.25) === 'string'};
  });
  check('public view displays controls but cannot save or change a record', initial.readonly && initial.disabled && initial.refused && initial.unchanged);
  check('unknown labour rates remain unpriced and whole-job estimate is labelled partial', initial.unpriced > 0 && initial.incomplete && /PARTIAL/.test(await section.innerText()) && /Not priced/.test(await section.innerText()), {unpricedShifts: initial.unpriced});
  check('model money validator and display formatter remain separate global helpers', initial.hasMoneyValidator);
  check('release starts with no invented confirmations or journals', initial.reviews === 0, {reviewEvents: initial.reviews, sourceShifts: initial.count});
  await p.evaluate(() => applyCapability());
  const monthEnabled = await p.locator('#fin745Month').isEnabled();
  if (monthEnabled) {
   await p.locator('#fin745Month').fill('2026-10'); await p.locator('#fin745Month').dispatchEvent('change');
   check('view-only month selector can review October without edit access or record changes', /Labour — October 2026/.test(await section.innerText()) && await p.evaluate(() => Object.keys(S.finance745 || {}).length) === 0);
   await p.locator('#fin745Month').fill('2026-09'); await p.locator('#fin745Month').dispatchEvent('change');
  } else check('view-only month selector can review October without edit access or record changes', false, 'Month navigation is disabled by capability locking.');
  await screenshot('.fin745-metrics', 'finance_initial');
  await p.evaluate(() => {
   window.__practiceCap = 'edit'; window.capability = () => window.__practiceCap;
   SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher via Codex';
   window.__writes = []; window.__downloads = [];
   SYNC.db.doc = name => ({id: name.split('/')[1], path: name, set: async body => { window.__writes.push({path: name, body: fin745Clone(body)}); }, delete: async () => { window.__writes.push({path: name, body: null}); }});
   const originalFetch = window.fetch;
   window.fetch = async (u, o) => { const response = await originalFetch(u, o); if (/\/api\/(version|state)(\?|$)/.test(String(u)) && response.ok) { const j = await response.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return response; };
   window.__recordComparable = () => { const out = fin745Clone(S); ['finance745', 'saved', 'changes'].forEach(k => delete out[k]); ['stamps', 'by'].forEach(k => { if (out[k]) out[k] = Object.fromEntries(Object.entries(out[k]).filter(([key]) => !key.startsWith('finance745/'))); }); return fin745Stable(out); };
   window.__financeFigures = () => ({references: Object.fromEntries(allAssets().slice().sort((a, b) => a.key.localeCompare(b.key)).map(a => { const t = assetTotal(a); return [a.key, {base: t.base, accessories: t.accessories, labour: t.labour, known: t.known, transport: t.transport, total: t.total, lines: chargeLines(a).map(l => ({item: l.item, labour: labourMoney(a.key, l, a.key, a).total, units: labourUnits(a, l.item)}))}]; })), labourPlan: labourPlan().all});
   window.__beforeRecord = window.__recordComparable(); window.__beforeFigures = fin745Stable(window.__financeFigures());
   const rows = fin745Rows(); window.__practiceRow = rows.find(r => r.month === '2026-09' && r.status === 'unconfirmed' && r.rate == null) || rows.find(r => r.month === '2026-09' && r.status === 'unconfirmed');
   if (!window.__practiceRow) throw new Error('No eligible September shift in the source record');
   renderCosts();
  });
  const row = await p.evaluate(() => ({id: window.__practiceRow.id, person: window.__practiceRow.person, worked: window.__practiceRow.worked, paid: window.__practiceRow.paid}));
  const action = (a, key) => section.locator('[data-f745="' + a + '"]' + (key === undefined ? '' : '[data-key=' + JSON.stringify(key) + ']')).first();
  const field = key => p.locator('#fin745_' + key);
  const save = () => p.locator('#fin745Form button[type="submit"]').click();
  const eventCount = () => p.evaluate(() => Object.keys(S.finance745 || {}).length);
  await action('person', row.person).click();
  check('Review shifts expands the selected person’s current source shifts', await section.locator('.fin745-shifts').isVisible() && await action('review', row.id).isEnabled());
  await action('review', row.id).click();
  check('Review / confirm opens explicit worked-hours and optional verified-cost evidence form', await field('confirmed').isVisible() && await field('actualCost').isVisible() && await field('evidence').isVisible());
  await field('confirmed').check(); await field('actualCost').fill('660'); await field('allocation').selectOption('needed');
  await save();
  check('verified cost without supporting evidence is refused', /Evidence is required/.test(await p.locator('#fin745Form').innerText()) && await eventCount() === 0);
  await field('evidence').fill('PRACTICE ONLY — checked timesheet and payroll evidence, not a live payroll entry.');
  await save();
  let reviewed = await p.evaluate(id => fin745Rows().find(r => r.id === id), row.id);
  check('confirmed actual hours, actual cost and allocation requirement are recorded separately', reviewed.status === 'confirmed' && reviewed.actualCost === 660 && reviewed.allocation === 'needed' && reviewed.worked === row.worked && reviewed.paid === row.paid);
  check('confirmation retains original source snapshot and named evidence', reviewed.review.payload.snapshot.fingerprint === reviewed.fingerprint && reviewed.review.by === 'Andrew Fisher via Codex' && reviewed.review.payload.evidence.includes('PRACTICE ONLY'));

  await action('rate', row.person).click(); await field('rate').fill('45.50'); await field('basis').fill('PRACTICE ONLY — Finance cost-rate assumption; on-costs excluded.'); await save();
  reviewed = await p.evaluate(id => fin745Rows().find(r => r.id === id), row.id);
  check('rate assumption is saved with basis and flags earlier actual confirmation for review', reviewed.rate === 45.5 && reviewed.status === 'changed' && reviewed.actualCost === null && reviewed.rateBasis.includes('on-costs excluded'));
  check('changed source is visibly labelled instead of silently counting stale actuals', /Changed — review required/.test(await section.innerText()));
  const stale = await p.evaluate(id => { const r = fin745Rows().find(x => x.id === id), before = JSON.stringify(S.finance745); const result = fin745Save('review', id, {...r.review.payload, fingerprint: 'stale-source'}, r.review.id); return {rejected: !result.ok && /source hours or rate changed/i.test(result.error), unchanged: before === JSON.stringify(S.finance745)}; }, row.id);
  check('stale source fingerprint cannot be confirmed', stale.rejected && stale.unchanged);
  await action('review', row.id).click(); await field('confirmed').check(); await field('actualCost').fill('660'); await field('allocation').selectOption('needed'); await field('evidence').fill('PRACTICE ONLY — rechecked hours and payroll evidence after rate review.'); await save();
  reviewed = await p.evaluate(id => fin745Rows().find(r => r.id === id), row.id);
  check('a fresh evidence review restores confirmed status without losing prior revision', reviewed.status === 'confirmed' && reviewed.actualCost === 660 && await p.evaluate(id => fin745History('review', id).length, row.id) === 2);
  const future = await p.evaluate(() => { const r = fin745Rows().find(x => x.status === 'forecast'); if (!r) return {found: false}; const before = JSON.stringify(S.finance745), result = fin745Save('review', r.id, {confirmed: true, fingerprint: r.fingerprint, actualCost: null, allocation: 'unverified', evidence: 'PRACTICE ONLY'}, r.review ? r.review.id : null); return {found: true, rejected: !result.ok && /Future hours are forecast/.test(result.error), unchanged: before === JSON.stringify(S.finance745)}; });
  check('future planned shifts cannot be confirmed as actual work', future.found && future.rejected && future.unchanged);

  const journalBeforeBilling = await p.evaluate(() => fin745List('journal').length);
  await action('billing').click(); await field('expectedMonth').fill('2026-10'); await save();
  check('moving billing beyond work month requires a reason', /reason for later billing/i.test(await p.locator('#fin745Form').innerText()));
  await field('reason').fill('PRACTICE ONLY — customer agreed October month-end invoicing.'); await save();
  const billing = await p.evaluate(() => ({event: fin745Latest('billing', '2026-09'), journals: fin745List('journal').length}));
  check('September work can bill at October month-end with reason and no automatic journal', billing.event.payload.expectedMonth === '2026-10' && billing.event.payload.reason.includes('customer agreed') && billing.journals === journalBeforeBilling && /October 2026 month-end/.test(await section.innerText()));

  await action('journal', '').click();
  check('Add journal proposal opens work, posting, reversal and approval controls', await field('workMonth').isVisible() && await field('postingMonth').isVisible() && await field('reversalMonth').isVisible() && await field('approvedBy').isVisible());
  await screenshot('#fin745Form', 'finance_journal_form');
  await screenshot('#fin745_approvedBy', 'finance_journal_approval');
  await screenshot('#fin745_evidence', 'finance_journal_evidence');
  await field('amount').fill('660'); await field('postingMonth').fill('2026-10'); await field('reversalMonth').fill('2026-11'); await field('sourceIds').fill(row.id); await field('evidence').fill('PRACTICE ONLY — September payroll evidence for Finance review.'); await field('note').fill('PRACTICE ONLY — allocate salary/CNA cost into Installation, not additional project spend.'); await save();
  let journal = await p.evaluate(() => fin745List('journal')[0]);
  check('draft allocation keeps original work month and separately chosen posting/reversal months', journal && journal.payload.status === 'draft' && journal.payload.workMonth === '2026-09' && journal.payload.postingMonth === '2026-10' && journal.payload.reversalMonth === '2026-11' && journal.payload.sourceIds[0] === row.id);
  const journalKey = journal.key;
  await action('journal', journalKey).click(); await field('status').selectOption('approved'); await save();
  check('approval without a named reviewer and separate accounts is refused', /Approval needs/.test(await p.locator('#fin745Form').innerText()) && await p.evaluate(k => fin745Latest('journal', k).payload.status, journalKey) === 'draft');
  await field('approvedBy').fill('Practice Finance Reviewer'); await field('debit').fill('PRACTICE-INSTALL'); await field('credit').fill('PRACTICE-PAYROLL'); await save();
  journal = await p.evaluate(k => fin745Latest('journal', k), journalKey);
  check('approval records reviewer, accounts and immutable earlier draft', journal.payload.status === 'approved' && journal.payload.approvedBy === 'Practice Finance Reviewer' && await p.evaluate(k => fin745History('journal', k).length, journalKey) === 2);
  await action('journal', journalKey).click(); await field('status').selectOption('posted'); await save();
  check('posted status without an external ledger reference is refused', /external ledger reference/.test(await p.locator('#fin745Form').innerText()));
  await field('externalRef').fill('PRACTICE-ONLY-LEDGER-745'); await save();
  journal = await p.evaluate(k => fin745Latest('journal', k), journalKey);
  check('posted externally records supplied ledger evidence, not a ledger API operation', journal.payload.status === 'posted' && journal.payload.externalRef === 'PRACTICE-ONLY-LEDGER-745' && await p.evaluate(k => fin745History('journal', k).length, journalKey) === 3);
  const guards = await p.evaluate(key => { const e = fin745Latest('journal', key), before = JSON.stringify(S.finance745), altered = fin745Save('journal', key, {...e.payload, amount: 661}, e.id); const overlap = fin745Save('journal', key + '-duplicate', {...e.payload, status: 'draft', approvedBy: '', externalRef: ''}, null); return {locked: !altered.ok && /posted journal.*cannot be changed/.test(altered.error), overlap: !overlap.ok && /overlap allocation journal/.test(overlap.error), unchanged: before === JSON.stringify(S.finance745)}; }, journalKey);
  check('posted journal cannot be overwritten and duplicate allocation is blocked', guards.locked && guards.overlap && guards.unchanged, guards);
  const staleReview = await p.evaluate(id => { const r = fin745Rows().find(x => x.id === id), before = JSON.stringify(S.finance745), result = fin745Save('review', id, r.review.payload, null); return {refused: !result.ok && /changed on another screen/.test(result.error), unchanged: before === JSON.stringify(S.finance745)}; }, row.id);
  check('optimistic revision guard refuses a stale editor without data loss', staleReview.refused && staleReview.unchanged);

  await p.evaluate(() => { window.fin745Download = (name, content, type) => window.__downloads.push({name, content, type}); });
  await action('csv').click(); await action('backup').click();
  const exported = await p.evaluate(() => {
   const csv = window.__downloads.find(x => x.name.endsWith('.csv')), backup = window.__downloads.find(x => x.name.endsWith('.json')), exported = exportRecord(), file = JSON.parse(backup.content), full = recordsFrom(fin745Clone(exported));
   const bare = fin745Clone(exported); delete bare.records; const bareRecord = recordsFrom(bare), merged = mergeRecords(blank(), full), roundTrip = mergeRecords(merged.merged, recordsFrom(file));
   const equal = v => fin745Stable(v) === fin745Stable(S.finance745), valid = validateRecords(file.records).filter(x => !x.startsWith('note: '));
   const invalid = fin745Clone(file.records), first = Object.keys(invalid.finance745)[0]; invalid.finance745[first].payload.unexpectedUnsafeField = 'refuse';
   return {csv: csv.content.includes('Verified cost AUD') && csv.content.includes('PRACTICE-ONLY-LEDGER-745') && csv.content.includes('2026-10'), backup: equal(file.records.finance745), full: equal(full.finance745), bare: equal(bareRecord.finance745), merge: equal(merged.merged.finance745) && equal(roundTrip.merged.finance745), valid, malformedRejected: validateRecords(invalid).some(x => /Unknown Finance payload field/.test(x)), formulaSafe: fin745CsvCell('=1+1').startsWith('"\'='), events: Object.keys(S.finance745).length};
  });
  check('Finance CSV exports current evidence, billing month and external posting reference', exported.csv && exported.formulaSafe);
  check('review backup and full/bare Tools export all retain every Finance revision', exported.backup && exported.full && exported.bare);
  check('import merge round-trip keeps Finance events without duplication or loss', exported.merge && exported.valid.length === 0, {events: exported.events, validationErrors: exported.valid});
  check('malformed imported Finance payload is rejected', exported.malformedRejected);
  const figures = await p.evaluate(() => { const snapshot = window.__financeFigures(); return {references: Object.keys(snapshot.references).length, unchanged: fin745Stable(snapshot) === window.__beforeFigures, recordUnchanged: window.__recordComparable() === window.__beforeRecord, stamped: Object.values(S.finance745).every(e => !!S.stamps['finance745/' + e.id] && !!S.by['finance745/' + e.id]), costs: (S.costs || []).length}; });
  check('all 202 reference financial figures and complete labour plan remain unchanged', figures.references === 202 && figures.unchanged, {references: figures.references});
  check('source records are unchanged except Finance events and their save/audit metadata', figures.recordUnchanged);
  check('every Finance revision has a document stamp and recorder', figures.stamped);
  await p.waitForTimeout(1200);
  const captured = await p.evaluate(() => ({finance: window.__writes.filter(w => w.path.startsWith('finance745/')).length, audit: window.__writes.filter(w => /^(stamps|by)\/finance745~2f~/.test(w.path)).length, other: window.__writes.filter(w => !w.path.startsWith('finance745/') && !/^(stamps|by)\/finance745~2f~/.test(w.path)).map(w => w.path), deletes: window.__writes.filter(w => !w.body).length}));
  check('all captured shared-record writes are Finance events and their own audit metadata only', captured.finance >= exported.events && captured.audit === 2 * captured.finance && captured.other.length === 0 && captured.deletes === 0, captured);
  const size = await p.evaluate(() => { const root = document.getElementById('finance745'), b = root.getBoundingClientRect(); return {root: root.scrollWidth <= root.clientWidth + 1, fit: b.left >= -1 && b.right <= innerWidth + 1, width: innerWidth, left: b.left, right: b.right}; });
  check('Finance module stays within desktop/phone viewport; tables scroll inside it', size.root && size.fit, size);
  await p.evaluate(() => { window.__practiceCap = 'view'; SYNC.readonly = true; SYNC.level = 'view'; renderCosts(); });
  const relock = await p.evaluate(() => { const before = JSON.stringify(S), result = fin745Save('billing', '2026-09', {expectedMonth: '2026-11', reason: 'not allowed'}, fin745Latest('billing', '2026-09').id); return {refused: !result.ok, unchanged: before === JSON.stringify(S), disabled: document.querySelector('#finance745 [data-f745="billing"]').disabled}; });
  check('loss of edit permission locks controls and rejects stale save calls', relock.refused && relock.unchanged && relock.disabled);
  check('zero uncaught page errors', s.errors.length === 0, s.errors);
  check('zero browser console errors', consoleErrors.length === 0, consoleErrors);
  check('zero live-record write attempts reached the network', s.counts.blocked === 0, {blockedWrites: s.counts.blocked});
  result.captured = captured; result.references = figures.references; result.pageErrors = s.errors; result.consoleErrors = consoleErrors; result.blockedWrites = s.counts.blocked;
 } catch (error) { check('suite completed without an unexpected exception', false, error.message); result.exception = error.stack; }
 finally { if (s) await s.browser.close().catch(() => {}); }
 result.passed = checks.filter(c => c.pass).length; result.total = checks.length;
 fs.writeFileSync(path.join(__dirname, 'practice_' + name + '.json'), JSON.stringify(result, null, 2) + '\n');
 console.log('RESULT ' + name + ' ' + result.passed + '/' + result.total);
 return result;
}

(async () => {
 const runs = await Promise.all((process.env.MOB === '1' ? [true] : process.env.DESKTOP_ONLY === '1' ? [false] : [false, true]).map(run));
 fs.writeFileSync(path.join(__dirname, 'practice_results.json'), JSON.stringify({author: 'Andrew Fisher', sha256, runs}, null, 2) + '\n');
 if (runs.some(r => r.passed !== r.total)) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
