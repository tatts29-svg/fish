// Author: Andrew Fisher. Read-only supplier evidence and exact native protection.
// Run under flock /tmp/gc500-browser.lock. PAGE, BASE, OUT, ORACLE and
// CANDIDATE_SHA are required. LIVE=1 is for the release owner's public checks.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const {immutable,localState,guideRows}=require('../v8.49_fencing_components_LIVE/test_components849_browser.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const same=(a,b)=>canonical(a)===canonical(b);
const baseHash='924955d5560006bcac1fd07765dffb51692154e04585dae1eefcc292ef602fb1';
const section=scope=>'[data-fc849-scope="'+scope+'"]';
async function protectedSnapshot(p,day){return {original:await immutable(p,day),native:await nativeSnapshot(p),supplementary:await p.evaluate(day=>({
 ledger:fenceComponents849(day),evidence:fenceComponentEvidence849(day),guide:fenceGuide849({length:100,gatePanels:2,gateOpenings:2,layout:'straight',braced:true}),
 functions:Object.fromEntries(['fenceComponents849','fenceGuide849','fenceComponentEvidence849','fenceComponentGuideOutput849','captureFenceComponents849','restoreFenceComponents849','bindFenceComponents849','renderFencing'].map(name=>[name,eval(name).toString()]))
}),day)};}
function unchanged(a,b){return same(a.original,b.original)&&same(a.native.collections,b.native.collections)&&same(a.native.functions,b.native.functions)&&same(a.native.media,b.native.media)&&same(a.supplementary,b.supplementary);}
async function route(p,scope){await p.evaluate(scope=>go(scope),scope);if(scope==='today'){
 const fold=p.locator('details[data-tw848-group-fold="fencing"]');if(!await fold.evaluate(e=>e.open))await fold.locator(':scope > summary').click();
}await p.locator(section(scope)).waitFor({state:'visible'});}
async function openFold(p,scope,key){const fold=p.locator(section(scope)+' [data-fc849-fold="'+key+'"]');if(!await fold.evaluate(e=>e.open))await fold.locator(':scope > summary').click();
 // HTML details queues its toggle event. Wait for the existing native listener
 // before forcing a redraw in the same test turn; a click is not that event.
 await p.waitForFunction(({scope,key})=>FENCE_COMPONENTS_VIEW849.folds.get(scope+':'+key)===true,{scope,key},{timeout:5000});return fold;}
