
/* Author: Andrew Fisher. Build the existing circuit in interruptible steps.
   The synchronous constructors remain available to the standalone scene. Their
   generator twins use the same geometry, random order and uploads, yielding
   between statements and loop iterations. A partial scene is private between
   steps, so the normal renderer can only see a complete scene. */
(function(root){
'use strict';
const G=root.GC3D;if(!G||!G.initSteps1157)return;
G.eachSteps1157=function*(array,callback,self){
 if(array instanceof Map){for(const [key,value] of array)yield* callback.call(self,value,key,array);return;}
 if(array instanceof Set){for(const value of array)yield* callback.call(self,value,value,array);return;}
 const length=array.length;
 for(let i=0;i<length;i++)if(i in array)yield* callback.call(self,array[i],i,array);
};
let deadline=0,checks=0;G.due1157=()=>((++checks&31)===0&&performance.now()>=deadline);
G.programSteps1157=function*(gl,vs,fs,names){
 const extension=gl.getExtension('KHR_parallel_shader_compile'),shaders=[],p=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
  const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(p,shader);
 }
 gl.linkProgram(p);
 if(extension)while(!gl.getProgramParameter(p,extension.COMPLETION_STATUS_KHR))yield 'shader';
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
  const reason=shaders.map(s=>gl.getShaderInfoLog(s)).join(' ')+' '+gl.getProgramInfoLog(p);
  shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(p);throw new Error('Circuit shader: '+reason);
 }
 const u={};for(const n of names)u[n]=gl.getUniformLocation(p,n);
 shaders.forEach(s=>gl.deleteShader(s));return {p,u};
};
const report={starts:0,cancelled:0,completed:0,steps:0,maxTaskMs:0,buildMs:0,error:null};
let pending=null,serial=0;
const back=()=>document.getElementById('showcase')?.getAttribute('data-back');
const wanted=()=>typeof SHOW!=='undefined'&&SHOW.open&&is3dBack(back())&&show3dAvailable();
function note(){
 if(!pending)return;
 const e=document.getElementById('show3dNote');if(!e)return;
 e.hidden=false;const label=pending.phase||'Preparing 3D circuit…';if(e.textContent!==label)e.textContent=label;
}
function dispose(S){
 if(!S)return;
 try{S.cv?.remove();if(G.retireGPU1157)G.retireGPU1157(S,()=>{const ext=S.gl?.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();});else{const ext=S.gl?.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();}}catch(e){}
}
function cancel(){
 if(!pending)return;
 const q=pending;pending=null;serial++;clearTimeout(q.timer);
 try{q.steps.return();}catch(e){}
 dispose(q.scene);report.cancelled++;
}
function* prepare(q){
 const C=DATA.circuit,pack=DATA.surrounds;
 q.phase='Building the circuit…';note();
 const ok=yield* G.initSteps1157({look:q.look,ring:{outer:C.ring.outer,inner:C.ring.inner,box:C.ring.box},roadWidth:C.roadWidth||null,streets:pack?[]:C.streets,buildings:[],pit:pack&&pack.pit&&G.packPts?pack.pit.map(r=>G.packPts(pack,r,1)):null});
 if(!ok)throw new Error('WebGL2 is not available here');
 q.phase='Preparing buildings and fences…';note();
 if(pack)yield* G.loadPackSteps1157(pack);
 q.phase='Preparing grandstands…';note();
 if(G.setStandsSteps1157)yield* G.setStandsSteps1157(C.stands);
q.phase='Finishing the scene…';note();
for(const name of ['crowdMesh','dayTrees','dayTreeTrunks','trees','bMesh','trackConcrete','trackFencePosts','trackFenceWire','trackScuffs','dayRoadShoulder','dayRoadSurface','cityDetail','standDecor','standMesh','pitLane','pitWallMesh'])yield* G.visibilitySteps1157(G.S[name]);
}
function finish(q){
 const S=q.scene,init=G.init,load=G.loadPack,stands=G.setStands;
 // The adapter still owns credits, the frame loop, recovery and disposal. Its
 // three constructors consume the completed scene instead of constructing it twice.
 G.S=null;G.init=()=>{G.S=S;return true;};G.loadPack=()=>S.bCount;G.setStands=()=>S.standStats?.drawn||0;
 let result;
 try{result=G.mount(DATA.surrounds,q.look);}finally{G.init=init;G.loadPack=load;G.setStands=stands;}
 if(!/^mounted/.test(result))throw new Error(result);
 // Keep the existing optional-detail budget. Time spent yielding is excluded.
 if(q.workMs>1500&&!S.fullLapFailed788){S.fullLapFailed788='detail skipped: circuit preparation exceeded the device budget';S.detail781Enabled=false;}
 report.completed++;report.buildMs=Math.round(q.workMs);
 // The remembered slow-device value measures a blocking task, not elapsed
 // preparation. A cooperative build must not force a later opening to flat.
 try{localStorage.setItem('gc500.show3d.mount',JSON.stringify({ms:Math.round(q.maxTaskMs),at:new Date().toISOString()}));}catch(e){}
 pending=null;
sync.call(root,!SHOW.playing||SHOW.reduced||motionOff());
 showViewSync();
 show3dNote();
}
function tick(q){
 if(pending!==q)return;
 if(!wanted()||back3dLook(back())!==q.look){cancel();return;}
 if(document.hidden){q.timer=setTimeout(()=>tick(q),100);return;}
 const started=performance.now();deadline=started+8;checks=0;let done=false,waiting=false;
 G.S=q.scene;
 try{
  // A small task budget leaves room for input, painting and the scene clock.
  do{const result=q.steps.next();report.steps++;done=result.done;waiting=result.value==='shader';if(done||waiting)break;}while(performance.now()-started<8);
  q.scene=G.S;
 }catch(error){q.scene=G.S;G.S=null;cancel();G.failed=String(error.message||error);report.error=G.failed;show3dNote();return;}
 G.S=null;
 const ms=performance.now()-started;q.workMs+=ms;q.maxTaskMs=Math.max(q.maxTaskMs,ms);report.maxTaskMs=Math.max(report.maxTaskMs,ms);
 if(done){try{const finalStart=performance.now();finish(q);report.finishMs=performance.now()-finalStart;}catch(error){G.S=null;cancel();G.failed=String(error.message||error);report.error=G.failed;show3dNote();}return;}
 q.timer=setTimeout(()=>tick(q),waiting?16:0);
}
const sync=root.show3dSyncInner;
root.show3dSyncInner=function(still){
 if(pending&&(!wanted()||pending.look!==back3dLook(back())))cancel();
 if(wanted()&&G.S&&((G.S.look?.name==='showcase'?'dark':G.S.look?.name)!==back3dLook(back()))){show3dStop();G.failed=null;}
 if(wanted()&&!G.S&&!G.failed){
  if(document.hidden)return;
  if(!pending){const q=pending={id:++serial,look:back3dLook(back()),scene:null,timer:0,workMs:0,maxTaskMs:0};q.steps=prepare(q);report.starts++;report.error=null;q.timer=setTimeout(()=>tick(q),0);}
  note();return;
 }
 return sync.apply(this,arguments);
};
const beforeNote=root.show3dNote;
root.show3dNote=function(){const r=beforeNote.apply(this,arguments);note();return r;};
const close=root.showClose;
root.showClose=function(){cancel();return close.apply(this,arguments);};
root.ShowcaseSmooth1157={state:()=>({...report,pending:!!pending,phase:pending?'preparing':G.S?'ready':'idle'}),cancel};
})(window);
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

