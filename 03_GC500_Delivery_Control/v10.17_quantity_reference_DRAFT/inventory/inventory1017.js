/* Author: Andrew Fisher. Delivery demand follows receipts; stock follows current movements.
   Supplier source requests remain read-only projections, never native assets or charges. */
(function(root){
'use strict';
const count=n=>Number.isFinite(n)&&n>=0?n:0;
function remaining(row){return Number.isFinite(row?.remaining1017)?Math.max(0,row.remaining1017):Math.max(0,count(row?.asked)-count(row?.received1017));}
function ordered(a,line){
 const placement=typeof waterBarrierPlacement1017==='function'?waterBarrierPlacement1017(a):null;
 return placement&&String(line.item).trim().toLowerCase()===String(placement.item).trim().toLowerCase()?0:qtyOf(line);
}
function sourceRows(model){
 const seen=new Set();
 return (model?.rows||[]).filter(r=>r.sourceOnly&&r.sourceRequest&&Number.isFinite(r.quantity)&&r.quantity>0&&!seen.has(r.ref)&&seen.add(r.ref));
}
function addRequests(I,model,typeOf){
 for(const source of sourceRows(model)){
  // A native row wins if a source request becomes linked during this render.
  if(I.list.some(r=>Object.hasOwn(r.refs||{},source.ref)))continue;
  const t=typeOf(source),pending=(model.remaining||[]).filter(r=>r.ref===source.ref),due=pending.map(r=>r.date).filter(Boolean).sort()[0]||'';
  let row=I.list.find(r=>r.type===t.type);
  if(!row){row={...t,asked:0,on:0,received1017:0,remaining1017:0,coates:0,sub:{},nonum:0,spareC:0,spareSub:{},spares:0,refs:{}};I.list.push(row);}
  const received=count(source.received),ref={key:source.ref,asked:source.quantity,on:0,coates:0,sub:0,cos:{},nonum:0,onsite:false,
   received1017:received,remaining1017:Math.max(0,source.quantity-received),sourceOnly1017:true,source1017:source,due1017:due};
  row.refs[source.ref]=ref;row.asked+=ref.asked;row.received1017=count(row.received1017)+received;row.remaining1017=count(row.remaining1017)+ref.remaining1017;
 }
 return I;
}
function asset(key){return assetOf(key)||(typeof Supplier996!=='undefined'?Supplier996.requestAsset(key):null);}
function due(key,I,item,quantity){
 const request=I?.list.flatMap(r=>Object.values(r.refs||{})).find(r=>r.key===key&&r.sourceOnly1017);
 if(request)return request.due1017;
 const plan=I?.supplierRemaining1017||(typeof Supplier996!=='undefined'?Supplier996.model().remaining:[]);
 const portions=plan.filter(r=>r.ref===key&&(!item||sameItem(r.item,item)));
 const scope=I?.list.find(r=>sameItem(r.item,item))?.refs[key],n=Number.isFinite(quantity)?quantity:scope?remaining(scope):null;
 const dates=portions.map(r=>r.date).filter(Boolean).sort();
 if(dates.length&&n!==null&&portions.reduce((sum,r)=>sum+r.remaining,0)===n)return dates[0];
 const a=assetOf(key);return a?effectiveDates(a).in||'':'';
}
const sameItem=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
function allocations(ref,item,n,plan,fallback){
 const portions=(plan||[]).filter(r=>r.ref===ref&&sameItem(r.item,item)&&Number.isFinite(r.remaining)&&r.remaining>0);
 // The supplier's dated portions are authoritative only for this same outstanding
 // item scope. Never spread another owner's units across the supplier's truck days.
 if(portions.length&&portions.reduce((sum,r)=>sum+r.remaining,0)===n)return portions.map(r=>({date:r.date||'',quantity:r.remaining}));
 return [{date:fallback||'',quantity:n}];
}
function outstanding(I,disc,noFallback){
 const rows=I.list.filter(r=>disc==='*'||r.disc===disc),by=new Map(),represented=new Set();
 const plan=I.supplierRemaining1017||(typeof Supplier996!=='undefined'?Supplier996.model().remaining:[]);
 for(const row of rows)for(const ref of Object.values(row.refs||{})){
  represented.add(ref.key);const n=remaining(ref);if(!n)continue;
  const a=assetOf(ref.key),fallback=ref.sourceOnly1017?ref.due1017:a?effectiveDates(a).in:'';
  for(const portion of allocations(ref.key,row.item,n,plan,fallback)){
   const id=JSON.stringify([ref.key,portion.date]),e=by.get(id)||{key:ref.key,items:[],allocations1017:[],due:portion.date,short:ref.received1017>0,source1017:ref.source1017};
   e.items.push(portion.quantity+' × '+row.item);e.allocations1017.push({item:row.item,quantity:portion.quantity,date:portion.date});by.set(id,e);
  }
 }
 // Only genuinely untyped references use the older fallback. A collected or moved
 // typed reference already represented above must not become a new delivery.
 for(const a of noFallback?[]:physicalCountAssets963(allAssets()).assets){
  if(a._cancelled||a.relocation||movedAway(a.key)||rowOff(a.key)||represented.has(a.key)||inPlace782(a.key))continue;
  if(typeof waterBarrierPlacement1017==='function'&&waterBarrierPlacement1017(a))continue;
  let d='';try{d=invTypeDisc(invTypeOf(a)||'');}catch(_){}
  if(disc!=='*'&&d!==disc)continue;
  by.set(a.key,{key:a.key,items:[(a.item_types||a.asked_for||[]).filter(Boolean).join(', ')||a.name||'not priced on the schedule'],short:false,due:effectiveDates(a).in||''});
 }
 return [...by.values()].map(e=>({...e,a:asset(e.key)})).filter(e=>e.a)
  .sort((a,b)=>String(a.due||'9').localeCompare(String(b.due||'9'))||a.key.localeCompare(b.key,undefined,{numeric:true}));
}
function sourceNote(source){const r=source?.sourceRequest;return r?.source?[r.source.file,r.source.sheet,'row '+r.row].filter(Boolean).join(' · '):'Supplier source request';}
function sourceLine(e,showDue){
 const r=e.source1017||{},k=esc(e.key);
 return '<li class="ln87" data-k87="'+k+'" data-source-request1017="'+k+'"><div class="ln87-ref"><b class="tg-ref">'+k+'</b>'+
  (showDue?'<span class="ln87-due">'+(e.due?'Due '+esc(fmtDate(e.due)):'No date yet')+'</span>':'')+'<span class="ln87-nm">'+esc(r.name||e.a.name)+'</span></div>'+
  '<div class="ln87-do tg-w"><span class="ln87-lab">Still to come</span><span class="ln87-its">'+inv87Items({items:e.items})+'</span><span class="ln87-tags">Sub-hired · Event Portables · requested</span></div>'+
  '<div class="ln87-map"><div class="ln87-w"><span class="ln87-lab">Destination</span><b class="tg-loc">'+esc(r.location||e.a.name+' team area')+'</b><details><summary>More info</summary><p>'+esc(sourceNote(r))+'</p><p>No receipt or native location reference has been recorded.</p></details></div></div>'+
  '<div class="ln87-qr"><span class="ln87-nq">Exact position not recorded · no navigation QR</span></div></li>';
}
function placements(I,print){
 if(typeof waterBarrierPlacements1017!=='function'||typeof waterBarrierPlacementsNote1017!=='function')return '';
 const rows=waterBarrierPlacements1017().filter(p=>INV.disc==='*'||I.list.some(r=>r.disc===INV.disc&&Object.hasOwn(r.refs||{},p.key)));
 return waterBarrierPlacementsNote1017(rows,print);
}
const api={remaining,ordered,sourceRows,addRequests,asset,due,allocations,outstanding,sourceNote,sourceLine,placements};
root.Inventory1017=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const originalInventory=inventory;
inventory=function(){const I=originalInventory.apply(this,arguments),supplier=Supplier996.model();I.supplierRemaining1017=supplier.remaining;addRequests(I,supplier,r=>{
 const a=Supplier996.requestAsset(r.ref),type=invTypeKey({item:r.item,discipline:a.discipline},a);
 return {type,disc:invTypeDisc(type),item:invTypeWord(type)};
});I.list.sort((a,b)=>a.disc.localeCompare(b.disc)||a.item.localeCompare(b.item));return I;};
const originalFacts=inv87Facts;
inv87Facts=function(e){if(!e.a?._supplier996Request)return originalFacts.apply(this,arguments);
 const r=e.source1017||{};return {a:e.a,name:r.name||e.a.name,items:e.items,loc:r.location||e.a.name+' team area',sub:'Exact position not recorded',report:false,
  tags:[['gy','Requested · Event Portables']],lat:null,lon:null,nav:'',pin:null,map:false,sourceOnly1017:true};};
const originalLine=inv87Line;
inv87Line=function(e,showDue){return e.a?._supplier996Request?sourceLine(e,showDue):originalLine.apply(this,arguments);};
const originalMoney=inv83Money;
inv83Money=function(rows){const result=originalMoney.apply(this,arguments);for(const row of rows){
 const requests=Object.values(row.refs||{}).filter(r=>r.sourceOnly1017).length;if(!requests)continue;
 const money=result.get(row.type)||{total:0,known:0,unknown:0};money.unknown+=requests;result.set(row.type,money);
}return result;};
})(typeof window==='undefined'?globalThis:window);
