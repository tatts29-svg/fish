// Author: Andrew Fisher. Read-only runtime checks of exact car render controls.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
(async()=>{
 const phone=process.env.MOB==='1',s=await open({pageFile:process.env.PAGE,gl:true,W:phone?390:960,H:phone?844:720,mobile:phone,dpr:phone?2:1,
 init:"localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showview','hero');"}),p=s.page;
 const result={author:'Andrew Fisher',phone,scope:'Read-only software-rendered controls; no physical-device FPS claim'};
 try{
  await p.evaluate(()=>{showOpen();if(SHOW.playing)showPause();});
  await p.waitForFunction(()=>GC3D.startupReport971().shown,null,{timeout:60000});
  result.controls=await p.evaluate(()=>{
   const G=GC3D,scene=G.S,gl=scene.gl,P=scene.raceProgram;G.noGuard=true;
   const count=()=>{gl.useProgram(P.p);G.bindRaceReflections(scene,gl,P.u);return gl.getUniform(P.p,P.u.uReflectCount);};
   const first=count();scene.reflOff=true;const disabled=count(),disabledReport=G.graphicsReport();G.setQuality('balanced');const restored=count();
   const before={scale:scene.o.ss,shadows:scene.shadowOff,bloom:scene.bloom,clock:scene.clock,pose:JSON.stringify(scene.pose)};
   const rung=G.stepDown(),after={scale:scene.o.ss,shadows:scene.shadowOff,bloom:scene.bloom,clock:scene.clock,pose:JSON.stringify(scene.pose),count:count()};
   G.setQuality('high');G.syncRaceCarQuality(scene);const high={...scene.raceCarStats,reflections:count()};
   G.setQuality('balanced');G.syncRaceCarQuality(scene);const balanced={...scene.raceCarStats,reflections:count()};
   const oldFps=scene.fps,oldScale=scene.o.ss;scene.fps=35;scene.o.ss=.60;scene.reflOff=false;const restoredBudget=G.shouldReduceQuality792(scene);scene.reflOff=true;const exhaustedBudget=G.shouldReduceQuality792(scene);scene.fps=oldFps;scene.o.ss=oldScale;G.setQuality('balanced');
   const native=JSON.stringify(S),t=JSON.stringify(scene.sim);
   G.setVehicle('car_vms');G.setVehicle('car_loo');G.setVehicle('car');
   const modeRoundTrip=G.S===scene&&G.S.vehicle==='car';
   const nativeUnchanged=JSON.stringify(S)===native,simulationUnchanged=JSON.stringify(scene.sim)===t;
   const ext=gl.getExtension('EXT_texture_filter_anisotropic');gl.bindTexture(gl.TEXTURE_2D,scene.carAtlas);
   return {restoredBudget,exhaustedBudget,first,disabled,disabledReport,restored,before,rung,after,high,balanced,modeRoundTrip,nativeUnchanged,simulationUnchanged,anisotropy:ext?gl.getTexParameter(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT):null,glError:gl.getError()};
  });
  const r=result.controls;assert.equal(r.first,4);assert.equal(r.disabled,0);assert.equal(r.disabledReport.reflections,false);assert.equal(r.restored,4);
  assert(r.restoredBudget&&!r.exhaustedBudget);assert.equal(r.rung,'reflections off');assert.equal(r.after.count,0);assert.deepEqual({...r.after,count:undefined},{...r.before,count:undefined});
  assert.equal(r.high.parts,28);assert.equal(r.high.triangles,152006);assert.equal(r.high.reflections,8);
  assert.equal(r.balanced.parts,28);assert.equal(r.balanced.triangles,86862);assert.equal(r.balanced.reflections,4);
  assert(r.modeRoundTrip&&r.nativeUnchanged&&r.simulationUnchanged);assert.equal(r.glError,0);
  if(r.anisotropy!==null)assert(r.anisotropy>=1&&r.anisotropy<=4);
  if(process.env.SHOT){await p.evaluate(()=>{const S=GC3D.S;S.distK=1;S.shiftGoal=0;S.tune.shiftX=0;GC3D.renderAt(5,'frontdetail');S.paused=true;S.needsRender=false;});await p.screenshot({path:process.env.SHOT,timeout:60000});}
  await p.evaluate(()=>showClose());assert(await p.evaluate(()=>!SHOW.open&&!GC3D.S));
  result.errors=s.errors;result.counts=s.counts;assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);result.pass=true;
  if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
