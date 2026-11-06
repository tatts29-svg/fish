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
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
const equivalent=(a,b)=>canonical(a)===canonical(b);
function correctedRecord847(record,correction){
 const value=JSON.parse(JSON.stringify(record)),keys=['ccb_event','ccb_demarc'];
 if(!keys.includes(correction.from_type)||!keys.includes(correction.to_type)||correction.from_type===correction.to_type||!(correction.quantity>0)||value.id!==correction.record_id||String(value.docket_no)!==String(correction.docket_no))throw Error('Invalid correction identity or category transfer');
 const before=number(value.quantities?.[correction.from_type]);if(before==null||before<correction.quantity)throw Error('Correction exceeds original source quantity');
 value.quantities[correction.from_type]=round(before-correction.quantity);if(value.quantities[correction.from_type]===0)delete value.quantities[correction.from_type];
 value.quantities[correction.to_type]=round((number(value.quantities[correction.to_type])||0)+correction.quantity);
 if(typeof correction.after_note!=='string'||!correction.after_note.startsWith(String(record.note||'')))throw Error('Correction note must preserve original source text');
 value.note=correction.after_note;return value;
}
function priceOracle847(record,native){
 const lines=[],unpriced=[],paidUnpriced=[];
 for(const key of Object.keys(record.quantities||{}).sort()){
  const qty=number(record.quantities[key]);if(!(qty>0))continue;
  const column=native.columns.find(c=>c.key===key)||{},rate=native.rates[key].charge,paidRate=native.rates[key].paid;
  const cost=rate.value==null?null:round(qty*rate.value),paid=paidRate.value==null?null:round(qty*paidRate.value);
  lines.push({column:key,name:column.name_as_written||key,unit:column.unit,qty,rate:rate.value,rate_source:rate.source,card_line:column.card_line||null,cost,
   paid_rate:paidRate.value,paid_rate_source:paidRate.source,paid,margin:rate.source!=='included'&&cost!=null&&paid!=null?round(cost-paid):null,inclusion:rate.source==='included'?rate.inclusion:null});
  if(cost==null)unpriced.push(key);if(paid==null)paidUnpriced.push(key);
 }
 const cost_total=round(lines.reduce((sum,l)=>sum+(l.cost||0),0)),paid_total=round(lines.reduce((sum,l)=>sum+(l.paid||0),0));
 return {lines,cost_total,unpriced,cost_state:lines.length?(unpriced.length?'partly priced':'priced'):'nothing to price',paid_total,paid_unpriced:paidUnpriced,
  paid_state:lines.length?(paidUnpriced.length?'partly priced':'priced'):'nothing to price',margin:lines.length&&!unpriced.length&&!paidUnpriced.length?round(cost_total-paid_total):null};
}
function assertCorrections847(check,label,before,after,manifest){
 const corrections=manifest?.corrections||[],ids=corrections.map(c=>c.record_id);
 check(label+' rates and pricing functions are unchanged',equivalent(before.columns,after.columns)&&equivalent(before.rates,after.rates)&&same(before.pricingFunctions,after.pricingFunctions));
 check(label+' correction manifest names unique original records',new Set(ids).size===ids.length&&corrections.every(c=>before.sourceDockets.filter(d=>d.id===c.record_id&&String(d.docket_no)===String(c.docket_no)).length===1));
 const expectedSource=before.sourceDockets.map(d=>{const c=corrections.find(c=>c.record_id===d.id);return c?correctedRecord847(d,c):d;});
 check(label+' committed source changes are exactly the authorised categories and appended notes',equivalent(expectedSource,after.sourceDockets)&&corrections.every(c=>equivalent(c.expected,before.sourceDockets.find(d=>d.id===c.record_id))),{changed:ids});
 const expectedRuntime=before.dockets.map(d=>{const c=corrections.find(c=>c.record_id===d.id);if(!c)return d;const corrected=correctedRecord847(d,c);return {...corrected,...priceOracle847(corrected,before)};});
 const bad=expectedRuntime.filter(d=>!equivalent(d,after.dockets.find(a=>a.id===d.id)));
 check(label+' every runtime docket matches the exact category transfer and current-rate formula',after.dockets.length===expectedRuntime.length&&!bad.length,{changed:ids,mismatched:bad.map(d=>({expected:d,actual:after.dockets.find(a=>a.id===d.id)}))});
 const total=(rows,key)=>round(rows.filter(d=>d.usable).reduce((sum,d)=>sum+(d[key]||0),0));
 const revenueDelta=round(total(expectedRuntime,'cost_total')-total(before.dockets,'cost_total')),costDelta=round(total(expectedRuntime,'paid_total')-total(before.dockets,'paid_total'));
 const expectedMoney=before.groupMoney.map(row=>row.id==='fence-revenue'?{...row,amount:round(row.amount+revenueDelta)}:row.id==='fence-cost'?{...row,amount:round(row.amount+costDelta)}:row);
 check(label+' aggregate Revenue and Direct costs change only by the exact source-derived delta',equivalent(expectedMoney,after.groupMoney),{revenueDelta,costDelta,expected:expectedMoney,actual:after.groupMoney});
}
function assertSourceBindings847(check,label,native,model,manifest,catalogue){
 if(catalogue){
  check(label+' installed category catalogue matches the private source-reviewed decisions',equivalent(model.catalogue.sources,catalogue.sources)&&equivalent(model.catalogue.rows,catalogue.rows));
  const bad=catalogue.rows.filter(row=>{const review=model.reviews.find(r=>r.id===row.record_id)?.review;return !review||review.reviewState!=='current'||review.state!==row.decision.state||row.decision.state==='confirmed'&&review.confirmedType!==row.decision.type;});
  check(label+' every source-reviewed classification is current with exactly its documented decision',!bad.length,{expected:catalogue.rows.map(r=>({id:r.record_id,decision:r.decision})),bad});
 }
 for(const correction of manifest?.corrections||[]){
  const record=native.dockets.find(d=>d.id===correction.record_id),review=model.sourceReviews.find(r=>r.id===correction.record_id);
  const bound=review?.expected&&Object.fromEntries(Object.keys(review.expected).map(k=>[k,record[k]]));
  check(label+' '+correction.record_id+' original-paper review remains current after category correction',review?.state==='current'&&review.paperReady&&equivalent(review.expected,bound),review);
  const mapped=model.trace.rows.filter(r=>r.record_id===correction.record_id),unmapped=model.trace.unmapped.filter(r=>r.record_id===correction.record_id);
  check(label+' '+correction.record_id+' original map association remains current or explicitly unmapped',correction.expected_trace?
   mapped.length===1&&mapped[0].state==='current'&&mapped[0].review_state==='current'&&equivalent(mapped[0].area_ids,correction.expected_trace.area_ids):mapped.length===0&&unmapped.length===1&&unmapped[0].docket_no===correction.docket_no,{mapped,unmapped,expectedAreas:correction.expected_trace?.area_ids||null});
 }
}

