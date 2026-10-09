// Author: Andrew Fisher. Actual-source launch, unit conversion and driving regression checks.
// node tests/launch980.cjs BASE_HTML CANDIDATE_HTML [OUTPUT_JSON]
// CPU only: no browser, operational data, credentials or network.
'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const [basePath,candidatePath,out]=process.argv.slice(2);
assert(basePath&&candidatePath,'Provide exact base and candidate HTML');
const base=fs.readFileSync(basePath,'utf8'),candidate=fs.readFileSync(candidatePath,'utf8'),checks=[];
function check(name,fn){fn();checks.push({name,pass:true});}
function section(s,start,end){const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert(a>=0&&b>a,'Source boundary '+start);return s.slice(a,b);}
function engine(source,tc=1,curve=0,calm=false){
 const G={M_PER_PT:Number(source.match(/G\.M_PER_PT\s*=\s*([\d.]+)/)[1]),carModel:()=>({}),camStep:()=>{},rng(seed){return ()=>((seed=seed*16807%2147483647)/2147483647);}};
 const tuning=section(source,'G.defaultTune=function(){','/* Day Race is the production default.');
 const units=section(source,'G.units=function(T){','/* What the scene is actually showing');
 const simulation=section(source,'G.simReset=function(){','/* everything that is rebuilt each frame:');
 Function('G','HW',tuning+'\n'+units+'\n'+simulation)(G,Number(source.match(/const HW=([\d.]+),PLAN=/)[1]));
 const raw=G.defaultTune();raw.tc=tc;const T=G.units(raw);
 G.S={tune:T,gridS:0,quality:{name:'balanced'},fps:60,calmDrive:calm,car:{},
  CL:{L:10000,at:s=>[s,0,4],tangent:s=>[1,0]},vAt:()=>T.vmax,kAt:()=>curve,hitAt:()=>0};
 G.simReset();return G;
}
function physical(G){const m=G.S.sim;return {clock:G.S.clock,pose:G.S.pose,
 scalars:Object.fromEntries(Object.entries(m).filter(([k,v])=>!k.startsWith('launch')&&k!=='wheelR'&&(typeof v==='number'||typeof v==='boolean'))),
 marks:m.marks,hist:m.hist,path:m.path,smoke:m.smoke,sparks:m.sparks};}
