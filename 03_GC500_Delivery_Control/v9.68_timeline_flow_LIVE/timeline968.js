/* Author: Andrew Fisher. Compact Timeline data; optional loading detail stays available. */
(function(root){
'use strict';
const choices968=new Map();
function remember968(pane){
 if(!pane)return;
 for(const box of pane.querySelectorAll('details[data-timeline968-more],details[data-timeline968-choice]'))choices968.set(choice968(box),box.open);
}
function choice968(box){return box.hasAttribute('data-timeline968-more')?'load:'+box.getAttribute('data-timeline968-more'):box.getAttribute('data-timeline968-choice');}
function sizes968(fact){
 const value=fact.querySelector('strong');
 return !!value&&/\b(?:mm|kg)\b/.test(value.textContent);
}
function compactLoading968(panel){
 if(panel.tagName!=='DETAILS'||panel.dataset.timeline968Ready)return;
 const doc=panel.ownerDocument,body=panel.querySelector(':scope > .r924-body');
 if(!body)return;
 const load=panel.getAttribute('data-r931-load'),products=[...body.querySelectorAll(':scope > .r931-product')];
 if(!load||!products.length)return;
 const box=doc.createElement('section');
 for(const a of panel.attributes)if(a.name!=='open')box.setAttribute(a.name,a.value);
 box.classList.add('timeline968-loading');box.dataset.timeline968Ready='1';
 const title=doc.createElement('b');title.textContent='Sizes & weights';box.append(title);
 const more=doc.createElement('details');more.className='r931-history';more.setAttribute('data-timeline968-more',load);
 const summary=doc.createElement('summary');summary.textContent='More info';more.append(summary);
 for(const product of products){
  const notes=doc.createElement('section');notes.className='r931-product';
  const heading=product.querySelector(':scope > b');
  if(products.length>1&&heading)notes.append(heading.cloneNode(true));
  let method=false;
  for(const child of [...product.children]){
   if(child.tagName==='P'&&child.querySelector(':scope > b')?.textContent.trim()==='Loading')method=true;
   if(method){notes.append(child);continue;}
   if(!child.classList.contains('r931-fact'))continue;
   if(!sizes968(child)){notes.append(child);continue;}
   const sources=[...child.children].filter(n=>n.tagName!=='SPAN'&&n.tagName!=='STRONG');
   if(sources.length){
    const source=doc.createElement('p');source.className='hint';
    const label=child.querySelector('span');if(label)source.append(label.cloneNode(true),doc.createTextNode(' · '));
    sources.forEach((n,i)=>{if(i)source.append(doc.createTextNode(' · '));source.append(n);});notes.append(source);
   }
  }
  if(notes.children.length)more.append(notes);
 }
 for(const child of [...body.children])if(!child.classList.contains('r931-product'))more.append(child);
 box.append(body,more);more.open=choices968.get('load:'+load)===true;panel.replaceWith(box);
}
function foldControls968(pane){
 for(const box of pane.querySelectorAll('.timeline968-loading')){
  const parent=box.parentElement,more=box.querySelector(':scope > [data-timeline968-more]');
  if(!parent?.classList.contains('timeline908-plans')||!more)continue;
  const controls=[...parent.children].filter(n=>n.tagName==='DETAILS');
  if(!controls.length)continue;
  const group=pane.ownerDocument.createElement('div');group.className='timeline908-plans';group.setAttribute('role','group');group.setAttribute('aria-label','Load planning');group.dataset.timeline968Controls='';
  controls.forEach((control,i)=>{
   const key='control:'+JSON.stringify([box.getAttribute('data-r931-load'),i]);
   control.setAttribute('data-timeline968-choice',key);control.open=choices968.get(key)===true;group.append(control);
  });
  more.querySelector('summary').after(group);
 }
}
function compactCapability968(scope){
 if(!scope)return;
 for(const chip of scope.querySelectorAll('.pane > .rochip')){
  if(chip.querySelector('details[data-timeline968-choice]'))continue;
  const span=chip.querySelector(':scope > span'),label=span?.querySelector('b');if(!span||!label)continue;
  const doc=chip.ownerDocument,box=doc.createElement('div');for(const a of chip.attributes)box.setAttribute(a.name,a.value);
  const key='capability:'+chip.parentElement.id+':'+(chip.classList.contains('unknown')?'unknown':'view');
  const more=doc.createElement('details');more.setAttribute('data-timeline968-choice',key);
  const summary=doc.createElement('summary');label.textContent=label.textContent.replace(/\.$/,'');summary.append(label,doc.createTextNode(' · More info'));
  const words=doc.createElement('div');while(span.firstChild)words.append(span.firstChild);
  more.append(summary,words);more.open=choices968.get(key)===true;
  const dot=chip.querySelector(':scope > i');if(dot)box.append(dot);box.append(more);chip.replaceWith(box);
 }
}
function groupDays968(pane){
 const prev=pane.querySelector('[data-day-step="-1"]'),next=pane.querySelector('[data-day-step="1"]');
 if(!prev||!next||prev.parentElement!==next.parentElement||prev.closest('[data-timeline968-days]'))return;
 const nav=prev.parentElement,day=prev.nextElementSibling;
 if(!day?.matches('button[data-day]')||day.nextElementSibling!==next)return;
 const group=pane.ownerDocument.createElement('span');group.className='timeline968-days';group.setAttribute('data-timeline968-days','');group.setAttribute('role','group');group.setAttribute('aria-label','Change programme day');
 nav.insertBefore(group,prev);group.append(prev,day,next);
 const spacer=group.previousElementSibling;
 if(spacer?.tagName==='SPAN'&&!spacer.textContent.trim()&&spacer.style.flex==='1 1 0%')spacer.remove();
}
function apply968(pane){
 if(!pane)return;
 for(const panel of pane.querySelectorAll('details[data-r931-load]'))compactLoading968(panel);
 foldControls968(pane);
 groupDays968(pane);
}
const API={remember:remember968,apply:apply968,compact:compactLoading968,sizes:sizes968,capability:compactCapability968};
root.TimelineFlow968=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const before968=renderTimeline;
renderTimeline=function(){remember968(document.getElementById('pane-timeline'));const value=before968.apply(this,arguments);apply968(document.getElementById('pane-timeline'));return value;};
const capabilityBefore968=applyCapability;
applyCapability=function(){remember968(document);const value=capabilityBefore968.apply(this,arguments);compactCapability968(document);return value;};
document.addEventListener('toggle',event=>{
 const box=event.target;
 if(box?.matches?.('details[data-timeline968-more],details[data-timeline968-choice]')&&box.isConnected)choices968.set(choice968(box),box.open);
},true);
apply968(document.getElementById('pane-timeline'));
compactCapability968(document);
})(typeof window!=='undefined'?window:globalThis);
