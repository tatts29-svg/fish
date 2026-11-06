// Author: Andrew Fisher. Synthetic, read-only CPU review. No operational snapshots, contacts or network.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const pagePath=process.env.BASE||path.join(root,'build/GC500_v8.21/base_live.html');const evidence=process.env.EVIDENCE||'/tmp/gc500-v821-coverage';fs.mkdirSync(evidence,{recursive:true});
const html=fs.readFileSync(pagePath,'utf8');
const booking=fs.readFileSync(root+'/v8.01_wednesday_bookings_LIVE/bookings801_src.js','utf8');
function fun(name){ const a=html.indexOf('function '+name+'('); if(a<0)throw Error(name);let b=html.indexOf('\nfunction ',a+1);return html.slice(a,b<0?undefined:b); }
let assets=[],cancelled=new Set(),moves={};
const ctx={console,Date,Set,Map,Array,Object,String,Number,JSON,
  allAssets:()=>assets,rowOff:k=>cancelled.has(k),unreferencedRows:()=>[],weekOf:()=>null,
  deliveryOf:()=>({}),effectiveDates:a=>moves[a.key]||{},DATA:{},etaSort:()=>0,
  dpUniq:xs=>[...new Set(xs.filter(x=>x!=null&&String(x).trim()).map(x=>String(x).trim()))],
  fmtDate:s=>s,assetOf:k=>assets.find(a=>a.key===k),esc:s=>String(s)
};
vm.createContext(ctx);
// dpT extraction reaches the intervening dpUniq const; use its exact function alone.
vm.runInContext(fun('dpT').split('\nconst dpUniq')[0],ctx);
for(const n of ['programmeDaysBefore801','dpLoadsBefore801','dpItems','dpItemsWords']) vm.runInContext(fun(n),ctx);
vm.runInContext(booking,ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'fixture_delivery_groups.cjs'),'utf8'),ctx);
const iso='2026-10-08',previous='2026-10-07';
function event(date=iso,item='Building',qty=1){return{date,item,quantity_display:String(qty),quantity_raw:qty,movement:'place',note:'Fixture note'};}
function row(key,events){return{key,item_types:['Building'],asset_numbers:[],accessories:[],charge_lines:[],events};}
function booked(key,{date=iso,rank=1,truck='truck-'+key,time='0800',quantity=1,loads}={}){
  const e=event(date,'Building',quantity);e.booking801={date,item:'Building',quantity,departure_order:rank,location:'Fixture zone',loads:loads||[{truck_id:truck,dd:'DD-'+key,load_time:time,carrier:'Fixture carrier',quantity,asset_numbers:[key+'-asset']}]};
  return row(key,[e]);
}
function reset(xs){assets=xs;cancelled=new Set();moves={};}
function day(){return ctx.programmeDays().find(d=>d.iso===iso);}
function groups(){return ctx.dailyDeliveryGroups821(day());}
function serial(v){return JSON.parse(JSON.stringify(v));}
const results=[];function test(name,f){try{f();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
let reproduced=null;
test('Existing native omission reproduced: rescheduled booking mixed with a current booking',()=>{
 reset([booked('MOVED',{date:previous}),booked('CURRENT')]);moves.MOVED={in_moved:true,in:iso};
 const d=day(),native=ctx.dpLoads(d),fixed=ctx.dailyDeliveryGroups821(d);
 assert.deepStrictEqual(serial(native.flatMap(g=>g.rows.map(r=>r.a.key))),['CURRENT']);
 assert.deepStrictEqual(serial(fixed.flatMap(g=>g.rows.map(r=>r.a.key))),['CURRENT','MOVED']);
 reproduced={native:native.flatMap(g=>g.rows.map(r=>r.a.key)),proposal:fixed.flatMap(g=>g.rows.map(r=>r.a.key))};
});
test('DD departure rank remains ahead of clock order',()=>{reset([booked('EARLY_CLOCK',{rank:2,time:'0500'}),booked('FIRST_DD',{rank:1,time:'0900'})]);assert.deepStrictEqual(serial(groups().map(g=>g.departure_order)),[1,2]);assert.deepStrictEqual(serial(groups().map(g=>g.time)),['09:00','05:00']);});
test('Shared truck retains separate references and docket identities',()=>{reset([booked('SHARED_A',{rank:4,truck:'shared'}),booked('SHARED_B',{rank:4,truck:'shared'})]);const gs=groups();assert.equal(gs.length,1);assert.equal(gs[0].rows.length,2);assert.equal(new Set(gs[0].dds).size,2);});
test('Distinct split loads preserve one reference twice with exact cargo slices',()=>{const a=booked('SPLIT',{quantity:2,loads:[{truck_id:'split1',dd:'D1',load_time:'0900',carrier:'C',quantity:1,asset_numbers:['AS1']},{truck_id:'split2',dd:'D2',load_time:'0900',carrier:'C',quantity:1,asset_numbers:['AS2']}]});a.asset_numbers=['AS1','AS2','OTHER'];a.accessories=[{type:'Fridge'}];reset([a]);const gs=groups();assert.equal(gs.length,2);assert.deepStrictEqual(serial(gs.map(g=>g.rows[0].a._bookingNumbers801)),[['AS1'],['AS2']]);assert.deepStrictEqual(serial(gs.map(g=>g.rows[0].events[0].quantity_raw)),[1,1]);assert(gs.every(g=>g.rows[0].a.accessories.length===0&&g.rows[0].a._bookingUnassignedAccessories801));});
test('Cancellation and removal rows never appear in delivery export',()=>{const a=row('ONLY_REMOVE',[{...event(),movement:'remove'}]);reset([a,booked('CANCELLED'),booked('ACTIVE')]);cancelled.add('CANCELLED');const gs=groups();assert.deepStrictEqual(serial(gs.flatMap(g=>g.rows.map(r=>r.a.key))),['ACTIVE']);assert(gs.every(g=>g.kind==='deliveries'));});
test('Exact resolved day includes moved events despite original event date',()=>{reset([booked('MOVED',{date:previous}),booked('NEXT_DAY',{date:'2026-10-09'})]);moves.MOVED={in_moved:true,in:iso};const gs=groups();assert.equal(gs.length,1);assert.equal(gs[0].rows[0].a.key,'MOVED');assert.equal(gs[0].rows[0].events[0].date,previous);assert.equal(gs[0].rows[0].events[0].load_time,null);assert.equal(gs[0].carrier,'');assert.equal(gs[0].time,null);assert.match(gs[0].rows[0].events[0].note,/booking for this rescheduled day has not been supplied/);});
test('Ordinary same-time carrier grouping matches native behavior',()=>{reset([row('PLAIN_A',[{...event(),load_time:'0630',carrier:'X'}]),row('PLAIN_B',[{...event(),load_time:'0630',carrier:'X'}])]);assert.deepStrictEqual(serial(groups()),serial(ctx.dpLoads(day())));assert.equal(groups().length,1);});
test('Active unassigned booking remains visible with unknown time',()=>{reset([booked('UNASSIGNED',{loads:[]})]);const gs=groups();assert.equal(gs.length,1);assert.equal(gs[0].basis,'booking-unassigned');assert.equal(gs[0].time,null);assert.equal(gs[0].carrier,'');});
test('Mixed original/current events under one reference are not reference-deduplicated',()=>{const a=booked('MULTI',{date:previous}),b=booked('MULTI',{date:iso,truck:'new-truck'});a.events.push(...b.events);reset([a]);moves.MULTI={in_moved:true,in:iso};const gs=groups();assert.equal(gs.length,2);assert.equal(gs[0].rows[0].a.key,gs[1].rows[0].a.key);assert.equal(gs[1].rows[0].events.length,1);assert.equal(gs[1].rows[0].events[0].date,previous);});
test('Foreign-day transport-plan metadata cannot apply to selected day',()=>{reset([row('PLAIN',[event()])]);const d=day();d.loads=[{date:previous,n:'old',refs:['PLAIN'],time:'0500'}];const gs=ctx.dailyDeliveryGroups821(d);assert.equal(gs[0].basis,'ref');assert.equal(gs[0].time,null);});
test('Selected-day ordinary transport-plan grouping remains',()=>{reset([row('PLAN_A',[event()]),row('PLAN_B',[event()])]);const d=day();d.loads=[{date:iso,n:5,refs:['PLAN_A','PLAN_B'],time:'0600'}];const gs=ctx.dailyDeliveryGroups821(d);assert.equal(gs.length,1);assert.equal(gs[0].basis,'plan');assert.equal(gs[0].rows.length,2);assert.equal(gs[0].time,'06:00');});
test('Resolved input day, source assets and booking objects stay unchanged',()=>{reset([booked('MOVED',{date:previous}),booked('CURRENT')]);moves.MOVED={in_moved:true,in:iso};const d=day(),before=JSON.stringify({d,assets});ctx.dailyDeliveryGroups821(d);assert.equal(JSON.stringify({d,assets}),before);});
test('Defensive cancel/remove exclusion holds for directly supplied resolved rows',()=>{reset([booked('OFF'),booked('OK')]);const d=day();cancelled.add('OFF');d.deliveries[1].events.push({...event(),movement:'remove',note:'not to export'});const gs=ctx.dailyDeliveryGroups821(d);assert.equal(gs.length,1);assert.equal(gs[0].rows[0].a.key,'OK');assert(gs.every(g=>g.rows.every(r=>r.events.every(e=>e.movement!=='remove'))));});
test('Separate supplier plan cannot override native selected-day dates or add extra loads',()=>{
 reset([row('NATIVE_THU',[event(iso,'FWF',4)]),row('NATIVE_FRI',[event('2026-10-09','FWF',7)])]);
 ctx.DATA.event_portables_plan={loads:[{date:'2026-10-09',refs:['NATIVE_THU'],quantity:24},{date:iso,refs:['UNRELATED_SUPPLIER'],quantity:24}]};
 ctx.EP819=ctx.DATA.event_portables_plan;
 const d=day();d.supplierLoads=ctx.DATA.event_portables_plan.loads;
 const gs=ctx.dailyDeliveryGroups821(d);
 assert.deepStrictEqual(serial(gs.flatMap(g=>g.rows.map(r=>r.a.key))),['NATIVE_THU']);
 assert.equal(gs[0].rows[0].events[0].quantity_raw,4);
 assert.equal(gs[0].rows[0].events[0].date,iso);
 assert.deepStrictEqual(serial(ctx.programmeDays().find(d=>d.iso==='2026-10-09').deliveries.map(r=>r.a.key)),['NATIVE_FRI']);
 assert.equal(assets[0].events[0].date,iso);
 delete ctx.DATA.event_portables_plan;delete ctx.EP819;
});
const nativeBefore=ctx.dpLoads.toString();
const needle821='filter(e=>!e.booking801)';
assert.equal(nativeBefore.split(needle821).length-1,1,'one native patch anchor');
const nativeAfter=nativeBefore.replace(needle821,'filter(e=>!e.booking801 || e.bookingMoved801)');
vm.runInContext(nativeAfter,ctx);
test('Narrow native dpLoads patch retains moved plus current booking',()=>{reset([booked('MOVED',{date:previous}),booked('CURRENT')]);moves.MOVED={in_moved:true,in:iso};assert.deepStrictEqual(serial(ctx.dpLoads(day()).flatMap(g=>g.rows.map(r=>r.a.key))),['CURRENT','MOVED']);});
test('Narrow native patch preserves shared/split grouping and source immutability',()=>{
 reset([booked('SHARED_A',{rank:4,truck:'shared'}),booked('SHARED_B',{rank:4,truck:'shared'}),booked('SPLIT',{rank:5,quantity:2,loads:[{truck_id:'split1',dd:'D1',load_time:'0900',carrier:'C',quantity:1,asset_numbers:['AS1']},{truck_id:'split2',dd:'D2',load_time:'0900',carrier:'C',quantity:1,asset_numbers:['AS2']}]})]);
 const d=day(),before=JSON.stringify({d,assets}),native=ctx.dpLoads(d),expected=ctx.dailyDeliveryGroups821(d);
 assert.deepStrictEqual(serial(native),serial(expected));assert.equal(native.length,3);assert.equal(native[0].rows.length,2);assert.equal(JSON.stringify({d,assets}),before);
});
test('Narrow native patch still retains removals for existing driver sheets',()=>{reset([booked('DELIVERY'),row('REMOVE',[{...event(),movement:'remove'}])]);const gs=ctx.dpLoads(day());assert(gs.some(g=>g.kind==='removals'&&g.rows.some(r=>r.a.key==='REMOVE')));assert.equal(ctx.dailyDeliveryGroups821(day()).length,1);});
test('Narrow native patch does not alter valid-only output order',()=>{reset([booked('LATE_RANK',{rank:9,time:'0500'}),booked('EARLY_RANK',{rank:1,time:'0900'}),row('ORDINARY',[{...event(),load_time:'0430',carrier:'O'}])]);const d=day(),fixed=ctx.dpLoads(d);vm.runInContext(nativeBefore,ctx);const original=ctx.dpLoads(d);assert.deepStrictEqual(serial(fixed),serial(original));vm.runInContext(nativeAfter,ctx);});
fs.writeFileSync(path.join(evidence,'dpLoads_narrow_patch.txt'),nativeAfter+'\n');
const sourceFile=path.join(__dirname,'daily821_src.js');
const projectionSource=fs.readFileSync(sourceFile,'utf8');
const rendererFile=path.join(__dirname,'daily821_renderer.js');
const {renderDay}=require(rendererFile);
function localFun(name){const a=projectionSource.indexOf('function '+name+'(');const b=projectionSource.indexOf('\nfunction ',a+1);assert(a>=0,name);return projectionSource.slice(a,b<0?undefined:b);}
for(const name of ['dpAcc','dpNumsBefore801','sheet808Qty','sheet808Record','sheet808What','dpDeliveryNotes798','dpBasisShortBefore801'])vm.runInContext(fun(name),ctx);
let fixtureNotes={},fixtureItems={};
Object.assign(ctx,{
 daily821Plain:s=>String(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),
 ldState:a=>({word:'Not on site',c:'red'}),ldWhat:r=>ctx.dpItemsWords(r),ldPlace:a=>'Zone '+a.key,
 dest782:a=>({ll:{lat:-28.001,lon:a.key==='B' ? 153.431 : 153.43},sms:'Master plan'}),
 order782:()=>null,entry782:()=>({words:'Use fixture entry'}),text747WayIn:()=>'',dirs782:()=>({ok:true}),
 navUrl:ll=>'https://www.google.com/maps/dir/?api=1&destination='+ll.lat+','+ll.lon,
 deliveryOf:key=>({recorded:true,state:'on site',done:false,note:fixtureNotes[key]||''}),
 itemRows:a=>fixtureItems[a.key]||[],unitsOf:()=>[],machinesOnHire:()=>[],isMiscRow:()=>false
});
vm.runInContext(localFun('daily821Date')+'\n'+localFun('daily821Model'),ctx);
test('Integrated exact-day projection rejects invalid ISO calendar date',()=>{assert.throws(()=>ctx.daily821Model('2026-02-30'));});
test('Integrated projection contains current day only with cancelled/removal excluded',()=>{reset([booked('A'),booked('TOMORROW',{date:'2026-10-09'}),booked('OFF'),row('REMOVE',[{...event(),movement:'remove'}])]);cancelled.add('OFF');const m=ctx.daily821Model(iso);assert.deepStrictEqual(serial(m.loads.flatMap(l=>l.rows.map(r=>r.key))),['A']);assert(m.loads.every(l=>l.iso===iso&&l.rows.every(r=>r.iso===iso)));});
test('Integrated delivery notes retain own recorded instruction and exclude another reference',()=>{reset([booked('A'),booked('B')]);fixtureNotes={A:'Instruction A',B:'Instruction B'};const m=ctx.daily821Model(iso);const a=m.loads.flatMap(l=>l.rows).find(r=>r.key==='A');assert.match(a.notes.join(' '),/Instruction A/);assert.doesNotMatch(a.notes.join(' '),/Instruction B/);fixtureNotes={};});
test('Integrated moved booking preserves instruction without stale clock/DD booking detail',()=>{reset([booked('MOVED',{date:previous,time:'0530'}),booked('CURRENT')]);moves.MOVED={in_moved:true,in:iso};const m=ctx.daily821Model(iso),load=m.loads.find(l=>l.rows.some(r=>r.key==='MOVED'));assert(load);assert.equal(load.time,'');assert.equal(load.carrier,'');assert.doesNotMatch(JSON.stringify(load),/05:30|0530|DD-MOVED/);assert.match(load.rows[0].notes.join(' '),/booking for this rescheduled day has not been supplied/);});
test('Integrated split cargo and reference receipt context stay distinct',()=>{reset([booked('SPLIT',{quantity:2,loads:[{truck_id:'split1',dd:'D1',load_time:'0900',carrier:'C',quantity:1,asset_numbers:['AS1']},{truck_id:'split2',dd:'D2',load_time:'0900',carrier:'C',quantity:1,asset_numbers:['AS2']}]})]);fixtureItems={SPLIT:[{asked:'Building',qty_asked:'2',qty_supplied:'1',supplied:'Building'}]};const m=ctx.daily821Model(iso);assert.equal(m.loads.length,2);assert.deepStrictEqual(serial(m.loads.map(l=>l.rows[0].assets)),['AS1','AS2']);for(const l of m.loads){assert.equal(l.rows[0].items[0].qty,'1');assert.match(l.rows[0].quantityRecord,/Reference remaining: 1/);assert.match(l.rows[0].quantityRecord,/Receipt allocation to this load is not recorded/);}fixtureItems={};});
test('Optional meet-point data follows each selected reference, with scoped park safety only',()=>{
 reset([booked('A'),booked('B')]);ctx.MP819={park:'PARK'};
 ctx.EP819={site_rules:['Fixture common rule'],park:{rules:['Fixture park rule']},loads:[{date:'2026-10-09',refs:['FOREIGN'],note:'Foreign supplier secret'}],quote:{amount:'Financial secret'}};
 ctx.meetPoint819=a=>({p:{id:a.key==='A'?'PARK':'OTHER',name:'Meet '+a.key,way:'Way '+a.key,ll:[-28.01,a.key==='A'?153.42:153.43]},how:'rule'});
 ctx.mpUrl819=p=>'https://www.google.com/maps/dir/?api=1&destination='+p.ll.join(',');ctx.mpWhy819=()=> 'Verified fixture basis';
 const m=ctx.daily821Model(iso),rows=m.loads.flatMap(l=>l.rows),a=rows.find(r=>r.key==='A'),b=rows.find(r=>r.key==='B');
 assert.notEqual(a.navUrl,b.navUrl);assert.equal(a.meetName,'Meet A');assert.equal(b.meetName,'Meet B');assert.match(a.notes.join(' '),/Fixture park rule/);assert.doesNotMatch(b.notes.join(' '),/Fixture park rule/);assert(rows.every(r=>r.notes.includes('Fixture common rule')));
 const page=renderDay(m,{name:'Fixture Installer'});assert.match(page,/Current scheduled deliveries only/);assert.match(page,/supplier plans remain separate/);assert.match(page,/Meet A/);assert.match(page,/Meet B/);assert.doesNotMatch(page,/Foreign supplier secret|Financial secret|FOREIGN|2026-10-09/);
 delete ctx.MP819;delete ctx.EP819;delete ctx.meetPoint819;delete ctx.mpUrl819;delete ctx.mpWhy819;
});
test('No-v8.19 fallback preserves canonical destination and honest map basis',()=>{reset([booked('A')]);const r=ctx.daily821Model(iso).loads[0].rows[0];assert.equal(r.meetName,'');assert.equal(r.navBasis,'Master plan');assert.match(r.navUrl,/destination=-28\.001,153\.43$/);});
test('Day renderer excludes explicitly foreign day groups and rows',()=>{const m={iso,loads:[{iso,rows:[{iso,key:'IN',item:'1 Building'},{iso:'2026-10-09',key:'WRONG_ROW'}]},{iso:'2026-10-09',rows:[{key:'WRONG_LOAD'}]}]};const page=renderDay(m,{name:'Fixture Installer'});assert.match(page,/>IN<\/h3>/);assert.doesNotMatch(page,/WRONG_ROW|WRONG_LOAD/);});
const report={author:'Andrew Fisher',scope:'Synthetic CPU day projection review; no network or live writes',pageSha256:crypto.createHash('sha256').update(html).digest('hex'),nativeBookingSha256:crypto.createHash('sha256').update(booking).digest('hex'),projectionSha256:crypto.createHash('sha256').update(projectionSource).digest('hex'),rendererSha256:crypto.createHash('sha256').update(fs.readFileSync(rendererFile)).digest('hex'),proposalSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'fixture_delivery_groups.cjs'))).digest('hex'),reproduced,passed:results.filter(x=>x.pass).length,total:results.length,results};
fs.writeFileSync(path.join(evidence,'coverage-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.passed===report.total?0:1;
