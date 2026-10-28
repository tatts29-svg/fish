/* Author: Andrew Fisher. Read-only phone read-back of the changed financial explanations. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
(async()=>{
 assert(process.env.PAGE&&process.env.STATE&&process.env.OUT,'PAGE, frozen STATE and private OUT required');
 process.env.MOB='1';const s=await openCandidate(),evidence={baseline:s.baseline};
 try{
  for(const kind of ['water','labour','partial']){
   evidence[kind]=await s.page.evaluate(kind=>{
    const pane=document.getElementById('pane-costs');
    let element;
    if(kind==='water')element=[...pane.querySelectorAll('h4')].find(e=>e.textContent.includes('water included in pump-out charges'));
    else {const walker=document.createTreeWalker(pane,NodeFilter.SHOW_TEXT);let text;while(text=walker.nextNode())if(kind==='labour'?text.textContent.includes('FWF uses the approved combined install and demob amount'):/demob.*\(partial\)/.test(text.textContent)){element=text.parentElement;break;}}
    if(!element)throw Error('Changed financial explanation not rendered: '+kind);
    for(let p=element;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
    element.scrollIntoView({block:'start',behavior:'instant'});
    return {text:element.textContent,following:element.nextElementSibling?.textContent||'',visible:!!element.getBoundingClientRect().width};
   },kind);
   await s.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await s.page.screenshot({path:path.join(process.env.OUT,'financial44-'+kind+'-phone.png')});
   assert(evidence[kind].visible,'Changed explanation is visible: '+kind);
  }
  assert(/included in pump-out charges/i.test(evidence.water.text));
  assert(/approved combined install and demob amount/.test(evidence.labour.text));
  assert(/no separate split is supplied/.test(evidence.labour.text));
  assert(/demob.*\(partial\)/.test(evidence.partial.text));
  evidence.inputs=await s.page.evaluate(()=>holdAssets(()=>{
   const before=JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),old=window.capability;
   let html;try{window.capability=()=> 'edit';html=card748Html();}finally{window.capability=old;}
   const template=document.createElement('template');template.innerHTML=html;
   const keys=new Set(servicing748().at_cost.filter(l=>l.included1244).map(l=>l.key)),inputs=[...template.content.querySelectorAll('[data-lr748]')].map(e=>e.getAttribute('data-lr748'));
   const adjusted=servicing748().lines.filter(l=>l.baseplan12416).map(l=>({label:CustomerWater1244.description(l,fmtNum),rendered:template.content.textContent.includes(CustomerWater1244.description(l,fmtNum))}));
   return {includedWaterLines:keys.size,ineffectiveWaterInputs:inputs.filter(k=>keys.has(k)).length,otherServiceInputs:inputs.filter(k=>k.startsWith('service|')&&!keys.has(k)).length,adjusted,sourceDocumentsUnchanged:before===JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))};
  }));
  assert.equal(evidence.inputs.includedWaterLines,4);assert.equal(evidence.inputs.ineffectiveWaterInputs,0);assert(evidence.inputs.otherServiceInputs>0);assert(evidence.inputs.sourceDocumentsUnchanged);
  assert(evidence.inputs.adjusted.length>0);assert(evidence.inputs.adjusted.every(x=>x.rendered&&/customer charge: .* services \(Baseplan\); site record: .* services/.test(x.label)));
  if(process.env.MODEL_BASELINE){
   const expected=JSON.parse(fs.readFileSync(process.env.MODEL_BASELINE,'utf8')).candidate;
   const actual=await s.page.evaluate(()=>holdAssets(()=>{RENDER_MEMO.clear();HELD_MEMO.clear();const M=moneySummary(),P=pl770Model();return JSON.parse(JSON.stringify({customer:M.charge,direct:M.cost,ledger:{now:P.revNow,job:P.revJob,costNow:P.costNow,costJob:P.costJob},supplier:servicing748().supplier1068,service:servicing748(),docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))}));}));
   for(const key of Object.keys(actual))assert.deepEqual(actual[key],expected[key],'Display-only correction preserves '+key);
   evidence.modelPreservation={fields:Object.keys(actual),unchanged:true};
  }
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  evidence.errors=s.errors;evidence.consoleErrors=s.consoleErrors;evidence.writeAttempts=s.counts.blocked;
  fs.writeFileSync(path.join(process.env.OUT,'financial44-ui.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('PASS changed water, combined-FWF and partial-demob explanations visible on phone; ineffective water inputs absent from edit rendering; source documents unchanged; zero runtime/console errors or writes');
 }finally{await s.browser.close();}
})().catch(error=>{console.error('FAIL financial UI read-back: '+error.stack);process.exitCode=1;});
