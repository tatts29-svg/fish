/* Author: Andrew Fisher. Diagnostic CPU profiles for real Build/Today navigation; GET-only. */
'use strict';
const C=require('./common.cjs');const [pageFile,outPrefix]=process.argv.slice(2);
if(!pageFile||!outPrefix)throw new Error('Usage: node profile.cjs candidate.html /private/profile-prefix');
function summary(profile){
 const nodes=new Map(profile.nodes.map(n=>[n.id,{...n,self:0,total:0}]));
 for(let i=0;i<(profile.samples||[]).length;i++){const node=nodes.get(profile.samples[i]);if(node)node.self+=(profile.timeDeltas?.[i]||0)/1000;}
 const total=id=>{const n=nodes.get(id);n.total=n.self+(n.children||[]).reduce((s,c)=>s+total(c),0);return n.total;};total(profile.nodes[0].id);
 const shape=n=>({name:n.callFrame.functionName||'(anonymous)',line:n.callFrame.lineNumber+1,column:n.callFrame.columnNumber+1,selfMs:Math.round(n.self),inclusiveMs:Math.round(n.total),script:n.callFrame.scriptId});
 return {durationMs:(profile.endTime-profile.startTime)/1000,self:[...nodes.values()].sort((a,b)=>b.self-a.self).slice(0,30).map(shape),inclusive:[...nodes.values()].filter(n=>n.callFrame.functionName&&!/^\(/.test(n.callFrame.functionName)).sort((a,b)=>b.total-a.total).slice(0,30).map(shape)};
}
(async()=>{
 const mobile=process.env.MOB==='1',cpu=Number(process.env.CPU||1),s=await C.launch({pageFile,mobile,cpu,freezeClock:false}),p=s.page;
 const out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),mobile,cpu,profiles:[]};
 try{
  await C.ready(s);await p.waitForTimeout(4000);
  const cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
  for(const tab of ['timeline','today']){
   await cdp.send('Profiler.start');
   const transition=await p.evaluate(async tab=>{const start=performance.now();document.querySelector('#tabs [data-tab="'+tab+'"]').click();while(performance.now()-start<90000){if(state.tab===tab&&!document.getElementById('pane-'+tab).hidden&&!document.querySelector('#tabs [data-tab="'+tab+'"]').classList.contains('busy'))break;await new Promise(r=>setTimeout(r,20));}await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {correct:state.tab===tab,completeMs:performance.now()-start};},tab);
   await p.waitForTimeout(1500);const profile=(await cdp.send('Profiler.stop')).profile;
   C.writePrivate(outPrefix+'-'+tab+'.cpuprofile',profile);const result={tab,transition,...summary(profile)};out.profiles.push(result);console.log(JSON.stringify({phase:'profile',tab,transition,top:result.self.slice(0,8)}));
   await p.waitForTimeout(1000);
  }
  out.health=C.errorsOf(s);C.assertClean(s);out.pass=out.profiles.every(x=>x.transition.correct);
 }catch(error){out.pass=false;out.error=String(error.stack||error);out.health=C.errorsOf(s);process.exitCode=1;}
 finally{C.writePrivate(outPrefix+'.json',out);await s.browser.close();}
})();
