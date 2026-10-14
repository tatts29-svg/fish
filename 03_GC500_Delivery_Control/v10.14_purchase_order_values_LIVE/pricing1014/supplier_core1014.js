/* Author: Andrew Fisher. Source-backed supplier prices; never customer or physical quantities. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SupplierPo1014=api;})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
const GEAR=['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','flat_feet'];
const LABOUR=['labour','team_leader','relocation','removal'];
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const key=(book,id)=>String(book||'red')+'|'+String(id||'');
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
// Parse the decimal spelling, not binary multiplication. Half cents round away from zero.
function decimal(v){if(!finite(v))return null;const s=String(v);if(!/^-?\d+(?:\.\d{1,6})?$/.test(s))return null;const [a,b='']=s.replace('-','').split('.');return{n:BigInt(a+b)*(v<0?-1n:1n),d:10n**BigInt(b.length)};}
function productCents(a,b){const x=decimal(a),y=decimal(b);if(!x||!y)return null;let n=x.n*y.n*100n,d=x.d*y.d,negative=n<0n;if(negative)n=-n;let c=n/d;if(n%d*2n>=d)c++;const value=Number(negative?-c:c);return Number.isSafeInteger(value)?value:null;}
function cents(v){const c=productCents(v,1);return c!=null&&Math.abs(c/100-v)<1e-9?c:null;}
function line(raw,label,errors){
 if(!raw||typeof raw!=='object'){errors.push(label+': missing line');return null;}
 const {column,qty,rate}=raw;
 if(!GEAR.includes(column)&&!LABOUR.includes(column))errors.push(label+': unknown cost column');
 if(!finite(qty)||qty===0||qty<0&&column!=='clean')errors.push(label+': invalid billed quantity');
 if(!finite(rate)||rate<0)errors.push(label+': invalid supplier rate');
 if(typeof raw.unit!=='string'||!raw.unit.trim())errors.push(label+': unit missing');
 const paidCents=productCents(qty,rate);
 if(paidCents==null)errors.push(label+': amount is not a valid decimal');
 if(own(raw,'amount')&&(cents(raw.amount)==null||cents(raw.amount)!==paidCents))errors.push(label+': amount differs from quantity × rate');
 return {...raw,name:String(raw.name||column||''),qty,paid_rate:rate,paid:paidCents==null?null:paidCents/100,amount:paidCents==null?null:paidCents/100,cents:paidCents};
}
function calculate(orders,current,expected={}){
 const byKey=new Map(),byNumber=new Map();
 for(const r of current||[]){const k=key(r.book,r.id),n=key(r.book,r.number);if(!byKey.has(k))byKey.set(k,[]);if(!byNumber.has(n))byNumber.set(n,[]);byKey.get(k).push(r);byNumber.get(n).push(r);}
 const result=[],claims=new Map(),extraClaims=new Map();
 for(const po of orders||[]){
  const value=po&&po.supplier_pricing;if(value==null)continue;const s=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const o={number:String(po.number),branch:po.branch||null,source:s.source||{},valid:false,errors:[],records:[],extras:[],total:null,red:0,green:0,extrasTotal:0,difference:null};result.push(o);
  const bad=o.errors;
  if(s.schema!==1||s.currency!=='AUD'||s.basis!=='ex GST')bad.push('Supplier pricing schema, currency or GST basis is unsupported');
  if(!s.source||!String(s.source.file||'').trim()||!day(s.source.date)||!/^[0-9a-f]{64}$/i.test(s.source.sha256||''))bad.push('Source file, date and fingerprint are required');
  if(!s.supplier_code||s.supplier_code!==po.supplier_code||!s.branch||s.branch!==po.branch)bad.push('Source supplier or branch does not match the P/O');
  if(expected.supplier_code&&po.supplier_code!==expected.supplier_code||expected.branch&&po.branch!==expected.branch)bad.push('Supplier allocation is outside the supported fencing supplier and branch');
  if(po.stream&&po.stream!=='fencing')bad.push('Supplier pricing belongs to the fencing stream');
  if(!Array.isArray(s.records)||!s.records.length||!Array.isArray(s.extras))bad.push('Source records and extras must be lists');
  let totalCents=0;
  for(const raw of Array.isArray(s.records)?s.records:[]){
   if(!raw||typeof raw!=='object'||Array.isArray(raw)){bad.push('Invalid source record');continue;}
   const k=key(raw.book,raw.id),label=String(raw.number||raw.id||'Record'),matches=byKey.get(k)||[],numberMatches=byNumber.get(key(raw.book,raw.number))||[];
   if(!['red','green','blue'].includes(raw.book)||!String(raw.id||'').trim()||!String(raw.number||'').trim()||!day(raw.date))bad.push(label+': identity or date missing');
   if(matches.length!==1||numberMatches.length!==1||matches[0]!==numberMatches[0])bad.push(label+': record identity is missing or ambiguous');
   else if(matches[0].date!==raw.date||matches[0].usable===false)bad.push(label+': source date or record validity changed');
   if(!claims.has(k))claims.set(k,[]);claims.get(k).push(o);
   if(!Array.isArray(raw.lines)||raw.book!=='blue'&&!raw.lines.length)bad.push(label+': billed lines missing');
   if(raw.book==='blue'&&raw.lines?.length)bad.push(label+': collections have counts only, no implied charge');
   const lines=(Array.isArray(raw.lines)?raw.lines:[]).map((l,i)=>line(l,label+' line '+(i+1),bad)).filter(Boolean);
   if(raw.book==='green'&&lines.some(l=>!LABOUR.includes(l.column)))bad.push(label+': a service note cannot allocate fencing gear');
   const rc=lines.reduce((v,l)=>v+(l.cents||0),0);if(!Number.isSafeInteger(rc))bad.push(label+': total exceeds supported precision');
   totalCents+=rc;if(raw.book==='red')o.red+=rc;if(raw.book==='green')o.green+=rc;
   const current=matches.length===1?matches[0]:null;
   o.records.push({...raw,key:k,lines,amount:rc/100,cents:rc,po:o.number,branch:o.branch,current_location:current?.location||'',current_reference:current?.map_ref||''});
  }
  for(const raw of Array.isArray(s.extras)?s.extras:[]){
   if(!raw||typeof raw!=='object'||Array.isArray(raw)){bad.push('Invalid dated extra');continue;}
   const label=String(raw.id||'Extra');
   if(!String(raw.id||'').trim()||!day(raw.date)||raw.column!=='team_leader'||raw.unit!=='day'||!(raw.qty>0))bad.push(label+': dated team-leader day cost required');
   const ek=String(raw.id||'');if(!extraClaims.has(ek))extraClaims.set(ek,[]);extraClaims.get(ek).push(o);
   const l=line(raw,label,bad);if(!l)continue;totalCents+=l.cents||0;o.extrasTotal+=l.cents||0;o.extras.push({...l,po:o.number,branch:o.branch});
  }
  if(!Number.isSafeInteger(totalCents)||cents(s.total)==null||cents(s.total)!==totalCents)bad.push('Source total does not match its priced lines and dated extras');
  o.total=totalCents/100;o.red/=100;o.green/=100;o.extrasTotal/=100;
  const pc=typeof po.amount==='string'&&po.amount.trim()?cents(Number(po.amount)):cents(po.amount);
  o.difference=pc==null?null:(totalCents-pc)/100;
 }
 for(const [k,os]of claims)if(os.length>1)for(const o of os)o.errors.push('Record allocated more than once: '+k);
 for(const [k,os]of extraClaims)if(os.length>1)for(const o of os)o.errors.push('Extra allocated more than once: '+k);
 const records=new Map(),extras=[],issues=[];
 for(const o of result){o.errors=[...new Set(o.errors)];o.valid=!o.errors.length;if(o.valid){for(const r of o.records)records.set(r.key,r);extras.push(...o.extras);}else issues.push({number:o.number,errors:o.errors});}
 return {orders:result,records,extras,issues};
}
return {calculate,key,cents,productCents,GEAR,LABOUR};
});
