/* Author: Andrew Fisher. Measured-carriageway rendering, v7.94.
 * Existing aerial-derived carriageway widths, not surveyed race-barrier alignment.
 * Source contours, centreline, car, physics, RNG and external anchors stay intact.
 * Corrected CPU batches reuse existing GPU buffers. Every boundary family switches
 * together; the original CPU data and rendering remain available for fallback.
 */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.deriveCorridor794)return;
const KEYS=['deck','walls','barrier','edgeGlow','edgeCore','trackConcrete','trackFencePosts','trackFenceWire','trackScuffs','standDecor'];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],
 area=P=>P.reduce((s,p,i)=>s+cross(p,P[(i+1)%P.length]),0)/2;
const finite=p=>p.every(Number.isFinite);
function intersects(a,b,c,d){
 const ab=sub(b,a),cd=sub(d,c),ca=sub(c,a),den=cross(ab,cd),eps=1e-9;
 if(Math.abs(den)<eps){if(Math.abs(cross(ca,ab))>eps)return false;
  const axis=Math.abs(ab[0])>Math.abs(ab[1])?0:1;
  return Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis]))<=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis]))+eps;}
 const t=cross(ca,cd)/den,u=cross(ca,ab)/den;return t>=-eps&&t<=1+eps&&u>=-eps&&u<=1+eps;
}
function simple(P,Q,same){
 for(let i=0;i<P.length;i++)for(let j=same?i+1:0;j<Q.length;j++){
  if(same&&(j===i+1||(i===0&&j===P.length-1)))continue;
  if(intersects(P[i],P[(i+1)%P.length],Q[j],Q[(j+1)%Q.length]))return false;
 }return true;
}
G.deriveCorridor794=function(S){
 if(!S||!S.CL||!S.roadWidth||S.roadWidth.source!=='measured')throw Error('Measured carriageway unavailable');
 const C=S.CL.p,N=S.CL.n||C.length,M=G.M_PER_PT||6;
 if(N<16||N>2048||N!==C.length||C.some(p=>!finite(p)||p[2]<=0))throw Error('Invalid measured centreline');
 const loops=[1,-1].map(side=>C.map((p,i)=>{
  const a=C[(i+N-1)%N],b=C[(i+1)%N],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  if(length<1e-8)throw Error('Degenerate corridor tangent');
  return[p[0]-side*dz/length*p[2]/2,p[1]+side*dx/length*p[2]/2];
 }));
 loops.sort((a,b)=>Math.abs(area(b))-Math.abs(area(a)));const [outer,inner]=loops;
 if(area(outer)>=0||area(inner)>=0||!simple(outer,outer,true)||!simple(inner,inner,true)||!simple(outer,inner,false)||inner.some(p=>!G.inPoly(p,outer)))throw Error('Corridor is not a simple nested band');
 // The matching sample zipper must not fold across itself at a narrow bend.
 let winding=0;
 for(let i=0;i<N;i++){const j=(i+1)%N;
  for(const p of [[outer[i],outer[j],inner[j]],[outer[i],inner[j],inner[i]]]){
   const q=cross(sub(p[1],p[0]),sub(p[2],p[0]));
   if(Math.abs(q)<1e-10||winding&&q*winding<=0)throw Error('Corridor ribbon folds');winding=Math.sign(q);
  }
 }
 return{outer,inner,widthsM:C.map(p=>p[2]*M),sampleCount:N,source:'Existing 2022 aerial-derived carriageway profile; illustrative barriers, not surveyed race alignment',frontOffsetM:0};
};
class CpuMesh{
 constructor(){this.v=[];this.i=[];this.nv=0;this.ni=0;this.stride=9;}
 vert(...p){if(p.length!==9||!finite(p))throw Error('Invalid corridor vertex');this.v.push(...p);return this.nv++;}
 tri(...p){if(p.some(i=>!Number.isInteger(i)||i<0||i>=this.nv))throw Error('Invalid corridor index');this.i.push(...p);this.ni=this.i.length;}
 upload(){this.ni=this.i.length;}
}
class CpuLines{
 constructor(){this.data=[];this.n=0;}
 seg(a,b,c,d,r,s,m){this.data.push(...a,...b,...c,...d,r,s,m||0);this.n++;}
 poly(p,c,r,m,closed){for(let i=0;i<(closed?p.length:p.length-1);i++)this.seg(p[i],p[(i+1)%p.length],c,c,r,r,m);}
}
function baseBatches(S,R){
 const {outer:O,inner:I}=R,H=S.tune.deckH,N=O.length,
 deck=new CpuMesh(),walls=new CpuMesh(),barrier=new CpuMesh(),edgeGlow=new CpuLines(),edgeCore=new CpuLines(),
 put=(mesh,p,c)=>mesh.vert(...p,...c,0,0),quad=(mesh,p,c)=>{const a=p.map(p=>put(mesh,p,c));mesh.tri(a[0],a[1],a[2]);mesh.tri(a[0],a[2],a[3]);};
 const lift=(P,y)=>P.map(p=>[p[0],y,p[1]]);
 edgeGlow.poly(lift(O,H),[1,.42,.07,.52],.80,0,true);edgeGlow.poly(lift(I,H),[1,.55,.25,.26],.55,0,true);
 edgeCore.poly(lift(O,H),[1,.62,.26,1],.085,1,true);edgeCore.poly(lift(I,H),[1,.70,.44,.92],.060,.85,true);
 for(let i=0;i<N;i++){const j=(i+1)%N;quad(deck,[[O[i][0],H,O[i][1]],[O[j][0],H,O[j][1]],[I[j][0],H,I[j][1]],[I[i][0],H,I[i][1]]],[.115,.108,.102,.90]);}
 for(const [P,h,c,alpha]of[[O,.30,[.130,.120,.112,1],.34],[I,.22,[.115,.106,.100,1],.16]])for(let i=0;i<N;i++){
  const a=P[i],b=P[(i+1)%N];
  const v=[put(walls,[a[0],0,a[1]],[1,.42,.07,.02]),put(walls,[b[0],0,b[1]],[1,.42,.07,.02]),put(walls,[b[0],H,b[1]],[1,.42,.07,alpha]),put(walls,[a[0],H,a[1]],[1,.42,.07,alpha])];walls.tri(v[0],v[1],v[2]);walls.tri(v[0],v[2],v[3]);
  const shade=c.map((x,k)=>k<3?x*.55:x),w=[put(barrier,[a[0],H,a[1]],shade),put(barrier,[b[0],H,b[1]],shade),put(barrier,[b[0],H+h,b[1]],c),put(barrier,[a[0],H+h,a[1]],c)];barrier.tri(w[0],w[1],w[2]);barrier.tri(w[0],w[2],w[3]);
 }
 return{deck,walls,barrier,edgeGlow,edgeCore};
}
function loopInfo(P){let length=0;const cum=[0];for(let i=0;i<P.length;i++){length+=Math.hypot(...sub(P[(i+1)%P.length],P[i]));cum.push(length);}return{P,cum,length};}
function locate(L,p){let best=Infinity,s=0;for(let i=0;i<L.P.length;i++){const a=L.P[i],b=L.P[(i+1)%L.P.length],d=sub(b,a),l2=d[0]*d[0]+d[1]*d[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*d[0]+(p[1]-a[1])*d[1])/l2)),q=[a[0]+d[0]*t,a[1]+d[1]*t],distance=Math.hypot(...sub(q,p));if(distance<best){best=distance;s=L.cum[i]+Math.sqrt(l2)*t;}}return s;}
function atLoop(L,s){s=((s%L.length)+L.length)%L.length;let i=0;while(i+1<L.cum.length&&L.cum[i+1]<=s)i++;i=Math.min(i,L.P.length-1);const a=L.P[i],b=L.P[(i+1)%L.P.length],length=L.cum[i+1]-L.cum[i],u=(s-L.cum[i])/length,t=sub(b,a).map(x=>x/length);return{p:[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],t};}
function banners(S,R){
 const source=S.standDecor,labels=S.photoLabels792,ranges=S.bannerRanges794;
 if(!source||source.stride!==9||!Array.isArray(source.v)||!Array.isArray(source.i)||!Array.isArray(labels)||!Array.isArray(ranges))throw Error('Fence banner ownership unavailable');
 const mesh=new CpuMesh();mesh.v=source.v.slice();mesh.i=source.i.slice();mesh.nv=source.nv;mesh.ni=source.ni;
 const result=labels.map(q=>({...q,centre:q.centre.slice(),face:q.face.slice(),colour:q.colour.slice()})),M=G.M_PER_PT||6,
 old=[S.outer,S.inner].map(loopInfo),next=[R.outer,R.inner].map(loopInfo),phase=old.map((L,i)=>locate(next[i],L.P[0]));
 let end=0,labelEnd=0;const placements=[];
 for(const r of ranges){
  if(!Number.isInteger(r.vertexStart)||!Number.isInteger(r.vertexEnd)||r.vertexStart<end||r.vertexEnd>mesh.nv||r.vertexEnd<=r.vertexStart||r.labelStart<labelEnd||r.labelEnd>labels.length||r.labelEnd<=r.labelStart||![0,1].includes(r.loop)||![...r.centre,...r.tangent,...r.outward].every(Number.isFinite))throw Error('Invalid banner range');
  end=r.vertexEnd;labelEnd=r.labelEnd;
  const L=old[r.loop],T=next[r.loop],f=locate(L,r.centre)/L.length;let halfSpan=0;
  for(let i=r.vertexStart;i<r.vertexEnd;i++){const k=i*9;halfSpan=Math.max(halfSpan,Math.abs((mesh.v[k]-r.centre[0])*r.tangent[0]+(mesh.v[k+2]-r.centre[1])*r.tangent[1]));}
  placements.push({r,s:phase[r.loop]+f*T.length,halfSpan});
 }
 // The source's first and final banner can nearly coincide across its seam.
 // Keep their artwork intact and move only a colliding panel into free fence
 // length. Start after the largest free gap, then verify the circular seam.
 for(let li=0;li<2;li++){
  const group=placements.filter(q=>q.r.loop===li).sort((a,b)=>a.s-b.s),gap=.30/M;
  if(group.length<2)continue;
  let start=0,largest=-Infinity;
  for(let i=0;i<group.length;i++){const after=group[(i+1)%group.length],space=after.s+(i===group.length-1?next[li].length:0)-group[i].s-group[i].halfSpan-after.halfSpan;if(space>largest){largest=space;start=(i+1)%group.length;}}
  const ordered=group.slice(start).concat(group.slice(0,start)),first=ordered[0];
  for(let i=1;i<ordered.length;i++){const q=ordered[i],before=ordered[i-1];if(q.s<first.s)q.s+=next[li].length;q.s=Math.max(q.s,before.s+before.halfSpan+q.halfSpan+gap);}
  const last=ordered[ordered.length-1];
  if(last.s+last.halfSpan+first.halfSpan+gap>first.s+next[li].length+1e-9)throw Error('Insufficient fence length for original banners');
 }
 for(const {r,s}of placements){
  const target=atLoop(next[r.loop],s),sg=r.loop?-1:1,n=[-target.t[1]*sg,target.t[0]*sg],
   // Original centre includes 0.45 schematic offset; replacement has only the
   // existing physical fence-cap setback, in metres. Artwork dimensions stay fixed.
   centre=[target.p[0]+n[0]*(.58/M*.62-.012),target.p[1]+n[1]*(.58/M*.62-.012)],
   move=p=>{const d=[p[0]-r.centre[0],p[2]-r.centre[1]],u=d[0]*r.tangent[0]+d[1]*r.tangent[1],v=d[0]*r.outward[0]+d[1]*r.outward[1];return[centre[0]+target.t[0]*u+n[0]*v,p[1],centre[1]+target.t[1]*u+n[1]*v];};
  for(let i=r.vertexStart;i<r.vertexEnd;i++){const k=i*9,p=move(mesh.v.slice(k,k+3));mesh.v[k]=p[0];mesh.v[k+1]=p[1];mesh.v[k+2]=p[2];}
  for(let i=r.labelStart;i<r.labelEnd;i++){result[i].centre=move(result[i].centre);const face=result[i].face,u=face[0]*r.tangent[0]+face[1]*r.tangent[1],v=face[0]*r.outward[0]+face[1]*r.outward[1];result[i].face=[target.t[0]*u+n[0]*v,target.t[1]*u+n[1]*v];}
 }
 return{mesh,labels:result,count:ranges.length};
}
G.prepareCorridor794=function(S){
 if(S.corridor794)return S.corridor794;
 const state={active:false,installing:false,ready:false,failed:null,variants:[],transitions:0,uploads:0,newGPUResources:0,sourceEdgeLoops:S.edgeLoops};S.corridor794=state;
 try{
  Object.assign(state,G.deriveCorridor794(S));
  for(const k of KEYS)if(!S[k]||typeof S[k].draw!=='function')throw Error('Missing boundary batch: '+k);
  const variants=baseBatches(S,state),stage=Object.create(S);
  G.buildTrackDetail(stage,{outer:state.outer,inner:state.inner,frontOffset:0,meshFactory:()=>new CpuMesh()});
  for(const k of ['trackConcrete','trackFencePosts','trackFenceWire','trackScuffs'])variants[k]=stage[k];
  const signs=banners(S,state);variants.standDecor=signs.mesh;state.labels=signs.labels;state.bannerCount=signs.count;
  state.renderEdgeLoops={o:new G.Loop(G.dens(state.outer,1)),i:new G.Loop(G.dens(state.inner,1))};
  for(const key of KEYS){const original=S[key],corrected=variants[key],line=key==='edgeGlow'||key==='edgeCore';
   if(line?!finite(corrected.data):(!finite(corrected.v)||corrected.i.some(i=>i<0||i>=corrected.nv)))throw Error('Invalid corrected batch '+key);
   const entry={key,original,corrected,line,draw:original.draw,
    // Restore the complete original line allocation, including unused capacity.
    // Its size metadata and a later original upload must still agree with GL.
    sourceVertices:new Float32Array(line?original.data:original.v),
    vertices:new Float32Array(line?corrected.data:corrected.v),
    sourceIndices:line?null:new Uint32Array(original.i),indices:line?null:new Uint32Array(corrected.i)};
   state.variants.push(entry);
  }
  state.correctedStandDecor=variants.standDecor;state.sourceLabels=S.photoLabels792;
  state.gpuBytes=state.variants.reduce((n,q)=>n+q.vertices.byteLength+(q.indices?q.indices.byteLength:0),0);
  state.ready=true;return state;
 }catch(error){state.failed=String(error.message||error);state.variants=[];return state;}
};
function upload(S,state,on){
 const gl=S.gl;
 for(const q of state.variants){const m=q.original;
  if(q.line){gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);gl.bufferData(gl.ARRAY_BUFFER,on?q.vertices:q.sourceVertices,gl.STATIC_DRAW);}
  else{gl.bindVertexArray(m.vao);gl.bindBuffer(gl.ARRAY_BUFFER,m.vb);gl.bufferData(gl.ARRAY_BUFFER,on?q.vertices:q.sourceVertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,on?q.indices:q.sourceIndices,gl.STATIC_DRAW);}
  state.uploads+=q.line?1:2;
 }gl.bindVertexArray(null);
 const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('Corridor buffer upload failed: '+error);
}
function stopUnsafeScene(S,state,error){
 state.restoreFailed=String(error.message||error);
 G.corridorFailure794={restorationFailed:true,message:state.restoreFailed,fallback:'Original flat circuit'};
 G.failed='3D corridor restoration failed; original flat circuit restored';
 // A failed rollback cannot safely use either index count. Stop this GL scene
 // before any further draw. The established unmount restores the original SVG
 // and flat animation; a later explicit mount can allocate a fresh context.
 S.lost=true;S.last=null;
 try{if(typeof S.unmount==='function')S.unmount(false);else if(S.cv&&S.cv.style)S.cv.style.visibility='hidden';}
 finally{if(G.S===S)G.S=null;}
}
function switchTo(S,state,on){
 if(state.active===on)return;
 if(!S.lost)try{upload(S,state,on);}catch(error){if(!on)stopUnsafeScene(S,state,error);throw error;}
 state.active=on;S.edgeLoops=on?state.renderEdgeLoops:state.sourceEdgeLoops;state.transitions++;
 if(S.sunShadow)S.sunShadow.source=null;
}
function wrapDraws(state){
 if(state.drawsWrapped)return;state.drawsWrapped=true;
 for(const q of state.variants){q.original.draw=function(){
  if(state.restoreFailed)throw Error('Unsafe corridor buffers are not drawable');
  if(!state.active)return q.draw.apply(this,arguments);
  const gl=this.gl;gl.bindVertexArray(this.vao);
  if(q.line)gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,q.corrected.n);
  else gl.drawElements(gl.TRIANGLES,q.indices.length,gl.UNSIGNED_INT,0);
 };}
}
const install=G.installTrackDetail781,dispose=G.disposeTrackDetail781;
G.installTrackDetail781=function(S){
 S=S||G.S;if(!S||S.trackDetail781)return install.apply(this,arguments);
 const state=G.prepareCorridor794(S);if(!state.ready||state.failed)return install.apply(this,arguments);
 const decor=S.standDecor,labels=S.photoLabels792;let result;
 wrapDraws(state);
 try{
  state.installing=true;S.standDecor=state.correctedStandDecor;S.photoLabels792=state.labels;
  result=install.call(this,S);
  if(!S.trackDetail781)throw Error('Enhanced corridor detail incomplete');
  S.standDecor=decor;S.photoLabels792=labels;state.installing=false;
  switchTo(S,state,true);
  if(S.trackDetail781.stats){S.trackDetail781.stats.corridor794={source:state.source,widthsFromExistingCentreline:true,frontOffsetM:0,boundaries:2,banners:state.bannerCount,sourceContoursUnchanged:true,drivingUnchanged:true};
   if(S.trackDetail781.stats.signage792)Object.assign(S.trackDetail781.stats.signage792,{sourcePlacementPreserved:false,existingFenceBannersFollowMeasuredCorridor:true,otherSourcePlacementsPreserved:true});}
  return result;
 }catch(error){
  S.standDecor=decor;S.photoLabels792=labels;state.installing=false;state.failed=String(error.message||error);
  // A driver can fail halfway through uploads without throwing. Restore every
  // original payload before invoking the original detail fallback.
  try{if(!S.lost)upload(S,state,false);state.active=false;S.edgeLoops=state.sourceEdgeLoops;}
  catch(restoreError){stopUnsafeScene(S,state,restoreError);throw restoreError;}
  if(S.trackDetail781)dispose.call(this,S);
  if(S.sunShadow)S.sunShadow.source=null;
  return install.call(this,S);
 }finally{S.standDecor=decor;S.photoLabels792=labels;state.installing=false;}
};
G.disposeTrackDetail781=function(S){
 S=S||G.S;const result=dispose.apply(this,arguments),state=S&&S.corridor794;
 if(state&&state.active)try{switchTo(S,state,false);}catch(error){if(!state.restoreFailed||G.S===S)throw error;}
 return result;
};
G.disposeCorridor794=function(S){
 const state=S&&S.corridor794;if(!state)return;
 // Parent teardown owns these original GPU resources. No corrected GPU object
 // exists to delete, and no upload is needed immediately before parent deletion.
 for(const q of state.variants)if(state.drawsWrapped)q.original.draw=q.draw;
 S.edgeLoops=state.sourceEdgeLoops;S.corridor794=null;
};
const mount=G.mount;
if(mount)G.mount=function(){const result=mount.apply(this,arguments),S=G.S;
 if(S&&S.unmount&&!S.corridorUnmount794){const unmount=S.unmount;S.corridorUnmount794=true;S.unmount=function(){G.disposeCorridor794(S);return unmount.apply(this,arguments);};}return result;};
const render=G.render;
if(render)G.render=function(){
 const scene=G.S,priorFailure=G.corridorFailure794;
 try{return render.apply(this,arguments);}catch(error){
  // The inherited full-lap wrapper retains its old S while ensure() runs.
  // A diagnosed fatal rollback can unmount there; its next legacy render would
  // dereference the now-null G.S. Suppress only that completed teardown path.
  if(scene&&scene.lost&&G.S===null&&G.corridorFailure794&&G.corridorFailure794!==priorFailure)return;
  throw error;
 }
};
G.corridorReport794=function(S){S=S||G.S;const q=S&&S.corridor794;return q?{ready:q.ready,enabled:q.active,failed:q.failed,restoreFailed:q.restoreFailed||null,source:q.source,samples:q.sampleCount,banners:q.bannerCount,transitions:q.transitions,uploads:q.uploads,newGPUResources:0,newDrawCalls:0,correctedGpuBytes:q.gpuBytes}: {enabled:false,failure:G.corridorFailure794||null};};
})();
