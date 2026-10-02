/* Author: Andrew Fisher. Retained source geometry, bounded structure and lifecycle checks. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
if(!process.argv[2])throw Error('Usage: node scenery794_checks.cjs SOURCE_HTML [OUTPUT_JSON]');
const input=fs.readFileSync(process.argv[2],'utf8'),data=JSON.parse(input.match(/\bconst\s+DATA\s*=\s*(.*);/)[1]),
      moduleSource=fs.readFileSync(path.join(__dirname,'../scenery794_src.js'),'utf8'),
      oldSource=fs.readFileSync(path.join(__dirname,'../../v7.92_showcase_photo_refinement_LIVE/photo_structures792_src.js'),'utf8');
let allocations=0,uploads=0;
class Mesh{
 constructor(gl,layout){allocations++;this.stride=layout.reduce((s,n)=>s+n,0);this.v=[];this.i=[];this.nv=0;}
 vert(...p){if(p.length!==this.stride)throw Error('Wrong stride');this.v.push(...p);return this.nv++;}
 tri(...p){this.i.push(...p);}upload(){uploads++;}get ni(){return this.i.length;}
}
class Lines{constructor(){allocations++;}seg(){}poly(){}upload(){uploads++;}}
const G={M_PER_PT:data.surrounds.mPerPt,MeshBatch:Mesh,LineBatch:Lines,
         earclip:P=>Array.from({length:Math.max(0,P.length-2)},(_,i)=>[0,i+1,i+2]).flat()},S={gl:{},tune:{},o:{}};
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
vm.runInContext(oldSource,context);vm.runInContext(moduleSource,context);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),digest=x=>sha(JSON.stringify(x)),
 protectedSource=()=>({buildings:S.architecture781Source,pit:S.pitPts,route:S.CL,outer:S.outer,inner:S.inner,
 stands:S.stands,seats:S.standMesh.v,decor:S.standDecor.v,sim:S.sim,cam:S.cam}),before=digest(protectedSource()),
 freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freeze);}return x;};
freeze(protectedSource());
const D={mesh:new Mesh({},[3,3,2,4]),atlas:{white:[.5,.5]},stats:{}},allocationStart=allocations,uploadStart=uploads,
      start=performance.now(),pit=G.addPhotoStructures792(S,D),elapsedMs=performance.now()-start,stats=D.stats.scenery794,checks=[];
const ck=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name);};
const valid=m=>m.v.length===m.nv*12&&m.v.every(Number.isFinite)&&m.i.every(n=>Number.isInteger(n)&&n>=0&&n<m.nv);
const winding=m=>{
 for(let i=0;i<m.i.length;i+=3){const a=m.v.slice(m.i[i]*12,m.i[i]*12+6),b=m.v.slice(m.i[i+1]*12,m.i[i+1]*12+3),c=m.v.slice(m.i[i+2]*12,m.i[i+2]*12+3),
  u=b.map((n,k)=>n-a[k]),v=c.map((n,k)=>n-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(Math.hypot(...n)<1e-12||Math.abs(Math.hypot(...a.slice(3))-1)>1e-8||n.reduce((s,v,k)=>s+v*a[k+3],0)<=0)return false;
 }return true;
};
ck('all actual existing pit modules receive replacement detail',pit.modules===26&&pit.modules===pit.sourcePitModules,{modules:pit.modules});
ck('all four source faces receive open-bay contrast',stats.pitFacades===pit.modules*4&&stats.pitOpenBayPanels>=pit.modules*16);
ck('old pit geometry is counted but never appended',stats.replacedPitTriangles===6136&&stats.oldPitGeometryAppended===false);
ck('stand frames read from original seating and canopy vertices',stats.standFramesValidated>0&&stats.standFramesValidated===S.stands.length&&stats.standsDetailed===S.stands.length,{stands:S.stands.length});
ck('every existing canopy gains underside fascia and connected supports',stats.roofSoffits===S.stands.length&&stats.roofFascias===S.stands.length*4&&stats.roofSupportColumns===S.stands.length*4&&stats.roofTrussMembers===S.stands.length*19);
ck('clear stands gain complete bounded stair runs',stats.stairRuns>0&&stats.stairTreads>=stats.stairRuns*30&&stats.stairRuns+stats.stairRunsSkipped===S.stands.length,{stairs:stats.stairRuns,treads:stats.stairTreads});
ck('source route building positions pit lane stands car and camera untouched',before===digest(protectedSource()));
ck('same parent batch no GPU resource creation or upload',allocations===allocationStart&&uploads===uploadStart&&stats.newGPUResources===0&&stats.newDrawCalls===0&&stats.perFrameWork===0);
ck('finite correctly strided mesh with valid indices',valid(D.mesh));
ck('non-degenerate faces and outward unit normals',winding(D.mesh));
ck('pit and stand triangle budgets enforced',stats.pitTriangles<=14000&&stats.standTriangles<=12000&&stats.triangles===D.mesh.i.length/3&&stats.triangles<=26000,{pit:stats.pitTriangles,stands:stats.standTriangles,total:stats.triangles});
const inside=(p,P)=>{let hit=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
let projection=0,pitHeight=true,standEnvelope=true;
for(const a of stats.pitAnchors){const b=S.architecture781Source[a.sourceIndex],P=b.p.map(S.toWorld);
 for(let i=a.vertexStart;i<a.vertexEnd;i++){const p=[D.mesh.v[i*12],D.mesh.v[i*12+2]],y=D.mesh.v[i*12+1];if(y>b.h+1e-8)pitHeight=false;
  if(inside(p,P))continue;let dist=Infinity;for(let j=0;j<P.length;j++){const q=P[j],r=P[(j+1)%P.length],dx=r[0]-q[0],dz=r[1]-q[1],l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p[0]-q[0])*dx+(p[1]-q[1])*dz)/l)):0;
   dist=Math.min(dist,Math.hypot(p[0]-q[0]-t*dx,p[1]-q[1]-t*dz));}projection=Math.max(projection,dist*G.M_PER_PT);
 }
}
for(const a of stats.standAnchors){const f=G.standFrames794(S).find(f=>f.index===a.sourceIndex);
 for(let i=a.vertexStart;i<a.vertexEnd;i++){const p=[D.mesh.v[i*12]-f.front[0],D.mesh.v[i*12+1],D.mesh.v[i*12+2]-f.front[2]],u=p[0]*f.t[0]+p[2]*f.t[2],v=p[0]*f.n[0]+p[2]*f.n[2];
  if(Math.abs(u)>f.length*.52+1e-7||v<-.01||v>f.depth*1.06+.01||p[1]>Math.max(...f.roof.map(p=>p[1]))+.01)standEnvelope=false;
 }
}
ck('pit relief stays within sixteen centimetres of original shells',projection<=.160001,projection);
ck('source pit roof heights not exceeded',pitHeight);
ck('stand additions remain beneath existing canopy envelope',standEnvelope);
const vertices=D.mesh.nv,indices=D.mesh.i.length;
ck('repeat build is idempotent',G.addScenery794(S,D)===pit&&D.mesh.nv===vertices&&D.mesh.i.length===indices);
const empty={gl:{},tune:{deckH:.03},architecture781Source:[],pitPts:[],stands:[],toWorld:p=>p},
      blank={mesh:new Mesh({},[3,3,2,4]),atlas:{white:[.5,.5]},stats:{}};
G.addScenery794(empty,blank);ck('absent source produces no guessed geometry',blank.mesh.i.length===0&&blank.stats.scenery794.standsDetailed===0);
const malformed={...S,standMesh:{stride:9,v:S.standMesh.v.slice(1)}};
ck('invalid stand source layout is rejected without invented anchors',G.standFrames794(malformed).length===0);
const result={author:'Andrew Fisher',scope:'CPU geometry and source/lifecycle invariants; visual browser validation required',
 inputHtml:{path:process.argv[2],sha256:sha(input)},sourceSha256:sha(moduleSource),elapsedMs,maximumPitReliefM:projection,checks,stats};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,pitModules:stats.pitModules,stands:stats.standsDetailed,stairRuns:stats.stairRuns,triangles:stats.triangles,elapsedMs}));
