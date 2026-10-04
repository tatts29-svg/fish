/* Author: Andrew Fisher. Synthetic adapter checks; no private project fixtures. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'group_details841_src.js'), 'utf8');
const ids = ['buildings','toilets','fencing','generators','lighting','equipment'];
const needs = ['rates','lineRates','accRates','fenceRates','fenceCosts','weeks','serviceNotes','fenceDone','breakdowns','contracts','hireStart','minDays','labour','eventHours','variances'];
function row(key, product, disc, item, quantity, extra = {}) {
  const cls = [{item,quantity}];
  return {a:{key,product,discipline:disc,name:key},cls,asked:quantity == null ? 1 : quantity,
    askedBy:new Map([[item,quantity == null ? 1 : quantity]]),onBy:new Map([[item,0]]),
    unitsOn:0,nums:[],subs:[],accs:[],d:{done:false},t:{total:1},...extra};
}
function fixture(opts = {}) {
  const rows = opts.rows || [row('SYN_L','Light Tower','Generators','Light tower',2),
    row('SYN_G','Generator','Generators','Generator',3),
    row('SYN_B','Portable Building','Portable buildings','Building',4),
    row('SYN_T','Toilet','Toilets & amenities','Toilet block',5),
    row('SYN_A','Access','Access & plant','Forklift',2),
    row('SYN_V','VMS','Variable message signs','VMS board',3),
    row('SYN_W','WFB','Water-filled barriers','Barrier',10),
    row('SYN_M','Trakmat','Ground protection','Track mat',8),
    row('SYN_F','Furniture','Furniture','Chair',6),
    row('SYN_O','Synthetic specialist gear','Unknown trade','Synthetic gear',7)];
  const charges = opts.charges || new Map([['Generators',{charge:99.65,charge0:100,lines:3,unrated:1}],['Lighting towers',{charge:12.4,charge0:12,lines:1,unrated:0}],['Access & plant',{charge:25,charge0:25,lines:2,unrated:0}]]);
  const byDisc = new Map([...new Set(rows.map(r=>r.a.discipline))].map(d=>[d,{hire0:11,transport0:4,n:rows.filter(r=>r.a.discipline===d).length}]));
  const data = {rows,charges,byDisc,areas:opts.areas||[],calls:[],...opts};
  const context = vm.createContext({DATA:{edition:opts.hosted?'hosted':'file'},SYNC:{first:new Set(opts.first || needs)},
    state:{asOf:opts.selected || ''},todayIso:()=> '2026-10-04',todayWorkHealth840:()=>({ready:true,loading:false,stale:false,status:'live',basis:'Synthetic records'}),
    todayWorkMetrics840:d=>{data.calls.push(['work',d]);return data.areas;},
    dsnState:d=>{data.calls.push(['dsn',d]);return {rows,byDisc,P:{areas:4,areasDone:2,fenceBd:1,notRolled:['Synthetic old sheet']}};},
    shortOf:a=>(opts.shorts||{})[a.key]||[],qtyOf:l=>l.quantity == null || String(l.quantity).trim()===''?null:Number(l.quantity),
    movedAway:k=>(opts.moved||[]).includes(k),isMiscRow:r=>!!r.misc,
    tradeCharges:()=>charges,barrierQty:()=>({master:20,detail:23}),PROG_NEXT_DAYS:7,
    DSN_GROUPS:[{name:'Track mat',disc:'Ground protection',nounit:true,what:'Schedule unit unconfirmed'},
      {name:'Furniture',disc:'Furniture',what:'Stand-alone furniture only'}],dsnGroupWord:()=> 'items',
    fenceTypes:()=>[{key:'clean',name:'Clean fence',type:'Synthetic whole programme',unit:'m',total:120,planned:45,done:30},
      {key:'v_gates',name:'Vehicle gates',type:'Synthetic gates',unit:'each',total:3,planned:1,done:2}],
    fenceDerived:()=>({charged:321.5,cost:123.25}),greenBookTotals:()=>({notes:2,rate:opts.noGreenRate?null:10,amount:33,unpriced:1})});
  vm.runInContext(source, context);
  const before=JSON.stringify({rows:[...rows].map(r=>({...r,askedBy:[...r.askedBy],onBy:[...r.onBy]})),charges:[...charges],byDisc:[...byDisc]});
  const result=context.todayGroupDetails841(opts.day,opts.passAreas?data.areas:undefined);
  assert.equal(JSON.stringify({rows:[...rows].map(r=>({...r,askedBy:[...r.askedBy],onBy:[...r.onBy]})),charges:[...charges],byDisc:[...byDisc]}),before,'native inputs unchanged');
  return {data,result,group:n=>ids.flatMap(id=>result[id].groups).find(g=>g.name===n)};
}
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('product-first routing retains all native references exactly once',()=>{
  const f=fixture();assert.equal(f.result.lighting.groups[0].keys[0],'SYN_L');
  assert.deepEqual([...f.result.generators.groups[0].keys],['SYN_G']);
  assert.equal(f.result.equipment.groups.length,6);
  assert.equal(f.result.allGroupsCovered,true);assert.equal(f.result.__coverage.sourceKeys.length,10);
  assert.equal(new Set(f.result.__coverage.representedKeys).size,10);
});
test('on site is independent of Complete and retains supplied native item count',()=>{
  const r=row('SYN_A','Access','Access & plant','Forklift',3,{on:true,byRental:true,unitsOn:2,onBy:new Map([['Forklift',2]])});
  const t=fixture({rows:[r]}).group('Forklifts & access').types[0];
  assert.equal(t.onSite,2);assert.equal(t.complete,0);assert.equal(t.remaining,3);
});
test('repeated item lines do not multiply one native onBy total',()=>{
  const r=row('SYN_B','Portable Building','Portable buildings','Building',5,{cls:[{item:'Building',quantity:2},{item:'Building',quantity:3}],
    onBy:new Map([['Building',4]]),unitsOn:4,d:{done:true}});
  const t=fixture({rows:[r]}).result.buildings.groups[0].types[0];
  assert.equal(t.total,5);assert.equal(t.onSite,4);assert.equal(t.complete,5);assert.equal(t.remaining,0);
});
test('missing native schedule quantities never become one unit of completion',()=>{
  const r=row('SYN_U','Toilet','Toilets & amenities','Toilet',null,{d:{done:true}});
  const t=fixture({rows:[r]}).result.toilets.groups[0].types[0];
  assert.equal(t.total,1);assert.equal(t.complete,null);assert.equal(t.remaining,null);assert.equal(t.noQuantityLines,1);
});
test('physical Complete conflict matches instrument while accessory short remains separate',()=>{
  const r=row('SYN_B','Portable Building','Portable buildings','Building',2,{d:{done:true},
    cls:[{item:'Building',quantity:2},{item:'Chair',quantity:4}],asked:6,askedBy:new Map([['Building',2],['Chair',4]])});
  const f=fixture({rows:[r],shorts:{SYN_B:[{item:'Chair'}]},areas:[{id:'buildings',rows:[{key:'SYN_B',recordedComplete:true,complete:true}]}]});
  assert.equal(f.result.buildings.groups[0].types.find(t=>t.name==='Building').complete,2);
  assert.equal(f.result.buildings.groups[0].types.find(t=>t.name==='Chair').complete,null);
  const bad=fixture({rows:[r],areas:[{id:'buildings',rows:[{key:'SYN_B',recordedComplete:true,complete:false}]}]});
  assert.equal(bad.result.buildings.groups[0].types.find(t=>t.name==='Building').complete,null);
});
test('relocation, follow-up and moved references remain discoverable without duplicate order',()=>{
  const rows=[row('SYN_BASE','Access','Access & plant','Forklift',1),row('SYN_MOVE','Access','Access & plant','Forklift',1,{reloc:true}),
    row('SYN_REST','Access','Access & plant','Forklift',1),row('SYN_OLD','Access','Access & plant','Forklift',1)];
  rows[2].a.rest_of='SYN_BASE';
  const f=fixture({rows,moved:['SYN_OLD']}),g=f.group('Forklifts & access');
  assert.equal(g.summary.total,1);assert.equal(g.excluded.length,3);assert.equal(f.result.allGroupsCovered,true);
});
test('separate equipment types preserve track-mat ambiguity and drawing source counts',()=>{
  const f=fixture();assert.match(f.group('Track mat').unit,/unconfirmed/);assert.equal(f.result.equipment.pct,undefined);
  assert.equal(f.group('Water-filled barriers').facts.find(x=>/K220/.test(x.label)).value,20);
  assert.equal(f.group('Water-filled barriers').facts.find(x=>/K221/.test(x.label)).value,23);
});
test('due, overdue, next-day and no-record quantities retain native flags',()=>{
  const rows=[row('SYN_1','VMS','Variable message signs','VMS',2,{due:true,overdue:true,norecord:true}),
    row('SYN_2','VMS','Variable message signs','VMS',3,{next:true}),row('SYN_3','VMS','Variable message signs','VMS',5,{next:true,on:true})];
  const g=fixture({rows}).group('VMS boards');
  assert.equal(g.summary.due,2);assert.equal(g.summary.overdue,2);assert.equal(g.summary.noRecord,2);assert.equal(g.summary.next,3);assert.equal(g.summary.nextDays,7);
});
test('contract Revenue and original discipline comparisons retain exact native buckets once',()=>{
  const f=fixture(),revenue=f.result.generators.money[0];
  assert.equal(revenue.amount,100);assert.equal(revenue.rawAmount,99.65);assert.equal(revenue.unrated,1);
  assert.equal(f.result.lighting.money[0].amount,12);
  assert.equal(f.result.generators.comparisons.find(x=>x.group==='Generators').refs,2);
  assert.match(revenue.basis,/Not limited to the selected day/);
  assert.equal(f.result.__coverage.sourceMoneyIds.length,f.result.__coverage.mappedMoneyIds.length);
});
test('whole fencing programme, planned-by-day, areas, breakdowns and separate costs retained',()=>{
  const f=fixture().result.fencing,clean=f.programmeRows[0];
  assert.equal(clean.total,120);assert.equal(clean.planned,45);assert.equal(clean.recorded,30);assert.equal(clean.behind,15);assert.equal(clean.remaining,90);
  assert.equal(f.programmeRows[1].unit,'each');assert.match(f.basis,/including Demob/);
  assert.equal(f.facts[0].value,2);assert.equal(f.facts[0].total,4);assert.equal(f.facts[1].value,1);
  assert.equal(f.money.find(x=>x.id==='fence-cost').amount,123.25);assert.equal(f.money.find(x=>x.id==='green-book').amount,33);
  assert.equal(fixture({noGreenRate:true}).result.fencing.money.find(x=>x.id==='green-book').amount,null);
});
test('selected historical day reaches every dated native reading and preserves caveat',()=>{
  const f=fixture({selected:'2026-09-15'});assert.equal(f.result.asOf,'2026-09-15');
  assert.ok(f.data.calls.every(x=>x[1]==='2026-09-15'));assert.ok(f.result.equipment.notes.some(x=>/current values/.test(x)));
});
test('hydration gates all coverage until financial and programme inputs arrive',()=>{
  const f=fixture({hosted:true,first:needs.filter(x=>x!=='fenceCosts')});assert.equal(f.result.health.ready,false);
  assert.equal(f.result.allGroupsCovered,false);assert.equal(f.data.calls.length,0);assert.equal(f.result.fencing.money.length,0);
  assert.equal(fixture({hosted:true}).result.allGroupsCovered,true);
});
test('duplicate native references fail lossless merge coverage instead of hiding native cards',()=>{
  const r=row('SYN_DUP','Access','Access & plant','Forklift',1);
  assert.equal(fixture({rows:[r,r]}).result.allGroupsCovered,false);
});
test('supplied progress model is reused without a second metric calculation',()=>{
  const f=fixture({passAreas:true});assert.equal(f.data.calls.filter(x=>x[0]==='work').length,0);
});
console.log('PASS '+checks+'/'+checks+' group detail checks');
