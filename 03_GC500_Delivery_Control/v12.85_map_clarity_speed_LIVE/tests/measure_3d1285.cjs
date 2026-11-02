/* Author: Andrew Fisher. Read-only actual 3D loading/return check.
   Run under /tmp/gc500-browser.lock. VARIANT=base or candidate; OUT and BASE
   are private directories. This uses software WebGL and the shared curl harness,
   so elapsed times describe this environment, not guaranteed device latency. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const OUT=path.resolve(process.env.OUT||''),BASE=path.resolve(process.env.BASE||'');
assert(process.env.OUT&&process.env.BASE,'OUT and BASE required');
assert(!OUT.startsWith(path.resolve(__dirname,'../../..')+path.sep),'Private OUT required');
const variant=process.env.VARIANT||'base';assert(['base','candidate'].includes(variant));
const candidate=path.resolve(process.env.CANDIDATE||path.join(BASE,'../candidate'));
fs.mkdirSync(OUT,{recursive:true});process.env.GC500_CACHE=fs.mkdtempSync(path.join(OUT,'fetch-'));
const {chromium}=require('playwright'),{curlFetch}=require('../../toolchain/harness/curlfetch');
const HOST='https://gc500-production.up.railway.app',PUBLIC=HOST+'/v/Coates-GC500-2026',MACHINE='/w/Coates-GC500-2026/';
const rels=['explorer/index.html','explorer/explorer.js','explorer/explorer-merge.js','poc3d/index.html'];
const inputs=Object.fromEntries(rels.map(rel=>[rel,fs.readFileSync(path.join(variant==='candidate'&&rel==='poc3d/index.html'?candidate:BASE,rel))]));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=e=>String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key]').slice(0,300);
const result={author:'Andrew Fisher',variant,checkedAt:new Date().toISOString(),inputs:Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,sha(v)])),errors:[],consoleErrors:[],recordWrites:0,providerRootRequests:0,providerFailures:[],limits:'Software WebGL, shared curl transport, one cold sample. No capture-year or universal latency claim.'};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Brisbane'});
  await ctx.addInitScript(()=>{localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');});
  await ctx.route('**/*',async route=>{
   const q=route.request(),u=new URL(q.url());
   if(u.protocol==='data:'||u.protocol==='blob:')return route.continue();
   const session=q.method()==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession';
   if(q.method()!=='GET'&&!session){result.recordWrites++;return route.abort();}
   if(u.origin===HOST&&/^\/v\/Coates-GC500-2026\/?$/.test(u.pathname))return route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(path.join(BASE,'page.html'))});
   if(u.origin===HOST&&u.pathname.startsWith(MACHINE)){
    const rel=u.pathname.slice(MACHINE.length);
    if(inputs[rel])return route.fulfill({status:200,contentType:rel.endsWith('.html')?'text/html':'text/javascript',headers:{'cache-control':'no-store'},body:inputs[rel]});
   }
   if(u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/3dtiles/root.json')result.providerRootRequests++;
   try{
    const r=await curlFetch(q.url(),q.headers(),q.method(),q.postData());
    if(r.status>=400&&/googleapis|jsdelivr/.test(u.hostname))result.providerFailures.push({host:u.hostname,path:u.pathname,status:r.status});
    return await route.fulfill(r);
   }catch(_){try{return await route.abort();}catch(__){}}
  });
  const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(safe(e)));p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(safe(m.text()));});
  await p.goto(PUBLIC+'#map',{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>typeof go==='function',null,{timeout:20000});await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>{const w=document.getElementById('expFrame')?.contentWindow;return w?.__ready&&typeof w.GC500Explorer?.mode3d==='function';},null,{timeout:30000});
  const explorer=p.frames().find(f=>new URL(f.url()).pathname===MACHINE+'explorer/index.html');assert(explorer);
  assert.equal(result.providerRootRequests,0,'3D must not open before an explicit press');
  const t=Date.now();await explorer.evaluate(()=>GC500Explorer.mode3d(true));
  await explorer.waitForFunction(()=>document.getElementById('model3d')?.contentWindow?.GC500_3D?.state?.ready,null,{timeout:60000});
  result.readyAfterPressMs=Date.now()-t;
  const model=p.frames().find(f=>new URL(f.url()).pathname===MACHINE+'poc3d/index.html');assert(model);
  try{await model.waitForFunction(()=>GC500_3D.state.loaded&&GC500_3D.state.perf.firstFull>0&&GC500_3D.state.perf.tilesLoaded>0,null,{timeout:45000});result.visibleViewLoaded=true;}catch(_){result.visibleViewLoaded=false;}
  result.fullAfterPressMs=Date.now()-t;
  result.state=await model.evaluate(()=>GC500_3D.state);
  result.prerequisites=await model.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/Cesium\.js|\/api\/map-key|\/v1\/3dtiles\/root\.json/.test(e.name)).map(e=>({kind:e.name.includes('Cesium.js')?'library':e.name.includes('/api/map-key')?'access':'3d-root',startMs:Math.round(e.startTime),endMs:Math.round(e.responseEnd),durationMs:Math.round(e.duration)})));
  const lib=result.prerequisites.find(r=>r.kind==='library'),access=result.prerequisites.find(r=>r.kind==='access');
  result.accessOverlapsLibrary=!!(lib&&access&&access.startMs<lib.endMs);
  await p.screenshot({path:path.join(OUT,'3d-phone.png'),timeout:15000});
  await model.locator('#cesium canvas').first().screenshot({path:path.join(OUT,'3d-canvas.png'),timeout:15000});
  const roots=result.providerRootRequests;
  result.idleBefore=await model.evaluate(()=>GC500_3D.state.perf.frames);
  await explorer.evaluate(()=>GC500Explorer.mode3d(false));
  await p.waitForTimeout(1200);
  result.idleAfter=await model.evaluate(()=>GC500_3D.state.perf.frames);
  const back=Date.now();await explorer.evaluate(()=>GC500Explorer.mode3d(true));
  await model.waitForFunction(()=>GC500_3D.state.ready&&GC500_3D.state.loaded,null,{timeout:5000});
  result.returnReadyMs=Date.now()-back;result.returnUsedSameFrame=model===p.frames().find(f=>new URL(f.url()).pathname===MACHINE+'poc3d/index.html');
  result.returnOpenedNewProvider=result.providerRootRequests!==roots;
  result.passed=result.visibleViewLoaded&&result.returnUsedSameFrame&&!result.returnOpenedNewProvider&&result.errors.length===0&&result.consoleErrors.length===0&&result.recordWrites===0;
  if(variant==='candidate')assert(result.accessOverlapsLibrary,'Candidate access must overlap the viewer-library request');
 }catch(e){result.failure=safe(e);result.passed=false;}
 finally{fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(result,null,2)+'\n');await browser.close();}
 console.log(JSON.stringify({variant,passed:result.passed,readyAfterPressMs:result.readyAfterPressMs,fullAfterPressMs:result.fullAfterPressMs,visibleViewLoaded:result.visibleViewLoaded,accessOverlapsLibrary:result.accessOverlapsLibrary,returnReadyMs:result.returnReadyMs,hiddenRenderFrames:result.idleAfter-result.idleBefore,errors:result.errors.length,recordWrites:result.recordWrites,failure:result.failure}));
 if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(safe(e));process.exitCode=1;});
