/* Author: Andrew Fisher. In-memory native-setter practice only; no operational writes. */
'use strict';const fs=require('node:fs');const{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({hash:'#today'});await h.page.waitForFunction(()=>SYNC.status==='live'&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),original=clone(S),originalJSON=JSON.stringify(S),rawRates=JSON.stringify([S.rates,S.lineRates,S.accRates,ONHIRE_ROWS]),nativeVersion=SYNC.backend.readVersion821();
  const funcs={save,bump,mayWrite,whoAmI,flash};let captures=0;const out={author:'Andrew Fisher',nativeVersion,targets:[]};
  const docs=()=>Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
  const oldDocs=docs();
  const reset=()=>{for(const key of Object.keys(S))delete S[key];Object.assign(S,clone(original));sharedCache975();};
  const capture=()=>holdAssets(()=>{const a=assetOf('WC09'),sup=Supplier996.model();return clone({lines:chargeLines(a).map(l=>({item:l.item,qty:qtyOf(l)})),delivery:deliveryOf('WC09'),items:toiletRows962(a,deliveryOf('WC09'),chargeLines(a),todayIso()),units:gcModel925(a).rows.filter(u=>u.physical).map(u=>({item:u.item,owner:u.owner,no:u.assetNo})),charges:arrivedChargeRows975(a),supplier:sup.rows.filter(r=>r.ref==='WC09'),receipts:sup.receipts.filter(r=>r.ref==='WC09').map(r=>({item:r.item,date:r.date,count:r.count})),remaining:sup.remaining.filter(r=>r.ref==='WC09'),map:gc500MapStatus1009(['WC09']).states,inventory:inventory().list.filter(r=>r.refs.WC09).map(r=>({item:r.item,...r.refs.WC09})),docs:docs()});});
  try{
   save=()=>{captures++;sharedCache975();return true;};bump=()=>{captures++;sharedCache975();return true;};mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';flash=()=>{};
   out.before=capture();
   for(const target of [6,10]){
    reset();if(chargeLines(assetOf('WC09'))[0]?.item!=='FWF')throw Error('First-item guard failed');
    if(setQty('WC09',String(target))!==true)throw Error('Quantity setter failed');
    const qtyOnly=capture();
    setSupplied('WC09','FWF',{supplied:'FWF',qty_supplied:4});const withReceipt=capture();
    setLabour('WC09','Toilets & amenities','FWF','install',true);const withInstallation=capture();
    const changed=[];for(const coll of new Set([...Object.keys(oldDocs),...Object.keys(withInstallation.docs)]))for(const id of new Set([...Object.keys(oldDocs[coll]||{}),...Object.keys(withInstallation.docs[coll]||{})]))if(JSON.stringify(oldDocs[coll]?.[id])!==JSON.stringify(withInstallation.docs[coll]?.[id]))changed.push({collection:coll,id,key:withInstallation.docs[coll]?.[id]?._k||oldDocs[coll]?.[id]?._k||id});
    out.targets.push({target,qtyOnly,withReceipt,withInstallation,changedDocuments:changed});
   }
  }finally{reset();save=funcs.save;bump=funcs.bump;mayWrite=funcs.mayWrite;whoAmI=funcs.whoAmI;flash=funcs.flash;}
  out.interceptedLocalSaveCalls=captures;out.nativeRestored=originalJSON===JSON.stringify(S);out.ratesUnchanged=rawRates===JSON.stringify([S.rates,S.lineRates,S.accRates,ONHIRE_ROWS]);out.versionUnchanged=SYNC.backend.readVersion821()===nativeVersion;return out;
 });
 result.errors=h.errors;result.requests=h.counts;fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2));console.log(JSON.stringify({nativeVersion:result.nativeVersion,targets:result.targets.map(t=>({target:t.target,stages:[t.qtyOnly,t.withReceipt,t.withInstallation].map(s=>({items:s.items.rows.map(r=>({item:r.item,qty:r.quantity,arrived:r.arrived,done:r.done,conflict:r.conflict})),receipts:s.receipts,chargeQuantities:s.charges.map(c=>({item:c.item,arrived:c.arrived,charges:c.charges.map(x=>({line:x.key,qty:x.qty}))}))})),changedDocuments:t.changedDocuments})),nativeRestored:result.nativeRestored,ratesUnchanged:result.ratesUnchanged,versionUnchanged:result.versionUnchanged,errors:h.errors,requests:h.counts}));
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
