// Author: Andrew Fisher. Offline audit fixtures; no browser, network or shared record writes.
// node followup_24cb316_cpu.cjs /path/to/frozen/demob816_src.js /path/to/patched_candidate.html
const fs = require('fs'), vm = require('vm'), assert = require('assert');
assert(process.argv[2] && process.argv[3], 'Usage: node followup_24cb316_cpu.cjs <frozen demob816_src.js> <v8.13 HTML with that exact v8.16 patch applied>');
const source = fs.readFileSync(process.argv[2], 'utf8');
const base = fs.readFileSync(process.argv[3], 'utf8');
const results = [];
class FixtureDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-26T08:00:00Z'])); } static now() {return Date.parse('2026-10-26T08:00:00Z');} }
function ctx(assets = []) {
  const c = vm.createContext({console, Date:FixtureDate, Map, Set, Math, JSON, Number, String, isFinite, assets,
    S: {delivery:{}}, CROW: new Map(), RENDER_MEMO: new Map(), DATA: {depot:{planning:{precinct_min:10}}},
    localStorage:{getItem:()=>null}, todayIso:()=> '2026-10-26', allAssets:()=>assets,
    assetOf:k=>assets.find(a=>a.key===k), itemRows:a=>a.rows, refKind:a=>a.kind||'toilet',
    rowOff:()=>false, subhireOf:()=>null, onhireForAsset:()=>[], branchOf:k=>assets.find(a=>a.key===k).branch||'KINP',
    effectiveDates:a=>({in:a.in||null,out_plan:a.out||null}), flash:()=>{}, mayWrite:()=>true, whoAmI:()=> 'Fixture operator',
    isRef:k=>assets.some(a=>a.key===k), bump:()=>{}, buzz:()=>{}, blank:()=>({}), tombed:()=>false,
    fmtStamp:x=>x, fmtDate:x=>x, fmtDay:x=>({dow:'day',dm:x}), esc:x=>String(x==null?'':x), canEdit:()=>true, refPlate:x=>x, dashLeds:()=>'', kindWord:()=> 'toilet', EVENT_DAYS:['2026-10-23','2026-10-24','2026-10-25']});
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
function check(name, observed, expected) {
  observed=JSON.parse(JSON.stringify(observed)); expected=JSON.parse(JSON.stringify(expected));
  let pass=true; try {assert.deepStrictEqual(observed,expected);} catch(e) {pass=false;}
  results.push({name,pass,observed,expected});
}
function wc(key='WC01',n=1,extra={}) {return asset(key,[{asked:'FWF',qty_supplied:n}],extra);}
function loadMerge(c) {original(c,'mergeRecords','\nfunction applyImport('); c.deliveryEmpty=d=>!d.state&&!d.out_date&&typeof d.emptied!=='boolean';}
{
 const c=ctx([wc()]); c.todayIso=()=> '2026-10-18';
 check('on_site_before_event_requires_pumpout',run(c,"emptyGate816('WC01','in transit')"),false);
 c.S.delivery.WC01={state:'on site',emptied:true};
 check('clearance_needs_actor_and_time',run(c,"emptyGate816('WC01','in transit',true)"),false);
 c.S.delivery.WC01={state:'in transit',history:[{state:'on site',at:'2026-10-15T00:00:00Z'}]};
 check('prior_on_site_amber_requires_pumpout',run(c,"emptyGate816('WC01','not on site')"),false);
 c.S.delivery.WC01={state:'not on site'};
 c.todayIso=()=> '2026-10-26';
 check('historyless_demob_day_requires_pumpout',run(c,"emptyGate816('WC01','in transit')"),false);
 c.todayIso=()=> '2026-10-18';
 check('no_delivery_date_before_event_does_not_prove_incoming_trip',run(c,"emptyGate816('WC01','in transit')"),false);
 check('forced_collection_before_event_requires_pumpout',run(c,"emptyGate816('WC01','in transit',true)"),false);
 c.S.delivery.WC01={state:'on site',emptied:true,emptied_by:'A',emptied_at:'2026-10-20T00:00:00Z'};
 c.CROW.set('WC01',{delivery:{emptied:false,emptied_by:'B',emptied_at:'2026-10-21T00:00:00Z'}});
 check('newer_committed_untick_wins',run(c,"emptiedOf816('WC01').on"),false);
 c.S.delivery.WC01.emptied_at='2026-10-21T00:00:00Z';
 check('equal_timestamp_conflicting_clearance_denies',run(c,"emptiedOf816('WC01').on"),false);
 c.CROW.clear(); c.S.delivery.WC01.history=[{state:'on site',at:'2026-10-22T00:00:00Z'}];
 check('older_clearance_than_arrival_is_stale',run(c,"({on:emptiedOf816('WC01').on,stale:emptiedOf816('WC01').stale})"),{on:false,stale:true});
 c.LIGHT={'on site':{label:'On site'}}; original(c,'setLight','\n/* Typed fields save');
 run(c,"setLight('WC01','on site')");
 check('return_on_site_records_revocation',run(c,"({cleared:S.delivery.WC01.emptied,allowed:emptyGate816('WC01','in transit',true),reason:S.delivery.WC01.emptied_history.at(-1).because})"),{cleared:false,allowed:false,reason:'set on site again - a new use'});
}
{
 const c=ctx([]); loadMerge(c);
 c.A={delivery:{WC01:{emptied:true,emptied_by:'A',emptied_at:'2026-10-26T00:00:00Z',emptied_history:[{emptied:true,by:'A',at:'2026-10-26T00:00:00Z'}]}}};
 check('merge_keeps_value_actor_time_history',run(c,"mergeRecords(A,{}).merged.delivery"),c.A.delivery);
 c.B={delivery:{WC01:{emptied:false,emptied_by:'B',emptied_at:'2026-10-26T01:00:00Z'}}};
 check('merge_newer_false_wins',run(c,"mergeRecords(A,B).merged.delivery.WC01.emptied"),false);
 c.B.delivery.WC01.emptied_at=c.A.delivery.WC01.emptied_at;
 check('merge_equal_conflict_false_both_orders_and_clash',run(c,"({ab:mergeRecords(A,B).merged.delivery.WC01.emptied,ba:mergeRecords(B,A).merged.delivery.WC01.emptied,clash:mergeRecords(A,B).report.clashes.length})"),{ab:false,ba:false,clash:1});
 check('merge_idempotent_delivery',run(c,"mergeRecords(A,A).merged.delivery"),c.A.delivery);
}
{
 const c=ctx([wc('WC25',25)]); attachDateSetter(c); loadMerge(c);
 const before=schedule(c); run(c,"confirm816('2026-10-26','all')");
 check('25_unit_confirmation_preserves_both_days',schedule(c),before);
 const saved=JSON.parse(JSON.stringify(c.S)); c.S=JSON.parse(JSON.stringify(saved)); c.RENDER_MEMO.clear();
 check('25_unit_json_reload_preserves_both_days',schedule(c),before);
 c.A=saved; c.S=run(c,"mergeRecords(A,{}).merged"); c.RENDER_MEMO.clear();
 check('25_unit_merge_roundtrip_preserves_both_days',schedule(c),before);
 check('each_portable_load_at_most_24',schedule(c).every(l=>l.units<=24),true);
 c.assets[0].rows[0].qty_supplied=26; c.RENDER_MEMO.clear();
 check('saved_portions_reconcile_after_quantity_increase',schedule(c).reduce((s,l)=>s+l.units,0),26);
}
{
 const fixed=['2026-10-27','2026-10-28','2026-10-29','2026-10-30'].map((out,i)=>asset('GN'+i,[{asked:'Generator',qty_supplied:1}],{kind:'generator',out}));
 const c=ctx([wc('WC25',25),...fixed]); attachDateSetter(c);
 const before=schedule(c); run(c,"confirm816('2026-10-26','all')");
 check('two_portions_on_same_day_survive_confirmation',schedule(c),before);
}
{
 const c=ctx([wc('WC49',49)]);
 check('pump_task_present_for_all_49_unit_portions',run(c,"demob816().days.filter(d=>demob816().day[d].loads.length).every(d=>demob816().day[d].pump.some(x=>x.r.key==='WC49'))"),true);
}
{
 const c=ctx([wc('WCUNK',null)]); attachDateSetter(c);
 run(c,"confirm816('2026-10-26','all')");
 check('confirmed_unknown_remains_uncertain_truck',run(c,"({unknown:demobOf816('WCUNK').evtUnk,load:demob816().day['2026-10-26'].loads[0].uncertain,trucks:trucks816('2026-10-26','all').length})"),{unknown:true,load:true,trucks:1});
 check('unknown_email_carries_uncertainty',run(c,"decodeURIComponent(mail816('2026-10-26','all',demob816().day['2026-10-26'].list,[])).includes('quantity to confirm')"),true);
 check('unknown_load_never_claims_full',run(c,"!toiletHtml816(demob816().day['2026-10-26']).includes('>full</span>')"),true);
}
for (const n of [1,null]) {
 const c=ctx([asset('WCMIX',[{asked:'FWF',qty_supplied:n},{asked:'Waste tank',qty_supplied:1}],{out:'2026-10-26'})]);
 const timing=run(c,"(()=>{const s=trucks816('2026-10-26','all').flatMap(l=>l.t.st);return {toilet:s.some(x=>!x.s.tankOnly),ordered:s.find(x=>x.s.tankOnly).at>=Math.max(...s.filter(x=>!x.s.tankOnly).map(x=>x.end))};})()");
 check(n===null?'unknown_toilet_precedes_tank':'known_toilet_precedes_tank',timing,{toilet:true,ordered:true});
}
function revised(n) {
 const c=ctx([wc('WC25',25)]); attachDateSetter(c); c.DATA.brand={org:'Fixture organisation',author:'Andrew Fisher'};
 run(c,"confirm816('2026-10-26','all')"); c.assets[0].rows[0].qty_supplied=n; c.RENDER_MEMO.clear(); return c;
}
function notes(c,pattern) {
 c.pattern=pattern;
 return run(c,`(()=>{const m=demob816(),r=m.byKey.get('WC25'),ds=m.days.filter(d=>m.day[d].loads.length),T=ds.flatMap(d=>trucks816(d,'all').map(L=>({d,L})));return {
 row:rowHtml816(r).includes(pattern),
 toilet:ds.map(d=>toiletHtml816(m.day[d])).join('').includes(pattern),
 email:ds.map(d=>decodeURIComponent(mail816(d,'all',m.day[d].list,[]))).join('').toLowerCase().includes(pattern),
 print:T.map(({d,L})=>sheet816(d,L)).join('').includes(pattern)};})()`);
}
{
 const c=revised(26), before=JSON.stringify(c.S);
 check('increased_quantity_notice_in_row_load_email_print',notes(c,'quantity changed from 25 to 26'),{row:true,toilet:true,email:true,print:true});
 check('extra_unit_is_explicitly_unplanned',run(c,"demob816().days.flatMap(d=>demob816().day[d].loads).flatMap(l=>l.rows).filter(x=>x.unplanned).reduce((n,x)=>n+x.n,0)"),1);
 check('reconciliation_rendering_does_not_rewrite_confirmed_record',JSON.stringify(c.S),before);
}
{
 const c=revised(24);
 check('decreased_quantity_is_conserved',schedule(c).reduce((n,l)=>n+l.units,0),24);
 check('decreased_quantity_notice_in_row_load_email_print',notes(c,'quantity changed from 25 to 24'),{row:true,toilet:true,email:true,print:true});
}
{
 const c=revised(null);
 check('quantity_becomes_unknown_keeps_uncertain_portions',run(c,"({unknown:demobOf816('WC25').evtUnk,notice:!!demobOf816('WC25').qtyChange,loads:demob816().days.flatMap(d=>demob816().day[d].loads).length,allUncertain:demob816().days.flatMap(d=>demob816().day[d].loads).every(l=>l.uncertain)})"),{unknown:true,notice:true,loads:2,allUncertain:true});
}
{
 const c=revised(0);
 check('zero_quantity_does_not_create_fallback_one_unit_truck',run(c,"demob816().days.flatMap(d=>trucks816(d,'all')).flatMap(l=>l.stops).flatMap(s=>s.parts).reduce((n,p)=>n+p.n,0)"),0);
}

// Explicit outgoing/incoming-purpose distinction, agreed independently of quantity handling.
for (const kind of ['toilet','tank']) {
 const a=asset('MOVE',[{asked:kind==='tank'?'Waste tank':'FWF',qty_supplied:1}],{kind,in:'2026-10-20'});
 const c=ctx([a]); c.todayIso=()=> '2026-10-18'; c.S.delivery.MOVE={state:'not on site'};
 check(kind+'_dated_incoming_delivery_is_allowed',run(c,"({purpose:movePurpose816('MOVE'),allowed:emptyGate816('MOVE','in transit')})"),{purpose:'incoming delivery',allowed:true});
 check(kind+'_collection_forces_pumpout_even_when_incoming',run(c,"emptyGate816('MOVE','not on site',true)"),false);
 c.S.delivery.MOVE.done=true;
 check(kind+'_completed_arrival_prevents_incoming_exception',run(c,"emptyGate816('MOVE','in transit')"),false);
 c.S.delivery.MOVE={state:'not on site'}; c.todayIso=()=> '2026-10-23';
 check(kind+'_first_event_day_prevents_incoming_exception',run(c,"emptyGate816('MOVE','in transit')"),false);
 c.todayIso=()=> '2026-10-18'; c.assets[0].out='2026-10-18'; c.RENDER_MEMO.clear();
 check(kind+'_earlier_out_day_prevents_incoming_exception',run(c,"emptyGate816('MOVE','in transit')"),false);
 c.S.delivery.MOVE={state:'on site',emptied:true,emptied_by:'Fixture operator',emptied_at:'2026-10-26T00:00:00Z'};
 check(kind+'_outgoing_with_current_actor_and_time_is_allowed',run(c,"emptyGate816('MOVE','in transit',true)"),true);
}
for (const n of [24,0,null]) {
 const c=revised(n), before=JSON.stringify(c.S), label=n===null?'unknown':String(n);
 check('25_to_'+label+'_all_loads_at_most_24',schedule(c).every(l=>l.units<=24),true);
 run(c,"(()=>{const m=demob816();m.days.forEach(d=>{trucks816(d,'all');rowHtml816(m.byKey.get('WC25'));toiletHtml816(m.day[d]);mail816(d,'all',m.day[d].list,[]);});})()");
 check('25_to_'+label+'_view_and_export_preserve_confirmed_record',JSON.stringify(c.S),before);
}
{
 const c=revised(0);
 check('zero_stays_visible_without_pump_or_truck_task',run(c,"(()=>{const m=demob816(),r=m.byKey.get('WC25');return {present:!!r,row:rowHtml816(r).includes('quantity 0 - nothing to collect'),noReady:!notReady816(r),pumps:m.days.flatMap(d=>m.day[d].pump).length,trucks:m.days.flatMap(d=>trucks816(d,'all')).length};})()"),{present:true,row:true,noReady:true,pumps:0,trucks:0});
 check('zero_email_explains_nothing_to_collect',run(c,"(()=>{const m=demob816(),r=m.byKey.get('WC25');return decodeURIComponent(mail816(r.iso,'all',m.day[r.iso].list,[])).includes('quantity 0, nothing to collect');})()"),true);
}

const crypto=require('crypto'), digest=x=>crypto.createHash('sha256').update(x).digest('hex');
console.log(JSON.stringify({author:'Andrew Fisher',sourceCommit:'24cb316b9a4440356cd438e0fb83738183d02569',demobSha256:digest(source),candidateSha256:digest(base),passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,interpretationNote:'Outgoing-only gate interpretation agreed. Explicit incoming-delivery cases below verify the documented exception separately; no broader incoming restriction is asserted.',results},null,2));
process.exitCode=results.some(x=>!x.pass)?1:0;
