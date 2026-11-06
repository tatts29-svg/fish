/* Author: Andrew Fisher. Actual-source CPU corridor and transactional lifecycle regressions.
 * node corridor794_checks.cjs CANDIDATE_HTML [OUTPUT_JSON] [ORIGINAL_HTML]
 * Fake GL records bytes/counts only: this does not establish rendering or device performance.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),candidate=process.argv[2];
assert(candidate,'Usage: node corridor794_checks.cjs CANDIDATE_HTML [OUTPUT_JSON] [ORIGINAL_HTML]');
const html=fs.readFileSync(candidate,'utf8'),baselinePath=process.argv[4]||path.join(root,'build/GC500_v7.92/GC500_Delivery_Control_hosted.html'),
 baseline=fs.readFileSync(baselinePath,'utf8'),sourcePath=path.join(__dirname,'../corridor794_src.js'),
 source=fs.existsSync(sourcePath)?fs.readFileSync(sourcePath,'utf8'):'';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),digest=x=>sha(JSON.stringify(x)),checks=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});assert(pass,name+' '+JSON.stringify(detail||''));};
const take=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i+a.length);assert(i>=0&&j>i,'fixture source boundary '+a);return text.slice(i,j);};
const copy=x=>JSON.parse(JSON.stringify(x)),near=(a,b,t=1e-8)=>Math.abs(a-b)<t;
const baseNames=['deck','walls','barrier','edgeGlow','edgeCore','trackConcrete','trackFencePosts','trackFenceWire','trackScuffs','standDecor'];
function fakeGL(){
 let serial=0,vao=null,writes=0,failureAt=new Set(),failed=false,errorOnce=0,errorAlways=0;
 const buffers=new Map(),bound=new Map(),draws=[],events=[],live=new Set();
 const make=kind=>{const h={kind,id:++serial};live.add(h);return h;},remove=h=>{live.delete(h);buffers.delete(h);};
 const mutate=()=>{writes++;if(failureAt.has(writes)){failed=true;throw Error('Injected buffer upload '+writes);}};
 const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,DYNAMIC_DRAW:4,TRIANGLES:5,UNSIGNED_INT:6,
 TRIANGLE_STRIP:7,NO_ERROR:0,FLOAT:8,TEXTURE0:9,COMPILE_STATUS:10,LINK_STATUS:11,MAX_TEXTURE_SIZE:12,
 createBuffer:()=>make('buffer'),createVertexArray:()=>make('vao'),createTexture:()=>make('texture'),
 createShader:()=>make('shader'),createProgram:()=>make('program'),deleteBuffer:remove,deleteVertexArray:remove,
 deleteTexture:remove,deleteShader:remove,deleteProgram:remove,
 bindVertexArray:v=>{vao=v;},bindBuffer:(target,v)=>{bound.set(target,v);},
 bufferData(target,data){mutate();const buf=bound.get(target);assert(buf,'bound upload target');
 const bytes=typeof data==='number'?Buffer.alloc(data):Buffer.from(data.buffer,data.byteOffset,data.byteLength);
 buffers.set(buf,Buffer.from(bytes));events.push({op:'data',buf,bytes:bytes.length});},
 bufferSubData(target,offset,data,start=0,length){mutate();const buf=bound.get(target),n=length===undefined?data.length-start:length,
 bytes=Buffer.from(data.buffer,data.byteOffset+start*data.BYTES_PER_ELEMENT,n*data.BYTES_PER_ELEMENT),old=buffers.get(buf);
 assert(old&&offset+bytes.length<=old.length,'bufferSubData within allocation');bytes.copy(old,offset);events.push({op:'sub',buf,bytes:bytes.length});},
 drawElements(mode,count){draws.push({vao,kind:'mesh',count});},drawArraysInstanced(mode,start,count,instances){draws.push({vao,kind:'line',count:instances});},
 getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:()=>({}),getError:()=>{const e=errorOnce||errorAlways;errorOnce=0;return e;},getParameter:p=>p===12?4096:null,
 isContextLost:()=>false};
 const proxy=new Proxy(gl,{get:(o,k)=>k in o?o[k]:()=>{}});
 return {gl:proxy,buffers,draws,events,live,serial:()=>serial,writes:()=>writes,
 failAt:n=>{failureAt=new Set(n===null?[]:(Array.isArray(n)?n:[n]).map(x=>writes+x));failed=false;},failed:()=>failed,errorOnce:n=>{errorOnce=n;},errorAlways:n=>{errorAlways=n;}};
}
function fixture(text,{enhanced=false,installCorridor=false}={}){
 const data=JSON.parse(text.match(/\bconst\s+DATA\s*=\s*(.*);/)[1]),gpu=fakeGL(),G={},S={gl:gpu.gl,tune:{},o:{},quad:{kind:'quad'},sunShadow:{source:{}}};G.S=S;
 const context=vm.createContext({window:{GC3D:G},G,S,data,console,performance,Math,Number,
 Float32Array,Uint32Array,Uint8Array,Int32Array,ArrayBuffer,Map,Set,WeakMap,
 o:{ring:data.circuit.ring,roadWidth:data.circuit.roadWidth,pit:data.surrounds.pit.map(a=>{
 const r=[];for(let i=1;i+1<a.length;i+=2)r.push([a[i]*data.surrounds.unit+data.surrounds.ox,a[i+1]*data.surrounds.unit+data.surrounds.oy]);return r;})}});
 vm.runInContext(take(text,'const LS=17;','})();')+'\n'+take(text,'G.rng = function(seed)','\n')+'\n'+
 take(text,'const area=G.area=','/* ear clipping')+take(text,'G.M_PER_PT =','/* Day Race')+
 take(text,'G.units=function(T)','/* What the scene')+'\nS.tune=G.units(G.defaultTune());const gl=S.gl;\n'+
 take(text,' /* key plan → world:',' /* where the crowd stands:'),context);
 vm.runInContext(take(text,'G.inPoly=function(p,P){','\n')+'\n'+take(text,'G.buildTrackDetail=function(S', '\n})();'),context);G.buildTrackDetail(S);
 // Run the complete real dressing emitter; no synthetic ownership tags or banner vertices.
 S.heightAt=()=>0;S.pitPts=[];S.stands=[];S.standDecor=new G.MeshBatch(S.gl,[3,4,2],false);
 const standEdge=new G.LineBatch(S.gl,S.quad,2048,false);
 const dquad=(...args)=>{const col=args.pop(),n=S.standDecor.nv;for(const p of args)S.standDecor.vert(...p,...col,0,0);
 S.standDecor.tri(n,n+1,n+2);S.standDecor.tri(n,n+2,n+3);S.standDecor.tri(n,n+2,n+1);S.standDecor.tri(n,n+3,n+2);};
 vm.runInContext(take(text,'const DRESS_FONT=','/* v6.64 - PEOPLE, NOT DOTS.'),context);
 G.dressCircuit(S,{dquad,person(){},ed:standEdge,H:S.tune.deckH,CL:S.CL});S.standDecor.upload();
 S.sim={s:S.gridS,v:8};S.cam={eye:[1,2,3]};S.trackDetail781=null;S.detail781Enabled=false;
 const originalRefs={outer:S.outer,inner:S.inner,CL:S.CL,labels:S.photoLabels792,decor:S.standDecor,
 heightAt:S.heightAt,sim:S.sim,cam:S.cam},batches=()=>baseNames.filter(n=>S[n]).map(n=>({name:n,b:S[n]}));
 const cpu=()=>({outer:S.outer,inner:S.inner,cl:{p:S.CL.p,cum:S.CL.cum,L:S.CL.L,n:S.CL.n},
 widths:S.roadWidth,kerb:{v:S.kerb.v,i:S.kerb.i},kap:S.kap,grid:S.grid,gridS:S.gridS,
 sim:S.sim,cam:S.cam,labels:S.photoLabels792,banners:S.bannerRanges794,
 batches:batches().map(({name,b})=>({name,v:b.v,i:b.i,nv:b.nv,ni:b.ni,data:b.data&&Array.from(b.data),n:b.n}))});
 const buffers=()=>batches().flatMap(({name,b})=>b.v?[{name:name+'.v',h:b.vb},{name:name+'.i',h:b.ib}]:[{name:name+'.line',h:b.buf}]);
 const originalGPU=new Map(buffers().map(({h})=>[h,Buffer.from(gpu.buffers.get(h))]));
 const gpuHash=()=>digest(buffers().map(({name,h})=>[name,sha(gpu.buffers.get(h))]));
 const gpuMatchesOriginal=()=>buffers().every(({h})=>originalGPU.get(h).equals(gpu.buffers.get(h)));
 const draw=()=>{gpu.draws.length=0;for(const {b}of batches())b.draw();return gpu.draws.slice();};
 const originalDraw=draw(),originalCPU=digest(cpu()),originalGPUHash=gpuHash();
 G.captureContextState792=S=>({state:{sim:S.sim,cam:S.cam},detail:!!S.detail781Enabled});
 let unmountCalls=0,renderError=null;S.unmount=function(){unmountCalls++;G.disposeTrackDetail781(S);G.S=null;};G.mount=()=>true;G.unmount=()=>S.unmount();
 G.render=function(){if(renderError)throw renderError;try{G.installTrackDetail781(G.S);}catch(e){}return G.S.sim;};
 if(enhanced){
  const marker='/* Author: Andrew Fisher.\n * v7.92 — physical surface detail over both complete existing circuit boundaries.';
  vm.runInContext(take(text,marker,'\n})();')+'\n})();',context);
  vm.runInContext(take(text,'G.addTrackLabels792=function(S,D){','\n})();'),context);
  G.makeSignAtlas792=()=>({texture:S.gl.createTexture(),white:[.5,.5],labels:Object.fromEntries(S.photoLabels792.map(q=>[q.text,{uv:[0,0,1,1]}])),gpuBytes:4});
 }
 if(installCorridor){assert(source,'corridor helper source exists');vm.runInContext(source,context);G.mount();}
 return {G,S,context,gpu,cpu,batches,buffers,originalRefs,originalDraw,originalCPU,originalGPUHash,gpuHash,gpuMatchesOriginal,draw,unmountCalls:()=>unmountCalls,setRenderError:e=>{renderError=e;}};
}

// Independent topology checks use robust orientation and finite segment tests,
// not the helper's own validation results.
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function onSegment(a,b,p){return Math.abs(cross(a,b,p))<1e-9&&p[0]>=Math.min(a[0],b[0])-1e-9&&p[0]<=Math.max(a[0],b[0])+1e-9&&p[1]>=Math.min(a[1],b[1])-1e-9&&p[1]<=Math.max(a[1],b[1])+1e-9;}
function intersects(a,b,c,d){const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);
 return (x*y< -1e-18&&u*v< -1e-18)||onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b);}
function intersections(A,B=A){let n=0;for(let i=0;i<A.length;i++)for(let j=A===B?i+1:0;j<B.length;j++){
 if(A===B&&(j===i+1||(i===0&&j===A.length-1)))continue;
 if(intersects(A[i],A[(i+1)%A.length],B[j],B[(j+1)%B.length]))n++;
 }return n;}
function inside(p,P){let yes=false;for(let i=0,j=P.length-1;i<P.length;j=i++){
 const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
 }return yes;}
function boundaryDistance(p,P){let best=Infinity;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,
 t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l));best=Math.min(best,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz));}return best;}
function originalIntegrity(r){return digest(r.cpu())===r.originalCPU&&r.S.outer===r.originalRefs.outer&&r.S.inner===r.originalRefs.inner&&
 r.S.CL===r.originalRefs.CL&&r.S.photoLabels792===r.originalRefs.labels&&r.S.standDecor===r.originalRefs.decor&&
 r.S.heightAt===r.originalRefs.heightAt&&r.S.sim===r.originalRefs.sim&&r.S.cam===r.originalRefs.cam;}
function inactive(r){return !r.S.corridor794?.active&&!r.S.detail781Enabled&&!r.S.trackDetail781;}
function sourceFallback(r){return !r.S.corridor794?.active&&!!r.S.corridor794?.failed&&!!r.S.detail781Enabled&&!!r.S.trackDetail781&&r.gpuMatchesOriginal()&&originalIntegrity(r);}

const start=performance.now(),old=fixture(baseline),r=fixture(html,{enhanced:true,installCorridor:true}),{G,S}=r;
const emitterData=q=>({batches:q.batches().map(({name,b})=>({name,v:b.v,i:b.i,nv:b.nv,ni:b.ni,data:b.data&&Array.from(b.data),n:b.n})),
 labels:q.S.photoLabels792,dress:q.S.dressStats,outer:q.S.outer,inner:q.S.inner,cl:q.S.CL.p});
ck('metadata patch preserves exact output of all original source emitters',digest(emitterData(old))===digest(emitterData(r)));
ck('candidate includes current corridor helper',html.includes(source)||html.includes(source.replace(/ {2,}/g,' ').replaceAll(' .','.').replaceAll(' ,',',')));
const tags=S.bannerRanges794;
ck('every actually emitted banner has one ownership tag',Array.isArray(tags)&&tags.length===S.dressStats.banners&&tags.length>20,{tags:tags&&tags.length,banners:S.dressStats.banners});
let previous=0,owned=new Set();
for(const q of tags){
 assert(Number.isInteger(q.vertexStart)&&Number.isInteger(q.vertexEnd)&&q.vertexStart>=previous&&q.vertexEnd>q.vertexStart&&q.vertexEnd<=S.standDecor.nv,'valid non-overlapping banner vertex range');
 assert(Number.isInteger(q.labelStart)&&Number.isInteger(q.labelEnd)&&q.labelEnd===q.labelStart+1&&q.labelEnd<=S.photoLabels792.length,'one source label per banner');
 assert(q.loop==='outer'||q.loop==='inner'||q.loop===0||q.loop===1,'original boundary ownership');
 assert(q.centre.length===2&&q.tangent.length===2&&q.outward.length===2&&[...q.centre,...q.tangent,...q.outward].every(Number.isFinite),'finite banner frame');
 assert(near(Math.hypot(...q.tangent),1)&&near(Math.hypot(...q.outward),1)&&near(q.tangent[0]*q.outward[0]+q.tangent[1]*q.outward[1],0),'orthonormal source banner frame');
 const label=S.photoLabels792[q.labelStart];assert(near(q.centre[0],label.centre[0])&&near(q.centre[1],label.centre[2]),'tag centre is actual emitted text centre');
 assert(near(q.outward[0],-label.face[0])&&near(q.outward[1],-label.face[1]),'tag outward is actual panel outward');
 assert(S.standDecor.i.slice(label.indexStart,label.indexEnd).every(i=>i>=q.vertexStart&&i<q.vertexEnd),'text indices owned by banner');
 for(let k=q.vertexStart;k<q.vertexEnd;k++)owned.add(k);previous=q.vertexEnd;
}
ck('actual banner tags have exact label ranges and source-space frames',true,{ownedVertices:owned.size});
const freeze=x=>{if(x&&typeof x==='object'&&!ArrayBuffer.isView(x)&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freeze);}return x;};
for(const x of [S.CL.p,S.CL.cum,S.outer,S.inner,S.kap,S.photoLabels792,S.bannerRanges794,S.kerb.v,S.kerb.i])freeze(x);
for(const {b}of r.batches())if(b.v){freeze(b.v);freeze(b.i);}
const allocationStart=r.gpu.serial(),writesStart=r.gpu.writes(),corridor=G.deriveCorridor794(S);
ck('derived corridor retains one immutable-width station per actual route point',corridor&&corridor.outer.length===S.CL.n&&corridor.inner.length===S.CL.n,{stations:S.CL.n});
let maxWidthError=0,maxCentreError=0;
for(let i=0;i<S.CL.n;i++){
 const p=S.CL.p[i],a=corridor.outer[i],b=corridor.inner[i];assert([...a,...b].every(Number.isFinite),'finite corridor edge');
 maxWidthError=Math.max(maxWidthError,Math.abs(Math.hypot(a[0]-b[0],a[1]-b[1])-p[2]));
 maxCentreError=Math.max(maxCentreError,Math.hypot((a[0]+b[0])/2-p[0],(a[1]+b[1])/2-p[1]));
}
ck('every rendered road cross-section has exactly the measured source width and centre',maxWidthError<1e-9&&maxCentreError<1e-9,{maxWidthErrorM:maxWidthError*G.M_PER_PT,maxCentreErrorM:maxCentreError*G.M_PER_PT});
const topology={outerSelf:intersections(corridor.outer),innerSelf:intersections(corridor.inner),between:intersections(corridor.outer,corridor.inner)};
ck('both boundaries are independently simple disjoint nested closed loops',Object.values(topology).every(n=>n===0)&&corridor.inner.every(p=>inside(p,corridor.outer)),topology);
ck('all actual route stations remain inside the corrected road band',S.CL.p.every(p=>inside(p,corridor.outer)&&!inside(p,corridor.inner)));
let ribbonSign=0;
for(let i=0;i<S.CL.n;i++){const j=(i+1)%S.CL.n;for(const [a,b,c]of [[corridor.outer[i],corridor.outer[j],corridor.inner[j]],[corridor.outer[i],corridor.inner[j],corridor.inner[i]]]){
 const sign=Math.sign(cross(a,b,c));assert(sign!==0&&(!ribbonSign||sign===ribbonSign),'corrected road zipper triangles never degenerate or reverse');ribbonSign=sign;
}}
ck('every road zipper triangle has consistent nonzero winding',true);
for(const [name,mutate]of [
 ['unmeasured width',q=>{q.roadWidth={source:'key plan'};}],
 ['nonpositive width',q=>{q.CL.p[0][2]=0;}],
 ['non-finite width',q=>{q.CL.p[0][2]=NaN;}],
 ['degenerate tangent',q=>{q.CL.p[1]=q.CL.p.at(-1).slice();}],
 ['crossing width profile',q=>{q.CL.p[0][2]=10000;}]
]){
 const q={...S,CL:{...S.CL,p:S.CL.p.map(p=>p.slice())}};mutate(q);let rejected=false;try{G.deriveCorridor794(q);}catch(e){rejected=true;}
 ck(name+' rejects correction before any source mutation',rejected&&originalIntegrity(r)&&r.gpu.writes()===writesStart&&r.gpu.serial()===allocationStart);
}
const prepared=G.prepareCorridor794(S);
ck('all ten boundary families have complete prepared variants',prepared.ready&&prepared.variants.length===baseNames.length&&baseNames.every(k=>prepared.variants.some(q=>q.key===k)),prepared.failed);
ck('corridor preparation allocates and uploads no GPU resources',r.gpu.serial()===allocationStart&&r.gpu.writes()===writesStart);
ck('derive and preparation retain all protected source arrays and references',originalIntegrity(r));
const banners=prepared.variants.find(q=>q.key==='standDecor').corrected;
let unrelated=0,moved=0,maxBannerSizeError=0,maxBannerBoundaryError=0;
assert(digest(banners.i)===digest(S.standDecor.i),'banner clone retains every index');
for(let i=0;i<S.standDecor.nv;i++){
 const a=S.standDecor.v.slice(i*9,i*9+9),b=banners.v.slice(i*9,i*9+9);
 if(!owned.has(i)){assert(digest(a)===digest(b),'unrelated decoration coordinate remains exact');unrelated++;}
 else{assert(a[1]===b[1]&&digest(a.slice(3))===digest(b.slice(3)),'banner height colour UV unchanged');if(a[0]!==b[0]||a[2]!==b[2])moved++;}
}
for(const q of tags){
 const label=prepared.labels[q.labelStart],cap=.58/G.M_PER_PT*.62-.012,at=[label.centre[0]+label.face[0]*cap,label.centre[2]+label.face[1]*cap];
 maxBannerBoundaryError=Math.max(maxBannerBoundaryError,boundaryDistance(at,q.loop?corridor.inner:corridor.outer)*G.M_PER_PT);
 const i=q.vertexStart*9;
 for(let j=q.vertexStart+1;j<q.vertexEnd;j++){
  const k=j*9,da=Math.hypot(S.standDecor.v[k]-S.standDecor.v[i],S.standDecor.v[k+2]-S.standDecor.v[i+2]),db=Math.hypot(banners.v[k]-banners.v[i],banners.v[k+2]-banners.v[i+2]);
  maxBannerSizeError=Math.max(maxBannerSizeError,Math.abs(da-db)*G.M_PER_PT);
 }
}
ck('only owned banner positions move and all artwork dimensions stay exact',unrelated>0&&moved===owned.size&&maxBannerSizeError<1e-9,{unrelatedVertices:unrelated,movedVertices:moved,maxBannerSizeErrorM:maxBannerSizeError});
ck('every banner centre sits at the measured boundary plus original physical cap setback',maxBannerBoundaryError<1e-8,{maxBannerBoundaryErrorM:maxBannerBoundaryError});
// Measure final panel extents and centres independently around each closed loop,
// including the last-to-first seam that the original emitter can overcrowd.
let minimumBannerGapM=Infinity;
for(const [li,P]of [[0,corridor.outer],[1,corridor.inner]]){
 const lengths=P.map((p,i)=>Math.hypot(p[0]-P[(i+1)%P.length][0],p[1]-P[(i+1)%P.length][1])),total=lengths.reduce((a,b)=>a+b,0),panels=[];
 for(const q of tags.filter(q=>q.loop===li)){
  const label=prepared.labels[q.labelStart],cap=.58/G.M_PER_PT*.62-.012,p=[label.centre[0]+label.face[0]*cap,label.centre[2]+label.face[1]*cap];
  let best=Infinity,arc=0,run=0,half=0;
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(lengths[i]*lengths[i]))),distance=Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t);if(distance<best){best=distance;arc=run+t*lengths[i];}run+=lengths[i];}
  for(let i=q.vertexStart;i<q.vertexEnd;i++){const k=i*9;half=Math.max(half,Math.abs((banners.v[k]-label.centre[0])*label.face[1]-(banners.v[k+2]-label.centre[2])*label.face[0]));}
  panels.push({arc,half});
 }
 panels.sort((a,b)=>a.arc-b.arc);
 for(let i=0;i<panels.length;i++){const a=panels[i],b=panels[(i+1)%panels.length],gap=b.arc+(i===panels.length-1?total:0)-a.arc-a.half-b.half;minimumBannerGapM=Math.min(minimumBannerGapM,gap*G.M_PER_PT);}
}
ck('all preserved banner panels have a clear circular gap including the loop seam',minimumBannerGapM>=.30-1e-8,{minimumBannerGapM});
for(const kind of ['missing banner ownership','overlapping banner ownership']){
 const tags=kind==='missing banner ownership'?undefined:copy(S.bannerRanges794);if(tags)tags[1].vertexStart=tags[0].vertexStart;
 const q={...S,corridor794:null,bannerRanges794:tags},failed=G.prepareCorridor794(q);
 ck(kind+' refuses all boundary substitution atomically',!failed.ready&&!!failed.failed&&failed.variants.length===0&&originalIntegrity(r)&&r.gpu.writes()===writesStart&&r.gpu.serial()===allocationStart);
}

// Additional assertions use uploaded bytes, independent of prepared-state naming.
const expectedOriginalCounts=r.originalDraw.map(d=>d.count),sourceCPU=r.originalCPU;
const install=()=>G.installTrackDetail781(S),dispose=()=>G.disposeTrackDetail781(S);
install();
ck('successful install activates corrected corridor with enhanced detail',S.corridor794&&S.corridor794.active&&S.trackDetail781&&S.detail781Enabled);
ck('successful install keeps original CPU geometry and metadata byte-identical',originalIntegrity(r));
const activeHash=r.gpuHash(),activeDraw=r.draw(),changed=r.buffers().filter(({h})=>!r.gpu.buffers.get(h).equals(old.gpu.buffers.get(old.buffers().find(x=>x.name===r.buffers().find(y=>y.h===h).name).h)));
ck('corrected variants replace existing GPU payloads',activeHash!==r.originalGPUHash&&changed.length>=10,{changedBuffers:changed.map(x=>x.name)});
const typedBytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
ck('every corrected draw uses the uploaded variant count and retained original handles',prepared.variants.every(q=>{
 const b=q.original,d=activeDraw.find(d=>d.vao===b.vao);
 return d&&d.count===(q.line?q.corrected.n:q.indices.length)&&r.gpu.buffers.get(q.line?b.buf:b.vb).equals(typedBytes(q.vertices))&&
 (q.line||r.gpu.buffers.get(b.ib).equals(typedBytes(q.indices)));
}));
let maximumSkinBoundaryError=0;
for(const run of S.trackDetail781.geometry.runs)for(const segment of run.segments)for(const p of [segment.a,segment.b])
 maximumSkinBoundaryError=Math.max(maximumSkinBoundaryError,boundaryDistance([p[0],p[2]],corridor[run.name]));
ck('enhanced material detail stages on the same measured boundaries as all original buffers',maximumSkinBoundaryError<1e-9,{maximumSkinBoundaryErrorM:maximumSkinBoundaryError*G.M_PER_PT});
let kerbSamples=0,kerbMin=Infinity,kerbCrossings=0;
assert(S.trackDetail781.kerbEdges?.length,'candidate contains current joined kerb794 implementation');
for(const e of S.trackDetail781.kerbEdges){
 const P=['outerStart','outerEnd','innerEnd','innerStart'].map(k=>[e[k][0],e[k][2]]);
 for(const p of P){assert(inside(p,corridor.outer)&&!inside(p,corridor.inner),'retained kerb lip lies inside measured road');kerbMin=Math.min(kerbMin,boundaryDistance(p,corridor.outer),boundaryDistance(p,corridor.inner));kerbSamples++;}
 for(let i=0;i<P.length;i++)for(const loop of [corridor.outer,corridor.inner])for(let j=0;j<loop.length;j++)if(intersects(P[i],P[(i+1)%P.length],loop[j],loop[(j+1)%loop.length]))kerbCrossings++;
}
ck('retained joined kerb profiles stay inside corrected fences at corners and along every lip',kerbCrossings===0,{samples:kerbSamples,minClearanceM:kerbMin*G.M_PER_PT,crossings:kerbCrossings});
const standaloneBefore=r.gpu.serial(),stableWrites=r.gpu.writes();
for(let i=0;i<5;i++){install();r.draw();}
ck('repeated enable and draws neither allocate nor reupload',r.gpu.serial()===standaloneBefore&&r.gpu.writes()===stableWrites&&r.gpuHash()===activeHash);
dispose();
ck('detail off restores every original GPU byte and draw count',inactive(r)&&r.gpuMatchesOriginal()&&digest(r.draw().map(d=>d.count))===digest(expectedOriginalCounts));
ck('disposal leaves all original CPU buffers unchanged',r.originalCPU===sourceCPU&&originalIntegrity(r));
const afterDispose=r.gpu.writes();dispose();ck('repeated disposal has no extra uploads',r.gpu.writes()===afterDispose);
for(let cycle=0;cycle<3;cycle++){
 install();assert(r.gpuHash()===activeHash,'deterministic corrected GPU payload on reenable');
 assert(digest(r.draw().map(d=>d.count))===digest(activeDraw.map(d=>d.count)),'corrected draw counts on reenable');
 dispose();assert(inactive(r)&&r.gpuMatchesOriginal()&&originalIntegrity(r),'exact rollback on repeated detail toggles');
}
ck('three repeated enable/disable cycles restore exact payloads and counts',true);

// Force the existing enhanced-detail builder to fail before it publishes detail.
const reset=()=>{dispose();G.disposeCorridor794(S);},atlas=G.makeSignAtlas792;let buildFailures=0;
G.makeSignAtlas792=()=>{if(buildFailures++===0)throw Error('Injected enhanced-detail build failure');return atlas();};
install();G.makeSignAtlas792=atlas;
ck('enhanced build failure restores source and falls back to original enhanced renderer',buildFailures===2&&sourceFallback(r));
const fallbackWrites=r.gpu.writes();install();ck('failed correction remains cached without retrying source uploads',sourceFallback(r)&&r.gpu.writes()===fallbackWrites);
reset();install();dispose();ck('new scene ownership can enable correction after build failure',inactive(r)&&r.gpuMatchesOriginal());

// Inject a one-shot upload failure at every corrected original-buffer write.
// Record order from a real transaction, then reproduce each failure on this fixture.
const traceStart=r.gpu.events.length;install();
const targetBuffers=new Set(r.buffers().map(x=>x.h)),targetWrites=r.gpu.events.slice(traceStart).map((e,i)=>targetBuffers.has(e.buf)?i+1:null).filter(Boolean);dispose();
ck('all corrected uploads remain on original retained buffer handles',targetWrites.length>=10,{writes:targetWrites.length});
const failureCases=[];
for(const offset of targetWrites){
 reset();r.gpu.failAt(offset);install();const injected=r.gpu.failed();r.gpu.failAt(null);
 const pass=injected&&sourceFallback(r);
 failureCases.push({offset,pass});assert(pass,'atomic rollback after original-buffer upload failure at '+offset);
}
ck('each injected original-buffer upload failure atomically restores source rendering',failureCases.every(q=>q.pass),failureCases);
reset();r.gpu.errorOnce(1285);install();ck('GL error reported after upload rolls back the entire transaction',sourceFallback(r)&&/1285/.test(S.corridor794.failed));
reset();install();dispose();ck('successful install and disposal recover after every upload failure',inactive(r)&&r.gpuMatchesOriginal()&&originalIntegrity(r));

// Context snapshot is called immediately before hosted code marks the scene lost.
install();const lostWrites=r.gpu.writes(),snapshot=G.captureContextState792(S);S.lost=true;dispose();
ck('context loss disables corrected draws without uploading into a lost context',r.gpu.writes()===lostWrites&&inactive(r)&&snapshot.state.sim===S.sim&&originalIntegrity(r));
const drawReferences=new Map(S.corridor794.variants.map(q=>[q.original,q.draw]));G.unmount();
ck('lost-context unmount releases corrected CPU ownership and restores original draw functions',G.S===null&&S.corridor794===null&&r.gpu.writes()===lostWrites&&[...drawReferences].every(([m,draw])=>m.draw===draw)&&originalIntegrity(r));

// A rollback that fails cannot leave the scene rendering partly corrected data.
// Independent mounts also prove no failed or active state leaks across contexts.
for(const kind of ['rollback JS exception','persistent GL error','detail-off GL error','legacy render after fatal rollback']){
 const q=fixture(html,{enhanced:true,installCorridor:true});let threw=false;
 if(kind==='detail-off GL error'){q.G.installTrackDetail781(q.S);q.gpu.errorOnce(1285);}
 else if(kind==='persistent GL error'||kind==='legacy render after fatal rollback')q.gpu.errorAlways(1285);
 else q.gpu.failAt([targetWrites[0],targetWrites[0]+1]);
 const drawCount=q.gpu.draws.length;
 try{if(kind==='detail-off GL error')q.G.disposeTrackDetail781(q.S);else if(kind==='legacy render after fatal rollback')q.G.render();else q.G.installTrackDetail781(q.S);}catch(e){threw=true;}
 const expectedThrow=kind!=='detail-off GL error'&&kind!=='legacy render after fatal rollback';
 ck(kind+' stops and unmounts unsafe scene before any subsequent draw',threw===expectedThrow&&q.G.S===null&&q.S.lost&&q.unmountCalls()===1&&q.G.corridorFailure794?.restorationFailed&&q.S.corridor794===null&&q.gpu.draws.length===drawCount&&originalIntegrity(q));
 if(kind==='legacy render after fatal rollback'){const error=Error('Unrelated renderer error');q.setRenderError(error);let caught=null;try{q.G.render();}catch(e){caught=e;}ck('render fallback wrapper does not suppress unrelated failures',caught===error);}
}

// Real driving and camera functions, sampled for complete laps at the production
// physics frequency. The transformed 3D model bounds conservatively contain
// every fixed car vertex; checking their convex hull also catches corner cuts.
function convexHull(points){const P=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),a=[],b=[];
 for(const p of P){while(a.length>1&&cross(a.at(-2),a.at(-1),p)<=0)a.pop();a.push(p);}
 for(const p of P.slice().reverse()){while(b.length>1&&cross(b.at(-2),b.at(-1),p)<=0)b.pop();b.push(p);}return a.slice(0,-1).concat(b.slice(0,-1));}
const drive=old.G,driveS=old.S;drive.carModel=()=>({});
vm.runInContext('const HW=.395;'+take(html,'G.simReset=function()','/* everything that is rebuilt')+
 'const TAU=Math.PI*2;'+take(html,'G.raceCarModel=function(quality){','\n})();')+
 take(html,'G.raceCarMatrix=function(){','G.drawRaceCar=function'),old.context);
const model=drive.raceCarModel('high'),bodyBox=[];
for(const x of [model.bounds.min[0],model.bounds.max[0]])for(const y of [model.bounds.min[1],model.bounds.max[1]])for(const z of [model.bounds.min[2],model.bounds.max[2]])bodyBox.push([x,y,z]);
drive.VIEWS=['auto','chase','onboard','hero','heli','top','wide'].map(x=>[x,x]);
drive.setView=name=>{driveS.view=name;driveS.forceShot=name==='auto'?null:name;driveS.camBase=null;driveS.needsRender=true;return name;};
drive.framedFov=d=>d*Math.PI/180;driveS.pack={mPerPt:drive.M_PER_PT};
const cameraSource=fs.readFileSync(path.join(__dirname,'../camera794_src.js'),'utf8');vm.runInContext(cameraSource,old.context);
const drivingCases=[],cameraCases=[];
for(const [width,height]of [[390,650],[1280,517]])for(const mode of ['tour','chase','hero','onboard']){
 driveS.cv={clientWidth:width,clientHeight:height,style:{}};drive.simReset();drive.setView(mode);
 let samples=0,carMin=Infinity,carCrossings=0,lensMin=Infinity,roadSamples=0,rayCrossings=0;const carAudit=width===390&&mode==='tour';
 while(driveS.sim.s-driveS.gridS<driveS.CL.L&&samples<20000){drive.step(1/120);samples++;
  if(carAudit){const m=drive.raceCarMatrix(),P=bodyBox.map(p=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]),hull=convexHull(P);
   for(const p of P){assert(inside(p,corridor.outer)&&!inside(p,corridor.inner),'actual driven car bounds remain inside corrected corridor');carMin=Math.min(carMin,boundaryDistance(p,corridor.outer),boundaryDistance(p,corridor.inner));}
   for(let i=0;i<hull.length;i++)for(const loop of [corridor.outer,corridor.inner])for(let j=0;j<loop.length;j++)if(intersects(hull[i],hull[(i+1)%hull.length],loop[j],loop[(j+1)%loop.length]))carCrossings++;
  }
  const q=driveS.camera794?.report;
  if(q&&['chase','hero','onboard'].includes(q.shot)&&!q.transitionActive){
   const a=[q.eye[0],q.eye[2]],b=[q.target[0],q.target[2]];roadSamples++;
   assert(inside(a,corridor.outer)&&!inside(a,corridor.inner),'settled road camera lens remains inside measured corridor');
   lensMin=Math.min(lensMin,boundaryDistance(a,corridor.outer),boundaryDistance(a,corridor.inner));
   for(const loop of [corridor.outer,corridor.inner])for(let j=0;j<loop.length;j++)if(intersects(a,b,loop[j],loop[(j+1)%loop.length]))rayCrossings++;
  }
 }
 assert(samples<20000&&driveS.sim.s-driveS.gridS>=driveS.CL.L,'actual physics completes one lap');
 if(carAudit){drivingCases.push({samples,lapM:(driveS.sim.s-driveS.gridS)*drive.M_PER_PT,dimensionsM:model.bounds.max.map((v,k)=>(v-model.bounds.min[k])*driveS.tune.carS*drive.M_PER_PT),minimumClearanceM:carMin*drive.M_PER_PT,hullFenceCrossings:carCrossings});assert(carCrossings===0,'transformed car hull edges do not cut across a corrected fence');}
 cameraCases.push({width,height,mode,samples,roadSamples,minimumLensPlanClearanceM:lensMin*drive.M_PER_PT,rayCrossings});
 assert(roadSamples>1000&&rayCrossings===0&&lensMin*drive.M_PER_PT>.36,'lens and sightline clear both wall and inward catch-fence overhang');
}
ck('actual full-lap high-detail car bounding hull clears both corrected boundaries',true,drivingCases);
ck('actual road cameras and sightlines clear nearer fences for phone and desktop full laps',true,cameraCases);

const result={author:'Andrew Fisher',scope:'Actual-source CPU geometry, real mesh emitters and enhanced detail lifecycle with byte-recording fake GL; no browser/GPU/network or live record writes',
 candidate:{path:path.resolve(candidate),sha256:sha(html)},baseline:{path:baselinePath,sha256:sha(baseline)},sourceSha256:sha(source),
 elapsedMs:+(performance.now()-start).toFixed(2),cameraSha256:sha(cameraSource),stats:{stations:S.CL.n,banners:tags.length,topology,maxWidthErrorM:maxWidthError*G.M_PER_PT,correctedBufferWrites:targetWrites.length,drivingCases,cameraCases},checks};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,elapsedMs:result.elapsedMs,stats:result.stats},null,2));
