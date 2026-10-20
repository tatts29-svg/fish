/* Author: Andrew Fisher. Exact supplier-only financial deltas on a frozen native record.
   GC500_FIXTURE=/private/fixture GC500_CAPTURE=1 node test_browser1094.cjs BASE CANDIDATE /private/results
   Run under flock /tmp/gc500-browser.lock; [MOB=1] selects phone. Never writes records. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const C=require('../v10.66_speed_smooth_LIVE/tests/validation/common.cjs');
const [base,candidate,out]=process.argv.slice(2);if(!base||!candidate||!out)throw Error('Need BASE CANDIDATE private output');
const mobile=process.env.MOB==='1';
const numeric=v=>Array.isArray(v)?v.map(numeric):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k,x])=>typeof x!=='string').map(([k,x])=>[k,numeric(x)])):v;
const cents=n=>Math.round(n*100),without=(v,keys)=>Object.fromEntries(Object.entries(v).filter(([k])=>!keys.includes(k)));
const delta=(a,b,d,label)=>assert.equal(cents(b)-cents(a),cents(d),label);
async function capture(page){return page.evaluate(()=>holdAssets(()=>{
 RENDER_MEMO.clear();const m=moneySummary(),p=pl770Model(),r=rh766Model(),x=cj764Model();
 return {record:JSON.stringify(S),quotes:DATA.rehire_quotes,service:servicing748(),branch:pl760ToiletBranch(),money:m,ledger:p,rehire:r,forecast:x,
 monthly:['2026-09','2026-10'].map(month=>({month,model:acc761Model(month),shares:supplierCostQuotes1068().map(q=>({quote:q.quote,share:acc762Share(q.knownCostTotal1068,acc762Date(q.delivery)||acc762Date(q.use_on),acc762Date(q.collect)||acc762Date(q.use_on),month,todayIso())}))})),
 extra:Supplier955.model(),supplier:Supplier996.model(),ownCosts:ourCosts(),po:poAll()};
}));}
async function arm(file,label){
 const s=await C.launch({pageFile:file,mobile,hash:'#costs',init:'window.__validationClock.set(Date.parse("2026-10-20T14:46:06Z"));localStorage.setItem("gc500_motion","off");'});
 try{
  await C.ready(s);await C.settled(s.page);assert.equal((await C.mergeReport(s.page)).complete,true);
  const before=await capture(s.page);C.writePrivate(path.join(out,label+'.json'),before);
  if(label==='candidate'){
   const status=await s.page.evaluate(()=>epCostStatus1094Model());assert.equal(status.complete,true);assert.equal(status.label,'All supplied rates recorded');
   assert.equal(status.currentCost,before.service.supplier1068.total);assert.equal(status.originalQuoteCost,before.service.supplier1068.quotedTotal);
   const ep=before.rehire.groups.find(g=>g.what==='Toilets — Event Portables');assert.equal(status.additionalHireForecast,ep.costToCome);assert.equal(status.combinedEstimate,ep.costJob);assert.match(ep.costState,/All supplied rates recorded/);
   assert(before.forecast.gaps.some(g=>g.what==='Event Portables — invoice and PO documents'&&/documentary check/.test(g.why)));
   for(const tab of ['subhired','pricing']){
    await s.page.evaluate(t=>go(t),tab);await C.settled(s.page);
    const result=await s.page.evaluate(tab=>{const pane=document.getElementById('pane-'+tab),card=pane?.querySelector('[data-supplier-cost1094]');if(!card)throw Error('Missing cost status in '+tab);card.scrollIntoView({block:'center',behavior:'instant'});const b=card.getBoundingClientRect();return {text:card.textContent,width:card.clientWidth,scrollWidth:card.scrollWidth,left:b.left,right:b.right,viewport:innerWidth};},tab);
    assert.match(result.text,/All supplied rates recorded/);assert.match(result.text,/Original quote cost/);assert.match(result.text,/Additional hire forecast/);assert.match(result.text,/does not confirm an invoice/);assert(result.scrollWidth<=result.width+2);assert(result.left>=-2&&result.right<=result.viewport+2);
    await s.page.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-'+tab+'.png')});
   }
   const missing=await s.page.evaluate(()=>{
    const line=DATA.rehire_quotes.quotes[0].groups[0].lines[0],prior=line.unit_price;delete line.unit_price;RENDER_MEMO.clear();
    try{return {model:epCostStatus1094Model(),html:epCostStatus1094Html(),label:epCostStatus1094Label()};}finally{line.unit_price=prior;RENDER_MEMO.clear();}
   });assert.equal(missing.model.complete,false);assert(!missing.html.includes('All supplied rates recorded'));assert(!missing.label.includes('All supplied rates recorded'));
   const restored=await capture(s.page);assert.deepEqual(restored.quotes,before.quotes);assert.equal(restored.record,before.record);assert.deepEqual(restored.money,before.money);
   C.writePrivate(path.join(out,'status-checks.json'),{status,missing});
  }
  C.assertClean(s);C.writePrivate(path.join(out,label+'-health.json'),C.errorsOf(s));return before;
 }finally{await s.browser.close();}
}
(async()=>{
 const a=await arm(base,'baseline'),b=await arm(candidate,'candidate'),hire=b.service.supplier1068.hire1094;
 const currentDelta=hire.rows.concat(hire.excluded).reduce((n,r)=>n+r.amountCents-r.quotedAmountCents,0)/100;
 const remainingDelta=b.extra.estimate-a.extra.estimate,jobDelta=(cents(currentDelta)+cents(remainingDelta))/100;
 assert.equal(a.record,b.record,'native record exact');assert.deepEqual(a.quotes,b.quotes,'source quotes exact');
 assert.deepEqual(without(a.service,['supplier1068']),without(b.service,['supplier1068']),'service quantities/rates/amounts exact');
 assert.equal(a.branch,b.branch);assert.deepEqual(a.supplier,b.supplier,'onsite assets exact');
 assert.deepEqual(a.ownCosts,b.ownCosts,'no actual supplier expense invented');assert.deepEqual(a.po,b.po,'PO and invoice fields preserved');
 assert.deepEqual(a.money.charge,b.money.charge,'all customer Revenue exact');
 assert.deepEqual(without(a.money.cost,['rehire','rehire_estimate1068','known']),without(b.money.cost,['rehire','rehire_estimate1068','known']),'other cost inputs exact');
 for(const k of ['rehire','rehire_estimate1068','known'])delta(a.money.cost[k],b.money.cost[k],currentDelta,'money '+k);
 delta(a.service.supplier1068.total,b.service.supplier1068.total,currentDelta,'supplier total');
 assert.deepEqual(a.ledger.rev,b.ledger.rev,'revenue ledgers exact');assert.deepEqual(a.forecast.revenue,b.forecast.revenue,'remaining Revenue exact');
 for(const k of ['direct','costNow'])delta(a.ledger[k],b.ledger[k],currentDelta,'ledger '+k);
 for(const k of ['directJob','costJob'])delta(a.ledger[k],b.ledger[k],jobDelta,'ledger '+k);
 for(const k of ['over','overJob','revNow','revJob'])assert.equal(a.ledger[k],b.ledger[k],'ledger '+k);
 assert.deepEqual(a.ledger.wages,b.ledger.wages);assert.equal(a.ledger.qk.pump,b.ledger.qk.pump);assert.equal(a.ledger.qk.cons,b.ledger.qk.cons);delta(a.ledger.qk.rehire,b.ledger.qk.rehire,currentDelta,'Rehire supplier classification');
 assert(Object.values(b.ledger.checks).every(Boolean),'all ledger ties');
 const ep=rs=>rs.groups.find(g=>g.what==='Toilets — Event Portables'),ea=ep(a.rehire),eb=ep(b.rehire);
 delta(ea.cost,eb.cost,currentDelta,'EP cost');delta(ea.costToCome,eb.costToCome,remainingDelta,'EP remaining');delta(ea.costJob,eb.costJob,jobDelta,'EP job');
 for(const k of ['rev','revToCome','revJob','units','lines','branch'])assert.equal(ea[k],eb[k],'EP '+k);
 assert.deepEqual(a.rehire.groups.filter(g=>g!==ea),b.rehire.groups.filter(g=>g!==eb),'all other suppliers exact');
 for(const ar of a.rehire.byBranch){const br=b.rehire.byBranch.find(r=>r.branch===ar.branch);assert.equal(ar.revJob,br.revJob);delta(ar.costJob,br.costJob,ar.branch===a.branch?jobDelta:0,'branch '+ar.branch);}
 for(const k of ['known','plKnown','plParts'])delta(a.forecast[k],b.forecast[k],currentDelta,'forecast '+k);
 delta(a.forecast.toCome,b.forecast.toCome,remainingDelta,'forecast remaining');delta(a.forecast.job,b.forecast.job,jobDelta,'forecast job');
 for(let i=0;i<a.monthly.length;i++){
  const am=a.monthly[i],bm=b.monthly[i],A=am.model,B=bm.model;
  for(const k of ['revenue','wip','invoiceRecords','invoiceSnapshotTotal','invoiced','revenueTotal','forecastRevenueTotal'])assert.deepEqual(A[k],B[k],'monthly customer/invoice '+k);
  const changedShare=(bm.shares.find(q=>q.quote==='Q6845').share?.amount||0)-(am.shares.find(q=>q.quote==='Q6845').share?.amount||0);
  const monthlyForecast=bm.month===a.extra.month?remainingDelta:0;
  delta(A.costCandidateTotal,B.costCandidateTotal,(cents(changedShare)+cents(monthlyForecast))/100,'monthly candidate cost');
  for(const quote of bm.shares){const rows=B.costs.flatMap(r=>r.extra?.sources||[]).filter(s=>s.quote===quote.quote);if(quote.share)assert.equal(cents(rows.reduce((n,s)=>n+s.amount,0)),cents(quote.share.amount),'monthly quote share '+quote.quote);else assert.equal(rows.length,0);}
  assert(B.costs.flatMap(r=>r.extra?.sources||[]).filter(s=>s.quote).every(s=>s.invoiceStatus==='unknown'&&s.paymentStatus==='unknown'),'no invented invoice/payment completion');
 }
 C.writePrivate(path.join(out,'result.json'),{pass:true,mobile,expectedSupplierOnlyDeltas:{currentDelta,remainingDelta,jobDelta},customerRevenueParity:true,nativeRecordParity:true,branch:a.branch,sourceQuotesUnchanged:true,invoiceEvidenceUnchanged:true,baseSha:C.sha(C.fs.readFileSync(base)),candidateSha:C.sha(C.fs.readFileSync(candidate)),fixtureVersions:C.errorsOf({errors:[],counts:{blocked:0},consoleErrors:[]}).fixtureVersions});
 console.log(JSON.stringify({pass:true,mobile,customerRevenueParity:true,nativeRecordParity:true,sourceQuotesUnchanged:true}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
