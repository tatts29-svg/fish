/* Author: Andrew Fisher. Settled departure wording covers outputs without editing times, quantities or sides. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../departure1070_src.js'),'utf8');
const ctx=vm.createContext({assert});
vm.runInContext(`
this.window=this;
const DATA={weeks:[{sheet:'Week 4',start:'2026-09-21'}]};
const S={loads:{example:{load_time:'09:45',door_side:'passenger',quantity:2}},operator:'Fixture'};
const before=JSON.stringify(S);
const B={key:'EXAMPLE',discipline:'Portable buildings'},F={key:'FIXTURE',discipline:'Furniture'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const dpItems=r=>r.events;
function assetOf(k){return k==='EXAMPLE'?B:F;}
function rules782Long(){return ['Existing site time 09:45; door side passenger; qty2'];}
function rules782Sms(){return ['Existing text'];}
function rules782Optional(){return ['Keep park rule'];}
function rules782Html(){return '<div class="rules782"><ul><li>Existing record</li></ul></div>';}
function flow891Card(){return '<section><h3>Truck flow</h3><div>09:45 passenger qty2</div></section>';}
function dpPage(){return '<main><h2>Safety</h2><p>JSEA and Take5</p><span>09:45 passenger qty2</span></main>';}
function dropPage(){return '<section><span>09:45 passenger qty2</span><div class="rs-foot">Author</div></section>';}
const daily={loads:[{time:'09:45',rows:[{key:'EXAMPLE',items:[{item:'Building 6m',qty:2}],notes:['Original note']},{key:'FIXTURE',items:[{item:'Fridge',qty:1}],notes:[]}]}]};
function daily821Model(){return daily;}
const DM816={view:'list',branch:'all'};
function dayHtml816(){return '<div class="dmbody816"><span>09:45 passenger qty2</span></div>';}
let runs=[];function trucks816(){return runs;}
function sheet816Before826(){return '<main><span>09:45 passenger qty2</span><h2>Rules</h2><p>Existing permit rule</p></main>';}
${source}
const R=BuildingDeparture1070;let checks=0;
function check(ok,why){assert.ok(ok,why);checks++;}
const row={a:B,events:[{item:'Building 6m',qty:2}]};
const accessory={a:B,events:[{item:'Fridge',qty:1}]};
for(const iso of ['2026-09-21','2026-09-27','2026-10-06','2026-10-12','2026-10-19','2026-10-25','2026-10-26','2026-11-13']){
 const d={iso,deliveries:[row],removals:[]},g={rows:[row],kind:'deliveries'};
 check(R.load(g,iso),'building covered in every phase');
 check(flow891Card(d).includes('data-departure1070'),'day flow has blanket rule');
 for(const kind of ['deliveries','removals']){g.kind=kind;const h=dpPage(d,g,'drv',1,1);check(h.includes('data-departure1070')&&h.includes('09:45 passenger qty2'),'delivery/removal print keeps record and gains rule');}
}
check(!R.load({rows:[row]},'2026-09-20'),'Week5 not retrospectively changed');
check(!R.load({rows:[row]},'not a date'),'invalid date not treated as a dated run');
check(!R.load({rows:[accessory]},'2026-10-19'),'accessory-only building reference excluded');
check(!R.load({rows:[{a:F,events:[{item:'Fridge'}]}]},'2026-10-19'),'other discipline excluded');
check(!R.building({...B,_cancelled:true}),'cancelled reference excluded');
check(R.row({a:B,parts:[{type:'Building 6m'}]}),'building demob stop classified');
check(!R.row({a:B,parts:[{type:'Air conditioner'}]}),'accessory-only demob stop excluded');
check(rules782Long(B).includes(R.words)&&rules782Long(B)[0].includes('09:45'),'full text keeps actual values');
check(rules782Sms(B).includes(R.short)&&!rules782Sms(F).includes(R.short),'short text building only');
check((rules782Html(B).match(/data-departure1070/g)||[]).length===1,'drawer rule exactly once');
const out=daily821Model('2026-10-19');check(out.loads[0].rows[0].notes.includes(R.words),'daily card includes rule');
check(daily.loads[0].rows[0].notes.length===1,'native daily model not mutated');
check(out.loads[0].time==='09:45'&&out.loads[0].rows[0].items[0].qty===2,'daily actual time and quantity retained');
const L={stops:[{r:{a:B},parts:[{type:'Building 6m',n:2}]}],t:{dep:300,arrive:370,leave:410}};
check(R.stops(L,'2026-10-26')&&!R.planningConflict(L),'compatible demob plan remains unflagged');
L.t.leave=420;check(R.planningConflict(L),'07:00 departure misses strict before07 rule');
const sh=sheet816Before826('2026-10-26',L);check(sh.includes(R.review)&&sh.includes('09:45 passenger qty2'),'demob sheet flags conflict without replacing facts');
check(sh.includes('For a departure from Kingston'),'05:00 explicitly scoped to Kingston');
runs=[L];DM816.view='trucks';const d={iso:'2026-10-26',list:[{a:B,branch:'EXAMPLE'}]};
check(dayHtml816({},d).includes(R.review),'demob planning display flags conflict');
DM816.view='pump';check(!dayHtml816({},d).includes('data-departure1070'),'pump-only view not relabelled as building run');
check(dropPage(B,row.events,1,1,{iso:'2026-10-19'}).includes(R.words),'drop sheet rule present');
check(!dropPage(B,accessory.events,1,1,{iso:'2026-10-19'}).includes(R.words),'accessory-only drop sheet unaffected');
check(JSON.stringify(S)===before,'no record, quantity, time or door-side change');
this.result={checks,passed:true};
`,ctx);
console.log(JSON.stringify({author:'Andrew Fisher',...ctx.result}));
