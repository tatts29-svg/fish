/* Author: Andrew Fisher. Generator evidence is read from the same shared record as every other page. */
function generatorSourceResolve1004(context){
 'use strict';
 const list=v=>Array.isArray(v)?v:[],text=v=>String(v==null?'':v).trim();
 const day=v=>{const s=text(v);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const n=Date.parse(s+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s?s:null;};
 const aest=v=>{const n=Date.parse(text(v));return Number.isFinite(n)?new Date(n+36000000).toISOString().slice(0,10):null;};
 const first=values=>values.filter(Boolean).sort()[0]||null;
 const numbers=values=>[...new Set(values.map(text).filter(n=>/^\d{5,8}$/.test(n)))];
 const rows=list(context.contractRows).filter(r=>r&&(r.kind==='generator'||r.family==='generator')&&!r.charge_line);
 const assets=list(context.assets).filter(a=>a&&a.discipline==='Generators');
 const byRef=new Map(assets.map(a=>[a.key,a]));
 const state=context.state||{},claimed=new Set(),out=[];
 const contractId=r=>text(r.rental_contract)+':'+text(r.line);
 function matchRef(r){
  const m=r.match||{};
  if(m.key&&byRef.has(m.key))return m.key;
  if(m.task_id&&byRef.has(m.task_id))return m.task_id;
  const found=text(r.description).match(/^GN\s*[- ]?\s*(\d+)\b/i);
  if(found){const ref='GN'+String(Number(found[1])).padStart(2,'0');if(byRef.has(ref))return ref;}
  return null;
 }
 function sourceDate(a,contracts,delivery){
  const explicit=a&&day((state.hireStart||{})[a.key]);
  const history=list(delivery.history).filter(h=>h&&h.state==='on site').map(h=>aest(h.at));
  if(delivery.state==='on site')history.push(aest(delivery.set_at));
  const observed=first(history),rental=first(contracts.filter(r=>r.delivered===true).map(r=>day(r.start_date)));
  if(explicit)return {date:explicit,source:'Recorded hire start'};
  if(rental)return {date:rental,source:'Delivered contract line'};
  if(observed)return {date:observed,source:'Recorded on-site arrival (AEST)'};
  return {date:null,source:null};
 }
 function confirmedNumbers(a,contracts){
  if(a&&Object.prototype.hasOwnProperty.call(state.assetNumbers||{},a.key))return numbers(list(state.assetNumbers[a.key]));
  const supplied=a?list(context.units(a.key)).filter(u=>u&&text(u.by)&&aest(u.at)&&/generator|kva/i.test(text(u.label))&&!/board|cable|distribution/i.test(text(u.label))).map(u=>u.asset_no):[];
  const delivered=contracts.filter(r=>r.delivered===true&&day(r.start_date)&&r.asset_no_is_plant_number===true).map(r=>r.asset_no);
  return numbers(supplied.concat(delivered));
 }
 function build(a,contracts){
  const ref=a?a.key:null,d=a?(context.delivery(a.key)||{}):{};
  const lines=a?list(context.lines(a)).filter(l=>!l.item||/generator|kva/i.test(text(l.item))):[];
  const qty=a?lines.reduce((n,l)=>n+(typeof l.quantity==='number'&&Number.isFinite(l.quantity)&&l.quantity>0?l.quantity:0),0):contracts.reduce((n,r)=>n+(typeof r.quantity==='number'&&Number.isFinite(r.quantity)&&r.quantity>0?r.quantity:0),0);
  const quantity=qty>0?qty:null;
  const item=a?list(a.item_types).join(' + '):text(contracts[0]?.register_type||contracts[0]?.what||contracts[0]?.description);
  const recorded=sourceDate(a,contracts,d),historicalArrival=list(d.history).some(h=>h&&h.state==='on site'&&aest(h.at));
  const wholeArrived=d.state==='on site'||historicalArrival;
  const contractDeliveries=contracts.map(r=>({id:contractId(r),quantity:typeof r.quantity==='number'?r.quantity:null,deliveredDate:r.delivered===true?day(r.start_date):null,actualIsConfirmed:r.delivered===true,assetNumbers:r.delivered===true&&day(r.start_date)&&r.asset_no_is_plant_number===true?numbers([r.asset_no]):[]}));
  const contractQuantity=contractDeliveries.filter(r=>r.actualIsConfirmed).reduce((n,r)=>n+(r.quantity||0),0);
  const actualQuantity=wholeArrived?quantity:quantity!=null?Math.min(quantity,contractQuantity):contractQuantity||null;
  const actualIsConfirmed=wholeArrived||contractQuantity>0;
  const planned=day(d.date)||(a?first(list(a.events).filter(e=>e&&e.movement!=='remove'&&e.phase!=='Demob').map(e=>day(e.date))):null)||first(contracts.map(r=>day(r.booked_delivery_date)));
  const dest=a?context.destination(a):null;
  const named=dest&&text(dest.text)&&!/^generator$/i.test(text(dest.text))?text(dest.text):null;
  const callouts=a?list(a.drawing_links).map(l=>[l.sheet,l.label?'callout '+l.label:null].filter(Boolean).join(' · ')).filter(Boolean):[];
  const contractLocation=text(contracts[0]?.location);
  const location=named||callouts[0]||(!/^spare$/i.test(contractLocation)?contractLocation:null)||null;
  const b=a?context.branch(a.key):null,codes=[...new Set(contracts.map(r=>text(r.branch_code)).filter(Boolean))];
  const branch=text(b?.code)||(codes.length===1?codes[0]:null);
  const assetNumbers=confirmedNumbers(a,contracts),issues=[];
  if(!quantity)issues.push('Quantity not recorded');
  if(actualIsConfirmed&&!recorded.date)issues.push('Delivery date not recorded');
  if(!actualIsConfirmed&&!planned)issues.push('Planned delivery date not recorded');
  if(!location)issues.push('Location not recorded');
  if(!branch)issues.push('Branch not recorded');
  if(a?.key==='GN?'&&!a._locationMoved&&!a._generatorPosition1004)issues.push('Exact Concert generator position not recorded');
  const cancelled=!!a?._cancelled||!!a?._movedTo;
  return {id:ref?'ref:'+ref:'contract:'+contractId(contracts[0]),ref,refLabel:ref?(typeof context.refLabel==='function'?context.refLabel(ref):ref):text(contracts[0]?.rental_contract)+' · line '+text(contracts[0]?.line),asset:a||null,location,locationSource:dest?.source||(!a?'Contract line':callouts.length?'Drawing reference':null),item,qty:quantity,branch,assetNumbers,deliveredDate:recorded.date,deliverySource:recorded.source,plannedDate:planned,actualIsConfirmed,actualQuantity,contractDeliveries,contractRows:contracts,cancelled,issues};
 }
 for(const a of assets){const contracts=rows.filter(r=>matchRef(r)===a.key);contracts.forEach(r=>claimed.add(contractId(r)));out.push(build(a,contracts));}
 for(const r of rows)if(!claimed.has(contractId(r)))out.push(build(null,[r]));
 return out;
}
function generatorInputs1004(){
 return generatorSourceResolve1004({assets:allAssets(),contractRows:ONHIRE_ROWS,state:S,delivery:deliveryOf,units:unitsOf,lines:chargeLines,branch:branchOf,destination:destinationOf,refLabel:typeof generatorRefLabel994==='function'?generatorRefLabel994:null});
}
