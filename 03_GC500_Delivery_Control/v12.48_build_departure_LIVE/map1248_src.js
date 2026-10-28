/* Author: Andrew Fisher. Preserve native item icons and departure facts; give inline phone maps a usable viewport. */
(function(root){
'use strict';
function reference(nativeLabel,it,departure){
 const original=String(nativeLabel==null?'':nativeLabel);
 if(!departure||!Number.isFinite(departure.collected)||departure.collected<=0)return original;
 const ref=String(it&&it.reg&&it.reg.sourceRequest1017?it.reg.sourceKey1017:it&&it.code||'');
 const n=departure.collected,remaining=departure.remaining;
 const complete=departure.complete===true&&departure.unknown!==true&&Array.isArray(departure.issues)&&departure.issues.length===0;
 const total=Number.isFinite(remaining)&&remaining>=0?n+remaining:null;
 const count=complete?String(n):String(n)+'/'+(total==null?'?':String(total)+(departure.unknown?'+?':''));
 const labelled=ref&&original.startsWith(ref)?ref+' ('+count+')'+original.slice(ref.length):original+' ('+count+')';
 return labelled+' ↗'+(Array.isArray(departure.issues)&&departure.issues.length?' · REVIEW':'');
}
function height(previous,mainHeight,small,full){
 if(full||!small||!Number.isFinite(mainHeight)||mainHeight<=0)return previous;
 // The map can occupy one scrolled main viewport instead of only the gap below its controls.
 return Math.max(previous,Math.max(160,Math.floor(mainHeight)-16));
}
const api={version:1248,reference,height};
if(typeof module==='object'&&module.exports){module.exports=api;return;}
if(!root||root.MapDisplay1248)return;
root.MapDisplay1248=Object.freeze(api);
const viewport=root.MapViewport1203;
if(viewport&&typeof viewport.height==='function'){
 const before=viewport.height;
 viewport.height=function(available,vh,full,landscape){
  const native=before.apply(this,arguments),main=document.querySelector('main');
  const small=matchMedia('(max-width:640px)').matches||(matchMedia('(pointer:coarse)').matches&&innerWidth<=1024);
  return height(native,main&&main.clientHeight,small,full);
 };
 if(typeof root.expSize==='function')root.expSize();
}
})(typeof window==='object'?window:null);
