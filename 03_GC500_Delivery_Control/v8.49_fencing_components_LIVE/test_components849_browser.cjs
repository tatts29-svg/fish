// Author: Andrew Fisher. Independent read-only component, guide and preservation checks.
// Run under flock /tmp/gc500-browser.lock with frozen PAGE, BASE, CANDIDATE_SHA,
// private ORACLE/source-audit.json and private OUT. LIVE=1 requires owner approval.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const same=(a,b)=>canonical(a)===canonical(b);
const baseHash='5d786af57e3986fc912cf34d33f094566a41836ee88a1160f5a3dab05e339a47';
const section=scope=>'[data-fc849-scope="'+scope+'"]';
async function immutable(page,day){return page.evaluate(day=>{
 const groups=todayGroupDetails841(day,todayWorkMetrics840(day)),functions={};
 for(const name of ['todayFencingSummary848','todayWorkSummary848','fenceInstallationDocketState848','fenceProgressEvidence848','todayLinkedFencing848','costDocket','allDockets','fenceRateFor','fenceCostFor','fenceDerived','fenceByWeek','greenBookTotals','moneySummary','contractCharge','chargeLines','tradeCharges']){
  try{functions[name]=eval(name).toString();}catch{functions[name]=null;}
 }
 return {data:DATA,sourceProgress:FENCE_PROGRESS848,dockets:allDockets(),collections:collectionRows(),green:serviceNoteRows(),
  functions,metrics:todayWorkSummary848(day).fencingRows,finance:{fencing:fenceDerived(),groups:Object.fromEntries(Object.entries(groups).filter(([,v])=>v?.money).map(([k,v])=>[k,v.money]))}};
},day);}
async function localState(page,scope){return page.locator(section(scope)).evaluate(host=>({
 values:Object.fromEntries([...host.querySelectorAll('[data-fc849-guide] input[name],[data-fc849-guide] select[name]')].map(e=>[e.name,e.type==='checkbox'?e.checked:e.value])),
 open:[...host.querySelectorAll('details[data-fc849-fold][open]')].map(e=>e.dataset.fc849Fold),
 output:[...host.querySelectorAll('[data-fc849-guide-output] tbody tr')].map(e=>[...e.querySelectorAll('th,td')].map(x=>x.textContent)),
 guideState:host.querySelector('[data-fc849-guide-state]')?.dataset.fc849GuideState,
 focus:document.activeElement?.id,top:document.querySelector('main').scrollTop,x:scrollX,y:scrollY,
 width:innerWidth,documentWidth:document.documentElement.scrollWidth,client:host.clientWidth,scroll:host.scrollWidth,
}));}
async function originalTable(page){return page.locator('[data-tw847-fence-summary-row]').evaluateAll(rows=>rows.map(row=>({id:row.dataset.tw847FenceSummaryRow,values:[...row.querySelectorAll('[data-tw847-fence-value] strong')].map(n=>n.textContent)})));}
async function openFold(page,scope,key){const fold=page.locator(section(scope)+' [data-fc849-fold="'+key+'"]');if(!await fold.evaluate(e=>e.open))await fold.locator(':scope > summary').click();}
async function fillGuide(page,scope,values){
 const form=page.locator(section(scope)+' [data-fc849-guide]');
 for(const [key,value]of Object.entries(values)){
  const field=form.locator('[name="'+key+'"]');
  if(typeof value==='boolean')await field.setChecked(value);else if(key==='layout')await field.selectOption(value);else await field.fill(String(value));
 }
}
function guideRows(value){return Object.fromEntries(value.output.map(r=>[r[0],r[1]]));}
async function route(page,scope){
 await page.evaluate(scope=>go(scope),scope);
 if(scope==='today'){
  const fold=page.locator('details[data-tw848-group-fold="fencing"]');if(!await fold.evaluate(e=>e.open))await fold.locator(':scope > summary').click();
 }
 await page.locator(section(scope)).waitFor({state:'visible'});
}
async function run(){
 const {PAGE,BASE,OUT,ORACLE,CANDIDATE_SHA}=process.env;
 if(!PAGE||!BASE||!OUT||!ORACLE||!CANDIDATE_SHA)throw Error('Set frozen PAGE, BASE, OUT, ORACLE and CANDIDATE_SHA');
 const bytes=fs.readFileSync(PAGE),oracleBytes=fs.readFileSync(ORACLE),oracle=JSON.parse(oracleBytes);
 if(hash(bytes)!==CANDIDATE_SHA||hash(fs.readFileSync(BASE))!==baseHash)throw Error('Frozen candidate or base identity differs');
 if(oracle.author!=='Andrew Fisher'||!oracle.recorded_hire_docket_component_totals||!oracle.collection_component_totals)throw Error('Independent source oracle schema unavailable');
 const day=process.env.AS_OF||oracle.audit_date_aest,live=process.env.LIVE==='1';fs.mkdirSync(OUT,{recursive:true});
 const report={author:'Andrew Fisher',at:new Date().toISOString(),candidate:CANDIDATE_SHA,base:baseHash,oracle:hash(oracleBytes),day,live,checks:[],views:[]};
 const save=()=>fs.writeFileSync(path.join(OUT,'components849.json'),JSON.stringify(report,null,2));
 const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});save();console.log((pass?'PASS ':'FAIL ')+name);};
 const guard=installWriteGuard(),{open}=require(path.join(process.env.GC500_TOOLCHAIN||path.resolve(__dirname,'../toolchain'),'harness/open_page.js'));let session;
 try{
  session=await open({pageFile:BASE,hash:'#today',W:1366,H:900});await ready840(session.page);
  await session.page.evaluate(day=>{state.asOf=day;photoIndex();renderToday();},day);await session.page.waitForFunction(()=>DOCS.state==='ready');
  const baseline={immutable:await immutable(session.page,day),native:await nativeSnapshot(session.page)};
  check('Exact baseline hydrated with no runtime errors',!session.errors.length&&Object.keys(baseline.native.collections).length>0,{errors:session.errors,collections:Object.keys(baseline.native.collections).length});
  await session.browser.close();session=null;
  for(const view of [{name:'laptop',W:1366,H:900,dpr:1},{name:'phone',W:390,H:844,dpr:2,mobile:true}]){
   session=await open({pageFile:live?undefined:PAGE,hash:'#today',...view});const p=session.page;
   if(live){const upstream=guard.fulfilledDocuments.at(-1),browser=guard.documentResponses.at(-1),bom=bytes.subarray(0,3).equals(Buffer.from([239,187,191]));
    const exact=upstream?.sha===CANDIDATE_SHA&&upstream.bytes===bytes.length&&browser?.status===200&&(browser.sha===CANDIDATE_SHA&&browser.bytes===bytes.length||bom&&browser.sha===hash(bytes.subarray(3))&&browser.bytes===bytes.length-3)&&session.counts.page===0;
    check(view.name+' exact public bytes and zero local substitutions',exact,{upstream,browser,counts:session.counts});if(!exact)throw Error('Public source identity differs');}
   await ready840(p);await p.waitForFunction(()=>typeof fenceComponents849==='function'&&typeof fenceGuide849==='function');
   await p.evaluate(day=>{state.asOf=day;photoIndex();renderToday();},day);await p.waitForFunction(()=>DOCS.state==='ready');
   // Redraw once source availability is settled; the application may also redraw on its normal poll.
   await p.evaluate(()=>renderToday());
   const before={immutable:await immutable(p,day),native:await nativeSnapshot(p)};
   const beforeTable=await originalTable(p);
   check(view.name+' original eight type totals, financial outputs and full source data remain exact',same(before.immutable,baseline.immutable));
   check(view.name+' all shared collections, native functions and video descriptors remain exact',same(before.native.collections,baseline.native.collections)&&same(before.native.functions,baseline.native.functions)&&same(before.native.media,baseline.native.media));
   const model=await p.evaluate(day=>({ledger:fenceComponents849(day),evidence:typeof fenceComponentEvidence849==='function'?fenceComponentEvidence849(day):null,guide:fenceGuide849({length:100,gatePanels:2,gateOpenings:2,layout:'straight',braced:true})}),day);
   for(const [kind,want]of [['recorded',oracle.recorded_hire_docket_component_totals],['collections',oracle.collection_component_totals]]){
    check(view.name+' '+kind+' quantities match independent source audit without netting',Object.entries(want).every(([id,value])=>model.ledger[kind].find(r=>r.id===id)?.quantity===value),{expected:want,actual:model.ledger[kind]});
   }
   const pure=oracle.red_records.filter(r=>!Object.values(r.existing_quantities_unchanged||{}).some(n=>n>0)&&Object.values(r.components_recorded||{}).some(n=>n>0));
   check(view.name+' component-only dated dockets remain in source ledger',pure.length>0&&pure.every(r=>model.ledger.rows.some(row=>row.number===r.number)),{expected:pure.map(r=>r.number),actual:model.ledger.rows.map(r=>r.number)});
   const q=model.guide.quantities;
   check(view.name+' independent guide arithmetic corrects both line ends and keeps run uncertainty',q.panels.quantity===42&&q.fixedPanels.quantity===40&&q.fixedRuns.quantity===3&&q.lineFeet.quantity===43&&q.fixedClamps.quantity===37&&q.hingeClamps.quantity===4&&q.guideStays.quantity===27&&q.stays.min===27&&q.stays.max===28,model.guide);
   check(view.name+' source differences remain separate with no inferred gate addition',model.evidence&&model.evidence.issues.length>0&&before.immutable.metrics.find(r=>r.id==='v_gates').recorded===baseline.immutable.metrics.find(r=>r.id==='v_gates').recorded,model.evidence);
   const stale=await p.evaluate(day=>{
    const item=FENCE_EVIDENCE849.items[0],files={...photoIndex().files};
    for(const id of item.source_ids)files[id]={...files[id],sha256:'0'.repeat(64)};
    return {id:item.id,evidence:fenceComponentEvidence849(day,{files}),ledger:fenceComponents849(day),metrics:todayWorkSummary848(day).fencingRows};
   },day);
   check(view.name+' unavailable reviewed sources hold back only supplementary findings',stale.evidence.pending.some(r=>r.id===stale.id)&&!stale.evidence.issues.some(r=>r.id===stale.id)&&same(stale.ledger,model.ledger)&&same(stale.metrics,before.immutable.metrics),stale.evidence);
   const routes=[];
   for(const scope of ['today','fencing']){
    await route(p,scope);const host=p.locator(section(scope));
    const shown=await host.evaluate(e=>({counts:Object.fromEntries([...e.querySelectorAll('[data-fc849-count]')].map(n=>[n.dataset.fc849Count,n.textContent])),text:e.textContent,links:[...e.querySelectorAll('a[href]')].map(n=>({text:n.textContent,url:n.href,rel:n.rel}))}));
    check(view.name+' '+scope+' displays all six recorded component totals separately',model.ledger.recorded.every(row=>shown.counts['recorded-'+row.id]===(row.quantity==null?'Not recorded':row.quantity.toLocaleString('en-AU')+' each')),shown.counts);
    check(view.name+' '+scope+' original papers and supplier P/O summary links are usable',shown.links.some(a=>/^P\/O .*supplier summary/.test(a.text))&&shown.links.every(a=>{const u=new URL(a.url);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&a.rel.includes('noopener');}),{links:shown.links});
    check(view.name+' '+scope+' makes collection, stock and scrim limits explicit',/not current stock/.test(shown.text)&&/not subtracted/.test(shown.text)&&/do not prove scrim is fitted/.test(shown.text),shown.text.slice(0,700));
    await host.locator('h4').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'components849-'+view.name+'-'+scope+'-recorded.png')});
    await openFold(p,scope,'recorded-brace');
    const rows=await host.locator('[data-fc849-fold="recorded-brace"]').innerText();
    check(view.name+' '+scope+' source disclosure includes component-only brace records',pure.filter(r=>r.components_recorded?.brace>0).every(r=>rows.includes('Docket '+r.number)),{dockets:pure.filter(r=>r.components_recorded?.brace>0).map(r=>r.number)});
    // Collapse a long source list before entering the guide.
    await host.locator('[data-fc849-fold="recorded-brace"] > summary').click();
    await openFold(p,scope,'guide');
    const fields=await host.locator('[data-fc849-guide] input,[data-fc849-guide] select').evaluateAll(nodes=>nodes.map(e=>({name:e.name,disabled:e.disabled,readonly:e.readOnly||false})));
    const enabled=fields.length>0&&fields.every(e=>!e.disabled&&!e.readonly);
    check(view.name+' '+scope+' unsaved planning controls are usable through the public view link',enabled,fields);
    if(!enabled){await p.screenshot({path:path.join(OUT,'components849-'+view.name+'-'+scope+'-disabled.png')});continue;}
    await fillGuide(p,scope,{length:100,gatePanels:2,gateOpenings:2,braced:true});
    const example=await localState(p,scope),readings=guideRows(example);
    check(view.name+' '+scope+' form gives the corrected example without changing recorded rows',example.guideState==='ready'&&readings['Total panels']==='42'&&readings['Line feet / blocks']==='43'&&readings['Fixed-joint clamps']==='37'&&readings['Gate hinge clamps']==='4'&&readings['Braces / stays']==='27–28',example);
    const length=host.locator('[name="length"]');await length.scrollIntoViewIfNeeded();await length.focus();const preEdit=await localState(p,scope);await length.fill('120');const edited=await localState(p,scope);
    check(view.name+' '+scope+' editing keeps focus and main scroll stable',preEdit.focus===edited.focus&&Math.abs(preEdit.top-edited.top)<=1&&preEdit.x===edited.x&&preEdit.y===edited.y,{before:preEdit,after:edited});
    await p.evaluate(scope=>scope==='today'?renderToday():renderFencing(),scope);await p.waitForTimeout(150);const redraw=await localState(p,scope);
    check(view.name+' '+scope+' native redraw retains input, open guide and exact local output',same(edited.values,redraw.values)&&same(edited.output,redraw.output)&&redraw.open.includes('guide'),{edited,redraw});
    check(view.name+' '+scope+' native redraw retains focused input and scroll',edited.focus===redraw.focus&&Math.abs(edited.top-redraw.top)<=1,{edited,redraw});
    await fillGuide(p,scope,{panels:3,gatePanels:0,gateOpenings:0,braced:false});const shared=guideRows(await localState(p,scope));
    check(view.name+' '+scope+' shared feet use four feet for three contiguous fixed panels',shared['Line feet / blocks']==='4'&&shared['Braces / stays']==='Not established',shared);
    await fillGuide(p,scope,{panels:10,layout:'closed'});const loop=guideRows(await localState(p,scope));
    check(view.name+' '+scope+' closed loop uses ten feet and ten fixed joints',loop['Line feet / blocks']==='10'&&loop['Fixed-joint clamps']==='10',loop);
    await fillGuide(p,scope,{panels:1,gatePanels:2,gateOpenings:1});const invalid=await localState(p,scope);
    check(view.name+' '+scope+' impossible layout reports invalid without stale quantities',invalid.guideState==='invalid'&&invalid.output.length===0,invalid);
    await fillGuide(p,scope,{panels:'',length:100,gatePanels:2,gateOpenings:2,layout:'straight',braced:true});
    const geometry=await localState(p,scope);check(view.name+' '+scope+' component guide has no horizontal overflow',geometry.documentWidth<=geometry.width+1&&geometry.scroll<=geometry.client+1,geometry);
    await host.locator('[data-fc849-fold="guide"] > summary').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'components849-'+view.name+'-'+scope+'.png')});
    await host.locator('[data-fc849-guide-output] table').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'components849-'+view.name+'-'+scope+'-guide-output.png')});routes.push({scope,example,redraw,geometry});
   }
   await route(p,'today');const back=await localState(p,'today');check(view.name+' route return keeps Today planning state separate and unsaved',back.values.length==='100'&&back.values.gatePanels==='2'&&back.open.includes('guide'),back);
   const after={immutable:await immutable(p,day),native:await nativeSnapshot(p)};
   const afterTable=await originalTable(p);
   check(view.name+' all eight original displayed totals and percentages remain unchanged after guide edits',beforeTable.length===8&&same(beforeTable,afterTable),{before:beforeTable,after:afterTable});
   check(view.name+' all guide edits leave work metrics, source data, money and operational collections unchanged',same(before.immutable,after.immutable)&&same(before.native.collections,after.native.collections)&&same(before.native.media,after.native.media));
   check(view.name+' zero runtime errors',!session.errors.length,session.errors);report.views.push({view,model,routes});await session.browser.close();session=null;
  }
 }catch(error){check('Browser audit completed',false,error.stack);}
 finally{
  if(session)await session.browser.close();await guard.closeAll();report.guard=guard;
  check('Frozen candidate and private oracle unchanged',hash(fs.readFileSync(PAGE))===CANDIDATE_SHA&&hash(fs.readFileSync(ORACLE))===report.oracle);
  check('All non-GET requests blocked and no operational write attempts',guard.nonGetSeen.length===guard.blocked.length&&!guard.nonGetSeen.some(r=>r.operational),guard.nonGetSeen);
  const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));
  check('No unexpected console errors',!unexpected.length,unexpected);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;save();
  console.log(JSON.stringify({passed:report.passed,total:report.total,out:OUT}));if(report.passed!==report.total)process.exitCode=1;
 }
}
module.exports={immutable,localState,guideRows};
if(require.main===module)run().catch(error=>{console.error(error.message);process.exitCode=2;});
