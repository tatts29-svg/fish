/* Author: Andrew Fisher. Original-camera behavioural parity without a browser.
 * node camera811_checks.cjs --page candidate.html [--previous original801.html]
 * This exercises shared deterministic camera inputs, not a new driving model.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const args=process.argv.slice(2),arg=(n,d)=>{const i=args.indexOf(n);return i<0?d:args[i+1];};
const root=path.resolve(__dirname,'../..'),previous=fs.readFileSync(arg('--previous',path.join(root,'build/GC500_v8.01/GC500_Delivery_Control_hosted.html')),'utf8'),page=fs.readFileSync(arg('--page'),'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),checks=[];
function check(name,pass,detail){checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)console.error(name,detail);}
function cut(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);}
const camera=s=>cut(s,'G.VIEWS=','/* put the canvas in a plate');
function rig(source){
 const G={GRID:3.4},S={tune:{carS:.3,cameraFrame:1.05,vmax:18,deckH:.1,closeShake:.2,landingShake:.055},pose:{pos:[0,.1,0],hd:0},clock:0,distK:1,sim:{s:0,v:0,slip:0,go:false,air:0,squash:0,roll:0,throttle:0,brake:0},CL:{at:s=>[s,Math.sin(s*.07)*3,4]},heightAt:()=>0};
 G.S=S;let random=7,calls=0;S.sim.rnd=()=>{calls++;return (random=(random*16807)%2147483647)/2147483647;};
 G.looShot=()=>({eye:[2,2,-3],tgt:[0,.5,-1],fov:44});G.fireworksShot=()=>({eye:[18,22,27],tgt:[0,0,0],fov:37});
 const V={add:(a,b)=>a.map((v,i)=>v+b[i]),sub:(a,b)=>a.map((v,i)=>v-b[i]),lerp:(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),norm:a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);},cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]};
 const ctx=vm.createContext({G,S,V,D2R:Math.PI/180,Math});vm.runInContext(camera(source),ctx);
 return {G,S,randomCalls:()=>calls};
}
const snapshot=r=>JSON.stringify({cam:r.S.cam,camBase:r.S.camBase,roll:r.S.camRoll,shake:r.S.camShake,fovKick:r.S.fovKick,scene:r.G.sceneReport(),director:r.S.dir,up:r.G.camUp(r.S.cam,r.S.camRoll),side:r.S._forceShotSide,randomCalls:r.randomCalls(),heroPending:r.S.sim.heroPending,slideExitUntil:r.S.sim.slideExitUntil});
function input(r,t){const S=r.S,m=S.sim,hd=t*.14;S.clock=t;S.pose={pos:[Math.sin(hd)*40,.1,Math.cos(hd)*40],hd:hd+.5};m.s=t*5;m.go=t>3.4;m.v=t>3.4?12+4*Math.sin(t*.4):0;m.throttle=.7;m.brake=0;m.slip=.04*Math.sin(t*2);m.roll=.025*Math.sin(t*1.6);m.air=0;m.squash=0;
 if(t>8&&t<10)m.brake=.85;if(t>14&&t<16)m.slip=.25;if(t>19&&t<19.7)m.air=.12;
 if(t>=19.7&&t<19.8)m.squash=.4;
 if(t>23&&t<24)m.slideExitUntil=25;if(t>30&&t<31)m.heroPending=1;
}
const views=['hero','auto','onboard','chase','heli','top','wide','detail','frontdetail'];
for(const view of views)for(const profile of ['normal','reduced','towed','building']){
 const old=rig(previous),now=rig(page);for(const r of [old,now]){r.G.setView(view);if(profile==='reduced')r.S.reducedMotion=true;if(profile==='towed')r.S.towVms=true;if(profile==='building')r.S.heightAt=(x,z)=>x>10&&x<35&&z>10?2:0;}
 let equal=true,finite=true,at=null,frames=0;const seen=new Set();
 for(let i=0;i<=4800;i++){const t=i/120;for(const r of [old,now]){input(r,t);r.G.camStep(1/120);}frames++;seen.add(now.S.sceneBeat);if(snapshot(old)!==snapshot(now)){equal=false;at=t;break;}if(!now.S.cam.eye.concat(now.S.cam.tgt,[now.S.cam.fov,now.S.camRoll]).every(Number.isFinite)){finite=false;at=t;break;}}
 check(view+' '+profile+' 40 seconds / 120 Hz exactly matches original camera',equal&&finite,{frames,firstDifferenceAt:at,beats:[...seen].filter(Boolean)});
}
for(const scenario of ['portaloo-priority','fireworks-priority','changed-selection','paused-selection','resize-lens']){
 const a=rig(previous),b=rig(page);let equal=true;
 for(const r of [a,b]){input(r,12);r.G.setView('detail');r.G.camStep(.016);
  if(scenario==='portaloo-priority'){r.S.towVms=true;r.S.towKind='loo';r.S.loo={ph:'open'};r.S.trailer={};}
  if(scenario==='fireworks-priority')r.S.fw={cam:true};
  if(scenario==='changed-selection'||scenario==='paused-selection'){r.G.setView('onboard');r.G.camStep(scenario==='paused-selection'?0:.016);r.G.setView('auto');}
  r.G.camStep(scenario==='paused-selection'?0:.016);
 }
 equal=snapshot(a)===snapshot(b);
 for(const aspect of [.39,.75,16/9,2.5])for(const shot of views)equal=equal&&a.G.framedFov(32,aspect,shot)===b.G.framedFov(32,aspect,shot);
 check(scenario+' matches original priority/transition/projection',equal);
 if(scenario==='portaloo-priority')check('open portaloo restores the original trailer look-in shot',b.S.shotName==='chase'&&b.S._looCut===true);
}
const sceneCues=[['brake-attack',{brake:.8}],['apex-drift',{slip:.25}],['kerb-flight',{air:.1}],['wheel-pass',{slideExitUntil:99}],['hero-finish',{heroPending:1,v:12}],['full-throttle',{v:18}]];
for(const [beat,changes]of sceneCues){const r=rig(page);input(r,12);Object.assign(r.S.sim,{slip:0,brake:0,air:0,throttle:.8},changes);r.G.setView('auto');r.S.dir={n:'chase',t:9,dur:1,seed:2,side:1,beat:'race-line'};r.G.camStep(.016);check('Auto reacts to actual '+beat+' input',r.S.sceneBeat===beat,{shot:r.S.shotName,beat:r.S.sceneBeat});}
const getter=cut(page,'function showViewGet(){','function showPaceGet(){');
for(const stored of [null,'tour','invalid',...views]){const r=rig(page),ctx=vm.createContext({window:{GC3D:r.G},GC3D:r.G,VIEW_KEY:'gc500.showview',localStorage:{getItem:()=>stored}});vm.runInContext(getter,ctx);check('remembered camera '+String(stored),ctx.showViewGet()===(views.includes(stored)?stored:'hero'));}
{const r=rig(page),ctx=vm.createContext({window:{GC3D:r.G},GC3D:r.G,VIEW_KEY:'gc500.showview',localStorage:{getItem:()=>{throw Error('blocked storage');}}});vm.runInContext(getter,ctx);check('blocked device storage falls back to original Car follow',ctx.showViewGet()==='hero');}
const report={author:'Andrew Fisher',previousSha256:sha(previous),pageSha256:sha(page),passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,limitations:['CPU camera parity uses identical deterministic inputs, not a complete render or a physical-device performance test.','Restores original camera-side cue and random-stream behaviour; physics/model/scene source preservation is proved separately.','Actual moving scene and current vehicle close-ups require independent browser review.'],checks};
fs.writeFileSync(arg('--output',path.join(__dirname,'camera811_checks.json')),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failed:report.failed}));process.exitCode=report.failed?1:0;
