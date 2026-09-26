// whole-page audit: every tab and pane, desktop + phone: errors, long tasks (freezes), time to open, overflow, broken images; maps: open, search, zoom
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const mode = process.argv[3] || 'desk';
  const vp = mode === 'phone' ? {width: 390, height: 844} : {width: 1280, height: 800};
  const ctx = await browser.newContext({viewport: vp, ignoreHTTPSErrors: true, hasTouch: mode === 'phone', isMobile: mode === 'phone'});
  await ctx.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({type: 'longtask', buffered: true}); } catch (e) {} });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 220)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  page.on('response', r => { if (r.status() >= 400 && !/favicon|api\/weather/.test(r.url())) errs.push('HTTP ' + r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)); });
  const t0 = Date.now(); await page.goto(process.argv[2], {waitUntil: 'load', timeout: 180000});
  const loadMs = Date.now() - t0; await page.waitForTimeout(3000);
  const lt = () => page.evaluate(() => { const a = window.__lt.slice(); window.__lt.length = 0; return a; });
  console.log(mode, 'load', loadMs, 'ms; long tasks during load', JSON.stringify((await lt()).map(x => x[1]).sort((a, b) => b - a).slice(0, 8)));
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#tabs [data-tab]')].map(b => b.dataset.tab));
  const report = [];
  for (const t of tabs) {
    const before = errs.length; await lt();
    const ms = await page.evaluate(async t => { const s = performance.now(); const b = document.querySelector(`#tabs [data-tab="${t}"]`); b.click(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return Math.round(performance.now() - s); }, t);
    await page.waitForTimeout(2500);
    const info = await page.evaluate(t => { const pane = document.querySelector('#pane-' + t) || document.querySelector('.pane.active, section.active');
      const imgs = [...(pane || document).querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src') && !i.getAttribute('src').startsWith('data:,'));
      const over = document.documentElement.scrollWidth > innerWidth + 2;
      const wide = over ? [...(pane || document).querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 4 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 4).map(e => e.tagName + '.' + String(e.className).slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().right)) : [];
      const empty = pane ? pane.innerText.trim().length : -1;
      return {broken: imgs.slice(0, 3).map(i => i.getAttribute('src').slice(0, 60)), overflow: over, wide, text: empty}; }, t);
    const longs = (await lt()).map(x => x[1]);
    report.push({tab: t, clickToPaint: ms, longTasks: longs.length, worst: longs.length ? Math.max(...longs) : 0, total: longs.reduce((a, b) => a + b, 0), ...info, errors: errs.slice(before)});
    await page.screenshot({path: `audit/${mode}_${t}.png`, timeout: 120000}).catch(() => {});
  }
  for (const r of report) console.log(mode, JSON.stringify(r));
  // the search box
  { await lt(); const q = await page.$('#q'); const qv = q && await q.isVisible(); if (q && !qv) console.log(mode, 'search box hidden on this width'); if (q && qv) { const s = Date.now(); await q.fill('P12'); await page.waitForTimeout(600); const hits = await page.evaluate(() => { const box = document.querySelector('#qResults, .qres, [role="listbox"]'); return box ? box.innerText.split('\n').slice(0, 4) : null; });
      const longs = (await lt()).map(x => x[1]); console.log(mode, 'search', JSON.stringify({ms: Date.now() - s, hits, longTasks: longs, errors: errs.slice(-3)})); await page.screenshot({path: `audit/${mode}_search.png`}).catch(() => {}); await q.fill(''); } }
  console.log(mode, 'ALL ERRORS', JSON.stringify([...new Set(errs)].slice(0, 30), null, 1));
  await browser.close(); })();
