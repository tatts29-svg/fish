// Author: Andrew Fisher. CPU-only checks of the actual source functions.
// Usage: node tests/smoke971.cjs BASE_HTML CANDIDATE_HTML [OUTPUT_JSON]
// No browser, GPU, operational records, credentials or network requests.
'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const [basePath,candidatePath,out]=process.argv.slice(2);
assert(basePath&&candidatePath,'Provide base and candidate HTML');
const base=fs.readFileSync(basePath,'utf8'),candidate=fs.readFileSync(candidatePath,'utf8'),checks=[];
function check(name,fn){fn();checks.push({name,pass:true});}
function section(s,start,end){assert.equal(s.split(start).length,2,'Unique source start: '+start);const a=s.indexOf(start),b=s.indexOf(end,a+start.length);assert(b>a,'Source end: '+end);return s.slice(a,b);}
function engine(source){
 const G={M_PER_PT:Number(source.match(/G\.M_PER_PT\s*=\s*([\d.]+)/)[1]),carModel:()=>({}),camStep:()=>{},rng(seed){return ()=>((seed=seed*16807%2147483647)/2147483647);}};
 const tuning=section(source,'G.defaultTune=function(){','/* Day Race is the production default.');
 const units=section(source,'G.units=function(T){','/* What the scene is actually showing');
 const simulation=section(source,'G.simReset=function(){','/* everything that is rebuilt each frame:');
 const halfWidth=Number(source.match(/const HW=([\d.]+),PLAN=/)[1]);
 Function('G','HW',tuning+'\n'+units+'\n'+simulation)(G,halfWidth);
 const T=G.units(G.defaultTune()),radius=100;
 G.S={tune:T,gridS:0,quality:{name:'balanced'},fps:60,calmDrive:false,car:{},
  CL:{L:Math.PI*2*radius,at:s=>[Math.cos(s/radius)*radius,Math.sin(s/radius)*radius,4],tangent:s=>[-Math.sin(s/radius),Math.cos(s/radius)]},
  vAt:s=>T.vmin+(T.vmax-T.vmin)*(.50+.45*Math.sin(s/20)),kAt:s=>.045*Math.sin(s/17),hitAt:s=>Math.sin(s/7)>.97?1:0};
 G.simReset();return G;
}
function goState(G){G.simReset();const S=G.S,m=S.sim;S.clock=12;m.go=true;m.s=50;m.v=G.S.tune.vmax*.6;m.slip=.22;m.slipV=.01;m.burn=.7;m.air=0;G.pose();return G;}
function puff(id,clock=12){return {id,p:[1+id*.01,.5,-2],v:[.8,.3,-.6],c:clock-.2,l:3.1,k:1,a:.9,r:.2,t:.8,w:.1};}
function physical(G){const m=G.S.sim;return {clock:G.S.clock,pose:G.S.pose,scalars:Object.fromEntries(Object.entries(m).filter(([,v])=>typeof v==='number'||typeof v==='boolean')),marks:m.marks,hist:m.hist,path:m.path};}
const A=engine(base),B=engine(candidate),oldTune=A.defaultTune(),newTune=B.defaultTune();
const openingKeys=['burnFrom_s','burnRamp_s','burnTo_s','burnHook_s','openingSmokeEvery_s','maxOpeningSmoke','openingSmokeLife_s','openingSmokeSize','openingSmokeAlpha'];
check('All non-opening tuning remains exactly unchanged',()=>{
 const filter=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!openingKeys.includes(k)));
 assert.deepEqual(filter(newTune),filter(oldTune));
});
check('Opening is shorter, later and lighter without changing launch time',()=>{
 assert.equal(A.GRID,B.GRID);assert.equal(B.GRID,3.4);
 assert(newTune.burnFrom_s>oldTune.burnFrom_s);assert(newTune.burnTo_s<oldTune.burnTo_s);
 assert(newTune.burnTo_s-newTune.burnFrom_s<oldTune.burnTo_s-oldTune.burnFrom_s);
 assert.equal(newTune.maxOpeningSmoke,96);assert.equal(newTune.openingSmokeEvery_s,.045);
 assert.equal(newTune.openingSmokeLife_s,1.25);assert.equal(newTune.openingSmokeSize,.9);assert.equal(newTune.openingSmokeAlpha,.7);
});
let capProof;
check('Lower frame-rate cap prunes218 to114 on the next step without emission',()=>{
 const a=goState(engine(base)),b=goState(engine(candidate));
 for(const G of[a,b]){const S=G.S;S.clock=4;S.fps=10;S.sim.burn=1;S.sim.slip=.3;S.sim.nextSmokeAt=999;S.sim.smoke=Array.from({length:218},(_,i)=>puff(i,4));}
 const array=b.S.sim.smoke,kept=array.slice(104),positions=kept.map(x=>x.p),velocities=kept.map(x=>x.v);
 a.step(1/120);b.step(1/120);
 assert.equal(a.S.sim.smoke.length,218);assert.equal(b.S.sim.smoke.length,114);assert.equal(b.S.sim.nextSmokeAt,999);
 assert.equal(b.S.sim.smoke,array);assert.deepEqual(array.map(x=>x.id),Array.from({length:114},(_,i)=>104+i));
 array.forEach((x,i)=>{assert.equal(x,kept[i]);assert.equal(x.p,positions[i]);assert.equal(x.v,velocities[i]);});
 capProof={before:218,previousAfter:218,after:array.length,nextEmissionUnchanged:true};
});
for(const dt of[0,1/120,1/60,.05])check('Surviving particles preserve numerical rise/drag and arrays at dt='+dt,()=>{
 const a=goState(engine(base)),b=goState(engine(candidate));
 for(const G of[a,b]){G.S.sim.burn=0;G.S.sim.slip=0;G.S.sim.nextSmokeAt=999;G.S.sim.smoke=[puff(1),{...puff(2),c:1},puff(3)];}
 const array=b.S.sim.smoke,first=array[0],last=array[2],positions=[first.p,last.p];
 a.step(dt);b.step(dt);assert.deepEqual(b.S.sim.smoke,a.S.sim.smoke);assert.equal(b.S.sim.smoke,array);
 assert.equal(array[0],first);assert.equal(array[1],last);assert.equal(array[0].p,positions[0]);assert.equal(array[1].p,positions[1]);
});
check('An empty smoke budget clears existing particles and admits none',()=>{
 const G=engine(candidate);G.S.tune.maxOpeningSmoke=0;G.S.clock=1.8;G.S.sim.burn=1;G.S.sim.smoke=[puff(1,1.8)];
 const array=G.S.sim.smoke;G.step(1/120);assert.equal(G.S.sim.smoke,array);assert.equal(array.length,0);
});
check('Budget enforcement also holds when an emission occurs',()=>{
 const G=goState(engine(candidate));G.S.fps=10;G.S.sim.burn=1;G.S.sim.slip=.3;G.S.sim.smoke=Array.from({length:218},(_,i)=>puff(i));
 const array=G.S.sim.smoke;G.step(1/120);assert.equal(G.S.sim.smoke,array);assert.equal(array.length,114);assert(G.S.sim.nextSmokeAt>12);
});
function opening(source){const G=engine(source),S=G.S,rows=[];let peak=0,burningSteps=0,maxLife=0,maxSize=0,maxAlpha=0;
 for(let i=0;i<Math.round(G.GRID*120);i++){G.step(1/120);peak=Math.max(peak,S.sim.smoke.length);if(S.sim.burn>.04)burningSteps++;for(const p of S.sim.smoke){maxLife=Math.max(maxLife,p.l);maxSize=Math.max(maxSize,p.k);maxAlpha=Math.max(maxAlpha,p.a);}rows.push({time:S.clock,smoke:S.sim.smoke.length});}
 return {peak,burningSeconds:burningSteps/120,maxLife,maxSize,maxAlpha,creepSceneUnits:S.sim.s-S.gridS,rows};}
