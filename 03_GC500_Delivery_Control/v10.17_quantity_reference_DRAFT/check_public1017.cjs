/* Author: Andrew Fisher. GET-only verification of the combined quantity correction. */
'use strict';
const fs=require('node:fs');
const {open}=require('../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#plant',mobile:true,W:390,H:844});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&Refresh904.report().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const before=JSON.stringify(S),checks=[],check=(name,pass)=>checks.push({name,pass:!!pass});
  const I=inventory(),get=item=>I.list.find(r=>r.item===item),fwf=get('FWF'),vms=get('VMS'),tl2=get('TL2'),M=demob816(),by=new Map(M.refs.map(r=>[r.key,r]));
  check('Quantity and collection modules present',!!window.Inventory1017&&!!window.DemobScope1017&&typeof waterBarrierPlacements1017==='function');
  check('All raw references retained',allAssets().length===182);
  check('Canonical collection scope retained',M.refs.length===173&&new Set(M.refs.map(r=>r.key)).size===173);
  check('Duplicate aliases and historical relocation omitted from pickups',['FL01','FL02','T0159'].every(k=>!by.has(k)));
  check('Original references still resolve',['FL01','FL02','T0159'].every(k=>assetOf(k)));
  check('Moved VMS collected at current locations',by.get('T0001').units.find(u=>u.type==='VMS').n===7&&by.get('T0103').units.find(u=>u.type==='VMS').n===2);
  check('Moved VMS does not create another outstanding delivery',vms.asked===24&&vms.on===9&&Inventory1017.remaining(vms)===14);
  check('Original eight-board delivery preserved',vms.refs.T0001.asked===8&&vms.refs.T0001.received1017===8&&vms.refs.T0001.on===7&&Inventory1017.remaining(vms.refs.T0001)===0);
  check('Supplier requests included once',fwf.asked===227&&fwf.on===175&&Inventory1017.remaining(fwf)===52&&Object.values(fwf.refs).filter(r=>r.sourceOnly1017).length===2);
  check('Barrier reinstatements separated from new supply',tl2.asked===311&&tl2.on===76&&Inventory1017.remaining(tl2)===235&&waterBarrierPlacements1017().reduce((n,r)=>n+r.quantity,0)===64);
  check('All barrier workfronts retained',Object.keys(tl2.refs).length===15);
  const supplier=Supplier996.model(),out=Inventory1017.outstanding(I,'*');
  check('Outstanding supplier unit total remains shared',supplier.remaining.reduce((n,r)=>n+r.remaining,0)===52);
  check('Source-only requests have no invented native assets',out.filter(r=>r.source1017).length===2&&out.filter(r=>r.source1017).every(r=>!assetOf(r.key)));
  const wc=chargeLines(assetOf('WC09'));
  check('WC09 unchanged while exact requested total is unresolved',wc.find(r=>r.item==='FWF').quantity===4&&wc.find(r=>r.item==='Pee Panel').quantity===6&&wc.filter(r=>r.item!=='FWF'&&r.item!=='Pee Panel').reduce((n,r)=>n+qtyOf(r),0)===2);
  check('Authorised Concert geographic point retained',MASTER_LOC['GN?'].ll[0]===-27.984576&&MASTER_LOC['GN?'].ll[1]===153.4277);
  const projected=generatorSheetPoint1017({lat:-27.984576,lon:153.4277});
  check('Concert drawing point uses exact inverse',MASTER_LOC['GN?'].pt.every((n,i)=>Math.abs(n-projected[i])<1e-10));
  check('No native mutation from shared readers',JSON.stringify(S)===before);
  return{author:'Andrew Fisher',nativeVersion:SYNC.backend.readVersion821(),checks,counts:{rawReferences:allAssets().length,canonicalCollectionReferences:M.refs.length,fwfRequested:fwf.asked,fwfOnsite:fwf.on,fwfRemaining:Inventory1017.remaining(fwf),vmsOnsite:vms.on,vmsRemaining:Inventory1017.remaining(vms),barrierNewSupply:tl2.asked,barrierOnsite:tl2.on,barrierReinstatementPlacements:64}};
 }));
 result.checks.push({name:'No browser exceptions or operational write attempts',pass:!h.errors.length&&!h.counts.blocked});
 result.requests=h.counts;result.errors=h.errors;
 if(!process.env.OUT)throw Error('Private output path required');
 fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({checks:result.checks.length,nativeVersion:result.nativeVersion,failed:result.checks.filter(c=>!c.pass),errors:h.errors,requests:h.counts}));
 if(result.checks.some(c=>!c.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
