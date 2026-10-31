/* Author: Andrew Fisher. Exact customer Revenue branch decisions; supplier and physical records stay separate. */
(function(root){
'use strict';
const PREFIX='revenue-branch1240|',KIND='customer-revenue-branch';
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v),text=v=>typeof v==='string'&&v.trim().length>0;
const copy=v=>v==null?null:JSON.parse(JSON.stringify(v));
const canonical=v=>JSON.stringify(v==null?null:Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):plain(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const validKey=k=>typeof k==='string'&&(/^(c)\|[^|]+\|[^|]+$/.test(k)||/^scope\|[a-z][a-z0-9_]*$/.test(k));
function validate(record,target,today){
 const errors=[],fields=['schema','kind','key','revision','branch','source','reason','evidence','confirmed_by','confirmed_on','recorded_by','recorded_at','history'];
 if(!plain(record)||record.schema!==1||record.kind!==KIND)return ['Unrecognised Revenue branch decision.'];
 const content=(r,historical=false)=>{
  if(!plain(r)||r.schema!==1||r.kind!==KIND||r.key!==record.key||Object.keys(r).some(k=>!fields.includes(k)||historical&&k==='history'))return false;
  if(!validKey(r.key)||!Number.isSafeInteger(r.revision)||r.revision<1||typeof r.branch!=='string'||r.branch!==''&&!/^[A-Z][A-Z0-9_-]{1,19}$/.test(r.branch))return false;
  if(!text(r.reason)||r.reason.length>1000||!text(r.evidence)||r.evidence.length>1000||!text(r.confirmed_by)||!date(r.confirmed_on)||(today&&r.confirmed_on>today)||!text(r.recorded_by))return false;
  const at=typeof r.recorded_at==='string'?Date.parse(r.recorded_at):NaN;
  return Number.isFinite(at)&&new Date(at).toISOString()===r.recorded_at&&(!today||r.recorded_at.slice(0,10)<=today)&&(r.branch===''||plain(r.source));
 };
 if(!content(record))errors.push('Decision identity, confirmation or recording audit is incomplete.');
 if(!Array.isArray(record.history)||record.history.some((h,i)=>!content(h,true)||h.revision!==i+1)||record.revision!==(record.history?.length||0)+1)errors.push('Decision revision and retained history do not agree.');
 if(record.branch==='')return errors;
 if(!target||!target.eligible||target.key!==record.key)errors.push('The exact customer Revenue source is unavailable or unsupported.');
 else {
  if(!target.allowedBranches?.includes(record.branch))errors.push('Choose a current project branch.');
  if(canonical(record.source)!==canonical(target.source))errors.push('Source or its current allocation changed; review this Revenue branch decision.');
 }
 return errors;
}
function resolve(record,target,today){
 if(record==null)return {state:'none',record:null,errors:[]};
 const errors=validate(record,target,today);
 return {state:errors.length?'review':record.branch===''?'cleared':'active',record,errors};
}
function effective(original,result){return result?.state==='active'?result.record.branch:original;}
const API={PREFIX,KIND,canonical,validate,resolve,effective};root.RevenueBranch1240=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const ordinaryBranch=generatorBranch1004;
const fields=['rental_contract','line','description','what','item','asset_no','asset_no_is_plant_number','quantity','kind','family','rate_1','rate_2','rate_type','price','subhired','supplier_sub_rental','charge_line','start_date','term_date','expected_term_date','booked_delivery_date','booked_pickup_date','minimum_days','location','status_as_written','sales_analysis_code','branch_code','match'];
const roles={pm:'KINP',gentech:'NVAC',fence:'STPS',toilets:'KINP',vms:'STPS',gentech_ent:'NVAC',toilets_ent:'KINP'};
const branches=()=>[...new Set((BRANCHES.branches||[]).map(b=>b.code).filter(b=>typeof b==='string'&&b))];
const raw=key=>(S.answers||{})[PREFIX+key];
function current(key){
 if(!validKey(key))return null;
 const allowedBranches=branches();
 if(key.startsWith('c|')){
  const rows=ONHIRE_ROWS.filter(r=>'c|'+r.rental_contract+'|'+r.line===key);if(rows.length!==1)return null;
  const row=rows[0],base=ordinaryBranch(row),allocation=typeof contractAllocation1010==='function'&&contractAllocation1010(row);
  return {key,eligible:!row.charge_line&&row.kind!=='generator'&&row.family!=='generator'&&!generatorContract1004(row)&&!allocation&&allowedBranches.includes(base),allowedBranches,
   label:'Contract '+row.rental_contract+' · line '+row.line+' · '+(row.description||row.what||''),branch:base,
   source:{kind:'contract-revenue',row:Object.fromEntries(fields.map(k=>[k,copy(row[k])])),ordinaryBranch:base,rateOverride:copy((S.lineRates||{})[key])}};
 }
 const role=key.slice(6),lines=(SCOPE?.lines||[]).filter(l=>l.key===role),calculated=(scopeFigures()?.lines||[]).filter(l=>l.key===role);
 if(lines.length!==1||calculated.length!==1||!Object.prototype.hasOwnProperty.call(roles,role))return null;
 return {key,eligible:allowedBranches.includes(roles[role]),allowedBranches,label:calculated[0].role,branch:roles[role],
  source:{kind:'event-scope-role',document:SCOPE.document,supplied_on:SCOPE.supplied_on,line:copy(lines[0]),access_plan:copy(SCOPE.access_plan),current:copy(calculated[0]),ordinaryBranch:roles[role]}};
}
function status(key){const record=raw(key);return record==null?{state:'none',record:null,errors:[]}:resolve(record,current(key),todayIso());}
function branch(key,original){return effective(original,status(key));}
function make(key,input){
 const target=current(key),old=raw(key),f=input||{};
 return {schema:1,key,branch:f.branch,source:copy(target?.source),reason:f.reason,evidence:f.evidence,confirmed_by:f.confirmed_by,confirmed_on:f.confirmed_on,
  expectedRevision:plain(old)&&Number.isInteger(old.revision)?old.revision:0,expectedRecord:canonical(old)};
}
function set(key,input){
 if(!mayWrite('a customer Revenue branch'))return false;const who=whoAmI();if(!who)return false;
 const f=input,old=raw(key),revision=plain(old)&&Number.isInteger(old.revision)?old.revision:0,allowed=['schema','key','branch','source','reason','evidence','confirmed_by','confirmed_on','expectedRevision','expectedRecord'];
 if(!plain(f)||Object.keys(f).some(k=>!allowed.includes(k))||f.schema!==1||f.key!==key||f.expectedRevision!==revision||f.expectedRecord!==canonical(old)){
  flash('This Revenue branch decision changed. Reopen it before saving.');return false;
 }
 const history=plain(old)&&Array.isArray(old.history)?copy(old.history):[];
 if(old!=null){const previous=copy(old);if(plain(previous))delete previous.history;history.push(previous);}
 const record={schema:1,kind:KIND,key,revision:revision+1,branch:f.branch,source:copy(f.source),reason:f.reason,evidence:f.evidence,
  confirmed_by:f.confirmed_by,confirmed_on:f.confirmed_on,recorded_by:who,recorded_at:new Date().toISOString(),history};
 const errors=validate(record,current(key),todayIso());if(errors.length){flash(errors[0]);return false;}
 S.answers=S.answers||{};S.answers[PREFIX+key]=record;stampIt('answers',PREFIX+key,who);bump();return true;
}
generatorBranch1004=function(row){const original=ordinaryBranch.apply(this,arguments);return row?branch('c|'+row.rental_contract+'|'+row.line,original):original;};
root.generatorBranch1004=generatorBranch1004;
// Remaining contract hire uses the same financial reader; no supplier or physical branch is changed.
const ordinaryForecast=pricingForecast1010;
pricingForecast1010=function(){const m=ordinaryForecast.apply(this,arguments);return !m?.rows?.some(r=>status('c|'+r.contract+'|'+r.line).state==='active')?m:{...m,rows:m.rows.map(r=>({...r,branch:branch('c|'+r.contract+'|'+r.line,r.branch)}))};};
root.pricingForecast1010=pricingForecast1010;
function details(key){
 const s=status(key);if(s.state==='none')return '';const d=s.record,shown=v=>typeof v==='string'?v:v==null?'':'Invalid retained value — review required';
 const title=s.state==='active'?'Revenue branch '+d.branch:s.state==='cleared'?'Source Revenue branch restored':'Revenue branch decision needs review';
 return '<details data-revenue1240-details><summary>'+esc(title)+'</summary><p>'+esc(shown(d.reason))+'</p><p>Source: '+esc(shown(d.evidence))+'</p><p>Confirmed by '+esc(shown(d.confirmed_by))+' · '+esc(shown(d.confirmed_on))+'</p><p>Supplier costs, source sales codes and site records are unchanged.</p>'+
  (Array.isArray(d.history)&&d.history.length?'<details><summary>Previous decisions · '+d.history.length+'</summary>'+d.history.map(h=>'<p>'+(!plain(h)?'Unrecognised retained history entry — review required.':esc([h.branch||'Source branch',h.reason,h.evidence,h.recorded_by,h.recorded_at].map(shown).join(' · ')))+'</p>').join('')+'</details>':'')+'</details>';
}
function control(key){
 const t=current(key),s=status(key);if(!t?.eligible&&s.state==='none')return '';
 return (s.state==='review'?'<span class="chip cand" data-revenue1240-review>Revenue branch decision needs review: '+esc(s.errors.join(' '))+'</span>':'')+
  (capability()==='edit'?'<button type="button" class="linkish" data-revenue1240="'+esc(key)+'">'+(s.state==='active'?'Review Revenue branch':'Revenue branch')+'</button>':'')+details(key);
}
function dialog(key){
 const t=current(key),saved=status(key);if(!t&&saved.state==='none')return;const old=saved.state==='review'?{}:saved.record||{},draft=make(key,{branch:old.branch||'',reason:old.reason||'',evidence:old.evidence||'',confirmed_by:old.confirmed_by||'',confirmed_on:old.confirmed_on||''});
 const d=document.createElement('div');d.className='drawer on';d.style.zIndex=30;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Customer Revenue branch');
 d.innerHTML='<div class="dh"><div><h2>Customer Revenue branch</h2><p>'+esc(t?.label||key)+'</p></div><button class="close" data-close1240 aria-label="Close">&times;</button></div><div class="db"><div class="form"><p class="hint">Allocate this exact customer charge to the confirmed branch. The amount, charge category, supplier costs, source sales codes and site records stay unchanged.</p>'+
  '<div class="f"><label>Revenue branch<select data-field1240="branch"><option value="">Use source allocation'+(t?.branch?' · '+esc(t.branch):'')+'</option>'+(t?.eligible?t.allowedBranches.map(b=>'<option value="'+esc(b)+'">'+esc(b)+'</option>').join(''):'')+'</select></label></div>'+
  [['reason','Reason'],['evidence','Source document / message and exact scope'],['confirmed_by','Confirmed by'],['confirmed_on','Confirmation date']].map(([k,l])=>'<div class="f"><label>'+l+'<input data-field1240="'+k+'" '+(k==='confirmed_on'?'type="date"':'maxlength="1000"')+' value="'+esc(draft[k]||'')+'"></label></div>').join('')+details(key)+'</div></div><div class="df"><button class="btn primary" data-save1240>Save Revenue branch</button><button class="btn" data-close1240>Cancel</button></div>';
 document.body.appendChild(d);mounted(d);d.querySelector('[data-field1240="branch"]').value=draft.branch;
 const close=()=>d.remove();d.querySelectorAll('[data-close1240]').forEach(b=>b.onclick=close);d.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 d.querySelector('[data-save1240]').onclick=()=>{const f={...draft};d.querySelectorAll('[data-field1240]').forEach(i=>f[i.dataset.field1240]=i.value.trim());if(set(key,f))close();};
}
const ordinaryWords=contractMoneyWords;contractMoneyWords=function(row){return ordinaryWords.apply(this,arguments)+control('c|'+row.rental_contract+'|'+row.line);};root.contractMoneyWords=contractMoneyWords;
const ordinaryCard=card748Html;card748Html=function(){const html=ordinaryCard.apply(this,arguments),missing=Object.keys(S.answers||{}).filter(k=>k.startsWith(PREFIX)).map(k=>k.slice(PREFIX.length)).filter(k=>!current(k));return html+(missing.length?'<div class="notice warn">Revenue branch sources to review'+missing.map(k=>'<p>'+esc(k)+' '+control(k)+'</p>').join('')+'</div>':'');};root.card748Html=card748Html;
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-revenue1240]');if(!b)return;e.preventDefault();if(capability()==='edit')dialog(b.dataset.revenue1240);});
Object.assign(API,{current,status,branch,make,set,control,details,dialog});
})(typeof window!=='undefined'?window:globalThis);
