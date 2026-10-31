/* Author: Andrew Fisher. Preserve day-strip position and animate only intentional navigation. */
(function(){
'use strict';
const original=timelineChange;
function reduced(){return document.documentElement.dataset.motion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;}
timelineChange=function(){
 const pane=document.getElementById('pane-timeline'),strip=pane&&pane.querySelector('.daystrip');
 const before=strip?strip.scrollLeft:0;
 const result=original.apply(this,arguments);
 const fresh=pane&&pane.querySelector('.daystrip'),selected=fresh&&fresh.querySelector('.day.on');
 if(fresh&&selected&&fresh.clientWidth>0){
  fresh.scrollLeft=Math.min(before,Math.max(0,fresh.scrollWidth-fresh.clientWidth));
  const left=selected.offsetLeft-fresh.offsetLeft;
  if(left<fresh.scrollLeft||left+selected.offsetWidth>fresh.scrollLeft+fresh.clientWidth){
   const destination=Math.max(0,Math.min(left-(fresh.clientWidth-selected.offsetWidth)/2,fresh.scrollWidth-fresh.clientWidth));
   fresh.scrollTo({left:destination,behavior:reduced()?'auto':'smooth'});
  }
 }
 if(!reduced()&&selected&&selected.animate){selected.animate([{opacity:.72,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});}
 return result;
};
let queued=0,active=null,point=null;
function reset(card){if(!card)return;['--wx983-pitch','--wx983-yaw','--wx983-x','--wx983-y'].forEach(k=>card.style.removeProperty(k));}
document.addEventListener('pointermove',e=>{
 const card=e.target.closest&&e.target.closest('#pane-timeline .day.on[data-weather-card]');
 if(!card||e.pointerType!=='mouse'||reduced()||document.hidden)return;
 if(active&&active!==card)reset(active);active=card;point={x:e.clientX,y:e.clientY};
 if(queued)return;queued=requestAnimationFrame(()=>{queued=0;if(!active||!active.isConnected||reduced()||document.hidden)return reset(active);const r=active.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(point.x-r.left)/r.width*2-1)),y=Math.max(-1,Math.min(1,(point.y-r.top)/r.height*2-1));active.style.setProperty('--wx983-yaw',(x*2.5).toFixed(2)+'deg');active.style.setProperty('--wx983-pitch',(-y*1.7).toFixed(2)+'deg');active.style.setProperty('--wx983-x',(-x*5).toFixed(2)+'px');active.style.setProperty('--wx983-y',(-y*3).toFixed(2)+'px');});
},{passive:true});
document.addEventListener('pointerout',e=>{if(active&&!active.contains(e.relatedTarget)){reset(active);active=null;}},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(queued)cancelAnimationFrame(queued);queued=0;reset(active);active=null;}});
window.Build983={reduced};
})();
