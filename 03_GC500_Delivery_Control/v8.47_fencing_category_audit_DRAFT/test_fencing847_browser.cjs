// Author: Andrew Fisher. Independent, read-only fencing classification/browser audit.
// PAGE, BASE, CANDIDATE_SHA and private OUT are required. LIVE=1 uses actual public HTML.
// No private quantities, docket identities or evidence are embedded in this runner.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),round=n=>Math.round(n*100)/100;
const number=value=>value==null||String(value).trim()===''||!Number.isFinite(Number(value))?null:Number(value);
const fmt=value=>typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('en-AU',{maximumFractionDigits:2}):'—';
const fullPhase=phase=>phase==='Build'||phase==='Event';

// Deliberately derive membership and plan totals from the native records, not the new model.
function installationOracle(input,id){
 const matches=input.columns.filter(c=>c.key===id),column=matches.length===1?matches[0]:null;
 if(!column)throw Error('Native column must be unique: '+id);
 const weeks=input.weeks.filter(w=>fullPhase(w.phase)),names=new Set(weeks.map(w=>w.sheet));
 const records=input.dockets.filter(d=>{const q=number(d.quantities?.[id]);
  if(!d.usable||!/^\d{4}-\d{2}-\d{2}$/.test(d.date||'')||d.date>input.day||(d.scope||'programme')!=='programme'||!names.has(d.week)||q==null||q<=0||column.unit==='each'&&!Number.isInteger(q))return false;
  const dated=input.weeks.find(w=>w.start&&w.end&&w.start<=d.date&&w.end>=d.date);
  return !dated||fullPhase(dated.phase)&&dated.sheet===d.week;
 });
 let total=0,build=0,event=0,plannedByDay=0,future=0,known=!!column.programme_type,seen=new Set();
 for(const w of weeks){const plan=input.plans.find(p=>p.week===w.sheet)?.plan,q=number(plan?.totals?.[column.programme_type]);
  if(!plan||!plan.sheet||seen.has(plan.sheet)||!(plan.year===2026||plan.rolled_forward)||q==null||q<0||column.unit==='each'&&!Number.isInteger(q)){known=false;continue;}
  seen.add(plan.sheet);total+=q;if(w.phase==='Build')build+=q;else event+=q;
  for(const day of plan.days||[]){const q=number(day.totals?.[column.programme_type]);if(q==null)continue;if(day.date<=input.day)plannedByDay+=q;else future+=q;}
 }
 return {id,unit:column.unit==='hr'?'h':column.unit,records,recorded:round(records.reduce((s,d)=>s+Number(d.quantities[id]),0)),planned:known?round(total):null,build:round(build),event:round(event),plannedByDay:round(plannedByDay),future:round(future)};
}
async function readNative(page){return page.evaluate(()=>{
 const day=TodayWork840.report().asOf||todayIso();
 return {day,weeks:DATA.weeks,columns:FCOL,plans:DATA.weeks.map(w=>({week:w.sheet,plan:progSheetOf(w.sheet)})),
  dockets:allDockets(),papers:allDockets().map(d=>({id:String(d.id),papers:[...docketPapersOf(d.id),...docketPapersByName(d)].filter(p=>p?.id).map(p=>({id:String(p.id),state:photoFor(p).state,url:photoFor(p).url||null}))})),
  groupMoney:todayGroupDetails841(day,todayWorkMetrics840(day)).fencing.money,
  assetTypes:todayTypeMetrics843(day).instruments.filter(t=>t.kind==='asset-type')};
 });}
