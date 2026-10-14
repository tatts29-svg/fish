/* Author: Andrew Fisher. Bounded diagnostic capture of the existing map renderer. */
'use strict';
const fs=require('fs'),path=require('path'),{open}=require('./readonly1018.cjs');
const out=process.env.OUT||'/tmp/private-gc500-visual1018/map/baseline';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',samples:[]};let h;
(async()=>{try{
 const mobile=process.env.MOB==='1';h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',mobile,W:+process.env.W||(mobile?390:1440),H:+process.env.H||(mobile?844:1000),dpr:+process.env.DPR||(mobile?3:1)});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
 await p.waitForFunction(()=>EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});
 const f=p.frames().find(f=>/\/explorer\/index\.html(?:\?|$)/.test(f.url()));await f.evaluate(()=>GC500Explorer.ready);await f.evaluate(()=>GC500Explorer.refresh());
 const snapshot=async name=>{const data=await f.evaluate(()=>({camera:{...camera},interacting,rotAnim,zAnim,flingRAF,dpr,dprFull,canvas:[canvas.width,canvas.height],css:[sw,sh],level:levelFor(currentView()),held:vLevel(currentView(),'main'),tiles:tiles.size,vectorTiles:vtiles.size,queue:vtQueue.size,inflight:vtInflight.size,mosaics:[...vmosaics].map(([k,m])=>[k,m.canvas.width,m.canvas.height]),quality:$('qualText').textContent,frames:window.__frames.slice(-20),pulse:{hidden:$('pulse').hidden,animation:getComputedStyle($('pulse').querySelector('b')).animationName}}));report.samples.push({name,...data});};
 await snapshot('ready');await f.evaluate(()=>{GC500Explorer.setMode('original');camera.z=8;changeView(false)});await p.waitForTimeout(1000);
 await f.evaluate(()=>rotateTo(35));await p.waitForTimeout(1500);await snapshot('rotation-settled');
 await f.evaluate(()=>{stopCameraMotion813();clearTimeout(restTimer);interacting=false;lightPending887=true;requestPaint()});
 const refresh=await f.evaluate(()=>{const before=JSON.stringify(camera),times=[];for(let i=0;i<20;i++){const t=performance.now();GC500Explorer.refresh();times.push(performance.now()-t)}return {cameraPreserved:before===JSON.stringify(camera),times};});report.refresh=refresh;
 await f.evaluate(()=>GC500Explorer.find('GN?'));await p.waitForTimeout(1000);await snapshot('selected');
 await p.screenshot({path:path.join(out,'map.png')});report.version=await p.evaluate(()=>SYNC.backend.readVersion821());
}catch(e){report.failure=String(e.stack||e);process.exitCode=1}finally{if(h){report.counts=h.counts;report.errors=h.errors;await h.browser.close()}fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({version:report.version,samples:report.samples.map(s=>({name:s.name,dpr:s.dpr,interacting:s.interacting,rotAnim:s.rotAnim,level:s.level,held:s.held,canvas:s.canvas,quality:s.quality})),refresh:report.refresh,counts:report.counts,errors:report.errors,failure:report.failure}));}})();
