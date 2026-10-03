/* Author: Andrew Fisher. Smoke-free, held-pose vehicle inspection only.
 * PAGE=... OUT=/private/path [MATCH=/baseline/focus.json] node vehicle800_focus.cjs
 * Product geometry, materials and physics are not patched by this harness.
 * It clears only render smoke, uses explicitly logged inspection cameras, and
 * blocks live writes through the standard read-only harness.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE,out=process.env.OUT,match=process.env.MATCH?JSON.parse(fs.readFileSync(process.env.MATCH,'utf8')):null;
assert(pageFile&&out,'PAGE and private OUT are required');fs.mkdirSync(out,{recursive:true});
const result=process.env.RESUME?JSON.parse(fs.readFileSync(path.join(out,'focus.json'),'utf8')):{author:'Andrew Fisher',candidate:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),matchedTo:match?.candidate||null,
 inspection:'Explicit fixed cameras; real simulation at 120Hz; render smoke cleared after stepping; no product geometry/material alteration; RAF rendering suppressed during setup; adaptive guard disabled only in this inspection',views:[],checks:[],errors:[],blockedWrites:0};
if(process.env.RESUME){assert(result.candidate===crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),'Resume source mismatch');delete result.failure;delete result.lastSnapshot;result.resumed=true;}
const cases=[
 {id:'desktop-car-day',device:'desktop',vehicle:'car',look:'day',quality:'balanced',seconds:12},
 {id:'desktop-car-vms-day',device:'desktop',vehicle:'car_vms',look:'day',quality:'balanced',seconds:15},
 {id:'desktop-car-loo-day',device:'desktop',vehicle:'car_loo',look:'day',quality:'balanced',seconds:15},
 {id:'desktop-forklift-day',device:'desktop',vehicle:'forklift',look:'day',quality:'balanced',seconds:12},
 {id:'desktop-car-night',device:'desktop',vehicle:'car',look:'showcase',quality:'balanced',seconds:2.8,rear:true},
 {id:'phone-boom-day',device:'phone',vehicle:'boom',look:'day',quality:'balanced',seconds:12},
 {id:'phone-scissor-day',device:'phone',vehicle:'scissor',look:'day',quality:'balanced',seconds:12},
 {id:'phone-tractor-day',device:'phone',vehicle:'tractor',look:'day',quality:'balanced',seconds:12},
 {id:'phone-car-wheel-high',device:'phone',vehicle:'car',look:'day',quality:'high',seconds:0,wheel:true},
 {id:'phone-car-restored',device:'phone',vehicle:'car',look:'day',quality:'balanced',seconds:12,restore:true}
];
const save=()=>fs.writeFileSync(path.join(out,'focus.json'),JSON.stringify(result,null,2)+'\n');
const samePose=(a,b)=>{if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b)<1e-9;if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return a===b;const ak=Object.keys(a).filter(k=>a[k]!==undefined),bk=Object.keys(b).filter(k=>b[k]!==undefined);return ak.length===bk.length&&ak.every(k=>samePose(a[k],b[k]));};
const ck=(name,pass,detail)=>{result.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});save();assert(pass,name);};
async function installHelpers(p){await p.evaluate(()=>{
 const G=GC3D;
 window.__focusRender800=window.__focusRender800||G.render;G.render=()=>{};G.noGuard=true;
 window.__focusPause800=()=>{if(SHOW.playing)showPause();const S=G.S;if(S){S.paused=true;S.last=null;S.needsRender=false;}if(LAPS.raf){cancelAnimationFrame(LAPS.raf);LAPS.raf=0;}};
 __focusPause800();
 window.__focusSignature800=()=>{const S=G.S,m=S.sim,T=S.trailer,W=S.sway,O=S.loo;return{clock:S.clock,s:m.s,v:m.v,brake:m.brake,lat:m.lat,slip:m.slip,pitch:m.pitch,roll:m.roll,wheel:m.wheel,wheelR:m.wheelR,steer:m.steer,position:S.pose.pos.slice(),heading:S.pose.hd,trailer:T?{ax:T.ax,az:T.az,hd:T.hd,roll:T.roll,spin:T.spin}:null,sway:W?{r:W.r,p:W.p}:null,loo:O?{a:O.a,arm:O.arm}:null};};
 window.__focusResources800=()=>{const S=G.S,gl=S.gl;return{programLinked:gl.getProgramParameter(S.raceProgram.p,gl.LINK_STATUS),shaderCompiles:(gl.getAttachedShaders(S.raceProgram.p)||[]).map(q=>({compiled:gl.getShaderParameter(q,gl.COMPILE_STATUS),log:gl.getShaderInfoLog(q)||''})),
  sampleSupport:{rgba16f:Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES)||[]),rgba8:Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA8,gl.SAMPLES)||[]),depth:Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.DEPTH24_STENCIL8,gl.SAMPLES)||[])},multisample:{capabilityFix:typeof G.selectSamples802==='function',samples:S.rt&&S.rt.samples||1,valid:!S.rt||!S.rt.msfb||(gl.isFramebuffer(S.rt.msfb)&&gl.isRenderbuffer(S.rt.mscol)&&gl.isRenderbuffer(S.rt.msdepth)),extraAttachmentBytes:S.rt&&S.rt.msfb?S.rt.w*S.rt.h*S.rt.samples*(gl.__gc3dHdr?12:8):0},parts:(S.raceCarParts||[]).length,trailerParts:(S.trailerParts||[]).length,validBuffers:[...(S.raceCarParts||[]),...(S.trailerParts||[])].every(q=>gl.isBuffer(q.batch.vb)&&gl.isBuffer(q.batch.ib)&&gl.isVertexArray(q.batch.vao)),atlasValid:gl.isTexture(S.carAtlas),glError:gl.getError()};};
 window.__focusSet800=spec=>{
  showVehicleSet(spec.vehicle);G.setQuality(spec.quality);G.setLook(spec.look);G.setView('detail');
  G.simReset();const S=G.S;S.trailer=null;S.sway=null;S.loo=null;
  if(!S.__focusLayout800)S.__focusLayout800={x:S.tune.shiftX,y:S.tune.shiftY};
  S.tune.shiftX=S.__focusLayout800.x;S.tune.shiftY=S.__focusLayout800.y;
  for(let i=0;i<Math.round(spec.seconds*120);i++){G.step(1/120);if(S.towVms&&G.trailerStep)G.trailerStep(S);if(G.swayStep)G.swayStep(S);}
  const clearedSmoke=S.sim.smoke.length;S.sim.smoke.length=0;__focusPause800();
  for(let i=0;i<120;i++)G.camStep(1/60);
  const normalUICamera={eye:S.cam.eye.slice(),target:S.cam.tgt.slice(),fov:S.cam.fov,effectiveVerticalFov:G.framedFov(S.cam.fov,S.cv.clientWidth/S.cv.clientHeight,S.shotName)*180/Math.PI,view:S.view,shot:S.shotName,shiftX:S.tune.shiftX,shiftY:S.tune.shiftY,camera800Active:!!(S.camera800&&S.camera800.active)};
  // The new product detail rig may supply its own vertical-FOV interpretation.
  // Controlled MATCH cameras deliberately retain the baseline interpretation.
  if(S.camera800)S.camera800.active=false;
  S.camRoll=0;S.tune.shiftX=0;S.tune.shiftY=0;S.view='detail';S.forceShot='detail';S.shotName='detail';
  S.cam={eye:[S.pose.pos[0]+3,S.pose.pos[1]+2,S.pose.pos[2]+3],tgt:S.pose.pos.slice(),fov:36};
  G.syncRaceCarQuality(S);
  // Prime existing trailer buffers without drawing a GPU frame. Then intercept
  // the actual draw transforms, including wheel steering/spin and plant sway.
  const gl=S.gl,depthWrite=gl.getParameter(gl.DEPTH_WRITEMASK),drawElements=gl.drawElements,drawArrays=gl.drawArrays,drawInstanced=gl.drawArraysInstanced;
  gl.drawElements=()=>{};gl.drawArrays=()=>{};gl.drawArraysInstanced=()=>{};
  const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);let points=[],drawMatrices=[];
  try{
   G.drawRaceCar(S,identity,[40,100]);
   const level=spec.quality==='balanced'?'balanced':'high',model=S.vehicle==='car'?G.raceCarModel(level):G.plantModel(S.vehicle,level);
   const sourceKey=q=>JSON.stringify([q.name,q.material,q.wheel||null,q.sway||null,q.door||null,q.arm||null,!!q.vmsFace]);
   const lookup=parts=>{const map=new Map();parts.forEach((q,index)=>{const key=sourceKey(q);if(!map.has(key))map.set(key,[]);map.get(key).push({part:q,index});});return map;};
   const sources=lookup(model.parts.concat(S.vehicle==='car'?G.raceCarDecals():[]));
   const trailerSources=lookup(S.towVms?(S.towKind==='loo'?G.looModel(level):G.vmsModel(level)).parts:[]);
   let matrix=identity;const uniform=gl.uniformMatrix4fv,restores=[];
   gl.uniformMatrix4fv=function(location,transpose,value){if(location===S.raceProgram.u.uModel)matrix=Array.from(value);return uniform.call(this,location,transpose,value);};
   try{
    for(const [list,lookup]of [[S.raceCarParts,sources],[S.towVms?S.trailerParts||[]:[],trailerSources]])for(const q of list){const found=(lookup.get(sourceKey(q))||[]).shift();if(!found)throw Error('Missing exact source part '+sourceKey(q));const source=found.part;const original=q.batch.draw;restores.push(()=>{q.batch.draw=original;});q.batch.draw=function(){
     drawMatrices.push({role:list===S.raceCarParts?'car':'trailer',name:q.name,material:q.material,wheel:q.wheel||null,sway:q.sway||null,door:q.door||null,arm:q.arm||null,sourceIndex:found.index,matrix:matrix.slice()});
     const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<source.vertices.length;i+=8)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],source.vertices[i+k]);hi[k]=Math.max(hi[k],source.vertices[i+k]);}
     for(const x of [lo[0],hi[0]])for(const y of [lo[1],hi[1]])for(const z of [lo[2],hi[2]])points.push([matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]]);
    };}
    G.drawRaceCar(S,identity,[40,100]);
   }finally{restores.forEach(f=>f());gl.uniformMatrix4fv=uniform;}
  }finally{gl.drawElements=drawElements;gl.drawArrays=drawArrays;gl.drawArraysInstanced=drawInstanced;gl.depthMask(depthWrite);}
  if(!points.length||points.some(p=>p.some(v=>!Number.isFinite(v))))throw Error('No finite animated vehicle bounds');
  const norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);},dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const uiAspect=S.cv.clientWidth/S.cv.clientHeight,uiVP=G.matMul(G.persp(normalUICamera.effectiveVerticalFov*Math.PI/180,uiAspect,.035,4000,normalUICamera.shiftX*.35,normalUICamera.shiftY),G.lookAt(normalUICamera.eye,normalUICamera.target,[0,1,0]));
  const uiPoints=points.map(p=>{const v=[...p,1],q=[0,1,2,3].map(k=>v.reduce((n,x,i)=>n+x*uiVP[i*4+k],0));return[q[0]/q[3],q[1]/q[3],q[3]];});
  normalUICamera.framing={maxX:Math.max(...uiPoints.map(p=>Math.abs(p[0]))),maxY:Math.max(...uiPoints.map(p=>Math.abs(p[1]))),minDepth:Math.min(...uiPoints.map(p=>p[2])),inspectionCamera:false};
  const worldAxis=a=>a.length===2?[a[0],0,a[1]]:a.slice(),forward=worldAxis(S.pose.fwd),side=worldAxis(S.pose.rt);
  let target=[0,1,2].map(k=>(Math.min(...points.map(p=>p[k]))+Math.max(...points.map(p=>p[k])))/2),direction=norm(forward.map((v,k)=>v*(spec.rear?-.70:.68)+side[k]*.65+(k===1?.43:0))),fov=36;
  if(spec.vehicle==='car_vms'||spec.vehicle==='car_loo')direction=norm(forward.map((v,k)=>v*.68-side[k]*.65+(k===1?.43:0)));
  if(spec.wheel){const M=G.raceCarMatrix(),v=[.60,.145,.435];target=[0,1,2].map(k=>M[k]*v[0]+M[k+4]*v[1]+M[k+8]*v[2]+M[k+12]);direction=norm(forward.map((v,k)=>v*.26+side[k]+(k===1?.22:0)));points=[];const radius=S.tune.carS*.25;for(const x of [-radius,radius])for(const y of [-radius,radius])for(const z of [-radius,radius])points.push([target[0]+x,target[1]+y,target[2]+z]);}
  const aspect=S.cv.clientWidth/S.cv.clientHeight,vfov=G.framedFov(fov,aspect,'detail'),right=norm(cross(direction.map(v=>-v),[0,1,0])),up=cross(right,direction.map(v=>-v)),tan=Math.tan(vfov/2);
  let distance=0;for(const p of points){const q=sub(p,target);distance=Math.max(distance,dot(q,direction)+Math.max(Math.abs(dot(q,right))/(tan*aspect*.74),Math.abs(dot(q,up))/(tan*.74)));}
  const camera=spec.matchCamera||{eye:target.map((v,k)=>v+direction[k]*(distance+.08)),target,fov};
  if([forward,side,direction,right,up,camera.eye,camera.target].some(a=>a.length!==3||a.some(v=>!Number.isFinite(v)))||!Number.isFinite(camera.fov))throw Error('Non-finite inspection camera axis '+JSON.stringify({forward,side,direction,right,up,target,distance,camera,aspect,vfov,tan,cv:{w:S.cv.clientWidth,h:S.cv.clientHeight},pose:S.pose}));
  S.cam={eye:camera.eye.slice(),tgt:camera.target.slice(),fov:camera.fov};S.camRoll=0;
  const f=norm(sub(S.cam.tgt,S.cam.eye)),r=norm(cross(f,[0,1,0])),u=cross(r,f),effective=G.framedFov(S.cam.fov,aspect,'detail'),tt=Math.tan(effective/2),screen=points.map(p=>{const d=sub(p,S.cam.eye),z=dot(d,f);return[dot(d,r)/(z*tt*aspect),dot(d,u)/(z*tt),z];});
  const maxX=Math.max(...screen.map(p=>Math.abs(p[0]))),maxY=Math.max(...screen.map(p=>Math.abs(p[1]))),minDepth=Math.min(...screen.map(p=>p[2]));
  const cameraFixture=JSON.parse(JSON.stringify({clock:S.clock,drawMatrices,worldBuildings:(S.architecture781Source||[]).map(b=>({P:b.p.map(p=>S.toWorld(p)),h:b.h})),tune:S.tune,pose:S.pose,sim:Object.fromEntries(Object.entries(S.sim).filter(([k,v])=>typeof v!=='function'&&(!v||typeof v!=='object'))),trailer:S.trailer,sway:S.sway,loo:S.loo,CL:{p:S.CL.p,n:S.CL.n,L:S.CL.L},outer:S.outer,inner:S.inner,corridor:S.corridor794?{active:S.corridor794.active,outer:S.corridor794.outer,inner:S.corridor794.inner}:null,vehicle:S.vehicle,vehicleKey:S.vehicleKey,towVms:S.towVms,towKind:S.towKind}));
  const before=__focusSignature800();window.__focusRender800();__focusPause800();
  return{clearedSmoke,camera,cameraFixture,normalUICamera,effectiveVerticalFov:effective*180/Math.PI,framing:{maxX,maxY,minDepth,points:points.length,scope:spec.wheel?'front wheel inspection envelope':'actual animated part bounding boxes, including trailer'},before,after:__focusSignature800(),resources:__focusResources800(),paused:S.paused,showPlaying:SHOW.playing,vehicle:S.vehicle,vehicleKey:S.vehicleKey,tow:!!S.towVms,towKind:S.towKind,look:S.look.name,graphics:G.graphicsReport(),carStats:S.raceCarStats,canvas:{width:S.cv.width,height:S.cv.height,cssWidth:S.cv.clientWidth,cssHeight:S.cv.clientHeight,imageRendering:getComputedStyle(S.cv).imageRendering},material:G.vehicleMaterial800||null};
 };
 });}
async function qualityCheck(p,vehicle){return p.evaluate(vehicle=>{
 const G=GC3D,S=G.S,gl=S.gl,results=[];
 for(const quality of ['high','balanced']){const old=(S.raceCarParts||[]).map(q=>[q.batch.vb,q.batch.ib,q.batch.vao]);G.setQuality(quality);G.syncRaceCarQuality(S);__focusPause800();results.push({quality,stats:S.raceCarStats,oldReleased:old.every(a=>!gl.isBuffer(a[0])&&!gl.isBuffer(a[1])&&!gl.isVertexArray(a[2])),valid:S.raceCarParts.every(q=>gl.isBuffer(q.batch.vb)&&gl.isBuffer(q.batch.ib)&&gl.isVertexArray(q.batch.vao)),gl:gl.getError()});}
 return{vehicle,results};
 },vehicle);}
(async()=>{
 for(const device of ['desktop','phone']){
  if(process.env.ONLY&&!cases.some(q=>q.device===device&&process.env.ONLY.split(',').includes(q.id)))continue;
  const phone=device==='phone',s=await open({pageFile,W:phone?390:1280,H:phone?844:800,mobile:phone,dpr:1,gl:true}),p=s.page;
  try{
   p.setDefaultTimeout(180000);
   p.on('console',m=>{if(m.type()==='error')result.errors.push(m.text().slice(0,300));});
   await p.waitForFunction(()=>typeof showOpen==='function'&&SYNC.status==='live',null,{timeout:240000});
   await p.evaluate(()=>{localStorage.setItem('gc500.showview','detail');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showback','circuit3d_day');GC3D.noGuard=true;showOpen();if(SHOW.playing)showPause();if(GC3D.S)GC3D.S.paused=true;window.__focusRender800=GC3D.render;GC3D.render=()=>{};});
   // The inherited mount loop attaches and lays out its canvas on its first RAF.
   // Allow that callback with rendering suppressed before cancelling subsequent RAFs.
   await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl&&GC3D.S.cv.isConnected&&GC3D.S.cv.clientWidth>0&&GC3D.S.cv.clientHeight>0);
   await installHelpers(p);
   for(const spec of cases.filter(q=>q.device===device&&(!process.env.ONLY||process.env.ONLY.split(',').includes(q.id)))){
    if(process.env.RESUME&&result.views.some(v=>v.id===spec.id))continue;
    if(spec.restore){
     const supported=await p.evaluate(()=>{const S=GC3D.S;__focusPause800();window.__focusOldScene800=S;window.__focusLoss800=S.gl.getExtension('WEBGL_lose_context');if(!__focusLoss800)return false;__focusLoss800.loseContext();return true;});
     ck(device+': context-loss extension available',supported);
     await p.waitForFunction(()=>__focusOldScene800.lost,null,{polling:100,timeout:30000});
     await p.evaluate(()=>__focusLoss800.restoreContext());
     await p.waitForFunction(()=>GC3D.S&&GC3D.S!==__focusOldScene800&&GC3D.S.gl&&!GC3D.S.lost,null,{polling:100,timeout:60000});
     await p.evaluate(()=>{GC3D.S.paused=true;if(!LAPS.raf)LAPS.raf=requestAnimationFrame(window.lapsFrame);});
     await p.waitForFunction(()=>GC3D.S.cv.isConnected&&GC3D.S.cv.clientWidth>0&&GC3D.S.cv.clientHeight>0,null,{polling:100,timeout:60000});
     await installHelpers(p);ck(device+': context restore mounts a fresh scene',await p.evaluate(()=>GC3D.S!==__focusOldScene800&&GC3D.S.gl!==__focusOldScene800.gl));
    }
    const previous=match?.views.find(q=>q.id===spec.id);if(match)assert(previous,'MATCH lacks '+spec.id);
    const snap=await p.evaluate(spec=>__focusSet800(spec),{...spec,matchCamera:previous?.camera});
    result.lastSnapshot={id:spec.id,...snap};save();
    ck(spec.id+': shader links, parts/atlas valid and GL clear',snap.resources.programLinked&&snap.resources.shaderCompiles.every(q=>q.compiled)&&snap.resources.validBuffers&&snap.resources.atlasValid&&snap.resources.multisample.valid&&snap.resources.glError===0,snap.resources);
    if(snap.resources.multisample.capabilityFix&&snap.resources.sampleSupport.rgba16f.includes(4)&&snap.resources.sampleSupport.depth.includes(4))ck(spec.id+': native requested quality uses valid supported 4x attachments',snap.resources.multisample.samples===4&&snap.resources.multisample.valid,snap.resources.multisample);
    ck(spec.id+': requested selection and lighting active',snap.vehicle===(spec.vehicle.startsWith('car')?'car':spec.vehicle)&&snap.tow===(spec.vehicle==='car_vms'||spec.vehicle==='car_loo')&&snap.look===spec.look);
    ck(spec.id+': held pose remains paused and unchanged through render',snap.paused&&!snap.showPlaying&&samePose(snap.before,snap.after));
    ck(spec.id+': complete requested subject fits the canvas',snap.framing.maxX<.94&&snap.framing.maxY<.94&&snap.framing.minDepth>0,snap.framing);
    if(previous)ck(spec.id+': baseline pose within 1e-9 and exact camera reproduced',samePose(snap.before,previous.before)&&JSON.stringify(snap.camera)===JSON.stringify(previous.camera));
    const file=spec.id+'.png';await p.screenshot({path:path.join(out,file),timeout:180000});
    const held=await p.evaluate(()=>({pose:__focusSignature800(),paused:GC3D.S.paused,playing:SHOW.playing,smoke:GC3D.S.sim.smoke.length}));
    ck(spec.id+': screenshot cannot advance simulation or reintroduce smoke',held.paused&&!held.playing&&held.smoke===0&&samePose(held.pose,snap.after));
    result.views.push({...spec,...snap,file});save();console.log(spec.id+' captured');
    if(!spec.wheel&&!spec.restore&&spec.look==='day'){const q=await qualityCheck(p,spec.vehicle);ck(spec.id+': High/Balanced switches replace and release old model buffers',q.results.every(x=>x.oldReleased&&x.valid&&x.gl===0),q);}
   }
   const cleanup=await p.evaluate(()=>{const G=GC3D,S=G.S,gl=S.gl,targets=[S.rt,S.b1,S.b2,S.c1,S.c2].filter(Boolean),entries=t=>[['framebuffer',t.fb],['framebuffer',t.msfb],['renderbuffer',t.rb],['renderbuffer',t.mscol],['renderbuffer',t.msdepth],['texture',t.tex],['texture',t.depthTex]].filter(q=>q[1]),gone=([kind,h])=>kind==='framebuffer'?!gl.isFramebuffer(h):kind==='renderbuffer'?!gl.isRenderbuffer(h):!gl.isTexture(h),handles=targets.flatMap(entries),released=[],free=G.freeTarget;
    G.freeTarget=function(context,t){const refs=t?entries(t):[],value=free.apply(this,arguments);if(targets.includes(t))released.push({handles:refs.length,deletedBeforeContextLoss:!gl.isContextLost()&&refs.every(gone)});return value;};
    try{showClose();}finally{G.freeTarget=free;}
    const contextLost=gl.isContextLost(),error=gl.getError();return{handles:handles.length,releasedTargets:released.length,expectedTargets:targets.length,deletedHandles:released.reduce((n,r)=>n+r.handles,0),releasedBeforeLoss:released.every(r=>r.deletedBeforeContextLoss),released:handles.every(gone),contextLost,gl:error,expectedContextLossCode:gl.CONTEXT_LOST_WEBGL};});
   ck(device+': closing explicitly deletes every colour/depth/multisample target before intentional context loss',cleanup.handles>0&&cleanup.deletedHandles===cleanup.handles&&cleanup.releasedTargets===cleanup.expectedTargets&&cleanup.releasedBeforeLoss&&cleanup.released&&(cleanup.gl===0||cleanup.contextLost&&cleanup.gl===cleanup.expectedContextLossCode),cleanup);
  }finally{result.errors.push(...s.errors);result.blockedWrites+=s.counts.blocked;await s.browser.close();save();}
 }
 ck('no browser/shader errors or attempted live writes',result.errors.length===0&&result.blockedWrites===0,{errors:result.errors,blockedWrites:result.blockedWrites});
 result.complete=true;save();console.log(JSON.stringify({captures:result.views.length,checks:result.checks.length,errors:result.errors,blockedWrites:result.blockedWrites}));
})().catch(e=>{result.failure=e.stack;save();console.error(e.stack);process.exitCode=1;});
