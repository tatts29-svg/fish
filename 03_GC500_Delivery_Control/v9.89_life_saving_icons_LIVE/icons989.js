/* Author: Andrew Fisher. Original Coates linework, transparent spaces and one shared icon renderer. */
(function(root){'use strict';
const art=__RULE_ART_989__;
const normal=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases={
 'risk assessment':'assess-risk','assess risk':'assess-risk','asset risk':'assess-risk',
 'training and competency':'competency','competency':'competency','fit for work':'fit-for-work',
 'isolation':'isolation','leadership':'leadership','load restraint':'load-restraint','load restraints':'load-restraint',
 'load unload':'load-unload','load upload':'load-unload','loading unloading':'load-unload',
 'manual handling':'manual-handling','vehicles':'vehicles','working at height':'working-at-height'
};
let serial=0,buildPlaying=false,printing=false,suspended=false;
const tracked=new Map();
function key(title){const value=normal(title);return aliases[value]||(Object.hasOwn(art,String(title))?String(title):'general-rule');}
function svg(id,kind,layer){
 const a=art[kind],cls='ls989-svg ls989-'+layer;
 if(!a)return '<svg class="'+cls+'" viewBox="0 0 104 104" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M52 10 87 23v27c0 21-18 34-35 44C35 84 17 71 17 50V23Z"/><path d="m34 50 12 12 25-27"/></svg>';
 const k=255/(255-a.threshold),bias=-a.threshold/(255-a.threshold),filter='ls989-'+id;
 // sRGB is explicit: this removes the original flat colour rather than masking its opaque disc.
 const matrix='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 '+k+' 0 '+bias;
 return '<svg class="'+cls+'" viewBox="0 0 '+a.width+' '+a.height+'" aria-hidden="true" focusable="false" fill="none"><defs><filter id="'+filter+'" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="'+matrix+'" result="linework"/><feComposite in="linework" in2="SourceGraphic" operator="in" result="outline"/><feFlood flood-color="currentColor" result="orange"/><feComposite in="orange" in2="outline" operator="in"/></filter></defs><image width="'+a.width+'" height="'+a.height+'" href="'+a.data+'" filter="url(#'+filter+')"/></svg>';
}
function html(title,options){const kind=key(title),id=++serial,still=!!options?.static;return '<span class="ls989-icon" data-rule989-key="'+kind+'" data-rule989-static="'+still+'" aria-hidden="true">'+(!still?svg(id+'a',kind,'aura'):'')+svg(id+'c',kind,'core')+'</span>';}
function allowed(){return !printing&&!suspended&&!document.hidden&&document.documentElement.dataset.motion!=='off'&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
function sync(){const play=allowed();for(const [el,visible] of tracked){if(!el.isConnected){observer?.unobserve(el);tracked.delete(el);continue;}el.dataset.rule989Playing=String(play&&visible&&(!el.closest('#pane-timeline')||buildPlaying));}}
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const entry of entries)tracked.set(entry.target,entry.isIntersecting&&entry.intersectionRatio>.05);sync();},{threshold:[0,.05]}):null;
function enroll(node){if(node.nodeType!==1)return;const list=[];if(node.matches('[data-rule989-key]'))list.push(node);list.push(...node.querySelectorAll('[data-rule989-key]'));for(const el of list){if(el.dataset.rule989Static==='true'||el.closest('.bc984-day')||tracked.has(el))continue;tracked.set(el,false);observer?.observe(el);}}
const mutation=typeof MutationObserver==='function'?new MutationObserver(records=>{let removed=false;for(const r of records){for(const n of r.addedNodes)enroll(n);if([...r.removedNodes].some(n=>n.nodeType===1))removed=true;}if(removed)sync();}):null;
function start(){if(document.body){enroll(document.body);mutation?.observe(document.body,{childList:true,subtree:true});}}
document.addEventListener('visibilitychange',sync);document.addEventListener('gc500motionchange',sync);
root.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener('change',sync);
root.addEventListener('beforeprint',()=>{printing=true;sync();});root.addEventListener('afterprint',()=>{printing=false;sync();});
root.addEventListener('pagehide',()=>{suspended=true;sync();});root.addEventListener('pageshow',()=>{suspended=false;sync();});
root.RuleIcons989={key,html,setBuildPlaying(value){buildPlaying=!!value;sync();},sync,report:()=>({tracked:tracked.size,playing:[...tracked.keys()].filter(el=>el.dataset.rule989Playing==='true').length})};
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})(window);