function assertLegacyViews847(pageFile,check){
 const vm=require('node:vm'),source=fs.readFileSync(path.join(__dirname,'fencing_other_views847_src.js'),'utf8');
 check('Legacy display source is bound to exact candidate bytes',fs.readFileSync(pageFile,'utf8').includes(source));
 let pending=true,seenDay=null;
 const types=[{key:'clean',name:'Clean',planned:40,total:80,done:25},{key:'ccb_event',name:'Event CCB',planned:20,total:60,done:50},{key:'ccb_demarc',name:'Demarcation CCB',planned:30,total:90,done:10}];
 const programme={asOf:'2026-10-07',fenceLines:[{column:'clean',behind:15},{column:'ccb_event',behind:0},{column:'ccb_demarc',behind:20}]};
 const before=JSON.stringify({types,programme}),records=[{id:'synthetic-usable',usable:true},{id:'synthetic-unusable',usable:false}];
 const context=vm.createContext({todayIso:()=>programme.asOf,docketsAsOf:day=>{seenDay=day;return records;},allDockets:()=>records,
  fenceCcbSummary847:rows=>({pendingCount:pending?rows.length:0,pendingMetres:pending?12.5:0}),fenceTypes:()=>types,fmtNum:n=>String(n)});
 vm.runInContext(source,context);
 const qualified=context.fenceCcbDisplayTypes847(programme),lines=context.fenceCcbDisplayLines847(programme),words=context.fenceCcbDisplayWords847(programme);
 check('Legacy CCB subtype displays retain quantities but remove definitive planned comparison',qualified.filter(r=>r.key!=='clean').every(r=>r.ccbPending&&r.planned===null&&r.plannedRecorded===types.find(t=>t.key===r.key).planned&&/category needs review/.test(r.name))&&same(qualified.find(r=>r.key==='clean'),types[0]),qualified);
 check('Legacy CCB shortfalls are unknown while other work remains independently assessed',lines.filter(r=>r.column!=='clean').every(r=>r.ccbPending&&r.behind===null)&&same(lines[0],programme.fenceLines[0]),lines);
 check('Legacy qualifier follows selected day and usable source records',seenDay===programme.asOf&&/1 dockets/.test(words)&&/not confirmed subtype completion or plan position/.test(words),{seenDay,words});
 pending=false;
 check('Confirmed legacy categories keep the native programme reading',same(context.fenceCcbDisplayTypes847(programme),types)&&same(context.fenceCcbDisplayLines847(programme),programme.fenceLines)&&context.fenceCcbDisplayWords847(programme)==='');
 check('Legacy qualifications never mutate native programme or record inputs',before===JSON.stringify({types,programme}));
}

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
  sourceDockets:FCOM.dockets,rates:Object.fromEntries(FCOL.map(c=>[c.key,{charge:fenceRateFor(c.key),paid:fenceCostFor(c.key)}])),
  pricingFunctions:{costDocket:costDocket.toString(),fenceRateFor:fenceRateFor.toString(),fenceCostFor:fenceCostFor.toString(),fenceDerived:fenceDerived.toString()},
  assetTypes:todayTypeMetrics843(day).instruments.filter(t=>t.kind==='asset-type')};
 });}
