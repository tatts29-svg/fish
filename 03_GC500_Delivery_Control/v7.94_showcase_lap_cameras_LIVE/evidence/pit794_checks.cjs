/* Author: Andrew Fisher. Retained source geometry, bounded structure and lifecycle checks. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
if(!process.argv[2])throw Error('Usage: node scenery794_checks.cjs CANDIDATE_HTML [OUTPUT_JSON]');
const input=fs.readFileSync(process.argv[2],'utf8'),data=JSON.parse(input.match(/\bconst\s+DATA\s*=\s*(.*);/)[1]),
      moduleSource=fs.readFileSync(path.join(__dirname,'../pit794_src.js'),'utf8'),
      scenerySource=fs.readFileSync(path.join(__dirname,'../scenery794_src.js'),'utf8'),
      oldSource=fs.readFileSync(path.join(__dirname,'../../v7.92_showcase_photo_refinement_LIVE/photo_structures792_src.js'),'utf8');
let allocations=0,uploads=0;const draws=[],gpu=[];
class Mesh{
 constructor(gl,layout){allocations++;this.gl=gl;this.stride=layout.reduce((s,n)=>s+n,0);this.v=[];this.i=[];this.nv=0;}
 vert(...p){if(p.length!==this.stride)throw Error('Wrong stride');this.v.push(...p);return this.nv++;}
 tri(...p){this.i.push(...p);}upload(){uploads++;}get ni(){return this.i.length;}draw(){draws.push(['originalMesh',this.ni]);}
}
class Lines{
 constructor(gl){allocations++;this.gl=gl;this.n=0;this.data=new Float32Array(1000000);}
 seg(a,b,ca,cb,ra,rb,mp){this.data.set([...a,...b,...ca,...cb,ra,rb,mp||0],this.n++*17);}
 poly(p,c,r,mp,closed){for(let i=0;i<(closed?p.length:p.length-1);i++)this.seg(p[i],p[(i+1)%p.length],c,c,r,r,mp);}
 upload(){uploads++;}draw(){draws.push(['originalEdges',this.n]);}
}
const G={M_PER_PT:data.surrounds.mPerPt,MeshBatch:Mesh,LineBatch:Lines,
         earclip:P=>Array.from({length:Math.max(0,P.length-2)},(_,i)=>[0,i+1,i+2]).flat()},S={gl:{bindVertexArray(){},bindBuffer(){},
 bufferData(target,data){gpu.push({op:'indices',data:Array.from(data)});},
 bufferSubData(target,offset,data){gpu.push({op:'edges',data:Array.from(data)});},
 drawElements(mode,n){draws.push(['filteredMesh',n]);},drawArraysInstanced(mode,a,b,n){draws.push(['filteredEdges',n]);}},tune:{},o:{}};
G.S=S;const context=vm.createContext({window:{GC3D:G},G,S,data,o:{ring:data.circuit.ring,roadWidth:data.circuit.roadWidth,
 pit:data.surrounds.pit.map(a=>{const r=[];for(let i=1;i+1<a.length;i+=2)r.push([a[i]*data.surrounds.unit+data.surrounds.ox,a[i+1]*data.surrounds.unit+data.surrounds.oy]);return r;})}});
const region=(start,end)=>{const a=input.indexOf(start),b=input.indexOf(end,a+start.length);if(a<0||b<0)throw Error('Missing original source anchor: '+start);return input.slice(a,b);};
vm.runInContext(input.match(/G\.rng = function\(seed\).*?\n/)[0]+region('const area=G.area=','/* ear clipping')+
 region('G.M_PER_PT = ','/* Day Race is the production default.')+
 region('G.units=function(T){','/* What the scene is actually showing')+
 '\nS.tune=G.units(G.defaultTune());\n'+
 region(' /* key plan → world:',' /* ----- static batches ----- */'),context);
