/* Author: Andrew Fisher. Read-only, source-bound timings; tab and search response. */
const fs=require('fs'),crypto=require('crypto'),{open}=require('../../toolchain/harness/open_page');
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
const init=`(()=>{const P=window.__speed1200={long:[],marks:{}};
new PerformanceObserver(l=>l.getEntries().forEach(e=>P.long.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true});
document.addEventListener('DOMContentLoaded',()=>P.marks.dom=performance.now());addEventListener('load',()=>P.marks.load=performance.now());
const watch=()=>{if(typeof SYNC!=='undefined'&&SYNC.status==='live'&&!P.marks.live)P.marks.live=performance.now();if(!P.marks.live)setTimeout(watch,50);};setTimeout(watch,0);})();`;
(async()=>{const source=hash(),cpu=+(process.env.CPU||1),mobile=process.env.MOB!=='0';
const h=await open({pageFile:process.env.PAGE,init,cpu,mobile,W:mobile?390:1440,H:mobile?844:900,dpr:mobile?3:1}),p=h.page;
const result={author:'Andrew Fisher',source,cpu,mobile,tabs:[],queries:[]};
try{console.error('Loaded');await p.waitForFunction(()=>SYNC.status==='live',null,{timeout:180000});await p.waitForTimeout(1000);
result.start=await p.evaluate(()=>({marks:__speed1200.marks,paint:performance.getEntriesByType('paint').map(e=>({name:e.name,time:e.startTime})),long:__speed1200.long,explorer:!!document.getElementById('expFrame'),release:document.getElementById('footR')?.textContent.match(/v\d+\.\d+/)?.[0]}));
let cdp;if(process.env.PROFILE){cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
for(const tab of (process.env.TABS||'today,docs,costs').split(',')){
 result.tabs.push(await p.evaluate(async tab=>{const t=performance.now();go(tab);const sync=performance.now()-t;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {tab,syncMs:sync,paintMs:performance.now()-t};},tab));console.error('Measured '+tab);await p.waitForTimeout(500);
}
for(const q of ['fencing','showcase','pre-start','servicing','delivery'])result.queries.push(await p.evaluate(q=>{const t=performance.now(),matches=holdAssets(()=>finderMatches(q));return {query:q,ms:performance.now()-t,count:matches.length};},q));
if(cdp){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(process.env.PROFILE,JSON.stringify(profile));}
result.errors=h.errors;result.attemptedWrites=h.counts.blocked;
result.sourceUnchanged=hash()===source;
}finally{await h.browser.close();}
console.log(JSON.stringify(result,null,2));process.exit(!result.sourceUnchanged||result.errors.length||result.attemptedWrites?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
