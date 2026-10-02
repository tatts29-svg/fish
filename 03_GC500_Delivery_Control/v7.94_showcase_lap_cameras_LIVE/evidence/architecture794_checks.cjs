/* Author: Andrew Fisher. Actual-source facade geometry, budget, lifecycle and failure checks. */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const here=path.resolve(__dirname,'..'),htmlPath=process.argv[2]||path.join(here,'../build/GC500_v7.94/GC500_Delivery_Control_hosted.html');
const html=fs.readFileSync(htmlPath,'utf8'),source=fs.readFileSync(path.join(here,'architecture794_src.js'),'utf8');
const baseline=fs.readFileSync(path.join(here,'../v7.92_showcase_photo_refinement_LIVE/architecture792_src.js'),'utf8');
const data=JSON.parse(html.match(/\bconst\s+DATA\s*=\s*(.*);/)[1]);
const take=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);if(i<0||j<i)throw Error('Missing original source anchor: '+a);return html.slice(i,j);};
const digest=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const checks=[],check=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)throw Error(name+' '+JSON.stringify(detail));};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freeze);}return x;};

function makeGL(fail){
 const allocated=[],deleted=[],shaders=[];
 const create=kind=>{const h={kind,id:allocated.length};allocated.push(h);return h;};
 const gl={VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,allocated,deleted,shaders,
  createProgram:()=>create('program'),createShader:type=>Object.assign(create('shader'),{type}),
  createBuffer:()=>create('buffer'),createVertexArray:()=>create('vao'),
  deleteProgram:h=>deleted.push(h),deleteShader:h=>deleted.push(h),deleteBuffer:h=>deleted.push(h),deleteVertexArray:h=>deleted.push(h),
  shaderSource(h,text){h.source=text;shaders.push(text);},getShaderParameter:h=>!(fail==='compile'&&h.type===35632),
  getProgramParameter:()=>fail!=='link',getShaderInfoLog:()=> 'injected compile failure',getProgramInfoLog:()=> 'injected link failure',
  getUniformLocation:()=>({}),compileShader(){},attachShader(){},linkProgram(){},disable(){},enable(){},depthMask(){},
  useProgram(){},uniformMatrix4fv(){},uniform2fv(){},uniform3fv(){},uniform1f(){}};
 return gl;
}
function makeRig(code=source,fail=null){
 const gl=makeGL(fail),counts={allocations:0,uploads:0,draws:0,renders:0};
 class MeshBatch{
  constructor(g,layout=[3,4,2]){counts.allocations++;this.layout=layout;this.stride=layout.reduce((s,v)=>s+v,0);this.v=[];this.i=[];this.nv=0;this.vb=gl.createBuffer();this.ib=gl.createBuffer();this.vao=gl.createVertexArray();}
  vert(...p){this.v.push(...p);return this.nv++;}tri(...p){this.i.push(...p);}get ni(){return this.i.length;}
  upload(){counts.uploads++;if(fail==='upload'&&this.stride===12)throw Error('injected upload failure');}draw(){counts.draws++;}
 }
 class LineBatch{constructor(){this.n=0;}seg(){this.n++;}poly(){}upload(){}}
 const G={M_PER_PT:data.surrounds.mPerPt,MeshBatch,LineBatch,sunDirection:[.4,.8,.2],bindSunShadow(){},
  V:{norm(v){const l=Math.hypot(...v);return v.map(x=>x/l);}},rng(){throw Error('Visual architecture must not consume scene RNG');}};
 const S={gl,o:{},tune:{deckH:.08},sim:{s:42,v:8},cam:{eye:[1,2,3]},look:{day:true},detail781Enabled:true,collisionSentinel:{source:'unchanged'}};G.S=S;
 G.setBuildings=list=>{S.architecture781Source=list;return list.length;};
 const context=vm.createContext({window:{GC3D:G},G,S,data,o:{ring:data.circuit.ring,roadWidth:data.circuit.roadWidth}});
 vm.runInContext(take('const area=G.area=','/* ear clipping')+take(' /* key plan → world:',' /* speed from curvature'),context);
 vm.runInContext(take('G.loadPack=function(pk){',' const n=G.setBuildings(blist);')+' return G.setBuildings(blist);};\nG.loadPack(data.surrounds);',context);
 vm.runInContext(code,context);
 return {G,S,gl,counts,context,call:text=>vm.runInContext(text,context)};
}
function meshValid(mesh){
 if(mesh.v.length!==mesh.nv*mesh.stride||!mesh.v.every(Number.isFinite)||!mesh.i.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.nv))return false;
 for(let i=0;i<mesh.i.length;i+=3){
  const a=mesh.v.slice(mesh.i[i]*mesh.stride,mesh.i[i]*mesh.stride+6),b=mesh.v.slice(mesh.i[i+1]*mesh.stride,mesh.i[i+1]*mesh.stride+3),c=mesh.v.slice(mesh.i[i+2]*mesh.stride,mesh.i[i+2]*mesh.stride+3);
  const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(Math.hypot(...n)<1e-12||Math.abs(Math.hypot(...a.slice(3))-1)>1e-8||n.reduce((s,v,k)=>s+v*a[k+3],0)<=0)return false;
 }
 return true;
}
const snapshot=S=>digest({source:S.architecture781Source,route:S.CL,pit:S.pitPts,sim:S.sim,cam:S.cam,collision:S.collisionSentinel});
const old=makeRig(baseline),oldStats=old.G.installArchitecture781(old.S);
const r=makeRig(),{G,S}=r,before=snapshot(S),sourceRows=S.architecture781Source.length,pitRows=S.architecture781Source.filter(b=>b.pit).length;
[S.architecture781Source,S.CL,S.pitPts,S.sim,S.cam,S.collisionSentinel].forEach(freeze);
const started=performance.now(),stats=G.installArchitecture781(S),elapsedMs=performance.now()-started,mesh=S.architecture781.mesh;
check('actual hosted source includes the complete building and nominal garage list',sourceRows===2730&&pitRows===26,{sourceRows,pitRows});
check('all original source rows, footprints, heights, route, pit, simulation and camera unchanged',snapshot(S)===before);
check('exact original tower and facade eligibility retained',stats.eligibleTowerParts===oldStats.eligibleTowerParts&&stats.eligibleFacades===oldStats.eligibleFacades,{towerParts:stats.towerParts,facades:stats.facadeElevations});
check('every eligible facade in every eligible circuit sector receives detail',stats.fullEligibleCoverage&&stats.coverageSectors===stats.eligibleSectors&&stats.eligibleSectors===10,{covered:stats.coverageSectors,eligible:stats.eligibleSectors});
check('unchanged deterministic facade profile allocation',JSON.stringify(stats.facadeProfiles)===JSON.stringify(oldStats.facadeProfiles),stats.facadeProfiles);
check('fixed total and per-sector budgets retained',stats.triangleBudget===150000&&stats.triangles<=150000&&stats.sectors.every(s=>s.triangles<=12500),{triangles:stats.triangles,baseline:oldStats.triangles});
check('all finite vertices, valid indices, non-degenerate faces, unit normals and matching winding',meshValid(mesh));
check('facade-local attribute has twelve-float stride and nonconstant bay coordinates',mesh.stride===12&&mesh.v.some((v,i)=>i%12===10&&v>1)&&mesh.v.some((v,i)=>i%12===11&&v===1));
check('real recessed jambs, slab soffits, balcony returns and existing-base podium contrast generated',stats.recessedJambs>0&&stats.slabSoffits===stats.balconySlabs&&stats.balconyReturns===stats.balconySlabs*2&&stats.podiumBays>0&&stats.podiumLintels===stats.podiumBays);
check('more physical storey slabs fit inside the unchanged budget',stats.balconySlabs>oldStats.balconySlabs,{slabs:stats.balconySlabs,baseline:oldStats.balconySlabs});
let handrailCaps=0,capsUp=true;
for(let i=0;i<mesh.nv;i+=4){const q=[0,1,2,3].map(k=>mesh.v.slice((i+k)*12,(i+k+1)*12));
 const span=Math.max(...q.map(p=>Math.hypot(p[0]-q[0][0],p[2]-q[0][2])))*G.M_PER_PT;
 if(span>.5&&q.every(p=>Math.abs(p[1]-q[0][1])<1e-10)&&Math.abs(q[0][6]-.17)<1e-10&&Math.abs(q[0][7]-.19)<1e-10){handrailCaps++;capsUp=capsUp&&q.every(p=>p[4]>.999999);}
}
check('every thin horizontal handrail cap faces upward',capsUp&&handrailCaps===stats.thinHandrailProfiles,{handrailCaps});
const geometryHash=digest({v:mesh.v,i:mesh.i}),allocations=r.counts.allocations,programs=r.gl.allocated.length;
check('repeat installation returns the same stats without allocating',G.installArchitecture781(S)===stats&&r.counts.allocations===allocations);
for(const day of [true,false]){S.look.day=day;G.drawArchitecture781(S,new Float32Array(16),[1,100]);}
check('day and night draws do not rebuild geometry or shaders',r.counts.allocations===allocations&&r.gl.allocated.length===programs&&r.counts.draws===2);
G.disposeArchitecture781(S);
check('disposal unregisters the shadow mesh and removes the installed object',S.architecture781===null&&S.detail781ShadowMeshes.length===0);
check('every architecture GPU handle is released exactly once',new Set(r.gl.deleted).size===r.gl.deleted.length);
G.installArchitecture781(S);
check('reinstallation reproduces every vertex and index exactly',digest({v:S.architecture781.mesh.v,i:S.architecture781.mesh.i})===geometryHash);
check('protected scene data remains unchanged after draws and reinstallation',snapshot(S)===before);

