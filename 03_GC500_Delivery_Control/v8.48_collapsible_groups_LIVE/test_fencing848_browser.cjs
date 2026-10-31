// Author: Andrew Fisher. Read-only, independent model and disclosure audit.
// Frozen PAGE, BASE, CANDIDATE_SHA, and private OUT are required. LIVE=1 checks
// actual public HTML. All fixtures run only in isolated browser memory.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const {readNative,readModel:readSourceModel,correctedRecord847,assertCorrections847,assertSourceBindings847}=require('../v8.47_fencing_category_audit_LIVE/test_fencing847_browser.cjs');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
const same=(a,b)=>canonical(a)===canonical(b);
const fmt=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-AU',{maximumFractionDigits:2}):'—';
const round=n=>Math.round(n*100)/100;
const groupIds=['buildings','toilets','fencing','generators','lighting','equipment'];
const foldSelector=id=>'details[data-tw848-group-fold="'+id+'"]';

async function dataSnapshot(page){return page.evaluate(()=>{
 const day=TodayWork840.report().asOf,groups=todayGroupDetails841(day,todayWorkMetrics840(day));
 return {data:DATA,finance:{fencing:fenceDerived(),groups:Object.fromEntries(Object.entries(groups).filter(([k,v])=>v?.money).map(([k,v])=>[k,v.money]))},
  sources:{review:DATA.fence_ccb_review847,trace:fenceTraceCurrent837()}};
 });}
