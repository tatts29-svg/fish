/* Author: Andrew Fisher. Native financial/category differential on one pinned private record.
 * The shared harness denies HTTP writes. Real amounts/screenshots are written only to OUT.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const api=require('../contract_labour1249.js');
const source=fs.readFileSync(path.resolve(__dirname,'../../v12.45.1_financial_consistency_LIVE/tests/financial_native.cjs'),'utf8');
const start=source.indexOf('const read=()=>holdAssets(()=>{'),end=source.indexOf('\nasync function optionalRegisterCapture',start);
assert(start>=0&&end>start,'Shared native financial reader boundary changed');
const read=vm.runInNewContext(source.slice(start,end).replace(/^const read=/,'').replace(/;\s*$/,''));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const cents=x=>Math.round(x*100),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>assert.deepEqual(canonical(a),canonical(b));
const readCategories=()=>holdAssets(()=>{
  RENDER_MEMO.clear();HELD_MEMO.clear();
  return JSON.parse(JSON.stringify({
    contractRows:ONHIRE_ROWS.map(row=>({key:String(row.rental_contract)+'|'+String(row.line),row,charge:contractCharge(row),category:contractChargeCategory1224(row),stream:contractChargeStream1224(row),branch:generatorBranch1004(row),trade:PLATE_OF_KIND[row.kind]||null,billingQuantity:contractBillingQuantity1010(row),treatment:contractTreatment747(row),owner:finance928ContractOwner(row)})),
    figures:contractFigures(ONHIRE_ROWS),branches:pl752Rows(),
    trades:[...tradeCharges().values()],buildGroups:todayGroupDetails841(),
    monthly:['2026-09','2026-10','2026-11'].map(month=>acc761Model(month))
  }));
});
(async()=>{
  assert(process.env.BASE&&process.env.PAGE&&process.env.STATE&&process.env.OUT&&process.env.BASE_SHA&&process.env.PAGE_SHA&&process.env.FIXED_TIME,'Explicit page/base/state/output, page hashes and comparison time required');
  const fixedTime=new Date(process.env.FIXED_TIME);assert(Number.isFinite(fixedTime.getTime()),'FIXED_TIME must be a valid instant');
  const output=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
  assert(!output.startsWith(repo+path.sep),'Native evidence must stay outside the repository');
  fs.mkdirSync(output,{recursive:true});
  assert.equal(sha(fs.readFileSync(process.env.BASE)),process.env.BASE_SHA);assert.equal(sha(fs.readFileSync(process.env.PAGE)),process.env.PAGE_SHA);
  const candidate=process.env.PAGE,result={author:'Andrew Fisher',created_utc:new Date().toISOString(),models:{}};
  for(const [key,pageFile]of [['base',process.env.BASE],['candidate',candidate]]){
    process.env.PAGE=pageFile;const s=await openCandidate();
    try{
      await s.page.clock.setFixedTime(fixedTime);
      const data={financial:await s.page.evaluate(read),categories:await s.page.evaluate(readCategories),baseline:s.baseline,fixedTime:await s.page.evaluate(()=>new Date().toISOString())};
      if(key==='candidate'){
        await s.page.setViewportSize({width:390,height:844});
        await s.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        data.installationUi=await s.page.evaluate(()=>{
          const card=[...document.querySelectorAll('#pl770 .branch978-mobile .pl1194-card')].find(x=>(x.querySelector('b')?.textContent||'')==='Other Revenue');
          if(!card)throw Error('Native mobile Other Revenue group containing Installation is missing');
          card.scrollIntoView({block:'center'});
          const r=card.getBoundingClientRect();return {text:card.innerText,left:r.left,right:r.right,width:innerWidth};
        });
        await s.page.screenshot({path:path.join(output,'installation-ledger-phone.png'),fullPage:false});
      }
      data.pageErrors=s.errors;data.consoleErrors=s.consoleErrors;data.writeAttempts=s.counts.blocked;
      result.models[key]=data;
    }finally{await s.browser.close();}
  }
  const write=()=>fs.writeFileSync(path.join(output,'native-ledger.json'),JSON.stringify(result,null,2)+'\n');write();
  let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
  const same=(name,a,b)=>check(name,()=>equal(a,b));
  const money=(name,a,b)=>same(name,cents(a),cents(b));
  const b=result.models.base,a=result.models.candidate,B=b.financial,A=a.financial;
  for(const [key,x]of Object.entries(result.models)){
    same(key+' explicit financial evaluation time',x.fixedTime,fixedTime.toISOString());
    same(key+' no errors or writes',[x.pageErrors,x.consoleErrors,x.writeAttempts],[[],[],0]);
    same(key+' frozen record settled',[x.baseline.docsMatch,x.baseline.inflight,x.baseline.queuedDocuments],[true,0,0]);
    same(key+' no queued/inflight changes',x.financial.queue,{inflight:0,queued:0});
  }
  same('same pinned record',[a.baseline.version,a.baseline.stateSha256],[b.baseline.version,b.baseline.stateSha256]);
  const targets=b.categories.contractRows.filter(x=>api.isInstallation(x.row));same('reviewed native source lines present',targets.length,6);
  const identities=new Set(targets.map(x=>x.key)),delta=targets.reduce((n,x)=>{assert.equal(typeof x.charge.amount,'number','Reviewed native charge must be priced');return n+cents(x.charge.amount);},0)/100;
  const byBranch={};for(const r of targets)byBranch[r.branch]=((cents(byBranch[r.branch]||0)+cents(r.charge.amount))/100);
  result.expectedReclassification={delta,byBranch,lines:targets.map(x=>({key:x.key,amount:x.charge.amount,branch:x.branch}))};
  same('source documents exact',A.docs,B.docs);same('all source contract rows exact',A.contracts,B.contracts);same('source plan exact',A.sourceScope,B.sourceScope);
  for(const key of ['direct','categories','costs','supplier','supplierModel','service','ticks','labour','demobDetail','plan','heldReferences','scope','eventCrew','crew','fenceAll','scopeAllocation','eventScopeHtml','documentedCustomerFenceAmount'])same(key+' preserved',A[key],B[key]);
  same('headline keeps every customer field except explicit installation category',{...A.customer,contractInstallation1224:B.customer.contractInstallation1224},B.customer);
  money('shared contract installation increases by existing labour only',A.customer.contractInstallation1224,B.customer.contractInstallation1224+delta);
  same('ledger totals unchanged',A.ledger,B.ledger);same('branch overall totals and all allocations unchanged',A.branch,B.branch);
  for(const row of B.revenue){const n=A.revenue.find(x=>x.key===row.key);const d=row.key==='hire'?-delta:row.key==='install'?delta:0;same('ledger category retained '+row.key,{...n,now:row.now,job:row.job},row);money('ledger current correction '+row.key,n.now,row.now+d);money('ledger job correction '+row.key,n.job,row.job+d);}
  const otherRevenue=A.revenue.filter(x=>['1020','1047','1025','1015'].includes(x.code)).reduce((n,x)=>n+cents(x.job),0)/100;
  check('native phone group includes Installation at the corrected cents',()=>assert(a.installationUi.text.includes(new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(otherRevenue))));
  check('native phone revenue card fits viewport',()=>assert(a.installationUi.left>=0&&a.installationUi.right<=a.installationUi.width));
  for(const row of b.categories.contractRows){
    const n=a.categories.contractRows.find(x=>x.key===row.key);assert(n,'Source line retained');
    if(!identities.has(row.key)){same('unrelated contract output exact '+row.key,n,row);continue;}
    same('original target source and branch exact '+row.key,[n.row,n.branch],[row.row,row.branch]);
    same('target quantity, treatment and ownership exact '+row.key,[n.billingQuantity,n.treatment,n.owner],[row.billingQuantity,row.treatment,row.owner]);
    same('native pricing fields exact '+row.key,n.charge,{...row.charge,ledger:'1047',contractLabour1249:true});
    same('same installation category and stream '+row.key,[n.category,n.stream],['installation','crew']);
  }
  const figures=a.categories.figures,oldFigures=b.categories.figures;
  money('contract total unchanged',figures.charge,oldFigures.charge);same('contract known/unknown counts retained',[figures.lines,figures.unknown,figures.charge_lines],[oldFigures.lines,oldFigures.unknown,oldFigures.charge_lines]);
  money('contract installation subtotal once',figures.installation.charge,oldFigures.installation.charge+delta);
  same('contract installation line count once',figures.installation.lines,oldFigures.installation.lines+targets.length);
  for(const target of targets){const items=figures.installation.items.filter(x=>String(x.contract)+'|'+String(x.line)===target.key);same('contract installation source appears once '+target.key,items.length,1);money('contract installation source amount retained '+target.key,items[0].charge,target.charge.amount);same('contract installation is not a hire period '+target.key,[items[0].how,items[0].days],['charge line',null]);}
  money('equipment subtotal removes only installation',figures.plant.charge,oldFigures.plant.charge-delta);
  same('equipment source count excludes labour',figures.plant.lines,oldFigures.plant.lines-targets.length);
  for(const branch of b.categories.branches){const n=a.categories.branches.find(x=>x.code===branch.code);const d=byBranch[branch.code]||0;money('branch total preserved '+branch.code,n.total,branch.total);money('branch installation agrees '+branch.code,n.installation1224||0,(branch.installation1224||0)+d);same('other branch fields exact '+branch.code,Object.fromEntries(Object.entries(n).filter(([k])=>k!=='installation1224')),Object.fromEntries(Object.entries(branch).filter(([k])=>k!=='installation1224')));}
  const streamDelta={},streamCount={};for(const r of targets){const next=a.categories.contractRows.find(x=>x.key===r.key);streamDelta[r.stream]=(streamDelta[r.stream]||0)-cents(r.charge.amount);streamDelta[next.stream]=(streamDelta[next.stream]||0)+cents(r.charge.amount);streamCount[r.stream]=(streamCount[r.stream]||0)-1;streamCount[next.stream]=(streamCount[next.stream]||0)+1;}
  const retainedStream=row=>Object.fromEntries(Object.entries(row).filter(([k])=>!['charge','difference','charge0','difference0','lines','notes'].includes(k)));
  const countNote=notes=>notes.map(note=>note.replace(/\bof \d+ contract lines?\b/g,'of [count] contract lines'));
  for(const row of B.streams){
    const n=A.streams.find(x=>x.key===row.key);assert(n,'Stream retained');
    money('stream correct category '+row.key,n.charge,row.charge+(streamDelta[row.key]||0)/100);
    same('stream source count '+row.key,n.lines,row.lines+(streamCount[row.key]||0));
    same('stream costs and retained fields '+row.key,retainedStream(n),retainedStream(row));
    same('stream notes retain meaning '+row.key,countNote(n.notes),countNote(row.notes));
    money('stream difference agrees to cents '+row.key,n.difference,n.charge-n.cost);
    same('printed stream difference agrees '+row.key,n.difference0,n.charge0-n.cost0);
  }
  same('printed stream revenue total still agrees',A.streams.reduce((n,x)=>n+x.charge0,0),Math.round(A.customer.total));
  const tradeDeltas={};for(const r of targets)if(r.trade){const d=tradeDeltas[r.trade]||(tradeDeltas[r.trade]={cents:0,lines:0});d.cents+=cents(r.charge.amount);d.lines++;}
  const trades=new Map(a.categories.trades.map(x=>[x.disc,x]));
  for(const old of b.categories.trades){const now=trades.get(old.disc),d=tradeDeltas[old.disc]||{cents:0,lines:0};assert(now,'Native equipment summary retained');money('equipment summary excludes reviewed job-level labour '+old.disc,now.charge,old.charge-d.cents/100);same('equipment summary source count '+old.disc,now.lines,old.lines-d.lines);same('equipment summary unrated count '+old.disc,now.unrated,old.unrated);}
  same('Build group identities retained',Object.keys(a.categories.buildGroups),Object.keys(b.categories.buildGroups));
  for(const [key,old]of Object.entries(b.categories.buildGroups)){
    const now=a.categories.buildGroups[key];if(!old||!Array.isArray(old.money)){same('Build metadata exact '+key,now,old);continue;}
    same('Build operational projection exact '+key,{...now,money:old.money},old);
    same('Build money identities retained '+key,now.money.map(x=>x.id),old.money.map(x=>x.id));
    for(const entry of old.money){const next=now.money.find(x=>x.id===entry.id);if(!entry.id.startsWith('contract|'))same('other Build money unchanged '+entry.id,next,entry);else{const trade=trades.get(entry.id.slice('contract|'.length));assert(trade,'Native Build trade retained');same('Build contract amount uses corrected native trade '+entry.id,next,{...entry,amount:trade.charge0,rawAmount:trade.charge,lines:trade.lines,unrated:trade.unrated});}}
  }
  check('all reconciliation ties pass',()=>assert(A.reconciliation.ok&&A.reconciliation.bad===0));check('all branch cent checks pass',()=>assert(Object.values(A.branch.checks).every(Boolean)));
  const monthlySources=month=>['revenue','unallocatedRevenue'].flatMap(bucket=>month[bucket].flatMap(row=>(row.extra?.sources||[]).map(source=>({bucket,stream:row.stream,branch:row.branch,source}))));
  const sourceTarget=entry=>targets.find(target=>{
    const source=entry.source;
    if(source.contract!=null&&source.line!=null)return String(source.contract)+'|'+String(source.line)===target.key;
    const description=String(target.row.what||target.row.description||'Contract line').replace(/\s+/g,' ').trim();
    return source.source==='contract export'&&source.description===description&&entry.branch===target.branch&&cents(source.amount)===cents(target.charge.amount);
  });
  const ordered=rows=>rows.map(x=>JSON.stringify(canonical(x))).sort();
  for(const month of a.categories.monthly){
    const original=b.categories.monthly.find(x=>x.month===month.month);
    for(const key of ['baseplan','costs','unallocatedCosts','invoiceRecords','labourReview','supplierIncomplete1068','supplierFullCost1068','costCandidateTotal','costAccrue','costDecide','forecastCostTotal','invoiced','invoiceSnapshotTotal','wip','notes','basis'])same('monthly '+month.month+' '+key+' unchanged',month[key],original[key]);
    const oldSources=monthlySources(original),newSources=monthlySources(month);
    same('monthly unrelated revenue sources exact '+month.month,ordered(newSources.filter(x=>!sourceTarget(x))),ordered(oldSources.filter(x=>!sourceTarget(x))));
    const priorAllocated=oldSources.filter(x=>x.bucket==='revenue'&&sourceTarget(x));
    const removedAmount=priorAllocated.reduce((n,x)=>n+cents(x.source.amount),0)/100;
    const removedForecast=priorAllocated.reduce((n,x)=>n+cents(x.source.forecastAmount||0),0)/100;
    money('monthly allocated total removes only unsplit labour '+month.month,month.revenueTotal,original.revenueTotal-removedAmount);
    money('monthly forecast removes only unsplit labour '+month.month,month.forecastRevenueTotal,original.forecastRevenueTotal-removedForecast);
    for(const target of targets){
      check('monthly predecessor labour is not duplicated '+month.month+' '+target.key,()=>assert(oldSources.filter(x=>sourceTarget(x)?.key===target.key).length<=1));
      const matches=month.unallocatedRevenue.flatMap(row=>(row.extra?.sources||[]).filter(src=>String(src.contract)+'|'+String(src.line)===target.key).map(src=>({row,src})));
      same('monthly explicit unsplit labour once '+month.month+' '+target.key,matches.length,1);
      same('monthly correct category/branch '+month.month+' '+target.key,[matches[0].row.stream,matches[0].row.branch],['Labour Install',target.branch]);
      money('monthly full source amount retained '+month.month+' '+target.key,matches[0].src.amount,target.charge.amount);
      check('monthly source has no invented date '+month.month+' '+target.key,()=>assert(!matches[0].src.date&&!matches[0].src.from&&!matches[0].src.to&&!matches[0].src.invoiceMonth));
      check('monthly no target generator hire '+month.month+' '+target.key,()=>assert(!month.revenue.some(row=>(row.extra?.sources||[]).some(src=>String(src.contract)+'|'+String(src.line)===target.key))));
    }
  }
  result.validation={passed,failed:0,ok:true};write();console.log(passed+' native ledger classification and preservation assertions PASS');
})().catch(e=>{console.error('FAIL native ledger gate: '+e.stack);process.exitCode=1;});
