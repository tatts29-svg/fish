/* Author: Andrew Fisher. Actual source pit shells, geometry limits and lifecycle checks. */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
if(!process.argv[2])throw Error('Usage: node cpu_photo_structures_checks.cjs SOURCE_HTML [OUTPUT_JSON]');
const html=fs.readFileSync(process.argv[2],'utf8'),data=JSON.parse(html.match(/\bconst\s+DATA\s*=\s*(.*);/)[1]),
      source=fs.readFileSync(path.join(__dirname,'..','photo_structures792_src.js'),'utf8');
let allocations=0,uploads=0;
class MeshBatch{
 constructor(){allocations++;this.v=[];this.i=[];this.nv=0;}
 vert(...p){this.v.push(...p);return this.nv++;}
 tri(...p){this.i.push(...p);}get ni(){return this.i.length;}
 upload(){uploads++;}draw(){throw Error('A static detail helper must not issue a draw');}
}
class LineBatch{constructor(){allocations++;}poly(){}upload(){uploads++;}}
const G={M_PER_PT:data.surrounds.mPerPt,MeshBatch,LineBatch},S={tune:{deckH:.08},gl:{}};
const context=vm.createContext({window:{GC3D:G},G,S,data,o:{ring:data.circuit.ring,roadWidth:data.circuit.roadWidth}});
const helpers=html.slice(html.indexOf('const area=G.area='),html.indexOf('/* ear clipping')),
      centre=html.slice(html.indexOf(' /* key plan → world:'),html.indexOf(' /* speed from curvature')),
      pit=html.slice(html.indexOf(' const pitRows=(pk.pit||[])'),html.indexOf(' const n=G.setBuildings(blist);'));
if(!helpers||!centre||!pit)throw Error('Original source construction anchors are missing');
vm.runInContext(helpers+centre+`\nconst pk=data.surrounds,blist=[],gl=S.gl;const pts=(a,from)=>{const result=[];for(let i=from;i+1<a.length;i+=2)result.push([a[i]*pk.unit+pk.ox,a[i+1]*pk.unit+pk.oy]);return result;};\n`+pit+
 '\nS.architecture781Source=blist;S.sim={s:42,v:8};S.cam={eye:[1,2,3]};',context);
vm.runInContext(source,context);
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const before=digest({source:S.architecture781Source,pit:S.pitPts,route:S.CL,sim:S.sim,cam:S.cam});
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freeze);}return x;};
[S.architecture781Source,S.pitPts,S.CL,S.sim,S.cam].forEach(freeze);
const D={mesh:new MeshBatch(),atlas:{white:[.5,.5]},stats:{}},allocBefore=allocations,uploadBefore=uploads,
      start=performance.now(),stats=G.addPhotoStructures792(S,D),elapsedMs=performance.now()-start,checks=[];