async function table(p){return p.locator('[data-tw847-fence-summary-row]').evaluateAll(rows=>rows.map(row=>({id:row.dataset.tw847FenceSummaryRow,values:[...row.querySelectorAll('[data-tw847-fence-value] strong')].map(n=>n.textContent)})));}
async function run(){
 const {PAGE,BASE,OUT,ORACLE,CANDIDATE_SHA}=process.env;
 if(!PAGE||!BASE||!OUT||!ORACLE||!CANDIDATE_SHA)throw Error('Frozen PAGE, BASE, OUT, ORACLE and CANDIDATE_SHA required');
 const bytes=fs.readFileSync(PAGE),oracleBytes=fs.readFileSync(ORACLE),oracle=JSON.parse(oracleBytes),day=process.env.AS_OF||'2026-10-05',live=process.env.LIVE==='1';
 if(hash(bytes)!==CANDIDATE_SHA||hash(fs.readFileSync(BASE))!==baseHash)throw Error('Frozen page or base identity differs');
 if(oracle.author!=='Andrew Fisher'||!oracle.matched_gate_rows?.length||!oracle.gate_work_conclusion?.excluded_conflicting_rows?.length)throw Error('Independent original-source oracle unavailable');
 const expected=oracle.matched_gate_rows.filter(r=>r.original_date<=day),expectedQuantity=expected.reduce((n,r)=>n+r.quantity_as_written,0);
 fs.mkdirSync(OUT,{recursive:true});const report={author:'Andrew Fisher',at:new Date().toISOString(),candidate:CANDIDATE_SHA,base:baseHash,oracle:hash(oracleBytes),day,live,checks:[],views:[]};
 const save=()=>fs.writeFileSync(path.join(OUT,'po850.json'),JSON.stringify(report,null,2));
 const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});save();console.log((pass?'PASS ':'FAIL ')+name);};
 const guard=installWriteGuard(),{open}=require(path.join(process.env.GC500_TOOLCHAIN||path.resolve(__dirname,'../toolchain'),'harness/open_page.js'));let session;
 try{
  session=await open({pageFile:BASE,hash:'#today',W:1366,H:900});await ready840(session.page);await session.page.waitForFunction(()=>DOCS.state==='ready');
  await session.page.evaluate(day=>{state.asOf=day;photoIndex();renderToday();},day);
  const baseline=await protectedSnapshot(session.page,day),baselineTable=await table(session.page);
  check('Verified base hydrated without runtime errors',!session.errors.length&&Object.keys(baseline.native.collections).length>0,{collections:Object.keys(baseline.native.collections).length,errors:session.errors});
  await session.browser.close();session=null;
  for(const view of [{name:'laptop',W:1366,H:900,dpr:1},{name:'phone',W:390,H:844,dpr:2,mobile:true}]){
   session=await open({pageFile:live?undefined:PAGE,hash:'#today',...view});const p=session.page;
   if(live){const upstream=guard.fulfilledDocuments.at(-1),browser=guard.documentResponses.at(-1),bom=bytes.subarray(0,3).equals(Buffer.from([239,187,191]));
    const exact=upstream?.sha===CANDIDATE_SHA&&upstream.bytes===bytes.length&&browser?.status===200&&(browser.sha===CANDIDATE_SHA&&browser.bytes===bytes.length||bom&&browser.sha===hash(bytes.subarray(3))&&browser.bytes===bytes.length-3)&&session.counts.page===0;
    check(view.name+' exact public bytes without local HTML substitution',exact,{upstream,browser,counts:session.counts});if(!exact)throw Error('Public HTML differs');}
   await ready840(p);await p.waitForFunction(()=>typeof fencePoGateEvidence850==='function'&&DOCS.state==='ready');
   await p.evaluate(day=>{state.asOf=day;photoIndex();renderToday();},day);
   const before=await protectedSnapshot(p,day),beforeTable=await table(p);
   check(view.name+' existing eight readings, financial values, all DATA and operational records unchanged',unchanged(baseline,before));
   check(view.name+' all eight displayed counts and percentages equal verified base',baselineTable.length===8&&same(baselineTable,beforeTable),{baseline:baselineTable,candidate:beforeTable});
   const model=await p.evaluate(day=>fencePoGateEvidence850(day),day);
   const projected=model.accepted.map(r=>({id:r.recordId,number:r.number,date:r.date,quantity:r.quantity,po:r.poNumber})).sort((a,b)=>a.number.localeCompare(b.number));
   const desired=expected.map(r=>({id:r.recordId,number:r.docket,date:r.original_date,quantity:r.quantity_as_written,po:r.po_as_printed})).sort((a,b)=>a.number.localeCompare(b.number));
   check(view.name+' accepted supplier entries exactly match independent signed-original and ACTUALS rows',model.state==='ready'&&!model.pending.length&&same(projected,desired)&&model.acceptedQuantity===expectedQuantity&&model.supplierTotal===expectedQuantity,{actual:projected,expected:desired,state:model.state,pending:model.pending});
   const conflicts=model.conflicts.map(r=>({docket:r.number,supplier_units:r.supplierQuantity,original_wheels:r.originalWheels})).sort((a,b)=>a.docket.localeCompare(b.docket));
   const expectedConflicts=oracle.gate_work_conclusion.excluded_conflicting_rows.slice().sort((a,b)=>a.docket.localeCompare(b.docket));
   check(view.name+' original supplier count conflicts stay outside the matched quantity',same(conflicts,expectedConflicts)&&model.conflictQuantity===expectedConflicts.reduce((n,r)=>n+r.supplier_units,0),conflicts);
   const unit=oracle.gate_work_conclusion.unit_counterexample;
   check(view.name+' original programme disproves automatic supplier-unit conversion',model.programmeMapping==='unconfirmed'&&model.canAddToProgrammeDone===false&&model.unitEvidence.state==='ready'&&['source_id','sha256','page','vehicleGates','noteAsWritten'].every(k=>model.unitEvidence[k]===unit[k]),model.unitEvidence);
   const adversarial=await p.evaluate(day=>{
    const clone=x=>JSON.parse(JSON.stringify(x)),seed={catalogue:clone(FENCE_PO850),records:clone(allDockets()),weeks:clone(DATA.weeks),files:clone(photoIndex().files)};
    const run=(fn,asOf=day)=>{const input=clone(seed);fn(input);return fencePoGateEvidence850(asOf,input);};
    const item=seed.catalogue.items[0],out={id:item.id,quantity:item.quantity,source_id:item.source_ids[0]};
    out.dates=['2026-09-08','2026-09-09','2026-09-15','2026-09-18','2026-09-24'].map(date=>({date,result:run(()=>{},date)}));
    out.stale=run(input=>{input.files[item.source_ids[0]].sha256='0'.repeat(64);});
    out.location=run(input=>{input.records.find(r=>r.id===item.recordId).location='Changed after original review';});
    out.number=run(input=>{input.records.find(r=>r.id===item.recordId).docket_no='changed';});
    out.duplicateRecord=run(input=>{input.records.push(clone(input.records.find(r=>r.id===item.recordId)));});
    out.duplicateCatalogue=run(input=>{input.catalogue.items.push(clone(item));input.catalogue.total+=item.quantity;});
    out.wrongWheel=run(input=>{input.records.find(r=>r.id===item.recordId).components.wheels++;});
    out.invalidDate=run(()=>{},'2026-02-30');
    out.staleProgramme=run(input=>{input.files[input.catalogue.unitEvidence.source_id].sha256='0'.repeat(64);});
    return out;
   },day);
   check(view.name+' historical review dates use original dates without future source work',adversarial.dates.every(({date,result})=>{
    const rows=oracle.matched_gate_rows.filter(r=>r.original_date<=date);return result.acceptedQuantity===rows.reduce((n,r)=>n+r.quantity_as_written,0)&&same(result.accepted.map(r=>r.number).sort(),rows.map(r=>r.docket).sort());
   }),adversarial.dates.map(({date,result})=>({date,quantity:result.acceptedQuantity,rows:result.accepted.length,excluded:result.excluded.length})));
   const guarded=['location','number','duplicateRecord','duplicateCatalogue','wrongWheel'];
   check(view.name+' changed docket identity, location, components and duplicates fail closed',guarded.every(k=>adversarial[k].pending.some(r=>r.id===adversarial.id)&&!adversarial[k].accepted.some(r=>r.id===adversarial.id)),Object.fromEntries(guarded.map(k=>[k,adversarial[k].pending])));
   check(view.name+' changed source excludes every affected supplementary row only',adversarial.stale.accepted.every(r=>!r.source_ids.includes(adversarial.source_id))&&adversarial.stale.pending.some(r=>r.id===adversarial.id),{accepted:adversarial.stale.accepted.length,pending:adversarial.stale.pending.length});
   check(view.name+' invalid calendar date gives no trusted quantity',adversarial.invalidDate.state==='unavailable'&&adversarial.invalidDate.acceptedQuantity===null,adversarial.invalidDate);
   check(view.name+' stale programme proof never promotes source units into programme progress',adversarial.staleProgramme.unitEvidence.state==='unavailable'&&adversarial.staleProgramme.programmeMapping==='unconfirmed'&&adversarial.staleProgramme.canAddToProgrammeDone===false&&adversarial.staleProgramme.acceptedQuantity===expectedQuantity,adversarial.staleProgramme.unitEvidence);
   const routes=[];
   for(const scope of ['today','fencing']){
    await route(p,scope);const host=p.locator(section(scope));let fold=host.locator('[data-fc850-evidence]');
    check(view.name+' '+scope+' has one compact supplier disclosure',await fold.count()===1);
    fold=await openFold(p,scope,'po-quantities');
    const shown=await fold.evaluate(e=>({accepted:e.querySelector('[data-fc850-accepted-total]')?.textContent,conflict:e.querySelector('[data-fc850-conflict-total]')?.textContent,text:e.textContent,state:e.dataset.fc850State,
     rows:[...e.querySelectorAll('[data-fc850-matched],[data-fc850-conflict]')].map(row=>({id:row.dataset.fc850Matched||row.dataset.fc850Conflict,text:row.textContent,links:[...row.querySelectorAll('a[href]')].map(a=>({text:a.textContent,url:a.href,rel:a.rel})),button:row.querySelector('[data-fc849-record]')?.disabled})),
     unitLinks:[...e.querySelectorAll('[data-fc850-unit-evidence] a[href]')].map(a=>({text:a.textContent,url:a.href,rel:a.rel})),
     dimensions:{client:e.clientWidth,scroll:e.scrollWidth,window:innerWidth,document:document.documentElement.scrollWidth}
    }));
    check(view.name+' '+scope+' shows matched totals and conflicting quantities separately',shown.state==='ready'&&shown.accepted===expectedQuantity.toLocaleString('en-AU')&&shown.conflict===model.conflictQuantity.toLocaleString('en-AU')&&shown.rows.length===model.accepted.length+model.conflicts.length,shown);
    const pointers=await p.evaluate(day=>{const m=fencePoGateEvidence850(day);return Object.fromEntries([...m.accepted,...m.conflicts].map(row=>[row.id,row.papers.map(pointer=>{const paper=photoFor(pointer);return paper.state==='ready'?fenceComponentsUrl849(paper.url,pointer.page):null;})]));},day);
    check(view.name+' '+scope+' every supplier row opens both reviewed source papers safely',shown.rows.every(row=>pointers[row.id]?.length>=2&&pointers[row.id].every(url=>url&&row.links.some(a=>a.url===url))&&row.links.every(a=>{const u=new URL(a.url);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&a.rel.includes('noopener');})&&row.button===false),{rows:shown.rows.map(r=>({id:r.id,links:r.links,buttonDisabled:r.button}))});
    check(view.name+' '+scope+' programme unit counterexample links to original page',shown.unitLinks.length>0&&shown.unitLinks.some(a=>a.url.endsWith('#page='+unit.page))&&shown.text.includes(unit.noteAsWritten)&&shown.text.includes(unit.vehicleGates.toLocaleString('en-AU')+' planned vehicle gate'+(unit.vehicleGates===1?'':'s')),shown.unitLinks);
    check(view.name+' '+scope+' explains no conversion or financial update without claiming payment',/no confirmed conversion to planned gate openings/.test(shown.text)&&/do not change programme totals, recorded work, percentages, Revenue or Direct costs/.test(shown.text)&&!/(?:confirmed paid|payment confirmed|paid in full)/i.test(shown.text));
    check(view.name+' '+scope+' disclosure fits its phone or desktop width',shown.dimensions.scroll<=shown.dimensions.client+1&&shown.dimensions.document<=shown.dimensions.window+1,shown.dimensions);
    await fold.locator(':scope > summary').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'po850-'+view.name+'-'+scope+'-overview.png')});
    await fold.locator('[data-fc850-matched]').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'po850-'+view.name+'-'+scope+'-sources.png')});
    await fold.locator('[data-fc850-conflict]').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'po850-'+view.name+'-'+scope+'-conflicts.png')});
    // Existing unsaved planner stays usable; its values and estimates cannot
    // affect either the supplementary source quantity or the original readings.
    await fold.locator(':scope > summary').click();await openFold(p,scope,'guide');
    const form=host.locator('[data-fc849-guide]');for(const [name,value]of Object.entries({length:'100',gatePanels:'2',gateOpenings:'2'}))await form.locator('[name="'+name+'"]').fill(value);
    await form.locator('[name="braced"]').setChecked(true);const guide=guideRows(await localState(p,scope));
    check(view.name+' '+scope+' existing independent guide remains correct and editable',guide['Total panels']==='42'&&guide['Line feet / blocks']==='43'&&guide['Braces / stays']==='27–28',guide);
    await openFold(p,scope,'po-quantities');await p.evaluate(scope=>scope==='today'?renderToday():renderFencing(),scope);
    const state=await localState(p,scope);
    check(view.name+' '+scope+' existing fold cache and guide survive native redraw',state.open.includes('po-quantities')&&state.open.includes('guide')&&state.values.length==='100'&&guideRows(state)['Line feet / blocks']==='43',state);
    check(view.name+' '+scope+' guide edits leave source totals exact',await host.locator('[data-fc850-accepted-total]').innerText()===expectedQuantity.toLocaleString('en-AU'));
    routes.push({scope,shown,guide});
   }
   await route(p,'today');const returned=await localState(p,'today');
   check(view.name+' returning to Today preserves its supplier disclosure and unsaved guide',returned.open.includes('po-quantities')&&returned.values.length==='100',returned);
   const after=await protectedSnapshot(p,day),afterTable=await table(p);
   check(view.name+' all interaction and guard probes preserve eight counts, percentages and all financial/source outputs',unchanged(before,after)&&same(beforeTable,afterTable));
   check(view.name+' zero JavaScript errors',!session.errors.length,session.errors);
   report.views.push({view,model,routes});await session.browser.close();session=null;
  }
 }catch(error){check('Focused browser audit completed',false,error.stack);}
 finally{
  if(session)await session.browser.close();await guard.closeAll();report.guard=guard;
  check('Frozen candidate and independent private source oracle unchanged',hash(fs.readFileSync(PAGE))===CANDIDATE_SHA&&hash(fs.readFileSync(ORACLE))===report.oracle);
  check('All non-GET requests blocked with zero operational write attempts',guard.nonGetSeen.length===guard.blocked.length&&!guard.nonGetSeen.some(r=>r.operational),guard.nonGetSeen);
  const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));
  check('No unexpected console errors',!unexpected.length,unexpected);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;save();
  console.log(JSON.stringify({passed:report.passed,total:report.total,out:OUT}));if(report.passed!==report.total)process.exitCode=1;
 }
}
if(require.main===module)run().catch(error=>{console.error(error.message);process.exitCode=2;});
