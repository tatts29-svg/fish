/* Author: Andrew Fisher. Supporting text stays under the existing More info component. */
(function(root){
'use strict';
const PANES=new Set(['pane-today','pane-plant','pane-subhired','pane-timeline','pane-about','drawer']);
const SUPPORT='p.sub,p.hint,p.maphint,p.fine,p.mnote,p.src,p.pnote,p.story,p.about';
const PROTECT='nav,[role="navigation"],table,form,.form,.kpis,.daystrip,summary,label,.acts,.hubbig,.money,.mtot,.notice.crit,.crit,.todo,.notice.warn,.warn,[role="alert"],.r931-fact,.r924-fact,.fact,.stats,.metric,.kpi,.unit925-facts';
function words(n){return(n.textContent||'').replace(/\s+/g,' ').trim();}
function isSupporting(node,scope){
 if(!node||node.closest('details,'+PROTECT)||node.querySelector('input,select,textarea,button,a.btn,a[role="button"],[contenteditable],canvas,svg,video,audio'))return false;
 if(node.querySelector('strong,b')&&/\d/.test(words(node)))return false;
 const text=words(node);if(text.length<70)return false;
 // Explanatory labels explicitly named in existing components, plus the prose-only About card.
 return node.matches(SUPPORT)||scope.id==='pane-about'&&node.tagName==='P'&&text.split(' ').length>=14;
}
function token(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0).toString(36);}
function compact(scope){
 if(!scope||!PANES.has(scope.id))return 0;
 const candidates=[...scope.querySelectorAll(SUPPORT+(scope.id==='pane-about'?',.card > p':''))].filter(n=>isSupporting(n,scope));
 let moved=0;
 for(const node of candidates){
  const host=node.closest('.card,.dsn.grp,.mcard,.hubcard,.clocard,.dcard,.hubhead')||node.parentElement;
  if(!host||host.closest('details'))continue;
  let fold=host.querySelector(':scope > details.sfold.more,:scope > details[data-prose976]');
  if(!fold){
   const doc=node.ownerDocument;fold=doc.createElement('details');fold.className='sfold more';fold.dataset.prose976='';
   const heading=host.querySelector('h2,h3,h4,.hubtitle');
   fold.dataset.sfold='prose976|'+scope.id+'|'+token((heading?.textContent||'')+'|'+words(node));
   fold.open=typeof SFOLD_OPEN!=='undefined'&&SFOLD_OPEN.has(fold.dataset.sfold);
   const summary=doc.createElement('summary');summary.textContent='More info';
   const body=doc.createElement('div');body.className='sfoldbody';fold.append(summary,body);host.append(fold);
  }
  const body=fold.querySelector(':scope > .sfoldbody')||fold;body.append(node);moved++;
 }
 return moved;
}
const API={compact,isSupporting};root.Prose976=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const before=foldStories;foldStories=function(scope){const out=before.apply(this,arguments);compact(scope);return out;};
for(const name of ['renderToday','renderPlant','renderTimeline','renderSubhired932','renderAbout','openAssetDraw']){
 const previous=root[name];if(typeof previous!=='function')continue;
 const id={renderToday:'pane-today',renderPlant:'pane-plant',renderTimeline:'pane-timeline',renderSubhired932:'pane-subhired',renderAbout:'pane-about',openAssetDraw:'drawer'}[name];
 root[name]=function(){const out=previous.apply(this,arguments);compact(document.getElementById(id));return out;};
}
document.addEventListener('click',event=>{if(event.target.closest?.('[data-supplier932-company]'))queueMicrotask(()=>compact(document.getElementById('pane-subhired')));});
document.addEventListener('change',event=>{if(event.target.matches?.('[data-unit925-company]'))queueMicrotask(()=>compact(document.getElementById('pane-subhired')));});
})(typeof window!=='undefined'?window:globalThis);
