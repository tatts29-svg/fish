// Author: Andrew Fisher. Exercise the actual patched fixed-step dynamics against controlled roads.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(process.env.PAGE||'/workspace/dynamics974_candidate.html','utf8');
const step=src.slice(src.indexOf('G.step=function(dt){'),src.indexOf('/* everything that is rebuilt each frame:'));
const pose=src.slice(src.indexOf('G.pose=function(){'),src.indexOf('G.step=function(dt){'));
const defaultTune=src.slice(src.indexOf('G.defaultTune=function(){'),src.indexOf('/* Day Race is the production default.'));
const units=src.slice(src.indexOf('G.units=function(T){'),src.indexOf('/* What the scene is actually showing, in units anyone can check.'));
function run(curve,targetKmh,initialKmh=0,clock=4,seconds=3,tc=1){
const conversion={M_PER_PT:5.9376};vm.runInNewContext(defaultTune+units,{G:conversion});
const tune=conversion.defaultTune();tune.tc=tc;conversion.units(tune);
const target=targetKmh/3.6*tc/conversion.M_PER_PT,initial=initialKmh/3.6*tc/conversion.M_PER_PT;
const m={s:0,v:initial,brake:0,lap:0,jumpLap:-1,air:0,vy:0,squash:0,slip:0,lat:0,pitch:0,roll:0,burn:0,nextSmokeAt:0,smokeSide:0,wheel:0,wheelR:0,smoke:[],marks:[],sparks:[],path:[],hist:[],markRun:0,rnd:()=>.5};
const S={clock,tune,sim:m,gridS:0,CL:{L:1000,at:s=>[s,0,5],tangent:()=>[1,0]},vAt:()=>target,kAt:()=>curve,hitAt:()=>0};
const G={S};const c=vm.createContext({G,HW:.5,Math});vm.runInContext(pose+step,c);G.pose();let peak=0,smokePeak=0,wheelspinPeak=0;
for(let i=0;i<seconds*120;i++){G.step(1/120);peak=Math.max(peak,Math.abs(m.slip));smokePeak=Math.max(smokePeak,m.smoke.length);wheelspinPeak=Math.max(wheelspinPeak,m.wheelspin);assert(Number.isFinite(m.v)&&Number.isFinite(m.slip)&&Number.isFinite(S.pose.hd));}
return {m,S,peak,smokePeak,wheelspinPeak};}
const results=[];
for(const tc of [.25,1,2]){
 const straight=run(0,180,0,4,12/tc,tc);assert(straight.peak===0&&straight.smokePeak===0);
 const grip=run(.12,90,90,4,3/tc,tc);assert(grip.peak<.04&&grip.smokePeak===0);
 const exit=run(.15,90,30,4,8/tc,tc);assert(exit.peak>.07&&exit.peak<.196);assert(exit.wheelspinPeak>0&&exit.wheelspinPeak<=1);assert(exit.smokePeak>0&&exit.smokePeak<=520);assert(Math.abs(exit.m.slip)<.05,'Rear slip settles after power load ends');
 const brake=run(.12,55,150,4,8/tc,tc);assert(Math.abs(brake.m.v-55/3.6*tc/5.9376)<1e-8&&brake.peak<.04&&brake.smokePeak===0);
 const repeat=run(.15,90,30,4,8/tc,tc);assert.deepStrictEqual({s:repeat.m.s,slip:repeat.m.slip,lat:repeat.m.lat,smoke:repeat.smokePeak},{s:exit.m.s,slip:exit.m.slip,lat:exit.m.lat,smoke:exit.smokePeak});
 assert(straight.m.wheelspin===0&&Math.abs(exit.m.roll)<.045&&Math.abs(exit.m.pitch)<.04);
 results.push({tc,actualAcceleration:exit.S.tune.acc,cornerSlip:grip.peak,exitPeak:exit.peak,settled:exit.m.slip,smokePeak:exit.smokePeak,wheelspinPeak:exit.wheelspinPeak});
}
const grid=run(0,180,0,0,3.4);assert(grid.peak===0&&grid.smokePeak<=96&&grid.m.wheelspin>=0&&grid.m.wheelspin<=1);
console.log(JSON.stringify({pass:true,actualDefaultTuneAndUnits:true,results,gridParticlePeak:grid.smokePeak}));