async function closeDialog(page){
 if(!await page.locator('#gc500-work-dialog840').evaluate(d=>d.open))return;
 await page.evaluate(()=>{window.__closed847=false;document.querySelector('#gc500-work-dialog840').addEventListener('close',()=>{window.__closed847=true;},{once:true});});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__closed847&&!document.querySelector('#gc500-work-dialog840').open);
}
async function readCompact847(page){return page.evaluate(()=>[...document.querySelectorAll('[data-tw840-area]')].map(card=>{
 const fold=card.querySelector('details[data-tw841-group-card]'),outside=selector=>[...card.querySelectorAll(selector)].filter(n=>!fold?.contains(n));
 return {id:card.dataset.tw840Area,folds:card.querySelectorAll('details[data-tw841-group-card]').length,open:fold?.open,
  summary:fold?.querySelector('summary')?.textContent,reading:outside('.tw840-reading')[0]?.textContent||null,
  counts:Object.fromEntries(outside('[data-tw840-mode]').filter(n=>['done','left'].includes(n.dataset.tw840Mode)).map(n=>[n.dataset.tw840Mode,n.querySelector('strong')?.textContent])),
  totalButtons:outside('[data-tw840-mode="total"]').length,
  fenceRows:outside('[data-tw847-fence-summary-row]').map(row=>({id:row.dataset.tw847FenceSummaryRow,name:row.querySelector('th')?.textContent,
   values:Object.fromEntries([...row.querySelectorAll('[data-tw847-fence-value]')].map(b=>[b.dataset.tw847FenceValue,b.querySelector('strong')?.textContent||b.textContent])),text:row.innerText})),
  outsideTypeRows:outside('[data-tw843-type-id]').length,insideTypeRows:fold?.querySelectorAll('[data-tw843-type-id]').length||0,
  width:card.clientWidth,scroll:card.scrollWidth,heading:card.querySelector('h3')?.textContent,
  buttons:outside('button').map(n=>({text:n.innerText,rect:n.getBoundingClientRect().toJSON(),count:['done','left'].includes(n.dataset.tw840Mode),font:parseFloat(getComputedStyle(n.querySelector('span')||n).fontSize)}))};
 }));}
