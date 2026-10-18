/* Author: Andrew Fisher. Native before/after fencing reconciliation with frozen read-only APIs.
   GC500_FIXTURE=<private captured GET folder> node browser_parity.cjs base.html candidate.html private-bundle.json private-result.json
   The shared harness blocks every operational write. No original contents or financial values are printed. */
'use strict';
const C=require('../../v10.66_speed_smooth_DRAFT/tests/validation/common.cjs'),assert=require('assert/strict');
const [baseFile,candidateFile,bundleFile,outFile]=process.argv.slice(2);
if(!outFile)throw Error('Expected base, candidate, private bundle and private output');
const bundle=JSON.parse(C.fs.readFileSync(bundleFile));
const extra=bundle.progress_after.operations.slice(bundle.progress_before.operations.length),ids=new Set(extra.map(x=>x.id));
const out={author:'Andrew Fisher',baseSha256:C.sha(C.fs.readFileSync(baseFile)),candidateSha256:C.sha(C.fs.readFileSync(candidateFile)),checks:[]};
C.writePrivate(outFile,{pending:true});
function check(name,fn){fn();out.checks.push(name);console.log('PASS '+name);}
async function capture(pageFile){
 const s=await C.launch({pageFile,mobile:process.env.MOB==='1',hash:'#today'});
 try{
  await C.ready(s);await s.page.waitForFunction(()=>SYNC.first.size===Object.keys(SYNC_COLLS).length&&SYNC.pending&&Object.keys(SYNC.pending).length===0);
  await C.settled(s.page);assert((await C.mergeReport(s.page)).complete,'shared merge is complete');
  const r=await s.page.evaluate(()=>{const day=todayIso(),f=todayFencingSummary848(day),w=todayWorkSummary848(day,undefined,undefined,f),o=fenceOverall853(day,w,f);return {record:JSON.stringify(S),fencing:f,rows:w.fencingRows,overall:o,finance:fenceDerived(),labour:greenBookTotals()};});
  const before=r.record;
  for(const tab of ['progress','fencing','today']){await s.page.evaluate(tab=>go(tab),tab);await C.settled(s.page);}
  assert.equal(await s.page.evaluate(()=>JSON.stringify(S)),before,'native output reads leave the record unchanged');
  C.assertClean(s);r.health=C.errorsOf(s);return r;
 }finally{await s.browser.close();}
}
(async()=>{
 try{
  out.before=await capture(baseFile);out.after=await capture(candidateFile);const b=out.before,n=out.after;
  check('same complete shared record in both candidates',()=>assert.equal(n.record,b.record));
  check('existing financial totals unchanged',()=>assert.deepEqual(n.finance,b.finance));
  check('existing service labour hours and costs unchanged',()=>assert.deepEqual(n.labour,b.labour));
  check('installation headline and percentages unchanged',()=>assert.deepEqual(n.overall,b.overall));
  check('every installation and gate row unchanged',()=>assert.deepEqual(n.rows.filter(r=>r.id!=='relocation'),b.rows.filter(r=>r.id!=='relocation')));
  check('all four reviewed activities accepted by native source guards',()=>{const a=n.fencing.evidence.operations.filter(x=>ids.has(x.id));assert.equal(a.length,4);assert.deepEqual(a.map(x=>[x.id,x.type,x.quantity,x.unit]),extra.map(x=>[x.id,x.type,x.quantity,x.unit]));assert(!n.fencing.evidence.pending.some(x=>ids.has(x.id)));});
  check('existing activity decisions and pending issues preserved',()=>{assert.deepEqual(n.fencing.evidence.operations.filter(x=>!ids.has(x.id)),b.fencing.evidence.operations);assert.deepEqual(n.fencing.evidence.pending,b.fencing.evidence.pending);assert.deepEqual(n.fencing.evidence.planAllowances,b.fencing.evidence.planAllowances);});
  check('only reviewed scrim work enters the separate activity display',()=>{assert.deepEqual(n.fencing.activities.filter(x=>!ids.has(x.id)),b.fencing.activities);assert.deepEqual(n.fencing.activities.filter(x=>ids.has(x.id)).map(x=>[x.id,x.quantity]),extra.filter(x=>x.type==='scrim_existing').map(x=>[x.id,x.quantity]));});
  check('relocation increases only by the reviewed physical movement',()=>{const before=b.rows.find(r=>r.id==='relocation'),after=n.rows.find(r=>r.id==='relocation'),amount=extra.filter(x=>x.type==='relocation').reduce((sum,x)=>sum+x.quantity,0);assert(before&&after);assert.equal(after.done-before.done,amount);assert.equal(after.total,before.total);const bs=b.fencing.summaryRows.find(r=>r.id==='relocation'),ns=n.fencing.summaryRows.find(r=>r.id==='relocation');assert.equal(ns.redRecorded,bs.redRecorded);assert.equal(ns.extraWorkRecorded-bs.extraWorkRecorded,amount);});
  out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);process.exitCode=1;}
 finally{C.writePrivate(outFile,out);}
 console.log(JSON.stringify({pass:out.pass,checks:out.checks.length,error:out.error?.split('\n')[0]}));
})();
