/* Author: Andrew Fisher.
 * Read-only, repeatable Map Explorer loading/rendering probe. All record writes
 * are blocked. Provider createSession is allowed solely for the unmodified
 * baseline. Private OUT required. Timings include the shared curl proxy harness
 * and software-rendered Chromium; they are comparative observations, not an SLA.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const OUT=process.env.OUT, BASE=process.env.BASE, CANDIDATE=process.env.CANDIDATE||BASE;
assert(OUT&&BASE,'OUT and BASE required');
assert(!path.resolve(OUT).startsWith(path.resolve(__dirname,'../../..')+'/'),'Use private evidence outside Git');
fs.mkdirSync(OUT,{recursive:true,mode:0o700});process.env.GC500_CACHE=fs.mkdtempSync(path.join(OUT,'fetch-cache-'));
const {chromium}=require('playwright'),{curlFetch}=require('../../toolchain/harness/curlfetch');
const HOST='https://gc500-production.up.railway.app',ROOT=HOST+'/w/Coates-GC500-2026/',URL_MAP=ROOT+'explorer/index.html#satellite';
const MOBILE=process.env.MOB==='1',FORCE=process.env.FORCE_MAPBOX==='1';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sanitise=e=>String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL omitted]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key omitted]').slice(0,220);
const measureInit=()=>{
 window.__bench1285={longTasks:[],firstTileMs:null,coveredMs:null,sharpMs:null,moveBefore:typeof Element.prototype.moveBefore==='function'};
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.__bench1285.longTasks.push({start:e.startTime,ms:e.duration});}).observe({type:'longtask',buffered:true});}catch(_){}
 const tick=()=>{try{const b=window.__bench1285,f=window.__frames?.at(-1),hasTile=typeof tiles!=='undefined'&&[...tiles.values()].some(t=>t.bm);if(hasTile&&b.firstTileMs===null)b.firstTileMs=performance.now();if(f?.mode==='satellite'&&f.ready&&hasTile){if(f.satBlank===0&&b.coveredMs===null)b.coveredMs=performance.now();if(f.satBlank===0&&f.satMiss===0&&!f.inter&&b.sharpMs===null)b.sharpMs=performance.now();}}catch(_){};if(!window.__bench1285.sharpMs)setTimeout(tick,25);};setTimeout(tick,0);
};
const summary=async(p,since=0)=>p.evaluate(since=>{
 const frames=(window.__frames||[]).filter(f=>f.t>=since),nums=frames.map(f=>f.ms).filter(Number.isFinite).sort((a,b)=>a-b),percent=x=>nums.length?nums[Math.min(nums.length-1,Math.floor(nums.length*x))]:null;
 return{actionElapsedMs:since?performance.now()-since:null,provider:SOURCE,mode,ready:!!window.__ready,view:GC500Explorer.state.view,dpr,canvas:[canvas.width,canvas.height],loadedTiles:[...tiles.values()].filter(t=>t.bm).length,lastFrame:frames.at(-1)||window.__frames?.at(-1)||null,frames:nums.length,frameMsMedian:percent(.5),frameMsP95:percent(.95),frameMsMax:nums.at(-1)||null,longTasks:window.__bench1285.longTasks.filter(x=>x.start>=since),sourceLabel:document.getElementById('sourceProvider813')?.textContent||'',captureDate:'not certified',modeControls:[...document.querySelectorAll('.modes button')].map(b=>b.dataset.mode)};
},since);
const settle=async(p,after=0)=>p.waitForFunction(after=>{const f=window.__frames?.at(-1);return window.__ready&&f?.t>after&&f.mode==='satellite'&&f.ready&&f.satBlank===0&&f.satMiss===0&&!f.inter&&[...tiles.values()].some(t=>t.bm);},after,{timeout:40000});
(async()=>{
 const result={author:'Andrew Fisher',checkedAt:new Date().toISOString(),mobile:MOBILE,forcedMapboxBaseline:FORCE,inputHashes:{},runs:{},errors:[],consoleErrors:[],recordWrites:0,providerSessionPosts:0,requests:0,networkFailures:0,httpErrors:[],limits:'Single observations through the shared curl proxy. Cold uses fresh curl cache/browser context. Warm refresh reuses fetch cache and browser storage; native HTTP cache is not directly measured. Chromium software rendering is not a physical phone GPU. No capture-year certification.'};
 for(const rel of ['explorer/index.html','explorer/explorer.js','explorer/explorer-merge.js','poc3d/index.html']){const f=path.join(CANDIDATE,rel),fallback=path.join(BASE,rel),raw=fs.readFileSync(fs.existsSync(f)?f:fallback);result.inputHashes[rel]=sha(raw);}
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
  const ctx=await browser.newContext({viewport:MOBILE?{width:390,height:844}:{width:1440,height:1000},deviceScaleFactor:MOBILE?2:1,isMobile:MOBILE,hasTouch:MOBILE,locale:'en-AU',timezoneId:'Australia/Brisbane'});
  await ctx.addInitScript(measureInit);
  await ctx.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());if(/^(blob:|data:)/.test(req.url()))return route.continue();
   const sess=req.method()==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession';
   if(req.method()!=='GET'&&!sess){result.recordWrites++;return route.abort();}if(sess)result.providerSessionPosts++;result.requests++;
   try{
    let response;
    if(u.href.startsWith(ROOT)){const rel=decodeURIComponent(u.pathname.split('/w/Coates-GC500-2026/')[1]),candidate=path.join(CANDIDATE,rel),base=path.join(BASE,rel),use=fs.existsSync(candidate)?candidate:fs.existsSync(base)?base:null;if(use&&fs.statSync(use).isFile())response={status:200,headers:{'content-type':rel.endsWith('.html')?'text/html':'text/javascript','cache-control':'no-cache'},body:fs.readFileSync(use)};}
    if(!response)response=await curlFetch(req.url(),req.headers(),req.method(),req.postData());
    if(FORCE&&u.origin===HOST&&u.pathname==='/api/map-key'&&response.status===200){const j=JSON.parse(response.body.toString());delete j.google;response={...response,body:Buffer.from(JSON.stringify(j))};}
    if(response.status>=400)result.httpErrors.push({origin:u.origin,path:u.pathname,status:response.status});
    return await route.fulfill(response);
   }catch(_){result.networkFailures++;try{return await route.abort();}catch(_){}}
  });
  const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(sanitise(e)));p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(sanitise(m.text()));});
  for(const run of ['cold','warm-refresh']){
   const started=Date.now();if(run==='cold')await p.goto(URL_MAP,{waitUntil:'domcontentloaded',timeout:45000});else await p.reload({waitUntil:'domcontentloaded',timeout:45000});
   await p.waitForFunction(()=>window.__ready&&window.GC500Explorer&&typeof GC500Explorer.mode3d==='function',null,{timeout:45000});
   await settle(p);await p.waitForFunction(()=>window.__bench1285.sharpMs!==null,null,{timeout:5000});
   result.runs[run]={...(await p.evaluate(()=>window.__bench1285)),...await summary(p),externalElapsedMs:Date.now()-started};
   if(run==='cold')await p.screenshot({path:path.join(OUT,'satellite-wide.png')});
  }
  const start=await p.evaluate(()=>performance.now());
  const stage=p.locator('#stage'),box=await stage.boundingBox();assert(box,'Map stage must exist');
  await p.mouse.move(box.x+box.width*.50,box.y+box.height*.55);await p.mouse.down();
  for(let n=1;n<=24;n++){await p.mouse.move(box.x+box.width*.50+n*3,box.y+box.height*.55+n*.6);await p.waitForTimeout(8);}
  await p.mouse.up();await settle(p,start);result.runs.pan=await summary(p,start);
  const zStart=await p.evaluate(()=>{const t=performance.now();GC500Explorer.zoom(2.5);return t;});await settle(p,zStart);result.runs.zoom=await summary(p,zStart);
  await p.screenshot({path:path.join(OUT,'satellite-detail.png')});
  const modeStart=await p.evaluate(()=>{const t=performance.now();GC500Explorer.setMode('original');return t;});
  await p.waitForFunction(()=>GC500Explorer.state.mode==='original'&&window.__frames?.at(-1)?.mode==='original',null,{timeout:15000});
  result.originalModeRetained=true;await p.evaluate(()=>{GC500Explorer.setMode('satellite');GC500Explorer.fit(false,false);});await settle(p,modeStart);result.runs.returnFromPlan=await summary(p,modeStart);
  assert.equal(result.recordWrites,0);assert.equal(result.errors.length,0);assert.equal(result.consoleErrors.length,0);assert.equal(result.networkFailures,0);
  for(const k of ['original','hybrid','satellite','3d'])assert(result.runs.cold.modeControls.includes(k),'Missing map mode '+k);
  for(const [rel,expected] of Object.entries(result.inputHashes)){const a=path.join(CANDIDATE,rel),b=path.join(BASE,rel);assert.equal(sha(fs.readFileSync(fs.existsSync(a)?a:b)),expected,'Candidate changed during measurements: '+rel);}
  result.pass=true;
 }catch(e){result.pass=false;result.failure=sanitise(e);}
 finally{await browser.close();fs.writeFileSync(path.join(OUT,'measurements.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});}
 console.log(JSON.stringify({pass:result.pass,mobile:MOBILE,forcedMapboxBaseline:FORCE,loads:Object.fromEntries(Object.entries(result.runs).filter(([k])=>k==='cold'||k==='warm-refresh').map(([k,v])=>[k,{firstTileMs:v.firstTileMs,coveredMs:v.coveredMs,sharpMs:v.sharpMs,provider:v.provider}])),pan:result.runs.pan&&{p95:result.runs.pan.frameMsP95,max:result.runs.pan.frameMsMax},zoom:result.runs.zoom&&{p95:result.runs.zoom.frameMsP95,max:result.runs.zoom.frameMsMax},errors:result.errors.length,consoleErrors:result.consoleErrors.length,writes:result.recordWrites,failure:result.failure}));
 if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(JSON.stringify({pass:false,failure:sanitise(e)}));process.exitCode=1;});
