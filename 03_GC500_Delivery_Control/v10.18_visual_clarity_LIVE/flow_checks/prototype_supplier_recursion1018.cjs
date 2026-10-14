/* Author: Andrew Fisher. In-memory supplier branch prototype; live service stays GET-only. */
'use strict';const fs=require('fs'),path=require('path'),crypto=require('crypto');const{open}=require('../map/tests/readonly1018.cjs');
const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',pageSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex')};
(async()=>{let h;try{h=await open({pageFile:process.env.PAGE,W:1440,H:1000});const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
 report.result=await p.evaluate(()=>{
  const original=supplierPricing1014,before=JSON.stringify(S),version=SYNC.backend.readVersion821(),runs=[];
  const source=original.toString(),anchor='branch:pl760FencingBranch()';if(source.split(anchor).length!==2)throw Error('Exact prototype anchor missing');
  try{for(const patched of [false,true]){
   if(patched)window.eval('supplierPricing1014 = ('+source.replace(anchor,"branch:normBranch(PO_SRC.supplier?.branch_code||'')||'STPS'")+');');
   RENDER_MEMO.clear();go('about');const timings=[];
   for(const route of ['costs','timeline']){const start=performance.now();go(route);timings.push({route,milliseconds:Math.round(performance.now()-start),text:document.getElementById('pane-'+state.tab)?.innerText.replace(/\s+/g,' ').trim()});}
   const projections=holdAssets(()=>({money:moneySummary(),pl:pl770Model(),finance:fh866Model(),onsite:onsiteComplete979(),journal:cj764Model(),branch:branchFinancial978(pl752Rows(),moneySummary()),dockets:allDockets(),costs:allCosts(),supplier:{...supplierPricing1014(),records:[...supplierPricing1014().records]}}));
   runs.push({patched,timings,projections});
  }}finally{supplierPricing1014=original;RENDER_MEMO.clear();}
  return {runs,modelsEqual:JSON.stringify(runs[0].projections)===JSON.stringify(runs[1].projections),renderedTextsEqual:runs[0].timings.every((r,i)=>r.text===runs[1].timings[i].text),nativeUnchanged:before===JSON.stringify(S)&&version===SYNC.backend.readVersion821(),nativeVersion:version};
 });report.errors=h.errors;report.requests=h.counts;
 if(!report.result.modelsEqual||!report.result.nativeUnchanged||h.errors.length||h.counts.blocked)process.exitCode=1;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(h)await h.browser.close();fs.writeFileSync(path.join(out,'supplier-prototype.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,result:report.result?{...report.result,runs:report.result.runs.map(r=>({patched:r.patched,timings:r.timings.map(({text,...t})=>t)}))}:undefined}));}})();
