/* Author: Andrew Fisher. Explicit pee-panel hire-rate Save with exact shared acknowledgement. */
(function(root){
'use strict';
function status(attempt,env){
 if(!attempt)return {state:'none',text:''};
 if(attempt.error)return {state:'error',text:attempt.error};
 if(attempt.dirty)return {state:'dirty',text:'Unsaved changes'};
 if(attempt.kept===false)return {state:'error',text:'Not saved · keep this page open'};
 if(attempt.kept!==true)return {state:'pending',text:'Saving rate…'};
 const equal=(a,b)=>a===b;
 if(!attempt.expected?.length||attempt.expected.some((r,i)=>!equal(r.value,env.current[i])))return {state:'changed',text:'Rate changed · review the current record'};
 if(env.on&&attempt.expected.every((r,i)=>equal(r.value,env.last[i]))&&!env.queued&&!env.inflight)return {state:'shared',text:'SAVED · shared record updated'};
 if(env.readonly)return {state:'offline',text:'Saved on this device · shared record is view only'};
 if(!env.on||env.connection!=='live')return {state:'offline',text:'Saved on this device · waiting to sync'};
 return {state:'pending',text:'Saved on this device · syncing…'};
}
const api={status};if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root||typeof document==='undefined')return;
const key='hire|WC09|Pee Panel',stampKey='lineRates/'+key;
let editor=null,attempt=null;
const current=()=>S.lineRates?.[key]??'';
const baseline=()=>JSON.stringify([current(),S.stamps?.[stampKey]||'',S.rates?.['Toilets & amenities|Pee Panel']??null,S.minDays?.['Toilets & amenities|Pee Panel']??null]);
const serial=(name,k)=>{const value=toDocs(name)[docIdOf(k)];return value?JSON.stringify(value):null;};
const expected=()=>[['lineRates',key],['stamps',stampKey],['by',stampKey]].map(([collection,k])=>({collection,id:docIdOf(k),key:k,value:serial(collection,k)}));
function feedback(){
 let value;
 if(editor?.dirty&&editor.base!==baseline())value={state:'changed',text:'Rate changed elsewhere · reload before saving'};
 else if(editor?.error)value={state:'error',text:editor.error};
 else if(editor?.dirty)value={state:'dirty',text:'Unsaved changes'};
 else if(attempt){const rows=attempt.expected||[];value=status(attempt,{current:rows.map(r=>serial(r.collection,r.key)),last:rows.map(r=>SYNC.last?.[r.collection]?.[r.id]??null),on:SYNC.on,readonly:SYNC.readonly,connection:SYNC.status,queued:rows.some(r=>Object.hasOwn(SYNC.queue?.[r.collection]||{},r.id)),inflight:rows.some(r=>Object.hasOwn(SYNC.inflight||{},r.collection+'/'+r.id))});}
 else value={state:'none',text:''};
 for(const result of document.querySelectorAll('[data-pee1010-result]')){result.textContent=value.text;result.dataset.save1010=value.state;}
 return value;
}
function editorHtml(){
 if(!canEdit())return '';
 const draft=editor?.dirty?editor.draft:String(current()),base=editor?.dirty?editor.base:baseline();
 return '<form data-pee1010-editor data-baseline="'+esc(base)+'"><label for="pee1010-rate">Full hire rate / panel · ex GST</label><div class="pee1010-entry"><input id="pee1010-rate" name="pee1010-rate" inputmode="decimal" autocomplete="off" value="'+esc(draft)+'" placeholder="'+esc(String(peePrice1010().sourceRate))+'"><button type="submit" class="btn primary">Save rate</button><button type="button" class="btn ghost" data-pee1010-reload>Reload</button></div><small>Blank removes this override.</small><p data-pee1010-result role="status" aria-live="polite"></p></form>';
}
const before=arrivedChargesHtml975;
arrivedChargesHtml975=function(a){
 const html=before.apply(this,arguments);if(a?.key!=='WC09')return html;
 const template=document.createElement('template');template.innerHTML=html;
 const detail=template.content.querySelector('[data-profile1006-item="Pee Panel"]'),fallback=peeHireForecast979();if(!detail||fallback.ref!=='WC09'||fallback.item!=='Pee Panel'||!(fallback.amount>0))return html;
 const p=peePrice1010(),hire=[...detail.querySelectorAll('tr[data-item979]')].find(tr=>tr.children.length===4&&tr.firstElementChild?.textContent.trim().startsWith('Hire'));
 if(hire){hire.children[1].innerHTML='<b>'+esc(chargeRateDisplay977(p.fullHireRate))+'</b><small class="pee1010-basis">Full hire / panel</small>';}
 const info=document.createElement('details');info.dataset.pee1010Info='';info.className='units925-edit';
 info.innerHTML='<summary>Hire · more info</summary><p>'+esc(p.rateSource)+'</p><dl class="pee1010-source"><dt>Card full hire / panel</dt><dd>'+esc(chargeRateDisplay977(p.sourceRate))+'</dd><dt>Card daily reference</dt><dd>'+esc(chargeRateDisplay977(p.sourceDaily))+' / panel / day</dd></dl><p class="hint">Daily reference only · not added to full hire. Quantity applied once.</p>'+(p.underFloor?'<p role="status">Recorded override is below $450 per panel · card rate applied.</p>':p.invalid?'<p role="status">Recorded override is invalid · card rate applied.</p>':'')+editorHtml();
 detail.append(info);return template.innerHTML;
};
const openBefore=openAsset_held;
openAsset_held=function(){const result=openBefore.apply(this,arguments);feedback();return result;};
const footerBefore=syncFooter;
syncFooter=function(){const result=footerBefore.apply(this,arguments);feedback();return result;};
document.addEventListener('input',event=>{const input=event.target.closest?.('#pee1010-rate');if(!input)return;editor={draft:input.value,base:editor?.dirty?editor.base:input.closest('[data-pee1010-editor]').dataset.baseline,dirty:true};feedback();});
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-pee1010-reload]');if(!button)return;event.preventDefault();editor=null;attempt=null;openAsset('WC09',{keep:true});});
document.addEventListener('submit',event=>{
 const form=event.target.closest?.('[data-pee1010-editor]');if(!form)return;event.preventDefault();event.stopPropagation();
 const raw=form.querySelector('#pee1010-rate').value,base=editor?.dirty?editor.base:form.dataset.baseline;
 const reject=text=>{editor={draft:raw,base,dirty:true,error:text};feedback();};
 const valid=validatePeeRate1010(raw);if(!valid.ok){reject(valid.error);return;}
 if(base!==baseline()){reject('Rate changed elsewhere · reload before saving');return;}
 if(!mayWrite('the pee-panel hire rate')){reject('Not saved · this link cannot change rates');return;}
 if(!whoAmI()){reject('Not saved · enter who is recording');return;}
 const value=valid.value==null?'':String(valid.value);
 editor=null;attempt={kept:null,expected:null};
 const bridge=document.createElement('input');bridge.type='hidden';bridge.dataset.lr748=key;bridge.value=value;form.append(bridge);
 try{bridge.dispatchEvent(new Event('change',{bubbles:true}));}
 finally{bridge.remove();}
 if(String(current())!==value){attempt={error:'Rate was not changed · review and save again'};feedback();return;}
 attempt.expected=expected();attempt.kept=bump.kept!==false;feedback();
});
root.PeeRateUI1010=Object.assign(api,{feedback,baseline});
})(typeof window!=='undefined'?window:null);
