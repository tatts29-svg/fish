/* Author: Andrew Fisher. Synthetic integration checks; no private records. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sources=[
  path.join(root,'v8.41_timeline_fencing_clarity_LIVE/group_details841_src.js'),
  path.join(root,'v8.42_today_plan_clarity_LIVE/work_summary842_src.js'),
  path.join(__dirname,'type_metrics843_src.js')
].map(p=>[path.basename(p),fs.readFileSync(p,'utf8')]);
function native(key,product,discipline,lines,extra={}) {
  const cls=lines.map(([item,quantity])=>({item,quantity}));
  const askedBy=new Map();for(const l of cls)askedBy.set(l.item,(askedBy.get(l.item)||0)+(l.quantity==null?1:l.quantity));
  return {a:{key,name:'Synthetic '+key,product,discipline},cls,asked:[...askedBy.values()].reduce((a,b)=>a+b,0),
    askedBy,onBy:new Map(),unitsOn:0,nums:[],subs:[],accs:[],t:{total:0},d:{done:false,recorded:false},
    st:{in:'2026-09-01'},...extra};
}
function fixture(opts={}) {
  const day=opts.day||'2026-09-08';
  const rows=opts.rows||[
    native('SYN_B','Portable Building','Portable buildings',[['Building 3m',2],['Building 6m',3]],{d:{done:true}}),
    native('SYN_T','Toilet','Toilets & amenities',[['Accessible Toilet',2],['Waste tank',4]]),
    native('SYN_G','Generator','Generators',[['Generator 60kVA',2]]),
    native('SYN_L','Light Tower','Generators',[['Lighting tower',3]]),
    native('SYN_A','Access','Access & plant',[['Forklift 5t',1]]),
    native('SYN_V','VMS','Variable message signs',[['VMS board',2]]),
    native('SYN_W','WFB','Water-filled barriers',[['Water-filled barrier',8]]),
    native('SYN_M','Trakmat','Ground protection',[['Track mat',9]]),
    native('SYN_F','Furniture','Furniture',[['Chair',6]]),
    native('SYN_O','Specialist gear','Specialist gear',[['Synthetic tool',4]])];
  const reviews=new Set(opts.mainReview||[]);
  const mainId=p=>({'Portable Building':'buildings',Toilet:'toilets',Generator:'generators','Light Tower':'lighting',Access:'equipment'}[p]||null);
  const areas=opts.areas||['buildings','toilets','generators','lighting','equipment'].map(id=>({id,name:id,scope:id,unit:'units',
    total:10,knownTotal:10,done:0,rows:rows.filter(r=>mainId(r.a.product)===id&&!r.reloc&&!r.a.rest_of&&!(opts.moved||[]).includes(r.a.key)&&!r.a._cancelled)
      .map(r=>({key:r.a.key,quantity:r.asked,recordedComplete:!!r.d.done,complete:!!r.d.done&&!reviews.has(r.a.key)})),issues:[]}));
  const ready=opts.ready!==false;
  const health={ready,loading:!ready,stale:false,status:'live',basis:ready?'Synthetic shared records':'Waiting for records'};
  areas.health=health;
  const fencing={summaryRows:[{id:'clean',label:'Clean fence',unit:'m',planned:100,recorded:25,remaining:75,issues:[]},
    {id:'v_gates',label:'Vehicle gates',unit:'each',planned:4,recorded:2,remaining:2,issues:[]}]};
  const columns=[{key:'clean',unit:'m',programme_type:'Synthetic clean'},{key:'v_gates',unit:'each',programme_type:'Synthetic gates'}];
  const totals={'Synthetic clean':100,'Synthetic gates':4};
  const sheet={sheet:'SYN_PLAN',rolled_forward:true,year:2026,totals,days:[{date:'2026-09-02',totals}]};
  const X={rows,byDisc:new Map(),P:{areas:0,areasDone:0,fenceBd:0}};
  let nativeCalls=0;
  const context=vm.createContext({DATA:{edition:'file',weeks:[{sheet:'SYN_WEEK',phase:'Build',start:'2026-09-01',end:'2026-09-10'}]},FCOL:columns,
    state:{},todayIso:()=> '2026-09-08',todayWorkHealth840:()=>health,todayWorkMetrics840:()=>areas,todayFencingSummary841:()=>fencing,
    dsnState:()=>{nativeCalls++;return X;},shortOf:a=>(opts.shorts||{})[a.key]||[],
    movedAway:key=>(opts.moved||[]).includes(key),qtyOf:l=>l.quantity==null||String(l.quantity).trim()===''?null:Number(l.quantity),
    isMiscRow:r=>!!r.misc,DSN_GROUPS:[],PROG_NEXT_DAYS:7,barrierQty:()=>({master:null,detail:null}),
    tradeCharges:()=>new Map(),fenceTypes:()=>[],fenceDerived:()=>({charged:0,cost:0}),greenBookTotals:()=>({notes:0}),
    progSheetOf:()=>sheet,plannedToDay:(s,d,t)=>(s.days||[]).filter(x=>x.date<=d).reduce((n,x)=>n+(x.totals[t]||0),0)});
  for(const [filename,source] of sources)vm.runInContext(source,context,{filename});
  const groups=context.todayGroupDetails841(day,areas),summary=context.todayWorkSummary842(day,areas,groups,fencing);
  if(opts.changeGroups)opts.changeGroups(groups);
  if(opts.changeSummary)opts.changeSummary(summary);
  const immutable=()=>JSON.stringify({groups,summary,rows:rows.map(r=>({...r,askedBy:[...r.askedBy],onBy:[...r.onBy]}))});
  const before=immutable(),beforeNative=nativeCalls;
  const project=context.todayWorkSummary842;
  const projectionCalls=[];
  context.todayWorkSummary842=(...args)=>{projectionCalls.push({areas:args[1].length,fenceRows:args[3].summaryRows.length});return project(...args);};
  const result=context.todayTypeMetrics843(day,groups,summary);
  assert.equal(immutable(),before,'records and source metrics unchanged');
  return {result,groups,summary,rows,projectionCalls,nativeReads:nativeCalls-beforeNative,
    type:name=>result.instruments.find(x=>x.kind==='asset-type'&&x.name===name)};
}
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('every exact type gets one instrument with stable source identity',()=>{
  const f=fixture();assert.equal(f.result.coverage.allRepresented,true);
  assert.equal(f.type('Building 3m').total,2);assert.equal(f.type('Building 6m').total,3);
  assert.notEqual(f.type('Building 3m').id,f.type('Building 6m').id);
  assert.equal(new Set(f.result.instruments.map(x=>x.id)).size,f.result.instruments.length);
  const reversed=fixture({rows:f.rows.slice().reverse()});
  assert.equal(f.type('Building 3m').id,reversed.type('Building 3m').id);
});
test('toilet waste tanks retain separate type scope without changing toilet headline',()=>{
  const f=fixture(),tank=f.type('Waste tank');assert.equal(tank.cardId,'toilets');assert.equal(tank.total,4);
  assert.match(tank.scopeNote,/excluded from the toilet-unit headline/);assert.equal(f.type('Accessible Toilet').total,2);
});
test('mixed toilet and tank wording is retained as one source type',()=>{
  const f=fixture({rows:[native('SYN_MIX','Toilet','Toilets & amenities',[['Toilet and tank package',1]])]});
  assert.equal(f.result.byCard.toilets.length,1);assert.match(f.type('Toilet and tank package').scopeNote,/no split/);
});
test('all equipment families and product-first lighting mapping are preserved',()=>{
  const f=fixture();assert.equal(f.type('Lighting tower').cardId,'lighting');
  for(const name of ['Forklift 5t','VMS board','Water-filled barrier','Track mat','Chair','Synthetic tool'])assert.equal(f.type(name).cardId,'equipment');
});
test('missing quantity keeps native schedule reading but no fallback completion percentage',()=>{
  const r=native('SYN_BLANK','Portable Building','Portable buildings',[['Building unknown',null]],{d:{done:true}});
  const t=fixture({rows:[r]}).type('Building unknown');
  assert.equal(t.scheduleTotal,1);assert.equal(t.total,null);assert.equal(t.pct,null);assert.equal(t.left,null);assert.equal(t.done,0);
});
test('fractional units never enter physical completion totals',()=>{
  const r=native('SYN_FRACTION','Toilet','Toilets & amenities',[['Portable toilet',1.5]],{d:{done:true}});
  const t=fixture({rows:[r]}).type('Portable toilet');
  assert.equal(t.scheduleTotal,1.5);assert.equal(t.total,null);assert.equal(t.knownTotal,0);assert.equal(t.done,0);assert.equal(t.pct,null);
});
test('unknown track-mat unit preserves counts without physical done or percentage',()=>{
  const r=native('SYN_MAT','Trakmat','Ground protection',[['Track mat',7]],{d:{done:true},onBy:new Map([['Track mat',5]]),unitsOn:5});
  const t=fixture({rows:[r]}).type('Track mat');
  assert.equal(t.scheduleTotal,7);assert.equal(t.onSite,5);assert.equal(t.total,null);assert.equal(t.done,null);assert.equal(t.left,null);assert.equal(t.pct,null);
});
test('shortage leaves confirmed lower bound and whole conflicting quantity in left',()=>{
  const rows=[native('SYN_OK','Toilet','Toilets & amenities',[['Portable toilet',1]],{d:{done:true}}),
    native('SYN_SHORT','Toilet','Toilets & amenities',[['Portable toilet',5]],{d:{done:true}})];
  const t=fixture({rows,mainReview:['SYN_SHORT'],shorts:{SYN_SHORT:[{item:'Portable toilet'}]}}).type('Portable toilet');
  assert.equal(t.total,6);assert.equal(t.done,1);assert.equal(t.left,5);assert.equal(t.reviewQuantity,5);assert.equal(t.pct,16.66);assert.equal(t.pctKind,'lower-bound');
});
test('mixed-reference sibling review is not falsely labelled an item shortage',()=>{
  const r=native('SYN_MIX','Toilet','Toilets & amenities',[['Accessible toilet',1],['Pan block',2]],{d:{done:true}});
  const f=fixture({rows:[r],mainReview:['SYN_MIX'],shorts:{SYN_MIX:[{item:'Accessible toilet'}]}});
  assert.equal(f.type('Accessible toilet').rows[0].conflictReason,'item-short');
  const sibling=f.type('Pan block');assert.equal(sibling.done,0);assert.equal(sibling.rows[0].conflictReason,'reference-review');
  assert.match(sibling.rows[0].status,/Reference completion/);assert.equal(sibling.reviewQuantity,2);
});
test('main reference-review propagation matches the native global lookup across cards',()=>{
  const r=native('SYN_X','Light Tower','Generators',[['Lighting tower',2]],{d:{done:true}});
  const areas=[{id:'generators',name:'Synthetic source classification',total:2,knownTotal:2,done:0,
    rows:[{key:'SYN_X',quantity:2,complete:false,recordedComplete:true}],issues:[]}];
  const f=fixture({rows:[r],areas});assert.equal(f.type('Lighting tower').done,0);assert.equal(f.type('Lighting tower').reviewQuantity,2);assert.equal(f.result.coverage.allRepresented,true);
});
test('an accessory shortage alone does not block its building type',()=>{
  const r=native('SYN_B','Portable Building','Portable buildings',[['Building 6m',2],['Chair',4]],{d:{done:true}});
  const f=fixture({rows:[r],shorts:{SYN_B:[{item:'Chair'}]}});
  assert.equal(f.type('Building 6m').done,2);assert.equal(f.type('Building 6m').pctKind,'confirmed');
  assert.equal(f.type('Chair').done,0);assert.equal(f.type('Chair').pctKind,'lower-bound');
});
test('repeated same-item charge lines read the native item map only once',()=>{
  const r=native('SYN_DUP','Portable Building','Portable buildings',[['Building 6m',2],['Building 6m',3]],
    {d:{done:true},onBy:new Map([['Building 6m',4]]),unitsOn:4});
  const t=fixture({rows:[r]}).type('Building 6m');
  assert.equal(t.total,5);assert.equal(t.done,5);assert.equal(t.onSite,4);assert.equal(t.rows.length,1);assert.equal(t.rows[0].onSite,4);
});
test('cancelled relocation follow-up and moved references stay outside type quantities',()=>{
  const rows=['SYN_BASE','SYN_CANCEL','SYN_RELOC','SYN_REST','SYN_MOVED'].map(k=>native(k,'Access','Access & plant',[['Forklift',1]]));
  rows[1].a._cancelled=true;rows[2].reloc=true;rows[3].a.rest_of='SYN_BASE';
  const f=fixture({rows,moved:['SYN_MOVED']});assert.equal(f.type('Forklift').total,1);assert.deepEqual([...f.type('Forklift').keys],['SYN_BASE']);assert.equal(f.result.coverage.allRepresented,true);
});
test('on site or on hire is distinct from confirmed completion and strict arrival plan',()=>{
  const r=native('SYN_RENTAL','Generator','Generators',[['Generator',2]],{d:{recorded:true,state:'on site',where:'rental'},
    on:true,byRental:true,onBy:new Map([['Generator',2]]),unitsOn:2});
  const t=fixture({rows:[r]}).type('Generator');
  assert.equal(t.onSite,2);assert.equal(t.done,0);assert.equal(t.onSiteLabel,'On site / on hire');
  assert.equal(t.plan.actual,0);assert.equal(t.plan.behind,1);assert.match(t.rows[0].status,/On hire/);
});
test('each mixed type gets its own reference membership without netting early over overdue',()=>{
  const rows=[native('SYN_DUE','Toilet','Toilets & amenities',[['Toilet A',1],['Tank B',2]]),
    native('SYN_EARLY','Toilet','Toilets & amenities',[['Toilet A',1]],{st:{in:'2026-09-12'},d:{recorded:true,state:'on site',where:'person'}})];
  const f=fixture({rows}),a=f.type('Toilet A'),b=f.type('Tank B');
  assert.equal(a.plan.behind,1);assert.equal(a.plan.early,1);assert.equal(a.plan.status,'behind');
  assert.equal(b.plan.behind,1);assert.equal(b.plan.early,0);assert.equal(b.plan.unit,'references');
});
test('fencing reuses existing source row quantities percentages and plans without recomputation',()=>{
  const f=fixture(),row=f.result.byCard.fencing.find(x=>x.fenceId==='clean');
  assert.equal(row.sourceRow,f.summary.fencingRows[0]);assert.equal(row.total,100);assert.equal(row.done,25);assert.equal(row.left,75);assert.equal(row.plan,f.summary.fencingRows[0].plan);
});
test('plan projection is one batch regardless of number of item types',()=>{
  const f=fixture();assert.equal(f.projectionCalls.length,1);assert.equal(f.projectionCalls[0].areas,f.result.instruments.filter(x=>x.kind==='asset-type').length);
  assert.equal(f.projectionCalls[0].fenceRows,0);assert.equal(f.nativeReads,2);
});
test('historical figures retain current quantity and shortage evidence qualification',()=>{
  const t=fixture({day:'2026-09-05'}).type('Building 6m');
  assert.ok(t.issues.some(x=>/supplied-shortage evidence are current/.test(x)));
});
test('hydration does not manufacture empty complete type coverage',()=>{
  const f=fixture({ready:false});assert.equal(f.result.coverage.ready,false);assert.equal(f.result.coverage.allRepresented,false);assert.equal(f.result.instruments.length,0);
});
test('source coverage failures and duplicate displayed identities preserve fallback tables',()=>{
  assert.equal(fixture({changeGroups:g=>g.allGroupsCovered=false}).result.coverage.allRepresented,false);
  const f=fixture({changeGroups:g=>g.buildings.groups[0].types.push(g.buildings.groups[0].types[0])});
  assert.equal(f.result.coverage.allRepresented,false);assert.ok(f.result.coverage.issues.some(x=>/same displayed identity/.test(x)));
});
test('a mismatch between native aggregate and source references fails coverage',()=>{
  const f=fixture({changeGroups:g=>g.buildings.groups[0].types[0].knownComplete+=1});
  assert.equal(f.result.coverage.allRepresented,false);assert.ok(f.result.coverage.issues.some(x=>/does not reconcile/.test(x)));
});
console.log('PASS '+checks+'/'+checks+' type metric checks');
