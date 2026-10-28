/* Author: Andrew Fisher. Read-only phone read-back of the changed financial explanations. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
(async()=>{
 assert(process.env.PAGE&&process.env.STATE&&process.env.OUT,'PAGE, frozen STATE and private OUT required');
 process.env.MOB='1';const s=await openCandidate(),evidence={baseline:s.baseline};
 try{
  for(const kind of ['water','labour']){
   evidence[kind]=await s.page.evaluate(kind=>{
    const pane=document.getElementById('pane-costs');
    let element;
    if(kind==='water')element=[...pane.querySelectorAll('h4')].find(e=>e.textContent.includes('water included in pump-out charges'));
    else {const walker=document.createTreeWalker(pane,NodeFilter.SHOW_TEXT);let text;while(text=walker.nextNode())if(text.textContent.includes('FWF uses the approved combined install and demob amount')){element=text.parentElement;break;}}
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
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  evidence.errors=s.errors;evidence.consoleErrors=s.consoleErrors;evidence.writeAttempts=s.counts.blocked;
  fs.writeFileSync(path.join(process.env.OUT,'financial44-ui.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('PASS changed water and combined-FWF explanations visible on phone; zero runtime/console errors or writes');
 }finally{await s.browser.close();}
})().catch(error=>{console.error('FAIL financial UI read-back: '+error.stack);process.exitCode=1;});