function runGrid(G){const rows=[];while(G.S.clock+1/120<=G.GRID+1e-10){G.step(1/120);if(!G.S.sim.go)rows.push({t:G.S.clock,s:G.S.sim.s,v:G.S.sim.v,burn:G.S.sim.burn,lat:G.S.sim.lat,wheel:G.S.sim.wheel,wheelR:G.S.sim.wheelR});}return rows;}
const baseline=engine(base),prior=runGrid(baseline),oldPeak=Math.max(...prior.map(x=>x.v))*baseline.M_PER_PT*3.6,oldEnd=prior.at(-1).v*baseline.M_PER_PT*3.6;
check('Baseline reproduces the reported forward surge then near-stop before launch',()=>{assert(oldPeak>40);assert(oldEnd<.2);assert(prior.at(-1).s*baseline.M_PER_PT>9);});
check('Five-light timing and existing tuning remain unchanged',()=>{assert.equal(engine(candidate).GRID,3.4);assert.deepEqual(engine(candidate).defaultTune(),engine(base).defaultTune());});
const runs=[];
for(const tc of [.25,1,2]){
 check('Tyre m/s conversion is correct and idempotent at pace '+tc,()=>{
  const G=engine(candidate,tc),T=G.S.tune;
  for(let i=0;i<3;i++){G.units(T);assert.equal(T.burnSpin*T.tc/T.tc,T.burnSpin_ms*tc/G.M_PER_PT);assert.equal(T.burnCreep,T.burnCreep_ms*tc/G.M_PER_PT);}
  T.tc=2;G.units(T);assert.equal(T.burnSpin,34*2/G.M_PER_PT);
 });
 check('Grid holds position, wheels, lateral position and smoke at pace '+tc,()=>{
  const G=engine(candidate,tc,.18);const rows=runGrid(G),m=G.S.sim;
  assert(rows.length>400);for(const r of rows)assert(r.s===0&&r.v===0&&r.lat===0&&r.burn===0&&r.wheel===0&&r.wheelR===0);
  assert.equal(m.smoke.length,0);assert.equal(m.marks.length,0);assert.equal(m.latV,0);assert(m.brake>.99);assert.equal(G.S.pose.hd,0);
 });
 check('Release is continuous, bounded and pulls away once at pace '+tc,()=>{
  const G=engine(candidate,tc),S=G.S,T=S.tune;runGrid(G);
  let previousV=0,first=null,spinPeak=0,smokePeak=0,surfaceExtraPeak=0,clutchPrevious=1,loadPrevious=0,firstClutch=null;
  for(let i=0;i<Math.ceil(3/tc*120);i++){
   G.step(1/120);const m=S.sim;if(!m.go)continue;
   if(first===null){first={v:m.v,age:m.launchAge980};firstClutch=m.launch980;}
   assert(m.v>=previousV-1e-12,'No launch stall');assert(m.v-previousV<=T.acc*1.25/120+1e-12,'Bounded acceleration');
   assert(m.launch980<=clutchPrevious+1e-12&&m.launch980>=0,'Clutch fades once');
   assert(m.launchLoad980>=loadPrevious-1e-12&&m.launchLoad980<=1,'Acceleration eases in once');
   assert.equal(m.launchAge980,Math.max(0,S.clock-G.GRID));assert(Math.abs(m.launchRealAge980-m.launchAge980*tc)<1e-10);
   if(m.launchRealAge980>=1)assert.equal(m.launch980,0);if(m.launchRealAge980>=.28)assert.equal(m.launchLoad980,1);
   const values=[m.s,m.v,m.burn,m.wheelspin,m.wheel,m.wheelR,m.pitch,m.roll,...S.pose.pos];assert(values.every(Number.isFinite));
   spinPeak=Math.max(spinPeak,m.wheelspin);smokePeak=Math.max(smokePeak,m.smoke.length);
   surfaceExtraPeak=Math.max(surfaceExtraPeak,T.burnSpin*m.burn*G.M_PER_PT/tc);
   if(m.launch980>0)assert(Math.abs(m.wheelspin-m.burn)<1e-12,'Audible tyre spin follows wheel effect');
   previousV=m.v;clutchPrevious=m.launch980;loadPrevious=m.launchLoad980;
  }
  assert.equal(firstClutch,1);assert(first.v*G.M_PER_PT/tc<.01,'No initial speed jump');
  assert(spinPeak>.04&&spinPeak<.16);assert(surfaceExtraPeak>1&&surfaceExtraPeak<5.44);
  assert(smokePeak>0&&smokePeak<=40,'Restrained launch smoke');assert(S.sim.v*G.M_PER_PT/tc>26,'Positive normal acceleration after clutch engagement');
  runs.push({tc,firstSpeedMps:first.v*G.M_PER_PT/tc,spinPeak,smokePeak,extraRearSurfaceMps:surfaceExtraPeak,speedAfter3PhysicalSecondsKmh:S.sim.v*G.M_PER_PT*3.6/tc});
 });
 check('After launch normal chassis, slip, smoke and camera inputs are unchanged at pace '+tc,()=>{
  const A=engine(base,tc,.09),B=engine(candidate,tc,.09);
  for(const G of [A,B]){const S=G.S,m=S.sim;S.clock=12;m.go=true;m.s=100;m.v=S.tune.vmax*.45;m.slip=.12;m.slipV=.01;m.burn=.4;m.air=0;if(G===B)m.launchRealAge980=2;G.pose();}
  for(let i=0;i<600;i++){A.step(1/120);B.step(1/120);assert.deepEqual(physical(B),physical(A),'Normal state at step '+i);}
  assert.equal(A.S.sim.rnd(),B.S.sim.rnd());
 });
}
check('Changing pace never restarts or reverses the clutch release',()=>{
 const G=engine(candidate),S=G.S;runGrid(G);let previous=1;
 for(let i=0;i<700;i++){
  if(i===15){S.tune.tc=.25;G.units(S.tune);}if(i===90){S.tune.tc=2;G.units(S.tune);}if(i===170){S.tune.tc=.25;G.units(S.tune);}
  const age=S.sim.launchRealAge980,wasGo=S.sim.go;G.step(1/120);
  assert(S.sim.launch980<=previous+1e-12);if(wasGo)assert(Math.abs(S.sim.launchRealAge980-age-S.tune.tc/120)<1e-10);
  previous=S.sim.launch980;
 }
 assert.equal(S.sim.launch980,0);assert.equal(S.sim.launchSpin980,0);assert.equal(S.sim.launchLoad980,1);
});
check('Reset clears launch and wheel state for another clean start',()=>{
 const G=engine(candidate);for(let i=0;i<750;i++)G.step(1/120);G.simReset();
 for(const k of ['launch980','launchAge980','launchRealAge980','launchLoad980','launchSpin980','wheel','wheelR','burn'])assert.equal(G.S.sim[k],0,k);
 assert.equal(G.S.clock,0);assert.equal(G.S.sim.s,0);assert.equal(G.S.sim.v,0);
});
check('Calm driving keeps launch tyre effects off and still pulls away',()=>{
 const G=engine(candidate,1,0,true);for(let i=0;i<900;i++){G.step(1/120);assert.equal(G.S.sim.burn,0);assert.equal(G.S.sim.wheelspin,0);assert.equal(G.S.sim.smoke.length,0);}assert(G.S.sim.v>0);
});
const result={author:'Andrew Fisher',scope:'Actual source CPU simulation; audiovisual review remains separate',baseSha256:crypto.createHash('sha256').update(base).digest('hex'),candidateSha256:crypto.createHash('sha256').update(candidate).digest('hex'),checks,passed:checks.length,baseline:{peakGridKmh:oldPeak,lastGridKmh:oldEnd,gridTravelM:prior.at(-1).s*baseline.M_PER_PT},launch:runs,noNetworkOrOperationalData:true,pass:true};
if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:true,checks:checks.length,baseline:result.baseline,launch:runs}));
