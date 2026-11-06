/* Author: Andrew Fisher. Keep open unit and transport forms through a shared-record redraw. */
(function(root){
'use strict';
const fields='input[name]:not([type="file"]):not([type="submit"]):not([type="button"]),textarea[name],select[name]';
const formSelector='[data-unit925-form],[data-transport1006-form]';
function formKey(form){return JSON.stringify([form.hasAttribute('data-transport1006-form')?'transport':'unit',form.dataset.ref||'',form.dataset.doc||'',form.dataset.source||'']);}
function fieldValue(field){return /^(checkbox|radio)$/.test(field.type)?field.checked:field.tagName==='SELECT'&&field.multiple?[...field.selectedOptions].map(o=>o.value):field.value;}
function fieldDefault(field){
 if(/^(checkbox|radio)$/.test(field.type))return field.defaultChecked;
 if(field.tagName==='SELECT'){const options=[...field.options],selected=options.filter(o=>o.defaultSelected);return field.multiple?selected.map(o=>o.value):(selected[0]||options[0])?.value||'';}
 return field.defaultValue;
}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function detailKey(detail){
 if(detail.id)return 'id:'+detail.id;
 for(const name of ['data-f816','data-ldsec','data-sfold','data-dphunit'])if(detail.hasAttribute(name))return name+':'+detail.getAttribute(name);
 const unit=detail.closest('[data-unit925-id]'),panel=detail.closest('[data-units925]');
 if(!panel)return '';
 const path=[];for(let el=detail;el&&el!==panel;el=el.parentElement)if(el.tagName==='DETAILS')path.unshift(el.querySelector(':scope > summary')?.textContent.replace(/\s+/g,' ').trim()||'');
 return JSON.stringify([panel.dataset.units925,unit?.dataset.unit925Id||'',path]);
}
function capture(drawer){
 if(!drawer?.classList.contains('on'))return null;
 const active=drawer.ownerDocument.activeElement,forms=[];
 for(const form of drawer.querySelectorAll(formSelector)){
  const dirty=[...form.querySelectorAll(fields)].filter(field=>!same(fieldValue(field),fieldDefault(field))).map(field=>({name:field.name,value:fieldValue(field)}));
  const focus=active&&form.contains(active)&&active.matches(fields)?{name:active.name,selection:typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null}:null;
  if(dirty.length||focus)forms.push({key:formKey(form),dirty,focus,expected:form.dataset.expected,sourceToken:form.dataset.sourceToken});
 }
 return {ref:typeof state==='undefined'?null:state.sel,forms,folds:[...drawer.querySelectorAll('details')].map(d=>[detailKey(d),d.open]).filter(([key])=>key),galleries:[...drawer.querySelectorAll('[data-unit925-id]')].map(card=>[card.dataset.unit925Id,card.querySelector('.item933-gallery')?.hidden]),top:drawer.scrollTop,bodyTop:drawer.querySelector('.db')?.scrollTop||0};
}
function restore(drawer,held){
 if(!held||!drawer?.classList.contains('on')||(typeof state!=='undefined'&&held.ref!==state.sel))return;
 const folds=new Map(held.folds),galleries=new Map(held.galleries);
 for(const detail of drawer.querySelectorAll('details')){const key=detailKey(detail);if(folds.has(key))detail.open=folds.get(key);}
 for(const card of drawer.querySelectorAll('[data-unit925-id]')){
  const hidden=galleries.get(card.dataset.unit925Id),gallery=card.querySelector('.item933-gallery');
  if(gallery&&typeof hidden==='boolean'){gallery.hidden=hidden;card.querySelectorAll('[data-item933-view]').forEach(button=>button.setAttribute('aria-expanded',String(!hidden)));}
 }
 const forms=[...drawer.querySelectorAll(formSelector)];
 for(const draft of held.forms){
  const form=forms.find(f=>formKey(f)===draft.key);if(!form)continue;
  const changed=form.dataset.expected!==draft.expected||form.dataset.sourceToken!==draft.sourceToken;
  for(const value of draft.dirty){
   const field=[...form.querySelectorAll(fields)].find(f=>f.name===value.name);if(!field)continue;
   if(/^(checkbox|radio)$/.test(field.type))field.checked=value.value;
   else if(field.tagName==='SELECT'&&field.multiple){for(const option of field.options)option.selected=value.value.includes(option.value);}
   else field.value=value.value;

  }
  if(draft.focus){const field=[...form.querySelectorAll(fields)].find(f=>f.name===draft.focus.name);if(field){field.focus({preventScroll:true});if(draft.focus.selection&&typeof field.setSelectionRange==='function')try{field.setSelectionRange(...draft.focus.selection);}catch(e){}}}
  // A remote change must still fail the native stale-write check. Never rebase a dirty draft silently.
  if(draft.dirty.length&&draft.expected!==undefined)form.dataset.expected=draft.expected;
  if(draft.dirty.length&&draft.sourceToken!==undefined)form.dataset.sourceToken=draft.sourceToken;
  if(draft.dirty.length&&changed){const result=form.querySelector('[data-unit925-result],[data-transport1006-result]');if(result)result.textContent=form.hasAttribute('data-transport1006-form')?'This charge changed elsewhere. Reopen it before saving.':'This item changed elsewhere. Reopen it before saving.';}
  else if(draft.dirty.length&&form.hasAttribute('data-transport1006-form')){const result=form.querySelector('[data-transport1006-result]');if(result)result.textContent='Unsaved changes';}
 }
 drawer.scrollTop=held.top;const body=drawer.querySelector('.db');if(body)body.scrollTop=held.bodyTop;
}
function refreshDrawer(){
 const held=capture(document.getElementById('drawer'));
 if(state.sel&&document.getElementById('drawer')?.classList.contains('on'))openAsset(state.sel,{keep:true});
 restore(document.getElementById('drawer'),held);
}
function redraw(){
 const held=capture(document.getElementById('drawer'));
 render();
 if(state.sel&&document.getElementById('drawer')?.classList.contains('on'))openAsset(state.sel,{keep:true});
 restore(document.getElementById('drawer'),held);
 if(root.GC500Refresh904)root.GC500Refresh904.drawn();
}
root.Idle1006={capture,restore,redraw,refreshDrawer};
})(window);
