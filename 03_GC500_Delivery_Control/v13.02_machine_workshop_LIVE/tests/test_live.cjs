// Author: Andrew Fisher. Read the actual published machine; never substitute candidate responses.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
if(!process.env.GC500_CACHE)throw Error('Set a fresh GC500_CACHE for actual live verification');
if(fs.existsSync(process.env.GC500_CACHE)&&fs.readdirSync(process.env.GC500_CACHE).length)throw Error('Live verification cache must be empty');
const {curlFetch}=require(path.join(process.env.GC500_TOOLCHAIN,'harness/curlfetch'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const host='https://gc500-production.up.railway.app',prefix='/w/Coates-GC500-2026/';
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(process.env.MANIFEST)),out=process.env.OUT;
 fs.mkdirSync(out,{recursive:true});
 const expected=new Map(manifest.files.map(f=>[f.path,f.sha256]));
 const result={author:'Andrew Fisher',suite:'live-machine1302',passed:false,errors:[],consoleErrors:[],recordWrites:0,verifiedFiles:{},machineManifestSha256:manifest.sha256};
 let completed=false,closing=false;const pending=new Set();
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{const work=(async()=>{
   const request=route.request(),url=new URL(request.url());
   if(request.method()!=='GET'){result.recordWrites++;return await route.abort();}
   if(closing)return await route.abort();
   try{
    const headers={...request.headers()};delete headers.range;const response=await curlFetch(request.url(),headers,'GET');
    if(url.origin===host&&url.pathname.startsWith(prefix)){
     const name=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
     if(!expected.has(name)||response.status!==200||sha(response.body)!==expected.get(name))throw Error('Published content differs: '+name);
     result.verifiedFiles[name]=sha(response.body);
    }
    return await route.fulfill(response);
   }catch(error){if(closing&&/closed/.test(error.message))return;result.errors.push(error.message);try{return await route.abort();}catch(_){}}
  })();pending.add(work);work.then(()=>pending.delete(work),()=>pending.delete(work));return work;});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(m.text());});
  await page.goto(host+prefix+'?release='+manifest.sha256,{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__cw?.ready&&window.__workshop,null,{timeout:180000,polling:500});
  await page.locator('#workshop-enter').click();
  await page.waitForFunction(()=>__workshop.active&&__cw.drive.locked);
  await page.locator('#workshop-bench-open').click();
  await page.waitForFunction(()=>__workshop.learning.active&&__workshop.lift.benchReady);
  await page.locator('#bench-crank').click();
  if(await page.evaluate(()=>__workshop.learning.state.crankDegrees)!==45)throw Error('Live hand crank did not advance');
  await page.screenshot({path:path.join(out,'live-phone-bench.png'),timeout:120000});
  await page.evaluate(()=>document.getElementById('workshop-exit').click());
  await page.waitForFunction(()=>!__workshop.active&&!__cw.drive.locked);
  const required=['index.html','car-app.js','workshop-ui.js','engine-lift-preview.js','workshop-finish.js','crew-polish.js','workshop-learning.js'];
  if(!required.every(name=>result.verifiedFiles[name]===expected.get(name)))throw Error('A changed module was not read from live');
  if(result.errors.length||result.consoleErrors.length||result.recordWrites)throw Error('Live browser errors or write attempt');
  completed=true;
 }catch(e){result.failure=e.message;}finally{closing=true;await browser.close();while(pending.size)await Promise.allSettled([...pending]);result.passed=completed&&!result.errors.length&&!result.consoleErrors.length&&!result.recordWrites;fs.writeFileSync(path.join(out,'live-browser.json'),JSON.stringify(result,null,2));}
 console.log(JSON.stringify({passed:result.passed,verifiedFiles:Object.keys(result.verifiedFiles).length,errors:result.errors,consoleErrors:result.consoleErrors,recordWrites:result.recordWrites,failure:result.failure}));
 if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
