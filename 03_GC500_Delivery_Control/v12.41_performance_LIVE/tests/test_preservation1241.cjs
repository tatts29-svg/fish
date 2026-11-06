/* Author: Andrew Fisher. Financial preservation on one identical frozen current record, including linked actuals. */
'use strict';
const assert=require('node:assert/strict');
const {openCandidate}=require('./browser_harness.cjs');
const read=()=>holdAssets(()=>{
 RENDER_MEMO.clear();HELD_MEMO.clear();
 const copy=x=>JSON.parse(JSON.stringify(x));
 const M=moneySummary(),P=pl770Model(),C=cj764Model(),SCOPE_NOW=scopeFigures(),F=fin745Summary(),A=acc761Labour(),R=recon888Model();
 const nums=x=>Object.fromEntries(Object.entries(x).filter(([,v])=>typeof v==='number'||typeof v==='boolean'||v===null));
 return copy({
  eventDays:typeof EventCrew1237==='undefined'?0:EventCrew1237.model().days.length,
  customer:nums(M.charge),direct:nums(M.cost),streams:M.streams.map(x=>[x.key,x.charge,x.cost,x.cost_known]),
  categories:M.categories.map(x=>[x.key,x.amount,x.known,x.hours]),
  pl:nums(P),revenue:P.rev.map(x=>[x.key,x.now,x.job]),costs:P.cost.map(x=>[x.key,x.now,x.job]),checks:P.checks,
  costToJobEnd:nums(C),costRows:C.rows.map(x=>[x.stream,x.toDate,x.toCome,x.job]),
  scope:nums(SCOPE_NOW),scopeLines:SCOPE_NOW.lines.map(x=>({key:x.key,hours:x.hours,rate:x.rate,amount:x.amount,amount_exact:x.amount_exact,days:x.days})),
  green:greenBookTotals(),billed:FenceInvoiced1219.billed(),branch:branchFinancial978(pl752Rows(),M),
  mapChoices:allAssets().slice(0,12).map(a=>[a.key,Find1176.locate({kind:'asset',key:a.key})]),
  supplierPricing:(()=>{const p=supplierPricing1014();return {orders:p.orders,records:[...p.records],extras:p.extras,issues:p.issues};})(),
  finance:nums(F),financeRows:F.rows.map(x=>[x.id,x.status,x.paid,x.worked,x.calculatedCost,x.actualCost,x.allocation]),
  accrual:nums(A.all),crew:nums(RaceCrew1227.model()),peopleHomes:fh868People(),
  reconciliation:{ok:R.ok,bad:R.bad,count:R.count,failing:R.ties.filter(t=>!t.ok).map(t=>t.what)}
 });
});
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE,'BASE, PAGE and STATE must pin both pages to one frozen record');
 const candidate=process.env.PAGE,result={};
 for(const [key,pageFile]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=pageFile;const s=await openCandidate();
  try{result[key]=await s.page.evaluate(read);result[key].pageErrors=s.errors.length;result[key].writeAttempts=s.counts.blocked;}finally{await s.browser.close();}
 }
 const sameExisting=(a,b)=>a&&typeof a==='object'?!!b&&typeof b==='object'&&(!Array.isArray(a)||Array.isArray(b)&&a.length===b.length)&&Object.keys(a).every(k=>sameExisting(a[k],b[k])):Object.is(a,b);
 const names=Object.keys(result.base);let pass=0,fail=0;
 for(const name of names){const ok=sameExisting(result.base[name],result.candidate[name]);console.log((ok?'PASS ':'FAIL ')+name+' unchanged on the identical current record');ok?pass++:fail++;}
 if(result.candidate.eventDays!==result.base.eventDays){console.error('FAIL linked source coverage changed');fail++;}
 if(process.env.REPORT)require('fs').writeFileSync(process.env.REPORT,JSON.stringify({author:'Andrew Fisher',base:result.base,candidate:result.candidate,pass,fail},null,2));
 console.log(pass+'/'+(pass+fail)+' preservation checks');process.exitCode=fail?1:0;
})().catch(e=>{console.error('FAIL preservation harness: '+e.message);process.exitCode=1;});
