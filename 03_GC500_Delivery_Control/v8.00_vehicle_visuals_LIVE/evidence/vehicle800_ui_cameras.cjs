/* Author: Andrew Fisher. Actual product Detail / Front detail verification.
 * PAGE=final.html OUT=/private/path node vehicle800_ui_cameras.cjs
 * Desktop Detail + phone Front detail for every existing choice (14 captures).
 * The product owns the camera. No camDebug, manual lens, geometry or records change.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE,out=process.env.OUT;assert(pageFile&&out,'PAGE and private OUT required');fs.mkdirSync(out,{recursive:true});
const result={author:'Andrew Fisher',candidate:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),scope:'Actual existing UI views; desktop Detail and phone Front detail for all seven selections; deterministic 120Hz simulation, smoke removed only for inspection',views:[],checks:[],errors:[],blockedWrites:0};
const save=()=>fs.writeFileSync(path.join(out,'ui_cameras.json'),JSON.stringify(result,null,2)+'\n');
function ck(name,pass,detail){result.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});save();assert(pass,name);}
const samePose=(a,b)=>{if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b)<1e-9;if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return a===b;return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>samePose(a[k],b[k]));};
const vehicles=['car','car_vms','car_loo','forklift','boom','scissor','tractor'];
(async()=>{
 for(const device of ['desktop','phone']){
  const phone=device==='phone',view=phone?'frontdetail':'detail',s=await open({pageFile,W:phone?390:1280,H:phone?844:800,mobile:phone,dpr:1,gl:true}),p=s.page;
  try{
   p.setDefaultTimeout(180000);p.on('console',m=>{if(m.type()==='error')result.errors.push(m.text().slice(0,300));});
   await p.waitForFunction(()=>typeof showOpen==='function'&&SYNC.status==='live',null,{timeout:240000});
   await p.evaluate(()=>{
    localStorage.setItem('gc500.showview','detail');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showback','circuit3d_day');GC3D.noGuard=true;
    showOpen();if(SHOW.playing)showPause();if(GC3D.S)GC3D.S.paused=true;
    window.__uiRender800=GC3D.render;GC3D.render=()=>{};
   });
   await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl&&GC3D.S.cv.isConnected&&GC3D.S.cv.clientWidth>0&&GC3D.S.cv.clientHeight>0);
   await p.evaluate(()=>{
    const G=GC3D;window.__uiPause800=()=>{if(SHOW.playing)showPause();const S=G.S;S.paused=true;S.last=null;S.needsRender=false;if(LAPS.raf){cancelAnimationFrame(LAPS.raf);LAPS.raf=0;}};
    window.__uiSignature800=()=>{const S=G.S;return JSON.parse(JSON.stringify({clock:S.clock,sim:Object.fromEntries(Object.entries(S.sim).filter(([k,v])=>typeof v!=='function'&&(!v||typeof v!=='object'))),pose:S.pose,trailer:S.trailer,sway:S.sway,loo:S.loo}));};__uiPause800();
   });
   for(const vehicle of vehicles){
    const snap=await p.evaluate(({vehicle,view})=>{
     const G=GC3D;showVehicleSet(vehicle);G.setQuality('balanced');G.setLook('day');
     const select=document.getElementById('showView');if(!select)throw Error('Missing actual view control');select.value=view;select.dispatchEvent(new Event('change',{bubbles:true}));
     G.simReset();const S=G.S;S.trailer=null;S.sway=null;S.loo=null;
     // Fifteen seconds clears the known over-track board for towed combinations.
     // This is an inspection pose, not a change to the product's driving route.
     const seconds=S.towVms?15:12;
     for(let i=0;i<seconds*120;i++){G.step(1/120);if(S.towVms)G.trailerStep(S);G.swayStep(S);if(S.towVms&&S.towKind==='loo')G.looStep(S);}
     const smokeRemoved=S.sim.smoke.length;S.sim.smoke.length=0;__uiPause800();G.camStep(0);
     const before=__uiSignature800();__uiRender800();__uiPause800();
     const report=G.vehicleCameraReport800(),gl=S.gl;
     return{vehicle,view,seconds,actualVehicle:S.vehicleKey,actualView:S.view,actualShot:S.shotName,selectedView:select.value,camDebug:!!S.camDebug,before,after:__uiSignature800(),paused:S.paused,playing:SHOW.playing,smokeRemoved,report,graphics:G.graphicsReport(),canvas:{width:S.cv.width,height:S.cv.height,cssWidth:S.cv.clientWidth,cssHeight:S.cv.clientHeight},glError:gl.getError(),shaderLinked:gl.getProgramParameter(S.raceProgram.p,gl.LINK_STATUS)};
    },{vehicle,view});
    const id=device+'-'+vehicle+'-'+view;
    ck(id+': actual selected UI view and vehicle are active',snap.actualVehicle===vehicle&&snap.actualView===view&&snap.actualShot===view&&snap.selectedView===view&&!snap.camDebug&&snap.report.active,snap.report);
    ck(id+': entire product-fitted subject has margin and clear sight lines',snap.report.maxX<.94&&snap.report.maxY<.94&&snap.report.minDepth>0&&snap.report.clear,snap.report);
    ck(id+': rendering keeps the held simulation and attachments unchanged',samePose(snap.before,snap.after)&&snap.paused&&!snap.playing);
    ck(id+': final shader linked and GL clear',snap.shaderLinked&&snap.glError===0);
    const file=id+'.png';await p.screenshot({path:path.join(out,file),timeout:180000});
    const held=await p.evaluate(()=>({signature:__uiSignature800(),paused:GC3D.S.paused,playing:SHOW.playing,smoke:GC3D.S.sim.smoke.length,report:GC3D.vehicleCameraReport800()}));
    ck(id+': screenshot cannot advance the pose or alter the product camera',samePose(held.signature,snap.after)&&held.paused&&!held.playing&&held.smoke===0&&JSON.stringify(held.report)===JSON.stringify(snap.report));
    result.views.push({id,device,...snap,file});save();console.log(id+' captured');
   }
  }finally{result.errors.push(...s.errors);result.blockedWrites+=s.counts.blocked;await s.browser.close();save();}
 }
 ck('no browser errors or attempted live writes',result.errors.length===0&&result.blockedWrites===0,{errors:result.errors,blockedWrites:result.blockedWrites});result.complete=true;save();console.log(JSON.stringify({captures:result.views.length,checks:result.checks.length,errors:result.errors,blockedWrites:result.blockedWrites}));
})().catch(error=>{result.failure=error.stack;save();console.error(error.stack);process.exitCode=1;});