async function viewState(page){return page.evaluate(()=>{
 const root=document.querySelector('#gc500-work-board840'),main=document.querySelector('main'),rect=e=>e?.getBoundingClientRect().toJSON();
 return {report:TodayWork840.report(),scroll:{top:main.scrollTop,left:main.scrollLeft,x:scrollX,y:scrollY},focus:document.activeElement?.dataset.tw840Focus||document.activeElement?.id||null,
  pageWidth:innerWidth,documentWidth:document.documentElement.scrollWidth,mainWidth:main.clientWidth,mainScroll:main.scrollWidth,grid:rect(root.querySelector('.tw840-grid')),
  cards:[...root.querySelectorAll('[data-tw840-area]')].map(card=>{
   const fold=card.querySelector('[data-tw848-group-fold]'),summary=fold?.querySelector(':scope > summary'),body=fold?.querySelector('.tw848-group-body'),style=getComputedStyle(card);
   return {id:card.dataset.tw840Area,open:fold?.open,foldCount:card.querySelectorAll('[data-tw848-group-fold]').length,
    text:summary?.innerText,summaryTag:summary?.tagName,nestedInteractive:summary?.querySelectorAll('button,a,input,select,textarea').length,
    summary:rect(summary),body:rect(body),card:rect(card),client:card.clientWidth,scroll:card.scrollWidth,
    verticalChrome:['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((n,key)=>n+(parseFloat(style[key])||0),0),
    running:card.classList.contains('tw840-running'),lamps:card.querySelectorAll('.tw846-lights .tl841-unit').length,
    toggles:[...card.querySelectorAll('details')].map(d=>({key:d.dataset.tw848GroupFold||d.dataset.tw841GroupCard||d.dataset.tw842PlanFold,open:d.open}))};
  })};
 });}
async function motionState(page){return page.evaluate(()=>({report:TodayWork840.report(),active:[...document.querySelectorAll('#gc500-work-board840 .tw840-running')].map(card=>({
 id:card.dataset.tw840Area,open:card.querySelector('[data-tw848-group-fold]')?.open,
 lamp:card.querySelector('.tw846-lights')?.getBoundingClientRect().toJSON(),
 animations:[...card.querySelectorAll('.race-sweep-window,.race-sweep-dots')].map(n=>({name:getComputedStyle(n).animationName,play:getComputedStyle(n).animationPlayState}))}))}));}
async function settle(page){await page.waitForTimeout(180);}
async function setFold(page,id,open){
 const fold=page.locator(foldSelector(id));
 if(await fold.evaluate(d=>d.open)!==open){await fold.locator(':scope > summary').click();await page.waitForFunction(({id,open})=>document.querySelector('details[data-tw848-group-fold="'+id+'"]')?.open===open,{id,open});await settle(page);}
}
async function closeAll(page){for(const id of groupIds)await setFold(page,id,false);}
async function closeDialog(page){
 if(!await page.locator('#gc500-work-dialog840').evaluate(d=>d.open))return;
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#gc500-work-dialog840').open);await settle(page);
}
function geometryChecks(check,label,state){
 check(label+' page and cards fit horizontally',state.documentWidth<=state.pageWidth+1&&state.mainScroll<=state.mainWidth+1&&state.cards.every(c=>c.scroll<=c.client+1),{width:state.pageWidth,document:state.documentWidth,main:[state.mainWidth,state.mainScroll],cards:state.cards.map(c=>({id:c.id,width:c.client,scroll:c.scroll}))});
 check(label+' disclosure summaries are readable touch targets',state.cards.every(c=>c.summary.height>=44&&c.summary.width>=44),state.cards.map(c=>({id:c.id,summary:c.summary})));
 const sorted=[...state.cards].sort((a,b)=>a.card.y-b.card.y||a.card.x-b.card.x);
 check(label+' group cards never overlap',sorted.every((a,i)=>sorted.slice(i+1).every(b=>a.card.right<=b.card.x+1||b.card.right<=a.card.x+1||a.card.bottom<=b.card.y+1||b.card.bottom<=a.card.y+1)),sorted.map(c=>({id:c.id,rect:c.card})));
}
async function assertDisclosures(page,check,label,out){
 let state=await viewState(page);
 check(label+' all six native groups start closed with one whole-card disclosure',same(state.cards.map(c=>c.id),groupIds)&&state.cards.every(c=>c.foldCount===1&&!c.open&&c.summaryTag==='SUMMARY'&&c.nestedInteractive===0),state.cards);
 check(label+' closed summaries keep useful static counts and no hidden lamps running',state.cards.every(c=>c.text?.trim().length>c.id.length&&!c.running)&&state.report.running===null,state);
 geometryChecks(check,label+' closed',state);
 await page.locator('#gc500-work-board840').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'fencing848-'+label+'-groups-closed.png')});
 for(const id of groupIds){
  await setFold(page,id,true);let opened=await viewState(page);
  check(label+' '+id+' opens with its own summary and shows its body',opened.cards.find(c=>c.id===id)?.open&&opened.cards.find(c=>c.id===id)?.body.height>0,{card:opened.cards.find(c=>c.id===id),report:opened.report});
  await setFold(page,id,false);check(label+' '+id+' closes independently',!(await viewState(page)).cards.find(c=>c.id===id)?.open);
 }
 for(const id of groupIds){
  const summary=page.locator(foldSelector(id)+' > summary');await summary.focus();await summary.press('Enter');await settle(page);
  const enter=await viewState(page);await summary.press('Space');await settle(page);const space=await viewState(page);
  check(label+' '+id+' supports Enter and Space with keyboard focus retained',enter.cards.find(c=>c.id===id)?.open&&!space.cards.find(c=>c.id===id)?.open&&enter.focus===space.focus&&!!space.focus,{enter:{focus:enter.focus,open:enter.cards.find(c=>c.id===id)?.open},space:{focus:space.focus,open:space.cards.find(c=>c.id===id)?.open}});
 }
 for(const id of groupIds){
  await page.locator('[data-tw840-jump="'+id+'"]').click();await page.waitForTimeout(650);
  const jump=await page.evaluate(id=>{const card=document.querySelector('[data-tw840-area="'+id+'"]'),heading=card.querySelector('h3'),nav=document.querySelector('.tw840-nav'),main=document.querySelector('main');return {
   open:card.querySelector('[data-tw848-group-fold]').open,focused:document.activeElement===heading,heading:heading.getBoundingClientRect().toJSON(),nav:nav.getBoundingClientRect().toJSON(),main:main.getBoundingClientRect().toJSON(),report:TodayWork840.report(),x:scrollX,y:scrollY};},id);
  check(label+' '+id+' category navigation opens and focuses a visible heading',jump.open&&jump.focused&&jump.heading.top>=jump.nav.bottom-2&&jump.heading.bottom<=jump.main.bottom+1&&jump.x===0&&jump.y===0,jump);
  await setFold(page,id,false);
 }
 await page.locator('[data-tw840-jump="toilets"]').click();await page.waitForTimeout(650);
 const before=await viewState(page);await page.evaluate(()=>renderToday());await page.waitForTimeout(650);const after=await viewState(page);
 check(label+' native rerender preserves all disclosure states focus and scroll',same(before.cards.map(c=>[c.id,c.open]),after.cards.map(c=>[c.id,c.open]))&&before.focus===after.focus&&Math.abs(before.scroll.top-after.scroll.top)<=2&&before.scroll.x===after.scroll.x&&before.scroll.y===after.scroll.y,{before:{open:before.cards.map(c=>[c.id,c.open]),focus:before.focus,scroll:before.scroll},after:{open:after.cards.map(c=>[c.id,c.open]),focus:after.focus,scroll:after.scroll}});
 const beforePrint=await viewState(page);await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await settle(page);const printing=await viewState(page);
 check(label+' print expands every group and stops display motion',printing.cards.every(c=>c.open&&c.toggles.every(t=>t.open))&&printing.report.running===null,printing.cards);
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await page.waitForTimeout(650);const restored=await viewState(page);
 check(label+' print restores exact disclosure states focus and scroll',same(beforePrint.cards.map(c=>c.toggles),restored.cards.map(c=>c.toggles))&&beforePrint.focus===restored.focus&&Math.abs(beforePrint.scroll.top-restored.scroll.top)<=2,{before:{cards:beforePrint.cards.map(c=>({id:c.id,toggles:c.toggles})),focus:beforePrint.focus,scroll:beforePrint.scroll},after:{cards:restored.cards.map(c=>({id:c.id,toggles:c.toggles})),focus:restored.focus,scroll:restored.scroll}});
 await closeAll(page);await page.locator('[data-tw840-jump="toilets"]').click();await page.waitForTimeout(650);
 let motion=await motionState(page);
 check(label+' only the selected visible open group can animate',motion.active.length<=1&&motion.active.every(a=>a.id===motion.report.selected&&a.open)&&(!motion.report.running||motion.report.running===motion.report.selected),motion);
 await setFold(page,'toilets',false);motion=await motionState(page);
 check(label+' closing all groups stops every work lamp animation',motion.report.running===null&&motion.active.length===0,motion);
 await page.locator('[data-tw840-jump="fencing"]').click();await page.waitForTimeout(650);state=await viewState(page);geometryChecks(check,label+' open fencing',state);
 const fence=state.cards.find(c=>c.id==='fencing');
 check(label+' open fencing uses the full available grid width',Math.abs(fence.card.width-state.grid.width)<=3,{fencing:fence.card,grid:state.grid});
 check(label+' other five groups stay at their natural closed height while fencing is open',state.cards.filter(c=>c.id!=='fencing').every(c=>!c.open&&Math.abs(c.card.height-c.summary.height-c.verticalChrome)<=24),state.cards.map(c=>({id:c.id,open:c.open,height:c.card.height,summaryHeight:c.summary.height,verticalChrome:c.verticalChrome})));
 await page.screenshot({path:path.join(out,'fencing848-'+label+'-fencing-open.png')});
 return {before,after,state};
}

