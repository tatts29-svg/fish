/* Author: Andrew Fisher. v11.52 checks: the six references on their own hire schedules carry no hire, labour, servicing or
   transport money on the page while their lines, ticks and lights stay; every waste tank's labour prices at nought with
   the block's labour untouched; contract 9968929 line 5 reads Coates own use; the P&L, Where we are, Pricing and the
   drawer say "Not charged here". GET only; the record is compared.
     PAGE=build/GC500_v11.52/GC500_Delivery_Control_hosted.html node tests/test_v1152.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 1200))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
const REFS = ['T0024', 'T0162', 'T0176', 'BJR01', 'SVP01', 'PG29'];
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#costs', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#costs', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(2500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.52'));
  const R = await p.evaluate(refs => holdAssets(() => {
   const N = NotChargedHere1152, cents = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
   const rates = nightRates1040();
   const o = {refs: {}, held: {labour: 0, servicing: 0, transport: 0, hire: 0}, tanks: [], hs9968929: [], api: {refs: N.refs, has: refs.map(r => N.has(r)), words: N.summary().words}};
   for (const ref of refs) {
    const a = allAssets().find(x => x.key === ref); const r = {exists: !!a}; o.refs[ref] = r; if (!a) continue;
    const t = assetTotal(a); r.total = {known: t.known, total: t.total, labour: t.labour, transport: t.transport, held: !!t.held1152, lines: (t.lines || []).map(l => [l.item, l.total, !!l.held1152, l.transport_charge])};
    r.labour = chargeLines(a).map(l => { const i = labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a); return {item: l.item, lines: (i.lines || []).map(L => [L.key, L.rate, L.money, !!L.held1152, !!L.ticked]), held: !!i.held1152}; });
    r.night = nightService1040(a, rates);
    r.transport = chargeLines(a).map(l => onsiteTransportRows1006(a, l.item).map(x => ({leg: x.leg, state: x.state, actual: x.actualAdditional1006, additional: x.additional, reasons: x.reasons, gross: x.grossEstimate})));
    /* what would have been charged: the unwrapped primitives */
    const t0 = N.unwrapped.assetTotal(a); o.held.hire += (t0.lines || []).reduce((s, l) => s + (l.total || 0), 0);
    chargeLines(a).forEach(l => { const i0 = N.unwrapped.labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a), q = qtyOf(l) || 0; (i0.lines || []).filter(L => L.ticked).forEach(L => { o.held.labour += (L.rate || 0) * q; }); });
    const n0 = N.unwrapped.nightService1040(a, rates); if (n0 && n0.lines) o.held.servicing += n0.lines.reduce((s, l) => s + (l.total || 0), 0);
    r.transport.flat().forEach(x => { o.held.transport += x.gross || 0; });
   }
   for (const k of Object.keys(o.held)) o.held[k] = cents(o.held[k]);
   for (const a of allAssets()) { if (a._cancelled || a.rest_of) continue; const ls = chargeLines(a); if (!ls.some(l => N.tank(l.item))) continue;
    o.tanks.push({ref: a.key, lines: ls.map(l => { const i = labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a), m = labourMoney(a.key, assetTotal(a).lines.find(x => x.item === l.item) || {item: l.item, discipline: l.discipline}, a.key, a); return {item: l.item, tank: N.tank(l.item), rates: (i.lines || []).map(L => L.rate), money: (i.lines || []).map(L => L.money), included: !!i.included1152, total: m.total, ticks: m.ticked.length}; })}); }
   o.hs9968929 = ONHIRE_ROWS.filter(r => String(r.rental_contract) === '9968929').map(r => { const c = contractCharge(r); return {line: r.line, desc: r.description, how: c.how, amount: c.amount}; });
   const M = moneySummary();
   const live = allAssets().filter(a => !a._cancelled);
   o.summary = {labour: M.charge.labour, labourSum: cents(live.reduce((s, a) => s + (assetTotal(a).labour || 0), 0)), servicing: M.charge.servicing, perRefs: (servicing748().per1040 || []).map(x => x.ref), transportArrived: M.charge.transportArrived1006, total: M.charge.total, excluded: M.excluded1152, cardHire: M.charge.card_hire};
   o.pricingCount = allAssets().filter(a => !a._cancelled && !N.has(a.key)).length;
   return o;
  }), REFS);
  check('the six references are on the page and every one is held: hire, labour, transport and total at nought on each, every line marked, the handle names them',
   REFS.every(r => R.refs[r].exists && R.refs[r].total.held && R.refs[r].total.known === 0 && R.refs[r].total.total === 0 && R.refs[r].total.labour === 0 && R.refs[r].total.transport === 0 && R.refs[r].total.lines.length && R.refs[r].total.lines.every(l => l[1] === 0 && l[2] && l[3] === 0)) && R.api.has.every(Boolean) && R.api.refs.length === 6,
   {totals: Object.fromEntries(REFS.map(r => [r, R.refs[r].total])), api: R.api.refs});
  check('their labour lines stay for the ticks, each at nought and marked, with every install tick still on the record',
   REFS.every(r => R.refs[r].labour.length && R.refs[r].labour.every(x => x.held && x.lines.length >= 2 && x.lines.every(L => L[1] === 0 && L[2] === 'zero' && L[3]))) && REFS.every(r => R.refs[r].labour.some(x => x.lines.some(L => L[0] === 'install' && L[4]))),
   Object.fromEntries(REFS.map(r => [r, R.refs[r].labour])));
  check('no event-night servicing on any of them, and the servicing model lists none of them', REFS.every(r => R.refs[r].night === null) && !R.summary.perRefs.some(x => REFS.includes(x)) && R.summary.perRefs.length >= 60, {night: REFS.map(r => R.refs[r].night && 'has lines'), perRefs: R.summary.perRefs.length});
  check('their transport legs are excluded with the reason, nothing arrived counted', REFS.every(r => R.refs[r].transport.flat().length >= 2 && R.refs[r].transport.flat().every(x => x.state === 'excluded' && x.actual === 0 && (x.additional || 0) === 0 && (x.reasons || []).some(w => /Not charged here|Coates own use/.test(w)))), Object.fromEntries(REFS.map(r => [r, R.refs[r].transport])));
  check('what is held out is real money on the record today: labour, servicing, transport and card hire each above nought', R.held.labour > 0 && R.held.servicing > 0 && R.held.transport > 0 && R.held.hire > 0, R.held);
  console.log('   held out of the figures now (would-be charges): ' + JSON.stringify(R.held));
  check('every waste tank\'s labour prices at nought (lines kept, marked one charge with the block) and the block beside it keeps its rates', R.tanks.length >= 4 && R.tanks.every(t => t.lines.some(l => l.tank) && t.lines.filter(l => l.tank).every(l => l.included && l.rates.length >= 3 && l.rates.every(x => x === 0) && l.money.every(x => x === 'zero') && l.total === 0) && t.lines.filter(l => !l.tank && /block/i.test(l.item)).every(l => !l.included && l.rates.length >= 3 && l.rates.every(x => x > 0))), R.tanks);
  check('contract 9968929: every line Coates own use at nought, the renamed container line 5 among them', R.hs9968929.length === 4 && R.hs9968929.every(r => r.how === 'Coates own use' && r.amount === 0) && R.hs9968929.some(r => r.line === 5 && /Shop Front/.test(r.desc)), R.hs9968929);
  check('the P&L labour is the sum of the references\' labour (the held ones adding nought), the summary names the six and the waste tanks', Math.abs(R.summary.labour - R.summary.labourSum) < 0.011 && R.summary.excluded && REFS.every(r => R.summary.excluded.words.includes(r)) && /waste tank/.test(R.summary.excluded.words) && /9990100/.test(R.summary.excluded.words), {labour: R.summary.labour, labourSum: R.summary.labourSum, words: R.summary.excluded && R.summary.excluded.words.slice(0, 160)});
  const costsText = await p.evaluate(() => document.getElementById('pane-costs').innerText);
  check('the Costs & P&L summary says what is not charged here, naming the references', /Not charged here:/.test(costsText) && REFS.every(r => costsText.includes(r)) && /one charge with its toilet block/.test(costsText), costsText.match(/Not charged here:[^\n]{0,200}/) || costsText.slice(0, 200));
  await p.evaluate(() => { const el = [...document.querySelectorAll('#pane-costs li.held1152')][0]; if (el) el.scrollIntoView({block: 'center'}); });
  await p.waitForTimeout(600);
  await p.screenshot({path: path.join(out, 'pl_not_charged_here_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => go('progress')); await p.waitForTimeout(2500);
  const progText = await p.evaluate(() => document.getElementById('pane-progress').innerText);
  check('Where we are carries the one-line note on its money card', /Not charged here:/.test(progText) && /own hire schedules/.test(progText), progText.match(/Not charged here:[^\n]{0,160}/) || progText.slice(0, 160));
  await p.evaluate(() => go('pricing')); await p.waitForTimeout(2500);
  const pr = await p.evaluate(() => { const pane = document.getElementById('pane-pricing'); const kpi = pane.querySelector('.kpi .v'); return {text: pane.innerText, kpi: kpi ? kpi.textContent.trim() : null}; });
  check('Pricing prices the job without the six and lists them with their hire schedules', /own hire schedules/.test(pr.text) && REFS.every(r => new RegExp(r + ' · HS ').test(pr.text)) && /9977412 & 9968929/.test(pr.text) && String(R.pricingCount) === pr.kpi, {kpi: pr.kpi, expected: R.pricingCount, note: (pr.text.match(/references on their own hire schedules[^\n]{0,260}/) || [''])[0]});
  await p.evaluate(() => { const el = document.querySelector('#pane-pricing .kpis'); if (el) el.scrollIntoView({block: 'start'}); }); await p.waitForTimeout(600);
  await p.screenshot({path: path.join(out, 'pricing_held_note_' + tag + '.png'), fullPage: false});
  await p.evaluate(() => go('plant')); await p.waitForTimeout(1500);
  await p.evaluate(() => openAsset('T0162')); await p.waitForTimeout(2000);
  const dr = await p.evaluate(() => { const d = document.getElementById('drawer'); return {on: !!(d && d.classList.contains('on')), text: d ? d.innerText : '', ticks: d ? d.querySelectorAll('input[data-lab]').length : 0, held: !!(d && d.querySelector('[data-held1152]'))}; });
  check('the drawer for T0162 says not charged here on the hire line and the charges table, keeps its labour ticks, and shows no hire or labour money', dr.on && /not charged here/.test(dr.text) && dr.held && dr.ticks >= 2 && !/\$90\.07|\$36\.44|\$72\.88|\$47\.50|\$162\.95/.test(dr.text) && /9977410/.test(dr.text), {on: dr.on, ticks: dr.ticks, held: dr.held, money: dr.text.match(/\$[\d,]+\.\d\d/g), where: (dr.text.match(/not charged here[^\n]{0,120}/i) || [''])[0]});
  await p.evaluate(() => { const d = document.getElementById('drawer'); const el = d && [...d.querySelectorAll('dt')].find(x => /What is on hire/.test(x.textContent)); if (el) el.scrollIntoView({block: 'start'}); }); await p.waitForTimeout(600);
  await p.screenshot({path: path.join(out, 'drawer_T0162_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
  fs.writeFileSync(path.join(out, tag + '_held_out_figures.json'), JSON.stringify({at: new Date().toISOString(), live, held: R.held, summary: {labour: R.summary.labour, servicing: R.summary.servicing, transportArrived: R.summary.transportArrived, total: R.summary.total, cardHire: R.summary.cardHire}}, null, 1));
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1152.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