async function assertCompact847(page,check,label,model,out){
 const cards=await readCompact847(page);
 check(label+' every main group has one closed View details dropdown',cards.length===6&&cards.every(c=>c.folds===1&&c.open===false&&/View details/i.test(c.summary)),cards);
 for(const card of cards){
  check(label+' '+card.id+' supporting types stay inside its dropdown',card.outsideTypeRows===0&&card.insideTypeRows===model.types.instruments.filter(t=>t.cardId===card.id).length,{id:card.id,inside:card.insideTypeRows,outside:card.outsideTypeRows});
  check(label+' '+card.id+' compact card fits horizontally',card.scroll<=card.width+1,{width:card.width,scroll:card.scroll});
  if(card.id==='fencing'){
   check(label+' fencing main card never combines unlike units into a percentage or count',card.reading===null&&!Object.keys(card.counts).length,card);
   const expected=model.summary.fencingRows.filter(row=>row.kind!=='recorded-only');
   check(label+' compact Fencing shows every programme type once with its own Done Left and percentage',same(card.fenceRows.map(r=>r.id),expected.map(r=>r.id))&&card.fenceRows.every(r=>{
    const row=expected.find(x=>x.id===r.id),pct=typeof row.pct==='number'&&Number.isFinite(row.pct)?fmt(row.pct)+'%':'—';
    return r.name?.includes(row.label)&&r.values.done===fmt(row.done)&&r.values.left===fmt(row.left)&&r.values.pct===pct;
   }),{expected:expected.map(r=>({id:r.id,label:r.label,done:r.done,left:r.left,pct:r.pct})),shown:card.fenceRows});
   continue;
  }
  const row=model.summary.byId[card.id],known=typeof row.pct==='number'&&Number.isFinite(row.pct),bounded=known?Math.max(0,Math.min(100,row.pct)):null;
  const rounded=known&&row.pctKind==='lower-bound'?Math.floor((bounded+1e-9)*100)/100:bounded;
  const percent=(known&&row.pctKind==='lower-bound'?'≥':'')+fmt(rounded)+(known?'%':'');
  check(label+' '+card.id+' main percentage Done and Left retain exact qualified counts',card.reading===percent&&card.counts.done===fmt(row.done)&&card.counts.left===fmt(row.left)&&card.totalButtons===1,{expected:{percent,done:row.done,left:row.left},shown:card});
  check(label+' '+card.id+' visible controls retain readable counts and touch height',card.buttons.every(b=>b.rect.height>=43.5&&b.rect.width>=43.5&&(!b.count||b.font>=14)),card.buttons);
 }
 await page.locator('[data-tw840-area="toilets"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'fencing847-'+label+'-compact-groups.png')});
 const eventButton=page.locator('[data-tw847-fence-summary-row="ccb_event"] [data-tw847-fence-value="pct"]');await eventButton.scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,'fencing847-'+label+'-compact-fencing.png')});await eventButton.click();await page.waitForFunction(()=>document.querySelector('#gc500-work-dialog840')?.open);
 check(label+' compact fencing percentage opens the exact source breakdown while details stay closed',(await page.locator('#tw840-dialog-title').textContent())===model.summary.fencingRows.find(r=>r.id==='ccb_event').label&&!(await page.locator('[data-tw841-group-card="fencing"]').evaluate(d=>d.open)));
 await closeDialog(page);
 const fenceFold=page.locator('[data-tw841-group-card="fencing"]');await fenceFold.locator(':scope > summary').click();await page.waitForFunction(()=>document.querySelector('[data-tw841-group-card="fencing"]')?.open);
 check(label+' Fencing details open through the native disclosure',await fenceFold.evaluate(d=>d.open));
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
  reviews:allDockets().map(d=>({id:String(d.id),review:fenceCcbReview847(d)})),catalogue:DATA.fence_ccb_review847,
  sourceReviews:allDockets().map(d=>{const review=fenceReviewContext836(d);return {id:String(d.id),state:review.state,reason:review.reason||null,expected:review.row?.expected||null,paperReady:review.paper?.result?.state==='ready'};}),trace:fenceTraceCurrent837()};
 });}

