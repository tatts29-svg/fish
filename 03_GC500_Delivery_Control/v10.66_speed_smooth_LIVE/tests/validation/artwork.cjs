/* Author: Andrew Fisher. Real-browser deferred Build artwork demand/reveal checks; operational writes stay blocked. */
'use strict';
const C=require('./common.cjs');const [pageFile,outFile]=process.argv.slice(2);
if(!pageFile||!outFile)throw new Error('Usage: node artwork.cjs candidate.html private-output.json');
(async()=>{
 const mobile=process.env.MOB==='1',out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),mobile,cases:[]};let s;
 const check=(label,pass,detail={})=>{out.cases.push({label,pass:!!pass,...detail});if(!pass)throw new Error(label);};
 const report=()=>s.page.evaluate(()=>{
  const pane=document.querySelector('#pane-timeline'),strip=pane?.querySelector('.daystrip');
  const clip=strip?.getBoundingClientRect(),slots=[...pane.querySelectorAll('[data-bc1066-sky]')];
  const visible=slots.filter(el=>{const r=el.getBoundingClientRect();return !!(r.width&&r.height&&clip&&r.right>Math.max(0,clip.left)&&r.left<Math.min(innerWidth,clip.right)&&r.bottom>Math.max(0,clip.top)&&r.top<Math.min(innerHeight,clip.bottom));});
  const selected=[...pane.querySelectorAll('.bc984-day.on [data-bc1066-sky]')];
  return {tab:state.tab,refresh:document.documentElement.getAttribute('data-refresh904'),slotCount:slots.length,readyCount:slots.filter(x=>x.dataset.bc1066Ready==='true').length,visibleCount:visible.length,visibleReady:visible.every(x=>x.dataset.bc1066Ready==='true'),selectedCount:selected.length,selectedReady:selected.every(x=>x.dataset.bc1066Ready==='true'),left:strip.scrollLeft,max:strip.scrollWidth-strip.clientWidth};
 });
 const waitVisible=()=>s.page.waitForFunction(()=>{const strip=document.querySelector('#pane-timeline .daystrip');if(!strip)return false;const c=strip.getBoundingClientRect();return [...strip.querySelectorAll('[data-bc1066-sky]')].every(el=>{const r=el.getBoundingClientRect();const visible=r.width&&r.height&&r.right>Math.max(0,c.left)&&r.left<Math.min(innerWidth,c.right)&&r.bottom>Math.max(0,c.top)&&r.top<Math.min(innerHeight,c.bottom);return !visible||el.dataset.bc1066Ready==='true';});},null,{timeout:10000,polling:50});
 // Only the explicitly decorative aria-hidden scene is excluded here. Complete pane parity remains stricter.
 const facts=()=>s.page.evaluate(()=>[...document.querySelectorAll('#pane-timeline .bc984-day')].map(card=>{const clone=card.cloneNode(true);clone.querySelectorAll('.wm-card-scene[aria-hidden="true"]').forEach(x=>x.remove());return {day:card.dataset.day,text:clone.textContent,aria:card.getAttribute('aria-label')};}));
 try{
  s=await C.launch({pageFile,mobile,hash:'#timeline'});await C.ready(s);await C.settled(s.page,1500);
  let r=await report();check('cold Timeline reveal finishes selected and visible artwork',r.tab==='timeline'&&r.refresh==='ready'&&r.slotCount>0&&r.selectedCount>0&&r.selectedReady&&r.visibleReady,r);
  const storage=await s.page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await C.materializeBuild(s.page);const beforeFacts=await facts();
  await s.page.evaluate(()=>document.querySelector('#pane-timeline .daystrip').scrollIntoView({block:'center',behavior:'instant'}));
  for(const fraction of [0,.25,.5,.75,1]){
   await s.page.evaluate(f=>{const el=document.querySelector('#pane-timeline .daystrip');el.scrollLeft=(el.scrollWidth-el.clientWidth)*f;},fraction);
   await s.page.waitForTimeout(100);await waitVisible();r=await report();check('swipe demand '+fraction,r.visibleCount>0&&r.visibleReady,{visibleCount:r.visibleCount,readyCount:r.readyCount});
  }
  const beforeRefresh=await report();await s.page.evaluate(()=>render());await C.settled(s.page,1500);await waitVisible();r=await report();
  check('background redraw keeps far swipe and fills restored viewport',Math.abs(r.left-beforeRefresh.left)<2&&r.visibleCount>0&&r.visibleReady,{before:beforeRefresh.left,after:r.left});
  await C.materializeBuild(s.page);check('swipe and redraw retain all card facts',JSON.stringify(beforeFacts)===JSON.stringify(await facts()));
  const focus=await s.page.evaluate(async()=>{const cards=[...document.querySelectorAll('#pane-timeline .bc984-day')],card=cards[0];card.focus();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {focused:document.activeElement===card,ready:[...card.querySelectorAll('[data-bc1066-sky]')].every(x=>x.dataset.bc1066Ready==='true')};});
  check('keyboard-focus target has artwork immediately',focus.focused&&focus.ready,focus);
  const printed=await s.page.evaluate(()=>{dispatchEvent(new Event('beforeprint'));return [...document.querySelectorAll('#pane-timeline [data-bc1066-sky]')].map(el=>({ready:el.dataset.bc1066Ready,html:el.innerHTML}));});
  check('beforeprint fills every card scene',printed.length===r.slotCount&&printed.every(x=>x.ready==='true'),{count:printed.length});
  const repeated=await s.page.evaluate(()=>{dispatchEvent(new Event('beforeprint'));return [...document.querySelectorAll('#pane-timeline [data-bc1066-sky]')].map(el=>({ready:el.dataset.bc1066Ready,html:el.innerHTML}));});
  check('repeated print preparation does not duplicate artwork',JSON.stringify(printed)===JSON.stringify(repeated));await s.page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  check('print preparation retains all card facts',JSON.stringify(beforeFacts)===JSON.stringify(await facts()));C.assertClean(s);await s.browser.close();s=null;
  // A genuine delayed live reply exercises Refresh904's saved-copy reveal before normal ready reveal.
  C.fixture.delayMs=30000;C.fixture.delayRemaining=1;
  s=await C.launch({pageFile,mobile,hash:'#timeline',init:`Object.entries(${JSON.stringify(storage)}).forEach(([k,v])=>localStorage.setItem(k,v));`});
  await s.page.waitForFunction(()=>document.documentElement.getAttribute('data-refresh904')==='saved',null,{timeout:60000,polling:100});await waitVisible();r=await report();
  check('saved-copy reveal fills selected and visible artwork',r.tab==='timeline'&&r.refresh==='saved'&&r.selectedCount>0&&r.selectedReady&&r.visibleReady,r);
  await C.ready(s);await C.settled(s.page,1500);await waitVisible();r=await report();check('delayed record recovery preserves Timeline artwork',r.tab==='timeline'&&r.refresh==='ready'&&r.selectedReady&&r.visibleReady,r);C.assertClean(s);out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);if(s)out.health=C.errorsOf(s);process.exitCode=1;}
 finally{C.fixture.delayRemaining=0;if(s)await s.browser.close();C.writePrivate(outFile,out);}
 console.log(JSON.stringify({pass:out.pass,mobile,checks:out.cases.length,error:out.error?.split('\n')[0]}));
})();
