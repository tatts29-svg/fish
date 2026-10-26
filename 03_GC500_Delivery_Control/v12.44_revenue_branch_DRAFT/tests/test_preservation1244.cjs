/* Author: Andrew Fisher. Exact inactive-release preservation after the preceding customer decisions. GET only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {openCandidate}=require('./browser_harness.cjs');
const read=()=>{
 RENDER_MEMO.clear();HELD_MEMO.clear();return holdAssets(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),M=moneySummary(),P=pl770Model(),X=cj764Model(),H=fh866Model(),R=rh766Model(),B=branchFinancial978(pl752Rows(),M),F=fin745Summary(),T=recon888Model();
  const moneyFields=x=>Object.fromEntries(Object.entries(x).filter(([,v])=>typeof v==='number'||typeof v==='boolean'||v===null));
  return clone({money:M,pnl:P,closeout:X,scope:scopeFigures(),branches:B,invoiceRows:H.inv,invoiceTotal:H.invTotal,invoiceChecks:H.invCheck,
   financeCosts:{costs:H.costs,total:H.costTotal,people:H.people,demob:H.demob},financeShifts:F.rows,financeSummary:moneyFields(F),
   supplierSource949:Source949.model(),supplier955:Supplier955.model(),supplierService:supplierService1068(),supplierHire:supplierHire1094Model(),rehire:R,
   supplierPricing:(()=>{const p=supplierPricing1014();return{orders:p.orders,records:[...p.records],extras:p.extras,issues:p.issues}})(),
   green:greenBookTotals(),billed:FenceInvoiced1219.billed(),crew:RaceCrew1227.model(),peopleHomes:fh868People(),accrual:acc761Labour(),
   contracts:ONHIRE_ROWS.map(r=>({key:'c|'+r.rental_contract+'|'+r.line,branch:generatorBranch1004(r),charge:contractCharge(r),owner:finance928ContractOwner(r),category:r.charge_line?contractChargeCategory1224(r):null})),
   forecast:pricingForecast1010(),source:{contracts:ONHIRE_ROWS,scope:SCOPE},
   physical:allAssets().map(a=>({ref:a.key,branch:branchOf(a.key),units:gcModel925(a).rows})),
   customerDecisions:Object.fromEntries(Object.entries(S.answers||{}).filter(([k])=>k.startsWith('charge-treatment1239|'))),
   branchDecisions:Object.fromEntries(Object.entries(S.answers||{}).filter(([k])=>k.startsWith('revenue-branch1240|'))),
   record:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
   reconciliation:{ok:T.ok,bad:T.bad,count:T.count,failing:T.ties.filter(t=>!t.ok).map(t=>t.what)}
  });
 });
};
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE,'BASE, PAGE and STATE are required');
 const candidate=process.env.PAGE,result={},checks=[];
 for(const[label,page]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=page;const s=await openCandidate();
  try{result[label]={model:await s.page.evaluate(read),baseline:s.baseline,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};}
  finally{await s.browser.close()}
 }
 const check=(ok,name)=>checks.push({ok:!!ok,name});
 for(const[label,r]of Object.entries(result)){
  check(r.errors.length===0&&r.consoleErrors.length===0&&r.writes===0,label+' has zero runtime/console errors or HTTP write attempts');
  check(r.baseline.docsMatch&&r.baseline.inflight===0&&r.baseline.queued===0,label+' starts on the exact settled frozen record');
  if(process.env.EXPECTED_CUSTOMER_DECISIONS)check(Object.keys(r.model.customerDecisions).length===Number(process.env.EXPECTED_CUSTOMER_DECISIONS),label+' includes all required prior customer decisions');
  check(Object.keys(r.model.branchDecisions).length===0,label+' has no preinstalled Revenue branch decisions');
 }
 check(result.base.baseline.stateSha256===result.candidate.baseline.stateSha256,'both pages use the same frozen record bytes');
 for(const name of Object.keys(result.base.model)){
  try{assert.deepEqual(result.candidate.model[name],result.base.model[name]);check(true,name+' unchanged before new branch decisions');}catch(e){check(false,name+' differs before new branch decisions')}
 }
 for(const c of checks)console.log((c.ok?'PASS ':'FAIL ')+c.name);
 const passed=checks.filter(c=>c.ok).length;console.log(passed+'/'+checks.length+' preservation checks');
 if(process.env.REPORT)fs.writeFileSync(process.env.REPORT,JSON.stringify({author:'Andrew Fisher',checks,...result},null,2));
 if(passed!==checks.length)process.exitCode=1;
})().catch(e=>{console.error('FAIL '+e.message);process.exitCode=1});
