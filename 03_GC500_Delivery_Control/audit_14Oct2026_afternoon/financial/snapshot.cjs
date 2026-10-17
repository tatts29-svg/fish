/* Author: Andrew Fisher. Read-only current-live financial audit. Raw evidence remains private. */
'use strict';
const fs=require('fs'),path=require('path');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const before=JSON.stringify(S), m=moneySummary(), p=pl770Model(), j=cj764Model(), f=fh866Model(), b=branchFinancial978(pl752Rows(),m), g=generatorModel1004(), onsite=onsiteComplete979();
  const refs=['WC57','WC53','WC51','WC48','WC49','WC54','WC09','T0265','T0266','T0001','WC07','WC21','FL02'];
  const items=refs.map(ref=>{const a=assetOf(ref);return {ref,delivery:deliveryOf(ref),branch:branchOf(ref),units:gcModel925(a).rows,lines:chargeLines(a),itemIdentities:chargeLines(a).map(l=>({item:l.item,selected:ItemIdentity979.select(a.key,l.item,ONHIRE_ROWS,gcModel925(a).rows)})),onsite:onsite.rows.filter(r=>r.ref===ref),asset:a};});
  const result={nativeVersion:SYNC.backend.readVersion821(),eventConfig:EventConfig1013.current(),date:todayIso(),money:m,pl:p,job:j,finance:f,branches:b,generator:g,generatorInputs:generatorInputs1004(),onsite,items,epInventory:epInventory860(),epPlan:epPlan870(),fence:fenceDerived(),supplier:supplierPricing1014(),source:Source949.model(),labour:labourPlan(),contractCharges:ONHIRE_ROWS.map(r=>({row:r,charge:contractCharge(r)})),unchanged:before===JSON.stringify(S)};
  return JSON.parse(JSON.stringify(result,(k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v));
 }));
 const evidence={...result,errors:h.errors,counts:h.counts,checkedAt:new Date().toISOString()};
 fs.writeFileSync(process.env.OUT,JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({nativeVersion:result.nativeVersion,unchanged:result.unchanged,errors:h.errors,counts:h.counts,plChecks:result.pl.checks,branchChecks:result.branches.checks,invoiceCheck:result.finance.invCheck,generatorRows:result.generator.rows.length,onsiteRows:result.onsite.rows.length}));
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
