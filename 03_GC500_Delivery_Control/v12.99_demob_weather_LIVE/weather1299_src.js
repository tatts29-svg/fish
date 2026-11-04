/* Author: Andrew Fisher. Stable weather updates and native forecast requests for Demob. */
(function(root){
'use strict';
function create(env){
 const keys=new WeakMap();let attemptedAt=null,attemptedDay=null,queued=false;
 const delay=Number.isFinite(env.refreshMs)&&env.refreshMs>0?env.refreshMs:600000;
 const defer=env.defer||((fn)=>Promise.resolve().then(fn));
 function signature(value){return JSON.stringify(value);}
 function remember(card,weather){keys.set(card,signature(weather));}
 function changed(card,weather){const next=signature(weather);if(keys.get(card)===next)return false;keys.set(card,next);return true;}
 function answered(){
  if(queued)return;queued=true;
  defer(()=>{queued=false;if(env.active())env.paint();});
 }
 function request(){
  if(!env.active())return false;
  const now=env.now(),day=env.day();
  if(attemptedAt!==null&&day===attemptedDay&&now>=attemptedAt&&now-attemptedAt<delay)return false;
  attemptedAt=now;attemptedDay=day;
  for(const load of env.loaders())if(typeof load==='function'){try{load(answered);}catch(_){answered();}}
  return true;
 }
 return Object.freeze({remember,changed,request});
}
function boundLabel(w){
 if(w.hi!==null&&w.lo===null)return 'max';
 if(w.hi===null&&w.lo!==null)return 'min';
 return '';
}
const api=Object.freeze({version:'v12.99',create,boundLabel});
if(typeof module==='object'&&module.exports)module.exports=api;
else root.WeatherCards1299=api;
})(typeof window==='object'?window:globalThis);
