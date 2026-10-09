// Author: Andrew Fisher. Launch/gear edge cases using the exact source simulation and RPM function.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const block=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i);return html.slice(i,j);};
const tune=block('G.defaultTune=function(){','/* Day Race is the production default.'),units=block('G.units=function(T){','/* What the scene is actually showing, in units anyone can check.'),reset=block('G.simReset=function(){','G.pose=function(){'),pose=block('G.pose=function(){','G.step=function(dt){'),step=block('G.step=function(dt){','/* everything that is rebuilt each frame:'),audio=block("const KEY='gc500.showsound'",'\n})();');
const prefs=new Map(),G={M_PER_PT:5.937552372855356,rng:seed=>{let s=seed>>>0||1;return()=>((s=s*16807%2147483647)/2147483647);}},context={G,HW:.5,window:{GC3D:G},localStorage:{getItem:k=>prefs.get(k)||null,setItem:(k,v)=>prefs.set(k,v)},Math};
vm.createContext(context);vm.runInContext(tune+units+reset+pose+step,context);vm.runInContext('(function(){'+audio+';window.auditRevs980=revs;})();',context);
const checks=[];function check(name,value){assert(value,name);checks.push(name);}
const rows=[];
for(const pace of [.25,1,2])for(const target of [0,5,15,55,205]){
 const T=G.defaultTune();T.tc=pace;G.units(T);G.S={tune:T,clock:0,gridS:0,car:{},CL:{L:1000,at:s=>[s,0,5],tangent:()=>[1,0]},vAt:()=>target/3.6*T.tc/G.M_PER_PT,kAt:()=>0,hitAt:()=>0};G.simReset();
 let delta=0,last=null,afterLaunchMin=Infinity,lastPhysicalAge=0;
 for(let i=0;i<(3.4+8/pace)*120;i++){G.step(1/120);const r=context.window.auditRevs980(G.S,0);if(last!=null&&G.S.sim.launchRealAge980<1.6)delta=Math.max(delta,Math.abs(r.rpm-last));last=r.rpm;
  assert(Number.isFinite(r.rpm)&&r.rpm>=1300&&r.rpm<=6600);
  if(G.S.sim.go&&G.S.sim.launchRealAge980<.95)afterLaunchMin=Math.min(afterLaunchMin,r.rpm);
  assert(G.S.sim.launchRealAge980>=lastPhysicalAge);lastPhysicalAge=G.S.sim.launchRealAge980;
 }
 check('Continuous clutch at '+pace+'x / '+target+'kmh',delta<140&&afterLaunchMin>=2200);
 if(target<10)check('Slow/no movement settles back to idle at '+pace+'x / '+target+'kmh',last===1300);
 if(target===205)check('Top-speed sixth below5200RPM at '+pace+'x',G.sound.gear===5&&last<5200);
 rows.push({pace,target,maxRpmStep:delta,launchMinimum:afterLaunchMin,finalRpm:last,gear:G.sound.gear+1});
}
G.sound.ctx={currentTime:0};G.sound.st.tickedAt=0;G.sound.lastDrive980={rpm:5000};G.simReset();check('Reset clears frame guard and published drive observation',G.sound.st.tickedAt===-1&&G.sound.lastDrive980===null&&G.sound.st.go===false);G.sound.ctx=null;
// Mid-release pace changes must use integrated clutch age rather than restart the launch timer.
const S=G.S;S.tune.tc=2;G.units(S.tune);G.simReset();while(S.clock<3.85)G.step(1/120);const age=S.sim.launchRealAge980;S.tune.tc=.25;G.units(S.tune);G.step(1/120);const r=context.window.auditRevs980(S,0);check('Pace reduction preserves elapsed clutch age and finite sound',S.sim.launchRealAge980>age&&Number.isFinite(r.rpm));
console.log(JSON.stringify({pass:true,checks:checks.length,rows}));
