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
 '9968955|165':247445,'9968862|133':2492154,'9968862|139':199872,'9968862|141':228467,
 '9994954|5':149904,'9994954|17':141576,'9994954|20':331038,'9994954|23':94744,
 '9994954|25':67550,'9994954|26':41013,'9961976|56':473597,'9961265|44':592410
});
const installationBranch=key=>key==='9961976|56'?'NVAC':key==='9961265|44'?'STPS':'KINP';
const policy=Object.freeze({cleaning:'retained',installationCoverage:'install,steps,levelling,demob',source:'Approved named contract rows only; no full source import'});
const installationKeys=new Set(['install','steps','levelling','demob']);
const toiletBlocks=new Set(['WC05','WC15','WC16','WC17','WC20','WC27','WC60']);
const accessible=new Set(['WC01','WC31','WC51','WC86']);
function isInstallation(r){return !!r&&Object.hasOwn(installation,id(r))&&r.item==='LABOUR'&&r.item_type_code===2&&r.branch_code===installationBranch(id(r))&&r.sales_analysis_code===installationBranch(id(r))+'-INS'&&!r.subhired&&!r.subhired_machine;}
function contractCharge(r){
 if(!r||r.ruled1255SupplierBasis)return null;
 if(Object.hasOwn(installation,id(r))){
  if(!isInstallation(r)||typeof r.quantity!=='number'||!Number.isFinite(r.quantity)||typeof r.price!=='number'||!Number.isFinite(r.price)||cents(r.quantity*r.price)!==installation[id(r)])throw Error('Ruled Installation source changed: '+id(r));
  return {amount:dollars(installation[id(r)]),rate:r.price,qty:r.quantity,how:'charge line',days:null,daily:false,ledger:'1047',ruled1255:{source:id(r),route:'contract-installation'},basis:'Approved contract Installation; covered customer card components are included once'};
 }
 const hire=approvedHire(r);if(hire)return hire;
 if(id(r)==='9994954|12'){
  if(r.rate_1!==0||r.price!==0||r.branch_code!=='KINP')throw Error('Ruled cable zero source changed');
  return {amount:0,rate:0,qty:r.quantity,how:'whole event',days:null,daily:false,ruled1255:{source:id(r),route:'explicit-source-zero'},basis:'Approved source line has no customer charge'};
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
 if(ref==='WC09'&&item==='Toilet Block 6m')return '9994954|17';
 if(ref==='WC09'&&item==='Pee Panel')return '9994954|20';
 if(contract==='9994954'&&['P38','P39','P42'].includes(ref)&&item==='Building 6m')return '9994954|5';
 if(contract==='9968862'&&/^(?:Building|Ticket Box) (?:3\.6|4\.8|6|9\.6|12)m$/.test(item))return '9968862|133 + 9968862|139';
 return null;
}
function projectLabour(info,ref,item,assignments){
 const source=coverage(ref,item,assignments);if(!source||!info||!Array.isArray(info.lines))return info;
 const lines=info.lines.map(L=>!installationKeys.has(L.key)||L.covered1255?L:{...L,sourceRate1255:L.rate,sourceMoney1255:L.money,rate:0,money:'rate',covered1255:{source,category:'Installation'},money_note:'Included in contract Installation; physical completion tracked separately'});
 return {...info,lines,coverage1255:{source,category:'Installation',cleaning:'retained'}};
}
// Display uses the same covered source as the money projection; never infer inclusion from zero alone.
function coveredChargeDisplay(line,ref,item,assignments){
 if(!line||!installationKeys.has(line.key)||!coverage(ref,item,assignments)||line.rate!==0||line.value!==0)return null;
 return {rate:'Included',charge:'Included'};
}
function coverageText(charges,ref,item,assignments){
 if(!(charges||[]).some(line=>coveredChargeDisplay(line,ref,item,assignments)))return '';
 const source=coverage(ref,item,assignments).split(' + ').map(key=>key.replace('|',' line ')).join(' and ');
 return 'Installation included in contract '+source+'. Physical completion is recorded separately.';
}
function itemSummary(text,ref,item,assignments){return coverage(ref,item,assignments)?text+' item subtotal · Installation charged on contract':text;}
function workLabel(line){return line?.covered1255?.category==='Installation'?'Included in contract Installation':null;}
function projectFire(value){
 if(!value||value.covered1255)return value;
 return {...value,sourceRate1255:value.rate,sourceAmount1255:value.amount,rate:0,amount:0,covered1255:{source:'9968862|137',category:'Fire extinguishers',outcome:'no customer per-piece charge'}};
}
const scopeSources=Object.freeze({pm:['9968862|141','9968955|164'],toilets:['9968955|165'],gentech:['9961976|56'],vms:['9961265|44'],gentech_ent:['9994954|25'],toilets_ent:['9994954|26']});
function projectScopeLine(row){
 if(!row||!Object.hasOwn(scopeSources,row.key)||row.covered1255)return row;
 const sources=scopeSources[row.key],source=sources.join(' + '),approved=sources.reduce((n,key)=>n+installation[key],0);
 if(cents(row.amount)!==approved||cents(row.amount_exact)!==approved)throw Error('Ruled event scope coverage changed: '+row.key);
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
// Customer outcomes explicitly ruled in PR #1; no pre-bill fields are inputs.
const hireOutcomes=Object.freeze({
 "9992300|4": {
  "amountCents": 188172,
  "quantity": 1,
  "rate": 209.08,
  "branch": "MEAD",
  "salesCode": "MEAD-HIR",
  "days": 9
 },
 "9992300|5": {
  "amountCents": 155475,
  "quantity": 1,
  "rate": 310.95,
  "branch": "MEAD",
  "salesCode": "MEAD-HIR",
  "days": 5
 },
 "9997710|1": {
  "amountCents": 20736,
  "quantity": 144,
  "rate": 0.12,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 12
 },
 "9997710|3": {
  "amountCents": 22530,
  "quantity": 30,
  "rate": 7.51,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": null
 },
 "9994248|1": {
  "amountCents": 61250,
  "quantity": 35,
  "rate": 17.5,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": null
 },
 "9994248|2": {
  "amountCents": 63000,
  "quantity": 45,
  "rate": 14,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": null
 },
 "9994248|3": {
  "amountCents": 5280,
  "quantity": 24,
  "rate": 2.2,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": null
 },
 "9994954|19": {
  "amountCents": 403302,
  "quantity": 6,
  "rate": 672.17,
  "branch": "KINP",
  "salesCode": "KINP-HIR",
  "days": null
 },
 "9961265|1": {
  "amountCents": 85776,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 16
 },
 "9961265|3": {
  "amountCents": 273411,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 51
 },
 "9961265|8": {
  "amountCents": 273411,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 51
 },
 "9961265|4": {
  "amountCents": 278772,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 52
 },
 "9961265|5": {
  "amountCents": 278772,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 52
 },
 "9961265|6": {
  "amountCents": 278772,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 52
 },
 "9961265|7": {
  "amountCents": 278772,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 52
 },
 "9961265|9": {
  "amountCents": 278772,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 52
 },
 "9961265|12": {
  "amountCents": 112581,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 21
 },
 "9961265|13": {
  "amountCents": 112581,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 21
 },
 "9961265|15": {
  "amountCents": 58971,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 11
 },
 "9961265|16": {
  "amountCents": 69693,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 13
 },
 "9961265|24": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 10
 },
 "9961265|25": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 10
 },
 "9961265|30": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 10
 },
 "9961265|32": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 10
 },
 "9961265|34": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 10
 },
 "9961265|35": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 10
 },
 "9961265|37": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 10
 },
 "9961265|39": {
  "amountCents": 53610,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 10
 },
 "9961265|26": {
  "amountCents": 42888,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 8
 },
 "9961265|28": {
  "amountCents": 37527,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 7
 },
 "9961265|29": {
  "amountCents": 37527,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "KINP-SUB",
  "days": 7
 },
 "9961265|31": {
  "amountCents": 37527,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "NVAC-SUB",
  "days": 7
 },
 "9961265|43": {
  "amountCents": 37527,
  "quantity": 1,
  "rate": 53.61,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 7
 },
 "9972648|3": {
  "amountCents": 28084,
  "quantity": 34,
  "rate": 1.18,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 7
 },
 "9972648|4": {
  "amountCents": 16992,
  "quantity": 12,
  "rate": 1.18,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 12
 },
 "9972648|5": {
  "amountCents": 18408,
  "quantity": 13,
  "rate": 1.18,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 12
 },
 "9972648|6": {
  "amountCents": 92040,
  "quantity": 60,
  "rate": 1.18,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 13
 },
 "9972648|16": {
  "amountCents": 92040,
  "quantity": 60,
  "rate": 1.18,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 13
 },
 "9972648|17": {
  "amountCents": 52156,
  "quantity": 34,
  "rate": 1.18,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": 13
 },
 "9972648|18": {
  "amountCents": 472,
  "quantity": 4,
  "rate": 1.18,
  "branch": "STPS",
  "salesCode": "STPS-HIR",
  "days": null
 }
});
function approvedHire(r){
 const p=hireOutcomes[id(r)];if(!p)return null;
 if(r.quantity!==p.quantity||r.rate_1!==p.rate||r.branch_code!==p.branch||r.sales_analysis_code!==p.salesCode||r.charge_line)throw Error('Ruled customer Hire source changed: '+id(r));
 return {amount:dollars(p.amountCents),rate:p.rate,qty:p.quantity,how:p.days===null?'whole event':'per day',days:p.days,daily:p.days!==null,
  ruled1255:{source:id(r),route:'approved-customer-hire',commercialDays:p.days,physicalDatesUnchanged:true},
  basis:p.days===null?'Approved contract line amount; no site date or duration inferred':'Approved contract billing: '+p.quantity+' × $'+p.rate.toFixed(2)+' × '+p.days+' days; site dates remain separately recorded'};
}
const supplierBasisRows=new Set([13,15,24,25,26,28,29,30,31].map(line=>'9961265|'+line));
function supplierCharge(row,charge,readCharge){
 if(!supplierBasisRows.has(id(row)))return charge;
 // These nine source quantity/rate/date/minimum fields are unchanged by the source patch.
 // The transient flag restores the complete predecessor getter stack for cost calculation only.
 return readCharge({...row,ruled1255SupplierBasis:true});
}
function peeOwner(row){
 if(id(row)!=='9994954|19')return null;
 if(row.quantity!==6||row.rate_1!==672.17||row.branch_code!=='KINP'||row.sales_analysis_code!=='KINP-HIR'||row.family!=='toilet'||row.charge_line)throw Error('Pee Panel source coverage changed');
 return {owner:'event-portables',rehire:true,basis:'Existing WC09 Pee Panel Rehire coverage retained on its approved contract source',ruled1255:{source:id(row),replaces:'PeeHire979',additionalSupplierCost:0}};
}
// Preserve the existing WC09 financial read path when its already-covered source row arrives.
// This projection does not allocate an asset or write the imported row's unmatched source evidence.
function selectPee(selected,ref,item,contracts){
 if(ref!=='WC09'||item!=='Pee Panel')return selected;
 const sources=(contracts||[]).filter(row=>id(row)==='9994954|19');
 if(!sources.length)return selected;
 if(sources.length!==1)throw Error('Pee Panel source identity is not unique');
 const row=sources[0];peeOwner(row);
 if(row.asset_no_is_plant_number||row.item!=='MISCITEM'||row.item_type_code!==1||row.register_type!=='Pee Panel'||row.description!=='Pee Panels')throw Error('Pee Panel reader identity changed');
 if((selected||[]).some(row=>id(row)==='9994954|19'))return selected;
 return (selected||[]).concat({...row,register_type:item,match:{...row.match,key:ref},financialRead1255:{source:id(row),ref,item,basis:'Existing six-panel WC09 customer coverage; source allocation remains unchanged'}});
}
function associationCharge(row,out){
 if(id(row)!=='9992300|12'||!out||out.treatment||!Number.isFinite(out.amount))return out;
 if(row.quantity!==1||row.rate_1!==310.95||row.branch_code!=='MEAD')throw Error('Financial association approved source changed');
 return {...out,amount:1554.75,days:5,how:'per day',daily:true,ruled1255:{source:id(row),route:'existing-financial-association',commercialDays:5,physicalDatesUnchanged:true},basis:'Approved Baseplan billing: $310.95 × 5 days; existing source association and site record retained'};
}
const api=Object.freeze({installation,installationBranch,policy,hireOutcomes,isInstallation,contractCharge,approvedHire,supplierCharge,peeOwner,selectPee,associationCharge,coverage,projectLabour,coveredChargeDisplay,coverageText,itemSummary,workLabel,projectFire,projectScopeLine,allocationSlot,shareAllocation,onsiteAllocationSlot,allocationValue});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.RuledFinance1255=api;
})(typeof window==='undefined'?globalThis:window);
