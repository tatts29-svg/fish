/* Author: Andrew Fisher. Synthetic fixtures only; no private project records. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'fencing_metrics841_src.js'), 'utf8');
const keys = ['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','relocation','removal'];
const columns = keys.map(key => ({key, unit: /gates/.test(key) ? 'each' : 'm', programme_type: 'Synthetic programme ' + key}));
columns.push({key:'fence_blocks', unit:'each', programme_type:null}, {key:'labour',unit:'hr',programme_type:null}, {key:'team_leader',unit:null,programme_type:null});
const buildA = 'Synthetic Build A', buildB = 'Synthetic Build B';
const quantities = (n = 10) => Object.fromEntries(keys.map(k => [k,n]));
const planTotals = (n = 50) => Object.fromEntries(columns.filter(c => c.programme_type).map(c => [c.programme_type,n]));
const docket = (id, extra = {}) => ({id,date:'2026-09-04',week:buildA,usable:true,scope:'programme',quantities:quantities(),...extra});
function fixture(overrides = {}) {
  const data = {
    health:{ready:true,loading:false,stale:false,basis:'Shared progress records'},
    columns:JSON.parse(JSON.stringify(columns)),
    weeks:[{sheet:buildA,phase:'Build',start:'2026-09-01',end:'2026-09-10'},
      {sheet:buildB,phase:'Build',start:'2026-09-11',end:'2026-09-20'},
      {sheet:'Synthetic Event',phase:'Event',start:'2026-09-21',end:'2026-09-23'},
      {sheet:'Synthetic Demob',phase:'Demob',start:'2026-09-24',end:'2026-10-01'}],
    plans:{[buildA]:{sheet:'Synthetic plan A',year:2026,rolled_forward:true,totals:planTotals(60)},
      [buildB]:{sheet:'Synthetic plan B',year:2026,rolled_forward:true,totals:planTotals(40)},
      'Synthetic Event':{sheet:'Synthetic plan event',year:2026,totals:planTotals(200)},
      'Synthetic Demob':{sheet:'Synthetic plan demob',year:2026,totals:planTotals(300)}},
    dockets:[docket('SYN_A')], day:'2026-09-08', ...overrides
  };
  const context = vm.createContext({DATA:{weeks:data.weeks},FCOL:data.columns,
    todayIso:()=>data.day,todayWorkHealth840:()=>data.health,
    progSheetOf:key=>data.plans[key]||null,allDockets:()=>data.dockets});
  vm.runInContext(source,context,{filename:'fencing_metrics841_src.js'});
  const before=JSON.stringify(data), result=context.todayFencingSummary841(data.day);
  assert.equal(JSON.stringify(data),before,'summary must not mutate inputs');
  return {data,result,row:key=>result.summaryRows.find(r=>r.id===key)};
}
let checks=0;
function test(name,fn){fn();checks++;process.stdout.write('PASS '+name+'\n');}
test('eight measured work types retain independent units and denominators',()=>{
  const f=fixture();assert.equal(f.result.summaryRows.length,8);
  for(const key of keys){const row=f.row(key);assert.equal(row.recorded,10);assert.equal(row.planned,100);assert.equal(row.remaining,90);assert.equal(row.pct,10);}
  assert.equal(f.row('v_gates').unit,'each');assert.equal(f.row('ccb_event').unit,'m');
  assert.equal(f.result.total,undefined);assert.equal(f.result.pct,undefined);
});
test('full Build plan includes future Build weeks but excludes Event and Demob plans',()=>{
  const f=fixture();assert.equal(f.row('clean').planned,100);assert.equal(f.row('removal').planned,100);
});
test('different fence work on the same docket is never combined',()=>{
  const f=fixture({dockets:[docket('SYN_A',{quantities:{clean:30,scrim:20,relocation:7,removal:4,v_gates:2}})]});
  assert.equal(f.row('clean').recorded,30);assert.equal(f.row('scrim').recorded,20);
  assert.equal(f.row('relocation').recorded,7);assert.equal(f.row('removal').recorded,4);
  assert.equal(f.row('v_gates').recorded,2);
});
test('Build scope excludes future, Event, Demob and mismatched week dockets',()=>{
  const f=fixture({day:'2026-09-30',dockets:[docket('SYN_A'),
    docket('SYN_FUTURE',{date:'2026-10-02'}),
    docket('SYN_EVENT',{date:'2026-09-22',week:'Synthetic Event'}),
    docket('SYN_DEMOB',{date:'2026-09-25',week:'Synthetic Demob'}),
    docket('SYN_MISLABEL',{date:'2026-09-25',week:buildA}),
    docket('SYN_UNKNOWN',{week:'Synthetic unknown'})]});
  keys.forEach(k=>assert.equal(f.row(k).recorded,10));assert.ok(f.row('clean').issues.some(x=>/matching Build week/.test(x)));
});
test('off-programme quantities remain separate from programme comparisons',()=>{
  const f=fixture({dockets:[docket('SYN_A'),docket('SYN_YARD',{scope:'compound',quantities:quantities(25)})]});
  keys.forEach(k=>{assert.equal(f.row(k).recorded,10);assert.equal(f.row(k).offProgramme,25);assert.equal(f.row(k).remaining,90);});
});
test('unknown or absent plan suppresses only the affected type comparison',()=>{
  const f=fixture();delete f.data.plans[buildB].totals['Synthetic programme scrim'];
  const next=fixture({plans:f.data.plans});assert.equal(next.row('scrim').planned,null);assert.equal(next.row('scrim').remaining,null);assert.equal(next.row('scrim').pct,null);
  assert.equal(next.row('scrim').recorded,10);assert.equal(next.row('clean').planned,100);
});
test('missing, stale or duplicate Build sheets leave plan unconfirmed',()=>{
  for(const plans of [{},
    {[buildA]:{sheet:'Synthetic old',year:2025,rolled_forward:false,totals:planTotals()}},
    {[buildA]:{sheet:'Synthetic duplicate',year:2026,totals:planTotals()},[buildB]:{sheet:'Synthetic duplicate',year:2026,totals:planTotals()}}]){
    const f=fixture({plans});keys.forEach(k=>{assert.equal(f.row(k).planned,null);assert.equal(f.row(k).pct,null);assert.equal(f.row(k).recorded,10);});
  }
});
test('zero programme is explicit and does not imply 100 percent',()=>{
  const plans={[buildA]:{sheet:'Synthetic A',year:2026,totals:planTotals(0)},[buildB]:{sheet:'Synthetic B',year:2026,totals:planTotals(0)}};
  const f=fixture({plans,dockets:[]});assert.equal(f.row('clean').planned,0);assert.equal(f.row('clean').remaining,0);assert.equal(f.row('clean').pct,null);
});
test('recorded blocks and docket labour have no invented programme totals',()=>{
  const f=fixture({dockets:[docket('SYN_A',{quantities:{clean:10,fence_blocks:12,labour:3.5,team_leader:8}})]});
  assert.equal(f.row('fence_blocks').recorded,12);assert.equal(f.row('fence_blocks').planned,null);assert.equal(f.row('fence_blocks').remaining,null);
  assert.equal(f.row('labour').recorded,3.5);assert.equal(f.row('labour').unit,'h');assert.equal(f.row('labour').pct,null);assert.equal(f.row('team_leader'),undefined);
  assert.equal(f.row('labour').kind,'recorded-only');
});
test('invalid records and quantities are excluded with per-type issues',()=>{
  const f=fixture({dockets:[docket('SYN_A'),docket('SYN_UNDATED',{date:null}),
    docket('SYN_BAD',{usable:false}),docket('SYN_QUANTITY',{quantities:{clean:-4,scrim:'unreadable',v_gates:1.5}})]});
  keys.forEach(k=>assert.equal(f.row(k).recorded,10));assert.ok(f.row('clean').issues.length>=2);
});
test('fractional gates cannot become a gate count or a valid programme',()=>{
  const f=fixture();f.data.plans[buildA].totals['Synthetic programme ped_gates']=2.5;
  const next=fixture({plans:f.data.plans,dockets:[docket('SYN_FRACTION',{quantities:{ped_gates:1.5}})]});
  assert.equal(next.row('ped_gates').planned,null);assert.equal(next.row('ped_gates').recorded,0);assert.ok(next.row('ped_gates').issues.length);
});
test('ambiguous column or unit leaves that type unknown',()=>{
  const c=JSON.parse(JSON.stringify(columns));c.find(x=>x.key==='ccb_event').unit='each';c.push({...c.find(x=>x.key==='clean')});
  const f=fixture({columns:c});assert.equal(f.row('clean').recorded,null);assert.equal(f.row('ccb_event').planned,null);assert.equal(f.row('scrim').recorded,10);
});
test('pending hydration never shows false zeroes',()=>{
  const f=fixture({health:{ready:false,loading:true,stale:false,basis:'Waiting for shared progress records'}});
  assert.equal(f.result.summaryRows.length,8);f.result.summaryRows.forEach(r=>{assert.equal(r.recorded,null);assert.equal(r.planned,null);assert.equal(r.remaining,null);assert.equal(r.pct,null);});
});
test('last received records remain explicit when offline',()=>{
  const f=fixture({health:{ready:true,loading:false,stale:true,basis:'Last received records · connection unavailable'}});
  assert.equal(f.row('clean').recorded,10);assert.ok(f.result.issues.some(x=>/connection unavailable/.test(x)));
});
test('overscope work remains visible without creating a cross-category credit',()=>{
  const f=fixture({dockets:[docket('SYN_A',{quantities:{clean:130,scrim:5}})]});
  assert.equal(f.row('clean').recorded,130);assert.equal(f.row('clean').remaining,0);assert.equal(f.row('clean').pct,100);
  assert.equal(f.row('scrim').remaining,95);assert.ok(f.row('clean').issues.some(x=>/exceeds/.test(x)));
});
process.stdout.write(checks+' synthetic fencing summary checks passed.\n');
