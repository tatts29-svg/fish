/* Author: Andrew Fisher. Read-only phone evidence; private matches and output only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const {screenshot}=require('./native_read_model.cjs');
(async()=>{
 assert(process.env.PAGE&&process.env.STATE&&process.env.OUT&&process.env.MATCH_FIXTURE,'PAGE, STATE, private OUT and MATCH_FIXTURE required');
 const output=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
 assert(output!==repo&&!output.startsWith(repo+path.sep),'Native evidence must stay outside the repository');
 const matches=JSON.parse(fs.readFileSync(process.env.MATCH_FIXTURE,'utf8')).matches;assert(Array.isArray(matches)&&matches.length);
 fs.mkdirSync(output,{recursive:true});process.env.MOB='1';process.env.INITIAL_HASH='#today';
 const s=await openCandidate();
 try{
  const read=()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
  const before=await s.page.evaluate(read),result={author:'Andrew Fisher',baseline:s.baseline,phone:[]};
  for(let i=0;i<matches.length;i++)result.phone.push(await screenshot(s,matches[i],output,i+1));
  assert.equal(await s.page.evaluate(read),before,'Read-back cannot change documents');
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  assert.deepEqual(await s.page.evaluate(()=>[Object.keys(SYNC.inflight||{}).length,Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)]),[0,0]);
  result.docsSha256=crypto.createHash('sha256').update(before).digest('hex');result.errors=s.errors;result.consoleErrors=s.consoleErrors;result.writeAttempts=s.counts.blocked;
  result.validation={ok:true};fs.writeFileSync(path.join(output,'read-model-ui.json'),JSON.stringify(result,null,2)+'\n');
  console.log('PASS changed departure label visible on phone; exact documents preserved; zero runtime/console errors or writes');
 }finally{await s.browser.close();}
})().catch(error=>{console.error('FAIL phone read-back: '+error.stack);process.exitCode=1;});
