/* Author: Andrew Fisher. Exhaustive quantity snapshot from the actual public page. GET only. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({hash:'#today',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const data=await h.page.evaluate(()=>holdAssets(()=>{
  const before=JSON.stringify(S), day=todayIso(), assets=allAssets(), canonical=physicalCountAssets963(assets), inv=inventory(), map=gc500MapStatus1009(), today=todayWorkMetrics840(day),supplier=Supplier996.model();
  const read=(fn)=>{try{return fn();}catch(e){return {auditError:String(e.message)}}};
  const matrix=assets.map(a=>{
   const lines=chargeLines(a), delivery=deliveryAsOf(a.key,day), model=read(()=>gcModel925(a)), on=invOnSite(a,day), irs=itemRows(a);
   return {ref:a.key,name:a.name,discipline:a.discipline,product:a.product,canonical:canonical.assets.includes(a),cancelled:!!a._cancelled,relocation:!!a.relocation,restOf:a.rest_of||null,movedAway:!!movedAway(a.key),movedTo:a._movedTo||null,sourceRow:a.source_row||null,firstDate:a.first_date,locations:a.locations,assetNumbers:a.asset_numbers,
    delivery,on,items:lines.map(l=>{
     const item=l.item,asked=qtyOf(l),ir=irs.find(i=>i.asked===item),sup=ir&&ir.qty_supplied!=null&&String(ir.qty_supplied).trim()!==''&&Number.isFinite(Number(ir.qty_supplied))?Number(ir.qty_supplied):null;
     const received=read(()=>toiletArrival962(a,item,day,on?(sup!=null?sup+restArrived(a,item):asked):0));
     return {item,asked,description:l.description,rawQuantity:l.quantity,quantityRule:descriptionQuantity1012(l),type:invTypeKey(l,a),receipt:ir||null,received,currentStock:read(()=>CurrentStock996.quantity(a,item,day,received)),physical:model.rows?.filter(u=>u.physical&&u.item===item)||[],inventory:inv.list.filter(r=>r.type===invTypeKey(l,a)&&r.refs[a.key]).map(r=>({item:r.item,...r.refs[a.key]})),map:map.states.find(r=>r.key===a.key)?.quantity?.items?.filter(r=>r.item===item)||[],today:today.filter(r=>r.rows.some(x=>x.key===a.key)).map(r=>({category:r.id,...r.rows.find(x=>x.key===a.key)})),supplier:supplier.rows.filter(r=>r.ref===a.key&&r.item===item)};
    }),model,accessories:a.accessories||[],accessoriesTakenOff:a._accessoriesTakenOff||[],subhire:subOf(a.key),collected:read(()=>DemobCollection996.read(a.key,day)),events:a.events||[]};
  });
  const programme=programmeDays().map(d=>({iso:d.iso,phase:d.phase,sheet:d.sheet,deliveries:d.deliveries?.map(r=>({ref:r.a?.key,events:r.events})),loads:read(()=>dpLoads(d).map(g=>({id:g.id,key:g.key,kind:g.kind,supplier:g._supplier996||null,rows:g.rows?.map(r=>({ref:r.a?.key,events:r.events,lines:r.a?chargeLines(r.a).map(l=>({item:l.item,quantity:qtyOf(l)})):null}))})))}));
  return {author:'Andrew Fisher',captured:new Date().toISOString(),nativeVersion:SYNC.backend.readVersion821(),day,health:todayWorkHealth840(),assets,canonical:{aliases:canonical.aliases,pending:canonical.pending,refs:canonical.assets.map(a=>a.key)},matrix,inventory:inv,map,today,supplier,programme,progress:progress881Model(day),nativeUnchanged:before===JSON.stringify(S)};
 }));
 Object.assign(data,{errors:h.errors,requests:h.counts});
 const out=process.env.OUT;if(!out)throw Error('Private OUT required');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2));
 console.log(JSON.stringify({nativeVersion:data.nativeVersion,assets:data.assets.length,canonical:data.canonical.refs.length,matrixLines:data.matrix.reduce((n,r)=>n+r.items.length,0),categories:data.inventory.list.length,supplierRows:data.supplier.rows.length,programmeDays:data.programme.length,nativeUnchanged:data.nativeUnchanged,errors:h.errors,requests:h.counts}));
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
