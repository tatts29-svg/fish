/* Author: Andrew Fisher. Same-record native financial/source preservation for the map-only change.
 * Read-only shared harness; all detailed evidence stays in private OUT outside git.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const BASE_SHA='20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function extract(file,start,finish){
 const text=fs.readFileSync(path.resolve(__dirname,file),'utf8'),begin=text.indexOf(start),end=text.indexOf(finish,begin);
 assert(begin>=0&&end>begin,'Reviewed native reader boundary changed');
 return vm.runInNewContext(text.slice(begin,end).replace(/^const \w+=/,'').replace(/;\s*$/,''));
}
const read=extract('../../v12.45.1_financial_consistency_LIVE/tests/financial_native.cjs','const read=()=>holdAssets(()=>{','\nasync function optionalRegisterCapture');
const details=extract('../../v12.50_contract_quantity_precision_LIVE/tests/native_precision.cjs','const readDetails=()=>holdAssets(()=>{','\n(async()=>');
const finance=()=>holdAssets(()=>{
 const H=fh866Model(),legacy=legacyFinance978(),B=pl752Rows(),M=moneySummary();
 return JSON.parse(JSON.stringify({H,legacy,summary:fin745Summary(),branch:branchFinancial978(B,M),
  csv:fh866Csv(H),text:fh866Text(H),html:fh866Html(),monthlyHtml:fin745Html(),
  functions:{print:printCosts.toString(),csv:fh866Csv.toString(),text:fh866Text.toString(),html:fh866Html.toString(),pricing:renderPricing.toString(),monthly:fin745Html.toString()}}));
});
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
(async()=>{
 for(const key of ['BASE','CANDIDATE','CANDIDATE_SHA','STATE','OUT','FIXED_TIME'])assert(process.env[key],key+' required');
 const candidate=path.resolve(process.env.CANDIDATE),state=path.resolve(process.env.STATE),out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
 assert(out!==repo&&!out.startsWith(repo+path.sep),'Detailed evidence must stay outside the repository');
 assert.equal(sha(fs.readFileSync(process.env.BASE)),BASE_SHA,'Exact reviewed predecessor required');
 assert.match(process.env.CANDIDATE_SHA,/^[a-f0-9]{64}$/,'Full candidate SHA required');
 assert.equal(sha(fs.readFileSync(candidate)),process.env.CANDIDATE_SHA,'Candidate bytes changed');
 const stateSha=sha(fs.readFileSync(state)),instant=new Date(process.env.FIXED_TIME);assert(Number.isFinite(instant.getTime()),'Valid fixed instant required');
 fs.mkdirSync(out,{recursive:true});
 const report={author:'Andrew Fisher',baseSha256:BASE_SHA,candidateSha256:process.env.CANDIDATE_SHA,stateSha256:stateSha,fixedTime:instant.toISOString(),models:{}};
 const save=()=>fs.writeFileSync(path.join(out,'financial-preservation.json'),JSON.stringify(report,null,2)+'\n');
 for(const[label,file]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=file;process.env.INITIAL_HASH='#costs';
  const s=await openCandidate();
  try{
   await s.page.clock.setFixedTime(instant);
   const captured={financial:await s.page.evaluate(read),details:await s.page.evaluate(details),finance:await s.page.evaluate(finance),baseline:s.baseline,
    fixedTime:await s.page.evaluate(()=>new Date().toISOString()),runtimeErrors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
   report.models[label]=captured;save();
   assert.deepEqual(captured.runtimeErrors,[],'No '+label+' runtime errors');
   assert.deepEqual(captured.consoleErrors,[],'No '+label+' console errors');assert.equal(captured.writes,0,'No operational writes');
   console.log('Captured '+label+' native models');
  }finally{await s.browser.close();}
 }
 let checks=0;const same=(a,b,name)=>{assert.deepEqual(canonical(a),canonical(b),name);checks++;};
 const A=report.models.candidate,B=report.models.base;
 for(const [name,x]of Object.entries(report.models)){
  same(x.fixedTime,instant.toISOString(),name+' fixed instant');
  same([x.baseline.docsMatch,x.baseline.inflight,x.baseline.queuedDocuments],[true,0,0],name+' pinned native record and empty write queue');
  same(x.baseline.stateSha256,stateSha,name+' exact source snapshot');
  same(x.financial.queue,{inflight:0,queued:0},name+' no writes after financial reads');
 }
 same([A.baseline.version,A.baseline.stateSha256],[B.baseline.version,B.baseline.stateSha256],'Same native record');
 for(const field of Object.keys(B.financial).filter(k=>!['evaluationMs','footer'].includes(k)))same(A.financial[field],B.financial[field],'Financial '+field);
 assert.match(B.financial.footer,/v12\.54\.1\b/,'Predecessor version visible');
 same(A.financial.footer,B.financial.footer.replace(/v12\.54\.1\b/,'v12.57'),'Only release footer changes');
 for(const field of Object.keys(B.details))same(A.details[field],B.details[field],'Source detail '+field);
 for(const field of Object.keys(B.finance))same(A.finance[field],B.finance[field],'Finance '+field);
 same(sha(fs.readFileSync(candidate)),process.env.CANDIDATE_SHA,'Candidate unchanged during checks');
 same(sha(fs.readFileSync(state)),stateSha,'Record fixture unchanged during checks');
 report.status='PASS';report.checks=checks;save();
 console.log(JSON.stringify({status:'PASS',checks,baseSha256:BASE_SHA,candidateSha256:process.env.CANDIDATE_SHA,record:A.baseline.version,runtimeErrors:0,consoleErrors:0,writes:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
