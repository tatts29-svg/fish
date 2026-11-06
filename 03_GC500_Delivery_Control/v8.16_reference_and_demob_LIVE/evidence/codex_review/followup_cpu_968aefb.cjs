// Author: Andrew Fisher. Offline audit fixtures; no browser, network or shared record writes.
// node followup_cpu_968aefb.cjs /path/to/frozen/demob816_src.js /path/to/patched_candidate.html
const fs = require('fs'), vm = require('vm'), assert = require('assert');
assert(process.argv[2] && process.argv[3], 'Usage: node followup_cpu_968aefb.cjs <frozen demob816_src.js> <v8.13 HTML with that exact v8.16 patch applied>');
const source = fs.readFileSync(process.argv[2], 'utf8');
const base = fs.readFileSync(process.argv[3], 'utf8');
const results = [];
function ctx(assets = []) {
  const c = vm.createContext({console, Date, Map, Set, Math, JSON, Number, String, isFinite, assets,
    S: {delivery:{}}, CROW: new Map(), RENDER_MEMO: new Map(), DATA: {depot:{planning:{precinct_min:10}}},
    localStorage:{getItem:()=>null}, todayIso:()=> '2026-10-26', allAssets:()=>assets,
    assetOf:k=>assets.find(a=>a.key===k), itemRows:a=>a.rows, refKind:a=>a.kind||'toilet',
    rowOff:()=>false, subhireOf:()=>null, onhireForAsset:()=>[], branchOf:k=>assets.find(a=>a.key===k).branch||'KINP',
    effectiveDates:a=>({out_plan:a.out||null}), flash:()=>{}, mayWrite:()=>true, whoAmI:()=> 'Fixture operator',
    isRef:k=>assets.some(a=>a.key===k), bump:()=>{}, buzz:()=>{}, blank:()=>({}), tombed:()=>false,
    fmtStamp:x=>x, fmtDate:x=>x, fmtDay:x=>({dow:'day',dm:x})});
  vm.runInContext(source, c);
  vm.runInContext(`zone816=a=>({zone:a.zone||'gate1',side:a.side||'outside'});
    deliveryOf=k=>S.delivery[k]||{state:'on site'};`, c);
  return c;
}
const run=(c,s)=>vm.runInContext(s,c);
const asset=(key,rows,extra={})=>({key,rows,item_types:rows.map(r=>r.asked),...extra});
function record(name, observed, requirement) { results.push({name,observed,requirement}); }
function original(c,name,endMarker) {
  const start=base.indexOf('function '+name+'('), end=base.indexOf(endMarker,start);
  assert(start>=0&&end>start,name); vm.runInContext(base.slice(start,end),c);
}
function attachDateSetter(c) {
  original(c,'setDate','\n/* ------------------------------------------------------------------ typed over');
  c.deliveryEmpty=d=>!d.state&&!d.out_date&&typeof d.emptied!=='boolean';
  c.bump=()=>c.RENDER_MEMO.clear();
}
function schedule(c) {return run(c,`JSON.parse(JSON.stringify(demob816().days.flatMap(d=>demob816().day[d].loads.map(l=>({day:d,units:l.units,keys:l.rows.map(x=>x.r.key),uncertain:l.uncertain})))))`);}
{
  const c=ctx([asset('WC25',[{asked:'FWF',qty_supplied:25}])]); attachDateSetter(c);
  const before=schedule(c); run(c,"confirm816('2026-10-26','all')");
  record('confirm_split_collapses_dates',{before,stored:c.S.delivery.WC25,after:schedule(c)},'confirming the proposed portions preserves the agreed dates/quantities');
}
{
  const c=ctx([asset('WC49',[{asked:'FWF',qty_supplied:49}])]);
  record('split_early_load_without_pump_task',run(c,`JSON.parse(JSON.stringify(demob816().days.filter(d=>demob816().day[d].loads.length).map(d=>({day:d,units:demob816().day[d].loads.reduce((n,l)=>n+l.units,0),pumpKeys:demob816().day[d].pump.map(x=>x.r.key)}))))`),'pump task on or before every portion, including first day');
}
{
  const c=ctx([asset('WCUNK',[{asked:'FWF',qty_asked:null,qty_supplied:null}])]); attachDateSetter(c);
  const before=schedule(c); run(c,"confirm816('2026-10-26','all')");
  record('unknown_confirmed_vanishes_from_run',{before,after:schedule(c),list:run(c,"demob816().day['2026-10-26'].list.map(r=>r.key)"),trucks:run(c,"trucks816('2026-10-26','all').length")},'unknown reference remains represented in unresolved collection work after date confirmation');
}
{
  const c=ctx([asset('WCMIX',[{asked:'FWF',qty_asked:null,qty_supplied:null},{asked:'Waste tank',qty_supplied:1}],{out:'2026-10-26'})]);
  record('unknown_toilet_tank_without_predecessor',run(c,"JSON.parse(JSON.stringify(trucks816('2026-10-26','all').map(l=>({kind:l.kind,stops:l.t.st.map(s=>({at:s.at,end:s.end,parts:s.s.parts.map(p=>p.type)}))}))))"),'tank has a represented completed predecessor or is unresolved');
}
{
  const c=ctx([]); original(c,'mergeRecords','\nfunction applyImport(');
  c.deliveryEmpty=d=>typeof d.emptied!=='boolean';
  c.A={delivery:{WC01:{emptied:true,emptied_by:'A',emptied_at:'2026-10-26T00:00:00Z'}}};
  c.B={delivery:{WC01:{emptied:false,emptied_by:'B',emptied_at:'2026-10-26T00:00:00Z'}}};
  record('merge_equal_time_order_dependent',run(c,"({ab:mergeRecords(A,B),ba:mergeRecords(B,A)})"),'same result and explicit clash regardless of input order; contradictory clearance must not silently permit loading');
}
{
  const c=ctx([asset('WC01',[{asked:'FWF',qty_supplied:1}])]);
  c.S.delivery.WC01={state:'in transit',history:[{state:'on site',at:'2026-10-20T00:00:00Z'}]};
  record('prior_onsite_amber_gate',run(c,"emptyGate816('WC01','not on site')"),'false');
}
console.log(JSON.stringify({author:'Andrew Fisher',source:process.argv[2],base:process.argv[3],results},null,2));
