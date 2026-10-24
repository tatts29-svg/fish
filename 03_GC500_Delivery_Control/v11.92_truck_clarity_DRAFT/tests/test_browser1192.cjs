/* Author: Andrew Fisher. Native viewport, load-envelope, driving and lifecycle checks. */
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const h=await open({pageFile:process.env.PAGE,gl:true,W:390,H:844,mobile:true,dpr:1}),p=h.page,checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(!ok?' '+JSON.stringify(detail):''));}
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.GC3D,null,{timeout:180000});const record=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>{window.finishRender=GC3D.render;GC3D.render=()=>{};GC3D.frame=()=>{};localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.clarity1182','1');localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showvehicle','fencing_truck');showOpen();showPause();});
 await p.waitForFunction(()=>GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending,null,{timeout:180000});
 await p.evaluate(()=>{const G=GC3D,Q=G.S;G.syncRaceCarQuality(Q);Q.shadowOff=true;Q.reflOff=true;Q.bloom=false;Q.o.ss=1;
 window.finishBounds=function(){const cam=Q.cam,T=Q.tune,aspect=Q.cv.clientWidth/Q.cv.clientHeight,fov=G.framedFov(cam.fov,aspect,Q.shotName),shift=/wide|top|heli|hero/.test(Q.shotName)?T.shiftX:T.shiftX*.35,VP=G.matMul(G.persp(fov,aspect,Math.max(.035,T.carS*.05),4000,shift,T.shiftY),G.lookAt(cam.eye,cam.tgt,G.camUp(cam,Q.camRoll))),M=G.matMul(VP,G.raceCarMatrix()),b=G.plantModel('fencing_truck','high').bounds,pts=[];
 for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){const q=[x,y,z,1],v=[0,1,2,3].map(j=>q.reduce((a,n,k)=>a+n*M[k*4+j],0));pts.push([v[0]/v[3],v[1]/v[3],v[3]]);}return {inside:pts.every(v=>v[2]>0&&Math.abs(v[0])<.911&&Math.abs(v[1])<.911),maxX:Math.max(...pts.map(v=>Math.abs(v[0]))),maxY:Math.max(...pts.map(v=>Math.abs(v[1])))};};
 window.finishPose=function(view,s){Q.sim.s=s;Q.sim.lat=0;Q.sim.latV=0;Q.sim.slip=0;Q.sim.air=0;Q.sim.v=0;Q.sim.pitch=0;Q.sim.roll=0;Q.sim.squash=0;delete Q.sim.truckStunt1192;Q.clock=30;Q.camBase=null;Q.camAnchor=null;Q.camYaw=null;Q.camDebug=null;Q.camRoll=0;Q.fovKick=0;if(Q.fw)Q.fw.cam=false;G.pose();Q.forceShot=view;G.camStep(0);};
 });
 let total=0,failures=[],occlusions=[];
 for(const [width,height] of [[360,800],[390,844],[844,390],[1280,800],[1920,1080]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(100);
  const r=await p.evaluate(()=>{const G=GC3D,Q=G.S,failures=[],occlusions=[];const clear=c=>{if(!Q.heightAt)return true;const h=Q.heightAt(c.eye[0],c.eye[2]);if(h>0&&h>c.eye[1]-1)return false;for(let k=1;k<=12;k++){const f=k/12,x=c.tgt[0]+(c.eye[0]-c.tgt[0])*f,z=c.tgt[2]+(c.eye[2]-c.tgt[2])*f,h=Q.heightAt(x,z);if(h>0&&h>c.tgt[1]+(c.eye[1]-c.tgt[1])*f-.8)return false;}return true;};let n=0;for(const view of ['hero','grid','chase','quarter','detail','frontdetail','low','brake','nose','orbit','heli'])for(const shift of [0,.38])for(const at of [.05,.25,.50,.75,.95]){Q.tune.shiftX=shift;finishPose(view,Q.CL.L*at);const b=finishBounds();n++;if(!b.inside)failures.push({view,shift,at,...b});if(clear({eye:Q.camBase.eye.map((n,i)=>n+(Q.camShake?.[i]||0)),tgt:Q.camBase.tgt.map((n,i)=>n+(Q.camShake?.[i]||0)*.30)})&&!clear(Q.cam))occlusions.push({view,shift,at});}return {n,failures,occlusions};});total+=r.n;failures.push(...r.failures.map(f=>({width,height,...f})));occlusions.push(...r.occlusions.map(f=>({width,height,...f})));
 }
 check('whole load fits exterior cameras across five viewport shapes and circuit positions',failures.length===0,{samples:total,failures:failures.slice(0,10)});
 check('framing does not move a clear camera into scenery',occlusions.length===0,{failures:occlusions});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);
 const moving=await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.tune.shiftX=.38;finishPose('detail',Q.CL.L*.2);let lost=0,maxStep=0,prev=null,minRoll=0,maxRoll=0,contactFailure=0;for(let i=0;i<18000;i++){G.step(1/60);G.camStep(1/60);if(!finishBounds().inside)lost++;const bank=ShowcaseTruck1192.state()?.angle||0;minRoll=Math.min(minRoll,bank);maxRoll=Math.max(maxRoll,bank);const extra=Q.truckFit1186.fov;if(prev!==null)maxStep=Math.max(maxStep,Math.abs(extra-prev));prev=extra;}return {lost,minRoll,maxRoll,maxFovStep:maxStep,s:Q.sim.s,finite:Number.isFinite(Q.sim.s),distance:Q.sim.s-Q.CL.L*.2};});check('moving truck stays framed through steering and body movement',moving.lost===0&&moving.finite&&moving.distance>0&&moving.minRoll<-.15&&moving.maxRoll>.15,moving);
 const driver=await p.evaluate(()=>{finishPose('onboard',380);return !GC3D.S.truckFit1186&&GC3D.S.shotName==='onboard';});check('driver view keeps its cab perspective',driver);
 check('vehicle-neutral camera choices use existing controls',await p.locator('#showView').locator('option').allTextContents().then(a=>a.includes('Vehicle follow')&&a.includes('Vehicle detail')&&a.includes('Auto — vehicle cameras')));
 async function render(view,name){
  await p.evaluate(({view,name})=>{const G=GC3D,Q=G.S;G.render=()=>{};Q.tune.shiftX=0;finishPose(view,380);if(name.includes('bank'))Q.sim.truckStunt1192={angle:.48,lead:.48,target:.48};G.setView(view);G.camStep(0);G.render=finishRender;const n=ShowcaseGPU1175.state().submitted;G.render();if(ShowcaseGPU1175.state().submitted!==n+1)throw Error('Requested frame not submitted');window.finishFence=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();},{view,name});
  await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(finishFence,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:240000,polling:200});
  check(name+' render is valid',await p.evaluate(()=>{const gl=GC3D.S.gl;gl.deleteSync(finishFence);return gl.getError()===0&&finishBounds().inside&&(Math.abs(ShowcaseTruck1192.state()?.angle||0)<.1||GC3D.S.truckContact1192?.grounded===2);}));
  await p.screenshot({path:path.join(out,name+'.png'),timeout:180000});
  await p.evaluate(()=>{GC3D.render=()=>{};});
 }
 // Use the real selector so the displayed label and selected camera are checked together.
 await p.locator('#showView').selectOption('detail');await render('detail','phone-detail');
 await p.locator('#showView').selectOption('frontdetail');await render('frontdetail','phone-front-bank');
 await p.setViewportSize({width:1280,height:800});await p.locator('#showView').selectOption('detail');await render('detail','desktop-detail-bank');
 // Native 4K-clarity rendering is retained after the camera correction.
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{GC3D.render=()=>{};localStorage.setItem('gc500.showquality','crisp');GC3D.setQuality('crisp');GC3D.S.shadowOff=false;});
 await p.locator('#showView').selectOption('detail');await render('detail','phone-clarity-bank');
 const clarity=await p.evaluate(()=>({...GC3D.graphicsReport(),nativeFinish:GC3D.S.gl.getUniform(GC3D.S.prog.comp.p,GC3D.S.prog.comp.u.uNative1192)}));check('4K clarity retains native resolution and four-sample smoothing',clarity.resolution[0]===2160&&clarity.samples===4&&clarity.resolutionLocked&&clarity.nativeFinish===1,clarity);
 await p.evaluate(()=>{GC3D.render=()=>{};showVehicleSet('car_vms');GC3D.syncRaceCarQuality(GC3D.S);GC3D.camStep(0);});check('existing towing option clears truck-only fit',await p.evaluate(()=>GC3D.S.vehicle==='car'&&GC3D.S.towVms&&!GC3D.S.truckFit1186));
 await p.evaluate(()=>showClose());check('clean Close',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending));check('shared record unchanged',record===await p.evaluate(()=>JSON.stringify(S)));check('zero page errors and writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));}
console.log(checks.filter(x=>x.ok).length+'/'+checks.length);process.exit(checks.every(x=>x.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
