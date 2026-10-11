/* Author: Andrew Fisher. Current supplier quantities, identities and movements share one read-only projection. */
(function(root){
'use strict';
const text=v=>String(v==null?'':v).trim(), normal=v=>text(v).toLowerCase().replace(/[^a-z0-9]/g,''), same=(a,b)=>normal(a)===normal(b);
const integer=v=>v!==null&&v!==undefined&&text(v)!==''&&Number.isInteger(Number(v))&&Number(v)>=0?Number(v):null;
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(text(v))?text(v):'';
const family=item=>/^(fwf|fwftoilets?|portabletoilet|portaloo)$/.test(normal(item))?'single':/^peepanels?$/.test(normal(item))?'panel':/^16pan(?:toilet)?block$/.test(normal(item))?'block':'other';
const sideOrder={outside:0,inside:1,unknown:2};
function remainingDates(row){
 const left=Math.max(0,row.quantity-row.received);if(!left||row.dispatchHold)return [];
 if(date(row.movedDate))return [{date:row.movedDate,remaining:left}];
 const events=(row.events||[]).filter(e=>date(e.date)),seen=new Set(),unique=events.filter(e=>{const key=e.id||JSON.stringify([e.date,e.quantity]);if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>a.date.localeCompare(b.date));
 const days=[...new Set(unique.map(e=>e.date))];if(days.length===1)return [{date:days[0],remaining:left}];
 if(unique.length&&unique.every(e=>integer(e.quantity)!==null)&&unique.reduce((n,e)=>n+Number(e.quantity),0)===row.quantity){
  let received=row.received;const out=[];for(const e of unique){const used=Math.min(received,Number(e.quantity));received-=used;const n=Number(e.quantity)-used;if(n)out.push({date:e.date,remaining:n});}return out;
 }
 return [{date:'',remaining:left,issue:days.length?'Item dates and quantity do not reconcile':'Delivery date not recorded'}];
}
function resolveRequest(request,assets){
 const supplied=Array.isArray(assets),live=supplied?assets:typeof allAssets==='function'?allAssets():[],pool=new Map(live.map(a=>[a.key,a]));
 if(!supplied&&typeof DATA!=='undefined')for(const a of (DATA.assets||[]).concat(typeof S!=='undefined'?S.added||[]:[]))if(!pool.has(a.key))pool.set(a.key,a);
 const candidates=[...pool.values()].filter(a=>requestMatch(a,request)),explicit=candidates.filter(a=>requestSourceIds(a).includes(request.id)),matches=explicit.length?explicit:candidates,inactive=a=>!!(a._cancelled||a._deleted||a.relocation||typeof assetDeleted==='function'&&assetDeleted(a.key)||typeof rowOff==='function'&&(rowOff(a.key)||(a.events||[]).length&&(a.events||[]).every(e=>e.task_id&&rowOff(e.task_id)))||typeof movedAway==='function'&&movedAway(a.key));
 const active=matches.filter(a=>!inactive(a)),shared=active.some(a=>REQUESTS.filter(r=>requestMatch(a,r)).length>1),state=active.length>1||shared?'ambiguous':active.length===1?'active':matches.length?'cancelled':'missing';
 return {state,asset:state==='active'?active[0]:null,key:state==='active'?active[0].key:null,basis:explicit.length?'explicit source identity':'name or location',reason:shared?'One native reference matches multiple source requests':active.length>1?'Multiple native references match one source request':'',matches:matches.map(a=>({key:a.key,inactive:inactive(a)}))};
}
function project(context){
 const rows=context.rows.map(r=>({...r,numbers:[...new Set((r.numbers||[]).map(text).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),remaining:Math.max(0,r.quantity-r.received),onSite:r.onSite===undefined?r.received:r.onSite}));
 const remaining=rows.flatMap(r=>remainingDates(r).map(p=>({...r,...p}))).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.item.localeCompare(b.item));
 const spareRows=(context.spares||[]).map(r=>({...r,numbers:[...(r.numbers||[])],onSite:r.onSite===undefined?r.received:r.onSite})),inventory=rows.filter(r=>r.received>0||r.numbers.length).concat(spareRows);
 const claims=new Map();inventory.forEach(r=>r.numbers.forEach(n=>{if(!claims.has(n))claims.set(n,new Set());claims.get(n).add(r.ref);}));
 const conflicts=[...claims].filter(([,refs])=>refs.size>1).map(([number,refs])=>({number,refs:[...refs]}));
 for(const r of inventory){r.locationConflict=conflicts.some(c=>r.numbers.includes(c.number));if(r.locationConflict&&r.onSite>0){r.onSite=null;r.dispatchHold=true;}}
 const singles=rows.filter(r=>family(r.item)==='single'),spares=spareRows.filter(r=>family(r.item)==='single'),received=singles.reduce((n,r)=>n+r.received,0)+spares.reduce((n,r)=>n+r.received,0),pending=singles.reduce((n,r)=>n+r.remaining,0),confirmed=integer(context.confirmed);
 const summary={onSite:inventory.reduce((n,r)=>n+(Number(r.onSite)||0),0),onsiteUnknown:inventory.filter(r=>r.onSite===null).reduce((n,r)=>n+r.received,0),received:inventory.reduce((n,r)=>n+r.received,0),identified:new Set(inventory.flatMap(r=>r.numbers.map(n=>'event-portables|'+n))).size,quantityOnly:rows.filter(r=>r.quantityOnly).reduce((n,r)=>n+r.received,0),remaining:remaining.reduce((n,r)=>n+r.remaining,0),references:new Set(inventory.filter(r=>!r.spare).map(r=>r.ref)).size,spares:(context.spares||[]).reduce((n,r)=>n+r.received,0),fwf:{confirmed,received,onSite:singles.concat(spares).reduce((n,r)=>n+(Number(r.onSite)||0),0),pending,unallocated:confirmed===null?null:Math.max(0,confirmed-received-pending),over:confirmed===null?0:Math.max(0,received+pending-confirmed)}};
 return {asAt:context.asAt,confirmation:context.confirmation||null,rows,remaining,inventory,summary,conflicts,issues:context.issues||[],unmatched:context.unmatched||[]};
}
/* A six-panel load uses six of the 24 spaces. Blocks always travel alone. No other product inherits this capacity. */
function pack(rows,mode){
 const source=rows.filter(r=>integer(r.count)!==null&&r.count>0).slice().sort((a,b)=>(sideOrder[a.side]??2)-(sideOrder[b.side]??2)||text(a.zone).localeCompare(text(b.zone))||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.item.localeCompare(b.item));
 const loads=[];
 for(const row of source){
  let left=row.count,offset=0;const type=family(row.item),unique=new Set(row.numbers||[]).size===row.count&&(row.numbers||[]).length===row.count;
  while(left){
   let load=type==='single'||type==='panel'?loads.find(l=>l.type==='portable'&&l.side===row.side&&(mode!=='demob'||l.outDate===(row.outDate||''))&&l.units<24&&(type!=='panel'||l.panels<6)):null;
   if(!load){load={type:type==='block'?'block':type==='other'?'unrated':'portable',side:row.side||'unknown',outDate:row.outDate||'',units:0,panels:0,stops:[],proposed:true};loads.push(load);}
   const amount=type==='block'||type==='other'?1:Math.min(left,24-load.units,type==='panel'?6-load.panels:24);
   if(amount<=0)throw new Error('Supplier load has no remaining capacity');
   const numbers=unique?row.numbers.slice(offset,offset+amount):[],stop={...row,count:amount,numbers,recordedNumbers:(row.numbers||[]).slice(),identityPending:!row.quantityOnly&&numbers.length!==amount,portion:left!==row.count||amount!==row.count};
   load.stops.push(stop);load.units+=amount;if(type==='panel')load.panels+=amount;left-=amount;offset+=amount;
  }
 }
 return loads.map((l,i)=>({...l,n:i+1,mode,id:mode+':'+JSON.stringify([l.side,l.type,l.stops.map(s=>[s.ref,s.item,s.count,s.numbers])]),capacity:l.type==='portable'?'24 portaloos, or 6 pee panels + 18 portaloos':l.type==='block'?'16-pan block · full truck':'Vehicle capacity to confirm',held:l.stops.some(s=>s.identityPending||s.locationConflict||s.dispatchHold||mode==='demob'&&(!s.emptied||s.side==='unknown'))}));
}
const REQUESTS=[{id:'EP-S7-EW49',name:'Brad Jones Racing',aliases:['bradjonesracing','bradlones','bjr'],row:49},{id:'EP-S7-EW50',name:'Shell V-Power',aliases:['shellvpower'],row:50}].map(r=>({...r,item:'FWF',quantity:1,date:'2026-10-22',supplier:'Event Portables',source:{file:'GC500 26 Schedule (7).xlsx',sha256:'485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac',sheet:'Event Week',row:r.row}}));
function requestSourceIds(a){return [...new Set([a.supplierRequest996,...(a.events||[]).map(e=>e.supplierRequest996)].map(text).filter(Boolean))];}
function requestMatch(a,r){if(!(a.item_types||[]).some(i=>same(i,r.item)))return false;const ids=requestSourceIds(a);return ids.length?ids.includes(r.id):r.aliases.some(n=>normal(a.name)===n||(a.locations||[]).some(l=>normal(l)===n));}
const api={family,remainingDates,project,pack,requests:REQUESTS,requestMatch,requestSourceIds,resolveRequest,displayRef:r=>r.sourceRequest?.name||r.ref};root.Supplier996=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const originalInventory=epInventory860;
function plan(){
 const drops=(EP819.loads||[]).flatMap(l=>(l.stops||[]).flatMap(s=>(s.drops||[]).map(d=>({...d,load:l.n,date:l.date,task:(text(d.name).match(/\bT\d{4}\b/)||[])[0]||''}))));
 return drops;
}
function where(a){
 const d=dest782(a),w=whereText(a)||{},authority=destinationOf(a),z=zone816(a),usable=!!(d&&d.ll&&d.kind!=='report'),basis={master:'Master plan reference position',confirmed:'Confirmed reference position',pinned:'Recorded site pin',placed:'Map position — check on site',unverified:'Drawing position — check on site',area:'Area only — exact position unconfirmed',desc:d&&d.approx?'Description position — approximate':'Location from description'};
 const raw=text(authority&&authority.known&&authority.text)||w.main||'',generic=/^(toilets?|fwf|pee panels?|amenities)$/i.test(raw),location=(generic?(DM816.name[z.zone]||'Location not recorded'):raw)||'Location not recorded';
 return {location,locationBasis:usable?(basis[d.kind]||'Drawing position — check on site'):'Exact location not recorded',url:usable?navUrl(d.ll):'',coordinates:usable?d.ll.lat.toFixed(6)+', '+d.ll.lon.toFixed(6):'',side:z.side,zone:z.zone};
}
function context(){
 const drops=plan(),assets=allAssets().filter(a=>!a._cancelled&&!a.relocation&&!movedAway(a.key)&&!rowOff(a.key)),rows=[],issues=[],quantities=quantitySubhire964List(),unmatched=[];
 const matched=new Set(),resolutions=REQUESTS.map(request=>({request,...resolveRequest(request)}));
 for(const a of assets){
  const requestMatches=resolutions.filter(r=>r.matches.some(m=>m.key===a.key)),requests=requestMatches.map(r=>r.request),requestHold=requestMatches.some(r=>r.state==='ambiguous');
  const ds=drops.filter(d=>d.ref===a.key||d.task===a.key||(a.events||[]).some(e=>d.task&&e.task_id===d.task));ds.forEach(d=>matched.add(d));
  const subs=subOf(a.key).filter(s=>same(s.co,'Event Portables')),whole=same(subhireCo(a.key),'Event Portables'),qr=quantities.rows.filter(q=>q.ref===a.key&&q.owner==='event-portables');
  if(!ds.length&&!subs.length&&!whole&&!qr.length&&!requests.length)continue;
  const model=gcModel925(a,{loading:false}),eff=effectiveDates(a),d=deliveryAsOf(a.key,todayIso()),lines=chargeLines(a).filter(l=>l.item),items=[...new Set(lines.map(l=>l.item))];
  for(const item of items){
   const typed=model.rows.filter(u=>u.physical&&same(u.item,item)),ep=typed.filter(u=>u.owner==='event-portables'),other=typed.filter(u=>u.owner!=='event-portables'&&u.owner!=='unknown'),qonly=qr.find(q=>same(q.item,item)),f=family(item);
   const planned=requests.some(r=>same(r.item,item))||ds.some(x=>f==='single'&&x.fwf>0||f==='panel'&&x.pee_panels>0)||epLine909(a,item);
   let receipt=toiletItem962(a,item,d,todayIso());
   if(!receipt){if(ep.length||qonly||planned)issues.push({ref:a.key,item,reason:'Item quantity is not recorded as a whole number'});continue;}
   if(!ep.length&&!qonly&&!planned&&!(whole&&items.length===1))continue;
   if(other.length){
    if(typed.length===receipt.quantity&&ep.length+other.length===typed.length&&(receipt.arrived===0||receipt.arrived===receipt.quantity)){const allArrived=receipt.arrived===receipt.quantity,allInstalled=receipt.done===receipt.quantity;receipt={...receipt,quantity:ep.length,arrived:allArrived?ep.length:0,done:allInstalled?ep.length:0};}
    else{issues.push({ref:a.key,item,reason:'Mixed supplier ownership needs scoped receipt quantities',numbers:typed.map(u=>u.assetNo).filter(Boolean)});continue;}
   }
   // A unit identity does not prove an unrecorded receipt. Native item evidence remains the authority.
   const knownScope=planned||!!qonly||(whole&&items.length===1)||ep.length===receipt.quantity;
   if(!knownScope){issues.push({ref:a.key,item,reason:'Supplier units recorded; outstanding supplier quantity is not established'});continue;}
   const collection=window.DemobCollection996?.read(a.key,todayIso()),collectionItems=collection?.events?.flatMap(c=>(c.items||[]).filter(u=>same(u.type,item)))||[],collected=other.length?(collection?.complete?receipt.quantity:collectionItems.reduce((n,u)=>n+(u.physicalUnits||[]).filter(p=>p.owner==='event-portables').length,0)):collection?.collected?.filter(u=>same(u.type,item)).reduce((n,u)=>n+u.n,0)||0,used=collectionItems.flatMap(u=>other.length?(u.physicalUnits||[]).filter(p=>p.owner==='event-portables').map(p=>p.number):(u.numbers||[])),ambiguousDeparture=(d.state!=='on site'&&!!(d.history||[]).find(h=>h.state==='on site'&&h.at&&d.set_at&&h.at<d.set_at)&&!collection?.complete)||!!(other.length&&collectionItems.some(u=>u.n>(u.physicalUnits||[]).length)&&!collection?.complete);
   const events=(a.events||[]).filter(e=>e.movement!=='remove'&&(same(e.item,item)||lineItemMatch(item,e.item))).map(e=>({id:e.task_id,date:e.date,quantity:integer(e.quantity_raw)}));
   rows.push({ref:a.key,item,name:a.name||'',quantity:receipt.quantity,received:Math.max(receipt.arrived,collected),installed:receipt.done,collected,onSite:ambiguousDeparture?null:Math.max(0,Math.max(receipt.arrived,collected)-collected),remainingNumbers:ep.map(u=>text(u.assetNo)).filter(n=>n&&!used.includes(n)),collectionIssues:collection?.issues||[],numbers:ep.map(u=>text(u.assetNo)).filter(Boolean),quantityOnly:!!qonly,events,movedDate:eff.in_moved&&eff.in_where!=='schedule correction'?eff.in:'',...where(a),status:receipt.status,arrivalBasis:receipt.basis,emptied:emptiedOf816(a.key).on,emptyRecord:emptiedOf816(a.key),supplierBasis:planned?'Current supplier plan matched to scheduled item':'Shared item ownership',outDate:deliveryOf(a.key).out_date||'',outSource:deliveryOf(a.key).out_date?'Recorded pickup date':'',dispatchHold:requestHold||ambiguousDeparture||!!collection?.issues?.length});
  }
 }
 for(const drop of drops){if(/brad jones|shell v.power/i.test(drop.name||''))continue;if(matched.has(drop)||drop.task&&rowOff(drop.task))continue;unmatched.push({name:drop.name,quantity:drop.fwf||0,date:drop.date,source:'Original supplier plan — no current reference match'});}
 for(const request of REQUESTS){const resolution=resolutions.find(r=>r.request.id===request.id);if(resolution.state!=='missing'){if(resolution.state!=='active')issues.push({ref:request.name,item:request.item,reason:resolution.state==='cancelled'?'Matching native request is cancelled or removed':resolution.reason||'Multiple native references match this source request'});continue;}rows.push({ref:request.id,item:request.item,name:request.name,quantity:request.quantity,received:0,installed:0,numbers:[],quantityOnly:false,events:[{id:request.id,date:request.date,quantity:request.quantity}],location:request.name+' team area',locationBasis:'Exact toilet location not recorded',url:'',coordinates:'',side:'unknown',zone:'unknown',status:'Requested — no receipt recorded',arrivalBasis:'',emptied:false,supplierBasis:'Schedule (7) Event Week row '+request.row,sourceRequest:request,sourceOnly:true,outDate:''});}
 const inventory=originalInventory();
 for(const old of inventory.rows){if(old.ref==='Spare — unallocated'||!old.assetNo||rows.some(r=>r.ref===old.ref&&r.numbers.includes(old.assetNo)))continue;rows.push({ref:old.ref,item:old.description,quantity:0,received:0,installed:0,numbers:[old.assetNo],quantityOnly:false,events:[],location:old.location,locationBasis:old.locationBasis,url:'',side:'unknown',zone:'unknown',status:old.status,dispatchHold:true,emptied:false});issues.push({ref:old.ref,item:old.description,reason:'Recorded supplier asset outside the reconciled current item scope'});}
 const spares=inventory.rows.filter(r=>r.ref==='Spare — unallocated').map(r=>({ref:r.ref,item:r.description,quantity:1,received:1,onSite:1,installed:0,numbers:r.assetNo?[r.assetNo]:[],spare:true,quantityOnly:false,location:r.location,locationBasis:r.locationBasis,url:'',coordinates:'',side:'unknown',zone:'unknown',status:r.status,emptied:false,outDate:''}));
 return {asAt:todayIso(),rows,spares,confirmed:epConfirmation870()?.total??null,confirmation:epConfirmation870(),issues,unmatched,rawInventory:inventory};
}
function requestAsset(id){const r=REQUESTS.find(x=>x.id===id);if(!r)return null;return {key:r.id,name:r.name,discipline:'Toilets & amenities',product:'Toilet',item_types:['FWF'],asset_numbers:[],asset_notes:[],accessories:[],unparsed_notes:[],events:[{task_id:r.id,date:r.date,phase:'Build',sheet:'Event Week',item:'FWF',quantity_raw:1,quantity_display:'1',movement:'place',carrier:'Event Portables',supplierRequest996:r.id,source_range:"'Event Week'!A"+r.row+':H'+r.row}],locations:[r.name+' team area'],customers:['scars'],first_date:r.date,last_date:r.date,drawing_links:[],phases:['Build'],charge_lines:[],priceable:false,_supplier996Request:true};}
function model(){return holdAssets(()=>heldMemo('supplier996:model',()=>project(context())));}
function inboundLoads(day){const m=model();return pack(m.remaining.filter(r=>r.date===day).map(r=>({...r,count:r.remaining,numbers:r.received===0?r.numbers:[],emptied:false})),'inbound');}
function demobRows(){return model().inventory.filter(r=>r.onSite>0&&!r.dispatchHold).map(r=>({...r,count:r.onSite,numbers:r.remainingNumbers||r.numbers,identityPending:!r.quantityOnly&&(r.remainingNumbers||r.numbers).length!==r.onSite}));}
function demobLoads(){return pack(demobRows(),'demob');}
Object.assign(api,{context,model,where,inboundLoads,demobRows,demobLoads,requestAsset});
Subhire975.remainingRows=()=>model().remaining;
})(typeof window==='undefined'?globalThis:window);
