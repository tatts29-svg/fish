/* Author: Andrew Fisher. Read-only same-camera baseline/candidate paint timing.
 * Run serially under the browser flock. BASELINE_PAGE, PAGE, private OUT required.
 * Measures CPU painting only, not network speed, readiness or device guarantees.
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
assert(process.env.OUT&&process.env.PAGE&&process.env.BASELINE_PAGE,'OUT, PAGE and BASELINE_PAGE required');
const out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');assert(!out.startsWith(repo+path.sep),'Private OUT required');fs.mkdirSync(out,{recursive:true});
process.env.GC500_CACHE=process.env.GC500_CACHE||path.join(out,'cache');
const result={author:'Andrew Fisher',checkedAt:new Date().toISOString(),scope:'Warm synchronous map footprint CPU time and separately deferred label CPU time at matching cameras. No network or instant-loading claim.',runs:[]};
(async()=>{
 for(const [name,pageFile] of [['baseline',process.env.BASELINE_PAGE],['candidate',process.env.PAGE]]){
  let s;const run={name,sha256:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),views:[]};
  try{
   s=await open({pageFile,hash:'#map',W:1153,H:1280,dpr:1,mobile:true,init:"localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');"});
   await s.page.waitForFunction(()=>typeof go==='function'&&document.getElementById('expFrame'),null,{timeout:30000});await s.page.evaluate(()=>go('map'));
   await s.page.waitForFunction(()=>document.getElementById('expFrame')?.contentWindow?.GC500Shape1060?.state.available,null,{timeout:45000});
   const child=s.page.frames().find(f=>new URL(f.url()).pathname.endsWith('/explorer/index.html'));
   await child.waitForFunction(()=>MapUnits1147.state.ready&&parent.gc500MapStatus1009?.().available,null,{timeout:30000});
   for(const view of ['overview','close-up']){
    await child.evaluate(view=>{GC500Explorer.setMode('original');complete897Pull();stopCameraMotion813();clearSelection813();marks=[];DONE782_ON=false;panel813(false);
     if(view==='overview')fit(false,false);else{const shape=parent.gc500MapShapes1060().refs.P51,ps=shape.comps.flatMap(c=>c.poly.map(p=>toGeo(p[0]*SHEET_W,p[1]*SHEET_H))),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));camera.cx=(Math.min(...xs)+Math.max(...xs))/2;camera.cy=(Math.min(...ys)+Math.max(...ys))/2;camera.z=Math.max(MIN_Z,Math.min(MAX_Z,200/(span*fitScale)));camera.rot=0;}requestPaint();},view);
    await s.page.waitForTimeout(180);
    const timing=await child.evaluate(async()=>{const quant=a=>{a.sort((x,y)=>x-y);return {samples:a.length,medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],maxMs:a.at(-1)};},sync=[];
     for(let i=0;i<40;i++){const t=performance.now();drawMarks(currentView());if(i>=10)sync.push(performance.now()-t);}
     const labels=[],g=document.getElementById('offsite1225').getContext('2d'),old=g.clearRect;g.clearRect=function(...a){const t=performance.now();queueMicrotask(()=>labels.push(performance.now()-t));return old.apply(this,a);};
     try{for(let i=0;i<12;i++){drawMarks(currentView());await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}}finally{g.clearRect=old;}
     return {camera:{...camera},viewport:[sw,sh],dpr,footprints:quant(sync),labels:quant(labels),painted:GC500Shape1060.state.drawn,rendererErrors:GC500Shape1060.state.failed,departureCount:parent.Departure1211.mapStates().filter(r=>r.collected).length};});
    run.views.push({view,...timing});assert.equal(timing.rendererErrors,0,'Renderer error');
   }
   run.errors=s.errors;run.blockedWrites=s.counts.blocked;assert.equal(run.errors.length,0);assert.equal(run.blockedWrites,0);
  }finally{if(s)await s.browser.close();result.runs.push(run);fs.writeFileSync(path.join(out,'paint-comparison.json'),JSON.stringify(result,null,2)+'\n');}
 }
 for(let i=0;i<2;i++){assert.deepEqual(result.runs[0].views[i].camera,result.runs[1].views[i].camera,'Camera differs');assert.deepEqual(result.runs[0].views[i].viewport,result.runs[1].views[i].viewport,'Viewport differs');}
 result.passed=true;fs.writeFileSync(path.join(out,'paint-comparison.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(String(e.message).slice(0,250));process.exitCode=1;});
