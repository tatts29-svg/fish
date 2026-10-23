/* Author: Andrew Fisher. Build the existing circuit in interruptible steps.
   The synchronous constructors remain available to the standalone scene. Their
   generator twins use the same geometry, random order and uploads, yielding
   between statements and loop iterations. A partial scene is private between
   steps, so the normal renderer can only see a complete scene. */
(function(root){
'use strict';
const G=root.GC3D;if(!G||!G.initSteps1156)return;
G.eachSteps1156=function*(array,callback,self){
 const length=array.length;
 for(let i=0;i<length;i++)if(i in array)yield* callback.call(self,array[i],i,array);
};
let deadline=0,checks=0;G.due1156=()=>((++checks&31)===0&&performance.now()>=deadline);
G.programSteps1156=function*(gl,vs,fs,names){
 const extension=gl.getExtension('KHR_parallel_shader_compile'),shaders=[],p=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
  const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(p,shader);
 }
 gl.linkProgram(p);
 if(extension)while(!gl.getProgramParameter(p,extension.COMPLETION_STATUS_KHR))yield;
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
const wanted=()=>typeof SHOW!=='undefined'&&SHOW.open&&!document.hidden&&is3dBack(back())&&show3dAvailable();
function note(){
 if(!pending)return;
 const e=document.getElementById('show3dNote');if(!e)return;
 e.hidden=false;e.textContent='Preparing 3D circuit…';
}
function dispose(S){
 if(!S)return;
 try{S.cv?.remove();const ext=S.gl?.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();}catch(e){}
}
function cancel(){
 if(!pending)return;
 const q=pending;pending=null;serial++;clearTimeout(q.timer);
 try{q.steps.return();}catch(e){}
 dispose(q.scene);report.cancelled++;
}
function* prepare(q){
 const C=DATA.circuit,pack=DATA.surrounds;
 const ok=yield* G.initSteps1156({look:q.look,ring:{outer:C.ring.outer,inner:C.ring.inner,box:C.ring.box},roadWidth:C.roadWidth||null,streets:pack?[]:C.streets,buildings:[],pit:pack&&pack.pit&&G.packPts?pack.pit.map(r=>G.packPts(pack,r,1)):null});
 if(!ok)throw new Error('WebGL2 is not available here');
 if(pack)yield* G.loadPackSteps1156(pack);
 if(G.setStandsSteps1156)yield* G.setStandsSteps1156(C.stands);
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
 show3dNote();
}
function tick(q){
 if(pending!==q)return;
 if(!wanted()||back3dLook(back())!==q.look){cancel();return;}
 if(document.hidden){q.timer=setTimeout(()=>tick(q),100);return;}
 const started=performance.now();deadline=started+8;checks=0;let done=false;
 G.S=q.scene;
 try{
  // A small task budget leaves room for input, painting and the scene clock.
  do{const result=q.steps.next();report.steps++;done=result.done;if(done)break;}while(performance.now()-started<8);
  q.scene=G.S;
 }catch(error){q.scene=G.S;G.S=null;cancel();G.failed=String(error.message||error);report.error=G.failed;show3dNote();return;}
 G.S=null;
 const ms=performance.now()-started;q.workMs+=ms;q.maxTaskMs=Math.max(q.maxTaskMs,ms);report.maxTaskMs=Math.max(report.maxTaskMs,ms);
 if(done){try{finish(q);}catch(error){G.S=null;cancel();G.failed=String(error.message||error);report.error=G.failed;show3dNote();}return;}
 q.timer=setTimeout(()=>tick(q),0);
}
const sync=root.show3dSyncInner;
root.show3dSyncInner=function(still){
 if(pending&&(!wanted()||pending.look!==back3dLook(back())))cancel();
 if(wanted()&&!G.S&&!G.failed){
  if(!pending){const q=pending={id:++serial,look:back3dLook(back()),scene:null,timer:0,workMs:0,maxTaskMs:0};q.steps=prepare(q);report.starts++;report.error=null;q.timer=setTimeout(()=>tick(q),0);}
  note();return;
 }
 return sync.apply(this,arguments);
};
const beforeNote=root.show3dNote;
root.show3dNote=function(){const r=beforeNote.apply(this,arguments);note();return r;};
const close=root.showClose;
root.showClose=function(){cancel();return close.apply(this,arguments);};
root.ShowcaseSmooth1156={state:()=>({...report,pending:!!pending,phase:pending?'preparing':G.S?'ready':'idle'}),cancel};
})(window);
