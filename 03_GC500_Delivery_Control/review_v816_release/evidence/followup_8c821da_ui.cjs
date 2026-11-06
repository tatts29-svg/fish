// Author: Andrew Fisher. Offline audit fixtures; no browser, network or shared record writes.
// node followup_8c821da_ui.cjs /path/to/frozen/demob816_src.js /path/to/patched_candidate.html
const fs = require('fs'), vm = require('vm'), assert = require('assert');
assert(process.argv[2] && process.argv[3], 'Usage: node followup_8c821da_ui.cjs <frozen demob816_src.js> <v8.13 HTML with that exact v8.16 patch applied>');
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
function browserStubs(c){
 const store=new Map(); c.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const el=()=>({innerHTML:'',dataset:{},classList:{add:()=>{},remove:()=>{}},remove:()=>{}}), wrap=el();
 c.document={getElementById:k=>k==='dayprint'?wrap:null,createElement:()=>el(),querySelectorAll:()=>[],body:{appendChild:()=>{},classList:{add:()=>{},remove:()=>{}}},head:{appendChild:()=>{}}};
 c.window={addEventListener:()=>{},print:()=>{}};c.setTimeout=()=>0;c.applyCapability=()=>{};c.renderDemob816=()=>{};
 return {store,wrap};
}
function wire(c,elements){const pane={querySelectorAll:s=>elements[s]||[],querySelector:()=>null};c.pane=pane;run(c,'wireDemob816(pane)');}
{
 const c=owned([wc('CO25',25)],{},{CO25:25});
 check('coates_load_card_shows_actual_capacity_12',run(c,"toiletHtml816(demob816().day['2026-10-26']).includes('of 12 · this truck')"),true);
 check('coates_email_identifies_capacity_12',run(c,"decodeURIComponent(mail816('2026-10-26','all',demob816().day['2026-10-26'].list,[])).includes('of 12')"),true);
 check('coates_load_card_identifies_stream',run(c,"toiletHtml816(demob816().day['2026-10-26']).includes('Coates toilet run')"),true);
}
{
 const c=owned([wc('UNKNOWN',1)]);
 check('unknown_owner_explained_on_pickup_row',run(c,"rowHtml816(demobOf816('UNKNOWN')).includes('owner to confirm')"),true);
 check('unknown_owner_explained_in_toilet_view',run(c,"toiletHtml816(demob816().day['2026-10-26']).includes('Owner to confirm - on neither run')"),true);
 check('unknown_owner_explained_in_email',run(c,"decodeURIComponent(mail816('2026-10-26','all',demob816().day['2026-10-26'].list,[])).includes('Owner to confirm - on neither run')"),true);
}
{
 const c=owned([wc('SUB',1)],{SUB:1});const {wrap}=browserStubs(c);
 check('supplier_no_midnight_times_in_truck_view',run(c,"!trucksHtml816(demob816().day['2026-10-26'],trucks816('2026-10-26','all')).includes('00:00')"),true);
 const html=run(c,"toiletHtml816(demob816().day['2026-10-26'])"), id=html.match(/data-load816="([^"]+)"/)[1];
 const button={dataset:{print816:'load',load816:id}};wire(c,{'[data-print816]':[button]});run(c,"DM816.sel='2026-10-26';DM816.branch='all'");
 const before=JSON.stringify(c.S);button.onclick();
 check('supplier_actual_wired_print_selects_one_list',wrap.dataset.dp816,'1');
 check('supplier_print_has_no_midnight_or_kingston_departure',!wrap.innerHTML.includes('00:00')&&!wrap.innerHTML.includes('Leave Kingston'),true);
 check('supplier_print_includes_asset_and_empty_requirement',wrap.innerHTML.includes('SUB')&&wrap.innerHTML.includes('NOT READY: empty first'),true);
 check('printing_does_not_change_shared_record',JSON.stringify(c.S),before);
}
{
 const c=owned([wc('SUB',1,{out:'2026-10-26'}),wc('CO',1,{out:'2026-10-26'})],{SUB:1},{CO:1});const {wrap}=browserStubs(c);
 const html=run(c,"toiletHtml816(demob816().day['2026-10-26'])"),ids=[...html.matchAll(/data-load816="([^"]+)"/g)].map(x=>x[1]);
 check('same_day_stream_buttons_have_distinct_ids',ids,['sub1','coates1']);
 for(const [id,key,other] of [['sub1','SUB','CO'],['coates1','CO','SUB']]){
  const button={dataset:{print816:'load',load816:id}};wire(c,{'[data-print816]':[button]});run(c,"DM816.sel='2026-10-26';DM816.branch='all'");button.onclick();
  check('wired_'+id+'_prints_only_its_selected_stream',wrap.dataset.dp816==='1'&&wrap.innerHTML.includes('class="pl">'+key+'</td>')&&!wrap.innerHTML.includes('class="pl">'+other+'</td>'),true);
 }
}
{
 const c=owned([asset('PAIR',[{asked:'FWF',qty_supplied:1},{asked:'Waste tank',qty_supplied:1}],{out:'2026-10-26'})],{PAIR:1});browserStubs(c);
 check('supplier_tank_dependency_visible_in_truck_view',run(c,"trucksHtml816(demob816().day['2026-10-26'],trucks816('2026-10-26','all')).includes('after the supplier has lifted the toilet off it')"),true);
 check('supplier_tank_dependency_visible_in_sheet',run(c,"trucks816('2026-10-26','all').filter(l=>l.kind!=='supplier').map(l=>sheet816('2026-10-26',l)).join('').includes('after the supplier has lifted the toilet off it')"),true);
}
{
 const c=owned([wc('CO12',12)],{},{CO12:12});const {store}=browserStubs(c);const before=JSON.stringify(c.S);
 const capacity={dataset:{cap816:'2026-10-26.coates1'},value:'8'};wire(c,{'input[data-cap816]':[capacity]});capacity.onchange();
 check('capacity_handler_writes_selected_device_key',store.get('gc500.demob816.cap.2026-10-26.coates1'),'8');
 check('capacity_change_does_not_change_shared_record',JSON.stringify(c.S),before);
 check('reduced_truck_capacity_never_exceeds_accepted_capacity',run(c,"demob816().day['2026-10-26'].loads.every(l=>l.units<=l.cap)"),true);
 check('reduced_truck_capacity_is_not_labelled_full_without_overload_warning',run(c,"(()=>{const m=demob816(),L=m.day['2026-10-26'].loads[0];return !(L.units>L.cap&&!L.capWarn&&loadCard816(m.day['2026-10-26'],L,null).includes('>full</span>'));})()"),true);
}
const crypto=require('crypto'),digest=x=>crypto.createHash('sha256').update(x).digest('hex');
console.log(JSON.stringify({author:'Andrew Fisher',sourceCommit:'8c821da439027bd09b01d4dbc2e84b53c966c397',scope:'Affected UI template/handler CPU probes only, using minimal DOM stubs. No browser. Unchanged planner/date checks were not rerun.',demobSha256:digest(source),candidateSha256:digest(base),passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results},null,2));process.exitCode=results.some(x=>!x.pass)?1:0;
