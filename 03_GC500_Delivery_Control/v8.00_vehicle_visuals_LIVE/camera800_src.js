/* Author: Andrew Fisher. v8.00 — fit the selected vehicle in the existing detail views.
 * Cached source-part bounds follow the renderer's transforms. Camera-only prediction
 * uses copies of attachment state: no simulation, selection or record is advanced.
 */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.vehicleCamera800)return;
const originalStep=G.camStep,cache=new WeakMap(),worldCache=new WeakMap();let decals;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const aspect=S=>Math.max(.2,S.exportSize&&S.exportSize[0]>0&&S.exportSize[1]>0?S.exportSize[0]/S.exportSize[1]:(S.cv&&S.cv.clientWidth||window.innerWidth||1280)/(S.cv&&S.cv.clientHeight||window.innerHeight||720));
const isDetail=name=>name==='detail'||name==='frontdetail';
const corners=(lo,hi)=>{const a=[];for(const x of [lo[0],hi[0]])for(const y of [lo[1],hi[1]])for(const z of [lo[2],hi[2]])a.push([x,y,z]);return a;};
function box(points){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of points)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[k]);hi[k]=Math.max(hi[k],p[k]);}return{lo,hi,centre:lo.map((v,k)=>(v+hi[k])/2),corners:corners(lo,hi)};}
function parts(model){
 let found=cache.get(model);if(found)return found;
 found=model.parts.map(part=>{const v=part.vertices,lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<v.length;i+=8)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],v[i+k]);hi[k]=Math.max(hi[k],v[i+k]);}return{part,corners:corners(lo,hi)};});
 cache.set(model,found);return found;
}
function predicted(S){
 const copy=Object.assign({},S,{trailer:S.trailer&&Object.assign({},S.trailer),sway:S.sway&&Object.assign({},S.sway),loo:S.loo&&Object.assign({},S.loo,{done:Object.assign({},S.loo.done)})});
 if(G.swayStep)G.swayStep(copy);
 if(copy.towVms&&G.trailerStep){G.trailerStep(copy);if(copy.towKind==='loo'&&G.looStep)G.looStep(copy);}
 return copy;
}
function transform(S,part,M,trailer){
 let out=M;const w=part.wheel,m=S.sim;
 if(w){
  const a=trailer?-S.trailer.spin*(.19/(w.r||.19)):-(w.x<0&&m.wheelR!=null?m.wheelR:m.wheel)*(w.r?.142/w.r:1);
  const c=Math.cos(a||0),s=Math.sin(a||0),y=w.y===undefined?.145:w.y;
  if(w.z!==undefined&&w.x>0&&m.steer){const ca=Math.cos(m.steer),sa=Math.sin(m.steer);out=G.matMul(out,new Float32Array([ca,0,sa,0,0,1,0,0,-sa,0,ca,0,w.x-(ca*w.x-sa*w.z),0,w.z-(sa*w.x+ca*w.z),1]));}
  out=G.matMul(out,new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,w.x-c*w.x+s*y,y-s*w.x-c*y,0,1]));
 }
 if(part.sway&&S.sway)out=G.swayMatrix(out,part.sway,S.sway);
 if(part.door&&S.loo)out=G.hingeY(out,part.door.p,-S.loo.a);
 if(part.arm&&S.loo)out=G.hingeZ(out,part.arm.p,-S.loo.arm*.95);
 return out;
}
const world=(M,p)=>[M[0]*p[0]+M[4]*p[1]+M[8]*p[2]+M[12],M[1]*p[0]+M[5]*p[1]+M[9]*p[2]+M[13],M[2]*p[0]+M[6]*p[1]+M[10]*p[2]+M[14]];
function bounds(S){
 const level=S.quality&&S.quality.name==='balanced'?'balanced':'high',kind=S.vehicle||G.vehicle||'car',m=S.sim,T=S.trailer,w=S.sway,L=S.loo;
 const key=[S.clock,level,kind,!!S.towVms,S.towKind,S.tune.carS,S.tune.deckH,...S.pose.pos,...S.pose.fwd,...S.pose.rt,m.pitch,m.roll,m.wheel,m.wheelR,m.steer,T&&T.ax,T&&T.az,T&&T.hd,T&&T.t,T&&T.spin,T&&T.roll,w&&w.t,w&&w.r,w&&w.p,L&&L.t,L&&L.a,L&&L.arm].join(':');
 const previous=worldCache.get(S);if(previous&&previous.pose===S.pose&&previous.key===key)return previous.value;
 const state=predicted(S),points=[];
 const model=kind==='car'?G.raceCarModel(level):G.plantModel(kind,level),M=G.raceCarMatrix();
 const append=(model,matrix,trailer)=>{for(const q of parts(model)){const mat=transform(state,q.part,matrix,trailer);for(const p of q.corners)points.push(world(mat,p));}};
 append(model,M,false);
 if(kind==='car'&&G.raceCarDecals){if(!decals)decals={parts:G.raceCarDecals()};append(decals,M,false);}
 if(state.towVms&&state.trailer)append(state.towKind==='loo'?G.looModel(level):G.vmsModel(level),G.trailerMatrix(state),true);
 const value=Object.assign(box(points),{points,kind,level,towed:!!state.towVms,partBoxCount:points.length/8});worldCache.set(S,{pose:S.pose,key,value});return value;
}
function basis(S,r){const f=norm(sub(r.tgt,r.eye)),up=G.camUp?G.camUp(r,S.camRoll||0):[0,1,0],right=norm(cross(f,up));return{f,right,up:cross(right,f)};}
function project(S,r,points,a){
 a=a||aspect(S);const b=basis(S,r),tan=Math.tan(G.framedFov(r.fov,a,S.shotName||S.view)/2),sx=(S.tune.shiftX||0)*.35,sy=S.tune.shiftY||0;
 return points.map(p=>{const d=sub(p,r.eye),z=dot(d,b.f);return{x:dot(d,b.right)/(z*tan*a)+sx,y:dot(d,b.up)/(z*tan)+sy,z};});
}
function fenceSegments(S,r,B){
 const C=S.corridor794,active=C&&C.active&&C.outer&&C.inner,loops=active?[C.outer,C.inner]:[S.outer,S.inner];
 if(!loops[0]||!loops[1])return[];
 let saved=S.fenceCamera800;
 if(!saved||saved.outer!==loops[0]||saved.inner!==loops[1]){
  const cell=24/(G.M_PER_PT||5.937552372855356),grid=new Map();
  for(const P of loops)for(let i=0;i<P.length;i++){
   const a=P[i],b=P[(i+1)%P.length],e=[a[0],a[1],b[0],b[1]];
   for(let x=Math.floor(Math.min(a[0],b[0])/cell);x<=Math.floor(Math.max(a[0],b[0])/cell);x++)for(let z=Math.floor(Math.min(a[1],b[1])/cell);z<=Math.floor(Math.max(a[1],b[1])/cell);z++){
    const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e);
   }
  }
  saved=S.fenceCamera800={outer:loops[0],inner:loops[1],cell,grid};
 }
 const found=new Set(),cell=saved.cell;
 for(let x=Math.floor(Math.min(B.lo[0],r.eye[0])/cell);x<=Math.floor(Math.max(B.hi[0],r.eye[0])/cell);x++)for(let z=Math.floor(Math.min(B.lo[2],r.eye[2])/cell);z<=Math.floor(Math.max(B.hi[2],r.eye[2])/cell);z++)for(const e of saved.grid.get(x+','+z)||[])found.add(e);
 return found;
}
function rayFraction(a,b,e){
 const dx=b[0]-a[0],dz=b[2]-a[2],ex=e[2]-e[0],ez=e[3]-e[1],den=dx*ez-dz*ex;
 if(Math.abs(den)<1e-10)return null;
 const qx=e[0]-a[0],qz=e[1]-a[2],t=(qx*ez-qz*ex)/den,u=(qx*dz-qz*dx)/den;
 return t>.0001&&t<1&&u>=0&&u<=1?t:null;
}
function height(S,p){
 const source=S.architecture781Source;
 if(!source||!source.length||!S.toWorld)return S.heightAt?Math.max(0,S.heightAt(p[0],p[2])||0):0;
 let C=S.buildingCamera800;
 if(!C||C.source!==source){
  const cell=24/(G.M_PER_PT||5.937552372855356),margin=1.6/(G.M_PER_PT||5.937552372855356),grid=new Map();
  for(const b of source){if(!b.p||b.p.length<3||!Number.isFinite(b.h))continue;const P=b.p.map(q=>S.toWorld(q));if(P.some(q=>!q.every(Number.isFinite)))continue;
   const xs=P.map(q=>q[0]),zs=P.map(q=>q[1]),item={P,h:b.h};
   for(let x=Math.floor((Math.min(...xs)-margin)/cell);x<=Math.floor((Math.max(...xs)+margin)/cell);x++)for(let z=Math.floor((Math.min(...zs)-margin)/cell);z<=Math.floor((Math.max(...zs)+margin)/cell);z++){const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(item);}
  }
  C=S.buildingCamera800={source,cell,margin,grid};
 }
 let high=0;for(const b of C.grid.get(Math.floor(p[0]/C.cell)+','+Math.floor(p[2]/C.cell))||[]){let inside=false,near=false;const P=b.P;
  for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[j],c=P[i];if((a[1]>p[2])!==(c[1]>p[2])&&p[0]<(c[0]-a[0])*(p[2]-a[1])/(c[1]-a[1])+a[0])inside=!inside;
   const dx=c[0]-a[0],dz=c[1]-a[1],l=dx*dx+dz*dz,t=l>0?clamp(((p[0]-a[0])*dx+(p[2]-a[1])*dz)/l,0,1):0;
   if((p[0]-a[0]-dx*t)**2+(p[2]-a[1]-dz*t)**2<C.margin*C.margin)near=true;
  }
  if((inside||near)&&b.h>high)high=b.h;
 }
 return high;
}
function clear(S,r,B){
 const M=G.M_PER_PT||5.937552372855356,top=(S.tune.deckH||0)+.30+(S.detail781Enabled?3.05:0)/M,segments=fenceSegments(S,r,B);
 // A conservative box supplies eight sight lines to the complete vehicle. Check
 // actual fence crossings, including bends, rather than treating width as a survey.
 for(const p of B.corners)for(const e of segments){const t=rayFraction(p,r.eye,e);if(t!=null&&p[1]+(r.eye[1]-p[1])*t<top)return false;}
 for(let k=1;k<=12;k++){const t=k/12,p=add(r.tgt,mul(sub(r.eye,r.tgt),t)),h=height(S,p);if(h>0&&p[1]<h+.15/M)return false;}
 return true;
}
function fit(S,name,raw,B,recentre){
 B=B||bounds(S);const a=aspect(S),alone=B.kind==='car'&&!B.towed;
 const original=project(S,raw,B.points,a),already=original.every(p=>p.z>.04&&Math.abs(p.x)<.86&&Math.abs(p.y)<.86);
 if((alone||recentre===false)&&already&&clear(S,raw,B))return Object.assign({},raw,{fit800:false,clear800:true});
 const target=recentre===false?raw.tgt.slice():alone?raw.tgt.slice():B.centre.slice(),back=norm(sub(raw.eye,raw.tgt));
 const horizontal=Math.hypot(back[0],back[2])||1,az=[back[0]/horizontal,0,back[2]/horizontal],basePitch=Math.atan2(back[1],horizontal);
 const vfov=G.framedFov(raw.fov,a,name),tan=Math.tan(vfov/2),sx=(S.tune.shiftX||0)*.35,sy=S.tune.shiftY||0,margin=.84;
 let result;
 const pitches=[basePitch,...[.48,.68,.88,1.08,1.30,1.48].filter(p=>p>basePitch+.02)];
 for(const pitch of pitches){
  const direction=[az[0]*Math.cos(pitch),Math.sin(pitch),az[2]*Math.cos(pitch)],rig={eye:add(target,direction),tgt:target,fov:raw.fov},b=basis(S,rig);let distance=.08*S.tune.carS;
  for(const p of B.points){const d=sub(p,target),x=dot(d,b.right),y=dot(d,b.up),z=dot(d,direction);
   const needX=Math.max(x/Math.max(.12,margin-sx),-x/Math.max(.12,margin+sx))/(tan*a),needY=Math.max(y/Math.max(.12,margin-sy),-y/Math.max(.12,margin+sy))/tan;
   distance=Math.max(distance,z+Math.max(needX,needY)+.045*S.tune.carS);
  }
  // Keep the familiar close-up distance for the race car when a small repair is needed.
  if(alone||recentre===false)distance=Math.max(distance,Math.hypot(...sub(raw.eye,raw.tgt)));
  result={eye:add(target,mul(direction,distance)),tgt:target.slice(),fov:raw.fov,fit800:true,clear800:false};
  if(clear(S,result,B)){result.clear800=true;break;}
 }
 return result;
}
G.fitDetailCamera800=function(S,name,raw){return fit(S,name,raw,null,true);};
G.camStep=function(dt){
 const value=originalStep.apply(this,arguments),S=G.S;
 if(!S||!S.cam||!S.pose||!S.sim)return value;
 const name=S.shotName;if(!isDetail(name)||S.camDebug||(S.fw&&S.fw.cam)){if(S.camera800)S.camera800.active=false;return value;}
 const B=bounds(S),fitted=fit(S,name,S.cam,B,false),q=project(S,fitted,B.points);
 S.cam={eye:fitted.eye,tgt:fitted.tgt,fov:fitted.fov};
 // Feed only the clearance/fit correction into the existing exponential camera
 // filter. Its anchored following and frame-rate-independent smoothing stay intact.
 if(fitted.fit800)S.camBase={eye:sub(fitted.eye,S.camShake||[0,0,0]),tgt:sub(fitted.tgt,mul(S.camShake||[0,0,0],.30)),fov:fitted.fov/(1+(S.fovKick||0))};
 S.camera800={active:true,view:name,vehicle:S.vehicleKey||B.kind,towed:B.towed,partBoxCount:B.partBoxCount,aspect:aspect(S),clear:fitted.clear800,maxX:Math.max(...q.map(p=>Math.abs(p.x))),maxY:Math.max(...q.map(p=>Math.abs(p.y))),minDepth:Math.min(...q.map(p=>p.z)),eye:S.cam.eye.slice(),target:S.cam.tgt.slice(),fov:S.cam.fov};
 return value;
};
G.vehicleCamera800={version:'8.00',bounds,fit,project,clear,height,transform,world,parts,aspect,cameraOnly:true,newGPUResources:0};
G.vehicleCameraReport800=function(){return G.S&&G.S.camera800?Object.assign({},G.S.camera800):{active:false};};
const render=G.render;
if(render)G.render=function(){const S=G.S,C=S&&S.camera800;if(C&&C.active&&C.aspect!==aspect(S)&&!S.camDebug)G.camStep(0);return render.apply(this,arguments);};
})();
