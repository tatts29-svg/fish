/* Author: Andrew Fisher. Diagnostic execution counts only; never a timing benchmark. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.CANDIDATE_SHA&&process.env.STATE&&process.env.OUT);
 const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep));fs.mkdirSync(out,{recursive:true});
 const results=[];
 for(const [label,file,expected]of[['base',process.env.BASE,'7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404'],['candidate',process.env.CANDIDATE,process.env.CANDIDATE_SHA]]){
  const original=fs.readFileSync(file,'utf8');assert.equal(sha(original),expected);
  const start='function pl760Ticks(){\n',body=' const fwf1244ByBranch = {};\n',finance='function fh866Model(){\n';
  assert.equal(original.split(start).length,2);assert.equal(original.split(body).length,2);assert.equal(original.split(finance).length,2);
  const entry=' window.__tickEntries12501=(window.__tickEntries12501||0)+1;\n';
  const calculation=' window.__tickCalculations12501=(window.__tickCalculations12501||0)+1;\n';
  const financeCount=' window.__financeReads12501=(window.__financeReads12501||0)+1;\n';
  const instrumented=original.replace(start,start+entry).replace(body,calculation+body).replace(finance,finance+financeCount);
  assert.equal(instrumented.replace(entry,'').replace(calculation,'').replace(financeCount,''),original,'Only additive counters may differ');
  const copy=path.join(out,label+'-diagnostic.html');fs.writeFileSync(copy,instrumented);process.env.PAGE=copy;process.env.INITIAL_HASH='#today';
  const s=await openCandidate();
  try{
   await s.page.clock.setFixedTime(new Date('2026-10-28T18:30:00.000Z'));
   const result=await s.page.evaluate(async()=>{
    const docs=()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
    const paint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const before=docs();go('today');await paint();window.__tickEntries12501=0;window.__tickCalculations12501=0;window.__financeReads12501=0;
    go('costs');const synchronous={entries:window.__tickEntries12501,calculations:window.__tickCalculations12501,financeReads:window.__financeReads12501};await paint();
    return{synchronous,throughTwoFrames:{entries:window.__tickEntries12501,calculations:window.__tickCalculations12501,financeReads:window.__financeReads12501},docsPreserved:before===docs()};
   });
   assert(result.docsPreserved);assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
   results.push({label,originalSha256:expected,instrumentedSha256:sha(instrumented),...result,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked});
  }finally{await s.browser.close();}
 }
 assert(results[1].synchronous.entries<=results[0].synchronous.entries,'No additional tick reader calls');
 assert(results[1].synchronous.financeReads<results[0].synchronous.financeReads,'Finance duplicate calculation removed');
 assert.equal(results[0].synchronous.calculations,results[0].synchronous.entries,'Baseline recomputes every time');
 assert(results[1].synchronous.calculations<results[0].synchronous.calculations,'Candidate must skip redundant calculations');
 fs.writeFileSync(path.join(out,'reuse.json'),JSON.stringify({author:'Andrew Fisher',purpose:'Diagnostic execution counts on exact copies with only additive counters; do not use instrumented time as speed evidence',results},null,2)+'\n');console.log(JSON.stringify(results.map(({label,synchronous,throughTwoFrames})=>({label,synchronous,throughTwoFrames}))));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
