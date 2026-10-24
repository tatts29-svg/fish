/* Author: Andrew Fisher. Exercise the live fixed-step clock against delayed GPU completion. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const candidate=fs.readFileSync(process.env.PAGE,'utf8'),base=fs.readFileSync(process.env.BASE,'utf8');
const core=html=>html.match(/G\.frame=function\(tms\)\{[\s\S]*?\n\};/)[0];
assert.equal(core(candidate),core(base),'bounded physics and sound update remain byte-identical');
const oldFile=fs.readFileSync(path.join(__dirname,'../../v11.57_showcase_smooth_LIVE/smooth1157.js'),'utf8');
const old=oldFile.slice(oldFile.indexOf('/* Author: Andrew Fisher. One submitted GPU frame'));
const fixed=fs.readFileSync(path.join(__dirname,'../gpu1174_src.js'),'utf8');
assert(candidate.includes(fixed));
function rig(source){
 let now=0,delay=200,lost=false,draws=0,sound=0,reductions=0,released=0,maxOutstanding=0;
 const fences=new Set(),timers=[],events={};
 const gl={TIMEOUT_EXPIRED:1,WAIT_FAILED:2,SYNC_GPU_COMMANDS_COMPLETE:3,isContextLost:()=>lost,
 clientWaitSync:(f,flags,timeout)=>{assert.equal(flags,0);assert.equal(timeout,0);return now<f.at?1:0;},
 deleteSync:f=>fences.delete(f),fenceSync:()=>{const f={at:now+delay};fences.add(f);maxOutstanding=Math.max(maxOutstanding,fences.size);return f;},flush:()=>{},
 deleteBuffer:()=>released++,getExtension:()=>({loseContext:()=>released++})};
 const S={gl,clock:0,last:null,accum:0,o:{ss:1}};
 const G={S,frame:null,step:h=>{S.clock+=h},camStep:()=>{},render:()=>draws++,sound:{isOn:()=>true,tick:()=>sound++},stepDown:()=>reductions++};
 const document={hidden:false,addEventListener:(n,fn)=>events[n]=fn},window={GC3D:G};
 vm.runInNewContext(core(candidate)+'\n'+source,{G,window,document,performance:{now:()=>now},setTimeout:fn=>timers.push(fn),WeakMap,Proxy});
 return {S,G,gl,document,events,timers,window,tick:t=>{now=t;G.frame(t)},delay:d=>delay=d,lost:b=>lost=b,stats:()=>({draws,sound,reductions,released,maxOutstanding})};
}
const baseline=rig(old),fixedRun=rig(fixed);
for(let i=0;i<=120;i++){baseline.tick(i*1000/60);fixedRun.tick(i*1000/60)}
assert(baseline.S.clock<.6);assert(Math.abs(fixedRun.S.clock-2)<.00001);
assert(fixedRun.stats().draws<=11);assert.equal(fixedRun.stats().maxOutstanding,1);assert.equal(fixedRun.stats().sound,121);
console.log('PASS two-second 60 Hz clock with 200 ms GPU frames:',{before:baseline.S.clock,after:fixedRun.S.clock,draws:fixedRun.stats().draws});
const pause=rig(fixed);pause.tick(0);pause.tick(16);const clock=pause.S.clock;pause.S.paused=true;pause.S.needsRender=true;pause.tick(32);
assert(pause.S.needsRender);assert.equal(pause.S.clock,clock);pause.tick(220);assert(!pause.S.needsRender);assert.equal(pause.stats().draws,2);
pause.S.paused=false;pause.S.last=null;pause.tick(20000);assert.equal(pause.S.clock,clock);assert.equal(pause.stats().reductions,0);
pause.document.hidden=true;pause.events.visibilitychange();pause.tick(40000);assert.equal(pause.S.clock,clock);const draws=pause.stats().draws;
pause.document.hidden=false;pause.tick(60000);assert.equal(pause.S.clock,clock);assert.equal(pause.stats().reductions,0);assert.equal(pause.stats().draws,draws+1);
console.log('PASS paused redraw retained, hidden interval excluded, no resume jump');
const slow=rig(fixed);slow.delay(12000);for(let i=0;i<=720;i++)slow.tick(i*1000/60);
assert.equal(slow.stats().reductions,8,'severe completed GPU frame reaches bounded existing quality ladder');assert(Math.abs(slow.S.clock-12)<.0001);
const target=rig(fixed);target.G.shouldReduceQuality792=S=>S.fps<45;target.delay(40);for(let i=0;i<=180;i++)target.tick(i*1000/60);assert(target.stats().reductions>0,'actual drawing speed uses existing quality target even with fast callbacks');
const manual=rig(fixed);manual.G.noGuard=true;manual.delay(12000);for(let i=0;i<=720;i++)manual.tick(i*1000/60);assert.equal(manual.stats().reductions,0);
const moderate=rig(fixed);for(let i=0;i<=180;i++)moderate.tick(i*1000/60);assert.equal(moderate.stats().reductions,1);
console.log('PASS >10-second stalls trigger guard, moderate slowdown is gradual, manual quality respected');
const cleanup=rig(fixed);cleanup.tick(0);let closed=false;
cleanup.G.retireGPU1157(cleanup.S,()=>{closed=true;cleanup.S.gl.deleteBuffer({});cleanup.S.gl.getExtension('WEBGL_lose_context').loseContext()});
assert(closed);assert.equal(cleanup.stats().released,0);cleanup.timers.shift()();assert.equal(cleanup.stats().released,0);
cleanup.lost(true);cleanup.timers.shift()();assert.equal(cleanup.stats().released,2);assert.equal(cleanup.window.ShowcaseGPU1174.state().retiring,0);
const lost=rig(fixed);lost.lost(true);lost.tick(0);lost.tick(1000);assert.equal(lost.stats().draws,0);assert.equal(lost.S.clock,0);
console.log('PASS close is immediate, old-context disposal deferred, lost scene does not advance');

const fallback=rig(fixed);let handedBack=0;fallback.window.ShowcaseQuick1143={fallback:(scene,ms)=>{assert.equal(scene,fallback.S);assert(ms>1000);handedBack++;return true;}};
fallback.S.reflOff=true;fallback.S.shadowOff=true;fallback.S.bloom=false;fallback.S.o.ss=.5;fallback.delay(12000);
fallback.tick(0);fallback.tick(12000);assert.equal(fallback.stats().draws,1);assert.equal(handedBack,0);
fallback.timers.shift()();assert.equal(handedBack,1);assert.equal(fallback.window.ShowcaseGPU1174.state().fallbacks,1);
console.log('PASS minimum-detail severe stall yields to deferred flat-circuit handback');
const sustained=rig(fixed);let restored=0;sustained.G.shouldReduceQuality792=S=>S.fps<26;sustained.window.ShowcaseQuick1143={fallback:()=>{restored++;return true;}};
Object.assign(sustained.S,{reflOff:true,shadowOff:true,bloom:false});sustained.S.o.ss=.5;sustained.delay(50);
for(let i=0;i<120;i++)sustained.tick(i*1000/60);assert.equal(sustained.timers.length,0,'short low-FPS interval does not trigger fallback');
for(let i=120;i<=150;i++)sustained.tick(i*1000/60);assert.equal(sustained.timers.length,1);sustained.timers.shift()();assert.equal(restored,1);
console.log('PASS sustained below-target drawing at minimum detail triggers fallback after two seconds');

// Only the footer, GPU scheduler and fallback timing module may differ; all data, circuit, crew,
// report and unrelated feature code remain byte-identical.
assert.equal(candidate.replace(fixed,old).replace(fs.readFileSync(path.join(__dirname,'../quick1174_src.js'),'utf8'),base.match(/\/\* Author: Andrew Fisher\. v11\.43 - the Showcase opens quicker[\s\S]*?(?=<\/script>)/)[0].trimEnd()+'\n').replace("+' · v11.74'; /* v8.19 release922","+' · v11.73'; /* v8.19 release922"),base);
console.log('PASS complete page preservation outside the scheduler and release label');
