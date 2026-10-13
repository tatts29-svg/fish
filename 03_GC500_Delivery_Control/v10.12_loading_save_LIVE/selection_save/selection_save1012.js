/* Author: Andrew Fisher. Scoped confirmation for existing native autosave fields.
   Observes native saves; never replays an accepted edit or a mutating action. */
(function(root){'use strict';
const families=[
 ['workforce','[data-rsf],[data-rsm],[data-rsx],[data-rsrate],[data-rstype],[data-rsbranch],[data-prate],[data-prole]',['costs']],
 ['pay-rules','[data-rsrule]',['runRules']],
 ['fencing-rates','[data-fk],[data-fck]',['fenceRates','fenceCosts']],
 ['pricing','[data-rk],[data-ak],[data-min],[data-hrs],[data-scope],[data-lr748]',['rates','accRates','minDays','eventHours','lineRates']],
 ['answers','[data-qa]',['answers']],
 ['delivery','[data-eta],[data-date],[data-outdate],[data-dnote]',['delivery']],
 ['asset-branch','[data-branch]',['branch']],
 ['rental','#rentalSel',['rental']],
 ['supplied','[data-sup],[data-supq],[data-chgot],[data-chnumit]',['supplied']],
 ['record-edit','[data-ed],[data-chdate],[data-chtext],#mapRefSel',['descs','qtys','hireStart','mapRef','locations','delivery','rates','items']],
 ['charge-selection','input[data-lab],[data-stairs975-qty],[data-stairs1006-qty],[data-stairs1006-select]',['labour','loads']]
].map(([id,selector,collections])=>({id,selector,collections}));
const excluded='[data-loading1012-editor],.loading1012-controls,[data-unit925-form],[data-pee1010-editor],[data-staff988-edit],.crew883,[data-fin745-form],[data-transport1006-form],.selection1012-controls';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
function sameBody(a,b){if(a===b)return true;if(a==null||b==null)return false;try{return canonical(JSON.parse(a))===canonical(JSON.parse(b));}catch(_){return false;}}
function diff(before,after){const out=[];for(const c of new Set([...Object.keys(before||{}),...Object.keys(after||{})]))for(const id of new Set([...Object.keys(before[c]||{}),...Object.keys(after[c]||{})])){const a=before[c]?.[id]??null,b=after[c]?.[id]??null;if(!sameBody(a,b))out.push({collection:c,id,expected:b});}return out;}
function status(attempt,env){
 if(!attempt)return {state:'idle',text:''};
 if(attempt.error)return {state:'error',text:attempt.error};
 if(attempt.dirty)return {state:'dirty',text:'Unsaved change'};
 if(attempt.kept===false||env.unkept)return {state:'error',text:'Not saved · keep this page open'};
 if(!attempt.accepted||!attempt.expected?.length)return {state:'idle',text:attempt.noChange?'No new change to save':''};
 if(attempt.expected.some(d=>!sameBody(env.current(d.collection,d.id),d.expected)))return {state:'changed',text:'Record changed · review this field'};
 const acknowledged=attempt.expected.every(d=>{
  const k=d.collection+'/'+d.id,last=env.last[d.collection]||{};
  return (d.expected===null?!own(last,d.id):last[d.id]===d.expected)&&!own(env.queue[d.collection],d.id)&&!own(env.inflight,k);
 });
 if(env.ready&&acknowledged)return {state:'shared',text:'Saved · shared record updated'};
 return {state:'local',text:env.connected?'Saved on this device · syncing…':'Saved on this device · waiting for connection'};
}
const api={families,excluded,diff,status,sameBody};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SelectionSave1012=api;if(typeof document==='undefined')return;
const attempts=new Map(),selector=families.map(f=>f.selector).join(','),mounted=new WeakMap(),owners=new WeakMap(),discarded=new WeakSet(),deferred=new Map();let active=null,pendingMount=false,sequence=0;
function editable(el){return capability()==='edit'&&!SYNC.readonly&&!el.disabled&&!el.readOnly;}
function family(el){return el?.matches?.('input:not([type="hidden"]),select,textarea')&&!el.closest(excluded)&&families.find(f=>el.matches(f.selector));}
function identity(el,f){const scope=el.closest('[id^="pane-"],#drawer'),allowed=new Set(['id','name','data-rsp','data-k','data-ref','data-unit',...[...f.selector.matchAll(/\[(data-[a-z0-9-]+)/g)].map(m=>m[1])]),attrs=[...el.attributes].filter(a=>allowed.has(a.name)).map(a=>[a.name,a.value]).sort((a,b)=>a[0].localeCompare(b[0]));const stairs=el.closest('.stairs975');if(stairs)attrs.push(...[...stairs.attributes].filter(a=>/data-stairs(?:1006|975)-(?:ref|disc|item|unit)$/.test(a.name)).map(a=>[a.name,a.value]));return JSON.stringify([f.id,scope?.id||'',scope?.id==='drawer'?state.sel||'':'',scope?.id==='pane-runsheet'?state.runDay||todayIso():'',scope?.id==='pane-change'&&typeof CHG!=='undefined'?CHG.key||'':'',attrs]);}
function value(el){return el.type==='checkbox'||el.type==='radio'?String(el.checked):el.value;}
function writeValue(el,v){if(el.type==='checkbox'||el.type==='radio')el.checked=v==='true';else el.value=v;}
function snapshot(f,audit){const out={};for(const c of f.collections.concat(audit?['stamps','by']:[])){if(!SYNC_COLLS[c])continue;out[c]={};for(const [id,body]of Object.entries(toDocs(c)))out[c][id]=JSON.stringify(body);}return out;}
function current(c,id){const d=toDocs(c)[id];return d===undefined?null:JSON.stringify(d);}
function environment(){return {unkept:SYNC.unkept,ready:SYNC.on&&SYNC.status==='live'&&!SYNC.readonly&&Object.keys(SYNC_COLLS).every(k=>SYNC.first.has(k)),connected:SYNC.on&&!['offline','unreachable','error','stopped','paused'].includes(SYNC.status),last:SYNC.last||{},queue:SYNC.queue||{},inflight:SYNC.inflight||{},current};}
function entry(el,f){const key=identity(el,f);let a=attempts.get(key);if(!a){a={key,family:f.id,value:value(el),baseValue:value(el),dirty:false,expected:[],accepted:false};attempts.set(key,a);}return a;}
function copies(key){return [...document.querySelectorAll(selector)].filter(el=>{const f=family(el);return f&&identity(el,f)===key;});}
function find(key){return copies(key)[0];}
function isCopy(el,key){const f=el?.isConnected&&family(el);return !!f&&identity(el,f)===key;}
function draw(el,f){
 const a=attempts.get(identity(el,f)),bar=mounted.get(el);if(!bar?.isConnected)return;
 const s=status(a,environment()),out=bar.querySelector('[data-selection1012-status]'),button=bar.querySelector('[data-selection1012-save]'),reload=bar.querySelector('[data-selection1012-reload]');
 if(out.textContent!==s.text)out.textContent=s.text;bar.dataset.selection1012State=s.state;button.disabled=!editable(el);bar.hidden=!editable(el)&&!s.text;if(reload)reload.hidden=!['error','changed'].includes(s.state);
}
function restore(el,f,a){
 if(!a||value(el)===a.value)return;if(!a.dirty){if(a.accepted&&value(el)===a.baseValue&&a.expected?.length&&a.expected.every(d=>sameBody(current(d.collection,d.id),d.expected)))writeValue(el,a.value);return;}
 if(a.base&&diff(a.base,snapshot(f,false)).length)a.error='Record changed · your entry is unsaved';
 writeValue(el,a.value);a.restored=true;
 if(a.focused){try{el.focus({preventScroll:true});if(a.start!=null&&typeof el.setSelectionRange==='function')el.setSelectionRange(a.start,a.end);}catch(_){}a.focused=false;}
}
function mount(){
 pendingMount=false;for(const el of document.querySelectorAll(selector)){
  const f=family(el);if(!f)continue;const key=identity(el,f),a=entry(el,f);restore(el,f,a);
  let bar=mounted.get(el);if(!bar?.isConnected){
   bar=document.createElement('span');bar.className='selection1012-controls';bar.dataset.selection1012Key=key;
   const button=document.createElement('button');button.type='button';button.className='btn selection1012-save';button.dataset.selection1012Save='';button.textContent='Save';button.setAttribute('aria-label','Save this field');
   const reload=document.createElement('button');reload.type='button';reload.className='btn selection1012-save';reload.dataset.selection1012Reload='';reload.textContent='Reload';reload.hidden=true;
   const out=document.createElement('span');out.dataset.selection1012Status='';out.setAttribute('role','status');out.setAttribute('aria-live','polite');bar.append(button,reload,out);
   const label=el.closest('label'),anchor=label&&label.querySelectorAll('input,select,textarea').length===1?label:el;anchor.after(bar);mounted.set(el,bar);owners.set(bar,el);
  }draw(el,f);
 }
}
function schedule(){if(!pendingMount){pendingMount=true;requestAnimationFrame(mount);}}
function refresh(){for(const el of document.querySelectorAll(selector)){const f=family(el);if(f)draw(el,f);}}
function captureInput(event){
 if(discarded.has(event.target))return;const el=event.target,f=family(el);if(!f||!editable(el))return;const a=entry(el,f);
 if(!a.dirty){a.base=snapshot(f,false);a.baseValue=a.value;}
 a.value=value(el);a.dirty=true;a.error='';a.noChange=false;a.focused=document.activeElement===el;a.start=el.selectionStart;a.end=el.selectionEnd;draw(el,f);
}
function begin(event){
 if(discarded.has(event.target)){event.preventDefault();event.stopImmediatePropagation();return;}const el=event.target,f=family(el);if(!f||!editable(el))return;const a=entry(el,f);
 if(a.dirty&&a.base&&diff(a.base,snapshot(f,false)).length){a.error='Record changed · reopen this field before saving';event.preventDefault();event.stopImmediatePropagation();draw(el,f);return;}
 const context={id:++sequence,key:a.key,el,f,before:snapshot(f,true),calls:0,kept:true,value:value(el),deferred:el.matches('[data-chdate],[data-chtext]'),ref:typeof CHG!=='undefined'?CHG.key:null,field:el.dataset.chdate||el.dataset.chtext,kind:el.hasAttribute('data-chdate')?'date':'text'};if(context.deferred)deferred.set(context.id,context);else active=context;
 a.value=context.value;a.error='';a.noChange=false;
 if(context.deferred)setTimeout(()=>{if(deferred.has(context.id)){deferred.delete(context.id);finish(context);}},100);else setTimeout(()=>finish(context),0);
}
function record(context,kept){
 if(!context)return;context.calls++;if(kept===false)context.kept=false;
 const a=attempts.get(context.key),all=diff(context.before,snapshot(context.f,true)),primary=all.filter(d=>context.f.collections.includes(d.collection));
 if(primary.length){a.expected=all;a.accepted=true;a.dirty=context.kept===false;a.kept=context.kept;a.value=context.value;a.base=context.kept===false?snapshot(context.f,false):null;a.focused=false;a.restored=false;a.error=context.kept===false?'Not saved · keep this page open':'';}
}
function finish(context){
 if(active===context)active=null;const a=attempts.get(context.key);if(!a)return;
 if(!context.calls){a.dirty=true;a.error='Not saved · check this entry';}
 else if(!diff(context.before,snapshot(context.f,false)).some(d=>context.f.collections.includes(d.collection))){a.dirty=false;a.accepted=false;a.expected=[];a.noChange=true;a.kept=context.kept;a.base=null;a.focused=false;}
 const el=find(context.key);if(el){restore(el,context.f,a);draw(el,context.f);}schedule();
}
for(const [name,kind]of [['chSetDate','date'],['chSetText','text']]){const original=root[name];if(typeof original!=='function')continue;root[name]=function(ref,second,third){const field=kind==='date'?third:second,v=kind==='date'?second:third,context=[...deferred.values()].find(c=>c.kind===kind&&c.ref===ref&&c.field===field&&String(c.value)===String(v));if(!context)return original.apply(this,arguments);deferred.delete(context.id);const prior=active;active=context;try{return original.apply(this,arguments);}finally{active=prior;finish(context);}};}
const nativeSave=save;
save=function(){const context=active;let result;try{result=nativeSave.apply(this,arguments);return result;}finally{if(context)record(context,result===true);}};
function flushCaptured(a,f){
 const prior=active;active=null;a.kept=false;
 try{a.kept=nativeSave()===true;}catch(_){a.kept=false;}finally{active=prior;}
 if(a.kept){a.dirty=false;a.error='';a.base=null;}else{a.dirty=true;a.error='Not saved · keep this page open';a.base=snapshot(f,false);}
}
function explicitSave(key,preferred){
 let el=isCopy(preferred,key)?preferred:find(key);const f=family(el);if(!f||!editable(el))return;let a=entry(el,f);const origin=el,copyIndex=copies(key).indexOf(el);
 if(a.dirty&&a.base&&diff(a.base,snapshot(f,false)).length){a.error='Record changed · reopen this field before saving';draw(el,f);return;}
 if(document.activeElement===el)el.blur();
 function flush(){
  el=isCopy(origin,key)?origin:(copies(key)[copyIndex]||find(key));if(!el||!editable(el))return;a=attempts.get(key);if(!a)return;
  if(a.dirty&&a.restored&&!a.error&&(!a.base||!diff(a.base,snapshot(f,false)).length)&&value(el)===a.value){a.restored=false;el.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(flush,0);return;}
  if(a.kept===false&&a.accepted&&a.expected.length&&a.expected.every(d=>sameBody(current(d.collection,d.id),d.expected))){flushCaptured(a,f);draw(el,f);return;}
  if(a.dirty||a.error){if(!a.error)a.error='Not saved · finish or correct this field';draw(el,f);return;}
  if(!a.accepted||!a.expected.length){a.noChange=true;draw(el,f);return;}
  if(!editable(el))return;
  // Flush the already captured native state. No field handler is invoked again.
  flushCaptured(a,f);draw(el,f);
 }setTimeout(flush,0);
}
function reloadField(key,preferred){const el=isCopy(preferred,key)?preferred:find(key),a=attempts.get(key);if(!el)return;discarded.add(el);if(document.activeElement===el)el.blur();const ref=el.closest('#drawer')?state.sel:null;if(a)writeValue(el,a.baseValue??'');if(el.matches('[data-qa]')&&typeof refreshQuestionNote754==='function')refreshQuestionNote754(el.dataset.qa);attempts.delete(key);if(ref)openAsset(ref,{keep:true});else{const pane=document.getElementById('pane-'+state.tab),held=root.Persistence1010?.capture(pane,false);try{render();}finally{mount();if(held)root.Persistence1010.restore(pane,held,false);}}schedule();}
document.addEventListener('input',captureInput,true);
document.addEventListener('change',begin,true);
document.addEventListener('blur',event=>{const el=event.target;if(discarded.has(el)){event.preventDefault();event.stopImmediatePropagation();return;}const f=family(el),a=f&&attempts.get(identity(el,f));if(a?.dirty&&a.base&&diff(a.base,snapshot(f,false)).length){a.error='Record changed · your entry is unsaved';event.preventDefault();event.stopImmediatePropagation();draw(el,f);}},true);
document.addEventListener('focusout',e=>{const f=family(e.target);if(f){const a=attempts.get(identity(e.target,f));if(a&&!active)a.focused=false;}},true);
document.addEventListener('pointerdown',e=>{const b=e.target.closest?.('[data-selection1012-save],[data-selection1012-reload]');if(!b)return;e.preventDefault();e.stopPropagation();if(b.hasAttribute('data-selection1012-reload'))return reloadField(b.closest('.selection1012-controls').dataset.selection1012Key,owners.get(b.closest('.selection1012-controls')));explicitSave(b.closest('.selection1012-controls').dataset.selection1012Key,owners.get(b.closest('.selection1012-controls')));},true);
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-selection1012-save],[data-selection1012-reload]');if(!b)return;e.preventDefault();e.stopPropagation();if(e.detail===0){if(b.hasAttribute('data-selection1012-reload'))reloadField(b.closest('.selection1012-controls').dataset.selection1012Key,owners.get(b.closest('.selection1012-controls')));else explicitSave(b.closest('.selection1012-controls').dataset.selection1012Key,owners.get(b.closest('.selection1012-controls')));}},true);
// The outer native bump/Idle handlers restore page position after render returns.
// Give them the final control height, without introducing another scroll owner.
const renderBefore=render;render=function(){try{return renderBefore.apply(this,arguments);}finally{mount();}};
// Build the real control height before the existing synchronous drawer position restore.
// Its native user-intent guards still own any next-frame correction.
if(typeof openAssetRestore==='function'){const restoreDrawer=openAssetRestore;openAssetRestore=function(){mount();return restoreDrawer.apply(this,arguments);};}
const footer=syncFooter;syncFooter=function(){const result=footer.apply(this,arguments);refresh();return result;};
new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches?.('.selection1012-controls,.selection1012-controls *'))))schedule();}).observe(document.body,{subtree:true,childList:true});
Object.assign(api,{mount,refresh,attempts,explicitSave,identity,family});schedule();
})(typeof window!=='undefined'?window:globalThis);
