/* Author: Andrew Fisher. Reproducible read-only load/tab/day/idle measurement, one page per invocation. */
'use strict';
const C=require('./common.cjs'); const [pageFile,outFile]=process.argv.slice(2);
if(!pageFile||!outFile)throw new Error('Usage: node performance.cjs page.html private-output.json');
const mobile=process.env.MOB==='1',cpu=Number(process.env.CPU||1),idleSeconds=Number(process.env.IDLE_SECONDS||60);
const mode=process.env.PERF_MODE||'all'; if(!['all','load','idle'].includes(mode))throw new Error('PERF_MODE must be all, load or idle');
(async()=>{
 const s=await C.launch({pageFile,mobile,cpu,hash:'#today',freezeClock:false}),p=s.page;
 const out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),mobile,cpu,mode,idleSeconds,tabs:[],idle:[]};
 const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable',{timeDomain:'timeTicks'});
 const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
 async function navigate(tab){
  return p.evaluate(async tab=>{const P=window.__validation,start=performance.now(),li=P.lt.length,si=P.ls.length;let firstFrame=null;
   const button=document.querySelector('#tabs [data-tab="'+tab+'"]');if(!button)throw new Error('Missing tab button '+tab);
   button.click();const busySetMs=performance.now()-start,busy=button.classList.contains('busy');requestAnimationFrame(()=>{firstFrame=performance.now()-start;});
   const artworkReady=()=>[...document.querySelectorAll('#pane-'+tab+' [data-bc1066-sky]')].every(el=>{const r=el.getBoundingClientRect();return !(r.width&&r.height&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0)||el.dataset.bc1066Ready==='true';});
   const deadline=start+90000;while(performance.now()<deadline){const liveButton=document.querySelector('#tabs [data-tab="'+tab+'"]');if(state.tab===tab&&!document.getElementById('pane-'+tab).hidden&&!liveButton?.classList.contains('busy')&&artworkReady())break;await new Promise(r=>setTimeout(r,20));}
   if(performance.now()>=deadline)throw new Error('Tab did not finish its visible content: '+tab);
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const completedMs=performance.now()-start;
   await new Promise(r=>setTimeout(r,1000));
   return {tab,busy,busySetMs,feedbackFrameOpportunityMs:firstFrame,completedMs,visibleArtworkReady:artworkReady(),correct:state.tab===tab&&!document.getElementById('pane-'+tab).hidden&&artworkReady(),cls:P.ls.slice(si).filter(x=>!x[2]).reduce((a,x)=>a+x[1],0),layoutMovement:P.ls.slice(si).reduce((a,x)=>a+x[1],0),maxLongTaskMs:Math.max(0,...P.lt.slice(li).map(x=>x[1]))};
  },tab);
 }
 try{
  await C.ready(s);console.log(JSON.stringify({phase:'record-ready',at:await p.evaluate(()=>performance.now())}));await p.waitForTimeout(5000);
  out.load=await p.evaluate(()=>{const P=window.__validation,usable=P.usable,post=P.lt.filter(x=>usable!=null&&x[0]>=usable);return {usableMs:usable,marks:P.marks,states:P.states,cls:P.ls.filter(x=>!x[2]).reduce((a,x)=>a+x[1],0),maxLongTaskMs:Math.max(0,...P.lt.map(x=>x[1])),postUsableMaxLongTaskMs:Math.max(0,...post.map(x=>x[1])),postUsableLongTasks:post.length,route:state.tab,recordVersion:SYNC.db.readVersion821()};});
  if(mode!=='idle'){
   for(const tab of ['timeline','today','plant','map','timeline']){out.tabs.push(await navigate(tab));console.log(JSON.stringify({phase:'tab',tab,completedMs:out.tabs.at(-1).completedMs}));await p.waitForTimeout(1500);}
   out.day=await p.evaluate(async()=>{const choices=[...document.querySelectorAll('#pane-timeline .bc984-day')],current=state.day;const b=choices.find(x=>x.dataset.day!==current);if(!b)throw new Error('No alternate Build day');const chosen=b.dataset.day,start=performance.now();b.click();
    const ready=()=>{const selected=document.querySelector('#pane-timeline .bc984-day.on');return state.day===chosen&&selected?.dataset.day===chosen&&[...selected.querySelectorAll('[data-bc1066-sky]')].every(el=>el.dataset.bc1066Ready==='true');};
    while(!ready()&&performance.now()-start<90000)await new Promise(r=>setTimeout(r,20));if(!ready())throw new Error('Build day did not finish selected content');
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {completeMs:performance.now()-start,selectedReady:ready()};});
  }
  if(mode!=='load')for(const tab of ['today','timeline','map']){
   await p.evaluate(tab=>go(tab),tab);await p.waitForTimeout(10000);
   const before=await metrics(),index=await p.evaluate(()=>window.__validation.lt.length),start=Date.now();await p.waitForTimeout(idleSeconds*1000);const elapsedMs=Date.now()-start,after=await metrics();
   const taskSeconds=after.TaskDuration-before.TaskDuration;
   const longTasks=await p.evaluate(index=>window.__validation.lt.slice(index),index);
   out.idle.push({tab,elapsedMs,taskSeconds,busyPercent:100*taskSeconds/(elapsedMs/1000),scriptSeconds:after.ScriptDuration-before.ScriptDuration,layoutSeconds:after.LayoutDuration-before.LayoutDuration,longTaskCount:longTasks.length,maxLongTaskMs:Math.max(0,...longTasks.map(x=>x[1]))});
  }
  out.health=C.errorsOf(s);C.assertClean(s);out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);out.health=C.errorsOf(s);process.exitCode=1;}
 finally{C.writePrivate(outFile,out);await s.browser.close();}
 // This is measurement success, not a claim that all aspirational performance targets passed.
 console.log(JSON.stringify({pass:out.pass,mobile,cpu,mode,usableMs:out.load?.usableMs,cls:out.load?.cls,tabMs:out.tabs.map(x=>[x.tab,Math.round(x.completedMs)]),idlePercent:out.idle.map(x=>[x.tab,x.busyPercent]),error:out.error?.split('\n')[0]}));
})();