async function closeDialog(page){
 if(!await page.locator('#gc500-work-dialog840').evaluate(d=>d.open))return;
 await page.evaluate(()=>{window.__closed847=false;document.querySelector('#gc500-work-dialog840').addEventListener('close',()=>{window.__closed847=true;},{once:true});});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__closed847&&!document.querySelector('#gc500-work-dialog840').open);
}
async function readBoard(page){return page.locator('[data-tw840-area="fencing"]').evaluate(card=>({text:card.innerText,scroll:card.scrollWidth,client:card.clientWidth,
 rows:[...card.querySelectorAll('[data-tw840-fence-row]')].map(row=>({id:row.dataset.tw840FenceRow,text:row.innerText,
  quantities:Object.fromEntries([...row.querySelectorAll('[data-tw842-fence-value]')].map(b=>[b.dataset.tw842FenceValue,b.querySelector('strong')?.textContent])),
  percent:row.querySelector('.tw841-fence-percent')?.textContent,percentKnown:row.querySelector('.tw841-fence-percent')?.dataset.known,
  plan:row.querySelector('[data-tw842-fence-plan]')?.textContent,status:row.querySelector('[data-tw842-fence-plan]')?.dataset.status,
  provisional:row.querySelector('[data-tw842-fence-plan]')?.dataset.provisional,
  buttons:[...row.querySelectorAll('button')].map(b=>({text:b.innerText,aria:b.getAttribute('aria-label'),rect:b.getBoundingClientRect().toJSON()}))})),
 programme:[...card.querySelectorAll('[data-tw841-programme-row]')].map(row=>({id:row.dataset.tw841ProgrammeRow,text:row.textContent,
  remaining:row.querySelector('[data-tw841-value="remaining"] dd')?.textContent,gap:row.querySelector('.tw841-programme-gap')?.textContent}))}));}
async function readModel(page){return page.evaluate(()=>{
 const day=TodayWork840.report().asOf||todayIso(),fencing=todayFencingSummary847(day),summary=todayWorkSummary847(day),types=todayTypeMetrics843(day);
 return {day,report:TodayWork840.report(),fencing,summary,types,
  linked:fencing.summaryRows.map(row=>({id:row.id,value:todayLinkedFencing844(row.id,day)})),
  reviews:allDockets().map(d=>({id:String(d.id),review:fenceCcbReview847(d)}))};
 });}

