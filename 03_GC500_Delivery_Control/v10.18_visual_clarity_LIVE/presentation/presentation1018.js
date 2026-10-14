/* Author: Andrew Fisher. One bounded interaction halo; no changes to records or control behaviour. */
(function(root){
'use strict';
const selector='button,a[href],summary,[role="button"],[role="tab"],input:not([type="hidden"]):not([type="file"]),select,textarea,.mk,.hubcard,.day';
const selected='[aria-pressed="true"],[aria-selected="true"],[aria-current="page"],.picked,.day.on';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let halo=null,animation=null,observer=null,timer=0,frame=0,active=null,lastPointer=null;
function clear(){
 clearTimeout(timer);timer=0;if(frame){cancelAnimationFrame(frame);frame=0;}
 if(observer){observer.disconnect();observer=null;}
 if(animation){animation.cancel();animation=null;}if(halo)halo.remove();halo=null;active=null;
}
function quiet(){return reduced.matches||document.documentElement.dataset.motion==='off'||typeof motionOff==='function'&&motionOff();}
function control(node){
 if(!(node instanceof Element))return null;
 let el=node.closest(selector),label=node.closest('label');
 if(!el&&label?.control)el=label.control;
 if(!el||el.disabled||el.closest('[inert],[aria-disabled="true"]'))return null;
 if(el.matches('input[type="checkbox"],input[type="radio"]')){
  const box=el.getBoundingClientRect();if(!box.width||!box.height)el=label||el.labels?.[0]||el;
 }
 return el;
}
function isSelected(el){return el.matches(selected)||el.matches('input:checked')||el.matches('summary')&&el.parentElement?.open||el.matches('select')&&el.selectedIndex>=0||el.matches('label')&&!!el.control?.checked;}
function show(el,chosen=false){
 clear();if(!el?.isConnected||document.hidden)return false;
 const r=el.getBoundingClientRect(),w=document.documentElement.clientWidth,h=innerHeight;
 if(r.width<2||r.height<2||r.bottom<=0||r.right<=0||r.top>=h||r.left>=w||getComputedStyle(el).visibility==='hidden')return false;
 // One independent layer preserves the target's own transform, shadow and animation.
 halo=document.createElement('div');halo.id='interaction-halo1018';halo.setAttribute('aria-hidden','true');
 halo.dataset.kind=chosen?'selected':'tap';
 const cs=getComputedStyle(el),host=el.closest('dialog[open]')||document.body;
 const box={left:Math.max(2,r.left-2),top:Math.max(2,r.top-2),width:Math.min(w-2,r.right+2)-Math.max(2,r.left-2),height:Math.min(h-2,r.bottom+2)-Math.max(2,r.top-2)};
 // Native dialogs occupy the top layer. Put feedback in the same layer, with
 // coordinates relative to the dialog's padding box, including its scroll.
 if(host!==document.body){const hr=host.getBoundingClientRect(),sx=hr.width/host.offsetWidth||1,sy=hr.height/host.offsetHeight||1;halo.style.position='absolute';box.left=(box.left-hr.left)/sx+host.scrollLeft-host.clientLeft;box.top=(box.top-hr.top)/sy+host.scrollTop-host.clientTop;box.width/=sx;box.height/=sy;}
 Object.assign(halo.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',borderRadius:cs.borderRadius==='0px'?'6px':cs.borderRadius});
 host.appendChild(halo);active=el;
 if(typeof IntersectionObserver==='function'){observer=new IntersectionObserver(entries=>{if(entries.some(entry=>!entry.isIntersecting))clear();});observer.observe(el);}
 const still=quiet(),duration=still?220:chosen?900:420;
 if(!still&&typeof halo.animate==='function')animation=halo.animate(chosen?[{opacity:.4},{opacity:1,offset:.32},{opacity:.45,offset:.65},{opacity:0}]:[{opacity:.9},{opacity:1,offset:.2},{opacity:0}],{duration,easing:'ease-out'});
 timer=setTimeout(clear,duration);return true;
}
function modified(e){return e.ctrlKey||e.metaKey||e.altKey||e.shiftKey;}
document.addEventListener('pointerdown',e=>{if(e.button!==0||modified(e))return;const el=control(e.target);lastPointer=el;if(el)show(el,false);},{capture:true,passive:true});
document.addEventListener('click',e=>{
 if(modified(e)||e.button!==0)return;const el=control(e.target);if(!el)return;
 // Read the final selected state after the native click handler, including Save/Back.
 if(frame)cancelAnimationFrame(frame);
 frame=requestAnimationFrame(()=>{frame=0;if(!el.isConnected){clear();return;}if(isSelected(el))show(el,true);else if(e.detail===0||el!==lastPointer)show(el,false);});
},{capture:true,passive:true});
document.addEventListener('change',e=>{const el=control(e.target);if(el?.matches('select,input[type=checkbox],input[type=radio]'))show(el,isSelected(el));},{passive:true});
document.addEventListener('pointercancel',clear,{passive:true});
document.addEventListener('scroll',clear,{capture:true,passive:true});
root.addEventListener('resize',clear,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
root.addEventListener('pagehide',clear);
root.addEventListener('beforeprint',clear);
reduced.addEventListener?.('change',clear);
new MutationObserver(clear).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
root.VisualClarity1018={show,clear,control,report:()=>({active:!!halo,kind:halo?.dataset.kind||null,moving:!!animation,quiet:!!quiet(),targetConnected:!!active?.isConnected})};
})(window);
