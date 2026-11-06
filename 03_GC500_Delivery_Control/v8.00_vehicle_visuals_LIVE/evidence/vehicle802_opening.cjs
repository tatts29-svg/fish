/* Author: Andrew Fisher. Read-only product opening, smoke and circuit seam review.
 * PAGE=... OUT=/private/path node vehicle802_opening.cjs
 * Real fixed-step G.frame, normal product cameras and unchanged smoke/physics.
 * RAF is cancelled after canvas attachment; only intermediate GPU draws are skipped.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE,out=process.env.OUT;
assert(pageFile&&out,'PAGE and private OUT are required');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const result={author:'Andrew Fisher',candidate:{path:path.resolve(pageFile),sha256:sha(fs.readFileSync(pageFile))},
 method:'Normal Circuit tour opening and Driver view; real fixed-step G.frame; no smoke deletion, pose injection or inspection camera. Balanced quality held manually, adaptive guard disabled for reproducible stills. Intermediate GPU draws skipped; this is not an FPS benchmark.',
 checks:[],views:[],errors:[],blockedWrites:0};
const save=()=>fs.writeFileSync(path.join(out,'opening.json'),JSON.stringify(result,null,2)+'\n');
const check=(name,pass,detail)=>{result.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});save();assert(pass,name);};
async function capture(p,device,id,target){
 const snap=await p.evaluate(target=>{
  const G=GC3D,S=G.S;
  G.render=()=>{};S.paused=false;let steps=0;
  const pending=()=>target.section!==undefined?S.sim.s-S.gridS<target.section*S.CL.L/12:S.clock+1e-7<target.seconds;
  while(pending()&&steps++<36000){window.__openingTime802+=1000/60;G.frame(window.__openingTime802);}
  if(pending())throw Error('Fixed-step advance exceeded its bounded frame budget');
  if(target.settle)for(let i=0;i<target.settle;i++){window.__openingTime802+=1000/60;G.frame(window.__openingTime802);}
  S.paused=true;
  if(target.view){G.setView(target.view);document.getElementById('showView').value=target.view;
   for(let i=0;i<90;i++){window.__openingTime802+=1000/60;G.frame(window.__openingTime802);}}
  const before={clock:S.clock,s:S.sim.s,smoke:S.sim.smoke.length};
  G.camStep(0);window.__openingRender802();G.showcase794.paint(true);
  const gl=S.gl,parts=[...(S.raceCarParts||[]),...(S.trailerParts||[])],cam=G.cameraReport794();
  return{steps,before,after:{clock:S.clock,s:S.sim.s,smoke:S.sim.smoke.length},paused:S.paused,showPlaying:SHOW.playing,
   view:S.view,shot:S.shotName,camera:cam,eye:S.cam.eye.slice(),target:S.cam.tgt.slice(),fov:S.cam.fov,roll:S.camRoll||0,
   pose:{position:S.pose.pos.slice(),heading:S.pose.hd,s:S.sim.s,speed:S.sim.v,slip:S.sim.slip,air:S.sim.air,burn:S.sim.burn},
   smoke:{count:S.sim.smoke.length,first:S.sim.smoke[0]||null,last:S.sim.smoke.at(-1)||null},clock:S.clock,
   progress:(S.sim.s-S.gridS)/S.CL.L,playback:G.playback794.report(),corridor:G.corridorReport794(),
   graphics:G.graphicsReport(),canvas:{cssWidth:S.cv.clientWidth,cssHeight:S.cv.clientHeight,width:S.cv.width,height:S.cv.height,dpr:devicePixelRatio},
   resources:{linked:!!S.raceProgram&&gl.getProgramParameter(S.raceProgram.p,gl.LINK_STATUS),parts:parts.length,
    buffersValid:parts.length>0&&parts.every(q=>gl.isBuffer(q.batch.vb)&&gl.isBuffer(q.batch.ib)&&gl.isVertexArray(q.batch.vao)),
    context:gl.getContextAttributes(),glError:gl.getError()},
   finite:S.cam.eye.concat(S.cam.tgt,[S.cam.fov]).every(Number.isFinite),diagnosticCamera:!!S.camDebug};
 },target);
 check(device+' '+id+': finite product camera and coherent graphics',snap.finite&&!snap.diagnosticCamera&&snap.resources.linked&&snap.resources.buffersValid&&snap.resources.glError===0&&snap.corridor.enabled&&!snap.corridor.failed,snap.resources);
 check(device+' '+id+': drawing preserves held physics and smoke',snap.paused&&!snap.showPlaying&&JSON.stringify(snap.before)===JSON.stringify(snap.after),{before:snap.before,after:snap.after});
 check(device+' '+id+': product camera is clear',snap.camera.obstructionClear,snap.camera);
 if(target.view)check(device+' '+id+': requested view active',snap.view===target.view&&snap.shot===target.view);
 else check(device+' '+id+': Circuit tour remains selected',snap.view==='tour');
 if(target.section!==undefined)check(device+' '+id+': reached the requested route section',snap.progress>=target.section/12&&snap.progress<target.section/12+.08,snap.progress);
 const file=device+'-'+id+'.png';await p.screenshot({path:path.join(out,file),timeout:180000});
 result.views.push({device,id,...snap,file,sha256:sha(fs.readFileSync(path.join(out,file)))});save();
}
async function run(phone){
 const device=phone?'phone':'desktop',s=await open({pageFile,W:phone?390:1280,H:phone?844:800,mobile:phone,dpr:1,gl:true}),p=s.page;
 try{
  p.setDefaultTimeout(180000);p.on('console',m=>{if(m.type()==='error')result.errors.push({device,message:m.text().slice(0,500)});});
  await p.waitForFunction(()=>typeof showOpen==='function'&&GC3D.showcase794&&SYNC.status==='live',null,{timeout:240000});
  await p.evaluate(()=>{
   localStorage.setItem('gc500.showview','tour');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showback','circuit3d_day');
   GC3D.noGuard=true;showOpen();if(SHOW.playing)showPause();if(GC3D.S)GC3D.S.paused=true;
   window.__openingRender802=GC3D.render;GC3D.render=()=>{};
  });
  await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl&&GC3D.S.cv.isConnected&&GC3D.S.cv.clientWidth>0&&GC3D.S.cv.clientHeight>0);
  await p.evaluate(()=>{
   if(SHOW.playing)showPause();if(LAPS.raf){cancelAnimationFrame(LAPS.raf);LAPS.raf=0;}
   const G=GC3D;showVehicleSet('car');G.setQuality('balanced');G.S.qualityChoice='manual';G.setView('tour');document.getElementById('showView').value='tour';
   G.simReset();G.S.paused=true;G.S.last=null;G.S.needsRender=false;window.__openingTime802=0;G.camStep(0);
  });
  await capture(p,device,'opening-00',{seconds:0});
  await capture(p,device,'opening-launch',{seconds:4.8});
  await capture(p,device,'opening-road',{seconds:9});
  await capture(p,device,'tour-03',{section:3,settle:78});
  await capture(p,device,'driver-road',{seconds:0,view:'onboard'});
  check(device+': ordinary opening generates visible smoke particles',result.views.some(q=>q.device===device&&q.id.startsWith('opening-')&&q.smoke.count>0));
 }finally{
  result.errors.push(...s.errors.map(message=>({device,message})));result.blockedWrites+=s.counts.blocked;await s.browser.close();save();
 }
}
(async()=>{try{
 for(const phone of process.env.PHONE_FIRST?[true,false]:[false,true])await run(phone);
 check('no page or console errors and no record writes',result.errors.length===0&&result.blockedWrites===0,{errors:result.errors,blockedWrites:result.blockedWrites});
 result.complete=true;console.log(JSON.stringify({views:result.views.length,checks:result.checks.length,errors:result.errors.length,blockedWrites:result.blockedWrites}));
}catch(e){result.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{save();}})();
