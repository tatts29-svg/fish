/* Author: Andrew Fisher. Keep the surface being read through background record refreshes.
 * DOM state is held only for one synchronous refresh; it cannot reopen a closed surface later.
 * New record values still render. Only unsubmitted editable fields retain their local draft.
 */
(function(root){
'use strict';
const fieldSelector='input:not([type="file"]):not([type="hidden"]):not([type="button"]):not([type="submit"]),textarea,select';
const stableAttributes=['data-ref','data-key','data-item','data-unit925-id','data-units925','data-charges952','data-f816','data-ldsec','data-sfold','data-dphunit','data-day','data-iso','data-profile1006-item','data-photo935','data-r931-ref'];
const normal=s=>String(s||'').replace(/\$[\d,.]+/g,'$#').replace(/\b\d+(?:[.,]\d+)*\b/g,'#').replace(/\s+/g,' ').trim();
function segment(el){
 if(el.id)return '#'+el.id;
 const attrs=stableAttributes.filter(a=>el.hasAttribute(a)).map(a=>[a,el.getAttribute(a)]);
 if(attrs.length)return JSON.stringify([el.tagName,attrs]);
 if(el.tagName==='DETAILS')return 'details:'+normal(el.querySelector(':scope > summary')?.textContent);
 if(el.matches('input,textarea,select'))return JSON.stringify([el.tagName,el.name||'',el.type||'',el.getAttribute('aria-label')||'']);
 // A table wrapper gains tabindex/aria-label in a later accessibility frame.
 // Those transient decorations must not change identities below that wrapper.
 if(el.matches('button,a,summary'))return JSON.stringify([el.tagName,el.getAttribute('aria-label')||normal(el.textContent)]);
 return el.tagName+':'+[...el.classList].filter(c=>!['on','active','open','arrive','selected','viewonly'].includes(c)).sort().join('.');
}
function key(el,scope){
 const path=[];let at=el;
 while(at&&at!==scope){const part=segment(at);if(part)path.unshift(part);at=at.parentElement;}
 return JSON.stringify(path);
}
function index(scope,selector){
 const counts=new Map();return [...scope.querySelectorAll(selector)].map(el=>{const base=key(el,scope),n=counts.get(base)||0;counts.set(base,n+1);return [base+'|'+n,el];});
}
function value(el){return /^(checkbox|radio)$/.test(el.type)?el.checked:el.tagName==='SELECT'&&el.multiple?[...el.selectedOptions].map(o=>o.value):el.value;}
function initial(el){
 if(/^(checkbox|radio)$/.test(el.type))return el.defaultChecked;
 if(el.tagName==='SELECT'){const options=[...el.options],chosen=options.filter(o=>o.defaultSelected);return el.multiple?chosen.map(o=>o.value):(chosen[0]||options[0])?.value||'';}
 return el.defaultValue;
}
function setValue(el,v){
 if(/^(checkbox|radio)$/.test(el.type))el.checked=v;
 else if(el.tagName==='SELECT'&&el.multiple){for(const o of el.options)o.selected=v.includes(o.value);}
 else el.value=v;
}
function capture(scope,drafts){
 if(!scope)return null;
 const active=scope.ownerDocument.activeElement;
 const fields=index(scope,fieldSelector),focus=active&&scope.contains(active)?key(active,scope):null;
 const held={scope,folds:index(scope,'details').map(([k,el])=>[k,el.open]),scroll:[],fields:[],files:[],focus,active,selection:null,main:scope.closest('main')};
 if(held.main){held.mainTop=held.main.scrollTop;held.mainLeft=held.main.scrollLeft;}
 held.documentScroll=scope.ownerDocument.scrollingElement;if(held.documentScroll){held.documentTop=held.documentScroll.scrollTop;held.documentLeft=held.documentScroll.scrollLeft;}
 // Read only actual scrollers; an empty offset needs no layout measurement.
 for(const el of [scope,...scope.querySelectorAll('*')])if(el.scrollTop||el.scrollLeft)held.scroll.push({el,key:key(el,scope),top:el.scrollTop,left:el.scrollLeft});
 for(const [k,el] of fields){
  if(el===active&&typeof el.selectionStart==='number')held.selection=[el.selectionStart,el.selectionEnd];
  if(!drafts||el.disabled||el.readOnly||el.closest('[data-unit925-form],[data-transport1006-form]'))continue;
  const v=value(el);if(JSON.stringify(v)!==JSON.stringify(initial(el)))held.fields.push([k,v]);
 }
 if(drafts)for(const [k,el] of index(scope,'input[type="file"]'))if(el.files?.length&&!el.disabled)held.files.push([k,el.files]);
 return held;
}
function restore(scope,held,drafts){
 if(!scope||!held||scope!==held.scope||!scope.isConnected)return;
 const folds=new Map(held.folds);
 for(const [k,el] of index(scope,'details'))if(folds.has(k))el.open=folds.get(k);
 if(drafts){const fields=new Map(held.fields);for(const [k,el] of index(scope,fieldSelector))if(fields.has(k)&&!el.disabled&&!el.readOnly)setValue(el,fields.get(k));}
 if(drafts){const files=new Map(held.files);for(const [k,el] of index(scope,'input[type="file"]'))if(files.has(k)&&!el.disabled)try{el.files=files.get(k);}catch(e){}}
 // A field or summary with no HTML id can still keep keyboard focus after rebuilding.
 if(held.active&&!held.active.isConnected&&held.focus){
  const candidates=[...scope.querySelectorAll('input,textarea,select,button,a,summary,[tabindex]')];
  const match=candidates.find(el=>key(el,scope)===held.focus&&el.tagName===held.active.tagName);
  if(match){try{match.focus({preventScroll:true});if(held.selection&&typeof match.setSelectionRange==='function')match.setSelectionRange(...held.selection);}catch(e){}}
 }
 if(held.main&&held.main.isConnected){held.main.scrollTop=held.mainTop;held.main.scrollLeft=held.mainLeft;}
 for(const pos of held.scroll){const el=pos.el.isConnected?pos.el:pos.el===held.scope?scope:[...scope.querySelectorAll('*')].find(el=>key(el,scope)===pos.key);if(el){el.scrollTop=pos.top;el.scrollLeft=pos.left;}}
 if(held.documentScroll?.isConnected){held.documentScroll.scrollTop=held.documentTop;held.documentScroll.scrollLeft=held.documentLeft;}
}
function openSurfaces(excluded){
 const nodes=[...document.querySelectorAll('dialog[open],.drawer.on,[role="dialog"][aria-modal="true"]')].filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&(!el.matches('dialog')||el.open)&&!excluded.some(root=>root?.contains(el))&&el.getClientRects().length);
 return nodes.filter(el=>!nodes.some(parent=>parent!==el&&parent.contains(el)));
}
let drawing=false,drawerView=null,intent=0;
// A queued native layout correction must yield to the user's next action.
for(const type of ['pointerdown','touchstart','wheel','keydown'])document.addEventListener(type,()=>{intent++;},{capture:true,passive:true});
function background(fn,args,self){
 if(drawing)return fn.apply(self,args);
 const tab=state.tab,ref=state.sel,drawer=document.getElementById('drawer'),opened=!!drawer?.classList.contains('on');
 const pane=document.getElementById('pane-'+tab),page=capture(pane,true),item=opened?capture(drawer,true):null,other=openSurfaces([pane,opened?drawer:null]).map(el=>[el,capture(el,true)]);
 drawing=true;
 try{return fn.apply(self,args);}
 finally{
  drawing=false;
  if(state.tab===tab)restore(pane,page,true);
  if(opened&&state.sel===ref&&drawer.classList.contains('on'))restore(drawer,item,true);
  if(state.tab===tab)for(const [el,held] of other)restore(el,held,true);
 }
}
// Native local Save redraws the page too. Keep its disclosures and reading position,
// but never copy old form values back over the successfully saved record.
const bumpBefore=bump;
bump=function(){
 const tab=state.tab,pane=document.getElementById('pane-'+tab),held=capture(pane,false),other=openSurfaces([pane]).map(el=>[el,capture(el,false)]);
 try{return bumpBefore.apply(this,arguments);}
 finally{if(state.tab===tab){restore(pane,held,false);for(const [el,view] of other)restore(el,view,false);}}
};
Object.assign(bump,bumpBefore);
const idle=root.Idle1006;
if(idle){for(const name of ['redraw','refreshDrawer']){const before=idle[name];idle[name]=function(){return background(before,arguments,this);};}}
// Reports, file previews and local saved changes also refresh the same drawer.
// Keep disclosures there, but do not put a submitted draft back after a successful Save.
const beforeOpen=openAsset_held;
openAsset_held=function(ref,opts){
 const drawer=document.getElementById('drawer'),keep=opts?.keep&&state.sel===ref&&drawer?.classList.contains('on');
 const previous=drawerView,held=keep?capture(drawer,false):null;
 drawerView=held;
 try{return beforeOpen.apply(this,arguments);}
 finally{if(keep&&state.sel===ref&&drawer.classList.contains('on'))restore(drawer,held,false);drawerView=previous;}
};
// Native focus anchoring needs the full open layout, otherwise its next-frame
// correction remembers a scroll position clamped to collapsed sections.
const restoreDrawerBefore=openAssetRestore;
openAssetRestore=function(held){
 const drawer=document.getElementById('drawer');
 if(drawerView&&drawer?.classList.contains('on'))restore(drawer,drawerView,false);
 return restoreDrawerBefore.apply(this,arguments);
};
root.Persistence1010={capture,restore,key,get intent(){return intent;}};
})(window);
