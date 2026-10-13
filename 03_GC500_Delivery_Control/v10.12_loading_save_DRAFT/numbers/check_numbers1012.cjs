/* Author: Andrew Fisher. Read-only numerical propagation audit. All native writes blocked by the standard harness. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),{open}=require(path.join(root,'toolchain/harness/open_page.js'));
const pageFile=process.env.PAGE||'/workspace/private-argon-review-14Oct2026/live.html',out=process.env.OUT||'/workspace/private-numbers1012/browser';
const hash=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');
if(process.env.EXPECTED_SHA&&hash!==process.env.EXPECTED_SHA)throw Error('Exact reviewed source hash mismatch');
(async()=>{fs.mkdirSync(out,{recursive:true});const h=await open({pageFile,hash:'#today'});try{const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
const result=await p.evaluate(()=>{
 const checks=[],findings=[],observations={},clone=x=>JSON.parse(JSON.stringify(x));
 const check=(name,pass,actual)=>checks.push({name,pass:!!pass,...(actual===undefined?{}:{actual})});
 const day=todayIso(),version=SYNC.backend.readVersion821(),saved=clone(S),before=JSON.stringify(S),savedMemo=new Map(RENDER_MEMO);
 const fresh=fn=>{RENDER_MEMO.clear();return holdAssets(fn);};
 function snapshot(key){return fresh(()=>{const a=assetOf(key),summary=todayWorkSummary848(day),category=summary.byId.toilets,inv=inventory(),supplier=Supplier996.model(),demob=demob816(),source=chargeLines(a).map(l=>({item:l.item,quantity:qtyOf(l)}));const card=BuildCardData984.day(day,day,programmeDays().find(d=>d.iso===day)||{iso:day});return {source,delivery:deliveryOf(key),timeline:timeline841State(a),today:todayWorkMetrics840(day).find(r=>r.id==='toilets').rows.find(r=>r.key===key),category:{total:category.total,done:category.done,pct:category.pct,pctKind:category.pctKind},map:gc500MapStatus1009([key]).states[0],inventory:inv.list.filter(r=>r.refs[key]).map(r=>({item:r.item,...r.refs[key]})),demob:demob.refs.find(r=>r.key===key)?.units,supplier:supplier.rows.filter(r=>r.ref===key).map(r=>({item:r.item,quantity:r.quantity,received:r.received,onSite:r.onSite,installed:r.installed,numbers:r.numbers})),remaining:supplier.remaining.filter(r=>r.ref===key).map(r=>({item:r.item,date:r.date,remaining:r.remaining})),build:card.loads.details.filter(r=>r.refs.includes(key)),collection:DemobCollection996.read(key,day)};});}
 try{
  const baseline=snapshot('WC48');observations.baseline={source:baseline.source,category:baseline.category,map:baseline.map,build:baseline.build};
  const audit=fresh(()=>{const assets=allAssets(),physical=physicalCountAssets963(assets),inv=inventory(),statuses=gc500MapStatus1009(),by=new Map(statuses.states.map(r=>[r.key,r]));let typed=0;const wrong=[],unknown=[],inactive=[];
   for(const a of physical.assets){if(a._cancelled||a.relocation||movedAway(a.key))continue;const groups=new Map();for(const l of chargeLines(a)){if(!l.item)continue;const q=qtyOf(l);groups.set(l.item,(groups.get(l.item)||0)+(q??0));if(q==null)unknown.push(a.key+'|'+l.item);}
    for(const [item,q]of groups){typed++;const r=inv.list.find(r=>r.item===item&&r.refs[a.key])?.refs[a.key];const m=by.get(a.key)?.quantity?.items.find(r=>r.item===item);if(r?.asked!==q||m?.quantity!==q)wrong.push({ref:a.key,item,source:q,inventory:r?.asked,map:m?.quantity});}
   }
   for(const a of assets.filter(a=>a._cancelled||movedAway(a.key))){if(inv.list.some(r=>r.refs[a.key]))inactive.push(a.key);}
   return {typed,wrong,unknown,inactive,aliases:physical.aliases.map(a=>({ref:a.ref,source:a.source})),duplicateKeys:assets.map(a=>a.key).filter((k,i,l)=>l.indexOf(k)!==i),index:progress881Model(day)};});
  check('Every active typed inventory and map quantity matches the shared charge-line scope',!audit.wrong.length,{typed:audit.typed,mismatches:audit.wrong});
  check('Cancelled and moved references are excluded from inventory quantities',!audit.inactive.length,audit.inactive);
  check('Active reference keys are unique',!audit.duplicateKeys.length,audit.duplicateKeys);
  check('Seven-category index averages dimensionless percentages, not metres plus pieces',!audit.index.ready||Math.abs(audit.index.pct.min-audit.index.rows.reduce((n,r)=>n+r.min,0)/7)<1e-10);
  observations.index={ready:audit.index.ready,provisional:audit.index.provisional,allGreen:audit.index.allGreen,pct:audit.index.pct,rows:audit.index.rows.map(r=>({id:r.id,min:r.min,max:r.max,unit:r.unit,provisional:r.provisional}))};observations.unknown=audit.unknown;observations.aliases=audit.aliases;
  const typedOwnership=fresh(()=>{const mismatches=[],seen=[];for(const r of inventory().list)for(const ref of Object.values(r.refs||{})){if(!(ref.on>0))continue;const a=assetOf(ref.key),m=a&&gcModel925(a),rows=(m?.rows||[]).filter(u=>u.physical&&u.id&&String(u.item).toLowerCase()===String(r.item).toLowerCase());if(!(m?.groups||[]).some(g=>g.item===r.item&&Number.isFinite(g.quantity)&&g.quantity>0)||rows.length!==ref.on||new Set(rows.map(u=>u.id)).size!==rows.length||rows.some(u=>u.ref&&u.ref!==ref.key)||new Set(rows.filter(u=>u.assetNo).map(u=>u.owner+'|'+u.assetNo)).size!==rows.filter(u=>u.assetNo).length)continue;const coates=rows.filter(u=>u.owner==='coates'&&u.assetNo).length,sub=rows.filter(u=>u.owner&&u.owner!=='coates'&&u.owner!=='unknown').length;seen.push(ref.key+'|'+r.item);if(ref.coates!==coates||ref.sub!==sub)mismatches.push({ref:ref.key,item:r.item,expected:{coates,sub},actual:{coates:ref.coates,sub:ref.sub}});}return {verified:seen.length,mismatches};});
  check('All fully identified on-site item groups use the same typed ownership as the reference drawer',typedOwnership.mismatches.length===0,typedOwnership);
  S.qtys.WC48=6;
  const q=snapshot('WC48');observations.quantity=q;
  check('Quantity edit reaches reference charge lines and map immediately',q.source[0].quantity===6&&q.map.quantity.items[0].quantity===6);
  check('Quantity edit reaches Today reference and category denominator',q.today.quantity===6&&q.category.total===baseline.category.total+2,{before:baseline.category.total,after:q.category.total});
  check('Quantity edit reaches Inventory and Demob scope',q.inventory[0].asked===6&&q.demob[0].n===6,{inventory:q.inventory[0].asked,demob:q.demob[0].n});
  check('Quantity edit reaches supplier outstanding run sheet',q.remaining.reduce((n,r)=>n+r.remaining,0)===6,q.remaining);
  // Fixtures use the page's existing in-memory record shape, never native setters, save(), bump() or service writes.
  const at=day+'T00:10:00+10:00',receiptAt=day+'T00:11:00+10:00',doneAt=day+'T00:12:00+10:00';
  S.delivery.WC48={...S.delivery.WC48,state:'on site',by:'Read-only test fixture',set_at:at,done:false,done_at:doneAt,done_by:'Read-only test fixture',history:[{state:'on site',at,by:'Read-only test fixture'}]};
  S.supplied.WC48={items:[{asked:'FWF',supplied:'FWF',qty_supplied:2}]};S.stamps['supplied/WC48/FWF']=receiptAt;
  const partial=snapshot('WC48');observations.partial=partial;
  check('Two received of six stays a partial receipt, not six installed',partial.today.arrived962===2&&partial.today.done===0&&partial.map.state==='partial',{today:partial.today,map:partial.map.state});
  check('Partial receipt reaches Inventory and supplier outstanding quantity',partial.inventory[0].on===2&&partial.remaining.reduce((n,r)=>n+r.remaining,0)===4,{inventory:partial.inventory[0].on,remaining:partial.remaining});
  check('Partial receipt does not mark today delivery or final completion complete',partial.build.every(r=>!r.complete)&&partial.map.state!=='complete',partial.build);
  S.supplied.WC48.items[0].qty_supplied=6;
  const received=snapshot('WC48');observations.received=received;
  check('Full receipt fulfills delivery while installation remains incomplete',received.inventory[0].on===6&&received.today.done===0&&received.build.length>0&&received.build.every(r=>r.complete)&&received.map.state!=='complete',{on:received.inventory[0].on,done:received.today.done,map:received.map.state,build:received.build});
  S.delivery.WC48.done=true;
  const complete=snapshot('WC48');observations.complete=complete;
  check('Confirmed completion reaches Today, map and supplier installed count once',complete.today.done===6&&complete.map.state==='complete'&&complete.map.quantity.items[0].completed===6&&complete.supplier[0]?.installed===6,{done:complete.today.done,map:complete.map,supplier:complete.supplier});
  check('Completed receipt leaves no supplier delivery balance',complete.remaining.length===0,complete.remaining);
  S.delivery.WC48.done=false;
  const undone=snapshot('WC48');
  check('Removing physical completion removes map check and Today completion',undone.today.done===0&&undone.map.state!=='complete',{done:undone.today.done,map:undone.map.state});
  S.delivery.WC48.done=true;
  const required=fresh(()=>DemobCollection996.read('WC48',day).required),requiredKey=DemobProgress996.fingerprint(required);
  S.delivery.WC48.history.push({state:'on site',at:day+'T00:13:00+10:00',by:'Read-only test fixture',collection996:{version:1,kind:'collection',id:'read-only-numbers1012',arrivalAt:at,date:day,requiredKey,items:[{type:'FWF',n:2,numbers:[],unitIds:[]}]}});
  const collected=snapshot('WC48');observations.collected=collected;
  check('Typed partial collection reduces current stock and remaining pickup quantity',collected.collection?.collected[0]?.n===2&&collected.collection?.remaining[0]?.n===4&&collected.inventory[0].on===4,{collection:collected.collection,on:collected.inventory[0].on});
  check('Partial collection does not imply completed Demob',collected.collection?.recorded&&!collected.collection.complete);
  check('Supplier current stock follows same typed collection',collected.supplier[0]?.onSite===4,collected.supplier);
  // Ownership discrepancies are evidence; no ownership record is inferred or overwritten by this audit.
  const ownership=fresh(()=>{const I=inventory(),M=Supplier996.model();return ['WC69','WC70','WC72'].map(ref=>({ref,physical:gcModel925(assetOf(ref)).rows.filter(u=>u.physical).map(u=>({item:u.item,owner:u.owner,assetNo:u.assetNo})),nativeSub:subOf(ref).map(u=>({co:u.co,no:u.no})),inventory:I.list.filter(r=>r.refs[ref]).map(r=>({item:r.item,...r.refs[ref]})),supplier:M.rows.filter(r=>r.ref===ref).map(r=>({item:r.item,received:r.received,onSite:r.onSite,numbers:r.numbers}))}));});observations.ownership=ownership;
  const ownerMismatch=ownership.filter(r=>{const inv=r.inventory.find(i=>i.item==='FWF'),typed=r.physical.filter(u=>u.item==='FWF'&&u.owner==='event-portables');return inv?.on===typed.length&&typed.length>0&&inv.sub!==typed.length;});
  check('Single-item typed supplier identities reach inventory ownership totals',ownerMismatch.length===0,ownerMismatch.map(r=>({ref:r.ref,typedEventPortables:r.physical.length,inventorySub:r.inventory[0]?.sub})));
  if(ownerMismatch.length)findings.push({id:'single-item-inventory-ownership',severity:'high',references:ownerMismatch.map(r=>r.ref),source:'Inventory960.managed / allocation original lines79061–79063',detail:'Single-item references with verified Event Portables units are omitted from supplier inventory totals when legacy subOf is empty.'});
  // Unknown-quantity fixture isolates the reader; the original live dataset currently has no unknown active lines.
  const originalAssets=allAssets,unknownAsset={...assetOf('P25'),key:'AUDIT-UNKNOWN',asset_numbers:[],charge_lines:[{item:'Building 4.8m',discipline:'Portable buildings',quantity:null}],item_types:['Building 4.8m']};
  try{allAssets=()=>[unknownAsset];const x=inventory().list.find(r=>r.refs['AUDIT-UNKNOWN']);observations.unknownFixture={inventoryAsked:x?.refs['AUDIT-UNKNOWN']?.asked,map:mapQuantity1010(unknownAsset,'unknown')};if(x?.refs['AUDIT-UNKNOWN']?.asked===1)findings.push({id:'inventory-unknown-default',severity:'medium',source:'inventory() original line16103',detail:'Unknown ordered quantity is assumed one in Inventory, while map quantity stays unknown. No current active live line has unknown quantity.'});}finally{allAssets=originalAssets;}
 }finally{for(const k of Object.keys(S))if(!(k in saved))delete S[k];Object.assign(S,saved);RENDER_MEMO.clear();for(const[k,v]of savedMemo)RENDER_MEMO.set(k,v);}
 check('Every in-memory fixture restored the exact original shared record',JSON.stringify(S)===before);
 return {author:'Andrew Fisher',asAt:day,version,checks,findings,observations,recordRestored:JSON.stringify(S)===before};
});
result.sourceSha256=hash;result.browserErrors=h.errors;result.network=h.counts;result.passed=result.checks.filter(x=>x.pass).length;result.failed=result.checks.filter(x=>!x.pass);fs.writeFileSync(path.join(out,'numbers1012.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({file:path.join(out,'numbers1012.json'),passed:result.passed,failed:result.failed,findings:result.findings,errors:h.errors,network:h.counts},null,2));if(result.failed.length||h.errors.length||h.counts.blocked)process.exitCode=1;
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
