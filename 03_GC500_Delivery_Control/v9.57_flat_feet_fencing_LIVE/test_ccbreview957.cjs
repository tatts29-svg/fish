// Author: Andrew Fisher. Native classification guards and component labels.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const base=fs.readFileSync(process.env.BASE_PAGE,'utf8');
function section(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i+a.length);assert(i>=0&&j>i);return s.slice(i,j);}
function data(s){return JSON.parse(s.slice(s.indexOf('const DATA = ')+13).split('\n')[0].trim().replace(/;$/,''));}
const original=data(base),ctx=vm.createContext({DATA:data(html),fmtNum:String});
const checks=[];function check(name,f){f();checks.push(name);}
vm.runInContext(section(html,'const FENCE_CCB_REVIEW957 =','function fenceInstallationWeeks847()'),ctx);
vm.runInContext(section(html,'function fenceCcbReview847(record, options)','function fenceCcbSummary847('),ctx);
vm.runInContext(section(html,'const COLLECT_WORDS =','function bookPapersLine(')+'\nglobalThis.labels={COLLECT_WORDS,collectWords};',ctx);
vm.runInContext(section(html,'const PAPER_PARTS =',';',)+';globalThis.parts=PAPER_PARTS;',ctx);
const catalogue=ctx.DATA.fence_ccb_review847;
const files=Object.fromEntries(catalogue.sources.map(s=>[s.id,{sha256:s.sha256}]));
const clone=x=>JSON.parse(JSON.stringify(x));
const rows=catalogue.rows.filter(r=>['36591','36594'].includes(r.docket_no));
const records=rows.map(r=>({id:r.record_id,docket_no:r.docket_no,...clone(r.expected)}));
const review=(record,over={})=>ctx.fenceCcbReview847(record,{catalogue,files,records,...over});
check('existing classification sources and rows remain byte-equivalent',()=>{
 assert.deepEqual(clone(catalogue.sources.slice(0,original.fence_ccb_review847.sources.length)),original.fence_ccb_review847.sources);
 assert.deepEqual(clone(catalogue.rows.slice(0,original.fence_ccb_review847.rows.length)),original.fence_ccb_review847.rows);
 assert.equal(catalogue.rows.length,original.fence_ccb_review847.rows.length+2);
 assert.equal(catalogue.sources.length,original.fence_ccb_review847.sources.length+3);
});
check('human component labels and native count field',()=>{
 assert.equal(ctx.labels.collectWords({flat_feet_ccb:1}),'1 flat-feet CCB');
 assert.equal(ctx.labels.collectWords({flat_feet_ccb:19}),'19 flat-feet CCBs');
 assert.equal(ctx.parts.filter(p=>p[0]==='flat_feet_ccb').length,1);
});
for(const record of records){
 const label=record.docket_no;
 check(label+' confirms exact guarded record with matching current source hashes',()=>{
  const r=review(record);assert.equal(r.state,'confirmed');assert.equal(r.reviewState,'current');
  assert.equal(r.confirmedType,'ccb_event');assert.equal(r.assessed,true);
 });
 for(const field of ['date','location','quantities','components','note'])check(label+' rejects changed '+field,()=>{
  const changed=clone(record);if(field==='quantities')changed.quantities.ccb_event+=1;
  else if(field==='components')changed.components.cc_barrier+=1;else changed[field]+=' changed';
  const r=review(changed);assert.equal(r.state,'pending');assert.equal(r.reviewState,'stale');
 });
 check(label+' rejects duplicate current docket',()=>{
  assert.equal(review(record,{records:[...records,clone(record)]}).reviewState,'ambiguous');
 });
 for(const id of rows.find(r=>r.docket_no===label).source_ids){
  check(label+' requires source '+id,()=>{
   const missing=clone(files);delete missing[id];const r=review(record,{files:missing});
   assert.equal(r.state,'pending');assert.equal(r.reviewState,'unavailable');
  });
  check(label+' rejects changed source hash '+id,()=>{
   const changed=clone(files);changed[id].sha256='0'.repeat(64);const r=review(record,{files:changed});
   assert.equal(r.state,'pending');assert.equal(r.reviewState,'stale');
  });
 }
}
check('old programme version cannot confirm the new classification',()=>{
 const changed=clone(files);changed['GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'].sha256='e177'+'0'.repeat(60);
 for(const record of records)assert.equal(review(record,{files:changed}).reviewState,'stale');
});
check('catalogue installation is idempotent',()=>{
 const prior=JSON.stringify(catalogue);vm.runInContext('installCcbReview957(DATA)',ctx);assert.equal(JSON.stringify(catalogue),prior);
});
if(process.env.NATIVE_SNAPSHOT){
 const snapshot=JSON.parse(fs.readFileSync(process.env.NATIVE_SNAPSHOT,'utf8'));
 for(const record of records)check(record.docket_no+' expected fingerprint matches native captured docket',()=>{
  const actual=snapshot.dockets.find(d=>d.id===record.id);assert(actual);
  const r=review(actual,{records:snapshot.dockets});assert.equal(r.state,'confirmed');
 });
}
if(process.env.FIRST_CANDIDATE)check('classification and component-label extension preserves all initial price configuration and functions',()=>{
 const first=fs.readFileSync(process.env.FIRST_CANDIDATE,'utf8');
 assert.equal(section(html,'const FENCE = DATA.fence','const FCOM = '),section(first,'const FENCE = DATA.fence','const FCOM = '));
 for(const [a,b] of [['function fenceRateFor(key)','/* v5.80'],['function fenceCostFor(key)','/* One reading'],['function costDocket(d)','function docketProblems(d)']])assert.equal(section(html,a,b),section(first,a,b));
});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:checks.length,details:checks},null,2));
