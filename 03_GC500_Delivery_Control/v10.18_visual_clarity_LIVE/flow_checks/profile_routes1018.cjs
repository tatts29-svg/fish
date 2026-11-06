/* Author: Andrew Fisher. Temporary in-memory profiling only; shared record stays read-only. */
'use strict';const fs=require('fs'),path=require('path'),crypto=require('crypto');const{open}=require('../map/tests/readonly1018.cjs');
const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',pageSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),runs:[]};
(async()=>{let h;try{h=await open({pageFile:process.env.PAGE,W:1440,H:1000});const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
const before=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),record:JSON.stringify(S)}));report.nativeVersion=before.version;
for(const route of ['costs','timeline'])for(const outerHold of [false,true]){
 await p.evaluate(()=>go('about'));await p.waitForTimeout(100);
 const result=await p.evaluate(({route,outerHold})=>{
  const renderName=route==='costs'?'renderCosts':'renderTimeline',outerOriginal=window[renderName];
  if(outerHold)window[renderName]=function(){const self=this,args=arguments;return holdAssets(()=>outerOriginal.apply(self,args));};
  const regex=/Model|Summary|Card|Html|Rows|Figures|WholeJob|^renderCosts|^renderTimeline|^allCosts$|^costTotals$|^onsiteComplete|^moneySummary_|^holdAssets$|^heldMemo$|^buildAllAssets$|^allAssets$|^chargeLines$|^qtyOf$/;
  const saved=new Map(),times=new Map(),stack=[];
  for(const name of Object.keys(window)){
   let fn;try{fn=window[name];}catch(_){continue;}
   if(typeof fn!=='function'||!regex.test(name)||!Object.getOwnPropertyDescriptor(window,name)?.writable)continue;
   saved.set(name,fn);window[name]=function(){const node={start:performance.now(),children:0};stack.push(node);try{return fn.apply(this,arguments);}finally{const inclusive=performance.now()-node.start;stack.pop();if(stack.length)stack.at(-1).children+=inclusive;const row=times.get(name)||{name,calls:0,inclusive:0,own:0,max:0};row.calls++;row.inclusive+=inclusive;row.own+=Math.max(0,inclusive-node.children);row.max=Math.max(row.max,inclusive);times.set(name,row);}};
  }
  let milliseconds;
  try{const start=performance.now();go(route);milliseconds=performance.now()-start;}finally{for(const [name,fn]of saved)window[name]=fn;window[renderName]=outerOriginal;}
  const pane=document.getElementById('pane-'+state.tab);
  return {route,outerHold,milliseconds:Math.round(milliseconds),profile:[...times.values()].map(x=>({...x,inclusive:+x.inclusive.toFixed(2),own:+x.own.toFixed(2),max:+x.max.toFixed(2)})).sort((a,b)=>b.own-a.own),pane:pane?.id,paneText:pane?.innerText.replace(/\s+/g,' ').trim()};
 },{route,outerHold});
 // Capture the same native models separately from timing, using their existing draw scope.
 result.projections=await p.evaluate(()=>holdAssets(()=>({money:moneySummary(),pl:pl770Model(),finance:fh866Model(),onsite:onsiteComplete979(),journal:cj764Model(),branch:branchFinancial978(pl752Rows(),moneySummary())})));
 report.runs.push(result);fs.writeFileSync(path.join(out,'route-profile.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({route,outerHold,milliseconds:result.milliseconds,top:result.profile.slice(0,10)}));
}
const end=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),record:JSON.stringify(S)}));report.nativeUnchanged=before.record===end.record&&before.version===end.version;
report.comparisons=['costs','timeline'].map(route=>{const a=report.runs.find(x=>x.route===route&&!x.outerHold),b=report.runs.find(x=>x.route===route&&x.outerHold);return {route,baselineMs:a.milliseconds,outerHoldMs:b.milliseconds,modelsEqual:JSON.stringify(a.projections)===JSON.stringify(b.projections),renderedTextEqual:a.paneText===b.paneText};});
report.errors=h.errors;report.requests=h.counts;if(!report.nativeUnchanged||h.errors.length||h.counts.blocked||report.comparisons.some(x=>!x.modelsEqual))process.exitCode=1;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(h)await h.browser.close();fs.writeFileSync(path.join(out,'route-profile.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({comparisons:report.comparisons,nativeUnchanged:report.nativeUnchanged,errors:report.errors,requests:report.requests,failure:report.failure}));}})();
