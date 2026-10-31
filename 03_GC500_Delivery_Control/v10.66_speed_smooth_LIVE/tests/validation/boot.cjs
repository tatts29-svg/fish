/* Author: Andrew Fisher. Candidate boot/route/saved-copy/recovery/scroll regression checks. All writes are blocked. */
'use strict';
const C=require('./common.cjs'); const [pageFile,outFile]=process.argv.slice(2);
if(!pageFile||!outFile)throw new Error('Usage: node boot.cjs candidate.html private-output.json');
(async()=>{
 const mobile=process.env.MOB==='1',out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),mobile,cases:[]};
 let s;
 const check=(label,pass,detail={})=>{out.cases.push({label,pass:!!pass,...detail});console.log(JSON.stringify({phase:'boot',mobile,label,pass:!!pass}));if(!pass)throw new Error(label);};
 const snap=()=>s.page.evaluate(()=>({tab:state.tab,hash:location.hash,selected:document.querySelector('#tabs [aria-selected="true"]')?.dataset.tab||document.querySelector('#mmViews [aria-current="page"]')?.dataset.goto,refresh:document.documentElement.getAttribute('data-refresh904'),sync:SYNC.status,version:SYNC.db?.readVersion821(),states:window.__validation.states,visible:!!document.querySelector('#pane-'+state.tab)?.getClientRects().length}));
 try{
  for(const tab of ['today','timeline','map','costs']){
   s=await C.launch({pageFile,mobile,hash:'#'+tab});await C.ready(s);await C.settled(s.page,1500);
   const a=await snap();check('cold route '+tab,a.tab===tab&&a.selected===tab&&a.visible&&a.refresh==='ready',{states:a.states.map(x=>x[1])});
   const merge=await C.mergeReport(s.page);check('cold initial collections merged without manual redelivery '+tab,merge.complete,merge);
   const initialRecord=await s.page.evaluate(()=>JSON.stringify(S));await s.page.evaluate(()=>SYNC.backend.redeliver());await C.settled(s.page,1300);
   const initialChanges=C.recordDelta(JSON.parse(initialRecord),JSON.parse(await s.page.evaluate(()=>JSON.stringify(S))));
   check('first redelivery proves cold record was already complete '+tab,initialChanges.length===0,{changes:initialChanges});
   C.assertClean(s);await s.browser.close();s=null;
  }
  // No hash is the intentional v10.66 route correction: the first selected tab and final pane must be Today.
  s=await C.launch({pageFile,mobile,hash:''});await C.ready(s);await C.settled(s.page,1800);
  let a=await snap();check('empty hash opens Today',a.tab==='today'&&a.selected==='today'&&a.visible);
  const initialMerge=await C.mergeReport(s.page);check('empty-hash initial collections merged without manual redelivery',initialMerge.complete,initialMerge);
  if(mobile)await s.page.screenshot({path:C.path.join(C.path.dirname(C.path.resolve(outFile)),'v1066-boot-phone.png'),fullPage:false});
  const storage=await s.page.evaluate(()=>Object.fromEntries(Object.entries(localStorage))); // kept in memory only
  const beforeRecord=await s.page.evaluate(()=>JSON.stringify(S));
  await s.page.evaluate(()=>SYNC.backend.redeliver());await C.settled(s.page,1000);
  const initialChanges=C.recordDelta(JSON.parse(beforeRecord),JSON.parse(await s.page.evaluate(()=>JSON.stringify(S))));
  check('same-record redelivery unchanged',initialChanges.length===0,{changes:initialChanges});
  await s.page.evaluate(()=>go('timeline'));await C.settled(s.page,1800);
  const swipe=await s.page.evaluate(async()=>{const strip=document.querySelector('#pane-timeline .daystrip');if(!strip)throw new Error('Build strip missing');const max=strip.scrollWidth-strip.clientWidth;if(max<1)return {available:false};strip.scrollLeft=Math.min(max,Math.max(80,max/3));await new Promise(r=>setTimeout(r,100));const before=strip.scrollLeft;render();await new Promise(r=>setTimeout(r,1000));return {available:true,before,after:document.querySelector('#pane-timeline .daystrip').scrollLeft};});
  check('Build strip keeps swiped place',swipe.available&&Math.abs(swipe.before-swipe.after)<2,{swipe});
  C.assertClean(s);await s.browser.close();s=null;
  // Hold the first record long enough for a genuine 12 seconds of waiting; it must recover after the response.
  C.fixture.delayMs=30000;C.fixture.delayRemaining=1;
  s=await C.launch({pageFile,mobile,hash:'#today',init:`Object.entries(${JSON.stringify(storage)}).forEach(([k,v])=>localStorage.setItem(k,v));`});
  await C.ready(s);await C.settled(s.page,1600);a=await snap();
  check('delayed record reaches ready',a.sync==='live'&&a.refresh==='ready'&&a.tab==='today');
  check('genuine wait exposes saved copy',a.states.some(x=>x[1]==='saved'),{states:a.states.map(x=>x[1])});
  C.assertClean(s);await s.browser.close();s=null;
  C.fixture.offline=true;
  s=await C.launch({pageFile,mobile,hash:'#today',init:`Object.entries(${JSON.stringify(storage)}).forEach(([k,v])=>localStorage.setItem(k,v));`});
  await s.page.waitForFunction(()=>document.documentElement.getAttribute('data-refresh904')==='saved'&&SYNC.status==='unreachable',null,{timeout:60000,polling:250});
  a=await snap();check('offline cached page remains visible and labelled',a.visible&&a.refresh==='saved'&&a.sync==='unreachable');
  C.fixture.offline=false;await s.page.evaluate(()=>SYNC.backend.pull(true));await C.ready(s);await C.settled(s.page,1500);a=await snap();
  check('offline recovery reaches live without wrong route',a.tab==='today'&&a.visible&&a.sync==='live'&&a.refresh==='ready');
  // Expected 503s are intentional in this case; keep their count visible, reject all other console/page errors.
  const errors=C.errorsOf(s),unexpected=errors.consoleErrors.filter(x=>!/^Failed to load resource: the server responded with a status of 503/.test(x));
  check('offline test has no unexpected errors or writes',!errors.pageErrors.length&&!unexpected.length&&!errors.blocked&&!errors.missingFixture.length,{expected503ConsoleErrors:errors.consoleErrors.length-unexpected.length,health:{...errors,consoleErrors:unexpected}});
  out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);if(s)out.health=C.errorsOf(s);process.exitCode=1;}
 finally{C.fixture.offline=false;if(s)await s.browser.close();C.writePrivate(outFile,out);}
 console.log(JSON.stringify({pass:out.pass,mobile,checks:out.cases.length,error:out.error?.split('\n')[0]}));
})();
