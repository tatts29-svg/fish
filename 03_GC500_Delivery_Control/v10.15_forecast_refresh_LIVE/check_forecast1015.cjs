/* Author: Andrew Fisher. Read-only delayed evidence, deferred redraw and exact financial propagation. */
'use strict';
const fs=require('fs'),path=require('path'),{open}=require('../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#fencing',W:process.env.MOB?390:1440,H:process.env.MOB?844:900,mobile:!!process.env.MOB});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 const result=await h.page.evaluate(async()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),canonical=x=>fencePaperCanonical898(x),checks={},before=canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
  const original={files:SYNC.backend.files,redraw:photoRedraw,docsRedraw},manifest=clone(Object.values(DOCS.files));
  const sample=()=>holdAssets(()=>{const F=cj764Fencing(),P=pl770Model(),H=fh866Model(),C=cj764Model();return clone({state:DOCS.state,forecast:F,pl:{revNow:P.revNow,revJob:P.revJob,directNow:P.direct,directJob:P.directJob},financeCosts:H.costs,jobCost:C.job,jobRevenue:C.revenue.job,reviews:fenceProgrammeReviews958(allDockets()).filter(x=>x.row.attribution).map(x=>({number:x.row.docket_no,state:x.state,reason:x.reason,attribution:x.attribution}))});});
  const clean=()=>{sharedCache975();return sample();};
  let warm,cold,resolved,uncached,failed,altered;
  try{
   warm=clean();photoRedraw=()=>{};docsRedraw=()=>{};
   let resolveManifest;SYNC.backend.files=()=>new Promise(resolve=>{resolveManifest=resolve;});
   RENDER_MEMO.set('registry-test-marker1015',true);
   const pending=docsRefresh(true);
   checks['loading invalidates model cache immediately']=!RENDER_MEMO.has('registry-test-marker1015');
   sharedCache975();cold=sample();
   checks['delayed manifest reproduces withheld source credit']=cold.state==='loading'&&cold.reviews.some(x=>x.state!=='matched')&&cold.forecast.cost>warm.forecast.cost;
   RENDER_MEMO.set('registry-test-marker1015',true);resolveManifest({files:manifest});await pending;
   checks['ready invalidates cache before deferred redraw']=DOCS.state==='ready'&&!RENDER_MEMO.has('registry-test-marker1015');
   resolved=sample();uncached=clean();
   checks['settled forecast matches warm source-backed forecast']=canonical(resolved.forecast)===canonical(warm.forecast);
   checks['settled P and L matches warm values']=canonical(resolved.pl)===canonical(warm.pl);
   checks['settled Finance costs match warm values']=canonical(resolved.financeCosts)===canonical(warm.financeCosts);
   checks['settled job totals match warm values']=resolved.jobCost===warm.jobCost&&resolved.jobRevenue===warm.jobRevenue;
   checks['cached and uncached readers agree after source arrival']=canonical(resolved)===canonical(uncached);
   checks['original exact docket and source guards remain matched']=resolved.reviews.every(x=>x.state==='matched');
   SYNC.backend.files=()=>Promise.reject(Error('Test registry read unavailable'));RENDER_MEMO.set('registry-test-marker1015',true);
   await docsRefresh(true);failed=sample();
   checks['failed registry clears cache and remains explicit']=DOCS.state==='failed'&&!RENDER_MEMO.has('registry-test-marker1015')&&failed.reviews.every(x=>x.state!=='matched');
   const affected=FENCE_PROGRAMME958.rows.find(r=>r.attribution),source=affected.source_ids[0],different=clone(manifest);different.find(f=>f.id===source).sha256='0'.repeat(64);
   SYNC.backend.files=async()=>({files:different});await docsRefresh(true);altered=sample();
   checks['changed source fingerprint still withholds attribution']=altered.reviews.some(x=>x.state!=='matched'&&/source file has changed/.test(x.reason));
   checks['changed source updates P and L before redraw']=canonical(altered.pl)===canonical(clean().pl);
   SYNC.backend.files=async()=>({files:manifest});await docsRefresh(true);
   checks['restored verified evidence restores same totals']=canonical(sample())===canonical(warm);
   checks['shared operational records unchanged']=before===canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
   return {pass:Object.values(checks).every(Boolean),checks,warm,cold,resolved,uncached,failed,altered,version:SYNC.backend.readVersion821()};
  }finally{SYNC.backend.files=original.files;photoRedraw=original.redraw;docsRedraw=original.docsRedraw;}
 });
 result.checks['no browser errors or operational writes']=h.errors.length===0&&h.counts.blocked===0;result.pass=Object.values(result.checks).every(Boolean);result.requests=h.counts;result.errors=h.errors;
 if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({pass:result.pass,checks:Object.keys(result.checks).length,failed:Object.entries(result.checks).filter(([,v])=>!v).map(([k])=>k),requests:h.counts,errors:h.errors}));if(!result.pass)process.exitCode=1;
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
