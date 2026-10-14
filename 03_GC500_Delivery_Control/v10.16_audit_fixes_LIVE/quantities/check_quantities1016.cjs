/* Author: Andrew Fisher. GET-only shared-source and Today count propagation. */
'use strict';const fs=require('node:fs'),path=require('node:path'),{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#today',mobile:true,W:390,H:844});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const report=await h.page.evaluate(()=>{
  const checks=[],ck=(name,pass)=>checks.push({name,pass:!!pass}),before=JSON.stringify(S),raw=JSON.stringify(DATA),contracts=JSON.stringify(ONHIRE.rows),version=SYNC.backend.readVersion821();
  const read=()=>holdAssets(()=>({model:Supplier996.model(),metrics:todayWorkMetrics840(todayIso()).find(r=>r.id==='toilets'),summary:todayWorkSummary848(todayIso()).byId.toilets,progress:progress881Model(todayIso()).rows.find(r=>r.id==='toilets')}));
  const first=read(),scope=first.model.rows.filter(r=>r.sourceOnly),requests=Supplier996.requests,originalQty=requests[0].quantity,originalAssets=allAssets;
  ck('Both known source requests remain in the shared supplier model',scope.length===2&&scope.every(r=>r.quantity===1));
  ck('Today counts both known requests once',first.metrics.total===256&&first.summary.total===256);
  ck('Confirmed installed quantity stays203 and remaining becomes53',first.metrics.done===203&&first.summary.done===203&&first.summary.left===53);
  ck('Supplier52 pending plus separate accessible toilet equals Today53',first.model.summary.remaining===52&&first.summary.left===first.model.summary.remaining+1);
  ck('Today and progress use the same corrected percentage',Math.abs(first.summary.pct-203/256*100)<1e-9&&Math.abs(first.progress.min-first.summary.pct)<1e-9);
  ck('Pending supplier rows have no invented completion',scope.every(s=>{const r=first.metrics.rows.find(r=>r.key===s.ref);return r&&r.done===0&&r.arrived962===0&&!r.complete;}));
  ck('Pending source scope has the same day as the current supplier run',scope.every(s=>first.metrics.rows.find(r=>r.key===s.ref)?.dueDate1016===first.model.remaining.find(r=>r.ref===s.ref)?.date));
  ck('Known request dates are not flagged as missing',scope.every(s=>!first.summary.plan.undatedRefs.includes(s.ref)));
  try{
   requests[0].quantity=3;sharedCache975();const changed=read();
   ck('One source quantity change updates supplier requested scope',changed.model.rows.find(r=>r.ref===requests[0].id)?.quantity===3);
   ck('One source quantity change updates Today once without changing actuals',changed.summary.total===258&&changed.summary.done===203&&changed.summary.left===55);
   requests[0].quantity=originalQty;sharedCache975();
   allAssets=function(){return originalAssets.apply(this,arguments).map(a=>a.key==='WC46'?{...a,supplierRequest996:requests[0].id}:a);};sharedCache975();
   const linked=read();
   ck('Existing source resolver removes the orphan after explicit reference allocation',!linked.model.rows.some(r=>r.sourceOnly&&r.ref===requests[0].id));
   ck('Linked source request is not double-counted in Today',linked.summary.total===255&&linked.summary.done===203&&linked.metrics.rows.filter(r=>r.key==='WC46').length===1&&!linked.metrics.rows.some(r=>r.key===requests[0].id));
  }finally{requests[0].quantity=originalQty;allAssets=originalAssets;sharedCache975();}
  const restored=read();
  ck('In-memory fixtures restore the full shared scope',JSON.stringify(restored)===JSON.stringify(first));
  ck('Native state, source and original contracts remain byte-equivalent',before===JSON.stringify(S)&&raw===JSON.stringify(DATA)&&contracts===JSON.stringify(ONHIRE.rows)&&version===SYNC.backend.readVersion821());
  return {author:'Andrew Fisher',nativeVersion:version,checks,scope:{total:first.summary.total,done:first.summary.done,left:first.summary.left,percentage:first.summary.pct}};
 });
 report.checks.push({name:'No errors or attempted operational writes',pass:!h.errors.length&&!h.counts.blocked});Object.assign(report,{errors:h.errors,requests:h.counts});
 const out=process.env.OUT||'/workspace/private-gc500-audit14Oct2026/operations/quantities-checks.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({nativeVersion:report.nativeVersion,checks:report.checks.length,failed:report.checks.filter(r=>!r.pass),scope:report.scope,errors:h.errors,requests:h.counts}));if(report.checks.some(r=>!r.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
