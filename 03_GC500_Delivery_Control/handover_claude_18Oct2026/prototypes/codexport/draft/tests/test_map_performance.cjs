/* Author: Andrew Fisher. Read-only map responsiveness and navigation regression.
 * PAGE=... MOB=1 node test_map_performance.cjs
 * Optional private artifacts: GC500_PRIVATE_SCREENSHOT=/absolute/private/map.png
 * Optional performance gates: GC500_MAX_IDLE_LONGTASK_MS / GC500_MAX_FRAME_GAP_MS.
 * Do not run concurrently with other browser sweeps. No records or prices are exported.
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {open} = require('../../toolchain/harness/open_page.js');
const pageFile = process.env.PAGE || process.argv[2];
if (!pageFile) throw new Error('Set PAGE to the candidate HTML file');
const mobile = /^(1|true|yes)$/i.test(process.env.MOB || '');
const report = {device:mobile ? 'phone' : 'desktop', checks:[], scripts:[], idle:null};
function check(value, message) { assert.ok(value, message); report.checks.push(message); }

async function mapFrame(page) {
  await page.waitForSelector('#expFrame', {state:'attached', timeout:60000});
  const element = await page.$('#expFrame'), frame = await element.contentFrame();
  if (!frame) throw new Error('Map iframe is not available');
  await frame.waitForFunction(() => window.GC500Explorer && window.GC500Explorer.state.ready &&
    window.__ready, null, {timeout:120000});
  await frame.evaluate(() => window.GC500Explorer.ready);
  return frame;
}
async function settled(frame) {
  await frame.waitForFunction(() => !interacting && !zAnim && !flingRAF && !gotoAnim887 && !rotAnim,
    null, {timeout:30000});
}
async function position(frame) {
  return frame.evaluate(() => {
    const api = window.GC500Explorer, state = api.state;
    return {zoom:state.zoom, corners:state.view.corners,
      selected:window.__marksCount ? window.__marksCount().selected : window.GC500MapCompletion1009.state.selected};
  });
}
function samePosition(a, b) {
  return a.selected === b.selected && Math.abs(a.zoom - b.zoom) < 1e-8 &&
    a.corners.length === b.corners.length && a.corners.every((p,i) =>
      Math.abs(p.x - b.corners[i].x) < 1e-7 && Math.abs(p.y - b.corners[i].y) < 1e-7);
}

(async () => {
  let session;
  try {
    session = await open({pageFile, hash:'#today', mobile, W:mobile ? 390 : 1440,
      H:mobile ? 844 : 900, dpr:mobile ? 2 : 1, gl:true});
    const page = session.page;
    await page.waitForFunction(() => typeof go === 'function' && typeof todayWorkHealth840 === 'function' &&
      todayWorkHealth840().ready, null, {timeout:120000});
    await page.evaluate(() => go('map'));
    const frame = await mapFrame(page);
    report.scripts = await frame.evaluate(() => [...document.scripts].filter(s => s.src).map(s => {
      const url = new URL(s.src); return {file:url.pathname.split('/').pop(), version:url.searchParams.get('v')};
    }));
    check(report.scripts.some(s => s.file === 'explorer.js' && s.version), 'Current versioned explorer script captured');
    const reference = await frame.evaluate(() => ITEMS.find(it => it.cat && it.cat.host === 'trade' &&
      it.places && it.places.length && !(it.reg && it.reg.sourceRequest1017))?.code || null);
    check(!!reference, 'An available mapped reference can be tested');
    check(await frame.evaluate(code => window.GC500Explorer.find(code), reference), 'Reference selection succeeds');
    await settled(frame);
    const selected = await position(frame);
    check(selected.selected === reference, 'Selected reference is retained by the map');
    await frame.evaluate(() => {
      const api = window.GC500Explorer; api.zoom(Math.min(640, api.state.zoom * 1.15));
    });
    await settled(frame);
    await frame.evaluate(() => {
      const api = window.GC500Explorer, v = api.state.view;
      api.goto([v.x + v.w * .07, v.y + v.h * .04, v.x + v.w * 1.07, v.y + v.h * 1.04], 'Map responsiveness check');
    });
    await settled(frame);
    const before = await position(frame);
    check(before.selected === reference && !samePosition(selected, before), 'Zoom and pan move the view without losing selection');
    await page.evaluate(() => { for (let i = 0; i < 16; i++) syncFooter(); });
    await page.waitForTimeout(250);
    check(samePosition(before, await position(frame)), 'Repeated sync-footer refresh preserves camera and selection');

    // Observe both documents: same-origin child tasks can stall the parent's event loop too.
    await page.evaluate(() => {
      window.__mapPerfLongTasks = [];
      window.__mapPerfObserver = new PerformanceObserver(list => {
        window.__mapPerfLongTasks.push(...list.getEntries().map(e => e.duration));
      });
      window.__mapPerfObserver.observe({type:'longtask'});
    });
    const cadence = await frame.evaluate(() => new Promise(resolve => {
      const gaps = [], duration = 8000, start = performance.now(); let last = null;
      function tick(now) {
        if (last !== null) gaps.push(now - last); last = now;
        if (now - start < duration) { requestAnimationFrame(tick); return; }
        const sorted = gaps.slice().sort((a,b) => a - b);
        resolve({elapsedMs:now - start, frames:gaps.length,
          maxGapMs:Math.max(0,...gaps), p95GapMs:sorted[Math.floor((sorted.length - 1) * .95)] || 0,
          gapsOver50Ms:gaps.filter(n => n > 50).length});
      }
      requestAnimationFrame(tick);
    }));
    const longtasks = await page.evaluate(() => {
      window.__mapPerfObserver.disconnect();
      const tasks = window.__mapPerfLongTasks;
      delete window.__mapPerfObserver; delete window.__mapPerfLongTasks;
      return {count:tasks.length, totalMs:tasks.reduce((a,b) => a + b,0), maxMs:Math.max(0,...tasks)};
    });
    report.idle = {cadence, longtasks};
    check(cadence.frames > 0 && cadence.elapsedMs >= 8000, 'Eight-second map cadence and long-task sample completed');
    check(samePosition(before, await position(frame)), 'Background status polls preserve camera and selection');
    for (const [name,value,metric] of [
      ['GC500_MAX_IDLE_LONGTASK_MS', longtasks.totalMs, 'Idle long-task budget'],
      ['GC500_MAX_FRAME_GAP_MS', cadence.maxGapMs, 'Map frame-gap budget']
    ]) if (process.env[name]) {
      const budget = Number(process.env[name]);
      check(Number.isFinite(budget) && budget >= 0 && value <= budget, metric);
    }

    const canPreserve = await page.evaluate(() => typeof document.body.moveBefore === 'function');
    await page.evaluate(() => go('today'));
    if (canPreserve) {
      check(await page.evaluate(() => !!EXP.frame && EXP.frame.parentElement.id === 'expPark'), 'Leaving the map parks the existing frame');
      check(await frame.evaluate(() => !window.GC500Explorer.shown()), 'Parked map reports itself hidden');
      await page.waitForTimeout(500);
      const parked = await frame.evaluate(() => window.GC500Explorer.state.perf.frames);
      await page.waitForTimeout(1000);
      check(parked === await frame.evaluate(() => window.GC500Explorer.state.perf.frames), 'Parked map stops drawing');
    }
    await page.evaluate(() => go('map'));
    const returned = await mapFrame(page);
    await settled(returned);
    if (canPreserve) check(returned === frame && samePosition(before, await position(returned)),
      'Returning from Today preserves the same map, camera and selection');
    else check(await returned.evaluate(() => window.GC500Explorer.shown()), 'Fallback browser reloads a usable map');

    if (process.env.GC500_PRIVATE_SCREENSHOT) {
      if (!path.isAbsolute(process.env.GC500_PRIVATE_SCREENSHOT)) throw new Error('Private screenshot destination must be absolute');
      await page.screenshot({path:process.env.GC500_PRIVATE_SCREENSHOT});
    }
    check(session.errors.length === 0, 'No page errors');
    check(session.counts.blocked === 0, 'No attempted record writes');
    console.log(JSON.stringify(report, null, 2));
  } finally { if (session) await session.browser.close(); }
})().catch(error => { console.error('FAIL map performance: ' + error.message); process.exitCode = 1; });
