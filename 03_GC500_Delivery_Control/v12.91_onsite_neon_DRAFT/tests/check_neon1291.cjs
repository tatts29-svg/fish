/* Author: Andrew Fisher. Focused read-only checks for Still on site neon.
 * Run under /tmp/gc500-browser.lock. OUT must be outside Git. No record fixtures.
 * A temporary DOM attribute checks review-colour CSS and is restored immediately.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
assert(process.env.OUT,'OUT is required');
assert(process.env.PAGE||process.env.LIVE==='1','PAGE or LIVE=1 required');
assert(!(process.env.PAGE&&process.env.LIVE==='1'),'Live verification must read the served page');
const out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
assert(!out.startsWith(repo+path.sep),'Evidence must stay private');fs.mkdirSync(out,{recursive:true});
process.env.GC500_CACHE=process.env.GC500_CACHE||fs.mkdtempSync(path.join(out,'fetch-'));
const {open}=require('../../toolchain/harness/open_page'),{curlFetch}=require('../../toolchain/harness/curlfetch');
const safe=e=>String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key]').slice(0,350);
const result={author:'Andrew Fisher',suite:'neon1291',checkedAt:new Date().toISOString(),passed:false,checks:[],errors:[],consoleErrors:[],recordWrites:0};
let session,child;
const check=(name,condition,detail)=>{result.checks.push({name,passed:!!condition,...(detail===undefined?{}:{detail})});};
const waitPaint=()=>child.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const visual=()=>child.evaluate(()=>{
 const h=document.getElementById('onsite-halo1291'),s=document.getElementById('shape1060'),t=document.getElementById('offsite1225'),c=getComputedStyle(h);
 return {state:GC500OnsiteNeon1291.state,opacity:+c.opacity,display:c.display,visibility:c.visibility,animation:c.animationName,pointerEvents:c.pointerEvents,filter:c.filter,core:s.toDataURL(),tags:t.toDataURL()};
});
const captureInk=()=>child.evaluate(async()=>{
 const h=document.getElementById('onsite-halo1291'),s=document.getElementById('shape1060'),g=h.getContext('2d');let copied=false,boxes=0;
 const draw=g.drawImage,rect=g.roundRect;g.drawImage=function(image,...args){if(image===s)copied=true;return draw.call(this,image,...args);};g.roundRect=function(...args){boxes++;return rect.apply(this,args);};
 try{GC500OnsiteNeon1291.refresh();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}finally{g.drawImage=draw;g.roundRect=rect;}
 const pixels=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let sourcePixels=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])sourcePixels++;
 return {copied,sourcePixels,boxes,expectedBoxes:GC500Departure1211.markers1288.filter(m=>['onsite','review'].includes(m.kind)).reduce((n,m)=>n+m.tag.length,0)};
});
async function focus(){
 return child.evaluate(()=>{
  const code=GC500StillOnSite1290.state.refs.find(r=>r.mapped&&parent.gc500MapShapes1060().refs[r.code]?.comps.some(c=>c.doors.length))?.code||GC500StillOnSite1290.state.refs.find(r=>r.mapped&&parent.gc500MapShapes1060().refs[r.code])?.code;
  if(!code)return null;GC500Explorer.setMode('original');stopCameraMotion813();clearSelection813();
  const sh=parent.gc500MapShapes1060().refs[code],pts=sh.comps.flatMap(c=>c.poly.map(p=>toGeo(p[0]*SHEET_W,p[1]*SHEET_H))),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  camera.cx=(Math.max(...xs)+Math.min(...xs))/2;camera.cy=(Math.max(...ys)+Math.min(...ys))/2;camera.rot=0;camera.z=Math.max(MIN_Z,Math.min(MAX_Z,170/(span*fitScale)));panel813(false);requestPaint();return code;
 });
}
async function seek(time){return child.evaluate(time=>{const h=document.getElementById('onsite-halo1291');for(const a of h.getAnimations()){a.pause();a.currentTime=time;}return +getComputedStyle(h).opacity;},time);}
(async()=>{
 try{
  const bytes=process.env.PAGE?fs.readFileSync(process.env.PAGE):(await curlFetch('https://gc500-production.up.railway.app/v/Coates-GC500-2026?neon1291='+Date.now(),{'Cache-Control':'no-store'},'GET')).body;
  result.dashboardSha256=crypto.createHash('sha256').update(bytes).digest('hex');if(process.env.EXPECTED_SHA)assert.equal(result.dashboardSha256,process.env.EXPECTED_SHA,'Wrong page bytes');
  const feature=fs.readFileSync(path.join(__dirname,'../neon1291_src.js'),'utf8');
  check('Feature has no interval, timeout or self-scheduling animation loop',!/setInterval|setTimeout/.test(feature)&&!feature.slice(feature.indexOf('function paint()'),feature.indexOf('function schedule()')).includes('requestAnimationFrame'));
  session=await open({pageFile:process.env.PAGE,hash:'#map',W:390,H:844,dpr:1,mobile:true,gl:true,init:"localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');"});
  const p=session.page;p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(safe(m.text()));});
  await p.waitForFunction(()=>typeof go==='function'&&document.getElementById('expFrame'),null,{timeout:30000});await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>document.getElementById('expFrame')?.contentWindow?.GC500OnsiteNeon1291,null,{timeout:45000});
  child=p.frames().find(f=>new URL(f.url()).pathname.endsWith('/explorer/index.html'));assert(child,'Explorer frame missing');
  await child.waitForFunction(()=>MapUnits1147.state.ready&&GC500Shape1060.state.available&&GC500StillOnSite1290.state.ready,null,{timeout:30000});
  await child.evaluate(()=>{GC500StillOnSite1290.setActive(false);stopCameraMotion813();});await waitPaint();
  const toggle=child.locator('#still-onsite1290');await toggle.tap();await waitPaint();await p.waitForTimeout(300);
  check('Real tap enables Still on site',await child.evaluate(()=>GC500StillOnSite1290.active));
  await child.locator('#stage').scrollIntoViewIfNeeded();await waitPaint();
  result.initial=await child.evaluate(()=>({state:GC500OnsiteNeon1291.state,tags:GC500Departure1211.markers1288.filter(m=>m.tag.length).length}));
  check('Visible pointer-free halo is populated on the phone',result.initial.state.active&&!result.initial.state.hidden&&result.initial.state.width>0);
  result.initialInk=await captureInk();check('Glow border count matches currently displayed reference tags',result.initialInk.boxes===result.initialInk.expectedBoxes);
  await p.screenshot({path:path.join(out,'still-onsite-neon-phone.png')});
  result.vms=await child.evaluate(()=>{
   const b=[...document.querySelectorAll('#vmsicons1211 button')].find(b=>b.querySelector('svg'));if(!b)return {available:false};
   const old=b.getAttribute('data-onsite-review'),svg=b.querySelector('svg'),read=()=>({colour:getComputedStyle(b).getPropertyValue('--onsite-neon').trim(),filter:getComputedStyle(svg).filter,animation:getComputedStyle(svg).animationName});
   try{b.dataset.onsiteReview='false';const orange=read();b.dataset.onsiteReview='true';const review=read();return {available:true,orange,review};}
   finally{if(old===null)b.removeAttribute('data-onsite-review');else b.setAttribute('data-onsite-review',old);}
  });
  result.vms.scope='Synthetic presentation-only attribute probe; no operational state, reader or record changed';
  check('Presentation-only VMS CSS probe preserves orange and review-red glow',result.vms.available&&result.vms.orange.colour==='#ff821f'&&result.vms.review.colour==='#ffaaa3'&&result.vms.orange.filter.includes('255, 130, 31')&&result.vms.review.filter.includes('255, 170, 163'));
  result.focus=await focus();check('Close-up uses existing recorded equipment geometry',!!result.focus);await waitPaint();await p.waitForTimeout(800);
  result.ink=await captureInk();
  check('Halo copies real nonempty source geometry and all current tag borders',result.ink.copied&&result.ink.sourcePixels>0&&result.ink.boxes===result.ink.expectedBoxes);
  const before=await visual();await p.waitForTimeout(325);const middle=await visual();await p.waitForTimeout(325);const after=await visual(),opacities=[before.opacity,middle.opacity,after.opacity];
  check('Halo opacity visibly pulses without intercepting touches',Math.max(...opacities)-Math.min(...opacities)>.025&&after.pointerEvents==='none');
  result.pulse={opacities,filter:after.filter};
  result.crisp=await child.evaluate(()=>{
   const h=document.getElementById('onsite-halo1291'),s=document.getElementById('shape1060'),t=document.getElementById('offsite1225'),core=s.toDataURL(),tags=t.toDataURL(),animations=h.getAnimations(),prior=animations.map(a=>({a,time:a.currentTime,state:a.playState}));
   let same=true;const opacity=[];
   try{for(const time of [0,1300]){for(const a of animations){a.pause();a.currentTime=time;}opacity.push(+getComputedStyle(h).opacity);same=same&&core===s.toDataURL()&&tags===t.toDataURL();}}
   finally{for(const {a,time,state}of prior){a.currentTime=time;if(state==='running')a.play();}}
   return {samePixels:same,opacity,coreAnimation:getComputedStyle(s).animationName,tagAnimation:getComputedStyle(t).animationName};
  });
  check('Seeking only the CSS halo preserves crisp core and count pixels exactly',result.crisp.samePixels&&result.crisp.coreAnimation==='none'&&result.crisp.tagAnimation==='none'&&result.crisp.opacity[1]>result.crisp.opacity[0]);
  result.idle=await child.evaluate(async()=>{
   const initial=GC500OnsiteNeon1291.state.paintCount,draw=drawMarks,reader=parent.Departure1211;let nativeDraws=0,modelReads=0;
   drawMarks=function(){nativeDraws++;return draw.apply(this,arguments);};parent.Departure1211={...reader,all:function(){modelReads++;return reader.all.apply(reader,arguments);}};
   try{await new Promise(r=>setTimeout(r,1100));return {milliseconds:1100,paints:GC500OnsiteNeon1291.state.paintCount-initial,nativeDraws,modelReads};}
   finally{drawMarks=draw;parent.Departure1211=reader;}
  });
  check('Pulse adds no independent redraw or model-read loop',result.idle.paints<=result.idle.nativeDraws+1&&result.idle.modelReads===0);
  result.trough=await seek(0);await child.locator('#stage').screenshot({path:path.join(out,'still-onsite-neon-trough.png')});
  result.peak=await seek(1300);await child.locator('#stage').screenshot({path:path.join(out,'still-onsite-neon-peak.png')});
  check('Deterministic pulse endpoints retain visible core with stronger peak glow',result.trough>=.3&&result.peak>.85&&result.peak-result.trough>.4);
  await p.emulateMedia({reducedMotion:'reduce'});await waitPaint();const reducedA=await visual();await p.waitForTimeout(350);const reducedB=await visual();
  result.reduced={opacity:reducedB.opacity,animation:reducedB.animation,vmsRules:await child.evaluate(()=>[...document.getElementById('onsite-neon1291-style').sheet.cssRules].filter(r=>r.conditionText?.includes('prefers-reduced-motion')).flatMap(r=>[...r.cssRules].filter(x=>x.selectorText?.includes('#vmsicons1211')).map(x=>({selector:x.selectorText,animationName:x.style.animationName,priority:x.style.getPropertyPriority('animation-name'),css:x.style.cssText})))),vmsScope:'Parsed reduced-motion stylesheet rule; no claim that a VMS is visible in this close-up'};
  check('Reduced motion keeps halo static and its stylesheet disables VMS animation',reducedA.opacity===reducedB.opacity&&reducedB.opacity>=.65&&reducedB.animation==='none'&&result.reduced.vmsRules.some(r=>r.animationName==='none'&&r.priority==='important'));
  await p.emulateMedia({reducedMotion:'no-preference'});await waitPaint();
  result.modeGuards=await child.evaluate(()=>{
   const h=document.getElementById('onsite-halo1291'),rows=[];
   for(const cls of ['in3d','fencing-map']){const had=document.body.classList.contains(cls);try{document.body.classList.add(cls);rows.push({mode:cls,display:getComputedStyle(h).display,vms:[...document.querySelectorAll('#vmsicons1211 button>svg')].map(e=>getComputedStyle(e).animationPlayState)});}finally{if(!had)document.body.classList.remove(cls);}}
   return rows;
  });
  check('Native 3D and fencing classes hide the halo and pause VMS effects',result.modeGuards.every(r=>r.display==='none'&&r.vms.every(s=>s==='paused')));
  await toggle.tap();await waitPaint();const off=await visual();
  result.off={active:off.state.active,hidden:off.state.hidden,display:off.display,animation:off.animation,vms:await child.evaluate(()=>[...document.querySelectorAll('#vmsicons1211 button>svg')].map(e=>({filter:getComputedStyle(e).filter,animation:getComputedStyle(e).animationName})))};
  check('Turning off removes the added halo and animations',!off.state.active&&off.state.hidden&&off.display==='none'&&off.animation==='none'&&result.off.vms.every(s=>s.animation!=='onsite-sign1291'));
  result.errors=session.errors.map(safe);result.recordWrites=session.counts.blocked;
  check('No page or console errors',!result.errors.length&&!result.consoleErrors.length);check('No attempted operational record writes',!result.recordWrites);result.passed=result.checks.every(c=>c.passed);if(!result.passed)result.failure=result.checks.filter(c=>!c.passed).map(c=>c.name).join('; ');
 }catch(e){result.failure=safe(e);}
 finally{if(session){result.errors=session.errors.map(safe);result.recordWrites=session.counts.blocked;await session.browser.close();}fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify({passed:result.passed,sha256:result.dashboardSha256,checks:result.checks.length,errors:result.errors.length,consoleErrors:result.consoleErrors.length,recordWrites:result.recordWrites,failure:result.failure}));if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(safe(e));process.exitCode=1;});
