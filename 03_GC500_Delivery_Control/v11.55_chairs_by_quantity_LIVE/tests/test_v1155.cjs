/* Author: Andrew Fisher. v11.55 checks: pad chairs are counted by quantity, never numbered - P34 is unnumbered, its drawer
   says so, the Questions tab's asset-number check no longer asks for numbers on it; with the three record items of
   23 Oct 12:58 applied (EQ0005 arrived, P34's two chairs received, GN24 1277089) the asset-number and short-delivery
   questions are answered. GET only; the record is compared.
     PAGE=build/GC500_v11.55/GC500_Delivery_Control_hosted.html node tests/test_v1155.cjs      MOB=1 ...      LIVE=1 ... */
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
 const h = await open(MOB ? {pageFile, hash: '#questions', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#questions', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.55'));
  const R = await p.evaluate(() => holdAssets(() => {
   const Q = questionsList(), list = Object.keys(Q).filter(k => /^\d+$/.test(k)).map(k => Q[k]);
   const q = id => list.find(x => x.id === id) || null;
   const p34 = assetOf('P34'), eq = assetOf('EQ0005'), gn = assetOf('GN24');
   return {unnumbered: {P34: unnumbered(p34), GN24: unnumbered(gn), WB: /water-filled/i.test('Water-filled barriers') && UNNUMBERED_RX.test('Water-filled barriers')},
    spNums: q('sp-nums') && {st: q('sp-nums').st, q: q('sp-nums').q, rows: q('sp-nums').rows}, spShort: q('sp-short') && {st: q('sp-short').st, rows: q('sp-short').rows},
    open: list.filter(x => x.st === 'open').map(x => x.id), fails: Q.fails || [],
    p34: {rows: itemRows(p34), numbers: displayNumbersText744(p34)}, eq: {rows: itemRows(eq), light: deliveryOf('EQ0005').state}, gn: {nums: locNums(gn), text: displayNumbersText744(gn)}};
  }));
  check('P34 (pad chairs) is counted by quantity, never numbered; a generator is not; water-filled barriers still are', R.unnumbered.P34 === true && R.unnumbered.GN24 === false && R.unnumbered.WB === true, R.unnumbered);
  check('the drawer words for P34 say not numbered, counted by quantity', /not numbered/i.test(R.p34.numbers) && /quantity/i.test(R.p34.numbers), R.p34);
  check('the asset-number question no longer asks for numbers on P34', !R.spNums || !(R.spNums.rows || []).some(r => /^P34\b/.test(r)), R.spNums);
  check('with the 23 Oct record items applied: P34 two chairs received, EQ0005 on site 1 of 1, GN24 carries 1277089; the asset-number and short-delivery questions are answered (or EQ0005 no longer listed)',
   R.p34.rows.some(r => r.asked === 'Pad Chair' && r.qty_supplied === 2) && R.eq.rows.some(r => r.qty_supplied === 1) && R.eq.light === 'on site' && /1277089/.test(R.gn.text) && (!R.spNums || R.spNums.st === 'done' || !(R.spNums.rows || []).some(r => /^GN24\b/.test(r))) && (!R.spShort || R.spShort.st === 'done' || !(R.spShort.rows || []).some(r => /EQ0005/.test(r))),
   {p34: R.p34.rows, eq: R.eq, gn: R.gn, spNums: R.spNums, spShort: R.spShort});
  check('no failed check on the Questions tab', R.fails.length === 0, R.fails);
  /* v11.55 - a unit identified on a reference carries its number */
  const N = await p.evaluate(() => holdAssets(() => {
   const one = k => { const a = assetOf(k); return a ? {text: displayNumbersText744(a), html: displayNumbersHtml744(a), loc: locNums(a), native: assetNumbersOf(a), own: displayNumbers744(a).own} : null; };
   const diff = []; allAssets().forEach(a => { try { const d = displayNumbers744(a), nat = assetNumbersOf(a); const add = d.own.filter(n => !nat.includes(n)); if (add.length) diff.push(a.key + ':' + add.join('/')); } catch (e) { diff.push(a.key + ':ERR ' + e.message); } });
   const locUp = []; allAssets().forEach(a => { try { const r = locNums(a); if (r && r.identified1155) locUp.push(a.key + ':+' + r.identified1155 + '=' + r.n + '/' + r.q); } catch (e) { locUp.push(a.key + ':ERR'); } });
   const units = Object.keys((S && S.loads) || {}).filter(k => /unit925/.test(k)).length;
   /* independently: every reference with an active Coates unit record whose number is not on its own list */
   const expect = {}; Object.values((S && S.loads) || {}).forEach(u => { if (!u || u.kind !== 'unit925-record' || u.active === false || u.removedBy || String(u.owner || 'coates') !== 'coates') return; const no = String(u.assetNo || '').trim(); if (!/^\d{4,8}$/.test(no)) return; const a = assetOf(u.ref); if (!a || assetNumbersOf(a).includes(no)) return; (expect[u.ref] = expect[u.ref] || []).push(no); });
   const expectList = Object.keys(expect).map(k => k + ':' + [...new Set(expect[k])].join('/'));
   const gi = finderIndex().find(it => it.kind === 'asset' && it.key === 'GN24');
   return {gn24: one('GN24'), gn10: one('GN10'), p67: one('P67'), wc09: one('WC09'), pg29: one('PG29'), diff, locUp, units, expectList, hayHas: !!(gi && gi.hay.includes('1277089')), matchesSrc: String(finderMatches).slice(0, 160), finder: finderMatches('1277089').map(it => it.kind + ':' + it.key), finder2: finderMatches('421107').map(it => it.kind + ':' + it.key)};
  }));
  check('GN24 reads its identified number 1277089, 1 of 1 numbered', N.gn24 && /1277089/.test(N.gn24.text) && /1277089/.test(N.gn24.html) && N.gn24.loc && N.gn24.loc.n === 1 && N.gn24.loc.q === 1, N.gn24);
  check('GN10 reads 1283681 and P67 reads 421107 the same way', N.gn10 && /1283681/.test(N.gn10.text) && N.gn10.loc.n === 1 && N.p67 && /421107/.test(N.p67.text) && N.p67.loc.n === 1, {gn10: N.gn10, p67: N.p67});
  check('exactly the references with an identified Coates unit off their own list gain its number (GN10, GN24, P67 among them); no asset errors', N.diff.length === N.expectList.length && N.diff.every(x => N.expectList.includes(x)) && ['GN10:1283681', 'GN24:1277089', 'P67:421107'].every(x => N.diff.includes(x)) && !N.diff.some(x => /ERR/.test(x)), {diff: N.diff, expect: N.expectList});
  check('"n of q numbered" counts identified units and never beyond q', N.locUp.length >= 3 && N.locUp.every(x => { const m = /=(\d+)\/(\d+)$/.exec(x); return m && Number(m[1]) <= Number(m[2]); }), N.locUp);
  check('the finder finds GN24 by 1277089 and P67 by 421107 (the reference, not only the unit inside it)', N.hayHas && N.finder.includes('asset:GN24') && N.finder2.includes('asset:P67'), {hayHas: N.hayHas, f1: N.finder, f2: N.finder2, units: N.units, src: N.matchesSrc});
  console.log('   unit925 records in S.loads: ' + N.units + ' · WC09 ' + JSON.stringify(N.wc09 && N.wc09.loc) + ' · PG29 ' + JSON.stringify(N.pg29 && N.pg29.text));
  console.log('   needs an answer now: ' + JSON.stringify(R.open));
  await p.waitForTimeout(1200);
  await p.screenshot({path: path.join(out, 'questions_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1155.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
