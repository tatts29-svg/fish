/* Author: Andrew Fisher. Exact native financial comparison on one frozen record.
 * HTTP writes are denied by the shared harness. Evidence stays in OUT, outside git.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const cents=v=>Math.round(v*100),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const read=()=>holdAssets(()=>{
 const started=performance.now();
 RENDER_MEMO.clear();HELD_MEMO.clear();
 const M=moneySummary(),P=pl770Model(),LP=labourPlan(),R=recon888Model(),sv=servicing748();
 const docs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 return JSON.parse(JSON.stringify({customer:M.charge,direct:M.cost,categories:M.categories,streams:M.streams,
  revenue:P.rev.map(r=>({key:r.key,code:r.code,now:r.now,job:r.job})),costs:P.cost,ledger:{now:P.revNow,job:P.revJob,costNow:P.costNow,costJob:P.costJob},
  branch:branchFinancial978(pl752Rows(),M),ticks:pl760Ticks(),labour:labourRevenue858(),demobDetail:acc761Labour().demob,
  plan:{all:LP.all,slots:LP.slots,byBranch:[...LP.byBranch],byLine:[...LP.byLine]},heldReferences:allAssets().filter(a=>NotChargedHere1152.has(a.key)).map(a=>a.key),
  service:sv,supplier:sv.supplier1068,supplierModel:supplierService1068(),contracts:ONHIRE_ROWS,scope:scopeFigures(),sourceScope:SCOPE,
  eventCrew:EventCrew1237.model(),crew:RaceCrew1227.model(),fenceAll:FenceAllIn12423.model(),scopeAllocation:scopeBranchAllocation978(),eventScopeHtml:eventScopeCard(),
  documentedCustomerFenceAmount:EventCrew1237.product(EventCrew1237.model().hours,scopeFigures().lines.find(line=>line.key==='fence').rate),
  reconciliation:{ok:R.ok,bad:R.bad,count:R.count,ties:R.ties},docs,
  queue:{inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)},
  footer:document.getElementById('footL')?.textContent,evaluationMs:performance.now()-started
 }));
});
async function optionalRegisterCapture(s){
 if(!process.env.ASSET_READER&&!process.env.REG_OUT)return;
 assert(process.env.ASSET_READER&&process.env.REG_OUT,'ASSET_READER and REG_OUT must both be supplied');
 const source=fs.readFileSync(process.env.ASSET_READER,'utf8');
 const payload=require('vm').runInNewContext('('+source+')');
 assert.equal(typeof payload,'function','Reviewed read-only asset reader must export one function');
 const value=await s.page.evaluate(payload);value.captureBaseline=s.baseline;
 fs.writeFileSync(process.env.REG_OUT,JSON.stringify(value,null,2)+'\n');
 console.log('PASS optional asset-register capture on the same frozen base session');
}
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE&&process.env.OUT,'BASE, PAGE, STATE and private OUT required');
 const output=process.env.OUT,candidate=process.env.PAGE,result={};
 fs.mkdirSync(output,{recursive:true});
 for(const [key,page]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=page;const s=await openCandidate();
  try{
   result[key]=await s.page.evaluate(read);result[key].baseline=s.baseline;
   if(key==='base')await optionalRegisterCapture(s);
   if(key==='candidate'){
    await s.page.setViewportSize({width:390,height:844});
    await s.page.screenshot({path:path.join(output,'financial45-1-costs-phone.png'),fullPage:true});
    const wording=await s.page.evaluate(()=>{const p=document.getElementById('pane-costs');return {text:p?.textContent||'',water:pl767Servicing(),explanations:(moneySummary().caveats||[]).filter(x=>/water/i.test(x)),recovery:pl770Model().ratios?.filter(x=>/Consumables/.test(x.name))};});
    result.wording=wording;
   }
   result[key].pageErrors=s.errors;result[key].consoleErrors=s.consoleErrors;result[key].writeAttempts=s.counts.blocked;
  }finally{await s.browser.close();}
 }
 fs.writeFileSync(path.join(output,'financial-native.json'),JSON.stringify(result,null,2)+'\n');
 const b=result.base,a=result.candidate;let passed=0;
 const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
 const same=(name,x,y)=>check(name,()=>assert.deepEqual(x,y,name));
 const money=(name,x,y)=>same(name,cents(x),cents(y));
 for(const [key,value]of[['base',b],['candidate',a]]){
  same(key+' runtime errors',value.pageErrors,[]);same(key+' console errors',value.consoleErrors,[]);same(key+' HTTP writes',value.writeAttempts,0);
  same(key+' no queued or inflight writes',value.queue,{inflight:0,queued:0});same(key+' frozen docs match',value.baseline.docsMatch,true);
 }
 same('same frozen snapshot',a.baseline.stateSha256,b.baseline.stateSha256);same('same native version',a.baseline.version,b.baseline.version);
 same('source documents byte-equivalent',digest(a.docs),digest(b.docs));same('source contracts byte-equivalent',digest(a.contracts),digest(b.contracts));
 for(const k of ['supplier','supplierModel','categories','costs','sourceScope'])same(k+' unchanged',a[k],b[k]);
 const withoutCustomer=({customer,...supplier})=>supplier;
 same('documented supplier reader fields unchanged',withoutCustomer(a.eventCrew),withoutCustomer(b.eventCrew));
 same('customer reader confirms complete event coverage',a.eventCrew.customer.complete,true);
 same('customer reader uses same documented hours',a.eventCrew.customer.hours,b.eventCrew.hours);
 const originalFence=b.scope.lines.find(line=>line.key==='fence'),actualFence=a.scope.lines.find(line=>line.key==='fence');
 const crewWithoutCharge=crew=>Object.fromEntries(Object.entries(crew).filter(([key])=>key!=='charge'));
 same('supplier crew fields unchanged',crewWithoutCharge(a.crew),crewWithoutCharge(b.crew));
 same('direct costs unchanged apart from embedded customer charge reference',{...a.direct,race_crew1227:crewWithoutCharge(a.direct.race_crew1227)},{...b.direct,race_crew1227:crewWithoutCharge(b.direct.race_crew1227)});
 const customerFenceExpected=b.documentedCustomerFenceAmount;
 const customerFenceDelta=(cents(customerFenceExpected)-cents(originalFence.amount))/100;
 same('customer fencing uses existing documented total',actualFence.hours,b.eventCrew.hours);
 same('customer fencing rate unchanged',actualFence.rate,originalFence.rate);
 money('customer fencing line follows documented hours at existing rate',actualFence.amount,customerFenceExpected);
 same('original fencing day plan unchanged',actualFence.days,originalFence.days);
 same('original fencing source hours retained',actualFence.scope_hours12451,originalFence.hours);
 money('original fencing source amount retained',actualFence.scope_amount12451,originalFence.amount);
 same('other scope lines unchanged',a.scope.lines.filter(line=>line.key!=='fence'),b.scope.lines.filter(line=>line.key!=='fence'));
 for(const key of Object.keys(b.scope).filter(key=>!['lines','hours','people','total'].includes(key)))same('scope '+key+' unchanged',a.scope[key],b.scope[key]);
 money('scope people changes only by customer fencing correction',a.scope.people,b.scope.people+customerFenceDelta);
 money('scope total changes only by customer fencing correction',a.scope.total,b.scope.total+customerFenceDelta);
 same('shared scope hours change only by documented fencing hours',a.scope.hours,Math.round((b.scope.hours-originalFence.hours+b.eventCrew.hours)*100)/100);
 same('supplier model customer reference follows shared scope',a.crew.charge,{hours:actualFence.hours,rate:actualFence.rate,amount:actualFence.amount});
 same('fencing all-in card follows shared scope without changing supplier fields',a.fenceAll,{...b.fenceAll,scope:actualFence.amount,scopeH:actualFence.hours,charge:(cents(b.fenceAll.charge)+cents(customerFenceDelta))/100});
 for(const [index,allocation]of b.scopeAllocation.entries()){
  const actual=a.scopeAllocation[index];same('scope branch attribution retained '+index,{...actual,recorded:allocation.recorded,job:allocation.job},allocation);
  const change=allocation.branch==='STPS'?customerFenceDelta:0;
  money('scope branch recorded amount '+index,actual.recorded,allocation.recorded+change);money('scope branch job amount '+index,actual.job,allocation.job+change);
 }
 check('event scope separates documented total from source plan',()=>assert(a.eventScopeHtml.includes('data-customer-hours12451')&&a.eventScopeHtml.includes('Original scope plan — reference only')));
 const held=new Set(b.heldReferences);
 same('existing financial holds unchanged',a.heldReferences,b.heldReferences);
 same('only already-held financial slots removed',a.plan.slots,b.plan.slots.filter(s=>!held.has(s.ref)));
 same('supplier quote/card source intact',a.service.per1040,b.service.per1040);same('customer service card lines unchanged',a.service.card_lines,b.service.card_lines);
 const includedKeys=new Set(['service|Water Truck','service|Water Truck - Pre fill','service|Water delivery','service|3000 Ltr Free Drinking Water Tank']);
 const water=b.service.at_cost.filter(l=>includedKeys.has(l.key)).reduce((n,l)=>n+cents(l.amount),0)/100;
 money('headline servicing excludes included water once',a.customer.servicing,b.customer.servicing-water);
 money('headline total includes only water and customer fencing corrections',a.customer.total,b.customer.total-water+customerFenceDelta);
 for(const key of Object.keys(b.customer).filter(k=>!['servicing','total','race'].includes(k)))same('customer '+key+' unchanged',a.customer[key],b.customer[key]);
 for(const key of Object.keys(b.customer.race).filter(k=>!['amount','people_amount','hours'].includes(k)))same('customer race '+key+' unchanged',a.customer.race[key],b.customer.race[key]);
 money('customer race amount follows shared scope',a.customer.race.amount,a.scope.total);money('customer race people amount follows shared scope',a.customer.race.people_amount,a.scope.people);same('customer race hours follow shared scope',a.customer.race.hours,a.scope.hours);
 for(const row of b.revenue){const actual=a.revenue.find(x=>x.key===row.key),change=row.key==='install'?customerFenceDelta:0;same('ledger category retained '+row.key,{...actual,now:row.now,job:row.job},row);money('ledger recorded amount '+row.key,actual.now,row.now+change);money('ledger job amount '+row.key,actual.job,row.job+change);}
 money('ledger total has only customer fencing correction',a.ledger.now,b.ledger.now+customerFenceDelta);money('ledger job total has only customer fencing correction',a.ledger.job,b.ledger.job+customerFenceDelta);
 money('ledger direct cost unchanged',a.ledger.costNow,b.ledger.costNow);money('ledger job direct cost unchanged',a.ledger.costJob,b.ledger.costJob);
 money('headline equals current ledger',a.customer.total,a.ledger.now);
 const delta=(cents(b.customer.labour)-cents(b.ticks.total))/100;
 money('shared tick total agrees with headline labour',a.ticks.total,a.customer.labour);
 money('installation applies existing approved delta once',a.ticks.install.amount,b.ticks.install.amount+delta);
 for(const k of ['cleaning','fire_ext','other'])same(k+' tick category unchanged',a.ticks[k],b.ticks[k]);
 same('physical tick count unchanged',a.ticks.ticks,b.ticks.ticks);same('unknown tick count unchanged',a.ticks.unknown,b.ticks.unknown);
 same('FWF adjustment uses existing contract branch',a.ticks.fwf1244.branch,'KINP');
 for(const [code,row]of Object.entries(b.ticks.byBranch))if(code!=='KINP')same('unrelated '+code+' tick branch unchanged',a.ticks.byBranch[code],row);
 money('KINP install delta once',a.ticks.byBranch.KINP.install.amount,b.ticks.byBranch.KINP.install.amount+delta);
 money('KINP total delta once',a.ticks.byBranch.KINP.amount,b.ticks.byBranch.KINP.amount+delta);
 money('plan charged agrees with tick total',a.plan.all.charged,a.ticks.total);
 money('labour recorded agrees with installation',a.labour.recorded,a.ticks.install.amount);
 money('labour job applies approved delta',a.labour.job,b.labour.job+delta);
 money('remaining labour unchanged',a.labour.remaining,b.labour.remaining);
 same('individual install/demob split unchanged',a.labour.sums,b.labour.sums);
 same('demob-only detail marks unallocated combined adjustment',a.demobDetail.approvedCombinedSplitUnknown1244,true);
 same('demob-only detail is explicitly partial',a.demobDetail.complete,false);
 for(const row of b.branch.rows){const actual=a.branch.rows.find(r=>r.code===row.code)||(row.code==='Shared job / allocation pending'?{cost:0,costJob:0,revenue:0,revenueJob:0}:null);assert(actual,'Existing branch must remain: '+row.code);
  money(row.code+' cost unchanged',actual.cost,row.cost);money(row.code+' job cost unchanged',actual.costJob,row.costJob);
  if(row.code==='KINP'){money('KINP revenue reflects water and existing labour correction',actual.revenue,row.revenue-water+delta);money('KINP job revenue reflects same correction',actual.revenueJob,row.revenueJob-water+delta);}
  else if(row.code==='STPS'){money('STPS revenue has only the customer fencing correction',actual.revenue,row.revenue+customerFenceDelta);money('STPS job revenue has only the customer fencing correction',actual.revenueJob,row.revenueJob+customerFenceDelta);}
  else if(row.code!=='Shared job / allocation pending'){money(row.code+' revenue unchanged',actual.revenue,row.revenue);money(row.code+' job revenue unchanged',actual.revenueJob,row.revenueJob);}
 }
 check('all reconciliation ties pass',()=>assert(a.reconciliation.ok,JSON.stringify(a.reconciliation.ties.filter(t=>!t.ok).map(t=>t.what))));
 check('all branch cent checks pass',()=>assert(Object.values(a.branch.checks).every(Boolean)));
 check('water explanation states included',()=>assert(/Water is included in the pump-out charges/.test(result.wording.water)));
 check('stale water pass-through explanation absent',()=>assert(!/water is at what Event Portables charge us|water services .*charged on at what Event Portables/i.test(result.wording.water+' '+result.wording.explanations.join(' '))));
 result.validation={passed,failed:0,ok:true};
 fs.writeFileSync(path.join(output,'financial-native.json'),JSON.stringify(result,null,2)+'\n');
 console.log(passed+' native financial consistency and preservation checks PASS');
})().catch(error=>{console.error('FAIL native financial gate: '+error.stack);process.exitCode=1;});
