/* Author: Andrew Fisher. Isolated in-memory audit scenarios; every non-GET request is blocked. */
'use strict';
const fs=require('fs');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>{
  const original=JSON.stringify(S), checks=[], cases={},ck=(name,v)=>checks.push({name,pass:!!v}), cents=n=>Math.round(n*100), eq=(a,b)=>cents(a)===cents(b);
  const reset=()=>{S=JSON.parse(original);sharedCache975();};
  function capture(){return holdAssets(()=>{const m=moneySummary(),p=pl770Model(),j=cj764Model(),b=branchFinancial978(pl752Rows(),m),f=fh866Model(),o=onsiteComplete979();return {now:m.charge.total,job:p.revJob,direct:p.direct,directJob:p.directJob,checks:p.checks,branches:b,generator:generatorModel1004(),invoice:f.invTotal,invoiceCheck:f.invCheck,pee:peeHireForecast979(),onsite:o.rows.filter(r=>r.ref==='WC09'),supplier:supplierPricing1014(),plan:Supplier996.model(),remaining:Supplier996.deliveryLoads?Supplier996.deliveryLoads():null};});}
  try{
   cases.base=capture();ck('settled P&L reconciles',Object.values(cases.base.checks).every(Boolean));ck('settled branch totals reconcile',Object.values(cases.base.branches.checks).every(Boolean));ck('settled Finance invoice totals reconcile',Object.values(cases.base.invoiceCheck).every(Boolean));
   const syntheticRate=Math.max(500,Math.ceil(cases.base.pee.pricing1010.supplierFloor)+50),actualHire=syntheticRate*cases.base.pee.arrivedQuantity,forecastHire=syntheticRate*cases.base.pee.quantity;
   S.lineRates[Pricing1010.hireKey]=String(syntheticRate);sharedCache975();cases.peeRate=capture();
   ck('Pee Panel typed rate changes actual once',eq(cases.peeRate.now-cases.base.now,actualHire-cases.base.pee.actualAmount));ck('Pee Panel rate changes forecast once',eq(cases.peeRate.job-cases.base.job,forecastHire-cases.base.pee.amount));ck('Pee Panel rate updates drawer',eq(cases.peeRate.onsite.find(r=>r.item==='Pee Panel').hire,actualHire));ck('Customer rate leaves supplier costs unchanged',eq(cases.peeRate.direct,cases.base.direct)&&eq(cases.peeRate.directJob,cases.base.directJob));
   reset();S.supplied.WC09.items.find(r=>r.asked==='Pee Panel').qty_supplied=4;sharedCache975();cases.peeQty=capture();ck('partial receipt charges four actual panels',eq(cases.peeQty.onsite.find(r=>r.item==='Pee Panel').hire,cases.base.pee.rate*4));ck('partial receipt retains full-job forecast',eq(cases.peeQty.job,cases.base.job));
   reset();S.branch.WC09='NVAC';sharedCache975();cases.branch=capture();ck('branch edit retains total',eq(cases.branch.now,cases.base.now)&&eq(cases.branch.job,cases.base.job));ck('branch edit still reconciles',Object.values(cases.branch.branches.checks).every(Boolean));ck('branch edit moves WC09 drawer allocation',cases.branch.onsite.every(r=>r.branch==='NVAC'));
   reset();S.purchaseOrders['4647519'].amount+=1;sharedCache975();cases.poValue=capture();ck('PO amount never double counts Direct costs',eq(cases.poValue.direct,cases.base.direct)&&eq(cases.poValue.directJob,cases.base.directJob));ck('PO amount discrepancy is shown',cases.poValue.supplier.orders.find(o=>o.number==='4647519').difference!==0);
   reset();
   cases.windows=['2026-10-22','2026-10-23','2026-10-24','2026-10-25','2026-10-26'].map(day=>({day,...GeneratorFinance1004.windowOf(day)}));
   ck('Thursday includes one standdown day',cases.windows[0].standdownDays===1&&cases.windows[0].eventDays===3);ck('Friday through Sunday only full race days',cases.windows.slice(1,4).every((r,i)=>r.standdownDays===0&&r.eventDays===3-i));ck('Monday has no generator hire',cases.windows[4].standdownDays===0&&cases.windows[4].eventDays===0);
   const g=cases.base.generator;ck('generator actual plus remaining equals forecast',eq(g.actual+g.remaining,g.forecast));ck('generator standdown and race charges equal forecast',eq(g.standdown+g.race,g.forecast));ck('all current generators stop commercial hire Sunday',g.rows.every(r=>r.offhire==='2026-10-25'));ck('all current generator priced rows retain positive quantities',g.rows.every(r=>Number.isFinite(r.qty)&&r.qty>0&&r.forecast!=null));
   for(const [id,r] of g.contracts){const source=ONHIRE_ROWS.find(x=>String(x.rental_contract)+':'+x.line===id),start=r.from,sd=Math.max(0,(Date.parse('2026-10-23')-Date.parse(start))/86400000),ed=Math.max(0,(Date.parse('2026-10-25')-Math.max(Date.parse(start),Date.parse('2026-10-23')))/86400000+1);ck('independent generator contract-line multiplication '+id,eq(r.forecast,source.quantity*(r.standdownRate*sd+r.dailyRate*ed)));}
   cases.partialGenerator=GeneratorFinance1004.project([{id:'audit-partial',ref:'AUDIT',refLabel:'AUDIT',qty:2,item:'200kva',actualIsConfirmed:true,actualQuantity:1,deliveredDate:'2026-10-14',plannedDate:'2026-10-20',deliverySource:'Recorded on-site arrival (AEST)',branch:'NVAC',contractRows:[{rental_contract:'AUDIT',line:1,quantity:2,rate_1:null}],contractDeliveries:[{id:'AUDIT:1',quantity:2,actualIsConfirmed:true,deliveredDate:'2026-10-14'}],issues:[]}],{lineRate:()=>null,weeklyRate:()=>null,rehire:()=>false});
   reset();ck('in-memory changes restored',JSON.stringify(S)===original);
   return {checks,cases};
  }finally{reset();}
 });
 fs.writeFileSync(process.env.OUT,JSON.stringify({author:'Andrew Fisher',...result,errors:h.errors,counts:h.counts},null,2)+'\n');
 console.log(JSON.stringify({checks:result.checks.length,failed:result.checks.filter(c=>!c.pass),errors:h.errors,counts:h.counts}));
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
