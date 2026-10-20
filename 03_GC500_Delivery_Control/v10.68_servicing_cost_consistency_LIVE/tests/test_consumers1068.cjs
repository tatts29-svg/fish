/* Author: Andrew Fisher. Read-only VM checks of real page consumer functions.
   PAGE must name a v10.67 candidate. This is not a browser/release check or a live write. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const source=path.resolve(__dirname,'../supplier_cost1068_src.js'),patch=path.resolve(__dirname,'../patch_v1068.py');
if(!process.env.PAGE)throw Error('Set PAGE to a local v10.67 candidate; no page is downloaded by this test.');
const original=fs.readFileSync(process.env.PAGE,'utf8');
const html=execFileSync('python3',['-c',"import importlib.util,sys;from pathlib import Path;s=importlib.util.spec_from_file_location('patch',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);sys.stdout.write(m.patch(Path(sys.argv[2]).read_text()))",patch,process.env.PAGE],{encoding:'utf8',maxBuffer:40*1024*1024,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
let count=0;const test=(name,f)=>{f();count++;console.log('PASS '+name);};
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
test('every patched inline script parses',()=>scripts.forEach(s=>new vm.Script(s)));
function lift(name,text=html){const start=text.indexOf('function '+name+'(');assert.ok(start>=0,name);for(let end=text.indexOf('}',start);end>=0;end=text.indexOf('}',end+1)){const code=text.slice(start,end+1);try{new vm.Script('('+code+')');return code;}catch(_){}}throw Error('Unclosed function '+name);}
test('real native servicing keeps customer sewer rules while supplier cleans every eligible block',()=>{
 const kind=[{kind:'fwf',card_line:'F',rate:2,unit:'FWF',units:'FWF'},{kind:'tank',card_line:'T',rate:3,unit:'tank',units:'tanks'},{kind:'sewer',card_line:'B',rate:4,unit:'block',units:'blocks'}];
 const assets=[{key:'A',lines:[{item:'FWF',qty:4},{item:'Toilet Block',qty:3}]},{key:'B',lines:[{item:'Toilet Block',qty:2},{item:'Waste tank',qty:1}]},
  {key:'C',_cancelled:true,lines:[{item:'Toilet Block',qty:7}]},{key:'D',moved:true,lines:[{item:'Toilet Block',qty:9}]},{key:'E',out:'2030-01-01',lines:[{item:'Toilet Block',qty:8}]},{key:'OWN',lines:[{item:'Toilet Block',qty:11}]}];
 const defs=kind.map((k,i)=>({quote:'EX',description:'Source '+k.card_line,card_line:k.card_line,card_rate:k.rate,qty:20,their_rate:i+1,their_amount:20*(i+1)}));
 const data={toilet_servicing:{lines:defs,not_on_the_card:[],their_total:120},rehire_quotes:{quotes:[{quote:'EX',sub_total:120,delivery_charge:0,pickup:0,groups:[{lines:defs.map(l=>({description:l.description,qty:l.qty,unit_price:l.their_rate,total_price:l.their_amount}))}]}],totals:{sub_totals:120,delivery_and_pickup:0}}};
 const base={DATA:data,NIGHT1040:kind,allAssets:()=>assets,chargeLines:a=>a.lines,qtyOf:l=>l.qty,holdAssets:f=>f(),lr748Typed:()=>null,movedAway:key=>assets.find(a=>a.key===key).moved,effectiveDates:a=>({out_plan:a.out}),money:String,nights1040:()=>[{date:'2030-02-01',day:'Fri'},{date:'2030-02-02',day:'Sat'}]};
 const old=vm.createContext({...base}),next=vm.createContext({...base});
 const names=['servicing748base1040','nightRates1040','nightService1040','servicing748'];
 vm.runInContext(names.map(n=>lift(n,original)).join('\n'),old);
 vm.runInContext(fs.readFileSync(source,'utf8')+'\n'+names.map(n=>lift(n)).join('\n'),next);
 const wrapStart=original.indexOf(' const beforeN = nightService1040;'),wrapEnd=original.indexOf('\n})(window);',wrapStart);
 assert.ok(wrapStart>=0&&wrapEnd>wrapStart);const wrapper='const OWN1050=new Set(["OWN"]);const W=globalThis;'+original.slice(wrapStart,wrapEnd);
 vm.runInContext(wrapper,old);vm.runInContext(wrapper,next);
 const before=old.servicing748(),after=next.servicing748();
 assert.deepEqual(after.card_lines.map(l=>l.qty),before.card_lines.map(l=>l.qty));
 assert.deepEqual(Array.from(after.card_lines,l=>l.qty),[8,2,6]);
 assert.deepEqual(Array.from(after.supplier1068.lines,l=>l.quantity),[8,2,10]);
 for(const key of ['total','card_total','their_water','at_cost_total'])assert.equal(after[key],before[key]);
 assert.equal(after.supplier1068.serviceTotal,42);assert.equal(after.supplier1068.complete,true);
 assets[1].lines[0].qty=4;const changed=next.servicing748();
 assert.equal(changed.card_lines[2].qty,6);assert.equal(changed.total,before.total);
 assert.equal(changed.supplier1068.lines[2].quantity,14);assert.equal(changed.supplier1068.serviceTotal,54);
});
const native=['pl754Rehire','rh769Cover','rh766Model776Held','pl770Model','pl760BranchTable','acc763Action','acc763ActionNow','acc762RowStatus','acc763Future','acc762Round','acc762Money','acc762Date','acc762Status','acc762Share','acc762QuoteDateWarning','daysInclusive','acc761DaysIn','acc761LastDay'];
const nativeSource=native.map(n=>lift(n)).join('\n');
const pure=require(source),data={quotes:[{quote:'SYNTHETIC',sub_total:25,delivery_charge:1,pickup:1,delivery:'2030-02-01',collect:'2030-02-05',groups:[{lines:[{description:'Service A',qty:10,unit_price:2,total_price:20},{description:'Other hire',qty:1,unit_price:5,total_price:5}]}]}],totals:{sub_totals:25,delivery_and_pickup:2},supplier:{name:'Synthetic'}};
const defs=[{quote:'SYNTHETIC',description:'Service A',card_line:'A'}],quantities=[{card_line:'A',quote:'SYNTHETIC',qty:2}];
const price=missing=>{const d=structuredClone(data);if(missing)delete d.quotes[0].groups[0].lines[0].unit_price;return pure.project(d,defs,quantities);};
const money=n=>n==null?null:'$'+Number(n).toFixed(2),zero=()=>({ticks:0,amount:0,unknown:0});
function context(model,approved=true){
 const M={charge:{contracts:100,servicing:30,total:130,race:{amount:0,scope:false},delivery:0,other:0,labour:0,fencing:0},cost:{rehire_estimate1068:model.knownTotal,rehire_quoted:27,rehire_complete1068:model.complete,rehire:model.knownTotal,rehire_approved:approved,transport:{amount:0},known:model.knownTotal},categories:[]};
 const F={cost:0,revenue:0,weeks:[],behind:[],hourly:{},noCostRate:{},notRolled:[]};
 const X={fencing:F,revenue:{job:130,transportToCome:0},job:(model.knownTotal||0)+5,wages:{job:0,unpricedHours:0},rows:[]};
 const ctx={console,DATA:{rehire_quotes:data},money,money0:money,fmtNum:String,fmtDate:String,todayIso:()=> '2030-02-03',esc:x=>String(x??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),
 allAssets:()=>[],subhireOf:()=>null,ONHIRE_ROWS:[],moneySummary:()=>M,cj764Model:()=>X,pl752Rows:()=>[],pl760ToiletBranch:()=> 'NVAC',pl760FencingByBranch:()=>({}),pl760FencingBranch:()=> 'STPS',pl752SubLocations:()=>[],
 pl760Ticks:()=>({install:zero(),cleaning:zero(),fire_ext:zero(),other:zero(),byBranch:{}}),fencePaidSplit:()=>({clean:true,paid:0,gear:0,installation:0}),allDockets:()=>[],
 Supplier955:{model:()=>({estimate:5}),ownerWords:()=>'',words:()=>''},Source949:{model:()=>[]},peeHireForecast979:()=>({amount:0,remainingAmount:0}),FinanceRequest996:{model:()=>({amount:0})},ScopeFinance1017:{model:()=>({rows:[]})},rehireBranches1010:()=>({}),
 servicing748:()=>({card_total:30,at_cost:[],supplier1068:model}),RENDER_MEMO:new Map(),generatorModel1004:()=>({hireRemaining:0,rehireRemaining:0}),pricingForecast1010:()=>({hireTotal:0,rehireTotal:0}),additionalHire1013:()=>({remainingAmount:0}),labourRevenue858:()=>({remaining:0}),fire914Gap:()=>''};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(source,'utf8')+'\n'+nativeSource,ctx);
 ctx.rh766Model=()=>ctx.rh766Model776Held();return{ctx,M,X};
}
test('unapproved coverage uses site estimate rather than original quote quantity',()=>{const {ctx,M}=context(price(false),false),r=ctx.pl754Rehire(M);assert.equal(r.cost,11);assert.equal(r.knownCost1068,11);assert.equal(r.approved,false);assert.equal(r.costComplete1068,true);});
test('incomplete coverage separates full cost from verified subtotal',()=>{const {ctx,M}=context(price(true)),r=ctx.pl754Rehire(M);assert.equal(r.cost,null);assert.equal(r.knownCost1068,7);assert.equal(r.costComplete1068,false);});
test('coverage wording never calls incomplete subtotal covered or free',()=>{const {ctx}=context(price(true));for(const n of [null,0,7])assert.equal(ctx.rh769Cover(130,n,false,false),'full supplier cost unavailable — coverage cannot be checked');assert.equal(ctx.rh769Cover(130,0,false,true),'no cost to cover');});
test('a forecast top-up cannot complete missing supplier base costs',()=>{const {ctx}=context(price(true)),r=ctx.rh766Model(),g=r.groups.find(g=>g.what==='Toilets — Event Portables');assert.equal(g.cost,null);assert.equal(g.costJob,null);assert.equal(g.costToCome,5);assert.equal(g.knownCost1068,7);assert.equal(g.branch,'NVAC');assert.equal(g.missing.length,1);assert.equal(r.totals.cost,null);assert.equal(r.totals.costJob,null);assert.equal(r.totals.knownCost1068,7);assert.equal(r.totals.knownCostJob1068,12);});
test('complete supplier costs retain ledger reconciliation and unchanged Revenue',()=>{const {ctx}=context(price(false)),p=ctx.pl770Model();assert.equal(p.qClean,true);assert.equal(p.costNow,11);assert.equal(p.revNow,130);assert.equal(p.revJob,130);assert.equal(p.checks.costs,true);});
test('incomplete costs cannot pass ledger split or recovery gates',()=>{const {ctx}=context(price(true)),p=ctx.pl770Model();assert.equal(p.qClean,false);assert.equal(p.costNow,7);assert.equal(p.revNow,130);assert.equal(p.revJob,130);assert.equal(p.cost.find(l=>l.key==='pump').now,null);assert.equal(p.cost.find(l=>l.key==='cons').now,null);assert.equal(p.rhCover,null);for(const r of p.rec.filter(r=>['Rehire Recovery','Transport Recovery','Consumables Recovery'].includes(r.name)))assert.equal(r.job,null);});
test('unknown branch amount stays visibly unknown on its actual branch',()=>{const {ctx,M}=context(price(true));const b={code:'NVAC',total:100,lines:0,contract:100,card:0,transport:0,rehire:0,none:0,decided:0};const out=ctx.pl760BranchTable([b],M,ctx.pl754Rehire(M));assert.match(out,/Full supplier cost unavailable; \$7\.00 ex GST known subtotal/);assert.match(out,/NVAC/);assert.doesNotMatch(out,/\$27\.00/);});
test('monthly incomplete source is never proposed as a full accrued or planned amount',()=>{const {ctx}=context(price(true));for(const status of ['review','forecast']){const r={kind:'cost',stream:'Toilets — supplier cost estimate, provisional day-share',candidate:7,extra:{status,forecastAmount:7,sources:[{supplierIncomplete1068:true,provisionalAllocation:true}]}},a=ctx.acc763Action(r,{month:'2030-02',asAt:'2030-02-03',label:'Feb'});assert.equal(a.key,'incomplete');assert.equal(a.toDate,null);assert.equal(a.planned,null);}});
const start=html.indexOf('supplierCostQuotes1068().forEach(q => {'),end=html.indexOf('\n\n const ownCosts = ourCosts()',start);assert.ok(start>=0&&end>start);const monthly=html.slice(start,end);
function monthlyRows(model){const {ctx}=context(model);ctx.month='2030-02';ctx.asAt='2030-02-03';ctx.out={unallocatedCosts:[]};ctx.rows=[];ctx.addCost=(stream,branch,amount,basis,extra)=>ctx.rows.push({stream,branch,amount,basis,extra});ctx.unallocated=(target,stream,branch,amount,basis,extra)=>target.push({stream,branch,amount,basis,extra});vm.runInContext(monthly,ctx);return ctx;}
test('monthly known subtotal uses the same shared cost with an explicit incomplete flag',()=>{const c=monthlyRows(price(true));assert.equal(c.rows.length,1);assert.equal(c.rows[0].amount,7);assert.equal(c.rows[0].extra.supplierIncomplete1068,true);assert.equal(c.rows[0].branch,'NVAC');assert.match(c.rows[0].basis,/incomplete/);});
test('monthly unavailable quote retains dynamic branch attribution and null amount',()=>{const d=structuredClone(data);d.quotes[0].sub_total=null;const c=monthlyRows(pure.project(d,defs,quantities));assert.equal(c.rows.length,0);assert.equal(c.out.unallocatedCosts.length,1);assert.equal(c.out.unallocatedCosts[0].branch,'NVAC');assert.equal(c.out.unallocatedCosts[0].amount,null);});
test('monthly undated partial quote retains dynamic branch attribution',()=>{const d=structuredClone(data);delete d.quotes[0].delivery;delete d.quotes[0].collect;const c=monthlyRows(pure.project(d,defs,quantities));assert.equal(c.out.unallocatedCosts[0].branch,'NVAC');assert.equal(c.out.unallocatedCosts[0].amount,11);});
test('old-base and repeat guards refuse without altering a source file',()=>{for(const text of [original.replace("+ ' · v10.67'","+ ' · v10.66'"),html]){const r=require('child_process').spawnSync('python3',['-c',"import importlib.util,sys;s=importlib.util.spec_from_file_location('patch',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);m.patch(sys.stdin.read())",patch],{input:text,encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});assert.notEqual(r.status,0);assert.match(r.stderr,/requires the verified v10.67|already applied/);}});
console.log(count+' real-consumer VM checks passed; candidate only, no browser or publication.');
