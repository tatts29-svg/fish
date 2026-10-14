/* Author: Andrew Fisher. Read-only exhaustive reference projection audit. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const PAGE=process.env.PAGE,OUT=process.env.OUT;
if(!PAGE||!OUT)throw Error('PAGE and private OUT required');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const h=await open({pageFile:PAGE,mobile:true,W:390,H:844});
 try{
  await h.page.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled&&Routes1016.ready(),null,{timeout:180000});
  await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:120000});
  const data=await h.page.evaluate(()=>holdAssets(()=>{
   const assets=allAssets(),safe=fn=>{try{return fn();}catch(error){return {auditError:String(error.stack||error)};}},pick=(o,keys)=>Object.fromEntries(keys.filter(k=>k in o).map(k=>[k,o[k]]));
   const finder=finderIndex();
   const rows=assets.map(a=>({
    ...pick(a,['key','name','origin','_plant','_added','_cancelled','rest_of','task_id','source_row','discipline','product','item_types','locations','drawing_links','position_state','events']),
    resolved:safe(()=>assetOf(a.key)?.key||null),routeContext:safe(()=>!!(assets.find(x=>x.key===a.key)||lighting894Context(a.key))),
    gone:safe(()=>movedAway(a.key)),delivery:safe(()=>deliveryOf(a.key)),view:safe(()=>deliveryView(a)),
    quantities:safe(()=>chargeLines(a).map(l=>({item:l.item,quantity:qtyOf(l)}))),items:safe(()=>itemRows(a)),
    mapQuantity:safe(()=>mapQuantity1010(a,'')),parentQuantity:safe(()=>typeof parentQuantity1010==='function'?parentQuantity1010(a):null),
    index:finder.filter(f=>f.kind==='asset'&&f.key===a.key).map(f=>({kind:f.kind,key:f.key,type:f.type})),
    exactSearch:safe(()=>finderMatches(a.key).map(f=>pick(f,['kind','key','no','sheetKey','label']))),
    map:safe(()=>{const m=mapPlaceFor(a);return m?{sheet:m.sheet.key,label:m.label,marker:m.marker}:null;}),
    mapSheet:safe(()=>mapSheetFor(a)?.key||null),destination:safe(()=>destinationOf(a)),where:safe(()=>whereText(a)),
    model:safe(()=>gcModel925(a,{loading:false})),
   }));
   return {
    version:SYNC.backend.readVersion821(),when:new Date().toISOString(),
    sourceShapes:Object.fromEntries(Object.entries(DATA).map(([k,v])=>[k,Array.isArray(v)?{array:v.length}:v&&typeof v==='object'?{keys:Object.keys(v)}:typeof v])),
    sources:{assets:DATA.assets.map(a=>pick(a,['key','name','origin','discipline','product','item_types','charge_lines','events','drawing_links'])),plant:PLANT_LINES.map(a=>pick(a,['key','name','origin','discipline','product','item_types','charge_lines','events','drawing_links'])),added:S.added||[]},
    record:JSON.parse(JSON.stringify(S)),rows,
    aliases:safe(()=>{const p=physicalCountAssets963(assets);return {keys:p.assets.map(a=>a.key),aliases:p.aliases,pending:p.pending};}),
    refs:Object.entries(givenRefs()).map(([key,value])=>({key,...value,resolved:assetOf(key)?.key||null,routeContext:!!(assets.find(x=>x.key===key)||lighting894Context(key)),search:finderMatches(key).map(f=>pick(f,['kind','key','no']))})),
    index:finder.map(f=>pick(f,['kind','key','no','sheetKey','id','label','type','name'])),
    units:allUnits(),
    maps:DATA.sheets.map(sh=>({key:sh.key,sheet_id:sh.sheet_id,master:sh.master,markers:sh.markers})),
    master:MASTER_LOC,
    contracts:ONHIRE_ROWS.map(r=>pick(r,['match','description','quantity','asset_no','rental_contract','line','start','end','register_type'])),
    programme:safe(()=>programmeDays().map(d=>({day:d.iso,deliveries:d.deliveries.map(r=>({ref:r.a?.key,events:r.events})),removals:(d.removals||[]).map(r=>({ref:r.a?.key,events:r.events}))}))),
   };
  }));
  fs.writeFileSync(path.join(OUT,'capture.json'),JSON.stringify(data,null,2)+'\n');
  fs.writeFileSync(path.join(OUT,'capture-meta.json'),JSON.stringify({author:'Andrew Fisher',sha256:crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'),version:data.version,counts:{assets:data.rows.length,base:data.sources.assets.length,plant:data.sources.plant.length,added:data.sources.added.length,sourceShapes:Object.keys(data.sourceShapes).length,index:data.index.length,units:data.units.length,aliases:data.refs.length,contractRows:data.contracts.length,mapSheets:data.maps.length},errors:h.errors,requests:h.counts},null,2)+'\n');
  console.log(JSON.stringify({version:data.version,assets:data.rows.length,errors:h.errors,requests:h.counts}));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
