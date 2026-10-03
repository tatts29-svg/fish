// Author: Andrew Fisher. Offline audit fixtures; no browser, network or shared record writes.
// node followup_abbb01b_streams.cjs /path/to/frozen/demob816_src.js /path/to/patched_candidate.html
const fs = require('fs'), vm = require('vm'), assert = require('assert');
assert(process.argv[2] && process.argv[3], 'Usage: node followup_abbb01b_streams.cjs <frozen demob816_src.js> <v8.13 HTML with that exact v8.16 patch applied>');
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
// Ownership inputs are synthetic inventory evidence, not assumptions about live assets.
function owned(assets,sub={},coates={}){
 const c=ctx(assets); c.subOf=k=>Array.from({length:sub[k]||0},(_,i)=>({co:'Fixture supplier',id:'S'+i}));
 c.invCountNums=a=>Array.from({length:coates[a.key]||0},(_,i)=>'C'+i); c.itemNumbersOf=()=>null;
 c.run782=()=>70; c.DATA.brand={org:'Fixture organisation',author:'Andrew Fisher'}; return c;
}
function allLoads(c){return run(c,"demob816().days.flatMap(d=>demob816().day[d].loads.map(l=>({day:d,units:l.units,stream:l.stream,cap:l.cap,uncertain:l.uncertain})))");}
function revisedOwned(n){const c=owned([wc('WC25',25)],{WC25:25});attachDateSetter(c);run(c,"confirm816('2026-10-26','all')");c.assets[0].rows[0].qty_supplied=n;c.RENDER_MEMO.clear();return c;}
{
 const c=owned([wc('WC25',25)],{WC25:25});attachDateSetter(c);const before=schedule(c);
 check('supplier_25_packs_24_and_1',allLoads(c).map(l=>l.units),[24,1]);run(c,"confirm816('2026-10-26','all')");
 check('supplier_25_confirmation_preserves_days',schedule(c),before);
 const b=JSON.stringify(c.S);run(c,"demob816().days.forEach(d=>{trucks816(d,'all');toiletHtml816(demob816().day[d]);});");check('view_preserves_record',JSON.stringify(c.S),b);
}
{
 const c=revisedOwned(24);check('supplier_25_to_24_conserves_units',allLoads(c).reduce((n,l)=>n+l.units,0),24);
}
{
 const c=revisedOwned(0);check('supplier_25_to_zero_has_no_truck_or_pump_task',run(c,"({trucks:demob816().days.flatMap(d=>trucks816(d,'all')).length,pump:demob816().days.flatMap(d=>demob816().day[d].pump).length,visible:rowHtml816(demobOf816('WC25')).includes('quantity 0 - nothing to collect')})"),{trucks:0,pump:0,visible:true});
}
{
 const c=revisedOwned(null);check('supplier_25_to_unknown_keeps_uncertain_portions',allLoads(c).map(l=>({units:l.units,uncertain:l.uncertain})),[{units:24,uncertain:true},{units:1,uncertain:true}]);
}
{
 const c=owned([wc('CO25',25)],{},{CO25:25});check('coates_25_packs_12_12_1',allLoads(c).map(l=>l.units),[12,12,1]);
 check('coates_render_does_not_claim_capacity_24',run(c,"!toiletHtml816(demob816().day['2026-10-26']).includes('<span>of 24')"),true);
 check('coates_email_identifies_its_capacity',run(c,"decodeURIComponent(mail816('2026-10-26','all',demob816().day['2026-10-26'].list,[])).includes('of 12')"),true);
}
{
 const c=owned([wc('MIX',25)],{MIX:24},{MIX:1});attachDateSetter(c);const before=schedule(c);
 check('mixed_owner_streams_stay_separate',allLoads(c).map(l=>({stream:l.stream,units:l.units})),[{stream:'sub',units:24},{stream:'coates',units:1}]);
 check('mixed_reference_is_listed_on_each_load_day',run(c,"demob816().days.every(d=>!demob816().day[d].loads.some(l=>l.rows.some(x=>x.r.key==='MIX'))||demob816().day[d].list.some(r=>r.key==='MIX'))"),true);
 check('mixed_first_day_confirmation_finds_the_reference',run(c,"confirm816('2026-10-26','all')"),1);
 run(c,"confirm816('2026-10-27','all')");check('mixed_confirmation_preserves_stream_days',schedule(c),before);
}
{
 const c=owned([wc('UNKNOWN',1)]);check('unknown_owner_creates_no_guessed_run',allLoads(c).length,0);
 check('unknown_owner_is_explained_on_pickup_row',run(c,"rowHtml816(demobOf816('UNKNOWN')).includes('owner to confirm')"),true);
}
{
 const c=owned([wc('SUB',1)],{SUB:1});check('supplier_pickup_has_no_model_travel_times',run(c,"(()=>{const l=trucks816('2026-10-26','all')[0];return [l.t.dep,l.t.arrive,l.t.leave,l.t.back];})()"),[null,null,null,null]);
 check('supplier_null_travel_times_do_not_render_midnight',run(c,"!trucksHtml816(demob816().day['2026-10-26'],trucks816('2026-10-26','all')).includes('00:00')"),true);
 check('supplier_print_this_load_selects_supplier_run',run(c,"printDay816('2026-10-26','all','load',1)"),1);
}
{
 const c=owned([asset('PAIR',[{asked:'FWF',qty_supplied:1},{asked:'Waste tank',qty_supplied:1}],{out:'2026-10-26'})],{PAIR:1});
 check('supplier_tank_dependency_is_detected',run(c,"trucks816('2026-10-26','all').some(l=>l.stops.some(s=>s.tankOnly&&s.afterSupplier))"),true);
 check('supplier_tank_dependency_is_visible_in_truck_output',run(c,"(()=>{const m=demob816();return /after (the )?(supplier|sub.hire)|wait.*supplier/i.test(trucksHtml816(m.day['2026-10-26'],trucks816('2026-10-26','all')));})()"),true);
}
const crypto=require('crypto'), digest=x=>crypto.createHash('sha256').update(x).digest('hex');
console.log(JSON.stringify({author:'Andrew Fisher',sourceCommit:'abbb01baf3318d39d970313063c29cdb30990d33',scope:'Read-only synthetic CPU stream integration checks. New owner inputs supplied explicitly. No browser or shared-record writes; not release readiness.',demobSha256:digest(source),candidateSha256:digest(base),passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results},null,2));process.exitCode=results.some(x=>!x.pass)?1:0;
