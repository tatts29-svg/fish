/* Author: Andrew Fisher. Actual-public generator inventory reconciliation; every non-GET is blocked. */
'use strict';
const fs=require('fs');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(async()=>{
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch('/v/Coates-GC500-2026',{cache:'no-store'})).arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join('');
  return holdAssets(()=>{
   const assets=allAssets(),generators=assets.filter(a=>a.discipline==='Generators'||/^GN/.test(a.key)||/generator|\d\s*kva\b/i.test((a.item_types||[]).join(' '))),keys=generators.map(a=>a.key),inputs=generatorInputs1004(),model=generatorModel1004(),money=moneySummary(),pl=pl770Model();
   return {at:new Date().toISOString(),sha,nativeVersion:SYNC.backend.readVersion821(),dataKeys:Object.keys(DATA),assets:generators.map(a=>({asset:a,lines:chargeLines(a),delivery:deliveryOf(a.key),units:unitsOf(a.key),destination:destinationOf(a),pin:refLatLon(a),master:MASTER_LOC[a.key],branch:branchOf(a.key),assetTotal:assetTotal(a)})),inputs,model:{...model,contracts:[...model.contracts]},contracts:ONHIRE_ROWS.filter(r=>r.kind==='generator'||r.family==='generator'||/\bgenerator\b|\d\s*kva\b/i.test([r.what,r.description,r.register_type].join(' '))),state:Object.fromEntries(['hireStart','delivery','supplied','assetNumbers','branch','fixes','places','moved','rates','lineRates','cancelled'].filter(k=>S[k]).map(k=>[k,['rates','lineRates'].includes(k)?S[k]:Object.fromEntries(Object.entries(S[k]).filter(([key])=>keys.includes(key)))])),onsite:onsiteComplete979().rows.filter(r=>keys.includes(r.ref)),money:money.charge,pl:{rev:pl.rev,revNow:pl.revNow,revJob:pl.revJob,checks:pl.checks},branches:branchFinancial978(pl752Rows(),money)};
  });
 });
 fs.writeFileSync(process.env.OUT,JSON.stringify({author:'Andrew Fisher',...result,errors:h.errors,counts:h.counts},null,2)+'\n');console.log(JSON.stringify({assets:result.assets.length,inputs:result.inputs.length,modelGroups:result.model.rows.length,modelQty:result.model.rows.reduce((s,r)=>s+r.qty,0),contracts:result.contracts.length,nativeVersion:result.nativeVersion,sha:result.sha,errors:h.errors,counts:h.counts}));
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
