const {open} = require('./lh2'); const OUT = '/tmp/claude-0/stage4/shots/';
const PAGE = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/GC500_Delivery_Control_hosted_v695.html';
(async () => { const mob = process.env.PHONE === '1'; const res = {};
  const s = await open({pageFile: PAGE, hash: '#day/2026-09-28', gl: false, mobile: mob, W: mob ? 390 : 1440, H: mob ? 844 : 1100, dpr: mob ? 2 : 1}); const p = s.page;
  await p.waitForTimeout(12000);
  res.today = await p.evaluate(() => todayIso());
  res.window = await p.evaluate(() => { const out = {}; for (const d of programmeDays().filter(x => x.iso >= '2026-09-26' && x.iso <= '2026-10-10')) out[d.iso] = psPrefilled(d); return out; });
  // also what the rule would do on other days of the week
  res.rule = await p.evaluate(() => { const r = {}; ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].forEach(i => r[i + ' (' + ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][psDow(i)] + ')'] = psBatchOf(i)); return r; });
  res.card = await p.evaluate(() => { const c = document.querySelector('.pscard'); return c ? c.innerText.slice(0, 2500) : null; });
  const el = await p.$('.pscard'); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await el.screenshot({path: OUT + 'ps695' + (mob ? '_phone' : '') + '_card.png'}); }
  // a day further out says when it will be prefilled
  await p.evaluate(() => { location.hash = '#day/2026-10-01'; }); await p.waitForTimeout(4000); res.later = await p.evaluate(() => (document.querySelector('.psnote') || {}).innerText || null);
  // print view
  await p.evaluate(() => { location.hash = '#day/2026-09-28'; }); await p.waitForTimeout(4000);
  await p.evaluate(() => { window.print = () => {}; prestartPrint('2026-09-28'); }); await p.waitForTimeout(1500);
  await p.emulateMedia({media: 'print'}); await p.pdf ? null : null;
  res.printOk = await p.evaluate(() => !!document.querySelector('#dayprint .psprint'));
  await p.screenshot({path: OUT + 'ps695' + (mob ? '_phone' : '') + '_print.png', fullPage: false});
  res.errors = s.errors; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
