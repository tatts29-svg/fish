// Author: Andrew Fisher. One fresh actual Explorer context per matched case; records are read-only.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1]};
const input=arg('--source'),dir=arg('--output'),mobile=process.argv.includes('--mobile'),demand=process.argv.includes('--demand'),demandOnly=process.argv.includes('--demand-only');
if(!input||!dir)throw Error('Usage: --source explorer.js --output private-directory [--mobile] [--demand]');
fs.mkdirSync(dir,{recursive:true});process.env.GC500_CACHE=path.join(dir,'curl-cache');
const ROOT=path.resolve(__dirname,'../../toolchain'),{curlFetch}=require(ROOT+'/harness/curlfetch'),{chromium,devices}=require('playwright');
const source=fs.readFileSync(input),live='/workspace/private-maps813/live-source',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={author:'Andrew Fisher',sourceSha256:sha(source),indexSha256:sha(fs.readFileSync(live+'/index.html')),mobile,started:new Date().toISOString(),requests:[],errors:[],blockedWrites:0,checks:[],limits:['Headless Chromium and curl transport on one host; not physical-device FPS.','Each case has a fresh browser context and separate empty disk cache; request bytes are received decoded payload sizes, not wire-compressed transport.','Only Google imagery createSession POST is permitted; operational service writes are blocked.']};
const check=(name,ok,detail)=>{report.checks.push({name,pass:!!ok,detail});if(!ok)throw Error(name)};
const save=()=>fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(report,null,2)+'\n');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({...mobile?devices['iPhone 13']:{},viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?2:1,locale:'en-AU',timezoneId:'Australia/Brisbane'});
 await context.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());if(['data:','blob:'].includes(url.protocol))return route.continue();const method=request.method(),start=Date.now();
  if(method!=='GET'&&!(method==='POST'&&url.origin==='https://tile.googleapis.com'&&url.pathname==='/v1/createSession')){report.blockedWrites++;return route.abort()}
  try{let response,local=false;
   if(url.pathname.endsWith('/explorer/explorer.js')){local=true;response={status:200,headers:{'content-type':'application/javascript','cache-control':'no-store'},body:source}}
   else if(url.pathname.endsWith('/explorer/index.html')){local=true;response={status:200,headers:{'content-type':'text/html','cache-control':'no-store'},body:fs.readFileSync(live+'/index.html')}}
   else response=await curlFetch(request.url(),request.headers(),method,request.postData());
   report.requests.push({path:url.pathname,host:url.host,method,status:response.status,bytes:response.body.length,ms:Date.now()-start,local,at:Date.now()});
   await route.fulfill(response);
  }catch(e){report.requests.push({path:url.pathname,host:url.host,method,error:String(e.message).replace(/https?:\/\/\S+/g,'[URL]'),ms:Date.now()-start});try{await route.abort('failed')}catch(_){}}
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message.replace(/([?&](?:key|session|token)=)[^&\s]+/g,'$1[redacted]')));
 await page.addInitScript(()=>{window.__inputs813=[];document.addEventListener('click',e=>{if(e.target.closest('#zoomIn'))window.__inputs813.push(performance.now())},true)});
 await page.goto('https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html?embed=1&back=v#hybrid',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.GC500Explorer?.state.ready&&window.__perf?.firstSharpMs,null,{timeout:90000});
 report.first=await page.evaluate(()=>({ready:window.__ready,mode:GC500Explorer.state.mode,firstSharpMs:__perf.firstSharpMs,firstViewMs:Math.round(loaderAt),canvas:{width:canvas.width,height:canvas.height,dpr},perf:{...__perf}}));
 if(!demandOnly)await page.waitForTimeout(8000);
 report.idle=await page.evaluate(()=>({sceneReady,underComp:!!underComp,underJob:!!underJob,perf:{...__perf},frames:__frames.length}));report.idleAt=Date.now();
 report.idleRequests=report.requests.length;report.idleBytes=report.requests.reduce((n,r)=>n+(r.bytes||0),0);report.idleHeavy=report.requests.filter(r=>r.path.endsWith('/drawing-scene.bin')||/\/underlay\/.*\.webp$/.test(r.path));
 report.zoom=[];
 for(let i=0;i<(demandOnly?0:3);i++){
  const before=await page.evaluate(()=>camera.z);await page.locator('#zoomIn').click();
  await page.waitForFunction(z=>{const t=__inputs813.at(-1);return __frames.some(f=>f.t>=t&&!f.inter&&f.z>z&&!f.vtMiss&&!f.satMiss&&!f.underMiss)},before,{timeout:60000});
  const result=await page.evaluate(z=>{const t=__inputs813.at(-1),frames=__frames.filter(f=>f.t>=t&&f.z>z),first=frames[0],sharp=frames.find(f=>!f.inter&&!f.vtMiss&&!f.satMiss&&!f.underMiss);return {from:z,to:camera.z,inputAt:t,firstFrameMs:first.t-t,sharpMs:sharp.t-t,drawMs:frames.map(f=>f.ms),sceneReady}},before);report.zoom.push(result);
 }
 await page.screenshot({path:path.join(dir,'hybrid-sharp.png')});
 // These real controls must now own the view even when the preceding wheel glide has not settled.
 await page.locator('#zoomIn').click();await page.locator('#fitBtn').click();const fitted=await page.evaluate(()=>({...camera}));await page.waitForTimeout(500);const afterFit=await page.evaluate(()=>({...camera}));
 report.fitAfterZoom={requested:fitted,settled:afterFit};
 if(source.includes('function stopCameraMotion813('))check('Fit retains its requested camera after a zoom click',JSON.stringify(fitted)===JSON.stringify(afterFit),report.fitAfterZoom);
 if(demand){
  check('Hybrid idle did not load heavy scene or aerial',!report.idle.sceneReady&&!report.idle.underJob&&report.idleHeavy.length===0,{requests:report.idleHeavy.length});
  if(mobile){for(let i=0;i<12;i++)await page.locator('#zoomIn').click()}
  else {await page.locator('#zoomInput').fill('6400%');await page.locator('#zoomInput').press('Enter')}
  await page.waitForFunction(()=>sceneReady,null,{timeout:90000});check('Detail beyond pyramid loads the source scene',await page.evaluate(()=>sceneReady));
  await page.locator('button[data-mode="original"]').click();await page.locator('#fitBtn').click();
  await page.waitForFunction(()=>!!underComp,null,{timeout:90000});check('Original plan loads its aerial when selected',await page.evaluate(()=>mode==='original'&&!!underComp));
  await page.screenshot({path:path.join(dir,'original-demand.png')});
 }
 check('No page exceptions',report.errors.length===0,report.errors);check('No operational writes attempted',report.blockedWrites===0,report.blockedWrites);
 report.finished=new Date().toISOString();report.passed=report.checks.every(c=>c.pass);save();console.log(JSON.stringify({dir,sourceSha256:report.sourceSha256,mobile,firstSharpMs:report.first.firstSharpMs,idleBytes:report.idleBytes,heavyRequests:report.idleHeavy.length,zoom:report.zoom.map(z=>({firstFrameMs:z.firstFrameMs,sharpMs:z.sharpMs})),passed:report.passed}));
})().catch(e=>{report.failure=e.message;report.passed=false;save();console.error(e.message);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
