// edit link: set one light on Plant and check every other page, the header pod and a second browser (the view link) agree
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const B = 'http://127.0.0.1:8814';
  const ed = await (await browser.newContext({viewport: {width: 1280, height: 800}})).newPage(); const errs = [];
  ed.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await ed.goto(B + '/e/edittokenedittoken1/', {waitUntil: 'load'}); await ed.waitForTimeout(3000);
  const counts = p => p.evaluate(() => holdAssets(() => { const t = todayIso(), P = progressAsOf(t).all, f = todayFigures();
    const txt = s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 160) : null; };
    return {onsite: P.onsite, norecord: P.norecord, pod: [f.due, f.onsite, f.notYet].join('/'), tabsDot: [...document.querySelectorAll('#tabs .dot, #tabs [data-att]')].length}; }));
  const before = await counts(ed);
  const key = await ed.evaluate(() => { const d = programmeDays().find(x => x.iso > todayIso() && x.deliveries.length); return d.deliveries.find(r => !deliveryOf(r.a.key).recorded).a.key; });
  await ed.evaluate(() => { const w = document.querySelector('#who'); if (w) w.value = 'Audit Test'; });
  await ed.evaluate(() => go('plant')); await ed.waitForTimeout(1500);
  // press the green lens on the row (scroll it in first - later rows fill in behind)
  const pressed = await ed.evaluate(k => { const b = document.querySelector(`#pane-plant [data-light="${k}"][data-s="on site"]`); if (!b) return 'no button'; b.click(); return 'ok'; }, key);
  await ed.waitForTimeout(1500);
  const after = await counts(ed);
  const views = {};
  for (const t of ['today', 'timeline', 'progress', 'map', 'plant']) { await ed.evaluate(t => go(t), t); await ed.waitForTimeout(1200);
    views[t] = await ed.evaluate(k => { const p = document.querySelector('#pane-' + document.querySelector('#tabs [aria-selected="true"]')?.dataset.tab) || document.querySelector('.pane.on');
      const hits = [...document.querySelectorAll('.pane.on [data-light="' + k + '"][aria-pressed="true"], .pane.on .dstat.green')].length;
      return {pane: p && p.id, greenHere: hits, text: (p.innerText.match(/(\d+)\s*(GREEN · )?ON SITE/i) || [])[0] || null}; }, key); }
  // a second browser on the view link sees it after the save syncs
  await ed.waitForTimeout(4000);
  const vw = await (await browser.newContext()).newPage(); await vw.goto(B + '/v/viewtokenviewtoken1/', {waitUntil: 'load'}); await vw.waitForTimeout(3500);
  const other = await vw.evaluate(k => { const d = deliveryOf(k); return {recorded: d.recorded, state: d.state, by: d.by}; }, key);
  console.log(JSON.stringify({key, pressed, before, after, views, other, errs}, null, 1));
  await browser.close(); })();
