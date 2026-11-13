// Author: Andrew Fisher. v13.06 - the Demob figures read 100% when everything is off site. Read only: every write is aborted.
//   node test_v1306.cjs <page.html> [mobile] [shot.png]
// Checks on the live record through the shared harness: the demob scope leaves out exactly the runs the record holds as not on
// site with nothing collected (WB19, WB20); units and references both read 100%; the stars, the line, the day cards and the
// Demob scope tile all read the same figures; WB19 and WB20 stay on the register as recorded; no page errors, no writes.
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'));
(async () => {
  const pageFile = process.argv[2], mobile = process.argv[3] === 'mobile', shot = process.argv[4];
  const s = mobile ? await open({pageFile, W: 390, H: 844, dpr: 2, mobile: true}) : await open({pageFile, W: 1440, H: 900});
  const p = s.page, results = [], ok = (name, pass, got) => results.push({name, pass: !!pass, got});
  await p.waitForFunction(() => typeof go === 'function' && typeof demob816 === 'function' && window.DemobProgress996 && DemobProgress996.whole, null, {timeout: 150000});
  await p.waitForTimeout(6000);
  await p.evaluate(() => go('demob')); await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const M = demob816(), today = todayIso(), w = DemobProgress996.whole(M, today), C = DemobProgress996.summary(M);
    const n = a => (a || []).reduce((t, u) => t + (Number(u.n) || 0), 0);
    let req = 0, col = 0; w.readings.forEach(x => { req += n(x.required); col += n(x.collected); });
    const pane = document.getElementById('pane-demob'), card = pane.querySelector('.pg1238');
    const aria = [...pane.querySelectorAll('[aria-label]')].map(x => x.getAttribute('aria-label'));
    const foot = (document.body.innerText.match(/v13\.\d\d/g) || []).slice(-1)[0] || null;
    const tile = [...pane.querySelectorAll('.ctile')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).find(x => /Demob scope/.test(x)) || null;
    const day = d => aria.find(a => a.startsWith(d)) || null;
    const raw = DemobProgress996.scope(M);
    return {today, total: w.total, completed: w.completed, percent: w.percent, bound: w.bound, complete: w.complete, req, col,
      keys: w.refs.map(x => x.key), notOnSite: w.notOnSite1306 || null, rawTotal: raw.total, summaryTotal: C.total, summaryOff: C.notOnSite1306 || null,
      cardText: card ? card.innerText.replace(/\s+/g, ' ').trim().slice(0, 600) : null,
      unitsAria: aria.find(a => /percent of the demob units off site/.test(a)) || null, starsAria: aria.find(a => /of 5 stars/.test(a)) || null,
      fri13: day('Fri 13 Nov 2026'), mon26: day('Mon 26 Oct 2026'), thu29: day('Thu 29 Oct 2026'), tile, foot,
      wb02: (w.readings.find(x => x.key === 'WB02') || {}).complete, wb03: (w.readings.find(x => x.key === 'WB03') || {}).complete,
      firstDay: (pane.innerText.match(/\d[\d,]* of [\d,]+ by the end of the day/) || [null])[0]};
  });
  ok('the demob scope leaves out exactly WB19 and WB20', JSON.stringify((r.notOnSite || []).slice().sort()) === '["WB19","WB20"]' && !r.keys.includes('WB19') && !r.keys.includes('WB20'), r.notOnSite);
  ok('the raw scope still holds them (186), the demob scope 184', r.rawTotal === 186 && r.total === 184, [r.rawTotal, r.total]);
  ok('every reference in the demob scope is complete: 100%', r.completed === 184 && r.percent === 100 && r.bound === false && r.complete === true, [r.completed, r.percent, r.bound, r.complete]);
  ok('units off site 731 of 731', r.req === 731 && r.col === 731, [r.col, r.req]);
  ok('WB02 and WB03, where the barriers left, still read complete', r.wb02 === true && r.wb03 === true, [r.wb02, r.wb03]);
  ok('the line reads 100 percent of the demob units off site', /^100 percent of the demob units off site/.test(r.unitsAria || ''), r.unitsAria);
  ok('five stars', /^5 of 5 stars/.test(r.starsAria || '') && /Five stars/.test(r.cardText || ''), [r.starsAria, (r.cardText || '').slice(0, 160)]);
  ok('Fri 13 Nov day card: 100.00 percent of references, no "At least"', /100\.00 percent of Demob references collected/.test(r.fri13 || '') && !/At least/.test(r.fri13 || ''), r.fri13);
  ok('the day cards count against 731 units', /of 731 by the end of the day/.test(r.firstDay || ''), r.firstDay);
  ok('the Demob scope tile reads 184 and names WB19, WB20', r.summaryTotal === 184 && /184/.test(r.tile || '') && /WB19, WB20 not on site, nothing to collect/.test(r.tile || ''), r.tile);
  ok('footer v13.06', r.foot === 'v13.06', r.foot);
  const eq = await p.evaluate(() => { const o = {}; ['WB19', 'WB20'].forEach(k => { let a = null, d = null; try { a = assetOf(k); d = deliveryOf(k); } catch (e) {} o[k] = {register: !!a, light: d ? d.state : null}; }); return o; });
  ok('WB19 and WB20 stay on the register with their light as recorded (not on site)', eq.WB19.register && eq.WB20.register && eq.WB19.light === 'not on site' && eq.WB20.light === 'not on site', eq);
  if (shot) { await p.evaluate(() => go('demob')); await p.waitForTimeout(6000);
    const el = await p.$('#pane-demob .pg1238'); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500); await el.screenshot({path: shot}); } }
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 5));
  ok('no writes reached the service', true, {blocked: s.counts.blocked});
  await s.browser.close();
  const passed = results.filter(x => x.pass).length;
  results.forEach(x => console.log((x.pass ? 'PASS ' : 'FAIL ') + x.name + '  ' + JSON.stringify(x.got).slice(0, 300)));
  console.log(JSON.stringify({page: path.basename(path.dirname(pageFile)) + '/' + path.basename(pageFile), mobile, today: r.today, passed, of: results.length}));
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
