/* Author: Andrew Fisher. GPU backpressure must yield, keep time and respect pause. */
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../smooth1157.js'),'utf8').split('/* Author: Andrew Fisher. One submitted GPU frame')[1];
let now=0,draws=0,steps=0,deleted=0,result=1,lost=false,frames=0;
const gl={TIMEOUT_EXPIRED:1,WAIT_FAILED:2,SYNC_GPU_COMMANDS_COMPLETE:3,isContextLost:()=>lost,clientWaitSync:(f,flags,timeout)=>{assert.equal(flags,0);assert.equal(timeout,0);return result;},deleteSync:()=>deleted++,fenceSync:()=>({}),flush:()=>{}};
const S={gl,last:123},G={S,frame:()=>{frames++;G.render();},render:()=>draws++,stepDown:()=>steps++};
const timers=[];const root={GC3D:G};vm.runInNewContext('/* Author: Andrew Fisher. One submitted GPU frame'+source,{window:root,document:{hidden:false},performance:{now:()=>now},WeakMap,Proxy,setTimeout:fn=>timers.push(fn)});
G.frame();assert.equal(draws,1);
for(let i=0;i<20;i++){now+=50;G.frame();}assert.equal(draws,1);assert.equal(frames,1);assert.equal(S.last,123);
result=0;now=2500;G.frame();assert.equal(draws,2);assert.equal(deleted,1);
now=2800;G.frame();assert.equal(steps,1);
G.noGuard=true;now=6000;G.frame();now=6500;G.frame();assert.equal(steps,1);
G.noGuard=false;S.paused=true;now=9500;G.frame();now=9800;G.frame();assert.equal(steps,1);
result=2;G.frame();assert.equal(draws,8);
lost=true;G.frame();assert.equal(draws,8);
console.log('PASS non-blocking GPU wait, no duplicate frame submission, simulation timestamp kept, quality guard, pause and lost context');

lost=false;result=1;let domClosed=false,released=0;gl.deleteBuffer=()=>released++;gl.getExtension=()=>({loseContext:()=>released++});
G.retireGPU1157(S,()=>{domClosed=true;S.gl.deleteBuffer({});S.gl.getExtension('WEBGL_lose_context').loseContext();});
assert(domClosed);assert.equal(released,0);assert.equal(S.gl,gl);assert.equal(root.ShowcaseGPU1157.state().retiring,1);
timers.shift()();assert.equal(released,0);result=0;timers.shift()();assert.equal(released,2);assert.equal(root.ShowcaseGPU1157.state().retiring,0);
console.log('PASS immediate close, delayed old-context cleanup, zero-timeout polling, resources released');
