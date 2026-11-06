/* Author: Andrew Fisher. Bounded actual navigation observations, not a general performance certification. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),clock='2026-10-28T18:30:00.000Z';
async function capture(file,label,mobile){
 process.env.PAGE=file;process.env.MOB=mobile?'1':'0';process.env.INITIAL_HASH='#today';
 const s=await openCandidate();
 try{
  await s.page.clock.setFixedTime(new Date(clock));await s.page.evaluate(()=>render());
  const before=await s.page.evaluate(()=>holdAssets(()=>({money:moneySummary(),docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))})));
  const samples=[];
  for(let n=0;n<2;n++)samples.push(await s.page.evaluate(async()=>{
   const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   go('today');await paint();
   const start=performance.now();go('costs');const synchronous=performance.now()-start;await paint();
   return{syncMs:synchronous,nextPaintMs:performance.now()-start,active:state.tab,visible:!!document.getElementById('pane-costs')?.classList.contains('on'),preview:!!document.getElementById('pl1251-preview')};
  }));
  assert(samples.every(s=>s.active==='costs'&&s.visible));
  const after=await s.page.evaluate(()=>holdAssets(()=>({money:moneySummary(),docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))})));
  assert.deepEqual(after,before);assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  const result={label,mobile,pageSha256:sha(fs.readFileSync(file)),samples,errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};console.log(JSON.stringify(result));return result;
 }finally{await s.browser.close();}
}
(async()=>{
 assert(process.env.BASE&&process.env.CANDIDATE&&process.env.STATE&&process.env.OUT);fs.mkdirSync(process.env.OUT,{recursive:true});
 const results=[];for(const mobile of [false,true]){results.push(await capture(process.env.BASE,'native50',mobile));results.push(await capture(process.env.CANDIDATE,'preview51',mobile));}
 const out={author:'Andrew Fisher',status:'PASS native navigation/financial/document checks',fixedTime:clock,stateSha256:sha(fs.readFileSync(process.env.STATE)),samplesPerSession:2,method:'Actual go(today) then go(costs), native holdAssets path; synchronous time and two animation frames. Serial local warm navigation samples only.',results};
 fs.writeFileSync(path.join(process.env.OUT,'actual-navigation.json'),JSON.stringify(out,null,2)+'\n');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
