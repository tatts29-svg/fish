/* Author: Andrew Fisher. Focused post-restoration public-byte and phone UI probe.
 * OUT must be private. No candidate overrides. Run only after the owner confirms
 * restoration is live. GETs read the actual service; only the map provider's
 * createSession POST is permitted. Operational writes are always blocked.
 * No imagery capture-year certification is made by this check. */
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
const EXPECTED='3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b';
const FILES={
 'explorer/explorer-merge.js':['7c276bb181541e506e983356fb746cd4233c77c6c973c178c7da27d458ad66c4',32311],
 'explorer/explorer.js':['e175ec073b2d30c89c075f5bfe6ab823385c8f23cd50d07fa13ef10b5e2e6b5a',170853],
 'explorer/index.html':['91e0ae84b59235c963eeb93ff79e9263844b333565b6b7c3726a62a918fd6d20',28813],
 'poc3d/index.html':['f8403834a1336ce15e9e296f46413bbf3dfd132bc5011a02a49813340c694efb',46200]
};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const safeError=e=>({name:String(e?.name||'Error'),message:String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL omitted]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key omitted]').replace(/\b(?:key|token|access_token|session)=[^\s&"'<>]+/gi,'[parameter omitted]').slice(0,300)});
(async()=>{
 const result={author:'Andrew Fisher',checkedAt:new Date().toISOString(),passed:false,pageSha256:null,childHashes:{},ui:{},provider:{satellite:'not checked',threeD:'not checked'},errors:[],consoleErrors:[],recordWrites:0,providerSessionPosts:0,requests:0,source:'actual public service; fresh browser and fetch cache',captureYear:'not verified by this restoration check'};
 const headers={'Cache-Control':'no-store'},nonce=Date.now();
 const page=await curlFetch(PUBLIC+'?restore-readback='+nonce,headers,'GET');
 assert.equal(page.status,200);assert.equal(sha(page.body),EXPECTED,'Public parent is not the approved predecessor');
 result.pageSha256=sha(page.body);fs.writeFileSync(path.join(out,'served-page.html'),page.body);
 await Promise.all(Object.entries(FILES).map(async([rel,[hash,bytes]])=>{
  const r=await curlFetch(MACHINE+rel+'?restore-readback='+nonce,headers,'GET');
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
   try{return await route.fulfill(await curlFetch(url,request.headers(),request.method(),request.postData()));}catch(_){return route.abort();}
  });
  const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(safeError(e)));p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(safeError(m.text()));});
  const started=Date.now(),budget=Number(process.env.UI_BUDGET_MS)||60000,remaining=max=>Math.max(1000,Math.min(max,budget-(Date.now()-started)));
  await p.goto(PUBLIC+'?restore-ui='+nonce+'#map',{waitUntil:'domcontentloaded',timeout:remaining(40000)});
  await p.waitForFunction(()=>typeof go==='function'&&typeof expFrame==='function',null,{timeout:remaining(25000)});
  await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>{const f=document.getElementById('expFrame');return f?.contentWindow?.GC500Explorer&&f.contentWindow.__ready;},null,{timeout:remaining(20000)});
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
  result.ui.satellite=await child.evaluate(()=>({mode:GC500Explorer.state.mode,lastFrame:window.__frames?.at(-1)||null,quality:document.getElementById('qual')?.textContent||'',loadedTiles:[...tiles.values()].filter(t=>t.bm).length}));
  await p.screenshot({path:path.join(out,'restored-satellite-phone.png'),timeout:10000});
  await child.evaluate(()=>GC500Explorer.mode3d(true));
  assert.equal(await child.evaluate(()=>GC500Explorer.is3d()),true);
  await child.waitForSelector('#model3d',{state:'attached',timeout:remaining(5000)});
  result.ui.threeDEntry=await child.evaluate(()=>{const f=document.getElementById('model3d');const u=new URL(f.src);return{path:u.pathname,originalEntry:u.pathname.endsWith('/poc3d/index.html'),shown:getComputedStyle(f).display!=='none'};});
  assert(result.ui.threeDEntry.originalEntry&&result.ui.threeDEntry.shown,'Restored 3D iframe is not the original visible entry');
  try{
   await child.waitForFunction(()=>{const w=document.getElementById('model3d')?.contentWindow;return w?.GC500_3D?.state?.ready&&w.GC500_3D.state.perf?.tilesLoaded>0;},null,{timeout:remaining(20000)});
   result.provider.threeD='ready with imagery tiles loaded';
  }catch(_){result.provider.threeD='entry restored; provider/graphics not ready within the probe window';}
  result.ui.threeD=await child.evaluate(()=>{const w=document.getElementById('model3d')?.contentWindow;return{ready:!!w?.GC500_3D?.state?.ready,bootError:w?.__bootError||null,tilesLoaded:w?.GC500_3D?.state?.perf?.tilesLoaded||0};});
  await p.screenshot({path:path.join(out,'restored-3d-phone.png'),timeout:10000});
  result.elapsedUiMs=Date.now()-started;
  assert.equal(result.recordWrites,0,'Operational write attempted');
  result.passed=result.errors.length===0&&result.consoleErrors.length===0&&result.provider.satellite==='rendered'&&result.provider.threeD==='ready with imagery tiles loaded';
 }catch(e){result.failure=safeError(e);}
 finally{
  fs.writeFileSync(path.join(out,'live-restoration.json'),JSON.stringify(result,null,2)+'\n');
  await browser.close();
 }
 console.log(JSON.stringify({passed:result.passed,pageSha256:result.pageSha256,restoredChildren:Object.keys(result.childHashes).length,provider:result.provider,errors:result.errors.length,consoleErrors:result.consoleErrors.length,recordWrites:result.recordWrites,elapsedUiMs:result.elapsedUiMs||null,failure:result.failure?.name||null}));
 if(result.failure)process.exitCode=1;
})().catch(e=>{console.error(JSON.stringify({failed:true,error:safeError(e)}));process.exitCode=1;});
