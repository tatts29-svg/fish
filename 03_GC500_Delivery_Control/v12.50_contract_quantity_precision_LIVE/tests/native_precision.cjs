/* Author: Andrew Fisher. Native source-precision differential; HTTP writes denied. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const manifest=require('../contract_quantity1250.json');
const shared=fs.readFileSync(path.resolve(__dirname,'../../v12.45.1_financial_consistency_LIVE/tests/financial_native.cjs'),'utf8');
const begin=shared.indexOf('const read=()=>holdAssets(()=>{'),end=shared.indexOf('\nasync function optionalRegisterCapture',begin);
assert(begin>=0&&end>begin,'Shared financial reader boundary changed');
const read=vm.runInNewContext(shared.slice(begin,end).replace(/^const read=/,'').replace(/;\s*$/,''));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>assert.deepEqual(canonical(a),canonical(b));
const key=r=>String(r.rental_contract)+'|'+String(r.line),rules=new Map(manifest.rows.map(r=>[r.contract+'|'+r.line,r]));
const readDetails=()=>holdAssets(()=>{
 RENDER_MEMO.clear();HELD_MEMO.clear();
 return JSON.parse(JSON.stringify({
  contracts:ONHIRE_ROWS.map(row=>({key:String(row.rental_contract)+'|'+String(row.line),row,charge:contractCharge(row),category:contractChargeCategory1224(row),stream:contractChargeStream1224(row),branch:generatorBranch1004(row),billingQuantity:contractBillingQuantity1010(row),treatment:contractTreatment747(row),owner:finance928ContractOwner(row)})),
  figures:contractFigures(ONHIRE_ROWS),branches:pl752Rows(),trades:[...tradeCharges().values()],
  build:todayGroupDetails841(),monthly:['2026-09','2026-10','2026-11'].map(m=>acc761Model(m)),
  physical:allAssets().map(a=>({asset:a,units:gcModel925(a).rows,charges:chargeLines(a),delivery:deliveryOf(a.key),branch:branchOf(a.key)}))
 }));
});
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE&&process.env.OUT&&process.env.BASE_SHA&&process.env.PAGE_SHA&&process.env.FIXED_TIME,'Explicit exact pages, snapshot, private output and fixed instant required');
 const output=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
 assert(!output.startsWith(repo+path.sep),'Evidence stays outside the repository');fs.mkdirSync(output,{recursive:true});
 const instant=new Date(process.env.FIXED_TIME);assert(Number.isFinite(instant.getTime()));
 assert.equal(sha(fs.readFileSync(process.env.BASE)),process.env.BASE_SHA);assert.equal(sha(fs.readFileSync(process.env.PAGE)),process.env.PAGE_SHA);
 const candidate=process.env.PAGE,result={author:'Andrew Fisher',models:{},fixedTime:instant.toISOString()};
 for(const [name,pageFile]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=pageFile;const s=await openCandidate();
  try{await s.page.clock.setFixedTime(instant);result.models[name]={financial:await s.page.evaluate(read),details:await s.page.evaluate(readDetails),baseline:s.baseline,fixedTime:await s.page.evaluate(()=>new Date().toISOString()),pageErrors:s.errors,consoleErrors:s.consoleErrors,writeAttempts:s.counts.blocked};}
  finally{await s.browser.close();}
 }
 const save=()=>fs.writeFileSync(path.join(output,'native-precision.json'),JSON.stringify(result,null,2)+'\n');save();
 let passed=0;const same=(name,a,b)=>{equal(a,b);passed++;console.log('PASS '+name);};
 const B=result.models.base,A=result.models.candidate;
 for(const [name,x]of Object.entries(result.models)){
  same(name+' fixed instant',x.fixedTime,instant.toISOString());
  same(name+' zero errors and writes',[x.pageErrors,x.consoleErrors,x.writeAttempts],[[],[],0]);
  same(name+' pinned record settled',[x.baseline.docsMatch,x.baseline.inflight,x.baseline.queuedDocuments],[true,0,0]);
 }
 same('same exact native snapshot',[A.baseline.version,A.baseline.stateSha256],[B.baseline.version,B.baseline.stateSha256]);
 for(const field of Object.keys(B.financial)){
  if(['contracts','footer','evaluationMs'].includes(field))continue;
  same('full native '+field+' preserved',A.financial[field],B.financial[field]);
 }
 same('footer changes only version',A.financial.footer,B.financial.footer.replace(/v12\.49\b/,'v12.50'));
 same('contract count preserved',A.financial.contracts.length,B.financial.contracts.length);
 for(const before of B.financial.contracts){const after=A.financial.contracts.find(r=>key(r)===key(before)),rule=rules.get(key(before));assert(after);same('source fields bounded '+key(before),after,rule?{...before,quantity:rule.quantity}:before);}
 same('six reviewed rows present',B.details.contracts.filter(r=>rules.has(r.key)).length,6);
 for(const before of B.details.contracts){const after=A.details.contracts.find(r=>r.key===before.key),rule=rules.get(before.key);assert(after);
  same('native charge, ownership, category and branch preserved '+before.key,after,rule?{...before,row:{...before.row,quantity:rule.quantity},billingQuantity:rule.quantity}:before);
 }
 for(const field of ['figures','branches','trades','build','monthly','physical'])same(field+' preserved exactly',A.details[field],B.details[field]);
 assert(A.financial.reconciliation.ties.every(t=>t.ok),'Native reconciliation must pass');passed++;
 result.passed=passed;result.status='PASS';save();console.log('PASS native source precision gate: '+passed+' checks');
})().catch(e=>{console.error('FAIL '+e.stack);process.exitCode=1;});
