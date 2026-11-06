/* Author: Andrew Fisher. Build map pictures use the same exact source reference layout. */
(function(W){
'use strict';
if(W.BuildShapes1297)return;
const finite=Number.isFinite,version='v12.97';
function attempt(fn,fallback=null){try{return fn()??fallback;}catch(_){return fallback;}}
function planSpot(L){
 if(!L||!finite(L.lat)||!finite(L.lon)||L.demob1297?.kind==='unlocated')return null;
 return attempt(()=>{
  const data=typeof DATA!=='undefined'?DATA:W.DATA,sheet=(data?.sheets||[]).find(s=>s.key==='D001'),fit=W.sheetFitOf(sheet),fr=W.frameOf(L.lat,L.lon);
  const fx=fit.fx.k*fr.ax+fit.fx.c,fy=fit.fy.k*fr.ay+fit.fy.c;
  return finite(fx)&&finite(fy)&&fx>0&&fx<1&&fy>0&&fy<1?{fx,fy,exact:!L.demob1297?.approximate}:null;
 });
}
function prepare(key,L){
 if(!L||!W.DemobShapes1297)return null;
 const a=L.a||attempt(()=>W.assetOf(key)),source=attempt(()=>W.gc500MapShapes1060());
 const p=planSpot(L),destination=attempt(()=>W.dest782(a));
 // A Build picture represents the reference, including mixed equipment. It does
 // not infer departure or completion from a planned delivery date or a Demob card.
 const card={key:String(key||L.key||L.label||''),uid:'build-reference',group:true,icon:'other',r:{a},st:{s:'build'}};
 const marker=W.DemobShapes1297.context(card,L,{source,destination,rawShape:null,wholeReference:true,sheetPoint:p?[p.fx,p.fy]:null});
 return {...L,demob1297:marker,build1297:true};
}
function signature(L){return L?.demob1297?W.DemobShapes1297.signature(L.demob1297):'';}
function drawingId(key,L){
 const p=planSpot(L);return p?String(key)+'|'+p.fx+','+p.fy+(p.exact?'':',a'):null;
}
W.BuildShapes1297=Object.freeze({version,prepare,signature,planSpot,drawingId});
})(window);
