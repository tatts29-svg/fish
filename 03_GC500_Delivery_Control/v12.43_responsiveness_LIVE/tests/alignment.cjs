/* Author: Andrew Fisher. Private native startup/Costs alignment regression; GET only. */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('./candidate_harness.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
(async()=>{
 const results={author:'Andrew Fisher',checks:[]};
 const check=(name,ok)=>{results.checks.push({name,ok:!!ok});assert(ok,name);};
 const final=process.env.PAGE;
 for(const [kind,file]of [['base',process.env.BASELINE_PAGE],['candidate',final]]){
  process.env.PAGE=file;process.env.INITIAL_HASH='#today';
  const s=await openCandidate();
  try{
   const docs=await s.page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
   const before=await s.page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {tab:state.tab,hiddenAlignment:!!document.querySelector('#pane-costs #align1055')};});
   check(kind+' starts on Today',before.tab==='today');
   if(kind==='candidate')check('Hidden Costs report is not created during startup',!before.hiddenAlignment);
   await s.page.evaluate(()=>go('costs'));await s.page.waitForSelector('#pane-costs #align1055',{state:'attached',timeout:20000});
   const visible=await s.page.locator('#pane-costs #align1055').textContent();
   const normalize=t=>t.replace(/\s+/g,' ').trim();
   const visibleHash=hash(normalize(visible));
   await s.page.evaluate(()=>{RENDER_MEMO.delete('costs');renderCosts();});await s.page.waitForSelector('#pane-costs #align1055',{state:'attached',timeout:20000});
   check(kind+' active Costs refresh retains alignment content',hash(normalize(await s.page.locator('#pane-costs #align1055').textContent()))===visibleHash);
   if(kind==='candidate')await s.page.screenshot({path:process.env.OUT+'/alignment-phone.png'});
   const hidden=await s.page.evaluate(async()=>{go('today');document.querySelector('#pane-costs #align1055')?.remove();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return !!document.querySelector('#pane-costs #align1055');});
   if(kind==='candidate')check('Hidden mutation does not recreate the report',!hidden);
   await s.page.evaluate(()=>go('costs'));await s.page.waitForSelector('#pane-costs #align1055',{state:'attached',timeout:20000});
   check(kind+' return to Costs restores same current report',hash(normalize(await s.page.locator('#pane-costs #align1055').textContent()))===visibleHash);
   check(kind+' every native document unchanged',docs===await s.page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))));
   check(kind+' no runtime or console errors or HTTP writes',!s.errors.length&&!s.consoleErrors.length&&!s.counts.blocked);
   results[kind]={baseline:s.baseline,before,hiddenAfterMutation:hidden,visibleHash};
  }finally{await s.browser.close();}
 }
 check('Deferred first report exactly matches the original report',results.base.visibleHash===results.candidate.visibleHash);
 results.passed=results.checks.filter(c=>c.ok).length;results.failed=results.checks.filter(c=>!c.ok).length;
 fs.writeFileSync(process.env.OUT+'/alignment-browser.json',JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.passed,failed:results.failed}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
