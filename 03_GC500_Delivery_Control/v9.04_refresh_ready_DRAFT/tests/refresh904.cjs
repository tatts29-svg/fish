// Author: Andrew Fisher. Synthetic GET-only startup, delayed state and warm refresh regression.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const {chromium} = require('playwright');
const PAGE = process.env.PAGE, OUT = process.env.OUT || '/tmp/gc500-refresh904';
if (!PAGE) throw Error('Set PAGE to the complete candidate');
fs.mkdirSync(OUT, {recursive:true});
const HOST = 'https://gc500-production.up.railway.app';
const html = fs.readFileSync(PAGE, 'utf8');
const results = [];
const snapshot = marker => ({version:904, docs:{descs:{P55:{_k:'P55',v:marker}}}});
async function run(browser, name, width, hash, warm, mode='delay') {
 const context = await browser.newContext({viewport:{width,height:900}, isMobile:width<600, locale:'en-AU', timezoneId:'Australia/Brisbane', reducedMotion:'reduce'});
 const errors=[], writes=[]; let respond = null, pending = null, stateCalls=0, useSuccess=false;
 await context.addInitScript(({warm}) => {
  localStorage.removeItem('gc500.edit');
  if (warm && !sessionStorage.getItem('seeded904')) { localStorage.setItem('gc500.assets.v1', JSON.stringify({descs:{P55:'STALE_REFRESH904'},operator:'Synthetic tester'})); sessionStorage.setItem('seeded904','1'); }
 }, {warm});
 await context.route('**/*', async route => {
  const req=route.request(), url=new URL(req.url());
  if (req.method()!=='GET') { writes.push(req.method()+' '+url.pathname); return route.abort(); }
  if (url.pathname.startsWith('/v/')) return route.fulfill({status:200,contentType:'text/html',body:html});
  if (url.pathname==='/api/version') return route.fulfill({json:{version:904,level:'view'}});
  if (url.pathname==='/api/state') {
   stateCalls++;
   if (mode==='failure'&&!useSuccess) return route.fulfill({status:503,json:{error:'Synthetic unavailable'}});
   if (mode==='delay'&&!useSuccess) { pending=route; await new Promise(resolve=>respond=resolve); }
   return route.fulfill({json:snapshot('CURRENT_REFRESH904')});
  }
  if (url.pathname==='/api/files') return route.fulfill({json:{files:[]}});
  if (url.pathname.startsWith('/api/')) return route.fulfill({json:{}});
  return route.fulfill({status:404,body:''});
 });
 const page=await context.newPage(); page.on('pageerror',e=>{errors.push(e.message);console.error(name,e.message);});
 await page.goto(HOST+'/v/Coates-GC500-2026'+hash,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GC500Refresh904);
 if (mode==='failure') {
  await page.waitForFunction(()=>document.documentElement.dataset.refresh904==='saved');
  assert.match(await page.locator('#refresh904').innerText(),/current record not confirmed/);
  assert.equal(await page.locator('.app > main > .pane.on').isVisible(),true);
  useSuccess=true; await page.locator('[data-refresh904-retry]').click();
 } else {
  await page.waitForFunction(()=>SYNC.level==='view');
  const early=await page.evaluate(()=>({state:GC500Refresh904.report(),panes:[...document.querySelectorAll('.pane')].some(x=>x.getClientRects().length>0),drawer:getComputedStyle(document.getElementById('drawer')).display, header:!!document.querySelector('header.top')?.getBoundingClientRect().height, busy:document.querySelector('.app > main').getAttribute('aria-busy')}));
  assert.equal(early.state.state,'loading'); assert.equal(early.panes,false); assert.equal(early.drawer,'none'); assert.equal(early.header,true); assert.equal(early.busy,'true');
  await page.screenshot({path:path.join(OUT,name+'-loading.png')});
  // A single collection/live flag is not readiness.
  await page.evaluate(()=>{SYNC.status='live'; SYNC.first.add('delivery'); GC500Refresh904.update();});
  assert.equal(await page.evaluate(()=>GC500Refresh904.report().state),'loading');
  await page.evaluate(()=>{SYNC.first.clear(); SYNC.status='connecting';});
  while (!respond) await page.waitForTimeout(20);
  useSuccess=true; respond();
 }
 await page.waitForFunction(()=>GC500Refresh904.report().settled,{timeout:20000});
 const final=await page.evaluate(()=>({r:GC500Refresh904.report(),desc:S.descs.P55,hash:location.hash,first:SYNC.first.size,total:Object.keys(SYNC_COLLS).length,busy:document.querySelector('.app > main').getAttribute('aria-busy'),overflow:document.documentElement.scrollWidth>innerWidth}));
 assert.equal(final.r.state,'ready'); assert.equal(final.desc,'CURRENT_REFRESH904'); assert.equal(final.first,final.total); assert.equal(final.busy,'false'); assert.equal(final.overflow,false); assert.equal(final.hash,hash);
 if (hash.startsWith('#asset/')) { assert.equal(await page.locator('#drawer').isVisible(),true); assert.match(await page.locator('#drawer').innerText(),/CURRENT_REFRESH904/); assert.doesNotMatch(await page.locator('#drawer').innerText(),/STALE_REFRESH904/); }
 // Normal polling and an unrelated redraw never re-block a ready page.
 await page.evaluate(()=>{SYNC.status='connecting';syncFooter();render();});
 assert.equal(await page.evaluate(()=>GC500Refresh904.report().state),'ready');
 await page.screenshot({path:path.join(OUT,name+'-ready.png')});
 // A warm refresh must go back through readiness even though a complete cache exists.
 if (warm && mode==='delay') {
  useSuccess=false; respond=null; pending=null;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.GC500Refresh904&&SYNC.level==='view');
  assert.equal(await page.evaluate(()=>GC500Refresh904.report().state),'loading');
  assert.equal(await page.locator('.app > main > .pane.on').isVisible(),false);
  while (!respond) await page.waitForTimeout(20);
  useSuccess=true; respond();
  await page.waitForFunction(()=>GC500Refresh904.report().settled);
 }
 assert.deepEqual(errors,[]); assert.deepEqual(writes,[]);
 results.push({name,width,warm,mode,stateCalls,passed:true,errors,writes});
 await context.close();
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  await run(browser,'laptop-fresh',1440,'#today',false);
  await run(browser,'phone-warm',390,'#today',true);
  await run(browser,'laptop-asset-warm',1440,'#asset/P55',true);
  await run(browser,'phone-offline-retry',390,'#day/2026-10-07',true,'failure');
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({passed:true,results},null,2));
  console.log(JSON.stringify({passed:true,cases:results.length,results}));
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
