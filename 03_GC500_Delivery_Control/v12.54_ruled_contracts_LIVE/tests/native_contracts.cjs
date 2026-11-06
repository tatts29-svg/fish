/* Author: Andrew Fisher. Native ruled-contract acceptance on exact pages and a pinned record.
 * GET-only harness; private evidence and an independently reviewed EXPECTED file stay outside git.
 * CAPTURE_ONLY=1 gathers evidence but deliberately does not report acceptance.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const BASE_SHA='69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const cents=x=>{assert.equal(typeof x,'number','Money comparison requires an explicit number');assert(Number.isFinite(x));return Math.round(x*100);};
const lineKey=r=>String(r.rental_contract)+'|'+String(r.line);
function extract(file,start,finish){
 const text=fs.readFileSync(path.resolve(__dirname,file),'utf8'),begin=text.indexOf(start),end=text.indexOf(finish,begin);
 assert(begin>=0&&end>begin,'Shared native reader boundary changed');
 return vm.runInNewContext(text.slice(begin,end).replace(/^const \w+=/,'').replace(/;\s*$/,''));
}
const read=extract('../../v12.45.1_financial_consistency_LIVE/tests/financial_native.cjs','const read=()=>holdAssets(()=>{','\nasync function optionalRegisterCapture');
const details=extract('../../v12.50_contract_quantity_precision_LIVE/tests/native_precision.cjs','const readDetails=()=>holdAssets(()=>{','\n(async()=>');
const finance=()=>holdAssets(()=>{
 const H=fh866Model(),B=pl752Rows(),M=moneySummary();
 return JSON.parse(JSON.stringify({H,legacy:legacyFinance978(),summary:fin745Summary(),branch:branchFinancial978(B,M),
  extraArgs:branchFinancial978.call({testReceiver:true},B,M,{costs:[]}),csv:fh866Csv(H),text:fh866Text(H),html:fh866Html(),monthlyHtml:fin745Html(),
  controls:{print:printCosts.toString(),csv:fh866Csv.toString(),text:fh866Text.toString(),html:fh866Html.toString(),pricing:renderPricing.toString(),monthly:fin745Html.toString()}}));
});

function privatePath(value,label){
 assert(value,label+' is required');const resolved=path.resolve(value),repo=path.resolve(__dirname,'../../..');
 assert(resolved!==repo&&!resolved.startsWith(repo+path.sep),label+' must be private, outside the repository');return resolved;
}
function observedDeltas(A,B){
 const revenue={};for(const row of B.financial.revenue){const next=A.financial.revenue.find(x=>x.key===row.key);if(next)revenue[row.key]={now:cents(next.now)-cents(row.now),job:cents(next.job)-cents(row.job)};}
 const branches={};for(const row of B.financial.branch.rows){const next=A.financial.branch.rows.find(x=>x.code===row.code);if(next)branches[row.code]=Object.fromEntries(['revenue','revenueJob','cost','costJob'].map(k=>[k,cents(next[k])-cents(row[k])]));}
 return {revenue,branches,headline:{now:cents(A.financial.ledger.now)-cents(B.financial.ledger.now),job:cents(A.financial.ledger.job)-cents(B.financial.ledger.job)}};
}

function validate(result,expected){
 let checks=0;
 const same=(name,a,b)=>{assert.deepEqual(canonical(a),canonical(b),name);checks++;};
 const check=(name,ok)=>{assert(ok,name);checks++;};
 const money=(name,a,b)=>same(name,cents(a),cents(b));
 const B=result.models.base,A=result.models.candidate;
 for(const [name,x]of Object.entries(result.models)){
  same(name+' explicit fixed instant',x.fixedTime,result.fixedTime);
  same(name+' zero runtime/console errors and writes',[x.errors,x.consoleErrors,x.writes],[[],[],0]);
  same(name+' pinned record settled',[x.baseline.docsMatch,x.baseline.inflight,x.baseline.queuedDocuments],[true,0,0]);
  same(name+' no pending record writes',x.financial.queue,{inflight:0,queued:0});
 }
 same('same exact native record',[A.baseline.version,A.baseline.stateSha256],[B.baseline.version,B.baseline.stateSha256]);
 same('every operational document preserved',A.financial.docs,B.financial.docs);
 same('physical units, quantities, source assets, branches and arrival evidence preserved',A.details.physical,B.details.physical);
 same('Build group identities preserved',Object.keys(A.details.build),Object.keys(B.details.build));
 for(const [key,b]of Object.entries(B.details.build)){
  const a=A.details.build[key];same('Build physical projection '+key,b&&Array.isArray(b.money)?{...a,money:b.money}:a,b);
 }
 same('footer only changes release number',A.financial.footer,B.financial.footer.replace(/v12\.50\.1\b/,'v12.54'));
 for(const key of ['direct','categories','costs','supplier','supplierModel','heldReferences','sourceScope','crew','fenceAll','eventCrew','documentedCustomerFenceAmount'])same('unrelated financial/source projection '+key,A.financial[key],B.financial[key]);
 const physicalService=rows=>rows.map(r=>({...r,per_night:null,total:null,lines:r.lines.map(l=>({...l,rate:null,per_night:null,total:null,nights:l.nights.map(n=>({...n,amount:null}))}))}));
 same('physical service units and every night preserved',physicalService(A.financial.service.per1040),physicalService(B.financial.service.per1040));
 same('supplier service decoration exact',A.financial.service.supplier1068,B.financial.service.supplier1068);
 same('physical tick count preserved',A.financial.ticks.ticks,B.financial.ticks.ticks);
 for(const key of ['install','cleaning','fire_ext','other'])same('physical '+key+' tick count',A.financial.ticks[key].ticks,B.financial.ticks[key].ticks);
 same('deferred Installation, Cleaning and fire financial projections preserved',A.financial.ticks,B.financial.ticks);
 same('public branch reader ignores extra arguments',A.finance.extraArgs,A.finance.branch);
 same('shared rendering/print/export controls preserved',A.finance.controls,B.finance.controls);
 for(const key of ['people','peopleCheck','pos','poSum','receiptedSum','notConfirmed','counts','noValue','cols','FBR','TBR','costs','costTotal','costCheck','wagesUnpricedAfterEvent'])same('Finance cost/source field '+key,A.finance.H[key],B.finance.H[key]);
 const addedCount=expected?Object.keys(expected.sourceAdditions||{}).length:A.details.contracts.length-B.details.contracts.length;
 same('billed source metadata changes only its reviewed line denominator',A.finance.H.billed,{...B.finance.H.billed,of:B.finance.H.billed.of+addedCount});
 for(const b of B.details.monthly){
  const a=A.details.monthly.find(x=>x.month===b.month);check('same monthly period '+b.month,!!a);
  for(const key of ['costs','unallocatedCosts','invoiceRecords','labourReview','supplierIncomplete1068','supplierFullCost1068','costCandidateTotal','costAccrue','costDecide','forecastCostTotal','invoiced','invoiceSnapshotTotal','wip'])same('monthly cost/source '+b.month+' '+key,a[key],b[key]);
 }
 check('all native reconciliation ties pass',A.financial.reconciliation.ok&&A.financial.reconciliation.bad===0&&A.financial.reconciliation.ties.every(x=>x.ok));
 check('all branch cent ties pass',Object.values(A.financial.branch.checks).every(Boolean));
 check('Finance invoice/current and forecast ties pass',Object.values(A.finance.H.invCheck).every(Boolean));
 money('headline equals ledger',A.financial.customer.total,A.financial.ledger.now);
 for(const [group,label]of [[A.financial.revenue,'candidate'],[B.financial.revenue,'base']]){
  const ledger=label==='candidate'?A.financial.ledger:B.financial.ledger;
  same(label+' current ledger adds to cents',group.reduce((s,r)=>s+cents(r.now),0),cents(ledger.now));
  same(label+' forecast ledger adds to cents',group.reduce((s,r)=>s+cents(r.job),0),cents(ledger.job));
 }
 same('branch identities preserved',A.financial.branch.rows.map(x=>x.code),B.financial.branch.rows.map(x=>x.code));
 for(const row of A.financial.branch.rows){
  const inv=A.finance.H.inv.find(x=>x.branch===row.code);check('Finance branch exists '+row.code,!!inv);
  money('Finance current revenue agrees '+row.code,inv.onRecord,row.revenue);money('Finance forecast agrees '+row.code,inv.job,row.revenueJob);
  const prior=B.finance.H.inv.find(x=>x.branch===row.code);money('billed amount preserved '+row.code,inv.billed,prior.billed);
 }
 if(!expected)return {status:'CAPTURE ONLY',checks,acceptance:false,reason:'Independent expected source/ledger/branch manifest not supplied'};
 check('expected manifest explicitly reviewed',expected.reviewed===true&&typeof expected.basis==='string'&&expected.basis.length>0);
 same('expectation predecessor pinned',expected.baseSha256,BASE_SHA);
 same('expectation candidate pinned',expected.candidateSha256,result.models.candidate.baseline.pageSha256);
 same('expectation pinned record',expected.stateSha256,result.models.candidate.baseline.stateSha256);
 if(expected.sewerZero===true){
  const refExpected=B.financial.service.per1040.map(r=>{
   const lines=r.lines.map(l=>l.kind==='sewer'?{...l,rate:0,per_night:0,total:0,nights:l.nights.map(n=>({...n,amount:0}))}:l);
   return {...r,lines,per_night:lines.reduce((s,l)=>s+cents(l.per_night),0)/100,total:lines.reduce((s,l)=>s+cents(l.total),0)/100};
  });
  same('only sewer customer amounts change in the physical service breakdown',A.financial.service.per1040,refExpected);
  for(const collection of ['lines','card_lines']){
   same('same service line identities '+collection,A.financial.service[collection].map(l=>l.key),B.financial.service[collection].map(l=>l.key));
   for(const b of B.financial.service[collection]){
    const a=A.financial.service[collection].find(l=>l.key===b.key);
    if(b.key!=='service|Sewer Connect Units Clean & Restock')same('unrelated service charge exact '+collection+' '+b.key,a,b);
    else{
     for(const field of ['amount','rate','per_night1040'])money('sewer customer zero '+collection+' '+field,a[field],0);
     for(const field of ['qty','their_rate','their_amount','card_line','card_rate','quote_qty1040','units1040','refs1040','supplier_qty1068','quote_their_amount1068','supplier_issue1068','qty_site12416'])same('sewer physical or supplier input preserved '+collection+' '+field,a[field],b[field]);
    }
   }
  }
  for(const field of ['at_cost','at_cost_total','their_total','their_water','not_on_the_card','nights1040','quote_their_total1068'])same('unrelated service projection '+field,A.financial.service[field],B.financial.service[field]);
 }
 for(const field of ['sourceChanges','sourceAdditions','contractResults','revenueDeltasCents','branchDeltasCents'])check('expected '+field+' supplied',expected[field]&&typeof expected[field]==='object'&&!Array.isArray(expected[field]));
 const before=new Map(B.details.contracts.map(x=>[x.key,x])),after=new Map(A.details.contracts.map(x=>[x.key,x]));
 same('no duplicate native source identities',after.size,A.details.contracts.length);
 same('no source rows removed',[...before.keys()].filter(k=>!after.has(k)),[]);
 same('only approved source additions',[...after.keys()].filter(k=>!before.has(k)).sort(),Object.keys(expected.sourceAdditions).sort());
 const targets=new Set([...Object.keys(expected.sourceChanges),...Object.keys(expected.sourceAdditions),...Object.keys(expected.contractResults)]);
 for(const [key,b]of before){
  const a=after.get(key),changes=expected.sourceChanges[key]||{},row={...b.row};
  for(const [field,value]of Object.entries(changes))row[field]=value;
  same('bounded source fields '+key,a.row,row);
  if(!targets.has(key))same('unrelated complete contract result '+key,a,b);
  else{
   same('existing contract branch and ownership preserved '+key,[a.branch,a.owner],[b.branch,b.owner]);
   same('existing physical source mapping preserved '+key,a.row.match,b.row.match);
  }
 }
 for(const [key,row]of Object.entries(expected.sourceAdditions))same('reviewed source-only addition '+key,after.get(key).row,row);
 for(const [key,wanted]of Object.entries(expected.contractResults)){
  const actual=after.get(key);check('expected contract result exists '+key,!!actual);
  for(const [field,value]of Object.entries(wanted)){
   if(field==='amountCents')same('settled contract charge '+key,actual.charge.amount==null?null:cents(actual.charge.amount),value);
   else if(field==='chargeFields')for(const [sub,v]of Object.entries(value))same('settled contract metadata '+key+' '+sub,actual.charge[sub],v);
   else same('settled contract result '+key+' '+field,actual[field],value);
  }
 }
 for(const key of Object.keys(expected.sourceChanges))check('source modification has an expected charge result '+key,key in expected.contractResults);
 for(const key of Object.keys(expected.sourceAdditions))check('source addition has an expected charge result '+key,key in expected.contractResults);
 const deltas=result.observedDeltas;
 same('ledger identities preserved',A.financial.revenue.map(x=>[x.key,x.code]),B.financial.revenue.map(x=>[x.key,x.code]));
 for(const [key,d]of Object.entries(deltas.revenue))same('independent ledger delta '+key,d,expected.revenueDeltasCents[key]||{now:0,job:0});
 for(const key of Object.keys(expected.revenueDeltasCents))check('expected ledger exists '+key,key in deltas.revenue);
 for(const [code,d]of Object.entries(deltas.branches))same('independent branch delta '+code,d,{revenue:0,revenueJob:0,cost:0,costJob:0,...expected.branchDeltasCents[code]});
 for(const code of Object.keys(expected.branchDeltasCents))check('expected branch exists '+code,code in deltas.branches);
 const sum=(collection,key)=>Object.values(collection).reduce((n,r)=>n+(r[key]||0),0);
 same('expected ledger current delta agrees with headline',deltas.headline.now,sum(expected.revenueDeltasCents,'now'));
 same('expected ledger forecast delta agrees with headline',deltas.headline.job,sum(expected.revenueDeltasCents,'job'));
 same('expected branch current delta agrees with headline',deltas.headline.now,sum(expected.branchDeltasCents,'revenue'));
 same('expected branch forecast delta agrees with headline',deltas.headline.job,sum(expected.branchDeltasCents,'revenueJob'));
 return {status:'PASS',checks,acceptance:true,expectedSha256:result.expectedSha256};
}

(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.CANDIDATE_SHA&&process.env.STATE&&process.env.OUT,'Explicit exact pages, snapshot and private output required');
 const out=privatePath(process.env.OUT,'OUT'),stateFile=privatePath(process.env.STATE,'STATE');fs.mkdirSync(out,{recursive:true});
 const candidate=path.resolve(process.env.CANDIDATE),base=path.resolve(process.env.BASE);
 assert.equal(sha(fs.readFileSync(base)),BASE_SHA);assert.equal(sha(fs.readFileSync(candidate)),process.env.CANDIDATE_SHA);
 const instant=new Date(process.env.FIXED_TIME||'2026-10-28T18:30:00.000Z');assert(Number.isFinite(instant.getTime()));
 let expected=null;const captureOnly=process.env.CAPTURE_ONLY==='1';
 if(process.env.EXPECTED){const file=privatePath(process.env.EXPECTED,'EXPECTED');expected=JSON.parse(fs.readFileSync(file,'utf8'));}
 assert(captureOnly||expected,'Acceptance requires an independently reviewed private EXPECTED manifest; use CAPTURE_ONLY=1 for diagnostics');
 const result={author:'Andrew Fisher',createdUtc:new Date().toISOString(),fixedTime:instant.toISOString(),models:{},expectedSha256:process.env.EXPECTED?sha(fs.readFileSync(process.env.EXPECTED)):null};
 const save=()=>fs.writeFileSync(path.join(out,'native-contracts.json'),JSON.stringify(result,null,2)+'\n');
 for(const [label,file]of [['base',base],['candidate',candidate]]){
  process.env.PAGE=file;process.env.STATE=stateFile;const s=await openCandidate();
  try{
   await s.page.clock.setFixedTime(instant);
   result.models[label]={financial:await s.page.evaluate(read),details:await s.page.evaluate(details),finance:await s.page.evaluate(finance),baseline:s.baseline,
    fixedTime:await s.page.evaluate(()=>new Date().toISOString()),errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
   console.log('Captured '+label+' native financial/source/physical outputs');
  }finally{await s.browser.close();}
  save();
 }
 result.observedDeltas=observedDeltas(result.models.candidate,result.models.base);save();
 try{result.validation=validate(result,captureOnly?null:expected);save();}
 catch(error){result.validation={status:'FAIL',acceptance:false,error:error.message};save();throw error;}
 console.log(JSON.stringify({status:result.validation.status,checks:result.validation.checks,acceptance:result.validation.acceptance}));
})().catch(e=>{console.error('FAIL native ruled-contract gate: '+e.stack);process.exitCode=1;});
