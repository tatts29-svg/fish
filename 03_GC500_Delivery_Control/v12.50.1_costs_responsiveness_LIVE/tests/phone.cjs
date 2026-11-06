/* Author: Andrew Fisher. Existing Costs/Pricing/Finance phone controls, read-only. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
(async()=>{
 assert(process.env.PAGE&&process.env.PAGE_SHA&&process.env.STATE&&process.env.OUT);assert.equal(process.env.MOB,'1');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.PAGE_SHA);
 fs.mkdirSync(process.env.OUT,{recursive:true});const s=await openCandidate(),screens=[];
 try{
  await s.page.clock.setFixedTime(new Date('2026-10-28T18:30:00.000Z'));
  const read=()=>holdAssets(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),money:moneySummary(),branch:branchFinancial978(pl752Rows(),moneySummary()),finance:fh866Model()}));
  const before=await s.page.evaluate(read);
  for(const[view,id]of[['summary','#pl770'],['pricing','#finance857-section'],['handover','#handover866'],['summary','#pl770']]){
   await s.page.locator('.finance857-nav [data-finance857="'+view+'"]').click();
   await s.page.waitForFunction(view=>state.tab==='costs'&&state.financeView857===view,view);
   const section=s.page.locator(id);assert(await section.isVisible(),view+' native section remains visible');
   await section.evaluate(n=>n.scrollIntoView({block:'start'}));await s.page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   if(view==='handover'){assert(await s.page.locator('#handover866 table').count());assert(!(await section.textContent()).includes('could not be worked out'));}
   const name=view+'-'+screens.length+'-phone.png';await s.page.screenshot({path:path.join(process.env.OUT,name),fullPage:false});screens.push(name);
  }
  await s.page.evaluate(()=>{go('today');go('costs');});assert(await s.page.locator('#pl770').isVisible());
  assert.deepEqual(await s.page.evaluate(read),before,'Native documents and complete models remain exact after real controls/re-entry');
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  const result={author:'Andrew Fisher',status:'PASS',baseline:s.baseline,screens,checks:['Actual summary, pricing and Finance clicks','Native sections and Finance tables visible','Today/Costs re-entry','Complete native models and documents unchanged'],errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
  fs.writeFileSync(path.join(process.env.OUT,'phone.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