const ck=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name);};
const validMesh=mesh=>mesh.v.length===mesh.nv*12&&mesh.v.every(Number.isFinite)&&mesh.i.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.nv);
const normalsValid=mesh=>{
 for(let i=0;i<mesh.i.length;i+=3){
  const a=mesh.v.slice(mesh.i[i]*12,mesh.i[i]*12+6),b=mesh.v.slice(mesh.i[i+1]*12,mesh.i[i+1]*12+3),c=mesh.v.slice(mesh.i[i+2]*12,mesh.i[i+2]*12+3),
        u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(Math.hypot(...n)<1e-12||Math.abs(Math.hypot(...a.slice(3))-1)>1e-8||n.reduce((s,v,k)=>s+v*a[k+3],0)<=0)return false;
 }
 return true;
};
ck('actual registered source pit buildings all receive detail',stats.sourcePitModules>0&&stats.modules===stats.sourcePitModules&&stats.allValidModulesDetailed,{source:stats.sourcePitModules,detailed:stats.modules});
ck('existing source, pit lane, complete route, simulation and camera unchanged',before===digest({source:S.architecture781Source,pit:S.pitPts,route:S.CL,sim:S.sim,cam:S.cam}));
ck('static additions reuse parent mesh with no uploads or GPU allocations',allocBefore===allocations&&uploadBefore===uploads&&stats.newDrawCalls===0&&stats.newGPUResources===0);
ck('finite correctly-strided mesh and valid indices',validMesh(D.mesh));
ck('non-degenerate faces with correct unit normals and winding',normalsValid(D.mesh));
ck('bounded below ten thousand triangles',stats.triangles===D.mesh.i.length/3&&stats.triangles<=9600,stats.triangles);
ck('meaningful complete frontage treatment',stats.lowerBays>=stats.modules*2&&stats.upperRails>=stats.modules*2&&stats.steelUprights>=stats.modules*2&&stats.roofEdges===stats.modules*4&&stats.braces===stats.modules*2);
const inPoly=(p,P)=>{let hit=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
let maximumProjection=0,heightWithin=true;
for(const anchor of stats.anchors){
 const b=S.architecture781Source[anchor.sourceIndex],P=b.p.map(S.toWorld);
 for(let i=anchor.vertexStart;i<anchor.vertexEnd;i++){
  const p=[D.mesh.v[i*12],D.mesh.v[i*12+2]],y=D.mesh.v[i*12+1];if(y>b.h+1e-10)heightWithin=false;
  if(inPoly(p,P))continue;
  let d=Infinity;for(let k=0;k<P.length;k++){
   const a=P[k],c=P[(k+1)%P.length],dx=c[0]-a[0],dz=c[1]-a[1],l=dx*dx+dz*dz;
   if(l<1e-12)continue;const u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l));
   d=Math.min(d,Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dz));
  }
  maximumProjection=Math.max(maximumProjection,d*G.M_PER_PT);
 }
}
ck('facade relief stays within sixteen centimetres of source shell',maximumProjection<=.16000001,maximumProjection);
ck('no new roof-height silhouette',heightWithin);
const vertexCount=D.mesh.nv,indexCount=D.mesh.i.length;
ck('repeat call is idempotent',G.addPhotoStructures792(S,D)===stats&&D.mesh.nv===vertexCount&&D.mesh.i.length===indexCount);
const fixture=(count=1,reversed=false)=>{
 const source=[];for(let j=0;j<count;j++){const x=j*4;source.push({pit:true,h:1.2,p:(reversed?[[x,2],[x+3,2],[x+3,0],[x,0]]:[[x,0],[x+3,0],[x+3,2],[x,2]])});}
 return {architecture781Source:source,pitPts:[[[0,-1],[count*4+3,-1]]],toWorld:p=>p.slice(),tune:{deckH:.08}};
};
const runFixture=s=>{const d={mesh:new MeshBatch(),atlas:{white:[.5,.5]},stats:{}};return {stats:G.addPhotoStructures792(s,d),mesh:d.mesh};};
for(const reversed of [false,true]){
 const r=runFixture(fixture(1,reversed));ck('frontage follows pit lane with '+(reversed?'clockwise':'anticlockwise')+' source winding',r.stats.modules===1&&Math.abs(r.stats.anchors[0].laneDistanceM-G.M_PER_PT)<1e-8&&validMesh(r.mesh)&&normalsValid(r.mesh));
}
const crowded=runFixture(fixture(90));
ck('larger source distributes bounded detail across every module',crowded.stats.modules===90&&crowded.stats.triangles<=9600&&crowded.stats.allValidModulesDetailed&&new Set(crowded.stats.anchors.map(a=>a.triangles)).size===1,{modules:crowded.stats.modules,triangles:crowded.stats.triangles});
const absent=fixture();absent.pitPts=[];const noLane=runFixture(absent);
ck('missing lane anchor adds no guessed placement',noLane.stats.modules===0&&noLane.stats.missingLaneAnchors===1&&noLane.mesh.i.length===0);
const invalid=fixture();invalid.architecture781Source.push({pit:true,h:1.2,p:[[NaN,0],[1,0],[1,1],[0,1]]},{h:1.2,p:[[10,0],[13,0],[13,2],[10,2]]});
invalid.architecture781Source.push({...invalid.architecture781Source[0]});const malformed=runFixture(invalid);
ck('malformed duplicate and non-pit source rows do not create extra structures',malformed.stats.modules===1&&malformed.stats.invalidSourceModules===1&&malformed.stats.duplicateModules===1&&validMesh(malformed.mesh));
const result={author:'Andrew Fisher',scope:'CPU geometry on actual retained pit source; browser visual and smoothness checks remain required',inputHtml:{path:process.argv[2],sha256:crypto.createHash('sha256').update(html).digest('hex')},sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),elapsedMs,maximumProjectionM:maximumProjection,stats,checks};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,modules:stats.modules,triangles:stats.triangles,maximumProjectionM:maximumProjection,elapsedMs}));
