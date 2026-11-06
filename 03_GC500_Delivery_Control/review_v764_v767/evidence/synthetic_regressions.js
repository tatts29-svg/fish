// Author: Andrew Fisher
// Offline review fixtures. Reads JavaScript literals from the actual Python patches;
// never executes a patch, opens a browser, reads live records or makes a request.
// Run: node review_v764_v767/evidence/synthetic_regressions.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const extract = (file, name) => {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const marker=name+' = r"""', start=source.indexOf(marker);
  assert.ok(start>=0, 'Expected raw source literal '+name);
  const from=start+marker.length, end=source.indexOf('"""',from);
  assert.ok(end>from, 'Expected source literal terminator');
  return source.slice(from,end);
};
const sources = {
  costs: extract('v7.64_costs_correct_and_to_job_end_LIVE/patch_v764.py', 'HELPERS'),
  rehire: extract('v7.66_rehire_by_branch_LIVE/patch_v766.py', 'JS'),
  prices: extract('v7.67_priced_by_us_LIVE/patch_v767.py', 'JS')
};
const checks = [];
const test = (name, run) => {
  try { const evidence = run(); checks.push({name, pass:true, evidence}); }
  catch (e) { checks.push({name, pass:false, expected:e.expected, actual:e.actual, message:e.message}); }
};
const context = extra => Object.assign({
  todayIso:()=> '2026-10-01', DATA:{weeks:[],plant_lines:{},unreferenced:[],fencing:{week_sheets:[]}},
  FCOL:[], ONHIRE_ROWS:[], allDockets:()=>[], fenceByWeek:()=>[], fencePaidSplit:()=>({gear:0,installation:0,green:0}),
  moneySummary:()=>({charge:{total:0},cost:{known:0},categories:[]}),
  allAssets:()=>[], assetTotal:()=>({lines:[]}), ourCosts:()=>[], fin745Rows:()=>[],
  pl754Rehire:()=>({co:'Example supplier',cost:0,servicing:0,approved:true}), pl752Rows:()=>[],
  cj764Model:()=>({fencing:{cost:0,revenue:0,weeks:[],noCostRate:{},hourly:{}},revenue:{job:1000}}),
  contractCharge:r=>({amount:r.fixtureAmount}), fmtNum:String, fmtDate:String, money:String, money0:String,
  lr748Decided:()=>false, lr748For:()=>null
}, extra);
const load = (source, extra) => { const c=vm.createContext(context(extra)); vm.runInContext(source,c); return c; };

test('764: outstanding fencing remains visible after the programme week ends',()=>{
  let day='2026-10-01';
  const c=load(sources.costs, {
    todayIso:()=>day,
    fenceByWeek:()=>[{week:'Example week',planWords:'2026 programme',rolled:true,start:'2026-09-25',end:'2026-10-01',
      lines:[{column:'clean',name:'clean',unit:'m',remaining:10}]}],
    fenceRateFor:()=>({value:20}),fenceCostFor:()=>({value:10})
  });
  assert.equal(c.cj764Fencing().cost,100);
  day='2026-10-02';
  // An explicitly reported unresolved/backlog amount is also acceptable after the fix;
  // this assertion currently exposes the silent disappearance from every output.
  assert.equal(c.cj764Fencing().cost,100,'Unchanged outstanding work must not silently disappear at midnight');
});

test('764: recorded transport replacement supersedes the card forecast',()=>{
  const c=load(sources.costs, {
    moneySummary:()=>({charge:{total:0},cost:{known:300,transport:{amount:300,
      schedule:{counted:0,counted_refs:0,by_our_line:1}}},categories:[]}),
    allAssets:()=>[{key:'EXAMPLE',events:[{carrier:'Example carrier'}]}],
    assetTotal:()=>({lines:[{qty:1,transport_cost:100}]}),
    ourCosts:()=>[{kind:'transport',usable:true,ref:'EXAMPLE',amount:300}]
  });
  const row=c.cj764Model().rows.find(r=>r.stream.startsWith('Transport'));
  assert.equal(row.job,300,'A recorded replacement cannot retain an additional card estimate for the same reference');
});

test('766: gear and external installation remain separate cost categories',()=>{
  const c=load(sources.rehire, {
    moneySummary:()=>({charge:{total:500,fencing:500,fencing_dockets:1},cost:{},
      categories:[{key:'fencing',amount:200}]}),
    fencePaidSplit:()=>({clean:true,paid:180,gear:150,docket_labour:30,green:20,installation:50})
  });
  const row=c.rh766Model().groups.find(g=>g.what.startsWith('Fencing'));
  assert.equal(row.cost,150,'Rehire cost is the gear; the separate installation category is not rehire');
});

test('766: an NVAC non-forklift marked hired in is retained',()=>{
  const c=load(sources.rehire, {ONHIRE_ROWS:[{branch_code:'NVAC',family:'generator',subhired_machine:true,
    item:'EXAMPLE-GENERATOR',description:'Example generator',quantity:1,fixtureAmount:100}]});
  assert.equal(c.rh766Model().totals.rev,100,'Branch exclusion must not hide a marked hired-in machine');
});

test('766: a toilet marked hired in is counted once',()=>{
  const c=load(sources.rehire, {ONHIRE_ROWS:[{branch_code:'KINP',family:'toilet',subhired_machine:true,
    item:'EXAMPLE-TOILET',description:'Example toilet',quantity:1,fixtureAmount:100}]});
  assert.equal(c.rh766Model().totals.rev,100,'A line already in the toilet group cannot enter the other-machine group');
});

test('767: different extension dimensions are not asserted to be the same item',()=>{
  const c=load(sources.prices, {ONHIRE_ROWS:[
    {branch_code:'NVAC',item:'EXAMPLE-1800',description:'Fork Extension 1800mm',rate_1:null},
    {branch_code:'MEAD',item:'EXAMPLE-2400',description:'Fork Extension 2400mm',rate_1:20,rate_type:'W'}
  ]});
  assert.equal(c.pl767Unpriced().items[0].sib,undefined,
    'A keyword match alone cannot justify telling the reader to copy a rate');
});

console.log(JSON.stringify({author:'Andrew Fisher',mode:'offline synthetic fixtures',checks,
  passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length},null,2));
process.exitCode=checks.every(c=>c.pass)?0:1;
