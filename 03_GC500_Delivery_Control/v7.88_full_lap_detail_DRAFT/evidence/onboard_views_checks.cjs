/* Author: Andrew Fisher. Four onboard stills from the original continuous lap.
 * Run only after the main coverage check releases its graphics context.
 * This is sampled visual evidence, not a continuous rendered video.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
const out=path.resolve(process.env.OUT||'/workspace/private-v788-full-lap');
const preview=path.resolve(process.env.PREVIEW||path.join(out,'frozen-preview.html'));
const html=fs.readFileSync(preview,'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const result={author:'Andrew Fisher',previewSha256:hash(html),method:'Original 120 Hz physics, continuously advanced from the grid; four onboard stills, no teleport or midlap reset',errors:[],externalRequests:[],samples:[]};
const save=()=>fs.writeFileSync(path.join(out,'onboard-views.json'),JSON.stringify(result,null,2)+'\n');
(async()=>{let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
  await context.route('**/*',route=>{const url=route.request().url();if(url==='https://gc500-preview.test/')return route.fulfill({contentType:'text/html',body:html});if(/^(data:|blob:)/.test(url))return route.continue();result.externalRequests.push(new URL(url).origin);return route.abort();});
  const p=await context.newPage();p.setDefaultTimeout(180000);
  p.on('pageerror',e=>result.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
  await p.goto('https://gc500-preview.test/',{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>{if(!startFullLap788())throw Error('Preview did not start');pauseFullLap788(true);GC3D.S.qualityChoice='manual';document.querySelector('[data-camera=onboard]').click();});
  const start=await p.evaluate(()=>({s:GC3D.S.sim.s,lap:GC3D.S.CL.L,metres:GC3D.M_PER_PT}));
  const targets=[{fraction:.125},{fraction:.375},{fraction:1500/(start.lap*start.metres),compare:true},{fraction:.625},{fraction:.875}].sort((a,b)=>a.fraction-b.fraction).filter(t=>!process.env.DIAGNOSTIC_ONLY||t.compare);
  for(const target of targets){
   const fraction=target.fraction,camera=target.compare?'chase':'onboard';
   await p.locator('[data-camera="'+camera+'"]').click();
   const state=await p.evaluate(({start,fraction})=>{
    const G=GC3D,S=G.S,target=start.s+start.lap*fraction,dt=1/120;
    let steps=0,reverse=0,error=0;
    while(S.sim.s<target&&steps<120*600){const old=S.sim.s;G.step(dt);const ds=S.sim.s-old;if(ds<0)reverse++;error=Math.max(error,Math.abs(ds-S.sim.v*dt));steps++;}
    G.render();S.needsRender=false;
    const sky=S.sky781;
    return {fraction,distanceM:(S.sim.s-start.s)*G.M_PER_PT,clock:S.clock,steps,reverse,maxDistanceError:error,
     camera:{view:S.view,forceShot:S.forceShot,eye:S.cam.eye,target:S.cam.tgt,fov:S.cam.fov,pose:S.pose.pos},
     look:S.look,sky781:!!sky,skyKeys:sky?Object.keys(sky):[],sun:G.sunDirection,
     bloom:S.quality&&S.quality.bloom,quality:S.quality&&S.quality.name,graphics:G.graphicsReport(),
     shadow:S.sunShadow?{ok:S.sunShadow.ok,size:S.sunShadow.size,detail:S.sunShadow.detail781,focusX:S.sunShadow.focusX781,focusZ:S.sunShadow.focusZ781}:null,
     glError:S.gl.getError(),detail:!!S.detail781Enabled,track:G.trackDetailReport781(S)};
   },{start,fraction});
   const file='desktop-'+camera+'-'+String(Math.round(fraction*1000)).padStart(3,'0')+'.png';
   const image=await p.screenshot({path:path.join(out,file),timeout:180000});state.screenshot={file,sha256:hash(image)};
   result.samples.push(state);save();
   if(target.compare){
    await p.locator('#compare').click();await p.evaluate(()=>{GC3D.render();GC3D.S.needsRender=false;});
    const offFile='desktop-chase-1500m-original.png';const off=await p.screenshot({path:path.join(out,offFile),timeout:180000});
    state.originalComparison={file:offFile,sha256:hash(off),position:await p.evaluate(()=>({s:GC3D.S.sim.s,clock:GC3D.S.clock,detail:GC3D.S.detail781Enabled}))};
    await p.locator('#compare').click();save();
   }
   if(state.glError||state.reverse||state.maxDistanceError>1e-8||state.camera.view!==camera)throw Error('Onboard sample failed at '+fraction);
  }
  result.passed=(process.env.DIAGNOSTIC_ONLY?result.samples.length===1:result.samples.filter(s=>s.camera.view==='onboard').length===4)&&!result.errors.length&&!result.externalRequests.length;save();
  if(!result.passed)throw Error('Onboard error or external request');
  console.log(process.env.DIAGNOSTIC_ONLY?'PASS matched original/detail diagnostic with source simulation':'PASS four onboard views with source simulation and lighting diagnostics');
 }catch(e){result.failure=e.stack||String(e);save();console.error(result.failure);process.exitCode=1;}finally{if(browser)await browser.close();}
})();
