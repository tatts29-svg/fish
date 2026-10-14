/* Author: Andrew Fisher. Loading and unloading drafts require explicit Save. */
(function(root){
'use strict';
const doorValues=['','driver','passenger','na'];
const handlingValues=['','forklift','tilt-tray','crane-truck','franna','onsite-crane','not-required','none','to-confirm'];
const keyOf=s=>JSON.stringify([s.kind,s.ref,s.unit||'']);
function status(attempt,env){
 if(!attempt)return {state:'none',text:''};
 if(attempt.error)return {state:'error',text:attempt.error};
 if(attempt.kept===false)return {state:'error',text:'Not saved · keep this page open'};
 if(attempt.kept!==true)return {state:'pending',text:'Saving…'};
 if(!attempt.expected||attempt.expected!==env.current)return {state:'changed',text:'Record changed · review before saving'};
 if(env.on&&attempt.expected===env.last&&!env.queued&&!env.inflight)return {state:'shared',text:'SAVED · shared record updated'};
 if(env.readonly)return {state:'offline',text:'Saved on this device · shared record is view only'};
 if(!env.on||env.connection!=='live')return {state:'offline',text:'Saved on this device · waiting to sync'};
 return {state:'pending',text:'Saved on this device · syncing…'};
}
function createController(env){
 const drafts=new Map();
 function stage(spec,value,base){
  if(!(spec.kind==='door'?doorValues:handlingValues).includes(value))return false;
  const model=env.model(spec),old=drafts.get(keyOf(spec));
  if(!model.valid||!model.can)return false;
  drafts.set(keyOf(spec),{value,base:old?.dirty?old.base:(base??model.base),dirty:true});return true;
 }
 function feedback(spec){
  const model=env.model(spec),entry=drafts.get(keyOf(spec));
  if(!entry)return {state:'none',text:''};
  if(!model.valid)return {state:'changed',text:'This item changed · reopen its current details'};
  if(entry.dirty&&entry.base!==model.base)return {state:'changed',text:'Selection changed elsewhere · reload before saving'};
  if(entry.error)return {state:'error',text:entry.error};
  if(entry.attempt?.kept===false)return status(entry.attempt,env.sync(spec));
  if(entry.dirty)return {state:'dirty',text:'Unsaved changes'};
  return entry.attempt?status(entry.attempt,env.sync(spec)):{state:'none',text:entry.message||''};
 }
 function save(spec,base){
  const model=env.model(spec),id=keyOf(spec),entry=drafts.get(id)||{value:model.value,base:base??model.base,dirty:false};
  const reject=text=>{entry.error=text;drafts.set(id,entry);return false;};
  if(!model.valid)return reject('This item changed · reopen its current details');
  if(!model.can)return reject('Not saved · open an edit link to make changes');
  if(entry.base!==model.base)return reject('Selection changed elsewhere · reload before saving');
  if(!(spec.kind==='door'?doorValues:handlingValues).includes(entry.value))return reject('Choose an option from the list');
  const retry=entry.attempt?.kept===false&&entry.attempt.expected===env.sync(spec).current;
  if(entry.value===model.value&&!retry){drafts.set(id,{value:model.value,base:model.base,dirty:false,message:'No changes to save'});return true;}
  entry.error='';entry.dirty=false;entry.attempt={kept:null};drafts.set(id,entry);
  let accepted=false;
  try{accepted=retry?env.retry(spec)===true:env.set(spec,entry.value)===true;}
  catch(_){accepted=false;}
  const after=env.model(spec);
  if(!accepted||!after.valid||after.value!==entry.value){entry.dirty=true;entry.attempt=null;entry.error='Not saved · review the selection and try again';return false;}
  entry.base=after.base;entry.attempt={kept:env.kept()!==false,expected:env.sync(spec).current};
  entry.dirty=!entry.attempt.kept;return entry.attempt.kept;
 }
 return {stage,save,feedback,reset:spec=>drafts.delete(keyOf(spec)),entry:spec=>drafts.get(keyOf(spec)),value:spec=>drafts.get(keyOf(spec))?.value??env.model(spec).value};
}
const api={status,createController,keyOf};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root||typeof document==='undefined')return;
const shapeEnv=()=>({asset:ref=>assetOf(ref),units:a=>gcUnits925(a),rows:a=>loading872Rows(a),side:(a,id)=>loading872Side(a,id),shapes:MasterShapes926});
const can=()=>capability()==='edit'&&!SYNC.readonly;
function model(spec){
 const a=assetOf(spec.ref),allowed=can();
 if(!a||a._cancelled)return {valid:false,can:allowed,value:'',base:''};
 if(spec.kind==='handling'){
  const r=handling875Record(a);return {valid:true,can:allowed,value:r?.method||'',base:JSON.stringify(r||null)};
 }
 const rows=loading872Rows(a),row=rows.find(r=>r.id===spec.unit),record=loading872Record(spec.ref),value=row?loading872Side(a,row.id):'';
 const physical=spec.physical?root.Shapes926?.unitModel(a,shapeEnv()).find(u=>u.id===spec.physical):null;
 const valid=!!row&&(!spec.physical||physical?.loadingId===spec.unit);
 return {valid,can:allowed,value,base:JSON.stringify([row||null,value,record[spec.unit]||null,row?record['item:'+row.item]||null:null])};
}
function sync(spec){
 const id=docIdOf(spec.ref),doc=toDocs('delivery')[id];
 return {current:doc?JSON.stringify(doc):null,last:SYNC.last?.delivery?.[id]??null,on:SYNC.on,readonly:SYNC.readonly,connection:SYNC.status,queued:Object.hasOwn(SYNC.queue?.delivery||{},id),inflight:Object.hasOwn(SYNC.inflight||{},'delivery/'+id)};
}
const controller=createController({model,sync,set:(s,value)=>s.kind==='door'?loading872Set(s.ref,s.unit,value):handling875Set(s.ref,value),kept:()=>bump.kept,retry:s=>{
 if(!mayWrite(s.kind==='door'?'the loading direction':'the unloading method')||!whoAmI())return false;
 bump();return true;
}});
let sequence=0;
function specOf(box){return {kind:box.dataset.loading1012Kind,ref:box.dataset.ref,unit:box.dataset.loading1012Unit||'',physical:box.dataset.loading1012Physical||''};}
function tag(box,spec){
 box.dataset.loading1012Editor='';box.dataset.loading1012Kind=spec.kind;box.dataset.ref=spec.ref;box.dataset.loading1012Unit=spec.unit||'';
 if(spec.physical)box.dataset.loading1012Physical=spec.physical;
 box.dataset.key=keyOf(spec);box.dataset.loading1012Base=model(spec).base;
}
function controls(box){
 if(box.querySelector('.loading1012-controls')||!can())return;
 const controls=document.createElement('div');controls.className='loading1012-controls';
 controls.innerHTML='<button type="button" class="btn primary" data-loading1012-save>Save</button><button type="button" class="btn" data-loading1012-reset>Reload</button><span data-loading1012-result role="status" aria-live="polite"></span>';
 const clear=box.querySelector('[data-loading1012-clear]');if(clear)controls.insertBefore(clear,controls.querySelector('[data-loading1012-reset]'));
 box.append(controls);
}
function update(box){
 const spec=specOf(box),m=model(spec),entry=controller.entry(spec),value=entry&&(entry.dirty||entry.attempt?.kept===null)?entry.value:m.value,result=controller.feedback(spec);
 for(const input of box.querySelectorAll('[data-loading1012-choice]')){
  if(input.type==='radio'){input.checked=input.value===value;input.defaultChecked=input.checked;}else{input.value=value;for(const option of input.options||[])option.defaultSelected=option.value===value;}
  input.disabled=!m.can||!m.valid;
 }
 const feedback=box.querySelector('[data-loading1012-result]');if(feedback){feedback.textContent=result.text;feedback.dataset.save1012=result.state;}
 const save=box.querySelector('[data-loading1012-save]');if(save)save.disabled=!m.can||!m.valid||entry?.attempt?.kept===null;
 const clear=box.querySelector('[data-loading1012-clear]');if(clear)clear.disabled=!m.can||!m.valid;
 if(!entry?.dirty)box.dataset.loading1012Base=m.base;
}
function decorate(scope){
 for(const fieldset of scope.querySelectorAll('fieldset')){
  if(fieldset.hasAttribute('data-loading1012-editor'))continue;
  const input=fieldset.querySelector('[data-door872-ref],[data-handling875-ref]');if(!input)continue;
  const spec=input.hasAttribute('data-door872-ref')?{kind:'door',ref:input.dataset.door872Ref,unit:input.dataset.door872Unit}:{kind:'handling',ref:input.dataset.handling875Ref};
  tag(fieldset,spec);const name='loading1012-'+(++sequence);
  for(const radio of fieldset.querySelectorAll('[data-door872-ref],[data-handling875-ref]')){
   radio.removeAttribute('data-door872-ref');radio.removeAttribute('data-door872-unit');radio.removeAttribute('data-handling875-ref');radio.dataset.loading1012Choice='';radio.dataset.key='loading1012-choice/'+radio.value;radio.name=name;
  }
  const clear=fieldset.querySelector('[data-door872-clear],[data-handling875-clear]');
  if(clear){clear.removeAttribute('data-door872-clear');clear.removeAttribute('data-door872-unit');clear.removeAttribute('data-handling875-clear');clear.dataset.loading1012Clear='';}
  const detail=fieldset.closest('details.loading872');if(detail){detail.dataset.ref=spec.ref;detail.dataset.key='loading1012/'+spec.kind+'/'+spec.ref;}
  controls(fieldset);
 }
 for(const field of scope.querySelectorAll('[data-shape926-door]')){
  const ref=field.dataset.shape926Ref,physical=field.dataset.shape926Id,a=assetOf(ref),unit=a&&root.Shapes926?.unitModel(a,shapeEnv()).find(u=>u.id===physical);
  const box=field.closest('.shape926-unit-info');if(!box)continue;
  tag(box,{kind:'door',ref,unit:unit?.loadingId||'',physical});field.removeAttribute('data-shape926-door');field.dataset.loading1012Choice='';
  box.querySelector('[data-shape926-feedback]')?.remove();controls(box);
 }
 for(const box of scope.querySelectorAll('[data-loading1012-editor]'))update(box);
}
function html(value){const template=document.createElement('template');template.innerHTML=value;decorate(template.content);return template.innerHTML;}
const loadingBefore=loading872Editor;
loading872Editor=function(){return html(loadingBefore.apply(this,arguments));};
const handlingBefore=handling875Editor;
handling875Editor=function(){return html(handlingBefore.apply(this,arguments));};
if(root.Shapes926){const before=root.Shapes926;root.Shapes926=Object.freeze(Object.assign({},before,{
 panel:function(el){const result=before.panel.apply(this,arguments);if(el)decorate(el);return result;},
 productHtml942:function(){return html(before.productHtml942.apply(this,arguments));}
}));}
function feedback(){for(const box of document.querySelectorAll('[data-loading1012-editor]'))update(box);}
const footerBefore=syncFooter;
syncFooter=function(){const result=footerBefore.apply(this,arguments);feedback();return result;};
document.addEventListener('change',event=>{
 const field=event.target.closest?.('[data-loading1012-choice]');if(!field)return;
 const box=field.closest('[data-loading1012-editor]');if(!box)return;
 controller.stage(specOf(box),field.value,box.dataset.loading1012Base);feedback();
});
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-loading1012-save],[data-loading1012-clear],[data-loading1012-reset]');if(!button)return;
 const box=button.closest('[data-loading1012-editor]');if(!box)return;event.preventDefault();
 const spec=specOf(box);
 if(button.hasAttribute('data-loading1012-clear'))controller.stage(spec,'',box.dataset.loading1012Base);
 else if(button.hasAttribute('data-loading1012-reset'))controller.reset(spec);
 else controller.save(spec,box.dataset.loading1012Base);
 feedback();
});
root.LoadingSave1012=Object.assign(api,{controller,feedback,decorate,model});
decorate(document);
})(typeof window!=='undefined'?window:null);