vm.runInContext(`const pk=data.surrounds,gl=S.gl,pts=(a,from)=>{const r=[];for(let i=from;i+1<a.length;i+=2)r.push([a[i]*pk.unit+pk.ox,a[i+1]*pk.unit+pk.oy]);return r;};const blist=pk.b.map(r=>({h:r[0]*.05,y0:r[1]*.05,p:pts(r,2)}));\n`+
 region(' const pitRows=(pk.pit||[])',' const n=G.setBuildings(blist);')+
 '\nS.architecture781Source=blist;\n'+region('G.setBuildings=function(list){','/* GC3D part 2b').replace(/\}\)\(\);\s*$/,'')+
 region('G.behindBarrier=function','G.setLook=function')+
 region('G.setStands=function(stands){','/* v6.63 - RACE-DAY DRESSING.')+
 '\nG.setBuildings(blist);G.setStands(data.circuit.stands);S.sim={s:S.gridS,v:8};S.cam={eye:[1,2,3]};',context);
G.installTrackDetail781=function(S,D){S.trackDetail781=D;return D.stats;};
G.disposeTrackDetail781=function(S){S.trackDetail781=null;S.detail781Enabled=false;};
vm.runInContext(oldSource,context);vm.runInContext(scenerySource,context);vm.runInContext(moduleSource,context);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),digest=x=>sha(JSON.stringify(x)),checks=[];
const ck=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail||''));};
const protectedSource=()=>({buildings:S.architecture781Source,pit:S.pitPts,route:S.CL,outer:S.outer,inner:S.inner,
 stands:S.stands,seats:S.standMesh.v,decor:S.standDecor.v,sim:S.sim,cam:S.cam,
 vertices:S.bMesh.v,indices:S.bMesh.i,ni:S.bMesh.ni,edgeData:S.bEdges.data,edgeCount:S.bEdges.n,
 height:[...Array(60)].map((_,i)=>S.heightAt(i*3-80,i*2-60))}),before=digest(protectedSource()),
 beforeHeight=S.heightAt,freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freeze);}return x;};
freeze(S.architecture781Source);freeze(S.bMesh.v);freeze(S.bMesh.i);
const D={mesh:new Mesh(S.gl,[3,3,2,4]),atlas:{white:[.5,.5]},stats:{}},allocationStart=allocations,uploadStart=uploads,
 start=performance.now(),pit=G.addPhotoStructures792(S,D),elapsedMs=performance.now()-start,stats=D.stats.openPit794;
