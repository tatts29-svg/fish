/* Author: Andrew Fisher. Native before/after fencing reconciliation with frozen read-only APIs.
   GC500_FIXTURE=<private captured GET folder> node browser_parity.cjs base.html candidate.html private-bundle.json private-result.json
   The shared harness blocks every operational write. No original contents or financial values are printed. */
'use strict';
const cached=process.env.GC500_CACHE_ONLY==='1'?require('../../v10.66_speed_smooth_LIVE/tests/validation/cache_only.cjs'):null;
const C=require('../../v10.66_speed_smooth_LIVE/tests/validation/common.cjs'),assert=require('assert/strict');
const [baseFile,candidateFile,bundleFile,outFile]=process.argv.slice(2);
if(!outFile)throw Error('Expected base, candidate, private bundle and private output');
const bundle=JSON.parse(C.fs.readFileSync(bundleFile));
const extra=bundle.progress_after.operations.slice(bundle.progress_before.operations.length),ids=new Set(extra.map(x=>x.id));
const mobile=process.env.MOB==='1';
const out={author:'Andrew Fisher',mode:cached?'isolated frozen API and original cached media':'frozen API',mobile,baseSha256:C.sha(C.fs.readFileSync(baseFile)),candidateSha256:C.sha(C.fs.readFileSync(candidateFile)),checks:[]};
C.writePrivate(outFile,{pending:true});
function check(name,fn){fn();out.checks.push(name);console.log('PASS '+name);}
async function capture(pageFile,label){
 const s=await C.launch({pageFile,mobile,hash:'#today'});
 try{
  await C.ready(s);await s.page.waitForFunction(()=>SYNC.first.size===Object.keys(SYNC_COLLS).length&&SYNC.pending&&Object.keys(SYNC.pending).length===0);
  await C.settled(s.page);assert((await C.mergeReport(s.page)).complete,'shared merge is complete');
  const r=await s.page.evaluate(()=>holdAssets(()=>{
   RENDER_MEMO.clear();
   const day=todayIso(),f=todayFencingSummary848(day),w=todayWorkSummary848(day,undefined,undefined,f),o=fenceOverall853(day,w,f),days=programmeDays(),money=moneySummary();
   const months=[...new Set((DATA.rehire_quotes.quotes||[]).flatMap(q=>[q.delivery,q.collect,q.use_on]).filter(Boolean).map(d=>d.slice(0,7)))];
   return {record:JSON.stringify(S),data:JSON.stringify(DATA),version:SYNC.backend.readVersion821(),fencing:f,rows:w.fencingRows,overall:o,
    finance:fenceDerived(),labour:greenBookTotals(),financial:{money,service:servicing748(),ledger:pl770Model(),coverage:pl754Rehire(money),forecast:cj764Model(),monthly:months.map(month=>acc761Model(month))},
    operational:{assets:allAssets(),programme:days.map(d=>({iso:d.iso,deliveries:d.deliveries,removals:d.removals,unref:d.unref,loads:dpLoads(d)})),demob:demob816(),daily:days.map(d=>daily821Model(d.iso)),equipment:todayWorkMetrics840(day).filter(a=>a.id!=='fencing')}};
  }));
  r.dataSha256=C.sha(r.data);delete r.data;
  const before=r.record;
  for(const tab of ['progress','fencing','today']){await s.page.evaluate(tab=>go(tab),tab);await C.settled(s.page);}
  if(label==='candidate'){
   for(const selector of ['[data-tw848-group-fold="fencing"]','[data-tw841-group-card="fencing"]']){
    const fold=s.page.locator('#pane-today '+selector);if(!await fold.evaluate(el=>el.open))await fold.locator(':scope > summary').click();
   }
   const button=s.page.locator('#pane-today [data-tw840-fence-row="scrim_existing"] button[data-tw840-fence-detail="scrim_existing"]').first();
   await button.click();
   const dialog=s.page.locator('#gc500-work-dialog840');await dialog.waitFor({state:'visible'});
   await s.page.waitForFunction(()=>[...document.querySelectorAll('#gc500-work-dialog840 img')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.top<innerHeight;}).every(el=>el.complete&&el.naturalWidth>0),null,{timeout:30000});
   assert.match(await dialog.innerText(),/Recorded service activity/,'separate activity is visibly labelled');
   r.visual=await dialog.evaluate(el=>({open:el.open,viewportWidth:innerWidth,width:el.getBoundingClientRect().width,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,heading:el.querySelector('h2')?.textContent}));
   assert(r.visual.width<=r.visual.viewportWidth&&r.visual.scrollWidth<=r.visual.clientWidth+1,'activity dialog fits the viewport without horizontal clipping');
   const image=C.path.join(C.path.dirname(outFile),'activity-'+(mobile?'phone':'desktop')+'.png');
   await s.page.screenshot({path:image,fullPage:false});r.screenshot=image;
   r.visibleSources=0;
   for(const op of extra.filter(x=>x.type==='scrim_existing')){
    const article=dialog.locator('[data-tw844-docket='+JSON.stringify('physical-work848:'+op.id)+']');
    assert.equal(await article.count(),1,'reviewed activity has one native source card');
    await article.scrollIntoViewIfNeeded();
    await article.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>img.decode()));if(imgs.some(img=>!img.complete||!img.naturalWidth))throw Error('Original source thumbnail failed');});
    assert(await article.locator('img').count()>0,'reviewed source thumbnail is available');
    r.visibleSources++;
    if(r.visibleSources===1)await s.page.screenshot({path:C.path.join(C.path.dirname(outFile),'activity-source-'+(mobile?'phone':'desktop')+'.png'),fullPage:false});
   }
   await dialog.locator('[data-tw840-close]').click();
   const relocation=s.page.locator('#pane-today [data-tw840-fence-row="relocation"] button[data-tw840-fence-detail="relocation"]').first();
   await relocation.click();await dialog.waitFor({state:'visible'});
   await s.page.waitForFunction(()=>[...document.querySelectorAll('#gc500-work-dialog840 img')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.top<innerHeight;}).every(el=>el.complete&&el.naturalWidth>0),null,{timeout:30000});
   await s.page.screenshot({path:C.path.join(C.path.dirname(outFile),'relocation-'+(mobile?'phone':'desktop')+'.png'),fullPage:false});
   const movement=extra.find(x=>x.type==='relocation'),article=dialog.locator('[data-tw844-docket='+JSON.stringify('physical-work848:'+movement.id)+']');
   assert.equal(await article.count(),1,'reviewed movement has one native source card');await article.scrollIntoViewIfNeeded();
   await article.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>img.decode()));if(imgs.some(img=>!img.complete||!img.naturalWidth))throw Error('Original source thumbnail failed');});
   assert(await article.locator('img').count()>0,'reviewed movement thumbnail is available');r.visibleSources++;
   await s.page.screenshot({path:C.path.join(C.path.dirname(outFile),'relocation-source-'+(mobile?'phone':'desktop')+'.png'),fullPage:false});
   await dialog.locator('[data-tw840-close]').click();
  }
  assert.equal(await s.page.evaluate(()=>JSON.stringify(S)),before,'native output reads leave the record unchanged');
  C.assertClean(s);if(cached)assert.equal(cached.missing.length,0,'every media request uses a captured original response');r.health=C.errorsOf(s);return r;
 }finally{await s.browser.close();}
}
(async()=>{
 try{
  out.before=await capture(baseFile,'baseline');out.after=await capture(candidateFile,'candidate');const b=out.before,n=out.after;
  check('same complete shared record in both candidates',()=>assert.equal(n.record,b.record));
  check('same frozen record version and embedded source data',()=>{assert.equal(n.version,b.version);assert.equal(n.dataSha256,b.dataSha256);});
  check('existing financial totals unchanged',()=>assert.deepEqual(n.finance,b.finance));
  check('all native Costs, Revenue, supplier, ledger, forecast and monthly models unchanged',()=>assert.deepEqual(n.financial,b.financial));
  check('existing service labour hours and costs unchanged',()=>assert.deepEqual(n.labour,b.labour));
  check('all native assets, programme, loads, demob, daily and equipment models unchanged',()=>assert.deepEqual(n.operational,b.operational));
  check('installation headline and percentages unchanged',()=>{const headline=o=>Object.fromEntries(Object.entries(o).filter(([key])=>key!=='rows'));assert.deepEqual(headline(n.overall),headline(b.overall));});
  check('every installation and gate row unchanged',()=>assert.deepEqual(n.rows.filter(r=>!['relocation','scrim_existing'].includes(r.id)),b.rows.filter(r=>!['relocation','scrim_existing'].includes(r.id))));
  check('all four reviewed activities accepted by native source guards',()=>{const a=n.fencing.evidence.operations.filter(x=>ids.has(x.id));assert.equal(a.length,4);assert.deepEqual(a.map(x=>[x.id,x.type,x.quantity,x.unit]),extra.map(x=>[x.id,x.type,x.quantity,x.unit]));assert(!n.fencing.evidence.pending.some(x=>ids.has(x.id)));});
  check('existing activity decisions and pending issues preserved',()=>{assert.deepEqual(n.fencing.evidence.operations.filter(x=>!ids.has(x.id)),b.fencing.evidence.operations);assert.deepEqual(n.fencing.evidence.pending,b.fencing.evidence.pending);assert.deepEqual(n.fencing.evidence.planAllowances,b.fencing.evidence.planAllowances);});
  check('only reviewed scrim work enters the separate activity display',()=>{assert.deepEqual(n.fencing.activities.filter(x=>!ids.has(x.id)),b.fencing.activities);assert.deepEqual(n.fencing.activities.filter(x=>ids.has(x.id)).map(x=>[x.id,x.quantity]),extra.filter(x=>x.type==='scrim_existing').map(x=>[x.id,x.quantity]));});
  check('scrim activity has no invented programme denominator or percentage',()=>{const before=b.rows.find(r=>r.id==='scrim_existing'),after=n.rows.find(r=>r.id==='scrim_existing'),amount=extra.filter(x=>x.type==='scrim_existing').reduce((sum,x)=>sum+x.quantity,0);assert(after);assert.equal(after.done-(before?.done||0),amount);assert.equal(after.total,null);assert.equal(after.pct,null);assert.equal(after.left,null);assert.equal(after.plan.planned,null);assert.equal(after.plan.actual,after.done);});
  check('relocation increases only by the reviewed physical movement',()=>{const before=b.rows.find(r=>r.id==='relocation'),after=n.rows.find(r=>r.id==='relocation'),amount=extra.filter(x=>x.type==='relocation').reduce((sum,x)=>sum+x.quantity,0);assert(before&&after);assert.equal(after.done-before.done,amount);assert.equal(after.total,before.total);const bs=b.fencing.summaryRows.find(r=>r.id==='relocation'),ns=n.fencing.summaryRows.find(r=>r.id==='relocation');assert.equal(ns.redRecorded,bs.redRecorded);assert.equal(ns.extraWorkRecorded-bs.extraWorkRecorded,amount);});
  // The native v10.47 wrapper keeps installed headline metres separate from movements.
  // Its relocation detail retains its own programme total: newly evidenced movement
  // reduces that row's remaining work, without changing installed-fence headlines.
  check('only the reviewed relocation changes its separate overall detail row',()=>{const amount=extra.filter(x=>x.type==='relocation').reduce((sum,x)=>sum+x.quantity,0);assert.deepEqual(n.overall.rows.filter(r=>r.id!=='relocation'),b.overall.rows.filter(r=>r.id!=='relocation'));const before=b.overall.rows.find(r=>r.id==='relocation'),after=n.overall.rows.find(r=>r.id==='relocation');assert.equal(after.recorded-before.recorded,amount);assert.equal(after.credited,Math.min(after.recorded,before.total));assert.equal(after.left,Math.max(0,before.total-after.recorded));assert.deepEqual({...after,recorded:before.recorded,credited:before.credited,left:before.left},before);});
  check('native activity dialog is visible and fits the candidate viewport',()=>assert(n.visual.open&&n.screenshot));
  check('all four native source cards render original thumbnails without placeholders',()=>assert.equal(n.visibleSources,4));
  if(cached)out.cache={reads:cached.reads,missing:cached.missing.length,networkFallback:cached.networkFallback};
  out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);process.exitCode=1;}
 finally{C.writePrivate(outFile,out);}
 console.log(JSON.stringify({pass:out.pass,checks:out.checks.length,error:out.error?.split('\n')[0]}));
})();
