/* Author: Andrew Fisher. Verify actual public bytes and the served phone UI; no candidate overrides or record writes. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const {chromium} = require('playwright');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const hash = b => require('crypto').createHash('sha256').update(b).digest('hex');
const host = 'https://gc500-production.up.railway.app', root = host + '/w/Coates-GC500-2026/';
const pageUrl = host + '/v/Coates-GC500-2026';
(async () => {
  const out = process.env.OUT, expectedPage = process.env.EXPECTED_PAGE_SHA;
  assert(out && expectedPage && process.env.MACHINE_EVIDENCE, 'Expected private output and exact release identities');
  const expected = JSON.parse(fs.readFileSync(process.env.MACHINE_EVIDENCE));
  const fetched = await curlFetch(pageUrl + '?readback1283=' + Date.now(), {'Cache-Control':'no-store'}, 'GET');
  assert.equal(fetched.status, 200); assert.equal(hash(fetched.body), expectedPage);
  fs.writeFileSync(path.join(out, 'served-page.html'), fetched.body);
  const served = {};
  for (const [rel, item] of Object.entries(expected.files)) {
    const r = await curlFetch(root + rel + '?readback1283=' + Date.now(), {'Cache-Control':'no-store'}, 'GET');
    assert.equal(r.status, 200); assert.equal(hash(r.body), item.sha256); assert.equal(r.body.length, item.bytes);
    served[rel] = hash(r.body);
  }
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH, args:['--no-sandbox']});
  try {
    const ctx = await browser.newContext({viewport:{width:390,height:844}, locale:'en-AU'});
    const errors = [], consoleErrors = [], requests = [], writes = [];
    await ctx.addInitScript(() => { localStorage.setItem('gc500.map1188','sat'); localStorage.setItem('gc500.explorer.mode','3d'); });
    await ctx.route('**/*', async route => {
      const r = route.request(), url = r.url();
      if (/^(blob:|data:)/.test(url)) return route.continue();
      requests.push(url);
      if (r.method() !== 'GET') { writes.push({method:r.method(),url}); return route.abort(); }
      try { return await route.fulfill(await curlFetch(url,r.headers(),'GET')); } catch (_) { return route.abort(); }
    });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if(m.type()==='error') consoleErrors.push(m.text()); });
    await p.goto(pageUrl + '?live1283=' + Date.now() + '#sheet/__satellite3d', {waitUntil:'domcontentloaded',timeout:180000});
    await p.waitForFunction(() => typeof go==='function' && window.Map1188, null, {timeout:120000});
    await p.evaluate(() => go('map'));
    await p.waitForFunction(() => { const f=document.getElementById('expFrame'); return f && f.contentWindow.__ready; }, null, {timeout:120000});
    await p.evaluate(async () => { const g=document.getElementById('expFrame').contentWindow.GC500Explorer; await g.ready; g.fit(); });
    await p.waitForTimeout(1800);
    const ui = await p.evaluate(() => {
      const w=document.getElementById('expFrame').contentWindow, g=w.GC500Explorer;
      return {sheet:state.sheet,view:Map1188.view,mode:g.state.mode,is3d:g.is3d(),
        options:[...document.querySelectorAll('.map1188 select option')].map(x=>x.value),
        modes:[...w.document.querySelectorAll('[data-mode]')].map(x=>x.dataset.mode),
        oldSurface:!!document.querySelector('#pane-map .s1141-map[data-s1141="map"]'),
        width:innerWidth,scrollWidth:document.documentElement.scrollWidth};
    });
    const child = p.frames().find(f => f.url().startsWith(root + 'explorer/'));
    assert(child, 'Served Explorer frame exists'); ui.issued = await child.evaluate(() => P.meta.issued);
    assert.equal(ui.sheet,'__explorer'); assert.equal(ui.view,'plan'); assert.equal(ui.mode,'original');
    assert.equal(ui.is3d,false); assert.equal(ui.issued,'2 Oct 2026'); assert.equal(ui.oldSurface,false);
    assert.deepEqual(ui.options,['plan']); assert.deepEqual(ui.modes,['original']); assert(ui.scrollWidth<=ui.width);
    assert.deepEqual(requests.filter(u=>/tile\.googleapis|api\/map-key|mapbox\.satellite|arcgisonline|\/underlay\/|sheet-overview|poc3d\/index/.test(u)),[]);
    assert.deepEqual(errors,[]); assert.deepEqual(consoleErrors,[]); assert.deepEqual(writes,[]);
    await p.screenshot({path:path.join(out,'live-phone.png')});
    fs.writeFileSync(path.join(out,'readback.json'),JSON.stringify({author:'Andrew Fisher',checkedAt:new Date().toISOString(),passed:true,pageSha256:hash(fetched.body),pageBytes:fetched.body.length,machineFiles:served,ui,errors,consoleErrors,recordWrites:writes.length,requestCount:requests.length},null,2));
    console.log(JSON.stringify({passed:true,pageSha256:hash(fetched.body),pageBytes:fetched.body.length,servedFiles:Object.keys(served).length,errors,consoleErrors,recordWrites:writes.length}));
  } finally { await browser.close(); }
})().catch(e=>{console.error('FAIL',e.message);process.exitCode=1;});
