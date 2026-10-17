/* Author: Andrew Fisher. v10.60.2 checks: the print check says what it still needs and fills in the full name.
   GET only (every write aborted).  PAGE=build/GC500_v10.60p2/GC500_Delivery_Control_hosted.html node test_gate1060p2.cjs  (MOB=1 for phone; LIVE=1 for the live page) */
'use strict';
const {open} = require('../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', mobile = process.env.MOB === '1';
let failed = 0, n = 0; const ok = (c, name, d) => { n++; if (!c) failed++; console.log((c ? 'PASS ' : 'FAIL ') + name + (c || d === undefined ? '' : ' :: ' + JSON.stringify(d).slice(0, 400))); };
(async () => {
 const h = await open({pageFile: live ? undefined : process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 900, dpr: mobile ? 2 : 1}); const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.ts1053, null, {timeout: 240000});
  const expectedPage = process.env.EXPECT_PAGE || 'v10.60.2';
  ok(await p.evaluate(v => document.body.innerText.includes(v), expectedPage), 'footer says ' + expectedPage);
  const state = () => p.evaluate(() => ({name: document.getElementById('ts1053n').value, dis: document.querySelector('[data-ts1053-go]').disabled, line: document.getElementById('ts1053w').textContent, need: document.getElementById('ts1053w').classList.contains('ts1053-need'), label: document.querySelector('.ts1053-nm').textContent}));
  // Andrew's screen: "Andrew" saved on the phone
  await p.evaluate(() => { localStorage.setItem('gc500.printedBy', 'Andrew'); ts1053.disarm(); ts1053.ask(); }); await p.waitForSelector('#ts1053');
  const a0 = await state();
  ok(a0.name === 'Andrew Fisher', 'a saved "Andrew" is filled in as "Andrew Fisher"', a0);
  ok(/first and last/.test(a0.label), 'the label asks for first and last name', a0.label);
  ok(a0.dis && /Tick the box/.test(a0.line), 'before the tick: button off and the line says tick the box', a0);
  await p.check('#ts1053c'); const a1 = await state();
  ok(!a1.dis && /Ready/.test(a1.line), 'ticked with the full name: button on and the line says Ready', a1);
  await p.fill('#ts1053n', 'Andrew'); const a2 = await state();
  ok(a2.dis && a2.need && /first and last name/.test(a2.line), 'ticked with only "Andrew": button off and the line says type first and last name, in red', a2);
  await p.fill('#ts1053n', 'Kyle Smith'); const a3 = await state(); ok(!a3.dis, 'any full name works', a3);
  await p.click('[data-ts1053-go]'); ok(await p.evaluate(() => ts1053.armed() && !document.getElementById('ts1053')), 'Tick done arms printing and closes the check');
  // someone else's short name is not changed into Andrew's
  await p.evaluate(() => { localStorage.setItem('gc500.printedBy', 'Kyle'); ts1053.disarm(); ts1053.ask(); }); await p.waitForSelector('#ts1053');
  const k0 = await state(); ok(k0.name === 'Kyle', 'another short name is left as typed (not turned into Andrew Fisher)', k0);
  await p.check('#ts1053c'); const k1 = await state(); ok(k1.dis && /first and last name/.test(k1.line), 'and the line tells them to add a surname', k1);
  if (mobile) await p.screenshot({path: process.env.OUT || __dirname + '/gate_phone_need_surname.png'});
  await p.click('[data-ts1053-no]');
  ok(h.errors.length === 0, 'no page errors', h.errors); ok(h.counts.blocked === 0, 'no writes attempted', h.counts);
 } catch (e) { ok(false, 'test ran to the end', String(e && e.stack || e).slice(0, 600)); }
 finally { console.log(failed ? 'FAILED ' + (n - failed) + '/' + n : 'ALL PASS ' + n + '/' + n); await h.browser.close(); process.exit(failed ? 1 : 0); }
})();
