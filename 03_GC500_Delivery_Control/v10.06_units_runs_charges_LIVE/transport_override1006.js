/* Author: Andrew Fisher. GN20 customer transport remains POA until a rate is saved.
 * One revisioned shared record; each entered rate replaces the missing allowance.
 * This is Revenue only, never carrier cost, a completed pickup or an invoice. */
(function(root){'use strict';
 const kind='customerTransport1006',prefix='transport-charge1006/',cents=n=>Math.round((n+Number.EPSILON)*100)/100;
 const token=v=>JSON.stringify(v??null),canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 const key=(ref,item)=>prefix+JSON.stringify([ref,item]);
 function context(rows,ref,item){const r=(rows||[]).find(r=>r.ref===ref&&r.item===item);return r?{ref,item,quantity:r.quantity,branch:r.branch,contracts:[...(r.contracts||[])].sort(),lineKeys:[...(r.lineKeys||[])].sort(),legs:rows.filter(r=>r.ref===ref&&r.item===item).map(r=>({leg:r.leg,rate:r.rate,source:r.rateSource,coverage:r.coverage})).sort((a,b)=>a.leg.localeCompare(b.leg))}:null;}
 function validate(input){const rates={};for(const leg of ['delivery','pickup']){const raw=String(input[leg]??'').trim();if(!raw){rates[leg]=null;continue;}if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||!Number.isFinite(Number(raw))||Number(raw)>1000000)return {ok:false,reason:'Enter a non-negative dollar rate, with up to two decimal places.'};rates[leg]=Number(raw);}return {ok:true,rates,note:String(input.note||'').trim().slice(0,300)};}
 function apply(model,doc,source){
  if(!doc||doc.kind!==kind||!doc.active)return model;
  const stale=canonical(doc.source)!==canonical(source),rows=model.rows.map(r=>{
   if(r.ref!==doc.ref||r.item!==doc.item)return r;
   const rate=doc.rates?.[r.leg];if(rate==null)return r;
   if(stale)return {...r,state:'held',reasons:[...new Set([...r.reasons,'Saved customer transport rate needs review after its source changed'])],additional:0};
   if(!Number.isFinite(rate)||rate<0||rate>1000000)return {...r,state:'held',reasons:[...new Set([...r.reasons,'Saved customer transport rate is invalid'])],additional:0};
   const reasons=r.reasons.filter(x=>x!=='No current card transport charge'),uncoveredQuantity=Number.isFinite(r.quantity)?Math.max(0,r.quantity-r.coveredQuantity):null;
   const state=['included','excluded'].includes(r.state)?r.state:reasons.length?'held':!uncoveredQuantity?'covered':r.coveredQuantity?'partly covered':'estimate';
   return {...r,rate,rateSource:'Recorded customer '+r.leg+' rate · '+doc.by+(doc.note?' · '+doc.note:''),reasons,state,uncoveredQuantity,grossEstimate:Number.isFinite(r.quantity)?cents(r.quantity*rate):null,coveredEstimate:cents((r.coveredQuantity||0)*rate),heldEstimate:state==='held'&&uncoveredQuantity!=null?cents(uncoveredQuantity*rate):0,additional:['estimate','partly covered'].includes(state)?cents(uncoveredQuantity*rate):0,manualTransport1006:true};
  });
  const fields=['grossEstimate','coveredEstimate','heldEstimate'],branches=[...new Set(rows.filter(r=>!['included','excluded'].includes(r.state)).map(r=>r.branch))];
  const byBranch=branches.map(branch=>{const rs=rows.filter(r=>r.branch===branch&&!['included','excluded'].includes(r.state)),b={branch};for(const f of fields)b[f]=cents(rs.reduce((n,r)=>n+(r[f]||0),0));b.uncoveredAdditional=cents(rs.reduce((n,r)=>n+r.additional,0));return b;});
  const total=f=>cents(byBranch.reduce((n,b)=>n+b[f],0));
  return {...model,rows,byBranch,grossEstimate:total('grossEstimate'),coveredEstimate:total('coveredEstimate'),heldEstimate:total('heldEstimate'),uncoveredAdditional:total('uncoveredAdditional'),held:new Set(rows.filter(r=>r.state==='held').map(r=>r.buildingId)).size,estimated:new Set(rows.filter(r=>r.additional>0).map(r=>r.buildingId)).size};
 }
 const api={kind,prefix,key,token,canonical,context,validate,apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.CustomerTransport1006=api;
})(typeof window!=='undefined'?window:null);