ck('all 26 actual nominal envelopes produce open structure',!!stats&&stats.modules===26,stats&&stats.modules);
const state=S.pitShell794;
ck('each shell has exact original roof and four-wall ownership',state.ranges.mesh.length===26*5&&stats.suppressedShellTriangles===260,{ranges:state.ranges.mesh.length,triangles:stats.suppressedShellTriangles});
ck('original CPU index and edge arrays remain retained',state.allIndices.length===S.bMesh.i.length&&digest(Array.from(state.allIndices))===digest(S.bMesh.i)&&digest(Array.from(state.allEdges))===digest(Array.from(S.bEdges.data.slice(0,S.bEdges.n*17))));
const removed=new Set();state.ranges.mesh.forEach(r=>{for(let i=r.start;i<r.end;i++)removed.add(i);});
ck('filtered indices are exactly the original non-pit subsequence',digest(Array.from(state.filteredIndices))===digest(S.bMesh.i.filter((_,i)=>!removed.has(i))));
const removedEdges=new Set();state.ranges.edges.forEach(r=>{for(let i=r.start;i<r.end;i++)removedEdges.add(i);});
ck('filtered edges are exactly the original non-pit subsequence',digest(Array.from(state.filteredEdges))===digest(Array.from(state.allEdges).filter((_,i)=>!removedEdges.has(Math.floor(i/17)))));
ck('source geometry list route lane stands car cameras and obstruction map unchanged',before===digest(protectedSource())&&beforeHeight===S.heightAt);
ck('same detail batch no additional GPU resource or upload while building',allocations===allocationStart&&uploads===uploadStart&&gpu.length===0);
const valid=m=>m.v.length===m.nv*12&&m.v.every(Number.isFinite)&&m.i.every(n=>Number.isInteger(n)&&n>=0&&n<m.nv);
ck('all scene detail vertices finite indices valid and strides correct',valid(D.mesh));
let validNormals=true;
for(let i=0;i<D.mesh.i.length;i+=3){const a=D.mesh.v.slice(D.mesh.i[i]*12,D.mesh.i[i]*12+6),b=D.mesh.v.slice(D.mesh.i[i+1]*12,D.mesh.i[i+1]*12+3),c=D.mesh.v.slice(D.mesh.i[i+2]*12,D.mesh.i[i+2]*12+3),
 u=b.map((n,k)=>n-a[k]),v=c.map((n,k)=>n-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 if(Math.hypot(...n)<1e-12||Math.abs(Math.hypot(...a.slice(3))-1)>1e-8||n.reduce((s,v,k)=>s+v*a[k+3],0)<=0)validNormals=false;
}
ck('no degenerate faces and winding agrees with unit normals',validNormals);
let envelope=true,top=true;const bounds=[];
for(const a of stats.anchors){const b=S.architecture781Source[a.sourceIndex],P=b.p.map(S.toWorld),area=P.reduce((s,p,i)=>s+p[0]*P[(i+1)%4][1]-p[1]*P[(i+1)%4][0],0),sign=area>0?1:-1;let error=0;
 for(let i=a.vertexStart;i<a.vertexEnd;i++){
  const [x,y,z]=D.mesh.v.slice(i*12,i*12+3);
  for(let j=0;j<4;j++){const p=P[j],q=P[(j+1)%4],cross=((q[0]-p[0])*(z-p[1])-(q[1]-p[1])*(x-p[0]))*sign;
   error=Math.max(error,-cross);if(cross< -1e-8)envelope=false;}
  if(y>b.h+1e-9||y<a.sourceBase-1e-9)top=false;
 }bounds.push({sourceIndex:a.sourceIndex,outsideCrossError:error});
}
ck('all generated vertices remain within every original pit footprint',envelope,bounds.filter(b=>b.outsideCrossError>1e-8));
ck('all generated heights remain inside each original source envelope',top);
ck('two solid decks two roof slopes and connected framing per module',stats.decks===52&&stats.roofSlopes===52&&stats.steelColumns===208&&stats.joists===208&&stats.rails===208&&stats.braces===208,stats);
ck('pit triangle budget enforced for all 26 modules',stats.triangles<=14000&&stats.anchors.every(a=>a.triangles<=Math.floor(14000/26/2)*2),stats.triangles);
// Geometry-level opening proof: cast front-to-back through the interior of both
// storeys. Full-height source shell panels would block all these finite segments.
const minus=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const hit=(o,d,a,b,c)=>{const e1=minus(b,a),e2=minus(c,a),p=cross(d,e2),det=dot(e1,p);if(Math.abs(det)<1e-10)return false;
 const inv=1/det,t=minus(o,a),u=dot(t,p)*inv;if(u<0||u>1)return false;const q=cross(t,e1),v=dot(d,q)*inv;if(v<0||u+v>1)return false;const k=dot(e2,q)*inv;return k>0&&k<1;};
let openRays=0,totalRays=0,minOpen=10;
for(const a of stats.anchors){const b=S.architecture781Source[a.sourceIndex],P=b.p.map(S.toWorld),Q=[0,1,2,3].map(i=>P[(a.frontageEdge+i)%4]),at=(u,v,y)=>[(1-v)*((1-u)*Q[0][0]+u*Q[1][0])+v*((1-u)*Q[3][0]+u*Q[2][0]),y,(1-v)*((1-u)*Q[0][1]+u*Q[1][1])+v*((1-u)*Q[3][1]+u*Q[2][1])];let clear=0;
 for(const y of [a.sourceBase+(a.sourceTop-a.sourceBase)*.26,a.sourceBase+(a.sourceTop-a.sourceBase)*.77])for(const u of [.14,.30,.46,.62,.78]){
  const o=at(u,-.01,y),d=minus(at(u,1.01,y),o);let blocked=false;
  for(let i=0;i<D.mesh.i.length;i+=3){const ix=D.mesh.i[i];if(ix<a.vertexStart||ix>=a.vertexEnd)continue;
   const p=[0,1,2].map(k=>D.mesh.v.slice(D.mesh.i[i+k]*12,D.mesh.i[i+k]*12+3));if(hit(o,d,...p)){blocked=true;break;}}
  totalRays++;if(!blocked){clear++;openRays++;}
 }minOpen=Math.min(minOpen,clear);
}
ck('both storeys are geometrically open rather than dark panels',minOpen>=7,{openRays,totalRays,minOpen});
const vertexCount=D.mesh.nv,indexCount=D.mesh.i.length;
ck('repeated scenery installation is idempotent',G.addScenery794(S,D)===pit&&D.mesh.nv===vertexCount&&D.mesh.i.length===indexCount);
S.detail781Enabled=true;G.installTrackDetail781(S,D);
ck('successful detail installation swaps only two existing GPU buffers',state.active&&gpu.length===2&&state.transitions===1&&state.uploads===2);
S.bMesh.draw();S.bEdges.draw();
ck('filtered draws use retained buffers and filtered counts',draws.at(-2)[0]==='filteredMesh'&&draws.at(-2)[1]===state.filteredIndices.length&&draws.at(-1)[1]===state.filteredEdges.length/17);
for(let i=0;i<5;i++){G.syncPitShell794(S);S.bMesh.draw();S.bEdges.draw();}
ck('stable rendering and sync cause no extra GPU upload',gpu.length===2&&state.transitions===1);
G.disposeTrackDetail781(S);S.bMesh.draw();S.bEdges.draw();
ck('detail off restores full original buffers and original draw functions',!state.active&&gpu.length===4&&digest(gpu[2].data)===digest(Array.from(state.allIndices))&&digest(gpu[3].data)===digest(Array.from(state.allEdges))&&draws.at(-2)[0]==='originalMesh'&&draws.at(-1)[0]==='originalEdges');
S.detail781Enabled=true;G.installTrackDetail781(S,D);S.lost=true;G.disposeTrackDetail781(S);
ck('context loss performs no invalid GPU uploads',gpu.length===6);
S.lost=false;G.syncPitShell794(S);
ck('restoration can return unchanged original rendering',!state.active&&gpu.length===8);
ck('all lifecycle operations preserve source and obstruction metadata',before===digest(protectedSource())&&beforeHeight===S.heightAt);
const save=S.pitShellRanges794;S.pitShellRanges794=null;const missing={...S,pitShell794:null},blank={mesh:new Mesh(S.gl,[3,3,2,4]),atlas:D.atlas,stats:{photoStructures:{},scenery794:{}}};
ck('missing ownership metadata refuses substitution without geometry mutation',G.addOpenPit794(missing,blank,pit.anchors)===false&&blank.mesh.nv===0);S.pitShellRanges794=save;
const incomplete={...S,pitShell794:{...state,ranges:{mesh:state.ranges.mesh.slice(1),edges:state.ranges.edges}}},
 rejected={mesh:new Mesh(S.gl,[3,3,2,4]),atlas:D.atlas,stats:{photoStructures:{},scenery794:{}}};
ck('incomplete shell ownership retains original render without adding geometry',G.addOpenPit794(incomplete,rejected,pit.anchors)===false&&rejected.mesh.nv===0);
const damagedRows=S.architecture781Source.slice(),firstPit=pit.anchors[0].sourceIndex;
damagedRows[firstPit]={...damagedRows[firstPit],h:0};
ck('invalid source heights refuse substitution without changing source or output',G.addOpenPit794({...S,architecture781Source:damagedRows},rejected,pit.anchors)===false&&rejected.mesh.nv===0);
const absent=G.addOpenPit794;delete G.addOpenPit794;
const fallback={mesh:new Mesh(S.gl,[3,3,2,4]),atlas:D.atlas,stats:{}};G.addScenery794(S,fallback);G.addOpenPit794=absent;
ck('missing open helper retains the original bounded relief and all stand detail',!fallback.stats.openPit794&&fallback.stats.scenery794.pitModules===26&&fallback.stats.scenery794.pitFacades===104&&fallback.stats.scenery794.standsDetailed===S.stands.length);
const sourceBuilt=moduleSource.replace(/ {2,}/g,' ').replaceAll(' .','.').replaceAll(' ,',',');
ck('candidate includes current pit helper',input.includes(moduleSource)||input.includes(sourceBuilt));
const result={author:'Andrew Fisher',scope:'CPU checks; browser appearance and actual context recovery require integration',inputHtml:{path:process.argv[2],sha256:sha(input)},sourceSha256:sha(moduleSource),elapsedMs,checks,stats};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,pitModules:stats.modules,triangles:stats.triangles,openRays,totalRays,elapsedMs}));
