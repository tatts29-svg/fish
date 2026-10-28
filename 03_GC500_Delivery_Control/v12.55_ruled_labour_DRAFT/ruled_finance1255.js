/* Author: Andrew Fisher. Contract Installation coverage projection, separately scoped after v12.54.
 * DRAFT: Installation-only coverage; Cleaning retained pending the separate scope ruling.
 * No physical completion, source Price, supplier cost, quantity or persistent record changes.
 */
(function(root){
'use strict';
const cents=v=>Math.round(v*100), dollars=v=>v/100, id=r=>r&&String(r.rental_contract)+'|'+String(r.line);
const installation=Object.freeze({
 '9973977|2':70788,'9968955|144':849456,'9968955|145':70792,
 '9968955|146':1581496,'9968955|160':110346,'9968955|164':228467,
 '9968955|165':247445,'9968862|133':2492154,'9968862|139':199872,'9968862|141':228467
});
const installationKeys=new Set(['install','steps','levelling','demob']);
const toiletBlocks=new Set(['WC05','WC15','WC16','WC17','WC20','WC27','WC60']);
const accessible=new Set(['WC01','WC31','WC51','WC86']);
function isInstallation(r){return !!r&&Object.hasOwn(installation,id(r))&&r.item==='LABOUR'&&r.item_type_code===2&&r.branch_code==='KINP'&&r.sales_analysis_code==='KINP-INS'&&!r.subhired&&!r.subhired_machine;}
function contractCharge(r){
 if(!r)return null;
 if(Object.hasOwn(installation,id(r))){
  if(!isInstallation(r)||typeof r.quantity!=='number'||!Number.isFinite(r.quantity)||typeof r.price!=='number'||!Number.isFinite(r.price)||cents(r.quantity*r.price)!==installation[id(r)])throw Error('Ruled Installation source changed: '+id(r));
  return {amount:dollars(installation[id(r)]),rate:r.price,qty:r.quantity,ledger:'1047',ruled1255:{source:id(r),route:'contract-installation'},basis:'Approved contract Installation; covered customer card components are included once'};
 }
 return null;
}
function coverage(ref,item,assignments){
 const contract=String((assignments||{})[ref]?.rental_contract||'');
 if(contract==='9973977'&&ref==='T0243'&&item==='Toilet Block 6m')return '9973977|2';
 if(contract==='9968955'){
  if(item==='Toilet Block 6m'&&toiletBlocks.has(ref))return '9968955|144';
  if(item==='Accessible Toilet'&&accessible.has(ref))return '9968955|145';
  if(ref==='WC31'&&item==='16Pan Block')return '9968955|160';
 }
 if(contract==='9968862'&&/^(?:Building|Ticket Box) (?:3\.6|4\.8|6|9\.6|12)m$/.test(item))return '9968862|133 + 9968862|139';
 return null;
}
function projectLabour(info,ref,item,assignments){
 const source=coverage(ref,item,assignments);if(!source||!info||!Array.isArray(info.lines))return info;
 const lines=info.lines.map(L=>!installationKeys.has(L.key)||L.covered1255?L:{...L,sourceRate1255:L.rate,sourceMoney1255:L.money,rate:0,money:'rate',covered1255:{source,category:'Installation'},money_note:'Included in contract Installation; physical completion tracked separately'});
 return {...info,lines,coverage1255:{source,category:'Installation',cleaning:'retained'}};
}
function projectFire(value){
 if(!value||value.covered1255)return value;
 return {...value,sourceRate1255:value.rate,sourceAmount1255:value.amount,rate:0,amount:0,covered1255:{source:'9968862|137',category:'Fire extinguishers',outcome:'no customer per-piece charge'}};
}
function projectScopeLine(row){
 if(!row||!['pm','toilets'].includes(row.key)||row.covered1255)return row;
 const source=row.key==='pm'?'9968862|141 + 9968955|164':'9968955|165';
 return {...row,sourceAmount1255:row.amount,sourceAmountExact1255:row.amount_exact,amount:0,amount_exact:0,covered1255:{source,category:'Installation'}};
}
function allocationSlot(slot,L){
 if(!L||!Object.hasOwn(L,'sourceRate1255'))return slot;
 return {...slot,sourceRate1255:L.sourceRate1255,sourceValue1255:typeof L.sourceRate1255==='number'&&slot.qty!=null?L.sourceRate1255*slot.qty:null,covered1255:L.covered1255};
}
function shareAllocation(slots){
 const groups=new Map();slots.filter(s=>Object.hasOwn(s,'sourceValue1255')&&s.sourceValue1255!=null).forEach(s=>{const key=[s.ref,s.disc,s.item,s.key].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);});
 groups.forEach(G=>{const rate=G[0].sourceRate1255,nAll=G.reduce((n,s)=>n+(s.qty||0),0),nT=G.filter(s=>s.state==='charged').reduce((n,s)=>n+(s.qty||0),0),F=cents(rate*nAll),C=cents(rate*nT);
  const share=(list,total)=>{let acc=0;list.forEach((s,i)=>{const value=i===list.length-1?total-acc:cents(rate*(s.qty||0));s.sourceValue1255=dollars(value);acc+=value;});};share(G.filter(s=>s.state==='charged'),C);share(G.filter(s=>s.state!=='charged'),F-C);
 });return slots;
}
function onsiteAllocationSlot(slot,row){
 if(!row||!Object.hasOwn(row,'sourceRate1255'))return slot;
 const rate=row.sourceRate1255, round=v=>Math.round((v+Number.EPSILON)*100)/100;
 const current=row.qty==null||!Number.isFinite(rate)?null:round(rate*row.qty);
 const forecast=row.forecastQty==null||!Number.isFinite(rate)?null:round(rate*row.forecastQty);
 const value=slot.state==='charged'?current:forecast==null||current==null?null:round(forecast-current);
 return {...slot,sourceRate1255:rate,sourceValue1255:value,covered1255:row.covered1255};
}
function allocationValue(slot){return Object.hasOwn(slot,'sourceValue1255')?slot.sourceValue1255:slot.value;}
const api=Object.freeze({installation,isInstallation,contractCharge,coverage,projectLabour,projectFire,projectScopeLine,allocationSlot,shareAllocation,onsiteAllocationSlot,allocationValue});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.RuledFinance1255=api;
})(typeof window==='undefined'?globalThis:window);
