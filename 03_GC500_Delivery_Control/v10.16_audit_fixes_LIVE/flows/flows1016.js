/* Author: Andrew Fisher. Shared-record links wait for their evidence; background maps keep the open reference's address. */
(function(root){
'use strict';
if(root.Routes1016)throw new Error('Shared route safeguards already installed');
let pending=null;
const hosted=()=>DATA.edition==='hosted'&&/^\/(?:v|e)\/[A-Za-z0-9_-]+/.test(location.pathname);
const ready=()=>!hosted()||!!SYNC.on&&SYNC.status==='live'&&Object.keys(SYNC_COLLS).every(k=>SYNC.first.has(k));
function assetKey(hash){try{const value=decodeURIComponent(String(hash||'').replace(/^#/,''));return value.startsWith('asset/')?value.slice(6):null;}catch(e){return null;}}
function clear(){pending=null;document.querySelector('[data-route1016-waiting]')?.remove();}
function notice(){
 if(!pending||location.hash!==pending.hash)return;
 const pane=document.getElementById('pane-'+state.tab);if(!pane)return;
 let box=pane.querySelector('[data-route1016-waiting]');
 if(!box){box=document.createElement('p');box.className='notice';box.dataset.route1016Waiting='';box.setAttribute('role','status');pane.prepend(box);}
 box.textContent='Opening '+pending.key+' — waiting for the current shared record.';
}
const routeBefore=route;
route=function(){
 const hash=location.hash,key=assetKey(hash);
 if(pending&&hash!==pending.hash)clear();
 // A missing item in the initial browser copy is not evidence of an invalid link.
 // Do not discard the requested address until every shared collection has arrived.
 if(key&&!ready()&&!allAssets().some(a=>a.key===key)&&!lighting894Context(key)){
  pending={hash,key};
  const wasRouting=routing;routing=true;
  try{go('plant');}finally{routing=wasRouting;}
  if(!(history.state&&typeof history.state.gc==='number'))try{history.replaceState({gc:0},'',location.href);}catch(e){}
  NAV.cur=hash;NAV.curGc=history.state?.gc||0;navBackShow();notice();return;
 }
 clear();return routeBefore.apply(this,arguments);
};
const hashBefore=setHash;
setHash=function(h,options){
 if(routing)return hashBefore.apply(this,arguments);
 const drawer=document.getElementById('drawer'),key=assetKey(location.hash);
 // Map renderers redraw after tiles, source files or shared records settle.
 // They must not create sheet history entries behind the reference being read.
 if(String(h).startsWith('sheet/')&&key&&key===state.sel&&drawer?.classList.contains('on'))return;
 if(pending&&'#'+h!==pending.hash)clear();
 return hashBefore.apply(this,arguments);
};
function settle(){
 if(!pending)return;
 if(location.hash!==pending.hash){clear();return;}
 if(!ready()){notice();return;}
 const requested=pending.hash;clear();
 if(location.hash===requested)route();
}
for(const name of ['drawn','update']){
 const before=root.GC500Refresh904[name];
 root.GC500Refresh904[name]=function(){const result=before.apply(this,arguments);settle();return result;};
}
root.Routes1016={ready,assetKey,pending:()=>pending&&{...pending}};
})(window);