async function readModel(page){return page.evaluate(()=>{
 const day=TodayWork840.report().asOf;
 const fencing=todayFencingSummary848(day);
 return {day,summary:todayWorkSummary848(day),fencing,types:todayTypeMetrics843(day),report:TodayWork840.report(),
  linked:fencing.summaryRows.map(row=>({id:row.id,value:todayLinkedFencing848(row.id,day)}))};
 });}
function assertOracle(check,label,native,model,oracle){
 check(label+' independent original-source oracle matches selected day and frozen display contract',oracle.author==='Andrew Fisher'&&oracle.as_of===model.day&&oracle.expected_rows.length===8&&oracle.selected_display_contract?.status==='frozen'&&oracle.selected_display_contract.as_of===model.day,{oracleDay:oracle.as_of,selectedDay:model.day,contract:oracle.selected_display_contract});
 check(label+' all reviewed physical operations and plan allowances have current evidence',model.fencing.evidence?.state==='ready'&&!model.fencing.evidence.pending.length,model.fencing.evidence);
 for(const expected of oracle.expected_rows){
  const row=model.summary.fencingRows.find(r=>r.id===expected.id),linked=model.linked.find(r=>r.id===expected.id)?.value;
  const declared=expected.red_docket_membership||[],keys=new Set(declared.map(d=>d.id));
  const nativeRows=native.dockets.filter(d=>keys.has(d.id)).map(d=>({id:d.id,docket_no:String(d.docket_no),date:d.date,quantity:d.quantities[expected.id],scope:d.scope||'programme'}));
  check(label+' '+expected.id+' red-book membership matches independent original audit',same(nativeRows.sort((a,b)=>a.id.localeCompare(b.id)),declared.map(d=>({...d,docket_no:String(d.docket_no)})).sort((a,b)=>a.id.localeCompare(b.id)))&&round(declared.reduce((s,d)=>s+d.quantity,0))===expected.current_allocation,{native:nativeRows,expected:declared});
  const linkedRed=(linked?.dockets||[]).filter(d=>native.dockets.some(n=>String(n.id)===String(d.id)));
  check(label+' '+expected.id+' linked dated records include each audited programme and compound docket exactly once',same(linkedRed.map(d=>String(d.id)).sort(),declared.map(d=>String(d.id)).sort()),{expected:declared.map(d=>d.id),actual:linkedRed.map(d=>d.id)});
  const allowance=(expected.supplemental||[]).filter(s=>s.kind==='resolved_completed_plan_package'),movements=(expected.supplemental||[]).filter(s=>s.id);
  const allowanceQuantity=round(allowance.reduce((sum,s)=>sum+s.quantity,0)),extra=round(movements.reduce((sum,s)=>sum+s.quantity,0));
  const expectedDone=allowance.length?expected.current_allocation:expected.recorded;
  check(label+' '+expected.id+' dated Done and separate undated work match the source audit',row?.done===expectedDone&&row.undatedRecorded===expected.undated&&row.extraWorkRecorded===extra,{expected:{done:expectedDone,undated:expected.undated,additional:extra},row});
  const operations=model.fencing.evidence?.operations.filter(o=>o.type===expected.id)||[];
  check(label+' '+expected.id+' additional movements use each independently audited source exactly once',same(operations.map(o=>({id:o.recordId,quantity:o.quantity,date:o.date})).sort((a,b)=>a.id.localeCompare(b.id)),movements.map(o=>({id:o.id,quantity:o.quantity,date:o.date})).sort((a,b)=>a.id.localeCompare(b.id))),{operations,expected:movements});
  const sourceTotal=expected.source_plan_total??expected.total;
  check(label+' '+expected.id+' retains the exact source programme total and units',row?.sourcePlannedTotal===sourceTotal&&row.unit===expected.unit&&row.sourceProvisional===expected.sourceProvisional,{sourcePlan:sourceTotal,sourceProvisional:expected.sourceProvisional,row});
  if(allowance.length){
   const sourceTotal=expected.source_plan_total??expected.total,derived=round(sourceTotal+allowanceQuantity),balance=round(derived-expectedDone),pct=round(expectedDone/derived*100);
   const known=expected.quantified_source_plan_comparison_recorded;
   check(label+' '+expected.id+' closed-out as-built scope adds the completed TBC package once and preserves the quantified-plan balance',row.total===derived&&row.left===balance&&row.pct===pct&&row.totalRange==null&&row.leftRange==null&&row.pctRange==null&&row.asBuiltAllowance&&!row.unquantifiedPlan&&row.unquantifiedRecorded===allowanceQuantity&&row.knownPlanRecorded===known&&balance===expected.left,{expected:{derived,balance,pct,allowanceQuantity,knownPlanRecorded:known},row});
  }else if(expected.recordedRange){
   const doneRange={min:expected.recordedRange[0],max:expected.recordedRange[1]},leftRange={min:expected.leftRange[0],max:expected.leftRange[1]};
   const pctRange={min:round(doneRange.min/expected.total*100),max:round(doneRange.max/expected.total*100)};
   check(label+' '+expected.id+' bounded Done Left and percentage match the independently audited uncertainty',row.total===expected.total&&row.left===null&&row.pct===null&&same(row.doneRange,doneRange)&&same(row.leftRange,leftRange)&&same(row.pctRange,pctRange),{expected:{total:expected.total,doneRange,leftRange,pctRange},row});
  }else check(label+' '+expected.id+' Total Done Left and percentage independently reconcile',row.total===expected.total&&row.done===expected.recorded&&row.left===expected.left&&row.pct===round(expected.recorded/expected.total*100),{expected:{total:expected.total,done:expected.recorded,left:expected.left,pct:round(expected.recorded/expected.total*100)},row});
 }
 const reinstatement=oracle.reinstatement_not_new_hire;
 check(label+' reverse movements remain separately disclosed without extra installed stock',Array.isArray(model.fencing.activities)&&model.fencing.activities.every(a=>a.type==='reinstatement')&&model.fencing.activities.reduce((s,a)=>s+a.quantity,0)===reinstatement.quantity_m&&model.fencing.activities.some(a=>a.recordId===reinstatement.id),{expected:reinstatement,activities:model.fencing.activities});
 const assessed=oracle.selected_display_contract.assessed_classification,linkedAssessed=model.linked.flatMap(r=>r.value.dockets).filter(d=>String(d.id)===assessed.record_id);
 check(label+' assessed category is explicitly distinguished from field verification',linkedAssessed.length===1&&linkedAssessed[0].classification?.assessed===true&&linkedAssessed[0].classification.confirmedType===assessed.type,{expected:assessed,linked:linkedAssessed});
}
async function assertEvidenceGuards(page,check,label){
 const fixture=await page.evaluate(()=>{
  const day=TodayWork840.report().asOf,current=fenceProgressEvidence848(day),catalogue=FENCE_PROGRESS848;
  const item=catalogue.operations.find(o=>o.records[0].book==='green'),id=item?.id;
  if(!item)return {available:false};
  const files={...photoIndex().files},source=item.source_ids[0];files[source]={...files[source],sha256:'0'.repeat(64)};
  const changedSource=fenceProgressEvidence848(day,{files});
  const changedNotes=serviceNoteRows().map(n=>n.id===item.records[0].record_id?{...n,note:String(n.note||'')+' [isolated audit revision]'}:n);
  const changedRecord=fenceProgressEvidence848(day,{serviceNotes:changedNotes});
  const duplicated={...catalogue,operations:catalogue.operations.concat({...item,id:item.id+'-isolated-duplicate'})},duplicate=fenceProgressEvidence848(day,{catalogue:duplicated});
  const existing=allDockets(),extra={...existing.find(d=>Number(d.quantities?.[item.type])>0),id:'isolated-overlap848',docket_no:'QA-OVERLAP'};
  extra.quantities={[item.type]:1};const overlap=fenceProgressEvidence848(day,{records:existing.concat(extra)});
  const beforeDay=new Date(new Date(current.operations.reduce((m,o)=>o.date<m?o.date:m,day)+'T00:00:00Z').getTime()-86400000).toISOString().slice(0,10),future=fenceProgressEvidence848(beforeDay);
  const changedCloseout=fenceProgressEvidence848(day,{completions:{}});
  const original=allDockets,records=original(),target=records.find(d=>fenceCcbReview847(d).state==='confirmed');let staleCategory;
  try{allDockets=()=>records.map(d=>d.id===target.id?{...d,note:String(d.note||'')+' [isolated category revision]'}:d);staleCategory=todayWorkSummary848(day).fencingRows.filter(r=>['ccb_event','ccb_demarc'].includes(r.id));}finally{allDockets=original;}
  return {available:true,id,type:item.type,source,current,changedSource,changedRecord,duplicate,overlap,beforeDay,future,changedCloseout,staleCategory,after:fenceProgressEvidence848(day)};
 });
 check(label+' changed source hash invalidates its physical-work reading',fixture.available&&fixture.changedSource.pending.some(p=>p.id===fixture.id)&&!fixture.changedSource.operations.some(o=>o.id===fixture.id),fixture.changedSource);
 check(label+' changed source record invalidates its physical-work reading',fixture.available&&fixture.changedRecord.pending.some(p=>p.id===fixture.id)&&!fixture.changedRecord.operations.some(o=>o.id===fixture.id),fixture.changedRecord);
 check(label+' duplicate evidence never counts one physical operation twice',fixture.available&&fixture.duplicate.pending.length>0&&!fixture.duplicate.operations.some(o=>o.id===fixture.id||o.id===fixture.id+'-isolated-duplicate'),fixture.duplicate);
 check(label+' changed red-book overlap invalidates additive movement quantities',fixture.available&&fixture.overlap.pending.some(p=>p.id===fixture.id)&&!fixture.overlap.operations.some(o=>o.id===fixture.id),fixture.overlap);
 check(label+' future physical movements never enter an earlier selected day',fixture.available&&fixture.future.operations.every(o=>o.date<=fixture.beforeDay)&&fixture.future.operations.length===0,{beforeDay:fixture.beforeDay,future:fixture.future});
 check(label+' removed closeout cannot preserve an exact as-built scope allowance',fixture.available&&fixture.current.planAllowances.some(a=>a.closedAsBuilt)&&fixture.changedCloseout.planAllowances.every(a=>!a.closedAsBuilt),fixture.changedCloseout.planAllowances);
 check(label+' stale category evidence returns both subtype comparisons to bounded uncertainty',fixture.available&&fixture.staleCategory.length===2&&fixture.staleCategory.every(r=>r.classificationPending&&r.pct===null&&r.left===null&&r.doneRange&&r.leftRange&&r.plan.status==='unknown'),fixture.staleCategory);
 check(label+' evidence fixtures leave current source readings unchanged',fixture.available&&same(fixture.current,fixture.after));
}
function reading(row,mode){
 const range=row[mode+'Range'],known=n=>typeof n==='number'&&Number.isFinite(n),suffix=mode==='pct'?'%':'';
 if(range&&(known(range.min)||known(range.max))){
  if(known(range.min)&&known(range.max))return fmt(range.min)+'–'+fmt(range.max)+suffix;
  return known(range.min)?fmt(range.min)+suffix+'+':'≤'+fmt(range.max)+suffix;
 }
 return fmt(row[mode])+(mode==='pct'&&known(row[mode])?'%':'');
}
function validTableHeadings(rows,board){return rows.length===8&&same(rows.map(r=>r.id),board.rows.map(r=>r.id))&&board.headers.length===5&&/Total/i.test(board.headers[1])&&/Recorded|Done/i.test(board.headers[2])&&/Left/i.test(board.headers[3]);}
async function assertNumbers(page,check,label,model,out){
 const rows=model.summary.fencingRows.filter(r=>r.kind!=='recorded-only');
 const board=await page.locator('[data-tw847-fence-summary]').evaluate(table=>({text:table.innerText,headers:[...table.querySelectorAll('thead th')].map(n=>n.innerText),
  rows:[...table.querySelectorAll('[data-tw847-fence-summary-row]')].map(row=>({id:row.dataset.tw847FenceSummaryRow,text:row.innerText,
   values:Object.fromEntries([...row.querySelectorAll('[data-tw847-fence-value]')].map(button=>[button.dataset.tw847FenceValue,{text:button.querySelector('strong')?.textContent,rect:button.getBoundingClientRect().toJSON(),rangeMin:button.querySelector('[data-tw848-range-min]')?.dataset.tw848RangeMin,rangeMax:button.querySelector('[data-tw848-range-max]')?.dataset.tw848RangeMax,hook:button.dataset.tw840FenceDetail,aria:button.getAttribute('aria-label')}]))}))}));
 check(label+' open Fencing shows every programme work type once and every Total Recorded Left percentage',validTableHeadings(rows,board),board);
 for(const row of rows){
  const shown=board.rows.find(r=>r.id===row.id);
  check(label+' '+row.id+' quantities and bounds match its own model and unit',shown&&['total','done','left','pct'].every(mode=>shown.values[mode]?.text===reading(row,mode)&&shown.values[mode]?.hook===row.id),{row,shown});
  check(label+' '+row.id+' all four readings have accessible readable source controls',shown&&['total','done','left','pct'].every(mode=>shown.values[mode]?.rect.width>=43.5&&shown.values[mode]?.rect.height>=43.5&&shown.values[mode]?.aria?.includes(row.label)),shown?.values);
  if(row.classificationPending)check(label+' '+row.id+' unresolved subtype has visible finite ranges and no definite pace',row.doneRange&&row.leftRange&&row.pctRange&&['done','left','pct'].every(mode=>typeof row[mode+'Range'].min==='number'&&typeof row[mode+'Range'].max==='number'&&row[mode+'Range'].min<=row[mode+'Range'].max&&shown.values[mode].text!=='—')&&row.plan.status==='unknown'&&row.plan.delta==null&&/Category review/i.test(shown.text),{row,shown});
  if(row.totalRange&&row.totalRange.max==null)check(label+' '+row.id+' incomplete measured scope retains a visible minimum and qualified percentage',shown.values.total.text.endsWith('+')&&shown.values.left.text.endsWith('+')&&shown.values.pct.text.startsWith('≤')&&row.plan.provisional,{row,shown});
 }
 const ccb=rows.filter(r=>['ccb_event','ccb_demarc'].includes(r.id)),pending=model.fencing.classification?.pendingMetres||0;
 check(label+' both CCB ranges share one pending quantity rather than duplicate work',!pending||ccb.length===2&&ccb.every(r=>round(r.doneRange.max-r.doneRange.min)===pending&&round(r.leftRange.max-r.leftRange.min)===pending)&&round(ccb.reduce((s,r)=>s+r.done,0))===round(ccb.reduce((s,r)=>s+r.doneRange.min,0)+pending),{pending,rows:ccb.map(r=>({id:r.id,done:r.done,doneRange:r.doneRange,leftRange:r.leftRange}))});
 for(const row of rows){
  const button=page.locator('[data-tw847-fence-summary-row="'+row.id+'"] [data-tw847-fence-value="done"]');await button.scrollIntoViewIfNeeded();await button.click();await page.waitForFunction(()=>document.querySelector('#gc500-work-dialog840')?.open);
  const shown=await page.locator('#gc500-work-dialog840').evaluate(d=>({title:d.querySelector('#tw840-dialog-title')?.textContent,text:d.innerText,client:d.clientWidth,scroll:d.scrollWidth,rect:d.getBoundingClientRect().toJSON(),
   dockets:[...d.querySelectorAll('[data-tw844-docket]')].map(n=>({key:n.dataset.tw844Docket,text:n.innerText,papers:[...n.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))})),
   paperLinks:[...d.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}));
  check(label+' '+row.id+' opens the correct linked source breakdown',shown.title===row.label&&shown.client+1>=shown.scroll&&shown.rect.left>=0&&shown.rect.right<=page.viewportSize().width+1,{title:shown.title,rect:shown.rect,client:shown.client,scroll:shown.scroll});
  const linked=model.linked.find(r=>r.id===row.id)?.value;
  check(label+' '+row.id+' native docket and paper links survive the compact table',linked&&linked.dockets.every(d=>shown.dockets.some(n=>n.key===d.key))&&linked.dockets.every(d=>d.papers.filter(p=>p.state==='ready').every(p=>shown.paperLinks.includes(p.url))),{expectedKeys:linked?.dockets.map(d=>d.key),shownKeys:shown.dockets.map(d=>d.key)});
  for(const docket of linked?.dockets.filter(d=>d.classification?.assessed) || []){
   const displayed=shown.dockets.find(n=>n.key===docket.key);
   check(label+' assessed source classification retains its method and confidence boundary',displayed&&/Assessed:/.test(displayed.text)&&/schedule, map and docket history/i.test(displayed.text)&&/not a field verification/i.test(displayed.text)&&!/Category confirmed/.test(displayed.text),{key:docket.key,text:displayed?.text,review:docket.classification});
  }
  if(row.classificationPending)check(label+' '+row.id+' source breakdown retains category uncertainty',/category|classif/i.test(shown.text)&&/review|pending|unconfirmed/i.test(shown.text),shown.text);
  if(row.undatedRecorded>0)check(label+' '+row.id+' undated work remains visible separately from dated Done',/undated/i.test(shown.text)&&shown.text.includes(fmt(row.undatedRecorded)),{undated:row.undatedRecorded,text:shown.text});
  if(row.asBuiltAllowance)check(label+' '+row.id+' source breakdown distinguishes original programme from completed as-built scope',/TBC|unquantified/i.test(shown.text)&&/as.built|signed.complete/i.test(shown.text)&&shown.text.includes(fmt(row.unquantifiedRecorded)),shown.text);
  if(row.id==='clean'||row.id==='ccb_event')await page.screenshot({path:path.join(out,'fencing848-'+label+'-'+row.id+'-source-detail.png')});
  await closeDialog(page);
 }
 return board;
}