const ring=radius=>{const p=Array.from({length:120},(_,i)=>[radius*Math.cos(i*Math.PI/60),radius*Math.sin(i*Math.PI/60),2]);return {p,n:p.length};};
let maxProjectionM=0;
for(const unit of [3,5.93755,10])for(const reversed of [false,true])for(const baseM of [0,8]){
 const f=makeRig(),angle=.63,x=Math.cos(angle)*1080/unit,z=Math.sin(angle)*1080/unit,turn=1.2;
 const P=[[-12,-9],[12,-9],[12,9],[-12,9]].map(([u,v])=>[x+(u*Math.cos(turn)-v*Math.sin(turn))/unit,z+(u*Math.sin(turn)+v*Math.cos(turn))/unit]);if(reversed)P.reverse();
 const b={h:92/unit,y0:baseM/unit,p:P};f.S.pack={mPerPt:unit};f.S.CL=ring(1000/unit);f.S.toWorld=p=>p.slice();f.S.architecture781Source=[b];freeze(b);
 const q=f.G.installArchitecture781(f.S),m=f.S.architecture781.mesh;
 let bounded=true;for(let i=0;i<m.nv;i++){
  const p=m.v.slice(i*12,i*12+3),dx=(p[0]-x)*unit,dz=(p[2]-z)*unit,u=dx*Math.cos(turn)+dz*Math.sin(turn),v=-dx*Math.sin(turn)+dz*Math.cos(turn);
  const projection=Math.hypot(Math.max(0,Math.abs(u)-12),Math.max(0,Math.abs(v)-9));maxProjectionM=Math.max(maxProjectionM,projection);
  if(p[1]<b.y0-1e-10||p[1]>b.h+1e-10||projection>1.473)bounded=false;
 }
 check('rotated source envelope, height and winding at '+unit+' m/unit, '+(reversed?'CW':'CCW')+', base '+baseM+' m',q.facadeElevations>0&&bounded&&meshValid(m));
}
const dense=makeRig();dense.S.pack={mPerPt:6};dense.S.CL=ring(100);dense.S.toWorld=p=>p.slice();dense.S.architecture781Source=[];
for(let s=0;s<12;s++)for(let j=0;j<24;j++){
 const a=(s+(j+.5)/24)*Math.PI/6,radius=108+(j%3)*8,x=Math.cos(a)*radius,z=Math.sin(a)*radius;
 dense.S.architecture781Source.push({h:8+(j%4)*3,y0:0,p:[[x-1,z-1],[x+1,z-1],[x+1,z+1],[x-1,z+1]]});
}
const ds=dense.G.installArchitecture781(dense.S);
check('dense twelve-sector fixture keeps complete coverage below all caps',ds.coverageSectors===12&&ds.fullEligibleCoverage&&ds.triangles<=150000&&ds.sectors.every(s=>s.triangles<=12500)&&meshValid(dense.S.architecture781.mesh),{triangles:ds.triangles,facades:ds.facadeElevations});
for(const failure of ['compile','link','upload']){
 const f=makeRig(source,failure),before=snapshot(f.S),firstHandle=f.gl.allocated.length;
 let threw=false;try{f.G.installArchitecture781(f.S);}catch(e){threw=e.message.includes('injected');}
 const handles=f.gl.allocated.slice(firstHandle);
 check(failure+' failure releases every new GPU handle exactly once',threw&&handles.every(h=>f.gl.deleted.filter(d=>d===h).length===1));
 check(failure+' failure leaves source and original render resources available',snapshot(f.S)===before&&!f.S.architecture781&&!(f.S.detail781ShadowMeshes||[]).length);
}
{
 const f=makeRig(source,'compile');
 Object.assign(f.G,{init(){return true;},installTrackDetail781(){},installVegetation781(){},disposeTrackDetail781(){},disposeVegetation781(){},disposeSky781(){},render(){f.counts.renders++;}});
 f.call(fs.readFileSync(path.join(here,'../v7.88_full_lap_detail_DRAFT/full_lap788_src.js'),'utf8'));
 f.G.render();const n=f.gl.allocated.length;f.G.render();
 check('existing full-lap failure path resumes original rendering without repeated allocation',!!f.S.fullLapFailed788&&!f.S.detail781Enabled&&f.counts.renders===2&&f.gl.allocated.length===n);
}
check('shader keeps derivative-filtered glass and floor cues with analytic fallback and no extra samplers',source.includes('fwidth(pane)')&&source.includes('fwidth(storey)')&&source.includes('if(uShadowOn<.5)return 1.;')&&(source.match(/uniform highp sampler2D/g)||[]).length===1);
const result={author:'Andrew Fisher',scope:'CPU actual-source geometry and injected failure tests; GPU compilation and desktop/phone visual acceptance remain required',passed:checks.length,
 inputHtml:{path:htmlPath,sha256:digest(html)},moduleSha256:digest(source),elapsedMs,maxProjectionM,actualSourceRows:sourceRows,nominalPitRows:pitRows,
 baseline:{triangles:oldStats.triangles,slabs:oldStats.balconySlabs},stats,geometryHash,checks};
const output=process.argv[3]||path.join(__dirname,'architecture794_checks.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,triangles:stats.triangles,slabs:stats.balconySlabs,facades:stats.facadeElevations,eligibleSectors:stats.eligibleSectors,maxProjectionM,elapsedMs,output}));
