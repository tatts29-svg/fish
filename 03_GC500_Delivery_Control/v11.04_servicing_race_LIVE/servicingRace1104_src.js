/* Author: Andrew Fisher. Presentation lifecycle only; no tracker or record writes. */
(function(W){
'use strict';
function pane(){return document.getElementById('pane-servicing');}
function pause(){var p=pane();if(p)p.classList.toggle('svc1104-paused',document.hidden);}
function decorate(){
  pause();var p=pane(),map=p&&p.querySelector('.svc1099'),heading=map&&map.querySelector('.svc1099-heading');
  if(!heading)return;var title=heading.querySelector('h3');if(title&&title.textContent!=='GC500 · Servicing')title.textContent='GC500 · Servicing';
  if(!document.fullscreenEnabled||typeof p.requestFullscreen!=='function')return;
  var b=heading.querySelector('.svc1104-screen');
  if(!b){b=document.createElement('button');b.type='button';b.className='svc1104-screen';b.setAttribute('data-ro','');heading.appendChild(b);b.addEventListener('click',async function(){
    b.disabled=true;
    try{if(document.fullscreenElement===p)await document.exitFullscreen();else await p.requestFullscreen();}
    catch(e){b.title='Use the browser fullscreen control if this device does not support it.';}
    finally{b.disabled=false;decorate();if(b.isConnected)b.focus({preventScroll:true});}
  });}
  var active=document.fullscreenElement===p,label=active?'Exit big screen':'Big screen';if(b.textContent!==label)b.textContent=label;if(b.getAttribute('aria-pressed')!==String(active))b.setAttribute('aria-pressed',String(active));
}
if(W.SvcMap1099&&typeof W.SvcMap1099.update==='function'){
  var prior=W.SvcMap1099.update;W.SvcMap1099.update=function(){var out=prior.apply(this,arguments);decorate();return out;};
}
document.addEventListener('visibilitychange',pause);document.addEventListener('fullscreenchange',decorate);W.addEventListener('pageshow',decorate);decorate();
})(window);
