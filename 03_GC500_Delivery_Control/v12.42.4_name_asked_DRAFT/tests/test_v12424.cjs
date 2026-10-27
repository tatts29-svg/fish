/* Author: Andrew Fisher. v12.42.4 - a new person is asked for their name. Opens the page at the live address reading the live record
   (GET only), puts it in edit mode with the sync held in the page (every write captured, none sent), clears the name the way a phone
   opening the edit link for the first time has none, and answers the browser's name box from a list:
     a booking from the Demob card sheet (asked once, when the sheet opens; Save books in that name; a changed booking asks nothing),
     a booking with the question cancelled (nothing saved, the sheet stays open, the message shows inside the sheet, on top),
     a "name" with no letter ("0") asked again on a Ready tick, Picked up through the departure form with no name, one press never
     asking twice, and a message after the sheet closes back on the page.
     PAGE=<build> OUT=<dir> [MOB=1] node test_v12424.cjs */
'use strict';
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = process.env.MOB === '1', out = process.env.OUT, checks = [];
  fs.mkdirSync(out, {recursive: true});
  const h = await open({pageFile: process.env.PAGE, hash: '#demob', W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, mobile}), p = h.page;
  const check = (name, ok, detail) => { checks.push({name, ok: !!ok, detail: detail === undefined ? null : detail}); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(checks, null, 1)); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 700))); };
  const card = (k, u) => '#pane-demob article.sg1238[data-sg1238="' + k + '"]' + (u ? '[data-u1238="' + u + '"]' : '');
  const scrollTo = sel => p.evaluate(sel => { const el = document.querySelector(sel); if (!el) return false; el.scrollIntoView({block: 'center'}); return true; }, sel);
  const noName = (v = '') => p.evaluate(v => { S.operator = v; const w = document.getElementById('who'); if (w) w.value = v; }, v);
  const answers = list => p.evaluate(list => { window.__answers = list.slice(); }, list);
  const asked = () => p.evaluate(() => window.__asked.length);
  const shot = async name => { try { await p.screenshot({path: path.join(out, name + (mobile ? '_phone' : '_desktop') + '.png')}); } catch (e) {} };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.Singles1238 && typeof demob816 === 'function', null, {timeout: 180000});
    await p.evaluate(() => { try { go('demob'); } catch (e) {} });
    await p.waitForFunction(() => document.querySelector('#pane-demob article.sg1238'), null, {timeout: 90000});
    await p.waitForTimeout(2000);
    const foot = await p.evaluate(() => document.body.innerText.match(/v12\.\d+(?:\.\d+)?/g) || []);
    check('page loads with no errors, the footer v12.42.4, the Demob cards module unchanged (v12.42.3)', !h.errors.length && foot.includes('v12.42.4') && !foot.includes('v12.42.3 ·') && await p.evaluate(() => Singles1238.release === 'v12.42.3'), {errors: h.errors.slice(0, 3), foot: [...new Set(foot)]});

    /* edit mode, sync held, the name box answered from a list, no name */
    await p.evaluate(() => { window.__cap = []; SYNC.claims = 'edit'; Object.defineProperty(SYNC, 'level', {configurable: true, get: () => 'edit', set: () => {}}); Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}});
      SYNC.db.doc = name => ({set: async value => { __cap.push({name, value: JSON.parse(JSON.stringify(value || null))}); return {}; }, delete: async () => { throw Error('Deletion disallowed'); }});
      window.__asked = []; window.__answers = []; window.prompt = msg => { __asked.push(String(msg)); return __answers.length ? __answers.shift() : null; }; window.confirm = () => true;
      S.operator = ''; const w = document.getElementById('who'); if (w) w.value = ''; applyCapability(); renderDemob816(); });
    await p.waitForTimeout(1500);
    const G18 = await p.evaluate(() => (Singles1238.model().byKey.get('GN18') || [])[0].uid);
    const tomorrow = await p.evaluate(() => new Date(Date.parse(todayIso() + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10));
    const pick = async (hh, mm) => { await p.click('dialog.bkd1238 [data-day1238="' + tomorrow + '"]'); await p.click('dialog.bkd1238 [data-h1238="' + hh + '"]'); await p.click('dialog.bkd1238 [data-m1238="' + mm + '"]'); };
    const gn18 = () => p.evaluate(G18 => { const c = __cap.filter(x => /delivery\/GN18$/.test(x.name)).pop(), v = c && c.value || {}; return {n: __cap.filter(x => /delivery\/GN18$/.test(x.name)).length, b: (v.pickup1238_units || {})[G18] || null}; }, G18);

    /* 1. a booking with no name: asked once, when the sheet opens; Save books in that name */
    await answers(['Pat Example']);
    await scrollTo(card('GN18', G18)); await p.click(card('GN18', G18) + ' button[data-book1238]');
    await p.waitForSelector('dialog.bkd1238[open]', {timeout: 10000});
    const O1 = await p.evaluate(() => ({asked: __asked.length, msg: __asked[0] || '', who: document.getElementById('who').value, op: S.operator, fy: document.querySelector('dialog.bkd1238 .fy1238').textContent}));
    await pick(7, 30); await p.click('dialog.bkd1238 [data-bk1238="save"]'); await p.waitForTimeout(1200);
    const B1 = await gn18(), S1 = await p.evaluate(() => ({open: document.querySelector('dialog.bkd1238').open, asked: __asked.length}));
    check('v12.42.4: with no name, Book pick-up asks for the name once (the browser\'s own box, above the sheet) and keeps it in Tools · Recording as', O1.asked === 1 && /Your name/.test(O1.msg) && O1.who === 'Pat Example' && O1.op === 'Pat Example' && /as Pat Example/.test(O1.fy), O1);
    check('v12.42.4: Save booking then books it in that name, the sheet closes, nothing more is asked', B1.b && B1.b.by === 'Pat Example' && /T07:30:00\+10:00$/.test(B1.b.at) && !S1.open && S1.asked === 1, {B1, S1});
    await shot('booking_named');

    /* 2. the name now set: changing the booking asks nothing */
    await scrollTo(card('GN18', G18)); await p.click(card('GN18', G18) + ' button[data-book1238]'); await p.waitForSelector('dialog.bkd1238[open]', {timeout: 10000});
    await pick(9, 15); await p.click('dialog.bkd1238 [data-bk1238="save"]'); await p.waitForTimeout(1200);
    const B2 = await gn18(), A2 = await asked();
    check('v12.42.4: with a name set (as on Andrew\'s phone and laptop) nothing is asked; the changed booking is in that name', B2.b && B2.b.by === 'Pat Example' && /T09:15:00\+10:00$/.test(B2.b.at) && A2 === 1, {B2, A2});

    /* 3. the question cancelled: nothing saved, the sheet stays open, the message inside the sheet, on top */
    await noName(''); await answers([null, null]);
    const n3 = (await gn18()).n, a3 = await asked();
    await scrollTo(card('GN18', G18)); await p.click(card('GN18', G18) + ' button[data-book1238]'); await p.waitForSelector('dialog.bkd1238[open]', {timeout: 10000});
    await p.waitForTimeout(1700); /* a later press, not the same one */
    await pick(10, 0); await p.click('dialog.bkd1238 [data-bk1238="save"]'); await p.waitForTimeout(900);
    const C3 = await p.evaluate(a3 => { const d = document.querySelector('dialog.bkd1238'), f = document.getElementById('flash'); let top = null, inF = false;
      if (f && f.style.display !== 'none') { const b = f.getBoundingClientRect(), el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); inF = !!el && (el === f || f.contains(el)); top = el ? el.tagName : null; }
      return {open: d.open, asked: __asked.length - a3, flash: f ? f.textContent : '', inDialog: !!f && d.contains(f), onTop: inF, top, who: document.getElementById('who').value}; }, a3);
    const N3 = (await gn18()).n;
    await shot('booking_no_name_message');
    check('v12.42.4: the name question cancelled (asked when the sheet opened and again at Save), Save books nothing and the sheet stays open to try again', C3.open && N3 === n3 && C3.who === '' && C3.asked === 2, {C3, n3, N3});
    check('v12.42.4: and the message saying where the name goes shows inside the sheet, on top where it can be read', /Tools · Recording as/.test(C3.flash) && C3.inDialog && C3.onTop, C3);
    await p.click('dialog.bkd1238 [data-bk1238="cancel"]'); await p.waitForTimeout(300);
    const F3 = await p.evaluate(() => { flash('A message with no sheet open'); const f = document.getElementById('flash'), b = f.getBoundingClientRect(), el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return {inBody: f.parentNode === document.body, onTop: !!el && (el === f || f.contains(el)), text: f.textContent}; });
    check('v12.42.4: with the sheet closed, a message is back on the page as before', F3.inBody && F3.onTop, F3);

    /* 4. one press never asks twice */
    await p.waitForTimeout(1700);
    const T4 = await p.evaluate(() => { __answers = [null]; const a0 = __asked.length, x = whoAmI(), y = whoAmI(); return {x, y, asked: __asked.length - a0}; });
    check('v12.42.4: one press asks once: a second ask straight after a cancelled one does not ask again (no name either way)', T4.x === null && T4.y === null && T4.asked === 1, T4);

    /* 5. "0" is not a name: a Ready tick asks for one */
    await p.waitForTimeout(1700);
    await noName('0'); await answers(['Sam Example']);
    const P16 = 'event-portables|74';
    const st0 = await p.evaluate(P16 => (Singles1238.cardOf('WC31', P16) || {st: {}}).st.s, P16);
    await scrollTo(card('WC31', P16)); await p.click(card('WC31', P16) + ' button[data-lamp1238="' + (st0 === 'ready' ? 'not' : 'ready') + '"]');
    await p.waitForFunction(() => __cap.some(c => /delivery\/WC31$/.test(c.name)), null, {timeout: 30000}).catch(() => {});
    await p.waitForTimeout(800);
    const R5 = await p.evaluate(P16 => { const c = __cap.filter(x => /delivery\/WC31$/.test(x.name)).pop(), v = c && c.value || {}; return {u: (v.ready1238_units || {})[P16] || null, who: document.getElementById('who').value, asked: __asked.slice(-1)[0] || ''}; }, P16);
    check('v12.42.4: a "name" with no letter in it ("0") is asked for again; the Ready tick is in the name given', R5.u && R5.u.by === 'Sam Example' && R5.who === 'Sam Example' && /Your name/.test(R5.asked), R5);

    /* 6. Picked up through the departure form with no name */
    await p.waitForTimeout(1700);
    await noName(''); await answers(['Lee Example']);
    const PU = await p.evaluate(() => { const c = Singles1238.model().cards.find(x => x.st.s === 'ready' && !x.group && !x.board && x.r && !x.r.empty && x.owner === 'coates'); return c ? {k: c.key, u: c.uid} : null; });
    let P6 = {pu: PU};
    if (PU) {
      await scrollTo(card(PU.k, PU.u)); await p.click(card(PU.k, PU.u) + ' button[data-lamp1238="gone"]');
      await p.waitForSelector('#collection996', {timeout: 15000}).catch(() => {});
      P6.form = await p.evaluate(() => { const f = document.getElementById('collection996'); if (!f) return null; let modal = false; try { modal = f.matches(':modal') || !!f.closest('dialog:modal'); } catch (e) {} return {modal, checked: [...f.querySelectorAll('input[type=checkbox]')].filter(x => x.checked).length}; });
      const a0 = await asked();
      await p.evaluate(() => { const f = document.getElementById('collection996'); f.querySelector('[name=collection-date]').value = todayIso(); f.querySelector('[name=collection-time]').value = '00:05:00'; f.querySelector('button[type=submit]').click(); });
      await p.waitForTimeout(1500);
      P6 = Object.assign(P6, await p.evaluate(k => { const c = __cap.filter(x => x.name === 'delivery/' + k).pop(), v = c && c.value || {}, h = (v.history || []).filter(x => x && x.collection996).pop(); return {by: h ? h.by : null, at: h ? h.collection996.departedAt1211 : null, form: !!document.getElementById('collection996'), flash: (document.getElementById('flash') || {}).textContent || ''}; }, PU.k), {asked: (await asked()) - a0});
    }
    check('v12.42.4: Picked up with no name: the departure form asks for the name on Confirm and records the pick-up in it', P6.pu && P6.by === 'Lee Example' && P6.asked === 1 && !P6.form, P6);

    const sent = await p.evaluate(() => __cap.map(c => c.name));
    check('every write captured in the page (' + sent.length + ' delivery documents), nothing reached the network, no page errors', sent.length > 0 && sent.every(n => /^delivery\//.test(n)) && !h.counts.blocked && !h.errors.length, {sent, counts: h.counts, errors: h.errors.slice(0, 5)});
  } catch (e) { check('the test ran to the end', false, String(e && e.stack || e).slice(0, 1200)); }
  finally { await h.browser.close(); }
  const passed = checks.filter(c => c.ok).length; console.log('\n' + passed + '/' + checks.length + ' passed');
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({passed, total: checks.length, mobile, counts: h.counts, errors: h.errors}, null, 1));
})();
