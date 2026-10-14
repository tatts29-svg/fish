/* Author: Andrew Fisher. Independent browser integration. Private input fixtures never leave this machine. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const rig=path.resolve(__dirname,'../../toolchain/harness'),fetcher=require(rig+'/curlfetch');
for(const key of ['STATE','PAGE','PRICING_SPEC','OUT'])if(!process.env[key])throw Error('Missing '+key);
const fixture=JSON.parse(fs.readFileSync(process.env.STATE,'utf8'));
const spec=JSON.parse(fs.readFileSync(process.env.PRICING_SPEC,'utf8'));
const originalFetch=fetcher.curlFetch;let attemptedNativeWrites=0,externalPostsBlocked=0;
fetcher.curlFetch=async function(url,headers,method='GET',body){
 const p=new URL(url).pathname;
 if(method!=='GET'){if(p.startsWith('/api/'))attemptedNativeWrites++;else externalPostsBlocked++;return{status:405,headers:{'content-type':'text/plain'},body:'Read-only test'};}
 if(p==='/api/state'||p==='/api/version')return{status:200,headers:{'content-type':'application/json'},body:JSON.stringify(p==='/api/state'?fixture:{version:fixture.version,level:'view',updated:fixture.updated})};
 return originalFetch.call(this,url,headers,method,body);
};
const {open}=require(rig+'/open_page');let h;
(async()=>{try{
 h=await open({pageFile:process.env.PAGE,hash:'#fencing',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.clock.install({time:new Date(fixture.updated||Date.now())});
 const results=await h.page.evaluate(spec=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),r2=n=>Math.round((n+Number.EPSILON)*100)/100,near=(a,b)=>Math.abs(a-b)<0.005;
  const checks=[],ck=(name,pass,detail)=>checks.push({name,pass:!!pass,...(pass||detail===undefined?{}:{detail})});
  const beforeState=JSON.stringify(S),beforeLast=clone(SYNC.last),beforeQueue=clone(SYNC.queue),no=String(spec.number),expected=spec.expected;
  const ids=new Set(spec.supplier_pricing.records.map(r=>r.id)),redIds=new Set(spec.supplier_pricing.records.filter(r=>r.book==='red').map(r=>r.id)),greenIds=new Set(spec.supplier_pricing.records.filter(r=>r.book==='green').map(r=>r.id));
  const dom=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content;};
  const clear=()=>sharedCache975();
  const snapshot=()=>holdAssets(()=>{
   const money=moneySummary(),pl=pl770Model(),finance=fh866Model(),months=[...new Set(spec.supplier_pricing.records.map(r=>r.date.slice(0,7)).concat(spec.supplier_pricing.extras.map(r=>r.date.slice(0,7))))];
   return {split:clone(fencePaidSplit()),fd:clone(fenceDerived()),green:clone(greenBookTotals()),money:clone(money),pl:clone(pl),finance:clone(finance),monthly:Object.fromEntries(months.map(m=>[m,clone(acc761Model(m))])),forecast:clone(cj764Fencing()),costLines:clone(allCosts()),red:clone(allDockets()),notes:clone(serviceNoteRows()),blue:clone(collectionRows()),po:clone(poOf(no))};
  });
  const physical=x=>JSON.stringify(x.red.map(d=>({id:d.id,date:d.date,quantities:d.quantities,components:d.components,components_only:d.components_only,usable:d.usable})).concat(x.notes.map(d=>({id:d.id,date:d.date,hours:d.labour_hours,usable:d.usable})),x.blue));
  const charges=x=>JSON.stringify(x.red.map(d=>({id:d.id,cost_total:d.cost_total,cost_state:d.cost_state,unpriced:d.unpriced,lines:d.lines})).concat(x.costLines));
  const supplierSum=x=>r2(x.fd.cost+x.green.amount);
  const apply=pricing=>{S.purchaseOrders={...S.purchaseOrders,[no]:{...(S.purchaseOrders?.[no]||{}),...spec.expected_po,supplier_pricing:pricing}};clear();};
  let baseline,priced,order;
  try{
   apply(null);baseline=snapshot();
   apply(clone(spec.supplier_pricing));priced=snapshot();order=supplierPricing1014().orders.find(o=>o.number===no);
   ck('scoped supplier source validates',order?.valid===true,order?.errors);
   ck('approved source amount matches PO',order?.difference===0&&near(order.total,spec.expected_po.amount));
   ck('source red green extras independently reconcile',near(order.red,expected.red_total)&&near(order.green,expected.green_total)&&near(order.extrasTotal,expected.extra_total));
   ck('every source record remains singular',order.records.length===expected.records&&new Set(order.records.map(r=>r.key)).size===expected.records);
   ck('daily extras remain singular',order.extras.length===expected.extras&&new Set(order.extras.map(r=>r.id)).size===expected.extras);
   ck('source rates do not rewrite physical work',physical(priced)===physical(baseline));
   ck('original customer cost lines unchanged',charges(priced)===charges(baseline));
   ck('customer Revenue unchanged',near(priced.money.charge.total,baseline.money.charge.total)&&near(priced.pl.revNow,baseline.pl.revNow)&&near(priced.pl.revJob,baseline.pl.revJob));
   ck('remaining physical forecast unchanged',JSON.stringify(priced.forecast)===JSON.stringify(baseline.forecast));
   ck('supplier total changes only by source net delta',near(supplierSum(priced)-supplierSum(baseline),expected.supplier_delta));
   ck('Rehire changes by source gear delta',near(priced.split.gear-baseline.split.gear,expected.gear_delta));
   ck('Installation changes by dated extras once',near(priced.split.installation-baseline.split.installation,expected.installation_delta));
   ck('supplier allocation closes to the cent',priced.split.clean&&near(priced.split.gear+priced.split.installation,supplierSum(priced)));
   ck('P&L2126 Rehire carries the same change',near(priced.pl.cost.find(r=>r.key==='rehire').now-baseline.pl.cost.find(r=>r.key==='rehire').now,expected.gear_delta));
   ck('P&L2142 Installation carries the same change',near(priced.pl.cost.find(r=>r.key==='install').now-baseline.pl.cost.find(r=>r.key==='install').now,expected.installation_delta));
   ck('Costs and P&L Direct costs share net delta',near(priced.money.cost.known-baseline.money.cost.known,expected.direct_delta)&&near(priced.pl.direct-baseline.pl.direct,expected.direct_delta)&&near(priced.pl.directJob-baseline.pl.directJob,expected.direct_delta));
   const branchDelta=(priced.finance.costTotal.by[expected.branch]||0)-(baseline.finance.costTotal.by[expected.branch]||0);
   ck('Finance cost branch carries whole net delta',near(branchDelta,expected.direct_delta));
   ck('Finance totals reconcile',priced.finance.costCheck&&priced.finance.invCheck&&near(priced.finance.costTotal.job-baseline.finance.costTotal.job,expected.direct_delta));
   ck('other cost branches unchanged',Object.keys(baseline.finance.costTotal.by).filter(k=>k!==expected.branch).every(k=>near(priced.finance.costTotal.by[k]||0,baseline.finance.costTotal.by[k]||0)));
   for(const month of Object.keys(priced.monthly)){
    const m=priced.monthly[month],b=baseline.monthly[month];
    ck('dated Finance '+month+' carries source net delta',near(m.costCandidateTotal-b.costCandidateTotal,expected.direct_delta));
    ck('monthly customer Revenue '+month+' unchanged',near(m.revenueTotal,b.revenueTotal));
    const sources=m.costs.flatMap(row=>(row.extra?.sources||[]).map(s=>({...s,stream:row.stream,branch:row.branch}))),extras=sources.filter(s=>order.extras.some(e=>e.id===s.id||s.id===no+'|'+e.id||s.supplier_extra===e.id));
    ck('Finance has one source per dated extra '+month,extras.length===order.extras.length,extras.map(s=>({id:s.id,date:s.date,stream:s.stream})));
    ck('Finance extras use dated source and branch '+month,extras.every(s=>order.extras.some(e=>e.date===s.date&&near(e.paid,s.amount))&&s.branch===expected.branch));
    ck('PO approval does not create an invoice '+month,JSON.stringify(m.invoiceRecords)===JSON.stringify(b.invoiceRecords));
   }
   ck('supplier red amount reaches allDockets',near(priced.red.filter(r=>redIds.has(r.id)).reduce((n,r)=>n+(r.paid_total||0),0),expected.red_total));
   ck('supplier green amount reaches all notes',near(priced.notes.filter(r=>greenIds.has(r.id)).reduce((n,r)=>n+(r.cost||0),0),expected.green_total));
   ck('unrelated docket supplier costs unchanged',baseline.red.filter(r=>!redIds.has(r.id)).every(b=>JSON.stringify(b)===JSON.stringify(priced.red.find(r=>r.id===b.id))));
   ck('unrelated green supplier costs unchanged',baseline.notes.filter(r=>!greenIds.has(r.id)).every(b=>JSON.stringify(b)===JSON.stringify(priced.notes.find(r=>r.id===b.id))));
   ck('map trace accepts approved supplier states',priced.red.filter(r=>redIds.has(r.id)).every(r=>near(GC500FencingTrace837.money(r).supplier,r.paid_total)));
   const onlySupplier=priced.red.find(r=>redIds.has(r.id)&&!r.lines.length&&r.supplier_lines?.length);
   if(onlySupplier){const html=dom(fencePrivateRow(onlySupplier));ck('supplier-only upgrade shows Direct cost',html.textContent.includes(money(onlySupplier.paid_total))&&html.textContent.includes('Direct cost'));}
   const credited=priced.red.find(r=>r.supplier_lines?.some(l=>l.qty<0));
   if(credited){const detail=supplierRecordDetail1014(credited);ck('source credit shown as a separate billed quantity',credited.supplier_lines.some(l=>l.paid<0)&&detail.includes(money(credited.supplier_lines.find(l=>l.qty<0).paid)));}
   const receipt=JSON.stringify(fh866Receipt(poOf(no))),orderAmount=order.total;
   S.purchaseOrders[no].amount=r2(spec.expected_po.amount+1);clear();
   ck('P/O value change shows variance without repricing',near(supplierPricing1014().orders.find(o=>o.number===no).difference,-1)&&near(supplierPricing1014().orders.find(o=>o.number===no).total,orderAmount));
   ck('P/O amount edit preserves Direct costs',near(moneySummary().cost.known,priced.money.cost.known));
   apply(clone(spec.supplier_pricing));
   const docs=toDocs('purchaseOrders'),doc=docs[docIdOf(no)];doc.amount=r2(spec.expected_po.amount+2);
   // Warm every relevant cache, then drive the normal receiving path.
   moneySummary();fencePaidSplit();supplierPricing1014();
   ck('shared P/O update accepted',syncFold('purchaseOrders',docs));
   ck('shared update invalidates pricing cache before redraw',near(supplierPricing1014().orders.find(o=>o.number===no).difference,-2)&&poLabel1014(no).includes(money(doc.amount)));
   ck('shared update keeps known supplier charges stable',near(moneySummary().cost.known,priced.money.cost.known));
   apply(clone(spec.supplier_pricing));
   const originalCosts=clone(S.fenceCosts||{}),oldLabour=fenceCostFor('labour').value,oldClean=fenceCostFor('clean').value;
   S.fenceCosts={...S.fenceCosts,labour:oldLabour+1,clean:oldClean+1};clear();
   const changedNotes=serviceNoteRows(),changedRed=allDockets(),g=greenBookTotals();
   ck('generic supplier rates preserve approved source red charges',changedRed.filter(r=>redIds.has(r.id)).every(r=>near(r.paid_total,priced.red.find(d=>d.id===r.id).paid_total)));
   ck('generic supplier rates preserve approved source green charges',changedNotes.filter(r=>greenIds.has(r.id)).every(r=>near(r.cost,priced.notes.find(d=>d.id===r.id).cost)));
   ck('generic supplier rates still reach unrelated costs',changedRed.some(r=>!redIds.has(r.id)&&!near(r.paid_total,priced.red.find(d=>d.id===r.id).paid_total))&&changedNotes.some(r=>!greenIds.has(r.id)&&!near(r.cost,priced.notes.find(d=>d.id===r.id).cost)));
   ck('mixed green rates retain the whole priced subtotal',near(g.amount,changedNotes.filter(n=>n.usable!==false).reduce((n,r)=>n+(r.cost||0),0))&&near(fencePaidSplit().green,g.amount)&&near(moneySummary().cost.fencing_labour.amount,g.amount));
   ck('mixed green rates are not displayed as a single hourly rate',g.rate===null&&supplierGreenText1014(g).includes('individual'));
   S.fenceCosts=originalCosts;clear();
   const originalRates=clone(S.fenceRates||{});S.fenceRates={...S.fenceRates,clean:(fenceRateFor('clean').value||0)+1};clear();
   ck('editable customer rates change customer charges only',!near(moneySummary().charge.total,priced.money.charge.total)&&near(supplierPricing1014().orders.find(o=>o.number===no).total,orderAmount)&&near(fencePaidSplit().gear,priced.split.gear));
   S.fenceRates=originalRates;clear();
   ck('receipt state preserved',JSON.stringify(fh866Receipt(poOf(no)))===receipt);
   const repeat=snapshot();ck('repeated reads do not duplicate daily costs',near(repeat.money.cost.known,priced.money.cost.known)&&near(repeat.split.installation,priced.split.installation));
  }finally{S=JSON.parse(beforeState);SYNC.last=beforeLast;SYNC.queue=beforeQueue;clear();}
  ck('test restores the whole operational record',JSON.stringify(S)===beforeState);
  return {pass:checks.every(c=>c.pass),checks,summary:{order:order&&{number:order.number,total:order.total,red:order.red,green:order.green,extras:order.extrasTotal},before:baseline&&{supplier:supplierSum(baseline),gear:baseline.split.gear,installation:baseline.split.installation,customer:baseline.money.charge.total},after:priced&&{supplier:supplierSum(priced),gear:priced.split.gear,installation:priced.split.installation,customer:priced.money.charge.total}}};
 },spec);
 const out={author:'Andrew Fisher',...results,pageErrors:h.errors,attemptedNativeWrites:attemptedNativeWrites+h.counts.blocked,externalPostsBlocked};
 fs.mkdirSync(path.dirname(process.env.OUT),{recursive:true});fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({pass:out.pass,checks:out.checks.length,failed:out.checks.filter(x=>!x.pass).map(x=>x.name),pageErrors:out.pageErrors,attemptedNativeWrites:out.attemptedNativeWrites}));
 if(!out.pass||out.pageErrors.length||out.attemptedNativeWrites)process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
