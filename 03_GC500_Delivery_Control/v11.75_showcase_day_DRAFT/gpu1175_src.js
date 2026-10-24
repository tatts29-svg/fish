/* Author: Andrew Fisher. One submitted GPU frame at a time. Waiting uses a
   zero-timeout fence poll; animation continues while drawing waits. No gl.finish or readPixels. */
(function(root){
'use strict';
const G=root.GC3D;if(!G)return;
const clocks=new WeakMap(),stats={submitted:0,skipped:0,completed:0,maxGpuMs:0,retiring:0,qualityReductions:0,fallbacks:0};
// A hidden interval can have no animation callback at all. Invalidate its GPU sample.
document.addEventListener('visibilitychange',()=>{const q=G.S&&clocks.get(G.S);if(q&&document.hidden)q.interrupted=true;});
G.retireGPU1157=function(S,cleanup){
 const gl=S.gl;if(!gl)return cleanup();
 const jobs=[],q=clocks.get(S),fence=q?.fence||(!S.lost&&gl.fenceSync?gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0):null);
 if(fence)gl.flush();clocks.delete(S);
 // Run the existing DOM/audio/lifecycle cleanup immediately, deferring only GPU
 // destruction. The delayed jobs hold this old context, never global scene state.
 S.gl=new Proxy(gl,{get(target,key){
  if(typeof key==='string'&&key.startsWith('delete'))return (...args)=>jobs.push(()=>target[key](...args));
  if(key==='getExtension')return name=>name==='WEBGL_lose_context'?{loseContext:()=>jobs.push(()=>target.getExtension(name)?.loseContext())}:target.getExtension(name);
  const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
 }});
 let value,error;try{value=cleanup();}catch(e){error=e;}finally{S.gl=gl;}
 stats.retiring++;
 const release=()=>{
  if(fence&&!gl.isContextLost()&&gl.clientWaitSync(fence,0,0)===gl.TIMEOUT_EXPIRED){setTimeout(release,100);return;}
  try{if(fence&&!gl.isContextLost())gl.deleteSync(fence);for(const job of jobs)job();}finally{stats.retiring--;}
 };
 setTimeout(release,100);if(error)throw error;return value;
};
const mount=G.mount;
G.mount=function(){const result=mount.apply(this,arguments),S=G.S;if(S?.unmount&&!S.retire1157){const unmount=S.unmount;S.retire1157=true;S.unmount=function(...args){return G.retireGPU1157(S,()=>unmount.apply(this,args));};}// Native callback timing can request a reduction just after submitting a draw.
 // Never destroy framebuffers while that GPU work is outstanding.
 const reduce=G.stepDown;if(reduce&&!reduce.safe1175){
  const safe=function(){const current=G.S,q=current&&clocks.get(current);if(q?.fence){q.reduceRequested=true;return current.qualityStep;}return reduce.apply(this,arguments);};
  safe.safe1175=true;G.stepDown=safe;
 }
 return result;};
function ready(S){
 const gl=S.gl;if(!gl||S.lost||gl.isContextLost()){clocks.delete(S);return false;}
 const q=clocks.get(S);if(!q?.fence)return true;
 const result=gl.clientWaitSync(q.fence,0,0);
 if(result===gl.TIMEOUT_EXPIRED){stats.skipped++;return false;}
 gl.deleteSync(q.fence);q.fence=null;
 if(result===gl.WAIT_FAILED)return true;
 const elapsed=performance.now()-q.at;stats.completed++;stats.maxGpuMs=Math.max(stats.maxGpuMs,elapsed);
 // Only uninterrupted visible playback is a speed sample. A completed frame
 // taking ten seconds is a real stall, not a reason to ignore the slow device.
 if(!document.hidden&&!S.paused&&!q.interrupted){
  const slow=G.shouldReduceQuality792?G.shouldReduceQuality792({...S,fps:1000/Math.max(1,elapsed)}):elapsed>100;
  const requested=q.reduceRequested;q.reduceRequested=false;
  if(slow||requested){if(!q.slow)q.slowAt=q.at;q.slow=(q.slow||0)+1;}else q.slow=0;
  if(!G.noGuard&&(elapsed>1000||q.slow>=2)&&performance.now()>(q.reducedAt||0)+2000){
   // Severe stalls need the existing low-cost 3D settings immediately. Waiting
   // two frames per rung can leave the picture stuck for minutes. Geometry,
   // chosen look and the original quality controls are preserved.
   const severe=elapsed>1000;

   for(let n=0;n<(severe?8:1);n++){
    G.stepDown();stats.qualityReductions++;
    if(!severe||(S.reflOff&&S.shadowOff&&S.bloom===false&&(S.o?.ss||1)<=.55))break;
   }
   q.slow=0;q.reducedAt=performance.now();
  }
 }else {q.slow=0;q.reduceRequested=false;}
 return true;
}
const frame=G.frame;
G.frame=function(){
 const S=G.S;if(!S)return frame.apply(this,arguments);
 const q=clocks.get(S);
 if(q&&(document.hidden||S.paused||S.last==null))q.interrupted=true;
 if(document.hidden){S.last=null;return;}
 if(S.lost||S.gl?.isContextLost())return;
 // Keep a requested paused redraw dirty until it can actually be submitted.
 if(S.paused&&!ready(S)){S.last=null;return;}
 // The bounded fixed-step simulation and engine sound must not wait for a GPU
 // fence. Only G.render below waits; at most one draw remains outstanding.
 return frame.apply(this,arguments);
};
const render=G.render;
G.render=function(){
 const S=G.S;if(document.hidden||!S||!ready(S))return;
 const result=render.apply(this,arguments);
 if(S&&G.S===S&&!S.lost&&S.gl&&!S.gl.isContextLost()&&typeof S.gl.fenceSync==='function'){
  const q=clocks.get(S)||{};if(q.fence)S.gl.deleteSync(q.fence);
  q.fence=S.gl.fenceSync(S.gl.SYNC_GPU_COMMANDS_COMPLETE,0);q.at=performance.now();q.interrupted=!!S.paused;clocks.set(S,q);S.gl.flush();stats.submitted++;
 }
 return result;
};
root.ShowcaseGPU1175=root.ShowcaseGPU1174=root.ShowcaseGPU1157={state:()=>({...stats})};
})(window);