async function run(){
 const {PAGE,BASE,OUT,CANDIDATE_SHA}=process.env;if(!PAGE||!BASE||!OUT||!CANDIDATE_SHA)throw Error('Set frozen PAGE, BASE, CANDIDATE_SHA and private OUT');
 const bytes=fs.readFileSync(PAGE);if(sha(bytes)!==CANDIDATE_SHA)throw Error('Frozen candidate hash differs');fs.mkdirSync(OUT,{recursive:true});
 if(!process.env.ORACLE)throw Error('Set private independent ORACLE');const oracleBytes=fs.readFileSync(process.env.ORACLE),oracle=JSON.parse(oracleBytes);
 if(oracle.author!=='Andrew Fisher'||oracle.base_sha256!==sha(fs.readFileSync(BASE)))throw Error('Independent oracle does not match frozen baseline');
 const corrections=process.env.CORRECTIONS?JSON.parse(fs.readFileSync(process.env.CORRECTIONS,'utf8')):null,catalogue=process.env.CATALOGUE?JSON.parse(fs.readFileSync(process.env.CATALOGUE,'utf8')):null;
 if(corrections&&(corrections.author!=='Andrew Fisher'||corrections.base_sha256!==sha(fs.readFileSync(BASE))))throw Error('Correction manifest does not match frozen baseline');
 for(const correction of corrections?.corrections||[]){
  const row=catalogue?.rows.find(r=>r.record_id===correction.record_id);if(!row)throw Error('Correction lacks independent original catalogue entry');
  if(correction.expected_catalogue&&!same(row,correction.expected_catalogue))throw Error('Original category catalogue differs from correction manifest');
  const changed=correctedRecord847(correction.expected,correction);row.expected.quantities=changed.quantities;row.expected.note=changed.note;
  row.decision={state:'confirmed',type:correction.to_type,basis:correction.basis,method:correction.assessment_method,confidence:correction.assessment_confidence};
  row.source_ids=[...new Set(row.source_ids.concat(correction.evidence.map(e=>e.source_id)))];
 }
 const live=process.env.LIVE==='1',guard=installWriteGuard(),{open}=require(path.join(process.env.GC500_TOOLCHAIN||path.resolve(__dirname,'../toolchain'),'harness/open_page.js'));
 const report={author:'Andrew Fisher',at:new Date().toISOString(),candidate:CANDIDATE_SHA,base:sha(fs.readFileSync(BASE)),oracle:sha(oracleBytes),live,checks:[],views:[]};
 const save=()=>fs.writeFileSync(path.join(OUT,'fencing848.json'),JSON.stringify(report,null,2));
 const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});save();if(!pass)console.log('FAIL '+name);};let session;
 try{
  session=await open({pageFile:BASE,hash:'#today',W:1366,H:768});await ready840(session.page);await session.page.evaluate(()=>photoIndex());await session.page.waitForFunction(()=>DOCS.state==='ready');
  const baseline={snapshot:await nativeSnapshot(session.page),native:await readNative(session.page),data:await dataSnapshot(session.page)};
  check('Baseline hydrated without runtime errors',Object.keys(baseline.snapshot.collections).length>0&&!session.errors.length,session.errors);await session.browser.close();session=null;
  for(const view of [{name:'laptop',W:1366,H:768,dpr:1},{name:'phone',W:390,H:844,dpr:2,mobile:true}]){
   console.log('START '+view.name);session=await open({pageFile:live?undefined:PAGE,hash:'#today',...view});const p=session.page;
   if(live){const upstream=guard.fulfilledDocuments.at(-1),browser=guard.documentResponses.at(-1),bom=bytes.subarray(0,3).equals(Buffer.from([239,187,191]));
    const stripped=bom&&browser?.sha===sha(bytes.subarray(3))&&browser.bytes===bytes.length-3;
    const exact=upstream?.status===200&&upstream.sha===CANDIDATE_SHA&&upstream.bytes===bytes.length&&browser?.status===200&&(browser.sha===CANDIDATE_SHA&&browser.bytes===bytes.length||stripped)&&session.counts.page===0;
    check(view.name+' exact public bytes with zero local HTML substitutions',exact,{upstream,browser,stripped,counts:session.counts});if(!exact)throw Error('Public source identity differs');
   }
   await ready840(p);await p.waitForFunction(()=>typeof todayFencingSummary848==='function'&&typeof todayWorkSummary848==='function'&&TodayWork840.report().typesMerged);
   await p.evaluate(()=>{localStorage.setItem('gc500.band','shown');photoIndex();});await p.waitForFunction(()=>DOCS.state==='ready');
   await p.waitForFunction(()=>{
    const rows=todayWorkSummary848(TodayWork840.report().asOf).fencingRows.filter(r=>r.kind!=='recorded-only');
    const known=n=>typeof n==='number'&&Number.isFinite(n),fmt=n=>known(n)?n.toLocaleString('en-AU',{maximumFractionDigits:2}):'—';
    return rows.every(row=>['total','done','left','pct'].every(mode=>{
     const range=row[mode+'Range'],suffix=mode==='pct'?'%':'';let text=fmt(row[mode])+(mode==='pct'&&known(row[mode])?'%':'');
     if(range&&(known(range.min)||known(range.max)))text=known(range.min)&&known(range.max)?fmt(range.min)+'–'+fmt(range.max)+suffix:known(range.min)?fmt(range.min)+suffix+'+':'≤'+fmt(range.max)+suffix;
     return document.querySelector('[data-tw847-fence-summary-row="'+row.id+'"] [data-tw847-fence-value="'+mode+'"] strong')?.textContent===text;
    }));
   },null,{timeout:15000,polling:250});
   const before={snapshot:await nativeSnapshot(p),native:await readNative(p),data:await dataSnapshot(p)},model=await readModel(p),sources=await readSourceModel(p);
   check(view.name+' all shared collections native helpers and media are unchanged',same(before.snapshot.collections,baseline.snapshot.collections)&&same(before.snapshot.functions,baseline.snapshot.functions)&&same(before.snapshot.media,baseline.snapshot.media));
   assertCorrections847(check,view.name,baseline.native,before.native,corrections);assertSourceBindings847(check,view.name,before.native,sources,corrections,catalogue);
   const changedData=Object.keys(baseline.data.data).filter(k=>!same(baseline.data.data[k],before.data.data[k]));
   const otherOps=JSON.parse(JSON.stringify(before.data.data.ops));otherOps.fencing.dockets=baseline.data.data.ops.fencing.dockets;
   check(view.name+' all non-corrected operational DATA remains exact',same(otherOps,baseline.data.data.ops)&&changedData.every(k=>['ops','fence_ccb_review847'].includes(k)),{changedData});
   const total=(rows,key)=>round(rows.filter(d=>d.usable).reduce((sum,d)=>sum+(d[key]||0),0)),revenueDelta=round(total(before.native.dockets,'cost_total')-total(baseline.native.dockets,'cost_total')),costDelta=round(total(before.native.dockets,'paid_total')-total(baseline.native.dockets,'paid_total'));
   const expectedFinance=JSON.parse(JSON.stringify(baseline.data.finance));expectedFinance.fencing.charged=round(expectedFinance.fencing.charged+revenueDelta);expectedFinance.fencing.cost=round(expectedFinance.fencing.cost+costDelta);if(expectedFinance.fencing.margin!=null)expectedFinance.fencing.margin=round(expectedFinance.fencing.margin+revenueDelta-costDelta);
   expectedFinance.groups.fencing=before.native.groupMoney;
   check(view.name+' all financial outputs follow only the independently checked correction delta',same(before.data.finance,expectedFinance),{revenueDelta,costDelta,expected:expectedFinance,actual:before.data.finance});
   check(view.name+' non-fencing type quantities and memberships remain unchanged',same(before.native.assetTypes,baseline.native.assetTypes));
   const interactions=await assertDisclosures(p,check,view.name,OUT);
   assertOracle(check,view.name,before.native,model,oracle);
   const board=await assertNumbers(p,check,view.name,model,OUT);await assertEvidenceGuards(p,check,view.name);
   report.views.push({view,model,interactions,board});
   const after={snapshot:await nativeSnapshot(p),native:await readNative(p),data:await dataSnapshot(p)};
   check(view.name+' audit preserves every native record and financial output',same(before.snapshot.collections,after.snapshot.collections)&&same(before.native,after.native)&&same(before.data,after.data));
   check(view.name+' no JavaScript runtime errors',!session.errors.length,session.errors);await session.browser.close();session=null;console.log('DONE '+view.name);
  }
 }catch(error){check('Browser audit completed',false,error.stack);}
 finally{
  if(session)await session.browser.close();await guard.closeAll();report.guard=guard;
  check('Frozen candidate unchanged',sha(fs.readFileSync(PAGE))===CANDIDATE_SHA);
  check('Independent source oracle unchanged',sha(fs.readFileSync(process.env.ORACLE))===report.oracle);
  check('All non-GET requests blocked and zero operational write attempts',guard.nonGetSeen.length===guard.blocked.length&&!guard.nonGetSeen.some(r=>r.operational),guard.nonGetSeen);
  const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));
  check('No unexpected console errors',!unexpected.length,unexpected);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;save();
  console.log(JSON.stringify({passed:report.passed,total:report.total,out:OUT}));if(report.passed!==report.total)process.exitCode=1;
 }
}
function replayHeaders(){
 const sourceBytes=fs.readFileSync(process.env.REPLAY_HEADERS),original=JSON.parse(sourceBytes),candidateBytes=fs.readFileSync(process.env.PAGE);
 if(original.candidate!==sha(candidateBytes))throw Error('Captured source and current candidate differ');
 const checks=original.views.map(view=>({name:view.view.name+' corrected case-insensitive table heading contract',pass:validTableHeadings(view.model.summary.fencingRows.filter(r=>r.kind!=='recorded-only'),view.board),headers:view.board.headers,rows:view.board.rows.map(r=>r.id)}));
 const unexpected=original.checks.filter(c=>!c.pass&&!c.name.endsWith('open Fencing shows every programme work type once and every Total Recorded Left percentage'));
 const report={author:'Andrew Fisher',candidate:original.candidate,originalReportSha:sha(sourceBytes),scope:'Replays only the corrected case-insensitive heading predicate against the exact captured browser DOM and model. Original report is preserved.',checks,unexpectedOriginalFailures:unexpected.map(c=>c.name),passed:checks.filter(c=>c.pass).length,total:checks.length};
 fs.writeFileSync(path.join(process.env.OUT,'heading-case-correction848.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,unexpectedOriginalFailures:report.unexpectedOriginalFailures}));
 if(report.passed!==2||report.total!==2||unexpected.length)process.exitCode=1;
}
module.exports={readModel,viewState,assertDisclosures,validTableHeadings};
if(require.main===module){if(process.env.REPLAY_HEADERS)replayHeaders();else run().catch(error=>{console.error(error.message);process.exitCode=2;});}
