/* Author: Andrew Fisher. v7.94 — show the complete existing circuit.
 * Camera-only route sampling. No physics, source geometry, driving line or RNG changes.
 * Static route bounds are cached once; camera work uses bounded scalar/vector operations.
 */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.camera794)return;
const originalStep=G.camStep,originalView=G.setView,originalFov=G.framedFov;
const RAD=Math.PI/180,MAIN=new Set(['tour','auto','chase','onboard','hero','heli','top','wide']);
const TOUR=['chase','onboard','heli','chase','onboard','heli','chase','hero','heli','onboard','chase','wide'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]);
const scale=(a,k)=>a.map(x=>x*k),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>{const n=Math.hypot(...a);return n>1e-9?scale(a,1/n):[0,0,1];};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const lerp=(a,b,t)=>a.map((x,i)=>mix(x,b[i],t));
const copy=r=>({eye:r.eye.slice(),tgt:r.tgt.slice(),fov:r.fov});
const metres=S=>(S.pack&&S.pack.mPerPt)||G.M_PER_PT||5.937552372855356;
const reducedMotion=S=>!!(S.reducedMotion||(typeof motionOff==='function'&&motionOff()));
const aspect=S=>Math.max(.2,(S.cv&&S.cv.clientWidth||window.innerWidth||1280)/(S.cv&&S.cv.clientHeight||window.innerHeight||720));
const forward=r=>norm(sub(r.tgt,r.eye));
function basis(r){const f=forward(r),right=norm(cross(f,[0,1,0]));return {f,right,up:cross(right,f)};}
function projection(r,p,a){const b=basis(r),v=sub(p,r.eye),z=dot(v,b.f),t=Math.tan(r.fov*RAD/2);return {x:dot(v,b.right)/(z*t*a),y:dot(v,b.up)/(z*t),z};}
function route(S){
 let C=S.routeCamera794;if(C&&C.CL===S.CL)return C;
 const points=S.CL.p.slice(0,S.CL.n||S.CL.p.length),pad=Math.max(...points.map(p=>p[2]||0),1)*1.2;
 const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
 let xx=0,zz=0,xz=0;for(const p of points){const x=p[0]-cx,z=p[1]-cz;xx+=x*x;zz+=z*z;xz+=x*z;}
 const axis=.5*Math.atan2(2*xz,xx-zz),major=[Math.cos(axis),0,Math.sin(axis)],portrait=aspect(S)<1;
 // One orientation per scene: align the principal route axis with the viewport's
 // long axis at first use, then retain that north/south relationship on resize.
 const right=portrait?[-major[2],0,major[0]]:major;
 const y=S.tune.deckH||0;
 C={CL:S.CL,centre:[cx,y,cz],points:points.map(p=>[p[0],y,p[1]]),right,pad,portraitOrientation:portrait,principalAxisRadians:axis};
 S.routeCamera794=C;return C;
}
function path(S,s){const p=S.CL.at(s);return [p[0],S.tune.deckH||0,p[1]];}
function tangent(S,s){const d=2/metres(S);return norm(sub(path(S,s+d),path(S,s-d)));}
function collisions(S){
 const source=S.architecture781Source;if(!source||!source.length||!S.toWorld)return null;
 let C=S.cameraCollision794;if(C&&C.source===source)return C;
 const cell=24/metres(S),margin=1.6/metres(S),grid=new Map();
 for(const b of source){
  if(!b.p||b.p.length<3||!Number.isFinite(b.h))continue;
  const P=b.p.map(p=>S.toWorld(p));if(P.some(p=>!p.every(Number.isFinite)))continue;
  const xs=P.map(p=>p[0]),zs=P.map(p=>p[1]),item={P,h:b.h};
  for(let x=Math.floor((Math.min(...xs)-margin)/cell);x<=Math.floor((Math.max(...xs)+margin)/cell);x++)
   for(let z=Math.floor((Math.min(...zs)-margin)/cell);z<=Math.floor((Math.max(...zs)+margin)/cell);z++){
    const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(item);
   }
 }
 C={source,cell,margin,grid};S.cameraCollision794=C;return C;
}
function height(S,p){
 const C=collisions(S);if(!C)return S.heightAt?Math.max(0,S.heightAt(p[0],p[2])||0):0;
 const candidates=C.grid.get(Math.floor(p[0]/C.cell)+','+Math.floor(p[2]/C.cell))||[];let high=0;
 for(const b of candidates){let inside=false,near=false;const P=b.P;
  for(let i=0,j=P.length-1;i<P.length;j=i++){
   const a=P[j],c=P[i];
   if((a[1]>p[2])!==(c[1]>p[2])&&p[0]<(c[0]-a[0])*(p[2]-a[1])/(c[1]-a[1])+a[0])inside=!inside;
   const dx=c[0]-a[0],dz=c[1]-a[1],l=dx*dx+dz*dz,t=l>0?clamp(((p[0]-a[0])*dx+(p[2]-a[1])*dz)/l,0,1):0;
   if((p[0]-a[0]-dx*t)**2+(p[2]-a[1]-dz*t)**2<C.margin*C.margin)near=true;
  }
  if((inside||near)&&b.h>high)high=b.h;
 }
 return high;
}
function clearEye(S,p){return height(S,p)<=0||p[1]>height(S,p)+1.2/metres(S);}
function clearRay(S,r){
 if(!clearEye(S,r.eye))return false;
 if(r.whole)return true; // An overview target is the bounds centre, which may lie inside a city block.
 const d=Math.hypot(...sub(r.eye,r.tgt)),steps=clamp(Math.ceil(d/.65),12,64),margin=.55/metres(S);
 for(let k=1;k<=steps;k++){
  const p=lerp(r.tgt,r.eye,k/steps),h=height(S,p);
  if(h>0&&h>p[1]-margin)return false;
 }
 return true;
}
function fullView(S,name){
 const C=route(S),a=aspect(S),key=name+':'+a.toFixed(6);
 if(C.overview&&C.overview[key])return Object.assign({},C.overview[key],copy(C.overview[key]));
 const fov=name==='top'?44:42,groundBack=cross(C.right,[0,1,0]),slope=name==='top'?.16:1/.85,back=norm([groundBack[0]*slope,1,groundBack[2]*slope]);
 const f=scale(back,-1),right=norm(cross(f,[0,1,0])),up=cross(right,f),tan=Math.tan(fov*RAD/2);
 let distance=1;
 for(const p of C.points){const v=sub(p,C.centre),z=dot(v,back);distance=Math.max(distance,z+(Math.abs(dot(v,right))+C.pad)/(tan*a*.86),z+(Math.abs(dot(v,up))+C.pad)/(tan*.80));}
 const eye=add(C.centre,scale(back,distance));eye[1]=Math.max(eye[1],height(S,eye)+8/metres(S));
 const result={eye,tgt:C.centre.slice(),fov,whole:true,following:false,lookAheadM:0};
 // The complete fit runs once per view/aspect, not at the physics tick rate.
 // Keep a bounded cache even while the browser is continuously resized.
 if(!C.overview||Object.keys(C.overview).length>6)C.overview={};C.overview[key]=result;
 return Object.assign({},result,copy(result));
}
function wanted(S,name){
 if(name==='top'||name==='wide')return fullView(S,name);
 const M=metres(S),m=S.sim,car=S.pose.pos,s=m.s,speed=clamp((m.v||0)*M/Math.max(.1,S.tune.tc||1),0,70);
 const lookM=name==='onboard'?clamp(10+speed*.60,12,43):name==='heli'?clamp(30+speed*.80,35,80):clamp(9+speed*.36,10,28);
 const far=path(S,s+lookM/M),near=path(S,s+Math.min(lookM*.42,10)/M),f=norm(sub(far,path(S,s))),right=[-f[2],0,f[0]];
 const horizontal=name==='onboard'?68:name==='heli'?58:name==='hero'?54:53;
 // Keep useful horizontal road coverage in portrait without an extreme fisheye lens.
 const fov=clamp(2*Math.atan(Math.tan(horizontal*RAD/2)/Math.min(1.65,aspect(S)))/RAD,38,88);
 let eye,tgt;
 if(name==='onboard'){
  const heading=norm(lerp(tangent(S,s),f,.34));
  // Mount ahead of the roof's leading edge. A lens behind the car centre lets
  // the portrait field of view expose the flat roof and lower body fragments.
  eye=add(car,add(scale(heading,.60/M),[0,1.60/M,0]));
  tgt=[far[0],car[1]+1.10/M,far[2]];
 }else if(name==='heli'){
  const anchor=path(S,s-24/M),turn=cross(tangent(S,s),tangent(S,s+32/M))[1],C=S.camera794;
  if(C&&(C.rig!=='heli'||!C.droneSide))C.droneSide=turn<0?-1:1;
  const side=C&&C.droneSide||1; // Lock the side for the shot; an inflection must not swap banks mid-blend.
  eye=add(anchor,add(scale(right,side*12/M),[0,(42+speed*.16)/M,0]));
  tgt=lerp([car[0],car[1]+1/M,car[2]],[far[0],car[1]+1/M,far[2]],.24);
 }else{
  const backM=name==='hero'?16:17+speed*.07,heightM=name==='hero'?6.4:5.2+speed*.025,sideM=name==='hero'?4.4:.7;
  // Sample the travelled route for the eye; a tangent-only arm swings outside hairpins.
  const anchor=path(S,s-backM/M),rearT=tangent(S,s-backM/M),rearR=[-rearT[2],0,rearT[0]],width=S.CL.at(s-backM/M)[2]||2;
  const safeSide=Math.min(sideM/M,width*.32);
  eye=add(anchor,add(scale(rearR,safeSide),[0,heightM/M,0]));
  tgt=lerp([car[0],car[1]+.80/M,car[2]],[near[0],car[1]+1.05/M,near[2]],name==='hero'?.34:.43);
 }
 return {eye,tgt,fov,whole:false,following:true,lookAheadM:lookM};
}
function safeRig(S,r){
 if(clearRay(S,r))return Object.assign(r,{clear:true,adjusted:false});
 const M=metres(S),car=S.pose.pos;
 // Shorten the arm before climbing: stay over the known road corridor where possible.
 for(const shortening of [.60,.30,0])for(const lift of [3,9,22,48,90]){
  const eye=lerp(r.eye,[car[0],r.eye[1],car[2]],shortening===0?1:1-shortening);eye[1]+=lift/M;
  const q=Object.assign({},r,{eye});if(clearRay(S,q))return Object.assign(q,{clear:true,adjusted:true});
 }
 // Source geometry can overlap the road; report this instead of claiming a clear lens.
 const overview=fullView(S,'top');return Object.assign(overview,{clear:clearEye(S,overview.eye),adjusted:true,fallback:'overview',lookAheadM:r.lookAheadM});
}
function ceiling(S,a,b){let h=Math.max(a[1],b[1]);for(let k=0;k<=32;k++)h=Math.max(h,height(S,lerp(a,b,k/32))+8/metres(S));return h;}
function opacity(S,C,value){
 C.transitionOpacity=value;
 if(S.cv&&S.cv.style){if(C.opacityOriginal==null)C.opacityOriginal=S.cv.style.opacity||'';const base=Number.parseFloat(C.opacityOriginal);S.cv.style.opacity=String((Number.isFinite(base)?base:1)*value);}
}
function restoreOpacity(S,C){if(!C)return;if(C.opacityOriginal!=null&&S.cv&&S.cv.style)S.cv.style.opacity=C.opacityOriginal;C.opacityOriginal=null;C.transitionOpacity=1;}
function transition(S,C,to,dt){
 const tr=C.transition;if(!tr)return to;
 tr.elapsed=Math.min(1,tr.elapsed+dt);const u=tr.elapsed,q=u*u*(3-2*u),from=tr.from;
 if(tr.following&&tr.anchor){const delta=sub(S.pose.pos,tr.anchor);from.eye=add(from.eye,delta);from.tgt=add(from.tgt,delta);tr.anchor=S.pose.pos.slice();}
 if(tr.kind==='fade'){
  // An overview can be kilometres from a road camera. Fade through that change
  // rather than accelerating the eye through the city in a one-second flight.
  const v=u<.5?1-u*2:(u-.5)*2;opacity(S,C,v*v*(3-2*v)*(u<.5?tr.startOpacity:1));
  const r=u<.5?Object.assign({},to,copy(from),{whole:tr.fromWhole,following:tr.following,effectiveShot:tr.fromRig}):to;
  if(u>=1){C.transition=null;restoreOpacity(S,C);}return r;
 }
 let eye=lerp(from.eye,to.eye,q);
 // During a bounds-to-car change the interpolated aim point is not a car/road
 // subject yet: it can pass over a city block. Test lens clearance until settled,
 // rather than mistaking that moving overview centre for a hidden car and jumping.
 const wholeTransition=u<1&&(tr.fromWhole||to.whole);
 const lineClear=clearEye(S,eye)&&clearRay(S,Object.assign({},to,{eye,tgt:lerp(from.tgt,to.tgt,q),whole:wholeTransition||to.whole}));
 if(!lineClear||tr.lift){
  tr.lift=Math.max(tr.lift||0,ceiling(S,from.eye,to.eye));
  // A continuous vertical lift, cross and settle avoids a straight sweep through a tower.
  const h=tr.lift;
  if(u<.25)eye=lerp(from.eye,[from.eye[0],h,from.eye[2]],Math.sin(u*Math.PI*2));
  else if(u<.75)eye=lerp([from.eye[0],h,from.eye[2]],[to.eye[0],h,to.eye[2]],(u-.25)*2);
  else eye=lerp([to.eye[0],h,to.eye[2]],to.eye,1-Math.cos((u-.75)*Math.PI*2));
 }
 const r=Object.assign({},to,{eye,tgt:lerp(from.tgt,to.tgt,q),fov:mix(from.fov,to.fov,q),whole:wholeTransition||to.whole});
 if(u>=1)C.transition=null;
 return safeRig(S,r);
}
function begin(C,S,rig,to){
 if(C.cam){
  const startOpacity=C.transitionOpacity==null?1:C.transitionOpacity;
  restoreOpacity(S,C);
  const large=startOpacity<.999||!!C.cam.whole!==!!to.whole||Math.hypot(...sub(C.cam.eye,to.eye))*metres(S)>120;
  C.transition={from:copy(C.cam),fromWhole:!!C.cam.whole,fromRig:C.cam.effectiveShot||C.rig,kind:large?'fade':'blend',startOpacity,elapsed:0,anchor:S.pose.pos.slice(),following:!!C.following,lift:0};
  // Plan an obstructed change before the first moving frame, rather than discovering
  // the tower halfway through a lateral sweep and abruptly lifting the camera.
  for(let k=1;!large&&k<8;k++){
   const q=k/8,r={eye:lerp(C.cam.eye,to.eye,q),tgt:lerp(C.cam.tgt,to.tgt,q),whole:!!(C.cam.whole||to.whole)};
   if(!clearRay(S,r)){C.transition.lift=ceiling(S,C.cam.eye,to.eye);break;}
  }
 }
 C.rig=rig;
}
function choose(S,view){
 const L=S.CL.L,s=S.sim.s-(S.gridS||0),p=((s%L)+L)%L/L,bin=Math.min(11,Math.floor(p*12));
 if(view!=='tour'&&view!=='auto')return {rig:view,bin,p};
 // The opening reveals the entire route before the continuous, distance-led lap begins.
 const intro=(S.clock||0)<5.6,rig=intro?'top':TOUR[bin];return {rig,bin,p};
}
function restoreProjection(S,C){if(C&&C.projection){S.tune.shiftX=C.projection[0];S.tune.shiftY=C.projection[1];C.projection=null;}}
function special(S,view){return !MAIN.has(view)||(S.vehicle||G.vehicle||'car')!=='car'||S.towVms||S.camDebug||(S.fw&&S.fw.cam)||(S.towKind==='loo'&&S.loo&&S.loo.ph!=='shut');}
if(!G.VIEWS.some(v=>v[0]==='tour'))G.VIEWS.unshift(['tour','Circuit tour']);
G.setView=function(name){
 const S=G.S;if(!S)return originalView.apply(this,arguments);
 const oldCam=S.cam&&copy(S.cam),result=originalView.apply(this,arguments);
 if(result&&MAIN.has(result)){
  const C=S.camera794||(S.camera794={});
  if(oldCam&&C.view!==result){C.cam=Object.assign({},C.cam||{},oldCam);C.pendingView=result;}
  S.needsRender=true;
 }
 return result;
};
G.framedFov=function(degrees,a,shot){const S=G.S;return S&&S.camera794&&S.camera794.active?degrees*RAD:originalFov.apply(this,arguments);};
G.camStep=function(dt){
 const S=G.S;if(!S||!S.pose||!S.sim||!S.CL)return originalStep.apply(this,arguments);
 const view=S.view||S.forceShot||'auto';let C=S.camera794;
 if(special(S,view)){
  if(C){restoreProjection(S,C);restoreOpacity(S,C);C.active=false;C.cam=null;C.transition=null;}
  // The original director does not know the new tour key. Delegate it as Auto for
  // plant/towed sequences, restoring the user's selection for the next car scene.
  if(view==='tour'){const forced=S.forceShot;S.forceShot=null;try{return originalStep.apply(this,arguments);}finally{S.forceShot=forced;}}
  return originalStep.apply(this,arguments);
 }
 dt=clamp(Number.isFinite(dt)?dt:0,0,.10);
 if(!C||!S.cam||(C.clock!=null&&(S.clock||0)<C.clock-.01)){restoreProjection(S,C);restoreOpacity(S,C);C=S.camera794={};}
 if(!C.projection)C.projection=[S.tune.shiftX||0,S.tune.shiftY||0];S.tune.shiftX=0;S.tune.shiftY=0;
 C.active=true;const pick=choose(S,view),raw=wanted(S,pick.rig),desired=safeRig(S,raw);
 if(C.view!==view||C.rig!==pick.rig)begin(C,S,pick.rig,desired);
 const delta=C.anchor?sub(S.pose.pos,C.anchor):[0,0,0];
 if(reducedMotion(S)){C.transition=null;C.cam=desired;restoreOpacity(S,C);}
 else if(C.cam&&!C.transition){
  if(C.following){C.cam.eye=add(C.cam.eye,delta);C.cam.tgt=add(C.cam.tgt,delta);}
  const k=1-Math.exp(-dt*7),kt=1-Math.exp(-dt*9);
  C.cam=Object.assign({},desired,{eye:lerp(C.cam.eye,desired.eye,k),tgt:lerp(C.cam.tgt,desired.tgt,kt),fov:mix(C.cam.fov,desired.fov,k)});
  C.cam=safeRig(S,C.cam);
 }else C.cam=transition(S,C,desired,dt);
 C.view=view;C.following=C.cam.following;C.clock=S.clock||0;C.anchor=S.pose.pos.slice();
 S.cam=copy(C.cam);S.camBase=copy(C.cam);S.camAnchor=S.pose.pos.slice();S.camAnchorShot=pick.rig;S.camRoll=0;S.camShake=[0,0,0];S.fovKick=0;
 S.shotName=C.cam.effectiveShot||(C.cam.fallback==='overview'?'top':pick.rig);S.shotI=S.shotName==='top'?3:S.shotName==='heli'?2:S.shotName==='wide'?0:1;
 S.camT=(C.transition?C.transition.elapsed:1);S.dir={n:pick.rig,t:S.camT,dur:1,beat:'whole-lap-tour',sub:C.cam.fallback||null};
 S.sceneBeat='whole-lap-tour';S._forceShotPrev=S.forceShot||null;
 const a=aspect(S),car=projection(S.cam,S.pose.pos,a);
 C.report={view,shot:S.shotName,requestedShot:pick.rig,lapSection:pick.bin+1,lapFraction:pick.p,circuitLengthM:S.CL.L*metres(S),lookAheadM:raw.lookAheadM,
  transitionActive:!!C.transition,transitionRemainingSeconds:C.transition?1-C.transition.elapsed:0,aspect:a,fov:S.cam.fov,
  transitionKind:C.transition?C.transition.kind:null,transitionOpacity:C.transitionOpacity==null?1:C.transitionOpacity,
  carInFrame:car.z>0&&Math.abs(car.x)<.95&&Math.abs(car.y)<.95,carScreen:{x:car.x,y:car.y},
  obstructionClear:clearRay(S,Object.assign({},C.cam,{whole:C.cam.whole})),obstructionAdjusted:!!C.cam.adjusted,
  fallback:C.cam.fallback||null,eye:S.cam.eye.slice(),target:S.cam.tgt.slice(),physicsEdited:false,placementRngCalls:0,glResources:0};
};
G.cameraReport794=function(){
 const S=G.S,C=S&&S.camera794;if(!C||!C.active)return {enabled:false,delegated:true};
 // Full route projection is diagnostic work, never part of the per-tick camera update.
 const points=route(S).points,a=aspect(S),visible=points.reduce((n,p)=>{const q=projection(S.cam,p,a);return n+(q.z>0&&Math.abs(q.x)<=1&&Math.abs(q.y)<=1?1:0);},0);
 return Object.assign({enabled:true},C.report,{visibleRouteVertices:visible,routeVertices:points.length,wholeCircuitInFrame:visible===points.length});
};
const capture=G.captureContextState792,restore=G.restoreContextState792;
if(capture)G.captureContextState792=function(S){const back=capture.apply(this,arguments);if(back&&S&&S.camera794)back.state.camera794=JSON.parse(JSON.stringify(S.camera794));return back;};
if(restore)G.restoreContextState792=function(S,back){
 const ok=restore.apply(this,arguments);if(ok&&back&&back.state&&back.state.camera794){
  S.camera794=JSON.parse(JSON.stringify(back.state.camera794));S.camera794.transitionFrameTime=null;S.routeCamera794=null;S.cameraCollision794=null;
  if(S.camera794.active){S.tune.shiftX=0;S.tune.shiftY=0;}
 }return ok;
};
const originalFrame=G.frame;
if(originalFrame)G.frame=function(tms){
 const S=G.S,C=S&&S.camera794;
 if(S&&C&&C.active&&C.transition&&S.paused&&!S.lost&&!document.hidden){
  const dt=C.transitionFrameTime==null?0:clamp((tms-C.transitionFrameTime)/1000,0,.05);C.transitionFrameTime=tms;
  G.camStep(dt);G.render();S.needsRender=false;S.last=null;return;
 }
 if(C)C.transitionFrameTime=null;
 return originalFrame.apply(this,arguments);
};
G.camera794={version:'7.94',tourSequence:TOUR.slice(),source:'Existing closed circuit; camera-only route sampling, no new race sectors or geometry'};
})();
