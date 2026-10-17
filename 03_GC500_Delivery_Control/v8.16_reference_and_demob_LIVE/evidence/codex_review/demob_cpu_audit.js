// Author: Andrew Fisher. Offline audit fixtures; no browser, network or shared record writes.
// node demob_cpu_audit.js /path/to/demob816_src.js /path/to/base_live.html
const fs = require('fs'), vm = require('vm'), assert = require('assert');
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
    fmtStamp:x=>x});
  vm.runInContext(source, c);
  vm.runInContext(`zone816=a=>({zone:a.zone||'gate1',side:a.side||'outside'});
    deliveryOf=k=>S.delivery[k]||{state:'on site'};`, c);
  return c;
}
const run=(c,s)=>vm.runInContext(s,c);
const asset=(key,rows,extra={})=>({key,rows,item_types:rows.map(r=>r.asked),...extra});
function record(name, observed, requirement) { results.push({name,observed,requirement}); }
{
  const c=ctx([asset('WC01',[{asked:'FWF',qty_supplied:1}])]);
  c.todayIso=()=> '2026-10-18';
  record('gate_before_event_week',run(c,"emptyGate816('WC01','in transit')"),'false: no date exception to pump-out gate');
  c.todayIso=()=> '2026-10-26'; c.S.delivery.WC01={state:'not on site'};
  record('gate_unrecorded_or_non_green_light',run(c,"emptyGate816('WC01','in transit')"),'false or explicit incoming-trip semantics; collection must not bypass');
  c.S.delivery.WC01={state:'on site',emptied:true};
  record('gate_without_actor_or_time',run(c,"emptyGate816('WC01','in transit',true)"),'false: by/when evidence required');
  c.S.delivery.WC01={state:'on site',emptied:true,emptied_by:'Older operator',emptied_at:'2026-10-25T00:00:00Z'};
  c.CROW.set('WC01',{delivery:{emptied:false,emptied_by:'Newer operator',emptied_at:'2026-10-26T00:00:00Z'}});
  record('newer_committed_untick',run(c,"emptiedOf816('WC01')"),'on:false with newer committed stamp');
  c.CROW.clear(); c.LIGHT={'on site':{label:'On site'}};
  const start=base.indexOf('function setLight(key, state){'), end=base.indexOf('\n/* Typed fields save',start);
  assert(start>=0 && end>start); vm.runInContext(base.slice(start,end),c);
  c.S.delivery.WC01.state='in transit'; run(c,"setLight('WC01','on site')");
  record('reused_reference_old_pumpout',run(c,"({emptied:emptiedOf816('WC01'),nextCollectionAllowed:emptyGate816('WC01','in transit',true)})"),'new on-site/use cycle must invalidate prior collection pump-out');
}
{
  const c=ctx([asset('WC01',[{asked:'FWF',qty_asked:null,qty_supplied:null}])]);
  record('unknown_quantity',run(c,"JSON.parse(JSON.stringify(demob816().day['2026-10-26'].loads.map(l=>({units:l.units,rows:l.rows.map(x=>({key:x.r.key,n:x.n,assumed:x.r.units[0].assumed}))}))))"),'unknown quantity must remain visibly unresolved, not a definitive one-unit load');
}
{
  const c=ctx([asset('WC25',[{asked:'FWF',qty_supplied:25}])]);
  record('split_reference_dates',run(c,"JSON.parse(JSON.stringify(demob816().days.flatMap(d=>demob816().day[d].loads.map(l=>({day:d,units:l.units,referenceDate:l.rows[0].r.iso,onDayList:demob816().day[d].list.some(r=>r.key==='WC25'),onPumpList:demob816().day[d].pump.some(x=>x.r.key==='WC25')})))))"),'each split load must have its own aligned collection/pump/confirmation date');
}
{
  const c=ctx([asset('WC02',[{asked:'FWF',qty_supplied:1},{asked:'Waste tank',qty_supplied:1}],{out:'2026-10-26'})]);
  record('mixed_toilet_tank_order',run(c,"JSON.parse(JSON.stringify(trucks816('2026-10-26','all').map(l=>({kind:l.kind,group:l.group,stops:l.t.st.map(s=>({at:s.at,end:s.end,parts:s.s.parts.map(p=>p.type)}))}))))"),'tank loading must begin after the supported toilet has been removed; separate simultaneous runs are not ordered');
}
{
  const c=ctx([asset('WC01',[{asked:'FWF',qty_supplied:1}])]);
  const start=base.indexOf('function mergeRecords(mine, theirs){'), end=base.indexOf('\nfunction applyImport(',start);
  assert(start>=0 && end>start); vm.runInContext(base.slice(start,end),c);
  run(c,"deliveryEmpty=d=>!d.state && typeof d.emptied!=='boolean'");
  record('merge_emptied_evidence',run(c,"JSON.parse(JSON.stringify(mergeRecords({delivery:{WC01:{emptied:true,emptied_by:'Fixture operator',emptied_at:'2026-10-26T00:00:00Z',emptied_history:[{emptied:true,by:'Fixture operator',at:'2026-10-26T00:00:00Z'}]}}},{}).merged.delivery))"),'WC01 pump-out value, actor, time and history preserved');
}
console.log(JSON.stringify({author:'Andrew Fisher',source:process.argv[2],base:process.argv[3],results},null,2));
