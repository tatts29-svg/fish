/* Author: Andrew Fisher. Device-only map height; native map content and gestures stay intact. */
(function(W){
 'use strict';
 if(W.MapViewport1203)return;
 const key='gc500.map.height1203',valid=new Set(['auto','large','tall']);
 let choice='auto';try{const saved=localStorage.getItem(key);if(valid.has(saved))choice=saved;}catch(_){}
 const desktop=()=>matchMedia('(min-width:641px) and (min-height:501px)').matches;
 const docs=new WeakSet();
 function mount(frame){
  try{const doc=frame&&frame.contentDocument;if(!doc||docs.has(doc))return;docs.add(doc);
   // Keyboard events in the embedded plan never bubble to the parent page.
   doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('expfull-on')){
    e.preventDefault();e.stopPropagation();W.expFullToggle(false);
   }},true);
  }catch(_){}
 }
 W.MapViewport1203={version:1203,author:'Andrew Fisher',mount,
  height(available,vh,full,landscape){
   const fit=Math.max(full||landscape?0:200,Math.floor(available));
   if(full||!desktop()||choice==='auto')return fit;
   return Math.max(fit,Math.round(vh*(choice==='tall'?1.15:.82)));
  },
  choice:()=>choice
 };
 const tools=W.expTools;W.expTools=function(){return '<label class="map1203-size">Map height <select id="mapSize1203" data-ro aria-controls="expwrap">'+
  [['auto','Fit screen'],['large','Large'],['tall','Extra tall']].map(([v,t])=>'<option value="'+v+'"'+(choice===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'+tools.apply(this,arguments);};
 document.addEventListener('change',e=>{if(e.target.id!=='mapSize1203'||!valid.has(e.target.value))return;
  choice=e.target.value;try{localStorage.setItem(key,choice);}catch(_){}W.expSize();
 });
 const frame=W.expFrame;W.expFrame=function(){const f=frame.apply(this,arguments);if(!f.dataset.map1203){
  f.dataset.map1203='1';f.addEventListener('load',()=>mount(f));mount(f);
 }return f;};
 if(W.EXP?.frame)mount(W.EXP.frame);
})(window);
