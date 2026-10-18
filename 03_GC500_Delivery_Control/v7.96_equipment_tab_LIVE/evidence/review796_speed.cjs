// Author: Andrew Fisher. Paired six-sample read-only navigation benchmark. Only one browser renders at a time.
const fs=require('fs'),crypto=require('crypto'); const {open}=require('../../toolchain/harness/open_page');
(async()=>{const result={author:'Andrew Fisher',method:'6 synchronous go() samples per tab, reduced motion, one browser at a time',runs:[]};
for(const[tag,file]of [['base',process.env.BASE],['candidate',process.env.PAGE]]){
 const h=await open({pageFile:file,W:1440,H:900,gl:false}),p=h.page;try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await p.emulateMedia({reducedMotion:'reduce'});
 const samples=await p.evaluate(async()=>{const out={};for(const t of ['today','plant']){out[t]=[];for(let i=0;i<6;i++){go('timeline');await new Promise(r=>setTimeout(r,500));const a=performance.now();go(t);out[t].push(performance.now()-a);await new Promise(r=>setTimeout(r,700));}}return out;});
 const metrics={};for(const[t,v]of Object.entries(samples)){const n=v.slice().sort((a,b)=>a-b);metrics[t]={medianMs:+((n[2]+n[3])/2).toFixed(1),samplesMs:v.map(x=>+x.toFixed(1))};}
 result.runs.push({tag,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),metrics,errors:h.errors});
 }finally{await h.browser.close();}}
 fs.writeFileSync(__dirname+'/review796_speed.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
