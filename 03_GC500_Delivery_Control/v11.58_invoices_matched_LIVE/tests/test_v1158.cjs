/* Author: Andrew Fisher. v11.58 checks: the Purchase orders card says the invoice state of every fencing order the way Andrew
   matches them - four orders matched to the cent (weeks 1-4), the others "not matched yet" with the dockets so far and their
   estimate at the supplier's sheet rates; no revenue figure against an order; the note carries the rule; the P&L Rehire line
   says how many orders are invoiced and matched. GET only; record compared.
     PAGE=build/GC500_v11.58/GC500_Delivery_Control_hosted.html node tests/test_v1158.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 1200))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#fencing', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#fencing', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(5000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.58'));
  const R = await p.evaluate(() => holdAssets(() => {
   const card = document.querySelector('#pane-fencing [data-po-values1014]');
   const head = card ? card.querySelector('.hubtitle .w').textContent : '';
   const rows = card ? [...card.querySelectorAll('.tblwrap > table > tbody > tr')].map(tr => { const tds = [...tr.children].filter(e => e.tagName === 'TD'); const po = (tds[0] && tds[0].querySelector('b.mono') || {}).textContent || ''; const cell = tds[3]; const inv = cell && cell.querySelector('.inv1158'); return {po: po.trim(), n: cell && cell.firstChild ? String(cell.firstChild.textContent || '').trim() : '', state: inv ? [...inv.classList].find(c => /^inv1158-/.test(c)) : null, words: inv ? inv.textContent.trim() : null}; }) : [];
   const note = card ? card.querySelector('p.norate').textContent : '';
   const th = card ? [...card.querySelectorAll('thead th')].map(t => t.textContent.trim()) : [];
   const pos = poAll().filter(poFencing866);
   const counts = invoiceCounts1158(pos);
   const w5 = invoiceState1158(pos.find(o => o.number === '4647509'), poWeeksOf(pos.find(o => o.number === '4647509')));
   const w6 = invoiceState1158(pos.find(o => o.number === '4647508'), poWeeksOf(pos.find(o => o.number === '4647508')));
   const is5 = x => /5$/.test(String(x.programme_sheet || x.week || '').replace(/\s/g, '')) && !/DECON/i.test(String(x.programme_sheet || ''));
   const est5 = allDockets().filter(is5).reduce((s, d) => s + (Number(d.paid_total) || 0), 0) + supplierBaseNotes1014().filter(is5).reduce((s, x) => s + (Number(x.cost) || 0), 0);
   const n5 = allDockets().filter(is5).length + supplierBaseNotes1014().filter(is5).length;
   const P = pl770Model(); const rehire = (P.cost || []).find(c => c.key === 'rehire') || {};
   return {head, rows, note: note.slice(0, 600), th, counts, w5, w6, est5: Math.round(est5 * 100) / 100, n5, rehireBasis: String(rehire.basis || '').slice(0, 1200), cardText: card ? card.innerText : ''};
  }));
  check('the card header counts the invoices matched to the cent and the orders not matched yet', /4 invoices matched to the cent/.test(R.head) && /not matched yet/.test(R.head) && R.counts.matched === 4 && R.counts.awaiting >= 4, {head: R.head, counts: R.counts});
  const matched = R.rows.filter(r => r.state === 'inv1158-matched').map(r => r.po.replace(/\D/g, ''));
  check('weeks 1 to 4 read "invoice matched to the cent" with the sheet total', ['4647515', '4647517', '4647519', '4647520'].every(n => matched.some(m => m.includes(n))) && R.rows.filter(r => /4647515/.test(r.po))[0].words === 'invoice matched to the cent · $50,154', R.rows);
  const r5 = R.rows.find(r => /4647509/.test(r.po)), r6 = R.rows.find(r => /4647508/.test(r.po)), r22 = R.rows.find(r => /4647522/.test(r.po));
  check('week 5 reads not matched yet, with its dockets so far and their estimate at the sheet rates', r5 && r5.state === 'inv1158-awaiting' && new RegExp('invoice not matched yet · ' + R.n5 + ' dockets so far · about \\$' + Math.round(R.est5).toLocaleString('en-AU')).test(r5.words) && R.w5.n === R.n5 && Math.abs(R.w5.est - R.est5) < 0.01, {r5, w5: R.w5, est5: R.est5, n5: R.n5});
  check('week 6 reads not matched yet with 6 dockets; the event week has no dockets yet', r6 && r6.state === 'inv1158-awaiting' && /6 dockets so far/.test(r6.words) && R.w6.n === 6 && (!r22 || /no dockets yet/.test(r22.words)), {r6, r22, w6: R.w6});
  check('no revenue figure stands against an order any more; the column says invoice', !/revenue/i.test(R.rows.map(r => r.words).join(' ')) && R.th.includes('Dockets that week · invoice'), {th: R.th, words: R.rows.map(r => r.words)});
  check('the card note carries the rule in the project manager\'s words', /Invoices are matched to dockets as the dockets come in/.test(R.note) && /Not matched means the invoice is not here yet, nothing more/.test(R.note), R.note);
  check('the P&L Rehire line says four orders are invoiced and matched to the cent', /4 orders invoiced and matched to the cent, \$171,368/.test(R.rehireBasis) && /the other dockets await their invoice/.test(R.rehireBasis), R.rehireBasis);
  await p.evaluate(() => { const c = document.querySelector('#pane-fencing [data-po-values1014]'); if (c) c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(1200);
  await p.screenshot({path: path.join(out, 'po_card_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1158.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
