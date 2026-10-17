/* Author: Andrew Fisher. Read-only browser checks for v10.19: the built page opened at the live address, reading the live
 record through toolchain/harness/open_page.js (every write the page tries is aborted). Nothing on the service changes.
   PAGE=build/GC500_v10.19/GC500_Delivery_Control_hosted.html node tests/test_v1019.cjs
 Prints PASS/FAIL per check, writes tests/test_v1019_result.json, exits non-zero on any failure. */
'use strict';
const fs = require('fs'), path = require('path');
const {open} = require(path.resolve(__dirname, '../../toolchain/harness/open_page.js'));
const PAGE = process.env.PAGE || path.resolve(__dirname, '../../build/GC500_v10.19/GC500_Delivery_Control_hosted.html');
const OUT = process.env.OUT || path.join(__dirname, 'test_v1019_result.json');
const results = [];
const say = (name, ok, info) => { results.push({name, ok: !!ok, info: info == null ? undefined : info}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info != null ? ' — ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); };
(async () => { let h; try {
 h = await open({pageFile: PAGE, hash: '#fencing', W: 1440, H: 900});
 const p = h.page;
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof poCard === 'function' && SYNC.first && typeof SYNC_COLLS !== 'undefined' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
 await p.evaluate(() => { go('fencing'); }); await p.waitForTimeout(2500);

 // (1) the value field shows currency
 const vals = await p.evaluate(() => Object.fromEntries(['4647515', '4647517', '4647519', '4647520'].map(n => { const i = document.querySelector(`[data-po-amt="${n}"]`); return [n, i ? {value: i.value, type: i.type, inputmode: i.getAttribute('inputmode'), maxWidth: i.style.maxWidth, w: Math.round(i.getBoundingClientRect().width), textFits: i.scrollWidth <= i.clientWidth} : null]; })));
 say('4647517 value field shows $26,695.00', vals['4647517'] && vals['4647517'].value === '$26,695.00', vals['4647517']);
 say('4647519 value field shows $28,246.50', vals['4647519'] && vals['4647519'].value === '$28,246.50', vals['4647519']);
 say('4647520 value field is empty (no value recorded)', vals['4647520'] && vals['4647520'].value === '', vals['4647520']);
 say('value field is a text field with a decimal keypad, still 110px wide as v10.18 built it', ['4647517', '4647519', '4647520'].every(n => vals[n] && vals[n].type === 'text' && vals[n].inputmode === 'decimal' && vals[n].maxWidth === '110px'));
 say('the currency text fits inside the field ($50,154.00 and $28,246.50, no overflow)', vals['4647515'] && vals['4647515'].value === '$50,154.00' && vals['4647515'].textFits && vals['4647519'].textFits, {w: vals['4647519'] && vals['4647519'].w});

 // (2) the typed currency parses back to the number the Save handler checks
 const parse = await p.evaluate(() => ({a: poParseMoney1019('$26,695.00'), n: Number(poParseMoney1019('$26,695.00')), b: poParseMoney1019(' $ 1 234,5 '), e: poParseMoney1019(''), z: poParseMoney1019('0'), bad: poParseMoney1019('$abc'), badNum: Number.isFinite(Number(poParseMoney1019('$abc')))}));
 say("poParseMoney1019('$26,695.00') === '26695.00' and Number(...) === 26695", parse.a === '26695.00' && parse.n === 26695, parse);
 say("poParseMoney1019('') === '' (an empty field clears the value, as before)", parse.e === '');
 say('a non-number still fails the existing Save check', parse.bad === 'abc' && parse.badNum === false);

 // people shown without an agent suffix
 const words = await p.evaluate(() => [['Andrew Fisher via Codex', 'Andrew Fisher'], ['Andrew Fisher (via Claude)', 'Andrew Fisher'], ['Andrew Fisher via Argon', 'Andrew Fisher'], ['Andrew Fisher VIA GEMINI', 'Andrew Fisher'], ['a person', 'a person'], ['Olivia Smith', 'Olivia Smith'], ['  Andrew Fisher  ', 'Andrew Fisher'], ['', ''], [null, '']].map(([i, want]) => ({i, want, got: personWords1019(i)})));
 say('personWords1019 strips the agent suffix and leaves names alone', words.every(w => w.got === w.want), words.filter(w => w.got !== w.want));

 // the live-rendered card: confirmed rows carry Mark checked, nobody shows an agent suffix, the computed match stays
 const live = await p.evaluate(() => {
  const card = document.querySelector('#pane-fencing [data-po-values1014]');
  const rowOf = n => { const i = card && card.querySelector(`[data-po-amt="${n}"]`); return i ? i.closest('tr') : null; };
  const confirmed = poAll().filter(poFencing866).filter(o => o.confirmed).map(o => o.number);
  const withChecked = poAll().filter(poFencing866).filter(o => o.checked && o.checked.by).map(o => o.number);
  const r19 = rowOf('4647519'), r20 = rowOf('4647520');
  return {card: !!card, confirmed, withChecked, markButtons: card ? [...card.querySelectorAll('[data-po-check1019]')].map(b => b.dataset.poCheck1019) : null,
   cardText: card ? card.textContent : '', r19: r19 ? r19.textContent : null, r20check: !!(r20 && r20.querySelector('[data-po-check1019]')),
   style: !!document.getElementById('po-checked1019-style'), recordHasSuffix: poAll().some(o => /\bvia\b/i.test(String(o.updated_by || o.by || ''))),
   btnInPoCell: card ? [...card.querySelectorAll('[data-po-check1019]')].every(b => b.closest('td') === b.closest('tr').cells[0]) : false,
   /* P/O rows only: the supplier-pricing detail inside a row is a table of its own */
   actsOnlySave: card ? [...card.querySelectorAll('[data-po-save]')].map(b => b.closest('tr')).every(tr => tr.cells[tr.cells.length - 1].querySelectorAll('button').length === 1 && /^(Save|Confirm)$/.test(tr.cells[tr.cells.length - 1].textContent.trim())) : false};
 });
 say('Mark checked sits in the P/O cell; the actions column still holds only Save / Confirm', live.btnInPoCell && live.actsOnlySave);
 const ro = await p.evaluate(() => { const card = document.querySelector('#pane-fencing [data-po-values1014]'); const save = card.querySelector('[data-po-save="4647508"]'), mark = card.querySelector('[data-po-check1019="4647508"]');
  return {viewonly: document.body.classList.contains('viewonly'), save: save ? getComputedStyle(save).display : null, mark: mark ? getComputedStyle(mark).display : null}; });
 say('on the view link Mark checked is hidden exactly like Save', ro.viewonly && ro.save === 'none' && ro.mark === 'none', ro);
 say('Fencing purchase-order card rendered', live.card);
 say('Mark checked on every confirmed row that has no recorded check (' + live.confirmed.length + ' rows)', live.markButtons && JSON.stringify(live.markButtons) === JSON.stringify(live.confirmed.filter(n => !live.withChecked.includes(n))), {markButtons: live.markButtons, confirmed: live.confirmed, withChecked: live.withChecked});
 say('no Mark checked on the unconfirmed 4647520', !live.r20check);
 say('4647519 row says confirmed by Andrew Fisher without the agent suffix (record carries one)', live.recordHasSuffix && live.r19 && /confirmed by Andrew Fisher/.test(live.r19) && !/via/i.test(live.r19), live.r19 ? live.r19.replace(/\s+/g, ' ').slice(0, 160) : null);
 say('4647519 row still shows ✓ Supplier dockets match P/O', live.r19 && live.r19.includes('✓ Supplier dockets match P/O'));
 say('no agent suffix anywhere on the purchase-order card', !/via (codex|claude|argon|gemini)/i.test(live.cardText));
 say('checked-state style installed once', live.style);

 // (3) + (4) in memory only: a recorded check on 4647517, re-rendered into a template (nothing saved; writes are aborted anyway)
 const mem = await p.evaluate(() => {
  const keep = JSON.stringify(S.purchaseOrders['4647517'] || null);
  try {
   S.purchaseOrders['4647517'] = Object.assign({}, S.purchaseOrders['4647517'] || {}, {checked: {by: 'Andrew Fisher via Codex', at: '2026-10-15T00:40:00Z'}});
   if (typeof sharedCache975 === 'function') sharedCache975();
   const t = document.createElement('template'); t.innerHTML = poCard(fenceByWeek(allDockets()));
   const rowOf = n => { const i = t.content.querySelector(`[data-po-amt="${n}"]`); return i ? i.closest('tr') : null; };
   const r17 = rowOf('4647517'), r19 = rowOf('4647519');
   const confirmed = poAll().filter(poFencing866).filter(o => o.confirmed).map(o => o.number);
   const block = r17 && r17.querySelector('.po-checked1019');
   return {r17: r17 ? r17.textContent : null, r19: r19 ? r19.textContent : null, r17check: !!(r17 && r17.querySelector('[data-po-check1019]')), r19check: !!(r19 && r19.querySelector('[data-po-check1019]')),
    markButtons: [...t.content.querySelectorAll('[data-po-check1019]')].map(b => b.dataset.poCheck1019), confirmed, block: block ? block.outerHTML : null, layered: !!(poOf('4647517') && poOf('4647517').checked)};
  } finally {
   if (keep === 'null') delete S.purchaseOrders['4647517']; else S.purchaseOrders['4647517'] = JSON.parse(keep);
   if (typeof sharedCache975 === 'function') sharedCache975();
  }
 });
 const restored = await p.evaluate(() => !(poOf('4647517') && poOf('4647517').checked));
 say('poAll layers the checked field through to the row', mem.layered);
 say('4647517 row shows ✓ P/O checked · Andrew Fisher (no "via Codex")', mem.r17 && mem.r17.includes('✓ P/O checked') && mem.r17.includes('Andrew Fisher') && !/via codex/i.test(mem.r17), mem.block);
 say('checked line carries the stamp in AEST (2026-10-15T00:40Z is 15 Oct 10:40)', mem.block && /15 Oct 10:40/.test(mem.block));
 say('4647519 row still shows ✓ Supplier dockets match P/O beside the in-memory check', mem.r19 && mem.r19.includes('✓ Supplier dockets match P/O'));
 say('Mark checked gone from the checked 4647517 row, kept on the other confirmed rows', !mem.r17check && mem.r19check && JSON.stringify(mem.markButtons) === JSON.stringify(mem.confirmed.filter(n => n !== '4647517')), {markButtons: mem.markButtons, confirmed: mem.confirmed});
 say('in-memory record restored', restored);

 // (5) the Pre-starts tab shows nobody with an agent suffix
 await p.evaluate(() => { go('prestarts'); });
 await p.waitForFunction(() => typeof DOCS === 'undefined' || !DOCS.state || ['ready', 'none', 'failed'].includes(DOCS.state), null, {timeout: 120000}).catch(() => {});
 await p.evaluate(() => { if (typeof renderPrestarts === 'function') renderPrestarts(); }); await p.waitForTimeout(1500);
 const pre = await p.evaluate(() => { const pane = document.querySelector('#pane-prestarts'); const all = typeof prestartsAll === 'function' ? prestartsAll() : [];
  return {shown: !!pane && !pane.hidden, rows: pane ? pane.querySelectorAll('.prerow').length : 0, innerText: pane ? pane.innerText : '', textContent: pane ? pane.textContent : '', docs: typeof DOCS !== 'undefined' ? DOCS.state : null,
   recordSuffixes: all.filter(x => /\bvia\b/i.test(String(x.by || ''))).length, total: all.length}; });
 say('Pre-starts tab rendered with its rows (' + pre.rows + ' rows, documents ' + pre.docs + ')', pre.shown && pre.rows > 0, {recordSuffixes: pre.recordSuffixes, total: pre.total});
 say('the record carries agent suffixes on pre-starts, so this check proves something', pre.recordSuffixes > 0);
 say('Pre-starts innerText has no "via Codex"', !/via codex/i.test(pre.innerText));
 say('Pre-starts has no agent suffix at all, shown or folded', !/via (codex|claude|argon|gemini)/i.test(pre.textContent));
 say('Pre-starts still names the person', /Andrew Fisher/.test(pre.textContent));

 // (6) no page errors; nothing written
 say('no page errors', h.errors.length === 0, h.errors);
 say('no write reached the service (the harness aborts them)', true, h.counts);
} catch (e) { say('harness ran to the end', false, String(e && e.message || e)); } finally { if (h) await h.browser.close().catch(() => {}); }
 const pass = results.every(r => r.ok);
 fs.writeFileSync(OUT, JSON.stringify({author: 'Andrew Fisher', page: PAGE, pass, checks: results.length, failed: results.filter(r => !r.ok).map(r => r.name), results}, null, 1) + '\n');
 console.log((pass ? 'PASS' : 'FAIL') + ' ' + results.filter(r => r.ok).length + '/' + results.length + ' checks');
 process.exit(pass ? 0 : 1);
})();
