/* Author: Andrew Fisher. Hosted playback clock regressions; no GL or live writes. */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const base=process.argv[2]||path.join(__dirname,'../../build/GC500_v7.92/GC500_Delivery_Control_hosted.html');
const sourcePath=path.join(__dirname,'../playback794_src.js');
const html=fs.readFileSync(base,'utf8'),moduleSource=fs.readFileSync(sourcePath,'utf8');
const data=JSON.parse(html.match(/const DATA\s*=\s*(.*);/)[1]);
const take=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);if(i<0||j<i)throw Error('Missing source '+a);return html.slice(i,j);};
const engine=take('G.packPts=(pk','\n')+'\n'+take('G.rng = function(seed)','\n')+'\n'+take('const area=G.area=','/* ear clipping')+take('G.M_PER_PT =','/* Day Race')+take('G.units=function(T)','/* What the scene')+take('G.simReset=function()','/* everything that is rebuilt')+take('G.frame=function(tms)','/* deterministic still');
const geometry=take(' /* key plan → world:',' /* ----- static batches ----- */');
const deck=take('const SHOW_HOLD =','/* ------------------------------------------------------------------ THE BROADCAST');
const original=take('function showSchedule(){','function showOpen(){')+take('function showMove(n){','/* The working, in full,');
const recovery=take('const resumeFields=','/* Smoke and rubber');
const broadcast=take('const BC =','/* ONE MOTION SETTING.');
const checks=[],cases=[];
function check(name,pass,detail){checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));}
function rig({pace=1,fps=60,patched=true}={}){
 let wall=0,serial=0,nextFrame=1000/fps,frames=0;const timers=new Map(),nodes=new Map(),document={hidden:false};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:false,classList:{toggle(){}},setAttribute(){},querySelectorAll(){return[];}});return nodes.get(id);};
 const G={render(){frames++;},camStep(){},carModel:()=>({}),setQuality(){},resetRenderLimits792(){}},S={gl:{},car:{},quality:{name:'balanced'},o:{ss:1}};G.S=S;
 class AudioStub{constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.plays=0;}play(){this.paused=false;this.plays++;return {catch:fn=>{this.failed=fn;}};}pause(){this.paused=true;}}
 const context=vm.createContext({G,S,data,document,performance:{now:()=>wall},Audio:AudioStub,window:{GC3D:G},console,Math,Number,Float32Array,$:node,
  setTimeout(fn,delay){const id=++serial;timers.set(id,{at:wall+delay,fn});return id;},clearTimeout(id){timers.delete(id);},setInterval(){return 0;},clearInterval(){}});
 vm.runInContext(engine+'\nconst HW=.395;S.tune=G.defaultTune();S.tune.tc='+pace+';G.units(S.tune);const o={ring:data.circuit.ring,roadWidth:data.circuit.roadWidth,pit:data.surrounds.pit.map(r=>G.packPts(data.surrounds,r,1))};'+geometry+'\nG.simReset();'+deck+original+recovery+broadcast+`
 function showClear(){if(SHOW.timer)clearTimeout(SHOW.timer);if(SHOW.launchTimer)clearTimeout(SHOW.launchTimer);SHOW.timer=SHOW.launchTimer=null;}
 function motionOff(){return SHOW.reduced;}
 function showStopClock(){} function showTickClock(){}
 function showSyncControls(){if(G.S){G.S.paused=!SHOW.open||!SHOW.playing||SHOW.reduced||document.hidden;if(G.S.paused)G.S.last=null;}}
 function showRender(){showSyncControls();showSchedule();}
 function showOpen(){SHOW.open=true;SHOW.i=0;SHOW.playing=!SHOW.reduced;SHOW.launch=SHOW.reduced?-1:0;showRender();showLaunchStep();}
 function showClose(){showClear();bcStop();SHOW.open=false;SHOW.playing=false;}
 function showApplyBack(){const old=G.S;G.S=Object.assign({},old,{gl:{},sim:null});G.simReset();showSyncControls();}
 globalThis.show=SHOW;globalThis.broadcast=BC;
 `,context);
 vm.runInContext('(function(){'+take('const frame=G.frame;\nG.frame=function(t){','document.addEventListener(\'visibilitychange\'')+'})();',context);
 if(patched)vm.runInContext(moduleSource,context);
 vm.runInContext('showOpen()',context);G.frame(0);
 function tick(){
  let chosen=null;for(const [id,t] of timers)if(!chosen||t.at<chosen[1].at)chosen=[id,t];
  if(chosen&&chosen[1].at<=nextFrame){wall=chosen[1].at;timers.delete(chosen[0]);chosen[1].fn();}
  else{wall=nextFrame;nextFrame+=1000/fps;G.frame(wall);}
 }
 function until(test,limitSeconds=1200){while(!test()&&wall<limitSeconds*1000)tick();if(!test())throw Error('Timed out at '+wall);}
 function advance(seconds){const goal=wall+seconds*1000;while(wall<goal)tick();}
 return {G,context,document,node,call:code=>vm.runInContext(code,context),tick,until,advance,wall:()=>wall/1000,frames:()=>frames};
}
for(const fps of [60,12,8])for(const pace of [.25,.5,1]){
 const r=rig({fps,pace}),G=r.G;let premature=false;
 r.until(()=>{if(!r.context.show.playing&&(G.S.sim.s-G.S.gridS)<G.S.CL.L-1e-7)premature=true;return G.playback794.report().finished;});
 const p=G.playback794.report();cases.push({fps,pace,seconds:+r.wall().toFixed(3),distanceM:+p.distanceM.toFixed(2),lapLengthM:+p.lapLengthM.toFixed(2),deckComplete:p.deckComplete,finished:p.finished});
 check('complete lap and deck at '+fps+' Hz / '+pace+' pace',!premature&&p.deckComplete&&p.progress===1&&!p.playing&&G.S.paused,cases.at(-1));
}
{
 const r=rig({fps:8,patched:false});r.until(()=>!r.context.show.playing);
 const progress=(r.G.S.sim.s-r.G.S.gridS)/r.G.S.CL.L;
 check('original hosted lifecycle reproduces half-lap cutoff',progress>.50&&progress<.56,{seconds:r.wall(),progress});
}
{
 const r=rig({fps:12,pace:.5});r.advance(95);
 check('final figure chapter waits while car continues',r.G.playback794.report().deckComplete&&r.context.show.playing&&!r.G.S.paused);
 const s=r.G.S.sim.s;r.call('showPause()');r.advance(15);
 check('explicit pause at final chapter holds route',r.G.S.sim.s===s&&!r.context.show.playing&&r.node('#showPause').textContent==='Resume');
 r.call('showPause()');r.advance(1);
 check('resume at final chapter retains route',r.G.S.sim.s>s&&r.context.show.i===9);
 const before=r.G.S.sim.s;r.call('showMove(-1)');
 check('manual chapter navigation does not reset route',r.G.S.sim.s===before&&r.context.show.i===8&&!r.G.playback794.report().deckComplete);
 r.until(()=>r.G.playback794.report().finished);
 r.call('showPause()');
 check('Replay explicitly resets car, deck and completion',r.G.S.sim.s===r.G.S.gridS&&r.G.S.clock===0&&r.context.show.i===0&&r.context.show.playing&&!r.G.playback794.report().finished&&!r.G.playback794.report().deckComplete);
 r.advance(1);const held=r.G.S.sim.s;r.call('showPause();showMove(1)');r.advance(2);
 check('manual chapter move preserves explicit pause',r.G.S.sim.s===held&&!r.context.show.playing);
}
{
 const r=rig({fps:60});r.call('SHOW.loop=true');r.advance(200);
 const p=r.G.playback794.report();check('Loop stays running beyond completed deck and laps',p.laps>2&&p.playing&&!p.finished&&!r.G.S.paused,p);
 r.call('SHOW.loop=false;showSyncControls();showSchedule()');r.until(()=>r.G.playback794.report().finished,400);
 check('turning Loop off permits finish at deck end',!r.context.show.playing&&r.G.playback794.report().progress===1);
}
{
 const r=rig({fps:12,pace:.5});r.advance(40);
 const before={s:r.G.S.sim.s,clock:r.G.S.clock,report:r.G.playback794.report()};r.call('showApplyBack()');
 check('appearance remount keeps drive and completion state',r.G.S.sim.s===before.s&&r.G.S.clock===before.clock&&r.G.playback794.report().distanceM===before.report.distanceM&&!r.G.playback794.report().finished);
 r.call('showPause()');r.call('showApplyBack()');check('paused appearance change remains paused',r.G.S.paused&&!r.context.show.playing);
 r.call('showPause()');r.advance(5);const snapshot=r.G.captureContextState792(r.G.S),s=r.G.S.sim.s;
 r.G.S.lost=true;r.call('showPause()');r.advance(70);
 const old=r.G.S;r.G.S={...old,gl:{},lost:false,sim:null};r.G.simReset();r.G.restoreContextState792(r.G.S,snapshot);r.call('showSyncControls()');
 check('context restoration retains partial route and paused ownership',r.G.S.sim.s===s&&r.G.S.paused&&!r.G.playback794.report().finished);
 r.call('showPause()');r.until(()=>r.G.playback794.report().finished,600);
 check('restored context still finishes complete lap',r.G.playback794.report().progress===1);
}
{
 const r=rig({fps:60});r.advance(75);
 const snapshot=r.G.captureContextState792(r.G.S),s=r.G.S.sim.s;r.G.S.lost=true;r.advance(30);
 check('lost context never advances the car',r.G.S.sim.s===s);
 check('deck may finish an already completed lap during context loss',r.G.playback794.report().finished&&!r.context.show.playing);
 const old=r.G.S;r.G.S={...old,gl:{},lost:false,sim:null};r.G.simReset();r.G.restoreContextState792(r.G.S,snapshot);
 check('stale running snapshot cannot restart a finished show',r.G.S.paused&&!r.context.show.playing);r.advance(2);
 check('restored finished show remains stationary',r.G.S.sim.s===s);
}
{
 const r=rig({fps:12,pace:.5});r.advance(40);
 const snapshot=r.G.captureContextState792(r.G.S),s=r.G.S.sim.s;r.G.S.lost=true;r.advance(70);
 check('incomplete lap does not finish during context loss',r.context.show.playing&&!r.G.playback794.report().finished&&r.G.S.sim.s===s);
 r.call('showPause()');const old=r.G.S;r.G.S={...old,gl:{},lost:false,sim:null};r.G.simReset();r.G.restoreContextState792(r.G.S,snapshot);
 check('Pause pressed while context was lost wins on restoration',r.G.S.paused&&!r.context.show.playing);
}
{
 const r=rig({fps:60});r.advance(10);r.call('SHOW.reduced=true;SHOW.playing=false;showClear();showSyncControls()');const s=r.G.S.sim.s;r.advance(100);
 check('reduced motion never forces playback or completion',r.G.S.sim.s===s&&!r.G.playback794.report().finished&&!r.G.playback794.restart());
 r.call('showClose()');r.advance(10);check('close cancels session and leaves it stopped',!r.G.playback794.report().active&&!r.context.show.playing);
}
{
 const r=rig({fps:60});r.advance(.5);r.call('showPause()');r.advance(10);
 check('Pause holds launch lamps and car',r.context.show.launch===0&&!r.context.show.playing);
 r.call('showPause()');r.advance(100);
 check('Resume during launch resumes chapter schedule and completes',r.context.show.launch===-1&&r.G.playback794.report().deckComplete&&r.G.playback794.report().finished);
}
{
 const r=rig({fps:60});
 r.call('bcTurns=()=>Array.from({length:35},(_,i)=>({slot:i+1,secs:2,section:Math.min(8,Math.floor(i/5)+1)}));bcStart()');
 check('broadcast starts car and owns chapter timing',r.context.show.playing&&r.context.show.timer===null&&r.context.show.launch===-1&&r.context.broadcast.on);
 r.advance(.7);const slot=r.context.broadcast.i;r.call('showPause()');const pos=r.G.S.sim.s;r.advance(10);
 check('Pause holds silent commentary and car',r.context.broadcast.i===slot&&r.G.S.sim.s===pos&&!r.context.broadcast.hold);
 r.call('showPause()');r.advance(1);
 check('resume retains remaining commentary hold',r.context.broadcast.i===slot&&r.context.show.timer===null);
 r.advance(.5);check('commentary advances after remaining hold',r.context.broadcast.i===slot+1&&r.context.show.timer===null);
 r.advance(100);check('broadcast keeps full lap moving without a deck timer race',r.context.show.playing&&r.G.playback794.report().laps>1&&!r.G.playback794.report().finished&&r.context.show.timer===null);
 r.call('bcToggle()');check('turning commentary off returns chapter timer ownership',!r.context.broadcast.on&&r.context.show.timer!=null&&r.context.show.playing);
 r.call('showClose()');r.advance(20);check('close stops broadcast and scheduled callbacks',!r.context.broadcast.on&&!r.context.broadcast.hold&&!r.context.show.timer);
}
{
 const r=rig({fps:60});r.call('bcTurns=()=>Array.from({length:35},(_,i)=>({slot:i+1,secs:2,section:1,audio:"memory:take"}));bcStart()');
 const audio=r.context.broadcast.el;audio.currentTime=1.25;r.call('showPause()');
 check('Pause stops active commentary audio',audio.paused);
 r.call('showPause()');check('Resume continues same take and offset',r.context.broadcast.el===audio&&!audio.paused&&audio.currentTime===1.25&&audio.plays===2);
 r.call('showPause()');audio.failed();r.advance(5);
 check('failed audio cannot arm a timer behind Pause',r.context.broadcast.i===1&&!r.context.broadcast.hold);
 r.call('showPause()');r.advance(2.1);check('failed audio uses one bounded fallback hold on Resume',r.context.broadcast.i===2);
}
const result={author:'Andrew Fisher',test:'Actual hosted G.frame, G.step, route and original scheduler baseline; timer/DOM render stubs isolate playback lifecycle, not physical-device performance',baselineSha256:crypto.createHash('sha256').update(html).digest('hex'),sourceSha256:crypto.createHash('sha256').update(moduleSource).digest('hex'),cases,checks};
fs.writeFileSync(path.join(__dirname,'playback794_checks.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,passed:checks.every(c=>c.pass),cases},null,2));