async function run(){
 const {PAGE,BASE,OUT,CANDIDATE_SHA}=process.env;
 if(!PAGE||!BASE||!OUT||!CANDIDATE_SHA)throw Error('Set frozen PAGE, BASE, CANDIDATE_SHA and private OUT');
 const bytes=fs.readFileSync(PAGE);if(sha(bytes)!==CANDIDATE_SHA)throw Error('Frozen candidate hash differs');
 fs.mkdirSync(OUT,{recursive:true});const live=process.env.LIVE==='1',guard=installWriteGuard();
 const {open}=require(path.join(process.env.GC500_TOOLCHAIN||path.resolve(__dirname,'../toolchain'),'harness/open_page.js'));
 const report={author:'Andrew Fisher',at:new Date().toISOString(),candidate:CANDIDATE_SHA,base:sha(fs.readFileSync(BASE)),live,checks:[],views:[]};
 const save=()=>fs.writeFileSync(path.join(OUT,'fencing847.json'),JSON.stringify(report,null,2));
 const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});save();if(!pass)console.log('FAIL '+name);};
 let session,baseline;
 try{
  session=await open({pageFile:BASE,hash:'#today',W:1366,H:768});await ready840(session.page);
  baseline={snapshot:await nativeSnapshot(session.page),native:await readNative(session.page)};
  check('Baseline shared records hydrated without runtime errors',baseline.snapshot.collections&&Object.keys(baseline.snapshot.collections).length>0&&!session.errors.length,session.errors);
  await session.browser.close();session=null;
  const views=[{name:'laptop',W:1366,H:768,dpr:1},{name:'phone',W:390,H:844,dpr:2,mobile:true}].filter(v=>!process.env.VIEWS||process.env.VIEWS.split(',').includes(v.name));
  for(const view of views){
   console.log('START '+view.name);session=await open({pageFile:live?undefined:PAGE,hash:'#today',...view});const p=session.page;
   if(live){const up=guard.fulfilledDocuments.at(-1),got=guard.documentResponses.at(-1),bom=bytes.subarray(0,3).equals(Buffer.from([239,187,191]));
    const stripped=bom&&got?.sha===sha(bytes.subarray(3))&&got.bytes===bytes.length-3;
    const exact=up?.status===200&&up.sha===CANDIDATE_SHA&&up.bytes===bytes.length&&got?.status===200&&(got.sha===CANDIDATE_SHA&&got.bytes===bytes.length||stripped)&&session.counts.page===0;
    check(view.name+' exact public bytes with no local HTML replacement',exact,{up,got,stripped,counts:session.counts});if(!exact)throw Error('Public source identity differs');
   }
   await ready840(p);await p.waitForFunction(()=>typeof todayFencingSummary847==='function'&&typeof todayWorkSummary847==='function'&&TodayWork840.report().typesMerged);
   await p.evaluate(()=>{localStorage.setItem('gc500.band','shown');photoIndex();});await p.waitForFunction(()=>['ready','failed'].includes(DOCS.state));
   await p.waitForFunction(()=>todayWorkSummary847(TodayWork840.report().asOf).fencingRows.filter(r=>r.classificationPending).every(r=>{
    const text=document.querySelector('[data-tw840-fence-row="'+r.id+'"]')?.textContent||'';
    const format=n=>n.toLocaleString('en-AU',{maximumFractionDigits:2});
    return text.includes('Confirmed recorded: '+format(r.confirmedRecorded))&&text.includes('Pending recorded allocation: '+format(r.pendingRecorded));
   }),null,{timeout:15000});
   const before=await nativeSnapshot(p),native=await readNative(p),model=await readModel(p),board=await readBoard(p);
   report.views.push({view,native,model,board});
   check(view.name+' candidate preserves all shared collections and native helpers',same(before.collections,baseline.snapshot.collections)&&same(before.functions,baseline.snapshot.functions),{collectionsMatch:same(before.collections,baseline.snapshot.collections),helpersMatch:same(before.functions,baseline.snapshot.functions)});
   check(view.name+' candidate preserves fencing money rates and native docket records',same(native.dockets,baseline.native.dockets)&&same(native.columns,baseline.native.columns)&&same(native.groupMoney,baseline.native.groupMoney),{docketsMatch:same(native.dockets,baseline.native.dockets),columnsMatch:same(native.columns,baseline.native.columns),groupMoneyMatch:same(native.groupMoney,baseline.native.groupMoney)});
   check(view.name+' all non-fencing type quantities plans and memberships are preserved',same(native.assetTypes,baseline.native.assetTypes));
   await assertModelAndUI(p,check,view.name,native,model,board,OUT);
   const after=await nativeSnapshot(p),afterNative=await readNative(p);
   check(view.name+' audit leaves native records financial outputs and media unchanged',same(before.collections,after.collections)&&same(before.functions,after.functions)&&same(before.media,after.media)&&same(native.dockets,afterNative.dockets)&&same(native.columns,afterNative.columns)&&same(native.groupMoney,afterNative.groupMoney),{collections:same(before.collections,after.collections),money:same(native.groupMoney,afterNative.groupMoney)});
   check(view.name+' no runtime errors',!session.errors.length,session.errors);
   await session.browser.close();session=null;console.log('DONE '+view.name);
  }
 }catch(error){check('Browser audit completed',false,error.stack);}
 finally{
  if(session)await session.browser.close();await guard.closeAll();report.guard=guard;
  check('Frozen candidate unchanged',sha(fs.readFileSync(PAGE))===CANDIDATE_SHA);
  check('All non-GETs blocked and no operational writes attempted',guard.nonGetSeen.length===guard.blocked.length&&!guard.nonGetSeen.some(r=>r.operational),guard.nonGetSeen);
  const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));
  check('No unexpected console errors',!unexpected.length,unexpected);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;save();
  console.log(JSON.stringify({passed:report.passed,total:report.total,out:OUT}));if(report.passed!==report.total)process.exitCode=1;
 }
}
async function assertModelAndUI(page,check,label,native,model,board,out){
 const all=model.summary.fencingRows,ids=all.map(r=>r.id),ccb=['ccb_event','ccb_demarc'];
 check(label+' every supported fencing work type retains a single linked UI row',same(board.rows.map(r=>r.id),ids)&&new Set(ids).size===ids.length,{model:ids,ui:board.rows.map(r=>r.id)});
 check(label+' installation scope explicitly includes Build and Event',/Build\s*(?:\+|and|&).*Event|installation programme/i.test(board.text),board.text);
 check(label+' fencing card fits the viewport',board.scroll<=board.client+1,{scroll:board.scroll,client:board.client});
 for(const row of all){
  const oracle=installationOracle(native,row.id),shown=board.rows.find(r=>r.id===row.id),linked=model.linked.find(r=>r.id===row.id).value;
  check(label+' '+row.id+' recorded numerator retains exact native full-installation membership',row.done===oracle.recorded&&same(linked.dockets.map(d=>String(d.id)),oracle.records.map(d=>String(d.id))),{actual:row.done,expected:oracle.recorded,linked:linked.dockets.map(d=>d.id),native:oracle.records.map(d=>d.id)});
  if(row.kind!=='recorded-only')check(label+' '+row.id+' programme includes complete Build and Event quantities',row.total===oracle.planned,{actual:row.total,expected:oracle.planned,build:oracle.build,event:oracle.event,future:oracle.future});
  check(label+' '+row.id+' displayed quantities match the qualified source model',shown&&['total','done','left'].every(k=>shown.quantities[k]===fmt(row[k])),{model:{total:row.total,done:row.done,left:row.left},shown:shown?.quantities});
  const type=model.types.instruments.find(t=>t.kind==='fence-work'&&t.fenceId===row.id);
  check(label+' '+row.id+' type adapter retains qualified percentage residual and plan',type&&['total','done','left','pct'].every(k=>same(type[k],row[k]))&&same(type.plan,row.plan),{row,type});
  if(ccb.includes(row.id)&&row.classificationPending){
   check(label+' '+row.id+' unresolved classification cannot claim completion remaining or pace',row.pct==null&&row.left==null&&row.remaining==null&&row.plan.status==='unknown'&&row.plan.delta==null&&shown.percentKnown==='false'&&shown.quantities.left==='—'&&!/100\s*%|ahead of|plan met/i.test(shown.text)&&/category|classif/i.test(shown.text)&&/unconfirmed|pending|review/i.test(shown.text),{row,shown});
  }
  if(row.sourceProvisional)check(label+' '+row.id+' source uncertainty is visible beside the total',/provisional|source.*review|programme.*unconfirmed/i.test(shown.text),{sourceIssues:row.sourceIssues,shown});
  if(ccb.includes(row.id)){
   const reviews=oracle.records.map(d=>({d,review:model.reviews.find(r=>r.id===String(d.id))?.review}));
   const confirmed=round(reviews.filter(x=>x.review?.state==='confirmed'&&x.review.confirmedType===row.id).reduce((sum,x)=>sum+Number(x.d.quantities[row.id]),0));
   const pending=round(reviews.filter(x=>x.review?.state!=='confirmed').reduce((sum,x)=>sum+Number(x.d.quantities[row.id]),0));
   check(label+' '+row.id+' source-reviewed and pending metres reconcile without reallocating money',row.confirmedRecorded===confirmed&&row.pendingRecorded===pending&&round(confirmed+pending)===oracle.recorded&&(!row.classificationPending||shown.text.includes('Confirmed recorded: '+fmt(confirmed))&&shown.text.includes('Pending recorded allocation: '+fmt(pending))),{confirmed,pending,row,shown});
  }
 }
 const combined=ccb.map(id=>all.find(r=>r.id===id)),anyPending=combined.some(r=>r.pendingRecorded>0);
 check(label+' uncertainty in either CCB category qualifies both category comparisons',!anyPending||combined.every(r=>r.classificationPending&&r.pct==null&&r.left==null&&r.plan.status==='unknown'),combined);
 for(const id of ccb){const disclosure=board.programme.find(r=>r.id===id);
  check(label+' '+id+' whole-programme disclosure also qualifies unresolved category',!anyPending||disclosure&&disclosure.remaining?.trim().startsWith('—')&&/category|classif/i.test(disclosure.text)&&!/\b[\d,.]+\s*m\s*behind/i.test(disclosure.gap||''),disclosure);
 }
 // Original source papers and map/record controls stay beside every contributing docket.
 for(const id of ['clean',...ccb]){
  const row=all.find(r=>r.id===id),linked=model.linked.find(r=>r.id===id).value;
  const button=page.locator('[data-tw840-fence-row='+JSON.stringify(id)+'] [data-tw840-fence-detail]').first();
  await button.scrollIntoViewIfNeeded();await button.click();await page.waitForFunction(()=>document.querySelector('#gc500-work-dialog840')?.open);
  const shown=await page.locator('#gc500-work-dialog840').evaluate(d=>({text:d.innerText,scroll:d.scrollWidth,client:d.clientWidth,rect:d.getBoundingClientRect().toJSON(),
   dockets:[...d.querySelectorAll('[data-tw844-docket]')].map(r=>({key:r.dataset.tw844Docket,text:r.innerText,value:r.querySelector('header strong')?.textContent,
    classification:r.querySelector('[data-tw847-classification]')?.dataset.tw847Classification||null,
    actions:[...r.querySelectorAll('[data-tw844-source-action]')].map(b=>JSON.parse(decodeURIComponent(b.dataset.tw844SourceAction))),
    links:[...r.querySelectorAll('a[href]')].map(a=>({href:a.getAttribute('href'),text:a.textContent})),
    papers:[...r.querySelectorAll('[data-tw844-photo]')].map(p=>({id:p.dataset.tw844Photo,state:p.dataset.tw844PhotoState,href:p.querySelector('a')?.getAttribute('href')||null}))})),
   planned:[...d.querySelectorAll('[data-tw844-planned-location]')].map(r=>({id:r.dataset.tw844PlannedLocation,text:r.innerText}))}));
  check(label+' '+id+' dialog keeps every exact contributing docket and planned source',same(shown.dockets.map(r=>r.key),linked.dockets.map(d=>d.key))&&same(shown.planned.map(r=>r.id),linked.plannedLocations.map(r=>r.id)),{expectedDockets:linked.dockets.map(d=>d.key),shown});
  const bad=[];
  for(const docket of linked.dockets){
   const dom=shown.dockets.find(r=>r.key===docket.key),source=native.papers.find(r=>r.id===String(docket.id)),review=model.reviews.find(r=>r.id===String(docket.id))?.review;
   if(!dom||dom.value!==fmt(docket.quantity)||!dom.text.includes(docket.location)||!same(dom.actions,[docket.recordAction,...docket.areas.map(a=>a.action)]))bad.push({id:docket.id,kind:'record actions or native quantity',dom,docket});
   const expectedIds=[...new Set(source.papers.map(p=>p.id))].sort();
   if(!same(docket.papers.map(p=>p.id).sort(),expectedIds))bad.push({id:docket.id,kind:'model dropped native paper',expectedIds,actual:docket.papers});
   for(const paper of docket.papers){const nativePaper=source.papers.find(p=>p.id===paper.id);
    if(paper.state!==nativePaper.state||paper.state==='ready'&&paper.url!==nativePaper.url||paper.state==='ready'&&!dom.links.some(l=>l.href===paper.url))bad.push({id:docket.id,kind:'source paper link',paper,nativePaper,dom});
   }
   if(ccb.includes(id)&&review.state==='pending'&&!/unconfirmed|pending|needs review/i.test(dom.text))bad.push({id:docket.id,kind:'pending classification badge absent',review,dom});
   if(ccb.includes(id)&&review.state==='confirmed'&&!/confirm|reviewed/i.test(dom.text))bad.push({id:docket.id,kind:'confirmed classification badge absent',review,dom});
  }
  check(label+' '+id+' native papers actions quantities and classification badges remain linked',!bad.length,bad);
  check(label+' '+id+' qualified source dialog fits without horizontal clipping',shown.scroll<=shown.client+1&&shown.rect.left>=0&&shown.rect.right<=page.viewportSize().width+1,{rect:shown.rect,scroll:shown.scroll,client:shown.client});
  if(id==='ccb_event'){const heading=page.locator('#gc500-work-dialog840 .tw840-dialog-top');await heading.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'fencing847-'+label+'-event-detail.png')});}
  await closeDialog(page);
 }
 // Exercise an Event-week docket without writing a collection: replace only the read function in memory.
 const synthetic=await page.evaluate(()=>{
  const event=(DATA.weeks||[]).find(w=>w.phase==='Event'&&w.start&&w.end);if(!event)return {skipped:'No native Event week'};
  const original=allDockets,records=original(),day=event.start,id='qa-event-horizon847',key='ccb_event',quantity=11.25;
  const before=todayFencingSummary847(day).summaryRows.find(r=>r.id===key);
  let after,linked,review;
  try{const docket={id,docket_no:'QA-EVENT',date:day,week:event.sheet,scope:'programme',usable:true,location:'Synthetic Event-week area',note:'CCB; event or demarcation classification not supplied',quantities:{[key]:quantity},components:{}};
   allDockets=()=>records.concat(docket);after=todayFencingSummary847(day).summaryRows.find(r=>r.id===key);linked=todayLinkedFencing844(key,day).dockets.filter(d=>d.id===id);review=fenceCcbReview847(docket);
  }finally{allDockets=original;}
  return {day,quantity,before,after,linked,review,restored:allDockets===original};
 });
 check(label+' synthetic Event-week work enters the installation horizon with pending classification',!synthetic.skipped&&synthetic.restored&&round(synthetic.after.recorded-synthetic.before.recorded)===synthetic.quantity&&synthetic.linked.length===1&&synthetic.linked[0].quantity===synthetic.quantity&&synthetic.review.state==='pending'&&synthetic.after.pct==null&&synthetic.after.remaining==null,synthetic);
 const provenance=await page.evaluate(()=>{
  const records=allDockets(),target=records.find(d=>fenceCcbReview847(d).state==='confirmed');
  if(!target)return {available:false};
  const confirmed=fenceCcbReview847(target),changedNote={...target,note:String(target.note||'')+' [synthetic audit revision]'};
  const note=fenceCcbReview847(changedNote),duplicate=fenceCcbReview847(target,{records:records.concat({...target})});
  const index=photoIndex(),files={...index.files},sourceId=confirmed.sourceRefs[0].id;
  files[sourceId]={...files[sourceId],sha256:files[sourceId].sha256==='0'.repeat(64)?'1'.repeat(64):'0'.repeat(64)};
  const source=fenceCcbReview847(target,{files}),after=fenceCcbReview847(target);
  return {available:true,confirmed,note,duplicate,source,after};
 });
 check(label+' changed docket text invalidates its source classification review',provenance.available&&provenance.note.state==='pending'&&provenance.note.reviewState==='stale',provenance);
 check(label+' duplicate docket identity never inherits a confirmed category',provenance.available&&provenance.duplicate.state==='pending'&&provenance.duplicate.reviewState==='ambiguous',provenance.duplicate);
 check(label+' changed source checksum invalidates category confirmation without mutation',provenance.available&&provenance.source.state==='pending'&&provenance.source.reviewState==='stale'&&same(provenance.after,provenance.confirmed),provenance);
 await page.locator('[data-tw840-fence-row="ccb_event"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'fencing847-'+label+'-event-row.png')});
 await page.evaluate(()=>go('fencing'));await page.waitForFunction(()=>document.querySelector('#pane-fencing [data-tw847-category-overview]'));
 const nativePane=await page.locator('#pane-fencing').evaluate(p=>({overview:p.querySelector('[data-tw847-category-overview]')?.innerText,
  rows:[...p.querySelectorAll('[data-fp-id]')].map(r=>({id:r.dataset.fpId,badges:[...r.querySelectorAll('[data-tw847-classification]')].map(b=>({state:b.dataset.tw847Classification,text:b.innerText})),detail:r.querySelector('[data-tw847-category-detail]')?.textContent}))}));
 const expectedReviews=model.reviews.filter(r=>r.review.state!=='not-applicable'&&native.dockets.find(d=>String(d.id)===r.id)?.usable);
 check(label+' Fencing book distinguishes CCB from temporary fence and retains every category warning',/separate from temporary fence/i.test(nativePane.overview||'')&&expectedReviews.every(r=>{const shown=nativePane.rows.find(s=>s.id===r.id);return shown&&shown.badges.length===1&&shown.badges[0].state===r.review.state&&(r.review.state!=='pending'||/needs review/i.test(shown.badges[0].text)&&/not confirmed completion/i.test(shown.detail||''));}),{shown:nativePane,expected:expectedReviews});
 await page.locator('#pane-fencing [data-tw847-category-overview]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'fencing847-'+label+'-native-book.png')});
 await page.evaluate(()=>go('today'));await page.waitForFunction(()=>document.querySelector('[data-tw840-area="fencing"]'));
}
module.exports={installationOracle,readNative,readModel,readBoard};
if(require.main===module)run().catch(error=>{console.error(error.message);process.exitCode=2;});
