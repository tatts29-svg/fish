/* Author: Andrew Fisher. Independent CW1 task arithmetic and GET-only native-record proof. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const OUT=process.env.OUT, PAGE=process.env.PAGE, BASE=process.env.BASE_PAGE;
assert(OUT&&path.isAbsolute(OUT),'OUT must be an absolute private evidence directory');
assert(PAGE&&BASE,'PAGE and BASE_PAGE are required');
fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const save=(name,value)=>fs.writeFileSync(path.join(OUT,name),JSON.stringify(value,null,2),{mode:0o600});
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const readData=file=>JSON.parse(fs.readFileSync(file,'utf8').split('const DATA = ',2)[1].split('\n',1)[0].replace(/;\s*$/,''));
const beforeData=readData(BASE),afterData=readData(PAGE),oldFencing=beforeData.fencing;
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++},ok=(v,label)=>{assert(v,label);checks++};
const round=n=>Math.round(n*100)/100;
const types={clean:'Temporary Fence (m) — Clean',braced:'Temporary Fence (m) — Braced for Scrim',relocation:'Temporary Fence (m) — Relocation',removal:'Temporary Fence (m) — Removal',vg:'Vehicle Gates',pg:'Ped. Gates',event:'Crowd Control Barriers (m) — Event',demarc:'Crowd Control Barriers (m) — Demarcation',flat:'Crowd Control Barriers (m) — Flat Feet'};
const sourceSummary={};
function sourceProof(){
 const strip=d=>{const copy={...d};delete copy.fencing;return copy};
 eq(strip(beforeData),strip(afterData),'source-only patch preserves all other DATA including equipment running sheet and rates');
 const prior=oldFencing.week_sheets.find(w=>w.sheet==='CON WK1'),current=afterData.fencing.week_sheets.find(w=>w.sheet==='CON WK1');
 ok(current.plan_update,'CW1 has its own dated source overlay');
 eq(current.programme_rows951,prior.programme_rows951,'original workbook task comparators retained exactly');
 eq(current.programme_totals,prior.programme_totals,'original workbook total comparator retained');
 eq(current.held_rows951,prior.held_rows951,'September carryover remains held');
 eq(afterData.fencing.week_sheets.filter(w=>w.sheet!=='CON WK1'),oldFencing.week_sheets.filter(w=>w.sheet!=='CON WK1'),'all earlier weeks and demob source objects unchanged');
 eq(afterData.fencing.source_review951,oldFencing.source_review951,'prior source review preserved');
 const plan=current.plan_update,rows=plan.rows_by_day.flatMap(day=>day.rows.map(row=>({...row,day:day.date})));
 eq(plan.code,'C1','correct CW1 identity');eq(plan.revision,'2026-10-09','latest dated source');
 eq(new Set(rows.map(r=>r.id)).size,rows.length,'task identifiers unique across all days');
 eq(rows.filter(r=>r.source_row951===24).length,0,'24 September carryover is not replanned in CW1');
 eq(plan.rows_by_day.map(d=>d.date),['2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16'],'only five CW1 dates covered');
 const expected={
  '2026-10-12':{clean:488,braced:130,relocation:0,removal:0,vg:11,pg:7,event:0,demarc:391,flat:0},
  '2026-10-13':{clean:625,braced:0,relocation:0,removal:0,vg:8,pg:6,event:0,demarc:792,flat:90},
  '2026-10-14':{clean:681,braced:375,relocation:0,removal:0,vg:11,pg:5,event:30,demarc:281,flat:0},
  '2026-10-15':{clean:665,braced:157,relocation:107,removal:569,vg:16,pg:3,event:115,demarc:0,flat:0},
  '2026-10-16':{clean:718,braced:43,relocation:35,removal:0,vg:4,pg:0,event:285,demarc:0,flat:0}
 };
 for(const [date,want] of Object.entries(expected)){
  const day=current.days.find(d=>d.date===date),own=rows.filter(r=>r.day===date),sum={};ok(day,'derived day exists '+date);
  for(const [key,type] of Object.entries(types)){sum[type]=round(own.reduce((n,r)=>n+(Number(r.fields[type])||0),0));eq(sum[type],want[key],'independent source selection '+date+' '+key);eq(day.totals[type]||0,sum[type],'native day total closed to task rows '+date+' '+key)}
 }
 for(const [key,type] of Object.entries(types))eq(current.totals[type],round(Object.values(expected).reduce((n,d)=>n+d[key],0)),'whole CW1 total independently reconciles '+key);
 const row=n=>{const found=rows.filter(r=>r.source_row951===n);eq(found.length,1,'prior row used once '+n);return found[0]};
 const pit=row(61);eq(pit.day,'2026-10-15','Pit moves to Thursday exactly once');eq(pit.fields[types.relocation],45,'Pit relocation retained');eq(pit.fields[types.removal],220,'Pit removal retained');eq(pit.fields[types.vg],3,'Pit gates retained');
 const cypress=row(62);eq(cypress.fields[types.clean],240,'Cypress duplicate pages count 240 once');eq(cypress.fields[types.vg],2,'Cypress duplicate gates counted once');
 eq(row(40).fields[types.braced],185,'Support Categories first task braced185');eq(row(41).fields[types.braced],190,'Support Categories second task braced190');
 for(const n of [40,41])eq(row(n).fields[types.clean]||0,0,'Support Categories clean replaced by braced '+n);
 const g6=rows.filter(r=>!r.source_row951&&/gate\s*6|g6/i.test(r.location+' '+r.description));eq(g6.length,1,'new Gate6 exactly one installation task');eq(g6[0].day,'2026-10-15','Gate6 Thursday precedence');eq(g6[0].fields[types.clean],45,'Gate6 clean45');eq(g6[0].fields[types.braced],45,'Gate6 braced45');
 const triangle=rows.filter(r=>!r.source_row951&&/triangle/i.test(r.location+' '+r.description));eq(triangle.length,1,'one Triangle task');eq(triangle[0].day,'2026-10-14','Triangle Wednesday');eq(triangle[0].fields[types.clean],126,'Triangle126 clean');
 for(const n of [10,28,38,42,48,49,50,51,52,53,54,55,56,60,65]){const selected=row(n),legacy=prior.programme_rows951.find(r=>r.source_row===n);eq(selected.fields,legacy.quantities,'unresolved scope retains prior quantities '+n);ok(selected.review_state954&&selected.forecast_basis954,'unresolved scope clearly flagged '+n)}
 ok(plan.stockpile_evidence954&&JSON.stringify(plan.stockpile_evidence954).includes('50'),'stockpile50 has separate source evidence');
 eq(rows.filter(r=>!r.source_row951).length,2,'only Gate6 and Triangle add quantified installation rows');
 const text=JSON.stringify(plan);for(const needle of ['Scottie','Wayne','06:30','Meriton','Hutchinson'])ok(text.includes(needle),'source access/crew condition retained '+needle);
 sourceSummary.days=expected;sourceSummary.rows=rows.length;sourceSummary.weekTotals=current.totals;sourceSummary.sourceSha256=sha(JSON.stringify(current));
 return current;
}
const cw1=sourceProof();
if(process.env.SOURCE_ONLY==='1'){
 save('source-summary-private.json',{author:'Andrew Fisher',checks,...sourceSummary});
 console.log(JSON.stringify({author:'Andrew Fisher',checks,sourceTaskArithmeticPassed:true,recordWrites:0}));process.exit(0);
}
const TOOL=path.resolve(__dirname,'../../toolchain/harness'),hp=TOOL+'/open_page.js';
const fetcher=require(TOOL+'/curlfetch'),realFetch=fetcher.curlFetch;let frozen=process.env.STATE?JSON.parse(fs.readFileSync(process.env.STATE,'utf8')):null;
fetcher.curlFetch=async(url,headers,method,body)=>{
 assert.equal(method,'GET','all requests are GET-only');const u=new URL(url);
 if(frozen&&u.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(u.pathname))return {status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?frozen:{version:frozen.version,updated:frozen.updated,level:frozen.level||'view'}))};
 const res=await realFetch(url,headers,method,body);
 if(!frozen&&u.origin==='https://gc500-production.up.railway.app'&&u.pathname==='/api/state'&&res.status===200){frozen=JSON.parse(res.body.toString());save('frozen-state.json',frozen)}
 return res;
};
const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));let harness=fs.readFileSync(hp,'utf8');
const postGuard="const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');";ok(harness.includes(postGuard),'harness POST exception located');
harness=harness.replace(postGuard,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++; (counts.denials ||= []).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});");
h._compile(harness,hp);
function independent(snapshot){
 const out={cost:0,revenue:0,weeks:{}};
 for(const week of snapshot.programme){if(!week.rolled_forward)continue;const mapped=snapshot.weeks.find(w=>snapshot.weekMap.find(m=>m.week_2026===w.sheet)?.programme_sheet===week.sheet);if(!mapped)continue;
  const past=!!(mapped.end&&mapped.end<snapshot.day),dockets=snapshot.dockets.filter(d=>d.usable&&d.week===mapped.sheet&&(d.scope||'programme')==='programme'),lines=[];let cost=0,revenue=0;
  for(const col of snapshot.columns){const plan=week.totals[col.programme_type];if(plan==null)continue;const done=round(dockets.reduce((n,d)=>n+(Number(d.quantities[col.key])||0),0)),q=Math.max(0,round(plan-done));if(!q)continue;
   const rate=snapshot.rates[col.key],paid=snapshot.paid[col.key],rev=rate.value!=null?q*rate.value:null,co=paid.value!=null?q*paid.value:null;revenue+=rev||0;cost+=co||0;lines.push({name:col.name_as_written,unit:col.unit,q,rev,cost:co});}
  if(past&&!lines.length)continue;
  if(!past)for(const [type,q] of Object.entries(week.totals)){if(!(q>0)||snapshot.columns.some(c=>c.programme_type===type))continue;const card=snapshot.forecastCard.find(c=>c.programme_type===type&&c.unit==='m');if(card){const rev=q*card.rate;revenue+=rev;lines.push({name:type,unit:'m',q,rev,cost:null,forecastOnly:true});}}
  out.weeks[week.sheet]={cost:round(cost),revenue:round(revenue),lines};out.cost=round(out.cost+round(cost));out.revenue=round(out.revenue+round(revenue));
 }return out;
}
(async()=>{
 const mobile=process.env.MOB!=='0',s=await h.exports.open({pageFile:PAGE,hash:'#fencing',W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1,mobile,gl:true}),p=s.page;
 p.setDefaultTimeout(20000);const timer=setTimeout(()=>s.browser.close().catch(()=>{}),300000);
 try{
  await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});ok(frozen,'real native snapshot frozen');
  const result=await p.evaluate(old=>{
   const copy=x=>JSON.parse(JSON.stringify(x)),candidate=DATA.fencing,initial=JSON.stringify(S),version=SYNC.backend.readVersion821();
   const capture=()=>{RENDER_MEMO.clear();return holdAssets(()=>({day:todayIso(),programme:copy(DATA.fencing.week_sheets),weeks:copy(DATA.weeks),weekMap:copy(DATA.fence.week_map),columns:copy(FCOL),forecastCard:copy(FORECAST_CARD771.entries),dockets:copy(allDockets()),rates:Object.fromEntries(FCOL.map(c=>[c.key,copy(fenceRateFor(c.key))])),paid:Object.fromEntries(FCOL.map(c=>[c.key,copy(fenceCostFor(c.key))])),forecast:copy(cj764Fencing()),actual:{fence:fenceDerived(),green:greenBookTotals(),money:moneySummary(),costs:costTotals(allCosts())},completion:JSON.stringify(S.fenceDone),progress:['2026-10-11','2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16','2026-10-25'].map(day=>({day,lines:progressAsOf(day).fenceLines}))}));};
   let before,after;try{DATA.fencing=old;before=capture();DATA.fencing=candidate;after=capture();}finally{DATA.fencing=candidate;RENDER_MEMO.clear();}
   return {before,after,version,recordUnchanged:initial===JSON.stringify(S),record:initial,forecastGaps:holdAssets(()=>cj764Model().gaps)};
  },oldFencing);
  save('paired-private.json',result);eq(result.version,frozen.version,'paired snapshot is fresh native version');ok(result.recordUnchanged,'all S fields unchanged by source comparison');
  for(const key of ['actual','completion','rates','paid','dockets'])eq(result.before[key],result.after[key],'recorded '+key+' unchanged');
  const reconciled={};for(const name of ['before','after']){
   const want=independent(result[name]),got=result[name].forecast;eq(got.cost,want.cost,name+' forecast costs independently reconcile');eq(got.revenue,want.revenue,name+' forecast Revenue independently reconciles');
   for(const w of got.weeks){eq({cost:w.cost,revenue:w.revenue},{cost:want.weeks[w.prog].cost,revenue:want.weeks[w.prog].revenue},name+' weekly forecast arithmetic '+w.prog);eq(w.lines,want.weeks[w.prog].lines,name+' every remaining task quantity × rate '+w.prog)}reconciled[name]=want;
  }
  for(const key of Object.keys(reconciled.before.weeks).filter(k=>k!=='CON WK1'))eq(reconciled.before.weeks[key],reconciled.after.weeks[key],'other week forecast preserved '+key);
  for(let i=0;i<result.after.progress.length;i++){
   const a=result.after.progress[i],b=result.before.progress[i];for(const line of a.lines){
    const old=b.lines.find(l=>l.column===line.column);eq(line.done,old.done,'progress actual stays unchanged '+a.day+' '+line.column);
    const type=result.after.columns.find(c=>c.key===line.column).programme_type;
    const cumulative=snapshot=>snapshot.programme.find(w=>w.sheet==='CON WK1').days.filter(d=>d.date<=a.day).reduce((n,d)=>n+(Number(d.totals[type])||0),0);
    eq(round((line.planned||0)-(old.planned||0)),round(cumulative(result.after)-cumulative(result.before)),'progress planned change closes to dated CW1 tasks '+a.day+' '+line.column);
   }
  }
  ok(/CW1|CON WK1/i.test(JSON.stringify(result.forecastGaps)),'Costs forecast names provisional CW1 source');
  await p.evaluate(()=>{state.fenceWeek='Week 1';holdAssets(()=>go('fencing'));});
  const plan=p.locator('[data-cw1-plan954]');await plan.waitFor({state:'attached'});
  eq(await plan.count(),1,'one current CW1 plan rendered');eq(await plan.evaluate(n=>!!n.closest('.fp-working')&&n.classList.contains('planupd')),true,'CW1 stays in existing plan/workings layout');
  await plan.evaluate(n=>{let q=n.parentElement;while(q){if(q.tagName==='DETAILS')q.open=true;q=q.parentElement;}});await plan.locator('h3').scrollIntoViewIfNeeded();
  await p.screenshot({path:OUT+(mobile?'/phone-cw1-source.png':'/desktop-cw1-source.png')});
  const rows=plan.locator('[data-cw1-task954]');const taskCount=await rows.count();eq(taskCount,sourceSummary.rows,'all selected source task rows available exactly once');
  const task=plan.locator('[data-cw1-task954="cw1-gate6"]');
  await task.evaluate(n=>{let q=n.parentElement;while(q){if(q.tagName==='DETAILS')q.open=true;q=q.parentElement;}n.scrollIntoView({block:'center'});});
  await p.screenshot({path:OUT+(mobile?'/phone-cw1-task-folded.png':'/desktop-cw1-task-folded.png')});
  await task.locator('details').evaluateAll(nodes=>nodes.forEach(n=>{n.open=true}));
  await task.evaluate(n=>n.scrollIntoView({block:'center'}));
  await p.screenshot({path:OUT+(mobile?'/phone-cw1-review.png':'/desktop-cw1-review.png')});
  const sourceScroll=await task.evaluate(n=>{const wrap=n.closest('.tblwrap'),cell=n.children[1];wrap.scrollLeft+=cell.getBoundingClientRect().left-wrap.getBoundingClientRect().left-1;return {width:wrap.clientWidth,scrollWidth:wrap.scrollWidth,scrollLeft:wrap.scrollLeft}});
  if(mobile)ok(sourceScroll.scrollWidth<=sourceScroll.width||sourceScroll.scrollLeft>0,'wide source task columns remain reachable on phone');
  await p.screenshot({path:OUT+(mobile?'/phone-cw1-source-detail.png':'/desktop-cw1-source-detail.png')});
  const dom=await p.evaluate(()=>{const n=document.querySelector('[data-cw1-plan954]');return {viewport:innerWidth,width:document.documentElement.scrollWidth,controls:n.querySelectorAll('input,select,button,textarea').length,sourceFolds:document.querySelectorAll('#fencing-source951').length,record:JSON.stringify(S),version:SYNC.backend.readVersion821(),text:n.textContent}});
  ok(dom.width<=dom.viewport+1,'CW1 source remains within viewport');eq(dom.controls,0,'CW1 source has no operational controls');eq(dom.sourceFolds,1,'one preserved programme source fold');eq(dom.record,result.record,'native S unchanged after rendering and browsing source');eq(dom.version,result.version,'native version remains frozen');
  for(const phrase of ['Scottie','Wayne','stockpile','provisional'])ok(dom.text.toLowerCase().includes(phrase.toLowerCase()),'visible source qualifications '+phrase);
  eq(s.errors,[],'zero runtime errors');const denials=s.counts.denials||[];ok(denials.every(d=>d.origin==='https://tile.googleapis.com'&&d.path==='/v1/createSession'),'no operational write attempted');
  const summary={author:'Andrew Fisher',candidateSha256:sha(fs.readFileSync(PAGE)),baseSha256:sha(fs.readFileSync(BASE)),checks,nativeVersion:result.version,day:result.after.day,actualsUnchanged:true,nativeRecordUnchanged:true,operationalWriteAttempts:0,requests:s.counts,pageErrors:s.errors,viewport:{width:dom.viewport,documentWidth:dom.width,sourceRows:taskCount},source:sourceSummary,forecast:{before:reconciled.before,after:reconciled.after}};
  save('summary-private.json',summary);console.log(JSON.stringify({author:summary.author,candidateSha256:summary.candidateSha256,checks,nativeVersion:summary.nativeVersion,actualsUnchanged:true,nativeRecordUnchanged:true,operationalWriteAttempts:0,pageErrors:0,viewport:summary.viewport,forecastClosedToTasksAndRates:true,privateEvidence:OUT}));
 }finally{clearTimeout(timer);await s.browser.close();}
})().catch(e=>{fs.writeFileSync(OUT+'/failure.txt',e.stack,{mode:0o600});console.error(String(e.message).replace(/key=[^&\s]+/g,'key=[redacted]'));process.exitCode=1});
