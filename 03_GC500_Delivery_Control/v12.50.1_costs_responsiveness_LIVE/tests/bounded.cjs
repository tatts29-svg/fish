/* Author: Andrew Fisher. Same-record native comparison and real navigation; writes denied. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const shared=fs.readFileSync(path.resolve(__dirname,'../../v12.45.1_financial_consistency_LIVE/tests/financial_native.cjs'),'utf8');
const begin=shared.indexOf('const read=()=>holdAssets(()=>{'),end=shared.indexOf('\nasync function optionalRegisterCapture',begin);
assert(begin>=0&&end>begin,'Shared financial reader boundary changed');
const read=vm.runInNewContext(shared.slice(begin,end).replace(/^const read=/,'').replace(/;\s*$/,''));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const clock='2026-10-28T18:30:00.000Z';
const baseSha='7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404';
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
async function capture(file,label){
 process.env.PAGE=file;process.env.INITIAL_HASH='#today';
 const s=await openCandidate();
 try{
  await s.page.clock.setFixedTime(new Date(clock));
  const before=await s.page.evaluate(read),samples=[];
  for(let n=0;n<3;n++)samples.push(await s.page.evaluate(async()=>{
   const paint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   go('today');await paint();
   const start=performance.now();go('costs');const syncMs=performance.now()-start;await paint();
   return{syncMs,nextPaintMs:performance.now()-start,active:state.tab,visible:document.getElementById('pane-costs').classList.contains('on'),nodes:document.getElementById('pane-costs').querySelectorAll('*').length};
  }));
  const after=await s.page.evaluate(read);
  for(const field of Object.keys(before).filter(k=>k!=='evaluationMs'))assert.deepEqual(canonical(after[field]),canonical(before[field]),label+' stable '+field);
  assert(samples.every(x=>x.active==='costs'&&x.visible));
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  const result={label,mobile:process.env.MOB==='1',pageSha256:sha(fs.readFileSync(file)),baseline:s.baseline,samples,financial:after,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
  console.log(JSON.stringify({label,mobile:result.mobile,samples,errors:result.errors,consoleErrors:result.consoleErrors,writes:result.writes}));
  return result;
 }finally{await s.browser.close();}
}
(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.CANDIDATE_SHA&&process.env.STATE&&process.env.OUT);
 assert.equal(sha(fs.readFileSync(process.env.BASE)),baseSha);assert.equal(sha(fs.readFileSync(process.env.CANDIDATE)),process.env.CANDIDATE_SHA);
 const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'Evidence must stay outside the repository');fs.mkdirSync(out,{recursive:true});
 const candidate=process.env.CANDIDATE;
 let B,A;
 if(process.env.REVERSE_ORDER==='1'){A=await capture(candidate,'candidate501');B=await capture(process.env.BASE,'native50');}
 else{B=await capture(process.env.BASE,'native50');A=await capture(candidate,'candidate501');}
 for(const field of Object.keys(B.financial).filter(k=>!['evaluationMs','footer'].includes(k)))assert.deepEqual(canonical(A.financial[field]),canonical(B.financial[field]),'Native '+field+' preserved');
 assert.equal(A.financial.footer,B.financial.footer.replace(/v12\.50\b/,'v12.50.1'));
 assert(A.financial.reconciliation.ties.every(t=>t.ok),'Native reconciliation remains exact');
 assert.deepEqual(A.samples.map(x=>x.nodes),B.samples.map(x=>x.nodes),'Native Costs DOM size preserved');
 const median=rows=>rows.map(x=>x.nextPaintMs).sort((a,b)=>a-b)[1];
 const result={author:'Andrew Fisher',status:'PASS native preservation; timings require review',order:process.env.REVERSE_ORDER==='1'?'candidate then base':'base then candidate',clock,stateSha256:sha(fs.readFileSync(process.env.STATE)),results:[B,A],nextPaintMedianMs:{base:median(B.samples),candidate:median(A.samples)}};
 fs.writeFileSync(path.join(out,'bounded.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,nextPaintMedianMs:result.nextPaintMedianMs}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
