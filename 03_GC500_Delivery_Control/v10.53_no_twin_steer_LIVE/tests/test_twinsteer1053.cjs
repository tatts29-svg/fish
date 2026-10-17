// Author: Andrew Fisher. v10.53 no twin-steer trucks. GET-only against the live record; no write reaches the service.
//   node test_twinsteer1053.cjs path/to/page.html [shotdir]
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2], shots = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
async function load(mob, hash){ const h = await open(Object.assign({pageFile: page, hash: hash || ''}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {}));
 await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
 await h.page.waitForTimeout(3500); return h; }
async function tick(p, name){ await p.waitForSelector('#ts1053', {timeout: 5000}); const dis0 = await p.$eval('[data-ts1053-go]', b => b.disabled); await p.check('#ts1053c'); await p.fill('#ts1053n', name || 'Andrew Fisher'); const dis1 = await p.$eval('[data-ts1053-go]', b => b.disabled); await p.click('[data-ts1053-go]'); return {dis0, dis1}; }
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop'; const h = await load(mob, '#costs'); const p = h.page;
  try {
   const b = await p.evaluate(() => ({foot: document.getElementById('footL').textContent, banner: (document.getElementById('ts1053-banner') || {}).innerText || '', over: document.documentElement.scrollWidth > window.innerWidth + 1}));
   ok(/v10\.5[3-9]$/.test(b.foot), tag + ': footer v10.53 or later');
   ok(/NO TWIN-STEER TRUCKS/.test(b.banner) && /Esplanade/.test(b.banner) && /Macintosh Island Park/.test(b.banner), tag + ': red strip under the header: ' + b.banner);
   ok(!b.over, tag + ': no sideways scroll');
   // backstop: a print with no tick is refused and asks
   const r1 = await p.evaluate(() => { const n0 = ts1053.stats.real; let threw = false; try { window.print(); } catch (e) { threw = /twin-steer/.test(e.message); } return {threw, n: ts1053.stats.real - n0, modal: !!document.getElementById('ts1053'), armed: ts1053.armed()}; });
   ok(r1.threw && r1.n === 0 && r1.modal && !r1.armed, tag + ': window.print with no tick is refused and the tick comes up');
   const t1 = await tick(p); const r2 = await p.evaluate(() => { const n0 = ts1053.stats.real; window.print(); return {n: ts1053.stats.real - n0, armed: ts1053.armed()}; });
   ok(t1.dis0 && !t1.dis1, tag + ': Continue stays off until the box is ticked and a full name given');
   ok(r2.n === 1, tag + ': after the tick the print goes ahead');
   if (shots && mob) { await p.evaluate(() => { ts1053.disarm(); ts1053.ask(); }); await p.waitForTimeout(300); await p.screenshot({path: shots + '/tick_phone.png'}); await p.click('[data-ts1053-no]'); }
   // a print button: asked first, nothing starts until ticked
   await p.evaluate(() => ts1053.disarm());
   const has = await p.$('#printCosts');
   if (has) {
    const n0 = await p.evaluate(() => ts1053.stats.real);
    await p.evaluate(() => document.getElementById('printCosts').scrollIntoView()); await p.click('#printCosts', {force: true}); await p.waitForTimeout(400);
    const m1 = await p.evaluate(() => ({modal: !!document.getElementById('ts1053'), n: ts1053.stats.real}));
    ok(m1.modal && m1.n === n0, tag + ': Print costs asks for the tick first and prints nothing yet');
    await tick(p); await p.waitForTimeout(6000);
    const n1 = await p.evaluate(() => ts1053.stats.real); ok(n1 > n0, tag + ': after the tick Print costs prints (' + (n1 - n0) + ')');
   } else ok(false, tag + ': #printCosts not found');
   // Ctrl+P
   await p.evaluate(() => ts1053.disarm()); await p.keyboard.press('Control+KeyP'); await p.waitForTimeout(300);
   ok(await p.evaluate(() => !!document.getElementById('ts1053')), tag + ': Ctrl+P brings up the tick'); await p.click('[data-ts1053-no]');
   // the browser's own print: only the warning prints without the tick
   await p.evaluate(() => ts1053.disarm()); await p.emulateMedia({media: 'print'});
   const c1 = await p.evaluate(() => ({tabs: getComputedStyle(document.getElementById('tabs')).display, lock: getComputedStyle(document.getElementById('ts1053-lock')).display, strip: getComputedStyle(document.getElementById('ts1053-strip')).display}));
   await p.evaluate(() => ts1053.arm('Andrew Fisher'));
   const c2 = await p.evaluate(() => ({lock: getComputedStyle(document.getElementById('ts1053-lock')).display, strip: getComputedStyle(document.getElementById('ts1053-strip')).display, text: document.getElementById('ts1053-strip').textContent}));
   if (shots && !mob) await p.screenshot({path: shots + '/print_armed_desktop.png'});
   await p.evaluate(() => ts1053.disarm()); if (shots && !mob) await p.screenshot({path: shots + '/print_locked_desktop.png'});
   await p.emulateMedia({media: 'screen'});
   ok(c1.tabs === 'none' && c1.lock === 'block' && c1.strip === 'none', tag + ': printing from the browser without the tick shows only the warning ' + JSON.stringify(c1));
   ok(c2.lock === 'none' && c2.strip === 'block' && /Checked by Andrew Fisher/.test(c2.text), tag + ': ticked prints carry the rule down the edge with who and when');
   // the checklist, PDFs, texts, drawer
   const r3 = await p.evaluate(async () => {
    const out = {}; const C = checks826({}); out.first = C[0] && C[0].id;
    ts1053.disarm(); checkDialog826(() => ({warnings: [], report: [], scope: [1], iso: todayIso(), checks: checks826({}), mode: 'drivers'}), () => 'x', () => {}, false);
    const dlg = document.getElementById('drv782'); out.dlg = !!dlg && /NO TWIN-STEER/.test(dlg.innerText);
    if (dlg) { dlg.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = true; c.dispatchEvent(new Event('change')); }); const nm = dlg.querySelector('#drv782n'); nm.value = 'Andrew Fisher'; nm.dispatchEvent(new Event('input')); dlg.querySelector('.b-go').click(); }
    out.armedByChecklist = ts1053.armed(); ts1053.disarm();
    const lib = await pdf7Lib(); const doc = new lib.jsPDF(); doc.text('test', 10, 10); try { doc.output('blob'); out.pdfRefused = false; } catch (e) { out.pdfRefused = /twin-steer/.test(e.message); }
    const md = document.getElementById('ts1053'); if (md) md.remove();
    ts1053.arm('Andrew Fisher'); const doc2 = new lib.jsPDF(); doc2.text('test', 10, 10); const blob = doc2.output('blob'); out.pdfOk = blob && blob.size > 0; out.pdfStamped = doc2.internal.pages.flat().join('\n').indexOf('TWIN-STEER') >= 0; ts1053.disarm();
    out.sms = (dropSmsLong(assetOf('P05')) || '').indexOf('NO TWIN-STEER') >= 0;
    openAsset('P05'); return out; });
   await p.waitForTimeout(900);
   const dr = await p.evaluate(() => !!document.querySelector('#drawer .ts1053-drawer'));
   ok(r3.first === 'twin-steer-1053' && r3.dlg, tag + ': the pre-dispatch checklist has the twin-steer box first');
   ok(r3.armedByChecklist, tag + ': ticking the checklist covers the print that follows (no second ask)');
   ok(r3.pdfRefused, tag + ': a PDF is refused until ticked');
   ok(r3.pdfOk && r3.pdfStamped, tag + ': a ticked PDF carries the rule on its pages');
   ok(r3.sms, tag + ': the driver text ends with the rule');
   ok(dr, tag + ': the drawer carries the rule');
   ok(h.errors.length === 0, tag + ': no page errors ' + h.errors.slice(0, 3).join(' | '));
  } finally { await h.browser.close(); }
 }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
