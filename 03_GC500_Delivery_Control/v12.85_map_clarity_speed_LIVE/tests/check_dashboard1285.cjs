/* Author: Andrew Fisher. Exact paired map integration and optional live read-back.
 * Candidate mode binds local reviewed files; LIVE=1 reads actual public bytes.
 * All operational writes are blocked. Google map access remains for explicit3D;
 * Mapbox2D must render without a Google2D session. Evidence stays private. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const out=path.resolve(process.env.OUT||'');
assert(process.env.OUT,'OUT must name a private evidence folder');
assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'Evidence must stay outside the repository');
fs.mkdirSync(out,{recursive:true});
process.env.GC500_CACHE=fs.mkdtempSync(path.join(out,'fresh-fetch-'));
for(const key of ['PAGE','GC500_MEDIA_BASE','MEDIA','MEDIA893','MEDIA889','ATLAS896'])delete process.env[key];
const {chromium}=require('playwright');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const HOST='https://gc500-production.up.railway.app',PUBLIC=HOST+'/v/Coates-GC500-2026',MACHINE=HOST+'/w/Coates-GC500-2026/';
const EXPECTED='be38bdbeffbf82adbb6a6f51b03bba66a1184dd3618b3d0c5504fdb6f7ca196a';
const LIVE=process.env.LIVE==='1';
assert(process.env.EVIDENCE,'EVIDENCE must identify the source-bound candidate');
const bound=JSON.parse(fs.readFileSync(process.env.EVIDENCE,'utf8'));
const FILES=Object.fromEntries(Object.entries(bound.files).map(([k,v])=>[k,[v.sha256,v.bytes]]));
assert.equal(Object.keys(FILES).length,4,'Expected all four reviewed map files');
const CANDIDATE=process.env.CANDIDATE;
const PAGE_CANDIDATE=process.env.PAGE_CANDIDATE;
if(!LIVE)assert(CANDIDATE&&PAGE_CANDIDATE,'Candidate integration needs paired local inputs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const safeError=e=>({name:String(e?.name||'Error'),message:String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL omitted]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key omitted]').replace(/\b(?:key|token|access_token|session)=[^\s&"'<>]+/gi,'[parameter omitted]').slice(0,300)});
(async()=>{
 const result={author:'Andrew Fisher',checkedAt:new Date().toISOString(),passed:false,pageSha256:null,childHashes:{},ui:{},provider:{satellite:'not checked',threeD:'not checked'},errors:[],consoleErrors:[],recordWrites:0,providerSessionPosts:0,requests:0,suite:'dashboard1285',source:LIVE?'actual public service; fresh browser and fetch cache':'paired exact local dashboard/map candidate; live read-only data',captureYear:'not verified by this restoration check'};
 const headers={'Cache-Control':'no-store'},nonce=Date.now();
 const page=LIVE?await curlFetch(PUBLIC+'?map1285-readback='+nonce,headers,'GET'):{status:200,body:fs.readFileSync(PAGE_CANDIDATE)};
 assert.equal(page.status,200);assert.equal(sha(page.body),EXPECTED,'Public parent is not the approved predecessor');
 result.pageSha256=sha(page.body);result.dashboardSha256=result.pageSha256;result.machineFiles=Object.fromEntries(Object.entries(FILES).map(([k,v])=>[k,v[0]]));fs.writeFileSync(path.join(out,'served-page.html'),page.body);
 await Promise.all(Object.entries(FILES).map(async([rel,[hash,bytes]])=>{
  const r=LIVE?await curlFetch(MACHINE+rel+'?map1285-readback='+nonce,headers,'GET'):{status:200,body:fs.readFileSync(path.join(CANDIDATE,rel))};
  assert.equal(r.status,200);assert.equal(sha(r.body),hash,rel+' public hash');assert.equal(r.body.length,bytes,rel+' public size');result.childHashes[rel]=hash;
 }));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Brisbane'});
  await ctx.addInitScript(()=>{localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');});
  await ctx.route('**/*',async route=>{
   const request=route.request(),url=request.url();if(/^(blob:|data:)/.test(url))return route.continue();
   result.requests++;const u=new URL(url),session=request.method()==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession';
   if(request.method()!=='GET'&&!session){result.recordWrites++;return route.abort();}
   if(session)result.providerSessionPosts++;
   if(!LIVE&&request.method()==='GET'){
    if(u.origin===HOST&&u.pathname.replace(/\/$/,'')==='/v/Coates-GC500-2026')return route.fulfill({status:200,headers:{'content-type':'text/html; charset=utf-8'},body:fs.readFileSync(PAGE_CANDIDATE)});
    const rel=url.startsWith(MACHINE)?u.pathname.slice(new URL(MACHINE).pathname.length):'';
    if(FILES[rel])return route.fulfill({status:200,headers:{'content-type':rel.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8'},body:fs.readFileSync(path.join(CANDIDATE,rel))});
   }
   try{return await route.fulfill(await curlFetch(url,request.headers(),request.method(),request.postData()));}catch(_){try{return await route.abort();}catch(__){return;}}
  });
  const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(safeError(e)));p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(safeError(m.text()));});
  const started=Date.now(),budget=Number(process.env.UI_BUDGET_MS)||120000,remaining=max=>Math.max(1000,Math.min(max,budget-(Date.now()-started)));
  await p.goto(PUBLIC+'?restore-ui='+nonce+'#map',{waitUntil:'domcontentloaded',timeout:remaining(40000)});
  await p.waitForFunction(()=>typeof go==='function'&&typeof expFrame==='function',null,{timeout:remaining(25000)});
  await p.evaluate(()=>go('map'));
  // explorer-merge starts on its separate 120 ms readiness loop after the core
  // marks __ready. Wait for that module's API and real button before assertions.
  await p.waitForFunction(()=>{const w=document.getElementById('expFrame')?.contentWindow;return w?.GC500Explorer&&w.__ready&&typeof w.GC500Explorer.mode3d==='function'&&typeof w.GC500Explorer.is3d==='function'&&w.document.querySelector('.modes [data-mode="3d"]');},null,{timeout:remaining(20000)});
  result.ui=await p.evaluate(()=>{const w=document.getElementById('expFrame').contentWindow,g=w.GC500Explorer;return{parentOptions:[...document.querySelectorAll('.map1188 select option')].map(x=>x.value),modes:[...w.document.querySelectorAll('.modes [data-mode]')].map(x=>x.dataset.mode),mode:g.state.mode,mode3dCallable:typeof g.mode3d==='function',setModeCallable:typeof g.setMode==='function',parent3dCallable:typeof expOpen3d==='function'};});
  for(const view of ['plan','sat'])assert(result.ui.parentOptions.includes(view),'Missing restored parent view '+view);
  for(const mode of ['original','hybrid','satellite','3d'])assert(result.ui.modes.includes(mode),'Missing restored control '+mode);
  assert(result.ui.mode3dCallable&&result.ui.setModeCallable&&result.ui.parent3dCallable);
  const child=p.frames().find(f=>f.url().startsWith(MACHINE+'explorer/'));assert(child,'Actual public Explorer child missing');
  await child.evaluate(()=>{GC500Explorer.setMode('hybrid');});
  assert.equal(await child.evaluate(()=>GC500Explorer.state.mode),'hybrid');
  await child.evaluate(()=>{GC500Explorer.setMode('satellite');GC500Explorer.fit();});
  assert.equal(await child.evaluate(()=>GC500Explorer.state.mode),'satellite');
  try{
   await child.waitForFunction(()=>{const f=window.__frames?.at(-1);return f?.mode==='satellite'&&f.ready&&f.satBlank===0&&satCanFetch()&&[...tiles.values()].some(t=>t.bm);},null,{timeout:remaining(20000)});
   result.provider.satellite='rendered';
  }catch(_){result.provider.satellite='not fully rendered within the probe window';}
  result.ui.satellite=await child.evaluate(()=>({source:SOURCE,mode:GC500Explorer.state.mode,lastFrame:window.__frames?.at(-1)||null,quality:document.getElementById('qual')?.textContent||'',loadedTiles:[...tiles.values()].filter(t=>t.bm).length}));
  assert.equal(result.ui.satellite.source,'mapbox','Approved source must remain Mapbox');
  await p.screenshot({path:path.join(out,'satellite-phone.png'),timeout:10000});
  await child.evaluate(()=>GC500Explorer.mode3d(true));
  assert.equal(await child.evaluate(()=>GC500Explorer.is3d()),true);
  await child.waitForSelector('#model3d',{state:'attached',timeout:remaining(5000)});
  result.ui.threeDEntry=await child.evaluate(()=>{const f=document.getElementById('model3d');const u=new URL(f.src);return{path:u.pathname,originalEntry:u.pathname.endsWith('/poc3d/index.html'),shown:getComputedStyle(f).display!=='none'};});
  assert(result.ui.threeDEntry.originalEntry&&result.ui.threeDEntry.shown,'Restored 3D iframe is not the original visible entry');
  try{
   await child.waitForFunction(()=>{const w=document.getElementById('model3d')?.contentWindow,s=w?.GC500_3D?.state;return s?.ready&&s.loaded&&s.perf?.firstFull>0&&s.perf?.tilesLoaded>0;},null,{timeout:remaining(45000)});
   result.provider.threeD='ready with visible-view tiles loaded';
  }catch(_){result.provider.threeD='entry restored; provider/graphics not ready within the probe window';}
  result.ui.threeD=await child.evaluate(()=>{const w=document.getElementById('model3d')?.contentWindow,s=w?.GC500_3D?.state;return{ready:!!s?.ready,bootError:w?.__bootError||null,tilesLoaded:s?.perf?.tilesLoaded||0,firstFullMs:s?.perf?.firstFull||null,visibleViewLoaded:!!s?.loaded};});
  await p.screenshot({path:path.join(out,'3d-phone.png'),timeout:10000});
  const modelFrame=p.frames().find(f=>f.url().startsWith(MACHINE+'poc3d/'));
  if(modelFrame){
   const canvas=modelFrame.locator('#cesium canvas').first();
   if(await canvas.count())await canvas.screenshot({path:path.join(out,'3d-canvas.png'),timeout:10000});
  }
  await child.evaluate(()=>{GC500Explorer.mode3d(false);window.__map1285Retained=true;});
  const revisitedAt=Date.now();
  await p.evaluate(()=>go('today'));
  await p.waitForTimeout(200);
  await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>document.getElementById('expFrame')?.contentWindow?.__map1285Retained===true,null,{timeout:remaining(10000)});
  result.ui.revisit={retainedFrame:true,elapsedMs:Date.now()-revisitedAt,includesAwayWaitMs:200};
  assert.equal(await child.evaluate(()=>GC500Explorer.state.mode),'satellite','Return retains satellite choice');
  assert.equal(await child.evaluate(()=>SOURCE),'mapbox','Return retains approved source');
  assert.equal(result.providerSessionPosts,0,'Google 2D sessions must not gate the approved Mapbox view');
  result.elapsedUiMs=Date.now()-started;
  assert.equal(result.recordWrites,0,'Operational write attempted');
  result.passed=result.errors.length===0&&result.consoleErrors.length===0&&result.provider.satellite==='rendered'&&result.provider.threeD==='ready with visible-view tiles loaded';
 }catch(e){result.failure=safeError(e);}
 finally{
  fs.writeFileSync(path.join(out,'dashboard-result.json'),JSON.stringify(result,null,2)+'\n');
  await browser.close();
 }
 console.log(JSON.stringify({passed:result.passed,pageSha256:result.pageSha256,restoredChildren:Object.keys(result.childHashes).length,provider:result.provider,errors:result.errors.length,consoleErrors:result.consoleErrors.length,recordWrites:result.recordWrites,elapsedUiMs:result.elapsedUiMs||null,failure:result.failure?.name||null}));
 if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(JSON.stringify({failed:true,error:safeError(e)}));process.exitCode=1;});
