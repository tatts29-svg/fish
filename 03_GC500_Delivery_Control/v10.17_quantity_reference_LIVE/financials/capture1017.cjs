/* Author: Andrew Fisher. Independent read-only financial parity capture; raw output stays private. */
'use strict';
const fs=require('fs'),crypto=require('crypto');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
if(!process.env.OUT)throw Error('Private OUT path required');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const before=JSON.stringify(S),assets=allAssets(),money=moneySummary(),pl=pl770Model(),generator=generatorModel1004(),finance=fh866Model(),branches=branchFinancial978(pl752Rows(),money),I=inventory();
  const clean=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='asset'?undefined:v instanceof Map?[...v]:v instanceof Set?[...v]:v));
  const lines=a=>chargeLines(a).map(l=>({line:l,received:receivedChargeQty1006(a,l)}));
  const a=assetOf('WC09'),domains={
   nativeState:S,eventConfig:EventConfig1013.current(),money,pl,job:cj764Model(),finance,branches,
   generator:clean(generator),generatorInputs:clean(generatorInputs1004()),onsite:onsiteComplete979(),
   contracts:ONHIRE_ROWS.map(r=>({row:r,charge:contractCharge(r)})),
   rates:{card:DATA.rate_card,accessoryCard:DATA.accessory_rate_card,sourceMatch:DATA.rate_match,enteredRates:S.rates,enteredLineRates:S.lineRates},
   chargeScope:assets.map(a=>({ref:a.key,cancelled:a._cancelled||null,moved:a._movedTo||null,lines:lines(a),delivery:deliveryOf(a.key)})),
   supplier:Supplier996.model(),supplierPricing:supplierPricing1014(),fencing:fenceDerived(),labour:labourPlan(),transport:transport888Core(),buildingTransport:buildingTransportModel831(),
   wc09:{lines:lines(a),supplied:S.supplied.WC09,assetNumbers:S.assetNumbers.WC09,delivery:deliveryOf('WC09'),units:gcModel925(a).rows,onsite:onsiteComplete979().rows.filter(r=>r.ref==='WC09')}
  };
  const inventoryMoney=inv83Money(I.list);
  return clean({nativeVersion:SYNC.backend.readVersion821(),date:todayIso(),unchanged:before===JSON.stringify(S),domains,
   projection:{inventory:I.list.map(r=>({type:r.type,item:r.item,asked:r.asked,on:r.on,received:r.received1017,remaining:r.remaining1017,refs:Object.keys(r.refs||{}),money:inventoryMoney.get(r.type)}))},
   reconciliation:{pl:pl.checks,branch:branches.checks,finance:finance.invCheck}});
 }));
 const evidence={author:'Andrew Fisher',...result,pageSha:process.env.PAGE?crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'):null,errors:h.errors,counts:h.counts,checkedAt:new Date().toISOString()};
 fs.writeFileSync(process.env.OUT,JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({nativeVersion:result.nativeVersion,domains:Object.keys(result.domains).length,unchanged:result.unchanged,pageSha:evidence.pageSha,errors:h.errors,counts:h.counts}));
 if(h.errors.length||h.counts.blocked||!result.unchanged)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