if(typeof window!=='undefined')(function(){'use strict';
 const priorModel1006=buildingTransportModel831,api=CustomerTransport1006,feedback=new Map();
 const record=(ref,item)=>(S.loads||{})[api.key(ref,item)]||null;
 function source(ref,item){return api.context(priorModel1006().rows,ref,item);}
 buildingTransportModel831=function(){return heldMemo('customerTransport1006',()=>{
  const m=priorModel1006(),doc=record('GN20','350kva'),src=api.context(m.rows,'GN20','350kva');
  const updated=api.apply(m,doc,src);return updated===m?m:OnsiteTransport1006.project(updated,Object.fromEntries(m.rows.map(r=>[r.buildingId,r.receivedQuantity1006])));
 });};
 function status(ref,item){const currentRecord=record(ref,item);if(currentRecord?.active&&api.canonical(currentRecord.source)!==api.canonical(source(ref,item)))return 'Saved rate needs review after the source changed.';const f=feedback.get(api.key(ref,item));if(!f)return '';if(!f.kept)return 'Not saved yet · keep this page open.';
  const id=docIdOf(f.key),body=record(ref,item),current=body&&JSON.stringify({...body,_k:f.key});const shared=SYNC.on&&SYNC.last?.loads?.[id]===current&&!SYNC.inflight?.['loads/'+id]&&!Object.hasOwn(SYNC.queue?.loads||{},id);
  return shared?'SAVED · shared record updated':SYNC.on?'Saved on this device · syncing…':'Saved on this device';
 }
 function save(ref,item,input,expected,sourceToken){
  if(!mayWrite('customer transport charges'))return {ok:false,reason:'Open the edit link to change customer transport rates.'};
  const who=whoAmI();if(!who)return {ok:false,reason:'Select your recorder name before saving.'};
  const a=assetOf(ref),src=source(ref,item),old=record(ref,item),k=api.key(ref,item);
  if(ref!=='GN20'||item!=='350kva'||!a||a._cancelled||a.rest_of||movedAway(ref)||!src)return {ok:false,reason:'This generator scope is no longer active.'};
  if(api.token(old)!==expected)return {ok:false,reason:'The rates changed on another device. Reopen this section before saving.'};
  if(api.canonical(src)!==sourceToken)return {ok:false,reason:'The generator quantity, branch or rate source changed. Reopen this section before saving.'};
  if(old&&old.kind!==api.kind)return {ok:false,reason:'This saved record has a different purpose and needs review.'};
  if(Object.keys(S.loads||{}).some(x=>x!==k&&docIdOf(x)===docIdOf(k)))return {ok:false,reason:'This rate record needs a unique document identity.'};
  const value=api.validate(input);if(!value.ok)return value;
  const active=Object.values(value.rates).some(x=>x!==null),at=new Date(Math.max(Date.now(),Date.parse(old?.at||'')+1||0)).toISOString();
  const revision={rates:value.rates,note:value.note,active,source:src,by:who,at};
  S.loads=S.loads||{};S.loads[k]={kind:api.kind,ref,item,...revision,history:[...(old?.history||[]),revision]};
  stampIt('loads',k,who);feedback.set(k,{key:k,kept:true});bump();const kept=bump.kept!==false;feedback.get(k).kept=kept;drawStatus();return {ok:true,kept,key:k,reason:status(ref,item)};
 }
 function editor(a,item){if(a.key!=='GN20'||item!=='350kva')return '';const r=record(a.key,item),src=source(a.key,item);if(!src)return '';const enabled=canEdit(),old=r?.rates||{},stale=r?.active&&api.canonical(r.source)!==api.canonical(src);
  return '<tr data-transport1006-editor><td colspan="4"><details class="units925-edit" id="transport-rate1006-GN20"><summary>Delivery / pickup rates · '+(r?.active?'edit':'POA · add when known')+'</summary><form data-transport1006-form data-ref="GN20" data-item="350kva" data-doc="'+esc(api.key(a.key,item))+'" data-expected="'+esc(api.token(r))+'" data-source-token="'+esc(api.canonical(src))+'"><div class="units925-fields">'+['delivery','pickup'].map(leg=>'<label>'+ (leg==='delivery'?'Delivery':'Pickup')+' · per unit, ex GST<input type="number" name="'+leg+'" min="0" max="1000000" step="0.01" inputmode="decimal" placeholder="POA — not priced" value="'+esc(old[leg]??'')+'"'+(!enabled?' disabled':'')+'></label>').join('')+'<label>Quote / reference<input name="note" maxlength="300" value="'+esc(r?.note||'')+'"'+(!enabled?' disabled':'')+'></label></div><button type="submit" class="btn primary"'+(!enabled?' disabled':'')+'>Save transport rates</button><p role="status" data-transport1006-result>'+esc(stale?'Saved rate needs review after the source changed.':status(a.key,item))+'</p><small>Blank means unpriced. These are customer charges, separate from carrier costs.</small></form></details></td></tr>';
 }
 function drawStatus(){document.querySelectorAll('[data-transport1006-form]').forEach(f=>{const text=status(f.dataset.ref,f.dataset.item);if(text)f.querySelector('[data-transport1006-result]').textContent=text;});}
 const priorHtml1006=transportRowsHtml977;transportRowsHtml977=function(a,item){return priorHtml1006.apply(this,arguments)+editor(a,item);};
 const priorFooter1006=syncFooter;syncFooter=function(){const out=priorFooter1006.apply(this,arguments);drawStatus();return out;};
 document.addEventListener('submit',e=>{const f=e.target.closest?.('[data-transport1006-form]');if(!f)return;e.preventDefault();e.stopPropagation();const d=f.dataset,v=Object.fromEntries(new FormData(f)),result=save(d.ref,d.item,v,d.expected,d.sourceToken);if(f.isConnected)f.querySelector('[data-transport1006-result]').textContent=result.reason;if(result.ok){const reopened=document.querySelector('#transport-rate1006-GN20');if(reopened)reopened.open=true;drawStatus();}});
 document.addEventListener('input',e=>{const f=e.target.closest?.('[data-transport1006-form]');if(!f)return;feedback.delete(f.dataset.doc);f.querySelector('[data-transport1006-result]').textContent='Unsaved changes';});
 Object.assign(api,{record,source,save,editor,status});
})();
