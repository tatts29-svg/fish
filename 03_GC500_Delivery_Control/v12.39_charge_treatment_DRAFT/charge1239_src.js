/* Author: Andrew Fisher. Explicit customer charge decisions; supplier and site evidence stay separate. */
(function(root){
'use strict';
const PREFIX='charge-treatment1239|';
const HIRE_TYPES=['own_use_hire','included_elsewhere_hire'];
const TYPES={own_use_hire:'Coates own use — no customer hire charge',included_elsewhere_hire:'Included in another customer charge — no separate hire charge',included_in_pumpouts:'Included in pump-out charges — no separate customer charge'};
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'&&v.trim().length>0;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const copy=v=>v==null?null:JSON.parse(JSON.stringify(v));
const canonical=v=>JSON.stringify(v==null?null:Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):plain(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const finite=v=>typeof v==='number'&&Number.isFinite(v);
function validate(record,target,today){
 const errors=[];
 if(!plain(record)||record.schema!==1||record.kind!=='customer-charge-treatment')return ['Unrecognised customer-charge decision.'];
 const keys=['schema','kind','key','revision','treatment','source','reason','evidence','confirmed_by','confirmed_on','recorded_by','recorded_at','history'];
 if(Object.keys(record).some(k=>!keys.includes(k)))errors.push('Unknown customer-charge decision field.');
 if(!text(record.key)||!Number.isSafeInteger(record.revision)||record.revision<1||!Array.isArray(record.history))errors.push('Decision identity or history is incomplete.');
 const historyValid=(h,i)=>{
  if(!plain(h)||h.schema!==1||h.kind!=='customer-charge-treatment'||h.key!==record.key||h.revision!==i+1||Object.keys(h).some(k=>!keys.includes(k)||k==='history'))return false;
  if(typeof h.treatment!=='string'||!(h.treatment==='standard'||Object.prototype.hasOwnProperty.call(TYPES,h.treatment))||h.treatment!=='standard'&&!plain(h.source))return false;
  if(!text(h.reason)||h.reason.length>1000||!text(h.evidence)||h.evidence.length>1000||!text(h.confirmed_by)||!date(h.confirmed_on)||(today&&h.confirmed_on>today)||!text(h.recorded_by))return false;
  const at=typeof h.recorded_at==='string'?Date.parse(h.recorded_at):NaN;
  return Number.isFinite(at)&&new Date(at).toISOString()===h.recorded_at&&(!today||h.recorded_at.slice(0,10)<=today);
 };
 if(Array.isArray(record.history)&&(record.history.some((h,i)=>!historyValid(h,i))||record.revision!==record.history.length+1))errors.push('Decision revision and retained history do not agree.');
 if(typeof record.key!=='string'||!/^c\|[^|]+\|[^|]+$|^service\|.+$/.test(record.key)||(target&&target.key!==record.key))errors.push('Unknown or mismatched customer-charge identity.');
 if(!text(record.reason)||record.reason.length>1000||!text(record.evidence)||record.evidence.length>1000)errors.push('A reason and source evidence are required.');
 if(!text(record.confirmed_by)||!date(record.confirmed_on)||(today&&record.confirmed_on>today))errors.push('Named, dated confirmation is required.');
 const stamp=record.recorded_at,stampTime=typeof stamp==='string'?Date.parse(stamp):NaN;
 if(!text(record.recorded_by)||!Number.isFinite(stampTime)||new Date(stampTime).toISOString()!==stamp||(today&&stamp.slice(0,10)>today))errors.push('The decision has no valid native recording audit.');
 if(record.treatment==='standard')return errors;
 if(typeof record.treatment!=='string'||!Object.prototype.hasOwnProperty.call(TYPES,record.treatment))errors.push('Unknown customer-charge treatment.');
 if(!target||!target.eligible||target.key!==record.key)errors.push('The exact source line is unavailable or unsupported.');
 else {
  if(!(target.treatments||[target.treatment]).includes(record.treatment))errors.push('This treatment does not match the source line.');
  if(canonical(record.source)!==canonical(target.source))errors.push('Source evidence or its customer-rate override changed; review the decision.');
 }
 return errors;
}
function resolve(record,target,today){
 if(record==null)return {state:'none',record:null,errors:[]};
 const errors=validate(record,target,today);
 return {state:errors.length?'review':record.treatment==='standard'?'cleared':'active',record,errors,label:typeof record.treatment==='string'&&Object.prototype.hasOwnProperty.call(TYPES,record.treatment)?TYPES[record.treatment]:'Customer-charge decision'};
}
function contract(base,result){
 if(result?.state!=='active'||!HIRE_TYPES.includes(result.record?.treatment))return base;
 const d=result.record;
 const out={...base,amount:0,how:result.label,basis:result.label+'. '+d.reason+' Source: '+d.evidence+'. Confirmed by '+d.confirmed_by+', '+d.confirmed_on+'.',
  treatment:d.treatment,approved_by:d.confirmed_by,approved_on:d.confirmed_on,chargeTreatment1239:d,ordinary1239:base};
 for(const k of ['actual','remaining','forecast'])if(Object.prototype.hasOwnProperty.call(base,k))out[k]=0;
 return out;
}
function service(base,result){
 return result?.state==='active'&&result.record?.treatment==='included_in_pumpouts'?{...base,amount:0,chargeTreatment1239:result.record,treatmentLabel1239:result.label,ordinaryAmount1239:base.amount}:base;
}
function asset(model,covered,treatments){
 if(!model||!Array.isArray(model.lines)||!Array.isArray(covered)||!covered.some(v=>v===true))return model;
 const lines=model.lines.map((l,i)=>covered[i]===true?{...l,total:0,provisional:null,ordinaryTotal1239:l.total,chargeTreatment1239:treatments?.[i]||'own_use_hire'}:l);
 const base=lines.length&&lines.every(l=>l.total!=null)?lines.reduce((s,l)=>s+l.total,0):null;
 const removed=model.lines.reduce((s,l,i)=>s+(covered[i]===true&&finite(l.total)?l.total:0),0);
 return {...model,lines,base,known:finite(model.known)?model.known-removed:model.known,total:base!=null&&model.accessories!=null&&model.labour!=null?base+model.accessories+model.labour:null};
}
const API={PREFIX,TYPES,HIRE_TYPES,canonical,validate,resolve,contract,service,asset};
root.ChargeTreatment1239=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const rawRecord=key=>(S.answers||{})[PREFIX+key];
const ordinaryCharge=contractCharge;
const fields=['rental_contract','line','description','what','item','asset_no','asset_no_is_plant_number','quantity','kind','family','rate_1','rate_type','price','subhired','supplier_sub_rental','start_date','term_date','expected_term_date','booked_delivery_date','booked_pickup_date','minimum_days','location','status_as_written','sales_analysis_code','branch_code','match'];
function current(key){
 if(typeof key!=='string')return null;
 if(key.startsWith('c|')){
  const rows=ONHIRE_ROWS.filter(r=>'c|'+r.rental_contract+'|'+r.line===key);
  if(rows.length!==1)return null;
  const row=rows[0],source={kind:'contract-hire',row:Object.fromEntries(fields.map(f=>[f,copy(row[f])])),override:copy((S.lineRates||{})[key])};
  const basic=!row.charge_line&&!row.subhired&&row.kind!=='generator'&&row.family!=='generator'&&finite(row.quantity)&&row.quantity>0;
  // Separate allocation models must be reconciled in their own native flow.
  const allocated=typeof contractAllocation1010==='function'&&contractAllocation1010(row),existing=typeof contractTreatment747==='function'&&contractTreatment747(row);
  return {key,eligible:basic&&!allocated&&!existing,treatment:'own_use_hire',treatments:HIRE_TYPES.slice(),source,row,label:'Contract '+row.rental_contract+' · line '+row.line+' · '+(row.description||row.what||'')};
 }
 if(key.startsWith('service|')){
  const rows=((DATA.toilet_servicing||{}).not_on_the_card||[]).filter(l=>'service|'+l.description===key);
  if(rows.length!==1)return null;
  const row=rows[0],quotes=((DATA.rehire_quotes||{}).quotes||[]).filter(q=>q.quote===row.quote),matches=[];
  if(quotes.length===1)(quotes[0].groups||[]).forEach((g,gi)=>(g.lines||[]).forEach((l,li)=>{if(l.description===row.description)matches.push({group:gi,line:li,value:l});}));
  if(quotes.length!==1||matches.length!==1)return {key,eligible:false,treatment:'included_in_pumpouts',label:row.description,source:null};
  const q=quotes[0],m=matches[0],source={kind:'quoted-service',quote:q.quote,sha256:q.sha256,group:m.group,line:m.line,quote_line:copy(m.value),service_line:copy(row),override:copy((S.lineRates||{})[key])};
  return {key,eligible:typeof q.sha256==='string'&&/^[a-f0-9]{64}$/i.test(q.sha256)&&finite(m.value.total_price)&&m.value.total_price>=0,treatment:'included_in_pumpouts',source,row,label:row.description+' · '+q.quote};
 }
 return null;
}
function status(key){const record=rawRecord(key);return record==null?{state:'none',record:null,errors:[]}:resolve(record,current(key),todayIso());}
function make(key,input){
 const target=current(key),old=rawRecord(key),f=input||{};
 return {schema:1,key,treatment:f.treatment,source:copy(target?.source),reason:f.reason,evidence:f.evidence,confirmed_by:f.confirmed_by,confirmed_on:f.confirmed_on,
  expectedRevision:plain(old)&&Number.isInteger(old.revision)?old.revision:0,expectedRecord:canonical(old)};
}
function set(key,input){
 if(!mayWrite('a customer-charge treatment'))return false;
 const who=whoAmI();if(!who)return false;
 const f=input,old=rawRecord(key),revision=plain(old)&&Number.isInteger(old.revision)?old.revision:0;
 const allowed=['schema','key','treatment','source','reason','evidence','confirmed_by','confirmed_on','expectedRevision','expectedRecord'];
 if(!plain(f)||Object.keys(f).some(k=>!allowed.includes(k))||f.schema!==1||f.key!==key||f.expectedRevision!==revision||f.expectedRecord!==canonical(old)){
  flash('This customer-charge decision changed. Reopen it before saving.');return false;
 }
 const history=plain(old)&&Array.isArray(old.history)?copy(old.history):[];
 if(old!=null){const previous=copy(old);if(plain(previous))delete previous.history;history.push(previous);}
 const record={schema:1,kind:'customer-charge-treatment',key,revision:revision+1,treatment:f.treatment,source:copy(f.source),reason:f.reason,evidence:f.evidence,
  confirmed_by:f.confirmed_by,confirmed_on:f.confirmed_on,recorded_by:who,recorded_at:new Date().toISOString(),history};
 const errors=validate(record,current(key),todayIso());
 if(!/^c\|[^|]+\|[^|]+$|^service\|.+$/.test(key))errors.push('Unknown customer-charge target.');
 if(errors.length){flash(errors[0]);return false;}
 S.answers=S.answers||{};S.answers[PREFIX+key]=record;stampIt('answers',PREFIX+key,who);bump();return true;
}
function water(row){return service(row,status(row.key));}
contractCharge=function(row){
 const baseline=ordinaryCharge.apply(this,arguments);
 if(!row||row.charge_line||row.subhired||row.kind==='generator'||row.family==='generator')return baseline;
 return contract(baseline,status('c|'+row.rental_contract+'|'+row.line));
};
root.contractCharge=contractCharge;
const oldAssetTotal=assetTotal;
assetTotal=function(a){
 const original=oldAssetTotal.apply(this,arguments);
 if(!a||!original?.lines?.length||!Object.entries(S.answers||{}).some(([k,d])=>k.startsWith(PREFIX)&&HIRE_TYPES.includes(d?.treatment)))return original;
 const treatments=original.lines.map(l=>{
  const rows=ItemIdentity979.select(a.key,l.item,ONHIRE_ROWS,gcModel925(a).rows);
  const types=rows.map(r=>contractCharge(r).treatment);
  return types.length>0&&types.every(t=>HIRE_TYPES.includes(t))?(types.every(t=>t===types[0])?types[0]:'confirmed_hire_coverage'):null;
 });
 return asset(original,treatments.map(Boolean),treatments);
};
root.assetTotal=assetTotal;
const oldProjection=ItemCharges979.project;
ItemCharges979.project=function(){const m=oldProjection.apply(this,arguments);return {...m,lines:m.lines.map(l=>{const d=status('c|'+l.contract+'|'+l.line);return d.state!=='active'?l:d.record.treatment==='own_use_hire'?{...l,ownUse:true}:{...l,included:true,chargeTreatment1239:d.record.treatment};})};};
const oldForecast=pricingForecast1010;
pricingForecast1010=function(){
 const m=oldForecast.apply(this,arguments);if(!m?.rows?.some(r=>status('c|'+r.contract+'|'+r.line).state==='active'))return m;
 const rows=m.rows.map(r=>status('c|'+r.contract+'|'+r.line).state==='active'?{...r,amount:0,chargeTreatment1239:status('c|'+r.contract+'|'+r.line).record.treatment}:r);
 const total=rs=>Math.round(rs.reduce((s,r)=>s+(r.amount||0),0)*100)/100;
 const out={...m,rows,total:total(rows)};
 if('rehireTotal'in m)out.rehireTotal=total(rows.filter(r=>r.ledger==='1010'));
 if('hireTotal'in m)out.hireTotal=total(rows.filter(r=>r.ledger!=='1010'));
 return out;
};
root.pricingForecast1010=pricingForecast1010;
function control(key){
 const t=current(key),s=status(key);if(!t?.eligible&&s.state==='none')return '';
 const review=s.state==='review'?'<span class="chip cand" data-charge1239-review>Customer-charge decision needs review: '+esc(s.errors.join(' '))+'</span>':'';
 return review+(capability()==='edit'?'<button type="button" class="linkish" data-charge1239="'+esc(key)+'">'+(s.state==='active'?'Review charge treatment':'Customer-charge treatment')+'</button>':'');
}
function details(key){
 const s=status(key);if(s.state==='none')return '';
 const d=s.record,summary=s.state==='active'?s.label:s.state==='cleared'?'Standard charge restored':'Customer-charge decision needs review';
 const shown=v=>typeof v==='string'?v:v==null?'':'Invalid retained value — review required';
 return '<details data-charge1239-details><summary>'+esc(summary)+'</summary><p>'+esc(shown(d.reason))+'</p><p>Source: '+esc(shown(d.evidence))+'</p><p>Confirmed by '+esc(shown(d.confirmed_by))+' · '+esc(shown(d.confirmed_on))+'</p>'+
  (Array.isArray(d.history)&&d.history.length?'<details><summary>Previous decisions · '+d.history.length+'</summary>'+d.history.map(h=>'<p>'+(!plain(h)?'Unrecognised retained history entry — review required.':esc([h.treatment,h.reason,h.evidence,h.recorded_by,h.recorded_at].map(shown).join(' · ')))+'</p>').join('')+'</details>':'')+'</details>';
}
function dialog(key){
 const t=current(key),saved=status(key),old=saved.record||{};
 if(!t&&saved.state==='none')return;
 const retained=saved.state==='review'?{}:old;
 const draft=make(key,{treatment:retained.treatment||'standard',reason:retained.reason||'',evidence:retained.evidence||'',confirmed_by:retained.confirmed_by||'',confirmed_on:retained.confirmed_on||''});
 const d=document.createElement('div');d.className='drawer on';d.style.zIndex=30;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Customer-charge treatment');
 d.innerHTML='<div class="dh"><div><h2>Customer-charge treatment</h2><p>'+esc(t?.label||key)+'</p></div><button class="close" data-close1239 aria-label="Close">&times;</button></div><div class="db"><div class="form">'+
  '<p class="hint">This records an explicit customer-charge decision for this source line. Supplier Direct costs, source rates and site records remain separate.</p>'+
  '<div class="f"><label>Treatment<select data-field1239="treatment"><option value="standard">Use standard charge</option>'+(t?.eligible?(t.treatments||[t.treatment]).map(type=>'<option value="'+type+'">'+esc(TYPES[type])+'</option>').join(''):'')+'</select></label></div>'+
  [['reason','Reason'],['evidence','Source document / message and exact scope'],['confirmed_by','Confirmed by'],['confirmed_on','Confirmation date']].map(([k,l])=>'<div class="f"><label>'+l+'<input data-field1239="'+k+'" '+(k==='confirmed_on'?'type="date"':'maxlength="1000"')+' value="'+esc(draft[k]||'')+'"></label></div>').join('')+
  details(key)+'</div></div><div class="df"><button class="btn primary" data-save1239>Save treatment</button><button class="btn" data-close1239>Cancel</button></div>';
 document.body.appendChild(d);mounted(d);d.querySelector('[data-field1239="treatment"]').value=draft.treatment||'standard';
 const close=()=>d.remove();d.querySelectorAll('[data-close1239]').forEach(b=>b.onclick=close);d.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 d.querySelector('[data-save1239]').onclick=()=>{const f={...draft};d.querySelectorAll('[data-field1239]').forEach(i=>f[i.dataset.field1239]=i.value.trim());if(set(key,f))close();};
}
function waterWords(sv){
 const rows=sv?.at_cost||[],included=rows.filter(l=>l.chargeTreatment1239),ordinary=rows.filter(l=>!l.chargeTreatment1239);
 return (included.length?included.length+' water line'+(included.length===1?' is':'s are')+' included in pump-out charges, with no separate customer charge. ':'')+
  (ordinary.length?'Other quoted water lines retain their standard charge or eligible rate override. ':'')+'Supplier Direct costs remain separate and unchanged.';
}
const previousWords=contractMoneyWords;
contractMoneyWords=function(r){return previousWords.apply(this,arguments)+control('c|'+r.rental_contract+'|'+r.line);};
root.contractMoneyWords=contractMoneyWords;
const previousCard=card748Html;
card748Html=function(){
 const h=previousCard.apply(this,arguments),orphans=Object.keys(S.answers||{}).filter(k=>k.startsWith(PREFIX)).map(k=>k.slice(PREFIX.length)).filter(k=>!current(k));
 return h+(orphans.length?'<div class="notice warn">Customer-charge source decisions to review'+orphans.map(k=>'<p>'+esc(k)+' '+control(k)+details(k)+'</p>').join('')+'</div>':'');
};
root.card748Html=card748Html;
const previousServicingWords=pl767Servicing;
pl767Servicing=function(){const sv=servicing748();if(!sv?.at_cost?.some(l=>l.chargeTreatment1239))return previousServicingWords.apply(this,arguments);return 'Site quantities × event nights at the card’s pump-out rates. '+esc(waterWords(sv))+' '+esc(supplierCostWords1068(sv.supplier1068))+' Water remains '+money(sv.their_water)+' ex GST inside supplier cost.';};
root.pl767Servicing=pl767Servicing;
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-charge1239]');if(!b)return;e.preventDefault();if(capability()==='edit')dialog(b.dataset.charge1239);});
Object.assign(API,{current,status,make,set,water,control,details,dialog,waterWords,record:rawRecord});
})(typeof window==='undefined'?globalThis:window);
