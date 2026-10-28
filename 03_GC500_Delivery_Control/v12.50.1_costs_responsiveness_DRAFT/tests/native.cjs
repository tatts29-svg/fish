/* Author: Andrew Fisher. Full native financial/source/output differential; HTTP writes denied. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function extract(file,start,finish){const text=fs.readFileSync(path.resolve(__dirname,file),'utf8'),begin=text.indexOf(start),end=text.indexOf(finish,begin);assert(begin>=0&&end>begin);return vm.runInNewContext(text.slice(begin,end).replace(/^const \w+=/,'').replace(/;\s*$/,''));}
const read=extract('../../v12.45.1_financial_consistency_LIVE/tests/financial_native.cjs','const read=()=>holdAssets(()=>{','\nasync function optionalRegisterCapture');
const details=extract('../../v12.50_contract_quantity_precision_LIVE/tests/native_precision.cjs','const readDetails=()=>holdAssets(()=>{','\n(async()=>');
const finance=()=>holdAssets(()=>{
 const H=fh866Model(),legacy=legacyFinance978(),B=pl752Rows(),M=moneySummary();
 return JSON.parse(JSON.stringify({H,legacy,summary:fin745Summary(),branch:branchFinancial978(B,M),extraArgs:branchFinancial978.call({testReceiver:true},B,M,{costs:[]}),csv:fh866Csv(H),text:fh866Text(H),html:fh866Html(),monthlyHtml:fin745Html(),functions:{print:printCosts.toString(),csv:fh866Csv.toString(),text:fh866Text.toString(),html:fh866Html.toString(),pricing:renderPricing.toString(),monthly:fin745Html.toString()}}));
});
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.CANDIDATE_SHA&&process.env.STATE&&process.env.OUT);
 assert.equal(sha(fs.readFileSync(process.env.BASE)),'7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404');assert.equal(sha(fs.readFileSync(process.env.CANDIDATE)),process.env.CANDIDATE_SHA);
 const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep));fs.mkdirSync(out,{recursive:true});
 const results={},candidate=process.env.CANDIDATE;
 for(const[label,file]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=file;const s=await openCandidate();
  try{
   await s.page.clock.setFixedTime(new Date('2026-10-28T18:30:00.000Z'));
   results[label]={financial:await s.page.evaluate(read),details:await s.page.evaluate(details),finance:await s.page.evaluate(finance),baseline:s.baseline,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
   assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);console.log('Captured '+label+' native outputs');
  }finally{await s.browser.close();}
 }
 let checks=0;const same=(a,b,name)=>{assert.deepEqual(canonical(a),canonical(b),name);checks++;};
 const A=results.candidate,B=results.base;
 for(const field of Object.keys(B.financial).filter(k=>!['evaluationMs','footer'].includes(k)))same(A.financial[field],B.financial[field],'financial '+field);
 assert.equal(A.financial.footer,B.financial.footer.replace(/v12\.50\b/,'v12.50.1'));checks++;
 for(const field of Object.keys(B.details))same(A.details[field],B.details[field],'detail '+field);
 for(const field of Object.keys(B.finance))same(A.finance[field],B.finance[field],'Finance '+field);
 same(A.finance.extraArgs,A.finance.branch,'extra public arguments ignored');
 const result={author:'Andrew Fisher',status:'PASS',checks,results};fs.writeFileSync(path.join(out,'native.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:'PASS',checks,errors:[],consoleErrors:[],writes:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
