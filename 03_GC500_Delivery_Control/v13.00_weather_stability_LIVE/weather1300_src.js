/* Author: Andrew Fisher. Preserve unchanged weather artwork through native Demob redraws. */
(function(root){
'use strict';
const selectors=['.bc984-card>.wm-card-scene','.bc984-card>.bc984-weather-foreground','.bc984-card>.bc984-rain-sheet','.bc984-card>.bc984-sun-rays','.bc984-card>.bc984-cloud-veil','.bc984-weather-reading'];
function create(env={}){
 const keys=new WeakMap(),now=env.now||(()=>performance.now());let saved=new Map(),pending=[];
 const totals={captured:0,reused:0,changed:0,phases:0};
 const animations=env.animations||(node=>typeof node.getAnimations==='function'?node.getAnimations({subtree:true}):[]);
 const signature=weather=>JSON.stringify(weather);
 function remember(card,weather){keys.set(card,signature(weather));}
 function capture(cards){
  saved=new Map();pending=[];
  for(const card of cards){
   const key=keys.get(card),date=card.dataset.dday816;if(!key||!date)continue;
   const parts=selectors.map(selector=>({selector,node:card.querySelector(selector)})).filter(p=>p.node),phases=[],seen=new Set();
   for(const part of parts)for(const a of animations(part.node)){
    if(seen.has(a)||!a.effect?.target||!Number.isFinite(a.currentTime))continue;seen.add(a);
    phases.push({target:a.effect.target,name:a.animationName||'',pseudo:a.effect.pseudoElement||'',time:a.currentTime,rate:a.playbackRate,running:a.playState==='running'});
   }
   saved.set(date,{key,parts,phases,at:now()});totals.captured++;
  }
 }
 function restore(card,weather){
  const item=saved.get(card.dataset.dday816);if(!item)return false;saved.delete(card.dataset.dday816);
  if(item.key!==signature(weather)){totals.changed++;return false;}
  const replacements=item.parts.map(p=>({...p,next:card.querySelector(p.selector)}));
  if(replacements.some(p=>!p.next)||selectors.filter(s=>card.querySelector(s)).length!==replacements.length)return false;
  for(const p of replacements)p.next.replaceWith(p.node);
  pending.push({item,parts:replacements});totals.reused++;return true;
 }
 function finish(){
  const phaseWrites=[];
  // Detaching a card can cancel its CSS animations. Restore phase on the current
  // animation objects only after all card DOM changes. Batch reads before writes
  // so each card cannot force another intermediate layout. CSS owns play/pause.
  for(const {item,parts} of pending){
   const elapsed=Math.max(0,now()-item.at),seen=new Set();
   for(const part of parts)for(const a of animations(part.node)){
    if(seen.has(a))continue;seen.add(a);
    const old=item.phases.find(p=>p.target===a.effect?.target&&p.name===(a.animationName||'')&&p.pseudo===(a.effect?.pseudoElement||''));
    if(old)phaseWrites.push({a,rate:old.rate,time:old.time+(old.running?elapsed*old.rate:0)});
   }
  }
  for(const {a,rate,time}of phaseWrites)try{if(a.playbackRate!==rate)a.playbackRate=rate;if(a.currentTime!==time)a.currentTime=time;totals.phases++;}catch(_){}
  pending=[];
 }
 function release(){saved.clear();pending=[];}
 return Object.freeze({remember,capture,restore,finish,release,report:()=>({...totals,pending:saved.size+pending.length})});
}
const api=Object.freeze({version:'v13.00',create});
if(typeof module==='object'&&module.exports)module.exports=api;else root.WeatherReuse1300=api;
})(typeof window==='object'?window:globalThis);
