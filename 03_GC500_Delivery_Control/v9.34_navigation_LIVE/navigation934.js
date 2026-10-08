/* Author: Andrew Fisher. Existing overlay exits, keyboard handling and return focus. */
(function(){
'use strict';
const selector='dialog,.drawer[role="dialog"],.pdf7[role="dialog"],#drv782,#flow891name,#ep819print,.printask';
const exits='[data-x83],[data-pdf7-x],[data-tw840-close],[data-tl841-close],[data-ep860-close],[data-ep819-x],[data-flow891-close],[data-pa="cancel"],#dclose,#lpClose,#cmClose,button.close,[data-x],.b-no';
const tracked=new Map();let opener=null,departing=false;
const visible=n=>!!n&&n.isConnected&&!n.hidden&&(!n.matches('dialog')||n.open)&&(!n.matches('.drawer')||n.classList.contains('on'))&&n.getClientRects().length>0;
function closeButton(n){return [...n.querySelectorAll(exits)].find(b=>!b.disabled&&!b.hidden)||null;}
function layers(){return [...document.querySelectorAll(selector)].filter(visible).sort((a,b)=>{
 const at=a.matches('dialog[open]'),bt=b.matches('dialog[open]');if(at!==bt)return at?1:-1;
 return (Number.parseInt(getComputedStyle(a).zIndex)||0)-(Number.parseInt(getComputedStyle(b).zIndex)||0);
});}
function top(){if(typeof SHOW!=='undefined'&&SHOW.open||typeof MACHINE!=='undefined'&&MACHINE.open)return null;return layers().at(-1)||null;}
function restore(n){const entry=tracked.get(n);if(!entry||departing)return;const active=document.activeElement;
 if(active&&active!==document.body&&active.isConnected&&!n.contains(active))return;
 const target=entry.opener;if(target&&target.isConnected&&target.getClientRects().length&&!target.closest('[hidden],[inert]'))target.focus({preventScroll:true});
 else document.querySelector('.pane.on')?.focus({preventScroll:true});
}
function dismiss(n){const b=closeButton(n);if(b){b.click();queueMicrotask(()=>restore(n));return true;}return false;}
function enhance(n){if(!n||!n.matches?.(selector))return;
 if(!tracked.has(n)){const active=document.activeElement,prior=active&&!n.contains(active)&&active!==document.body?active:opener;const watch=new MutationObserver(()=>enhance(n));watch.observe(n,{childList:true,attributes:true,attributeFilter:['open']});tracked.set(n,{opener:prior,watch});}
 const close=closeButton(n);if(!close||n.querySelector('[data-nav934-back]'))return;
 // Keep the existing Close control. The visible return uses that same native action.
 const back=document.createElement('button');back.type='button';back.className='btn nav934-back';back.setAttribute('data-ro','');back.dataset.nav934Back='';back.textContent='← Back';back.setAttribute('aria-label','Back to the previous view');
 close.before(back);
 if(n.id==='inv83'||n.id==='pdf7')back.focus({preventScroll:true});
}
function depart(tab){departing=true;try{for(const n of layers().reverse())if(n.id!=='drawer')dismiss(n);
 if(tab&&tab!=='map'){const full=document.querySelector('.mfull [data-mfull]');if(full)full.click();if(document.body.classList.contains('expfull-on')&&typeof expFullToggle==='function')expFullToggle(false);}
 }finally{departing=false;}}
function key(e){if(e.defaultPrevented)return;const n=top();if(!n)return;
 if(e.key==='Escape'){if(!closeButton(n))return;e.preventDefault();e.stopImmediatePropagation();dismiss(n);return;}
 if(e.key!=='Tab')return;const f=[...n.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(b=>!b.disabled&&!b.hidden&&b.getClientRects().length&&!b.closest('[hidden],[inert]'));
 if(!f.length)return;const i=f.indexOf(document.activeElement);if(i<0||e.shiftKey&&i===0||!e.shiftKey&&i===f.length-1){e.preventDefault();e.stopImmediatePropagation();(e.shiftKey?f.at(-1):f[0]).focus();}
}
// Window capture handles one upper layer before older document-level Escape handlers.
window.addEventListener('keydown',key,true);
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-nav934-back]');if(b){const n=b.closest(selector);if(n){e.preventDefault();e.stopImmediatePropagation();dismiss(n);}return;}
 const n=e.target.closest?.(selector);if(n&&e.target.closest(exits)){queueMicrotask(()=>restore(n));return;}
 const trigger=e.target.closest?.('button,a[href],summary,input,select');if(trigger)opener=trigger;
},true);
// Observe only body-level overlay insertion and each overlay's own replaced content.
const observer=new MutationObserver(records=>{for(const r of records){for(const n of r.addedNodes)if(n.nodeType===1)enhance(n);for(const n of r.removedNodes)if(tracked.has(n)){restore(n);tracked.get(n).watch.disconnect();tracked.delete(n);}}});
observer.observe(document.body,{childList:true});document.querySelectorAll(selector).forEach(enhance);
window.Navigation934={enhance,depart,layers,top};
})();
