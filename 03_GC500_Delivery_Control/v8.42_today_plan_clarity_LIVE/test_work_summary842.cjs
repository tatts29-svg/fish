/* Author: Andrew Fisher. Portable synthetic checks; no private project records. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'work_summary842_src.js'),'utf8');
const keys = ['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','relocation','removal'];
const column = key => ({key,unit:/gates/.test(key)?'each':'m',programme_type:'Synthetic '+key});
const totals = value => Object.fromEntries(keys.map(key=>['Synthetic '+key,value]));
const health = {ready:true,loading:false,stale:false,basis:'Synthetic shared record'};
function metric(extra={}) {
  return {id:'buildings',name:'Buildings',scope:'Synthetic buildings',unit:'buildings',total:10,knownTotal:10,done:3,
    unknownQuantityRefs:0,shortConflictRefs:0,issues:[],
    rows:[{key:'SYN_A',quantity:3,done:3,complete:true,recordedComplete:true},
      {key:'SYN_B',quantity:7,done:0,complete:false,recordedComplete:false}],...extra};
}
function native(key,date,extra={}) { return {a:{key},st:{in:date},d:{recorded:false,done:false,...extra}}; }
function fixture(opts={}) {
  const state={asOf:opts.selected||''};
  const areas=opts.areas || [metric(),{id:'fencing',name:'Fencing',scope:'Build programme',unit:'m',total:100,done:30,rows:[],issues:[]}];
  areas.health=opts.health||health;
  const fencing=opts.fencing || {summaryRows:keys.map(key=>({id:key,label:key,unit:column(key).unit,kind:/gates/.test(key)?'gates':'fence',
    planned:100,recorded:30,remaining:70,pct:30,issues:[]}))};
  const data={weeks:[{sheet:'SYN_WEEK_A',phase:'Build',start:'2026-09-01',end:'2026-09-10'},
    {sheet:'SYN_WEEK_B',phase:'Build',start:'2026-09-11',end:'2026-09-20'},
    {sheet:'SYN_DEMOB',phase:'Demob',start:'2026-09-21',end:'2026-09-30'}]};
  const plans=opts.plans||{SYN_WEEK_A:{sheet:'SYN_PLAN_A',year:2026,rolled_forward:true,totals:totals(60),days:[{date:'2026-09-02',totals:totals(60)}]},
    SYN_WEEK_B:{sheet:'SYN_PLAN_B',year:2026,rolled_forward:true,totals:totals(40),days:[{date:'2026-09-14',totals:totals(40)}]},
    SYN_DEMOB:{sheet:'SYN_PLAN_DEMOB',year:2026,rolled_forward:true,totals:totals(500),days:[{date:'2026-09-22',totals:totals(500)}]}};
  const natives=opts.natives||[native('SYN_A','2026-09-01',{done:true}),native('SYN_B','2026-09-07')];
  let calls=0, seenDay=null;
  const context=vm.createContext({state,DATA:opts.data||data,FCOL:opts.columns||keys.map(column),todayIso:()=> '2026-09-08',
    todayWorkHealth840:()=>areas.health,todayWorkMetrics840:()=>areas,todayFencingSummary841:()=>fencing,
    dsnState:day=>{calls++;seenDay=day;return {rows:natives};},progSheetOf:key=>plans[key]||null,
    plannedToDay:(sheet,day,type)=>{
      if(!sheet||!sheet.rolled_forward||!type)return null;
      let n=0,any=false;
      (sheet.days||[]).forEach(d=>{if(d.date<=day&&d.totals&&d.totals[type]!=null){n+=d.totals[type];any=true;}});
      return any?Math.round(n*100)/100:(sheet.days||[]).length?0:null;
    }});
  vm.runInContext(source,context,{filename:'work_summary842_src.js'});
  const before=JSON.stringify({areas,fencing,natives,data,plans});
  const result=context.todayWorkSummary842(opts.day,areas,{},fencing);
  assert.equal(JSON.stringify({areas,fencing,natives,data,plans}),before,'summary must not mutate records or metric inputs');
  return {result,areas,fencing,natives,data,plans,calls,seenDay,row:key=>result.fencingRows.find(r=>r.id===key)};
}
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('known scope exposes total confirmed quantity remaining and percentage',()=>{
  const a=fixture().result.byId.buildings;
  assert.equal(a.total,10);assert.equal(a.done,3);assert.equal(a.left,7);assert.equal(a.pct,30);assert.equal(a.pctKind,'confirmed');
});
test('a shortage keeps confirmed lower bound and all disputed units in remaining',()=>{
  const a=metric({id:'toilets',unit:'toilet units',total:13,knownTotal:13,done:5,shortConflictRefs:1,
    rows:[{key:'SYN_A',quantity:5,complete:true,recordedComplete:true},
      {key:'SYN_REVIEW',quantity:3,complete:false,recordedComplete:true},
      {key:'SYN_B',quantity:5,complete:false,recordedComplete:false}]});
  const out=fixture({areas:[a]}).result.byId.toilets;
  assert.equal(out.done,5);assert.equal(out.left,8);assert.equal(out.reviewQuantity,3);assert.deepEqual([...out.reviewRefs],['SYN_REVIEW']);
  assert.equal(out.pct,38.46);assert.equal(out.pctKind,'lower-bound');assert.match(out.pctLabel,/At least/);
});
test('lower-bound display floors rather than overstating by rounding upward',()=>{
  const a=metric({total:7,done:2,shortConflictRefs:1,rows:[{key:'SYN_REVIEW',quantity:1,recordedComplete:true,complete:false}]});
  const out=fixture({areas:[a]}).result.byId.buildings;
  assert.equal(out.pct,28.57);assert.ok(out.pct<=2/7*100);
  a.total=6;a.done=1;assert.equal(fixture({areas:[a]}).result.byId.buildings.pct,16.66);
});
test('unquantified scope never receives an invented percentage or remaining total',()=>{
  const a=fixture({areas:[metric({total:null,knownTotal:10,unknownQuantityRefs:1})]}).result.byId.buildings;
  assert.equal(a.total,null);assert.equal(a.done,3);assert.equal(a.knownTotal,10);assert.equal(a.left,null);assert.equal(a.pct,null);assert.equal(a.unquantifiedRefs,1);
});
test('zero scope and no recorded completion remain distinct from 100 percent',()=>{
  const a=fixture({areas:[metric({total:0,knownTotal:0,done:0,rows:[]})]}).result.byId.buildings;
  assert.equal(a.total,0);assert.equal(a.done,0);assert.equal(a.left,0);assert.equal(a.pct,null);
});
test('on-site plan counts references rather than quantities or installation ticks',()=>{
  const p=fixture().result.byId.buildings.plan;
  assert.equal(p.unit,'references');assert.equal(p.planned,2);assert.equal(p.actual,1);assert.equal(p.behind,1);
  assert.equal(p.status,'behind');assert.match(p.basis,/not an installation deadline/);
});
test('early arrivals never cancel another due reference gap',()=>{
  const rows=[{key:'SYN_DUE'},{key:'SYN_EARLY'},{key:'SYN_EARLY2'}];
  const p=fixture({areas:[metric({rows})],natives:[native('SYN_DUE','2026-09-02'),
    native('SYN_EARLY','2026-09-10',{recorded:true,state:'on site',where:'person'}),
    native('SYN_EARLY2','2026-09-12',{done:true})]}).result.byId.buildings.plan;
  assert.equal(p.behind,1);assert.equal(p.early,2);assert.equal(p.delta,-1);assert.equal(p.status,'behind');assert.match(p.label,/behind/);
});
test('rental-only on-hire does not establish arrival proof',()=>{
  const p=fixture({areas:[metric({rows:[{key:'SYN_RENTAL'}]})],natives:[native('SYN_RENTAL','2026-09-01',{recorded:true,state:'on site',where:'rental'})]}).result.byId.buildings.plan;
  assert.equal(p.actual,0);assert.equal(p.behind,1);assert.deepEqual([...p.rentalOnlyRefs],['SYN_RENTAL']);
});
test('explicit Complete evidence remains valid with rental provenance',()=>{
  const p=fixture({areas:[metric({rows:[{key:'SYN_DONE'}]})],natives:[native('SYN_DONE','2026-09-01',{done:true,recorded:true,state:'on site',where:'rental'})]}).result.byId.buildings.plan;
  assert.equal(p.actual,1);assert.equal(p.behind,0);assert.equal(p.rentalOnlyRefs.length,0);
});
test('undated and missing references do not become on-plan claims',()=>{
  const p=fixture({areas:[metric({rows:[{key:'SYN_NODATE'},{key:'SYN_MISSING'}]})],natives:[native('SYN_NODATE',null,{done:true})]}).result.byId.buildings.plan;
  assert.equal(p.status,'unknown');assert.equal(p.undatedRefs.length,2);assert.ok(p.issues.length);
});
test('only main metric active reference keys enter each plan comparison',()=>{
  const p=fixture({areas:[metric({rows:[{key:'SYN_A'}]})],natives:[native('SYN_A','2026-09-01',{done:true}),native('SYN_EXCLUDED','2026-09-01')]}).result.byId.buildings.plan;
  assert.equal(p.planned,1);assert.equal(p.actual,1);assert.equal(p.behind,0);
});
test('shortage review remains independent of reference arrival evidence',()=>{
  const a=metric({shortConflictRefs:1,rows:[{key:'SYN_SHORT',quantity:2,recordedComplete:true,complete:false}]});
  const out=fixture({areas:[a],natives:[native('SYN_SHORT','2026-09-01',{done:true})]}).result.byId.buildings;
  assert.equal(out.plan.actual,1);assert.equal(out.plan.unit,'references');assert.equal(out.reviewQuantity,2);assert.equal(out.pctKind,'lower-bound');
});
test('every fencing type retains its independent total recorded left percentage and dated plan',()=>{
  const f=fixture();assert.equal(f.result.fencingRows.length,8);
  for(const row of f.result.fencingRows){assert.equal(row.total,100);assert.equal(row.done,30);assert.equal(row.left,70);assert.equal(row.pct,30);assert.equal(row.plannedByDay,60);assert.equal(row.plan.behind,30);}
  assert.equal(f.row('v_gates').unit,'each');assert.equal(f.row('clean').unit,'m');assert.equal(f.result.byId.fencing.pct,null);assert.equal(f.result.byId.fencing.total,null);
});
test('future Build weeks and Demob do not enter planned-by-day',()=>{
  const f=fixture({day:'2026-09-25'});assert.equal(f.row('clean').plannedByDay,100);
  const before=fixture({day:'2026-08-30'});assert.equal(before.row('clean').plannedByDay,0);assert.equal(before.row('clean').plan.status,'ahead');
});
test('sparse daily zeros are valid only when totals reconcile',()=>{
  const first=fixture(),p=first.plans;
  p.SYN_WEEK_A.days.push({date:'2026-09-03',totals:{}});
  assert.equal(fixture({plans:p}).row('clean').plannedByDay,60);
  delete p.SYN_WEEK_A.days[0].totals['Synthetic clean'];
  const row=fixture({plans:p}).row('clean');assert.equal(row.plannedByDay,null);assert.equal(row.plan.status,'unknown');assert.ok(row.plan.issues.length);
});
test('missing unrolled duplicate or invalid started plan is explicit unknown',()=>{
  for(const mutate of [p=>delete p.SYN_WEEK_A,p=>p.SYN_WEEK_A.rolled_forward=false,
    p=>p.SYN_WEEK_A.days[0].date='unknown',p=>p.SYN_WEEK_A.days.push({...p.SYN_WEEK_A.days[0]}),
    p=>p.SYN_WEEK_A.days[0].totals['Synthetic clean']=-1]) {
    const f=fixture();mutate(f.plans);const row=fixture({plans:f.plans}).row('clean');
    assert.equal(row.plannedByDay,null);assert.equal(row.plan.status,'unknown');assert.ok(row.issues.length);
  }
});
test('fractional gate daily quantities cannot become a valid programme comparison',()=>{
  const f=fixture();f.plans.SYN_WEEK_A.totals['Synthetic v_gates']=1.5;f.plans.SYN_WEEK_A.days[0].totals['Synthetic v_gates']=1.5;
  assert.equal(fixture({plans:f.plans}).row('v_gates').plannedByDay,null);
});
test('impossible calendar days never become credible plan dates',()=>{
  const p=fixture({areas:[metric({rows:[{key:'SYN_BADDATE'}]})],natives:[native('SYN_BADDATE','2026-02-30',{done:true})]}).result.byId.buildings.plan;
  assert.equal(p.status,'unknown');assert.equal(p.undatedRefs.length,1);
  const f=fixture();f.plans.SYN_WEEK_A.days[0].date='2026-02-30';
  assert.equal(fixture({plans:f.plans}).row('clean').plannedByDay,null);
});
test('one daily programme sheet cannot satisfy two started Build weeks',()=>{
  const f=fixture();f.plans.SYN_WEEK_B=f.plans.SYN_WEEK_A;
  assert.equal(fixture({plans:f.plans,day:'2026-09-18'}).row('clean').plannedByDay,null);
});
test('source-authored dates outside a mapped week remain dated comparisons with a note',()=>{
  const f=fixture();f.plans.SYN_WEEK_A.days[0].date='2026-09-11';
  const row=fixture({plans:f.plans,day:'2026-09-12'}).row('clean');
  assert.equal(row.plannedByDay,60);assert.equal(row.plan.status,'behind');assert.equal(row.plan.provisional,false);
  assert.ok(row.plan.issues.some(x=>/explicit date is retained/.test(x)));
});
test('unconfirmed source dates retain only an explicitly provisional pace comparison',()=>{
  const f=fixture();f.plans.SYN_WEEK_A.days[0].basis='installation plan weekly summary; source conflicts awaiting confirmation';
  const row=fixture({plans:f.plans}).row('clean');
  assert.equal(row.plannedByDay,60);assert.equal(row.plan.provisional,true);assert.match(row.plan.label,/^Provisional:/);
  assert.ok(row.plan.issues.some(x=>/awaiting confirmation/.test(x)));
  f.fencing.summaryRows[0].recorded=60;
  const equal=fixture({plans:f.plans,fencing:f.fencing}).row('clean');
  assert.equal(equal.plan.status,'on-plan');assert.equal(equal.plan.provisional,true);assert.equal(equal.plan.label,'Provisional: matches current dated Build plan');
});
test('unrelated zero cells and future source conflicts do not contaminate current type pace',()=>{
  const f=fixture();f.plans.SYN_WEEK_A.days[0].basis='source conflicts awaiting confirmation';
  f.plans.SYN_WEEK_A.days[0].totals['Synthetic v_gates']=0;f.plans.SYN_WEEK_A.totals['Synthetic v_gates']=0;
  assert.equal(fixture({plans:f.plans}).row('v_gates').plan.provisional,false);
  f.plans.SYN_WEEK_A.days[0].date='2026-09-09';
  assert.equal(fixture({plans:f.plans}).row('clean').plan.provisional,false);
});
test('recorded work beyond plan is shown without capping or implying unique length',()=>{
  const f=fixture();f.fencing.summaryRows[0].recorded=125;
  const row=fixture({fencing:f.fencing}).row('clean');assert.equal(row.pct,125);assert.equal(row.left,0);assert.equal(row.plan.status,'ahead');
  assert.match(f.result.byId.fencing.basis,/not unique standing/);
});
test('docket labour remains recorded-only and does not imply total crew hours',()=>{
  const f=fixture();f.fencing.summaryRows.push({id:'labour',label:'Labour recorded',unit:'h',kind:'recorded-only',planned:null,recorded:3,issues:[]});
  const row=fixture({fencing:f.fencing}).row('labour');assert.equal(row.label,'Docket labour column');assert.equal(row.total,null);assert.equal(row.pct,null);assert.equal(row.plan.status,'unknown');assert.ok(row.issues.some(x=>/green-book/.test(x)));
});
test('hydration yields unknown figures without querying incomplete native status',()=>{
  const f=fixture({health:{ready:false,loading:true,basis:'Waiting for records'}});
  assert.equal(f.calls,0);assert.equal(f.result.byId.buildings.total,null);assert.equal(f.result.byId.buildings.done,null);assert.equal(f.row('clean').plannedByDay,null);
});
test('selected date is shared by native reading and every summary',()=>{
  const f=fixture({selected:'2026-09-05'});assert.equal(f.result.asOf,'2026-09-05');assert.equal(f.seenDay,'2026-09-05');
  assert.ok(f.result.byId.buildings.plan.issues.some(x=>/replayed/.test(x)));
});
console.log('PASS '+checks+'/'+checks+' summary checks');
