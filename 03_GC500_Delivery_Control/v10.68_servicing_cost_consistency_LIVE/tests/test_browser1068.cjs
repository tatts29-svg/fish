/* Author: Andrew Fisher. Frozen-record financial parity; outputs remain private.
   Usage: GC500_FIXTURE=/private/frozen node test_browser1068.cjs base.html candidate.html /private/output
   Run under the shared browser flock; all operational writes are aborted by the canonical harness. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const C=require('../../v10.66_speed_smooth_LIVE/tests/validation/common.cjs');
// Record resource failures before navigation so an unrelated upstream outage can
// be compared between both exact arms without dropping financial assertions.
const transportByPage=new WeakMap(),{chromium}=require('playwright'),priorLaunch=chromium.launch.bind(chromium);
chromium.launch=async options=>{
 const browser=await priorLaunch(options),priorContext=browser.newContext.bind(browser);
 browser.newContext=async options=>{
  const context=await priorContext(options);
  context.on('page',page=>{
   const report={responses:[],requests:[],console:[]};transportByPage.set(page,report);
   page.on('response',response=>{if(response.status()>=400){const request=response.request();report.responses.push({url:response.url(),status:response.status(),method:request.method(),type:request.resourceType()});}});
   page.on('requestfailed',request=>report.requests.push({url:request.url(),method:request.method(),type:request.resourceType(),error:request.failure()?.errorText||''}));
   page.on('console',message=>{if(message.type()==='error')report.console.push({text:message.text(),location:message.location()});});
  });
  return context;
 };
 return browser;
};
const armHealth={};
function recordHealth(s,label){
 const health=C.errorsOf(s),transport=transportByPage.get(s.page);
 armHealth[label]={health,transport};C.writePrivate(path.join(outDir,label+'-health.json'),armHealth[label]);
 assert.deepEqual(health.pageErrors,[],'page/runtime errors are not exempted');
 assert.equal(health.blocked,0);assert.deepEqual(health.missingFixture,[]);
 assert.equal(health.fixtureVersions.consistent,true);
 // Console/resource identity is checked after BOTH arms, independently of money.
}
const [baseFile,candidateFile,outDir]=process.argv.slice(2);
if(!baseFile||!candidateFile||!outDir)throw Error('Need base, candidate and private output directory.');
const cents=n=>n==null?null:Math.round(Number(n)*100);
const moneyNumbers=value=>{
 if(Array.isArray(value))return value.map(moneyNumbers);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k,v])=>typeof v!=='string').map(([k,v])=>[k,moneyNumbers(v)]));
 return value;
};
async function capture(p){return p.evaluate(()=>holdAssets(()=>{
 // Match native renderPass's generation boundary without redrawing the UI.
 RENDER_MEMO.clear();
 const service=servicing748(),M=moneySummary(),ledger=pl770Model(),coverage=pl754Rehire(M),forecast=cj764Model();
 const refs=new Set(service.per1040.map(r=>r.ref));
 const units=allAssets().filter(a=>refs.has(a.key)).map(a=>({key:a.key,lines:chargeLines(a).map(l=>({item:l.item,quantity:qtyOf(l)}))}));
 const months=[...new Set((DATA.rehire_quotes.quotes||[]).flatMap(q=>[q.delivery,q.collect,q.use_on]).filter(Boolean).map(d=>d.slice(0,7)))];
 const monthly=months.map(month=>{const m=acc761Model(month);return {month,asAt:m.asAt,revenue:m.revenue,revenueTotal:m.revenueTotal,
  supplierRows:m.costs.filter(r=>(r.extra.sources||[]).some(s=>s.quote)),unallocated:m.unallocatedCosts.filter(r=>r.extra&&r.extra.quote)};});
 return {quotes:DATA.rehire_quotes,definitions:DATA.toilet_servicing.lines,units,nightKinds:NIGHT1040,
  service,charge:M.charge,cost:M.cost,branch:pl760ToiletBranch(),ledger:{costNow:ledger.costNow,costJob:ledger.costJob,revNow:ledger.revNow,revJob:ledger.revJob,qClean:ledger.qClean,checks:ledger.checks,cost:ledger.cost},
  coverage,forecast:{job:forecast.job,known:forecast.known,rows:forecast.rows},monthly,
  originalQuoteHtml:rehireCard(),record:JSON.stringify(S),version:SYNC.backend.readVersion821()};
}));}
async function runArm(pageFile,label,mobile){
 const s=await C.launch({pageFile,mobile,hash:'#costs'}),p=s.page;
 try{
  await C.ready(s);await C.settled(p,1500);
  const merge=await C.mergeReport(p);assert.equal(merge.complete,true,'full frozen record must be merged');
  const financialDom=await p.evaluate(()=>{const pane=document.getElementById('pane-costs');return {tab:state.tab,visible:!!pane&&!pane.hidden&&!!pane.getClientRects().length,textLength:pane?.innerText.trim().length||0,tables:pane?.querySelectorAll('table').length||0};});
  assert.equal(financialDom.tab,'costs');assert.equal(financialDom.visible,true);assert.ok(financialDom.textLength>100);assert.ok(financialDom.tables>0,'native financial tables must render');
  C.writePrivate(path.join(outDir,label+'-dom.json'),financialDom);
  const first=await capture(p);C.writePrivate(path.join(outDir,label+'.json'),first);
  if(label==='candidate'){
   await p.screenshot({path:path.join(outDir,'costs-'+(mobile?'phone':'desktop')+'.png'),fullPage:false});
   const visibleBasis=await p.evaluate(()=>{
    const pane=document.getElementById('pane-costs'),nodes=[...pane.querySelectorAll('p,small,span,td')];
    const el=nodes.find(n=>n.getClientRects().length&&n.textContent.includes('Supplier servicing estimate on the site count:'));
    if(!el)return false;el.scrollIntoView({block:'center',behavior:'instant'});return true;
   });
   if(visibleBasis)await p.screenshot({path:path.join(outDir,'supplier-basis-'+(mobile?'phone':'desktop')+'.png'),fullPage:false});
   const typed=await p.evaluate(()=>{
    const read=lr748Typed,key='service|'+NIGHT1040[0].card_line,rate=servicing748().card_lines.find(l=>l.card_line===NIGHT1040[0].card_line).rate;
    lr748Typed=k=>k===key?rate+1:read(k);
    RENDER_MEMO.clear();
    try{return holdAssets(()=>{const s=servicing748();return {supplier:s.supplier1068,customer:s.card_total};});}finally{lr748Typed=read;RENDER_MEMO.clear();}
   });
   assert.equal(typed.supplier.total,first.service.supplier1068.total,'customer rate must not change supplier cost');
   assert.notEqual(typed.customer,first.service.card_total,'simulated customer rate must actually change Revenue');
   const changed=await p.evaluate(()=>{
    const s=servicing748(),ref=s.per1040.find(r=>r.lines.some(l=>l.kind==='fwf')).ref,read=chargeLines;
    chargeLines=a=>{const ls=read(a);if(a.key!==ref)return ls;let changed=false;return ls.map(l=>{
     if(changed||!/^(FWF(\s*Trailer)?|Accessible\s*Toilet)$/i.test(String(l.item||'')))return l;
     changed=true;return {...l,quantity:qtyOf(l)+1,quantity_state:'typed test only',quantity_inferred1012:false,quantity_auto:false};
    });};
    RENDER_MEMO.clear();
    try{return holdAssets(()=>{const s=servicing748(),m=moneySummary(),p=pl770Model(),r=pl754Rehire(m);return {service:s,supplier:s.supplier1068,cost:m.cost.rehire,ledger:p.costNow,coverage:r.cost};});}
    finally{chargeLines=read;RENDER_MEMO.clear();}
   });
   const rate=first.service.supplier1068.lines[0].rate,nights=first.service.nights1040.length,delta=cents(rate)*nights;
   assert.equal(cents(changed.supplier.total)-cents(first.service.supplier1068.total),delta);
   assert.equal(cents(changed.cost)-cents(first.cost.rehire),delta);
   assert.equal(cents(changed.ledger)-cents(first.ledger.costNow),delta);
   assert.equal(cents(changed.coverage)-cents(first.coverage.cost),delta);
   const missing=await p.evaluate(()=>{
    const q=DATA.rehire_quotes.quotes.find(q=>q.groups.some(g=>g.lines.some(l=>l.description===DATA.toilet_servicing.lines[0].description)));
    const line=q.groups.flatMap(g=>g.lines).find(l=>l.description===DATA.toilet_servicing.lines[0].description),rate=line.unit_price;
    delete line.unit_price;
    RENDER_MEMO.clear();
    try{return holdAssets(()=>{const s=servicing748(),m=moneySummary(),p=pl770Model(),r=pl754Rehire(m);return {supplier:s.supplier1068,coverage:r,ledger:{qClean:p.qClean,rhCover:p.rhCover}};});}
    finally{line.unit_price=rate;RENDER_MEMO.clear();}
   });
   assert.equal(missing.supplier.complete,false);assert.equal(missing.supplier.total,null);assert.equal(missing.coverage.cost,null);assert.equal(missing.ledger.qClean,false);assert.equal(missing.ledger.rhCover,null);
   const duplicate=await p.evaluate(()=>{
    DATA.rehire_quotes.quotes.push(DATA.rehire_quotes.quotes[0]);
    RENDER_MEMO.clear();
    try{return holdAssets(()=>servicing748().supplier1068);}finally{DATA.rehire_quotes.quotes.pop();RENDER_MEMO.clear();}
   });
   assert.equal(duplicate.complete,false);assert.equal(duplicate.total,null);
   const tracker=await p.evaluate(async()=>{
    // Exercise the installed tracker reader/reducer with local response data;
    // never call SYNC.backend.ticks or send a completion to any server.
    const D=SVC1067_DATA,day=D.days.find(d=>!d.ifNeeded)||D.days[0],ref=D.areas[0].refs[0],now=SvcState.dayStart(day.id)+3600000;
    const events=ref.lines.flatMap(l=>SvcState.tasksFor(D,l,day.id).map(task=>({id:'fixture-'+l.id+'-'+task,line:l.id,ref:ref.ref,task,day:day.id,done:true,at:new Date(now).toISOString()})));
    let complete=false;
    const reader=SvcAdminReader.create(async()=>({ticks:complete?events:[],seq:complete?events.length:0,more:false,epoch:'financial-test',updated:'local-only'}));
    const before=await reader.read('local-financial-fixture'),beforeStats=SvcState.groupStats(D,[ref],day.id,SvcState.jobStates(before.events,now));
    const snapshot=()=>holdAssets(()=>{RENDER_MEMO.clear();const m=moneySummary(),p=pl770Model();return {cost:m.cost,charge:m.charge,supplier:servicing748().supplier1068,ledger:{costNow:p.costNow,costJob:p.costJob,revNow:p.revNow,revJob:p.revJob}};});
    const financesBefore=snapshot();complete=true;
    const after=await reader.read('local-financial-fixture'),afterStats=SvcState.groupStats(D,[ref],day.id,SvcState.jobStates(after.events,now));
    const rendered=SvcPanel.svcPanelHtml({D,S:SvcState,events:after.events,now,lastRead:now,day:day.id,open:{},example:true});
    return {beforeStats,afterStats,rendered:rendered.length,financesBefore,financesAfter:snapshot()};
   });
   assert.equal(tracker.beforeStats.d,0);assert.ok(tracker.afterStats.d>0);assert.equal(tracker.afterStats.pct,100);assert.ok(tracker.rendered>0);
   assert.deepEqual(tracker.financesAfter,tracker.financesBefore,'local tracker tick reads/reduction must not affect Costs or Revenue');
   const restored=await capture(p);
   assert.deepEqual(restored.quotes,first.quotes,'source quote must be restored unchanged after local-only cases');
   assert.equal(restored.service.supplier1068.total,first.service.supplier1068.total);
   assert.equal(restored.record,first.record,'local cases must not change operational record');
   C.writePrivate(path.join(outDir,'local-cases.json'),{typed,changed,missing,duplicate,tracker});
  }
  recordHealth(s,label);return first;
 }finally{await s.browser.close();}
}
(async()=>{
 const mobile=process.env.MOB==='1';
 const baseline=await runArm(baseFile,'baseline',mobile),candidate=await runArm(candidateFile,'candidate',mobile),model=candidate.service.supplier1068;
 assert.deepEqual(C.canonicalRecord(JSON.parse(baseline.record)),C.canonicalRecord(JSON.parse(candidate.record)),'both arms must read the same exact frozen record');
 assert.equal(baseline.version,candidate.version);
 assert.deepEqual(candidate.quotes,baseline.quotes,'original quotations unchanged');
 assert.deepEqual(candidate.charge,baseline.charge,'all customer Revenue components unchanged');
 assert.equal(candidate.service.total,baseline.service.total);assert.equal(candidate.service.card_total,baseline.service.card_total);
 assert.deepEqual(candidate.service.at_cost,baseline.service.at_cost);assert.equal(candidate.service.their_water,baseline.service.their_water);
 assert.equal(candidate.branch,baseline.branch);assert.equal(model.complete,true);assert.deepEqual(model.issues,[]);
 const quoteById=new Map(baseline.quotes.quotes.map(q=>[q.quote,q]));let expected=0,serviceExpected=0;
 const quantityRules={fwf:/^(FWF(\s*Trailer)?|Accessible\s*Toilet)$/i,tank:/waste\s*tank|holding\s*tank|sewage/i,sewer:/block/i};
 for(const q of baseline.quotes.quotes){
  expected+=cents(q.sub_total)+cents(q.delivery_charge??0)+cents(q.pickup??0);
 }
 for(const line of model.lines){
  const source=quoteById.get(line.quote).groups.flatMap(g=>g.lines).find(l=>l.description===line.description);
  const kind=candidate.nightKinds.find(k=>k.card_line===line.card_line).kind;
  const unitCount=baseline.units.flatMap(a=>a.lines).filter(l=>quantityRules[kind].test(l.item)).reduce((sum,l)=>sum+Number(l.quantity),0);
  assert.equal(line.quantity,unitCount*baseline.service.nights1040.length,'supplier quantity must equal the eligible recorded units times event nights');
  assert.ok(Number.isInteger(line.quantity),'recorded service count must be a whole number');
  const amount=cents(source.unit_price)*line.quantity;
  assert.equal(line.amountCents,amount);serviceExpected+=amount;expected+=amount-cents(source.total_price);
 }
 assert.equal(cents(model.total),expected);assert.equal(cents(model.serviceTotal),serviceExpected);
 assert.equal(cents(candidate.cost.rehire),expected);assert.equal(cents(candidate.coverage.cost),expected);
 assert.equal(candidate.ledger.qClean,true);assert.equal(candidate.ledger.checks.costs,true);
 const delta=expected-cents(baseline.cost.rehire);
 assert.equal(cents(candidate.cost.known)-cents(baseline.cost.known),delta);
 assert.equal(cents(candidate.ledger.costNow)-cents(baseline.ledger.costNow),delta);
 assert.equal(candidate.ledger.revNow,baseline.ledger.revNow);assert.equal(candidate.ledger.revJob,baseline.ledger.revJob);
 for(const line of candidate.ledger.cost){
  const before=baseline.ledger.cost.find(l=>l.key===line.key);assert.ok(before);
  if(line.key==='pump'){assert.equal(cents(line.now)-cents(before.now),delta);assert.equal(cents(line.job)-cents(before.job),delta);}
  else {assert.equal(line.now,before.now);assert.equal(line.job,before.job);}
 }
 for(const monthly of candidate.monthly){
  const before=baseline.monthly.find(m=>m.month===monthly.month);
  assert.equal(monthly.revenueTotal,before.revenueTotal);assert.deepEqual(moneyNumbers(monthly.revenue),moneyNumbers(before.revenue));
  for(const row of monthly.supplierRows){
   assert.equal(row.branch,candidate.branch);
   let sum=0;
   for(const source of row.extra.sources){
    // A separately recorded cost may cite the same supplier quote; it is not
    // a date-allocated quote estimate and must stay exactly as recorded.
    if(!Object.hasOwn(source,'supplierIncomplete1068')){
     assert.ok(source.id,'a recorded source must retain its own identity');
     const prior=before.supplierRows.flatMap(r=>r.extra.sources).find(s=>s.id===source.id&&s.source===source.source&&s.quote===source.quote);
     assert.ok(prior,'recorded supplier source must exist in the baseline');
     assert.deepEqual(source,prior,'recorded supplier costs must remain unchanged');
     sum+=cents(source.amount);continue;
    }
    const quote=model.quotes.find(q=>q.quote===source.quote);assert.ok(quote);
    const start=Date.parse(source.from+'T00:00:00Z'),end=Date.parse(source.to+'T00:00:00Z');
    const first=Date.parse(monthly.month+'-01T00:00:00Z'),last=new Date(first);last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
    const span=(end-start)/86400000+1,days=Math.max(0,(Math.min(end,last.getTime())-Math.max(start,first))/86400000+1);
    const expected=Math.round(quote.costTotalCents1068*days/span);
    assert.equal(cents(source.amount),expected,'monthly source must use adjusted supplier amount');sum+=expected;
    const future=Math.max(start,Date.parse(monthly.asAt+'T00:00:00Z')+86400000);
    const futureDays=Math.max(0,(Math.min(end,last.getTime())-Math.max(future,first))/86400000+1);
    assert.equal(cents(source.forecastAmount),Math.round(quote.costTotalCents1068*futureDays/span));
   }
   assert.equal(cents(row.candidate),sum);
  }
 }
 assert.match(candidate.originalQuoteHtml,/original quotes for reference/);
 C.writePrivate(path.join(outDir,'financial-result.json'),{author:'Andrew Fisher',pass:true,mobile,baseSha256:C.sha(C.fs.readFileSync(baseFile)),candidateSha256:C.sha(C.fs.readFileSync(candidateFile)),checks:'Frozen record; original source; customer Revenue/water/branch; exact supplier totals; Costs, ledger, coverage, monthly; local quantity/rate/missing/duplicate cases; local tracker reader/reducer tick financial parity; rendered native financial tables; zero operational writes.'});
 const identities=report=>[...new Set(report.transport.responses.filter(r=>r.status===503).map(r=>JSON.stringify(r)))].sort();
 for(const [label,report] of Object.entries(armHealth)){
  assert.deepEqual(report.transport.requests,[],label+': failed requests need investigation');
  for(const response of report.transport.responses){
   if(response.status===503){assert.equal(response.method,'GET');assert.notEqual(new URL(response.url).origin,C.HOST,'the application service must remain reachable');}
   else assert.ok(response.status===401&&new URL(response.url).pathname==='/api/reports',label+': unexpected resource failure '+response.status);
  }
  for(const error of report.transport.console){
   assert.match(error.text,/Failed to load resource: the server responded with a status of 503/,'unrelated console errors are not exempted');
   assert.ok(report.transport.responses.some(response=>response.status===503&&response.url===error.location.url),'each console error must match an observed external503 response');
  }
 }
 assert.deepEqual(identities(armHealth.candidate),identities(armHealth.baseline),'external503 identities must match both exact arms');
 const externalBlockers=identities(armHealth.candidate).map(JSON.parse),cleanNetwork=externalBlockers.length===0;
 C.writePrivate(path.join(outDir,'result.json'),{author:'Andrew Fisher',pass:true,financialPass:true,cleanNetwork,externalBlockers,mobile,baseSha256:C.sha(C.fs.readFileSync(baseFile)),candidateSha256:C.sha(C.fs.readFileSync(candidateFile))});
 console.log('PASS frozen financial/browser checks '+(mobile?'phone':'desktop')+'; clean network='+cleanNetwork+'; unchanged external503 resources='+externalBlockers.length+'. Detailed source comparisons remain private.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