const oldOpening=opening(base),newOpening=opening(candidate);
check('Balanced opening peaks at40 particles versus218 and burns for less time',()=>{
 assert.equal(oldOpening.peak,218);assert.equal(newOpening.peak,40);assert(newOpening.burningSeconds<oldOpening.burningSeconds);
 assert.equal(newOpening.maxLife,1.25);assert.equal(newOpening.maxSize,.9);assert.equal(newOpening.maxAlpha,.7);
 assert(newOpening.creepSceneUnits<oldOpening.creepSceneUnits);
});
check('No simulation step emits more than one pair during the opening',()=>{
 const G=engine(candidate),S=G.S;G.S.clock=1.8;S.sim.burn=1;S.sim.nextSmokeAt=0;
 G.step(1/120);assert.equal(S.sim.smoke.length,2);
});
let normal;
check('Normal driving from the same go-state is numerically unchanged over1200 steps',()=>{
 const a=goState(engine(base)),b=goState(engine(candidate));const start=performance.now();
 for(let i=0;i<1200;i++){a.step(1/120);b.step(1/120);assert.deepEqual(physical(b),physical(a),'Physical state at step '+i);}
 assert.equal(a.S.sim.rnd(),b.S.sim.rnd(),'Particle random sequence preserved during normal driving');
 normal={steps:1200,seconds:10,pairedCpuWallMs:performance.now()-start,physicalStateEqual:true};
});
check('Normal moving drift still uses its original smoke properties',()=>{
 const a=goState(engine(base)),b=goState(engine(candidate));a.S.sim.nextSmokeAt=b.S.sim.nextSmokeAt=0;
 a.step(1/120);b.step(1/120);assert(a.S.sim.smoke.length>0);assert.deepEqual(b.S.sim.smoke,a.S.sim.smoke);
 assert(b.S.sim.smoke.every(x=>x.l>newTune.openingSmokeLife_s));
});
const stripRows=({rows,...summary})=>summary;
const result={author:'Andrew Fisher',scope:'CPU-only source simulation; not a physical-device frame-rate claim',baseSha256:crypto.createHash('sha256').update(base).digest('hex'),candidateSha256:crypto.createHash('sha256').update(candidate).digest('hex'),checks,passed:checks.length,capProof,opening:{before:stripRows(oldOpening),after:stripRows(newOpening)},normal,noNetworkOrRecordAccess:true,pass:true};
if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pass:true,checks:checks.length,capProof,opening:result.opening,normal}));
