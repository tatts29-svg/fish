// maps: every sheet opens (time, long tasks, picture loaded, markers), wheel zoom smoothness (frame gaps), pinch-style
// button zoom, search -> "takes you there, ringed", Show on map from Plant, Plan on satellite and 3D proof open
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const mode = process.argv[3] || 'desk';
  const ctx = await browser.newContext({viewport: mode === 'phone' ? {width: 390, height: 844} : {width: 1280, height: 800}, isMobile: mode === 'phone', hasTouch: mode === 'phone', ignoreHTTPSErrors: true});
  await ctx.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({type: 'longtask', buffered: true}); } catch (e) {} });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 220)));
  page.on('console', m => { if (m.type() === 'error' && !/503/.test(m.text())) errs.push('console ' + m.text().slice(0, 200)); });
  page.on('response', r => { if (r.status() >= 400 && !/favicon|api\/weather/.test(r.url())) errs.push('HTTP ' + r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)); });
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  const lt = () => page.evaluate(() => window.__lt.splice(0));
  await page.evaluate(() => go('map')); await page.waitForTimeout(1500); await lt();
  const sheets = await page.evaluate(() => [...document.querySelectorAll('#pane-map [data-sheet]')].map(b => b.dataset.sheet));
  for (const s of sheets) {
    const r = await page.evaluate(async s => { const t0 = performance.now(); document.querySelector(`#pane-map [data-sheet="${s}"]`).click();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const paint = performance.now() - t0;
      const im = document.querySelector('#inner img'); const t1 = performance.now();
      while (im && !im.complete && performance.now() - t1 < 15000) await new Promise(r => setTimeout(r, 50));
      return {s, paint: Math.round(paint), imgMs: Math.round(performance.now() - t0), img: im ? (im.naturalWidth + 'x' + im.naturalHeight) : 'none', mks: document.querySelectorAll('#pane-map .mk').length, on: state.sheet}; }, s);
    await page.waitForTimeout(400); r.lt = await lt(); console.log(mode, 'sheet', JSON.stringify(r));
  }
  // wheel zoom on the stage, frames measured
  await page.evaluate(() => document.querySelector('#pane-map [data-sheet="D022"]').click()); await page.waitForTimeout(1500); await lt();
  await page.evaluate(() => document.querySelector('#stage').scrollIntoView({block: 'center'})); await page.waitForTimeout(400);
  const st = await page.$('#stage'); const bb = await st.boundingBox();
  await page.mouse.move(bb.x + bb.width * .6, bb.y + bb.height * .5);
  await page.evaluate(() => { window.__fr = []; let last = performance.now(); const f = t => { window.__fr.push(t - last); last = t; if (window.__fr.length < 400) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(40); }
  await page.waitForTimeout(600);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(40); }
  await page.waitForTimeout(600);
  // drag to pan
  await page.mouse.down(); for (let i = 0; i < 12; i++) await page.mouse.move(bb.x + bb.width * .6 - i * 20, bb.y + bb.height * .5 - i * 6); await page.mouse.up();
  await page.waitForTimeout(400);
  const zoom = await page.evaluate(() => { const g = window.__fr.slice(2).filter(Boolean); g.sort((a, b) => b - a); return {z: +(state.zoom || 1).toFixed(2), frames: g.length, worstFrames: g.slice(0, 5).map(Math.round), over50: g.filter(x => x > 50).length}; });
  console.log(mode, 'zoom', JSON.stringify(zoom), 'lt', JSON.stringify(await lt()));
  // search -> the map callout
  const qv = await page.evaluate(() => { const q = document.querySelector('#q'); return !!(q && q.offsetParent); });
  if (qv) {
    const t0 = Date.now(); await page.fill('#q', 'callout 033'); await page.waitForTimeout(700);
    const hits = await page.evaluate(() => [...document.querySelectorAll('#finder [role=option], #finder button')].slice(0, 5).map(b => b.innerText.replace(/\s+/g, ' ').slice(0, 80)));
    const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('#finder [role=option], #finder button')].find(x => /callout/i.test(x.innerText)); if (!b) return false; b.click(); return true; });
    await page.waitForTimeout(1500);
    const found = await page.evaluate(() => { const ring = document.querySelector('#mkfound'); const r = ring && ring.getBoundingClientRect(); const st = document.querySelector('#stage').getBoundingClientRect();
      return {tab: state.tab, found: state.found && state.found.label, zoom: +(state.zoom || 0).toFixed(2), ring: !!(ring && r.width), ringInStage: !!(r && r.left >= st.left - 5 && r.right <= st.right + 5 && r.top >= st.top - 5 && r.bottom <= st.bottom + 5), flash: (document.querySelector('.flash, #flash, .toast') || {}).innerText || ''}; });
    console.log(mode, 'search', JSON.stringify({ms: Date.now() - t0, hits, clicked, found, lt: await lt()}));
  } else console.log(mode, 'search box not shown at this width');
  // Show on map from Plant (the drawer / row map button)
  await page.evaluate(() => go('plant')); await page.waitForTimeout(1500);
  const som = await page.evaluate(async () => { openAsset('P12'); await new Promise(r => setTimeout(r, 1200)); const b = document.querySelector('#drawer [data-map], #drawer [data-locate], #drawer [data-onmap]') || [...document.querySelectorAll('#drawer button, #drawer a')].find(x => /on the map|show on map/i.test(x.innerText)); if (!b) return 'no map button in drawer: ' + [...document.querySelectorAll('#drawer button')].map(x => x.innerText.trim().slice(0, 20)).slice(0, 20).join(' / '); const k = b.dataset.map || 'P12'; b.click();
    await new Promise(r => setTimeout(r, 1500)); const ring = document.querySelector('#mkfound'); return {k, tab: state.tab, found: state.found && (state.found.key || state.found.label), ring: !!(ring && ring.getBoundingClientRect().width), zoom: state.zoom}; });
  console.log(mode, 'showOnMap', JSON.stringify(som), 'lt', JSON.stringify(await lt()));
  // Plan on satellite and 3D proof
  for (const m of (process.argv[4] ? process.argv[4].split(",") : [])) {
    await page.evaluate(() => go('map')); await page.waitForTimeout(800); await lt();
    const t0 = Date.now(); await page.evaluate(m => document.querySelector(`#pane-map [data-mopen="${m}"]`).click(), m);
    await page.waitForTimeout(6000);
    const r = await page.evaluate(() => { const f = document.querySelector('iframe'); const ov = document.querySelector('.machine, #machine, [class*=machine]'); return {iframe: f ? f.src.replace(/^https?:\/\/[^/]+/, '').slice(0, 80) : null, open: !!(ov && ov.offsetParent), title: document.title}; });
    await page.screenshot({path: `audit/map_${mode}_${m}.png`}).catch(() => {});
    console.log(mode, 'mopen', m, JSON.stringify(r), Date.now() - t0, 'ms lt', JSON.stringify(await lt()));
    await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  }
  console.log(mode, 'ERRORS', JSON.stringify([...new Set(errs)], null, 1));
  await browser.close(); })();