async function run(){
 const {PAGE,BASE,OUT,CANDIDATE_SHA}=process.env;
 if(!PAGE||!BASE||!OUT||!CANDIDATE_SHA)throw Error('Set frozen PAGE, BASE, CANDIDATE_SHA and private OUT');
 const bytes=fs.readFileSync(PAGE);if(sha(bytes)!==CANDIDATE_SHA)throw Error('Frozen candidate hash differs');
 const corrections=process.env.CORRECTIONS?JSON.parse(fs.readFileSync(process.env.CORRECTIONS,'utf8')):null;
 const catalogue=process.env.CATALOGUE?JSON.parse(fs.readFileSync(process.env.CATALOGUE,'utf8')):null;
 if(corrections&&(corrections.schema!==1||corrections.author!=='Andrew Fisher'||corrections.base_sha256!==sha(fs.readFileSync(BASE))||!Array.isArray(corrections.corrections)))throw Error('Correction manifest identity does not match the frozen base');
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
   const before=await nativeSnapshot(p),native=await readNative(p),model=await readModel(p);
   await assertCompact847(p,check,view.name,model,OUT);const board=await readBoard(p);
   report.views.push({view,native,model,board});
   check(view.name+' candidate preserves all shared collections and native helpers',same(before.collections,baseline.snapshot.collections)&&same(before.functions,baseline.snapshot.functions),{collectionsMatch:same(before.collections,baseline.snapshot.collections),helpersMatch:same(before.functions,baseline.snapshot.functions)});
   assertCorrections847(check,view.name,baseline.native,native,corrections);
   assertSourceBindings847(check,view.name,native,model,corrections,catalogue);
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
module.exports={installationOracle,readNative,readModel,readBoard,assertLegacyViews847,correctedRecord847,priceOracle847,assertCorrections847,assertCompact847,assertSourceBindings847};
async function captureFullCards847(){
 const {PAGE,OUT,CANDIDATE_SHA}=process.env;if(sha(fs.readFileSync(PAGE))!==CANDIDATE_SHA)throw Error('Frozen source mismatch');
 fs.mkdirSync(OUT,{recursive:true});const guard=installWriteGuard(),{open}=require(path.join(process.env.GC500_TOOLCHAIN||path.resolve(__dirname,'../toolchain'),'harness/open_page.js'));
 const report={author:'Andrew Fisher',candidate:CANDIDATE_SHA,scope:'Tall viewport captures at tested laptop and phone widths; no physical-device or frame-rate claim.',cards:[]};let session;
 try{for(const view of [{name:'laptop',W:1366,H:768,dpr:1},{name:'phone',W:390,H:844,dpr:2,mobile:true}]){
  session=await open({pageFile:PAGE,hash:'#today',...view});const p=session.page;await ready840(p);await p.evaluate(()=>photoIndex());await p.waitForFunction(()=>DOCS.state==='ready');
  await p.waitForFunction(()=>todayWorkSummary847(TodayWork840.report().asOf).fencingRows.filter(r=>r.classificationPending).every(r=>document.querySelector('[data-tw840-fence-row="'+r.id+'"]')?.textContent.includes('Confirmed recorded: '+r.confirmedRecorded.toLocaleString('en-AU',{maximumFractionDigits:2}))));
  for(const id of ['fencing','toilets']){const card=p.locator('[data-tw840-area="'+id+'"]');
   const height=await card.evaluate(c=>Math.ceil(c.getBoundingClientRect().height));await p.setViewportSize({width:view.W,height:Math.max(view.H,height+500)});await card.scrollIntoViewIfNeeded();
   const file='fencing847-'+view.name+'-'+id+'-closed-full-card.png';await card.screenshot({path:path.join(OUT,file)});
   report.cards.push({view:view.name,id,file,viewport:p.viewportSize(),closed:await card.locator('[data-tw841-group-card]').evaluate(d=>!d.open),width:await card.evaluate(c=>c.clientWidth),scroll:await card.evaluate(c=>c.scrollWidth)});
  }
  report.errors=(report.errors||[]).concat(session.errors);await session.browser.close();session=null;
 }}finally{if(session)await session.browser.close();await guard.closeAll();report.guard=guard;fs.writeFileSync(path.join(OUT,'full-cards847.json'),JSON.stringify(report,null,2));}
 if(report.errors.length||guard.nonGetSeen.some(r=>r.operational)||report.cards.some(c=>!c.closed||c.scroll>c.width+1))throw Error('Full-card capture integrity check failed');
 console.log(JSON.stringify({cards:report.cards.length,errors:report.errors.length,candidate:CANDIDATE_SHA}));
}
if(require.main===module){
 if(process.env.VISUAL_ONLY==='1')captureFullCards847().catch(error=>{console.error(error.message);process.exitCode=2;});
 else if(process.env.LEGACY_ONLY==='1'){
  const checks=[];assertLegacyViews847(process.env.PAGE,(name,pass,evidence)=>checks.push({name,pass:!!pass,evidence}));
  const report={author:'Andrew Fisher',candidate:sha(fs.readFileSync(process.env.PAGE)),passed:checks.filter(c=>c.pass).length,total:checks.length,checks};
  fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(path.join(process.env.OUT,'legacy847.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,total:report.total}));if(report.passed!==report.total)process.exitCode=1;
 }else run().catch(error=>{console.error(error.message);process.exitCode=2;});
}
