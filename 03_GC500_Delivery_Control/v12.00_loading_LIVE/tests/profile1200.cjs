/* Author: Andrew Fisher. Read-only timing and CPU attribution; no record content in output. */
const fs=require('fs'),{open}=require('../../toolchain/harness/open_page');
const init=`(()=>{const P=window.__speed1200={long:[],frames:[],marks:{}};
new PerformanceObserver(l=>l.getEntries().forEach(e=>P.long.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true});
try{new PerformanceObserver(l=>l.getEntries().forEach(e=>P.frames.push({duration:e.duration,blocking:e.blockingDuration,scripts:e.scripts.map(s=>({name:s.sourceFunctionName,invoker:s.invoker,position:s.sourceCharPosition,duration:s.duration,forced:s.forcedStyleAndLayoutDuration}))}))).observe({type:'long-animation-frame',buffered:true});}catch(e){}
document.addEventListener('DOMContentLoaded',()=>P.marks.dom=performance.now());addEventListener('load',()=>P.marks.load=performance.now());})();`;
(async()=>{const mobile=process.env.MOB==='1',out=process.env.OUT,h=await open({pageFile:process.env.PAGE,init,cpu:+(process.env.CPU||4),mobile,W:mobile?390:1440,H:mobile?844:900,dpr:mobile?3:1}),p=h.page;
const result={author:'Andrew Fisher',mobile,cpu:+(process.env.CPU||4),tabs:[],queries:[]};
try{await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});await p.waitForTimeout(2000);
result.start=await p.evaluate(()=>({marks:__speed1200.marks,paint:performance.getEntriesByType('paint').map(e=>({name:e.name,time:e.startTime})),long:__speed1200.long,frames:__speed1200.frames,nodes:document.getElementsByTagName('*').length}));
const cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
for(const tab of ['today','plant','docs','fencing','costs','timeline']){
 result.tabs.push(await p.evaluate(async tab=>{const t=performance.now();go(tab);const sync=performance.now()-t;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {tab,syncMs:sync,paintMs:performance.now()-t,nodes:document.getElementsByTagName('*').length};},tab));await p.waitForTimeout(400);
}
await p.evaluate(()=>go('today'));
for(const query of ['fencing','showcase','pre-start','servicing','delivery'])result.queries.push(await p.evaluate(q=>{const t=performance.now();let n;for(let i=0;i<3;i++)n=holdAssets(()=>finderMatches(q)).length;return {query:q,averageMs:(performance.now()-t)/3,matches:n};},query));
const {profile}=await cdp.send('Profiler.stop');if(out)fs.writeFileSync(out+'.cpuprofile',JSON.stringify(profile));
const nodes=new Map(profile.nodes.map(n=>[n.id,n])),self=new Map();for(let i=0;i<(profile.samples||[]).length;i++)self.set(profile.samples[i],(self.get(profile.samples[i])||0)+(profile.timeDeltas[i]||0));
result.cpuTop=[...self].map(([id,us])=>({name:nodes.get(id)?.callFrame.functionName,line:nodes.get(id)?.callFrame.lineNumber,ms:Math.round(us/1000)})).sort((a,b)=>b.ms-a.ms).slice(0,30);
result.errors=h.errors;result.attemptedWrites=h.counts.blocked;
}finally{await h.browser.close();}
if(out)fs.writeFileSync(out+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));process.exit(result.errors.length||result.attemptedWrites?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
