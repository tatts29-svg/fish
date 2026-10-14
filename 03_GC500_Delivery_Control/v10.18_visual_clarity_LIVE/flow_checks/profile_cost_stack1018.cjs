/* Author: Andrew Fisher. Isolated call-stack diagnostic; never changes service records. */
'use strict';const fs=require('fs'),path=require('path');const{open}=require('../map/tests/readonly1018.cjs');
(async()=>{let h;try{h=await open({pageFile:process.env.PAGE,W:1440,H:1000});const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});await p.evaluate(()=>go('about'));
const report=await p.evaluate(()=>{const before=JSON.stringify(S),original=allCosts,stacks=[],thrown={},depths=new Set();let depth=0,maxDepth=0,calls=0;
 allCosts=function(){depth++;calls++;maxDepth=Math.max(maxDepth,depth);if([1,2,3,10,100].includes(depth)&&!depths.has(depth)){depths.add(depth);stacks.push({depth,stack:new Error().stack});}try{return original.apply(this,arguments);}catch(e){thrown[e.name]=(thrown[e.name]||0)+1;throw e;}finally{depth--;}};
 let milliseconds;try{const start=performance.now();go('costs');milliseconds=performance.now()-start;}finally{allCosts=original;}
 return {author:'Andrew Fisher',calls,maxDepth,stacks,thrown,milliseconds:Math.round(milliseconds),nativeUnchanged:before===JSON.stringify(S),nativeVersion:SYNC.backend.readVersion821()};});report.errors=h.errors;report.requests=h.counts;fs.mkdirSync(process.env.OUT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.OUT_DIR,'cost-call-stack.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
