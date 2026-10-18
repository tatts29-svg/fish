/* Author: Andrew Fisher. Bounded recapture of Today/progress after evidence-timing corrections. */
'use strict';
const C=require('./common.cjs'),[pageFile,outFile]=process.argv.slice(2);
if(!pageFile||!outFile)throw new Error('Usage: node focus.cjs page.html private-output.json');
(async()=>{
 const mobile=process.env.MOB==='1',out={author:'Andrew Fisher',method:'settled-native-screen-report-v1',pageSha256:C.sha(C.fs.readFileSync(pageFile)),clock:C.CLOCK_ISO,mobile,panes:{},contexts:{}};let s;
 try{
  s=await C.launch({pageFile,mobile});const p=s.page;await C.ready(s);await C.settled(p,1500);
  out.version=await p.evaluate(()=>SYNC.db.readVersion821());
  await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);const primed=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);const record=await p.evaluate(()=>JSON.stringify(S));
  const merge=await C.mergeReport(p);if(!merge.complete||C.recordDelta(JSON.parse(primed),JSON.parse(record)).length)throw new Error('Focused fixture is incomplete or unstable');
  out.recordSha256=C.sha(JSON.stringify(C.canonicalRecord(JSON.parse(record))));
  for(const tab of ['today','progress']){await p.evaluate(tab=>go(tab),tab);await C.settled(p,1300);out.panes[tab]=await C.capturePane(p,tab);out.contexts[tab]=await p.evaluate(()=>({actualTab:state.tab,parent:document.getElementById('pane-progress')?.parentElement?.id,reportCount:document.querySelectorAll('#pane-progress section.wip').length}));}
  if(C.recordDelta(JSON.parse(record),JSON.parse(await p.evaluate(()=>JSON.stringify(S)))).length)throw new Error('Focused capture changed the record');
  out.health=C.errorsOf(s);C.assertClean(s);out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);if(s)out.health=C.errorsOf(s);process.exitCode=1;}
 finally{if(s)await s.browser.close();C.writePrivate(outFile,out);}
 console.log(JSON.stringify({pass:out.pass,mobile,pageSha256:out.pageSha256,error:out.error?.split('\n')[0]}));
})();
