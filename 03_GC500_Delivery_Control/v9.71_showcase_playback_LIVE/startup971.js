/* Author: Andrew Fisher. Upload static scene detail before submitting its first heavy frame. */
const ShowcaseStartup971 = (() => {
 'use strict';
 function create(G,env){
  const states=new WeakMap(),unmounts=new WeakSet();
  const required=S=>!G.fullLap788?.enabled||S.bloom===false||S.fullLapFailed788?[]:[
   !S.trackDetail781?'track':null,
   !S.architecture781&&S.architecture781Source?.length?'architecture':null,
   !S.vegetation781&&S.vegetation781Source?.length?'vegetation':null
  ].filter(Boolean);
  const current=S=>G.S===S&&!S.lost&&S.gl&&!S.gl.isContextLost?.();
  const visible=S=>current(S)&&!env.hidden()&&env.open()&&S.cv?.isConnected!==false;
  function stop(q){if(q.raf){env.cancel(q.raf);q.raf=0;}}
  function release(S){const q=states.get(S);if(q)stop(q);states.delete(S);}
  function bindUnmount(S){
   if(unmounts.has(S)||typeof S.unmount!=='function')return;
   const unmount=S.unmount;unmounts.add(S);
   S.unmount=function(){release(S);return unmount.apply(this,arguments);};
  }
  function hold(S){S.last=null;S.accum=0;}
  function progress(S,q){
   if(S.cv&&!q.canvas){q.canvas={element:S.cv,visibility:S.cv.style.visibility};S.cv.style.visibility='hidden';}
   for(const e of S.cv?.parentNode?.querySelectorAll('svg.shcircuit,svg.shhalo')||[]){if(!q.flat.some(x=>x.element===e))q.flat.push({element:e,visibility:e.style.visibility});e.style.visibility='';}
   if(S.capEl){if(!q.caption||q.caption.element!==S.capEl)q.caption={element:S.capEl,text:S.capEl.textContent};q.caption.owned='Preparing circuit · '+q.completed+' / '+q.total;S.capEl.textContent=q.caption.owned;}
  }
  function finish(S,q){
   if(!q||q.shown||!visible(S))return;
   stop(q);q.shown=true;q.finished=env.now();hold(S);
   // Credit, canvas and fallback return only after a successful draw of the prepared scene.
   if(q.canvas&&q.canvas.element===S.cv)q.canvas.element.style.visibility=q.canvas.visibility;
   q.flat.forEach(x=>{if(x.element.isConnected!==false)x.element.style.visibility=x.visibility;});
   if(q.caption&&q.caption.element===S.capEl&&S.capEl.textContent===q.caption.owned)S.capEl.textContent=typeof S.creditNow==='function'?S.creditNow():q.caption.text;
   S.guardAfter918=Math.max(S.guardAfter918||0,env.now()+6000);
  }
  function prepare(S,ensure,fail){
   if(!current(S))return false;
   bindUnmount(S);
   let q=states.get(S);
   if(!visible(S)){if(q)stop(q);hold(S);S.needsRender=true;return false;}
   if(q?.raf)return false;
   if(!required(S).length){ensure(S);if(!current(S))return false;if(q)q.prepared=true;return true;}
   if(!q||q.shown){q={started:env.now(),finished:null,completed:0,total:required(S).length,raf:0,prepared:false,shown:false,flat:[]};states.set(S,q);}
   hold(S);progress(S,q);
   const before=required(S),count=before.length;
   ensure(S);
   if(!current(S))return false;
   const after=required(S);
   if(after.length>=count){fail(S,new Error('Static circuit preparation did not complete: '+before[0]));if(!current(S))return false;}
   q.completed=q.total-required(S).length;progress(S,q);
   // Yield once after the final installer too: the outer visibility wrapper must prepare
   // the replacement tree mesh before any heavy scene draw can create driver backpressure.
   q.raf=env.raf(()=>{q.raf=0;if(!visible(S)){hold(S);S.needsRender=true;return;}G.render();});
   return false;
  }
  function draw(S,render){
   const result=render();if(current(S)){const q=states.get(S);if(q?.prepared)finish(S,q);}return result;
  }
  function frame(renderFrame){
   const S=G.S;if(!S)return renderFrame();
   const q=states.get(S);
   if(required(S).length||q&&!q.shown){
    hold(S);if(!visible(S)){if(q)stop(q);S.needsRender=true;return;}
    if(typeof G.camStep==='function')G.camStep(0);
    return G.render();
   }
   return renderFrame();
  }
  function report(){const S=G.S,q=S&&states.get(S);return q?{prepared:q.prepared,shown:q.shown,completed:q.completed,total:q.total,pending:!!q.raf,elapsedMs:(q.finished??env.now())-q.started}:null;}
  return {required,prepare,draw,frame,report};
 }
 const api={create};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window==='undefined'||!window.GC3D)return api;
 const G=window.GC3D,controller=create(G,{raf:f=>requestAnimationFrame(f),cancel:id=>cancelAnimationFrame(id),now:()=>performance.now(),hidden:()=>document.hidden,open:()=>typeof SHOW==='undefined'||SHOW.open});
 G.prepareStatic971=controller.prepare;G.drawPrepared971=controller.draw;G.startupReport971=controller.report;
 const frame=G.frame;G.frame=function(){const self=this,args=arguments;return controller.frame(()=>frame.apply(self,args));};
 return api;
})();
