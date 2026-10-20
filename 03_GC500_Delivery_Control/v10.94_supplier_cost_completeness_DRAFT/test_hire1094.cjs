/* Author: Andrew Fisher. Synthetic scope, exact-cent and shared-inventory regressions. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const H=require('./supplier_hire1094.js'),file=process.argv[2];
if(!file)throw Error('Pass the exact predecessor HTML; no private fixture is committed');
const html=fs.readFileSync(file,'utf8'),start=html.indexOf('/* supplier-cost-consistency-1068 */'),end=html.indexOf('function supplierServiceQuantities1068',start);
assert(start>=0&&end>start);
const scope={};vm.createContext(scope);vm.runInContext(html.slice(start,end),scope);const A=scope.SupplierService1068;
function fixture(){
 const prices=[1.25,2.50,10,3.25,12.50],quantities=[10,2,1,2,1],all=H.mappings.concat(H.exclusions);
 const lines=all.map((m,i)=>({description:m.description,qty:quantities[i],unit_price:prices[i],total_price:quantities[i]*prices[i]}));
 const subtotal=lines.reduce((s,l)=>s+l.total_price,0);
 const source={quotes:[{quote:'Q6845',groups:[{lines}],sub_total:subtotal}],authorisation:{state:'approved',applies_to:['Q6845']}};
 const q={...source.quotes[0],knownSubtotal1068:subtotal,costComplete1068:true,costTotal1068:subtotal+8,costTotalCents1068:(subtotal+8)*100,knownCostTotal1068:subtotal+8,knownCostTotalCents1068:(subtotal+8)*100};
 const cost={complete:true,issues:[],quotes:[q],total:subtotal+8,knownTotal:subtotal+8,quotedTotal:subtotal+8,serviceTotal:4,lines:[]};
 const inventory={inventory:H.mappings.map((m,i)=>({ref:'R'+i,item:m.item,received:[7,2,2][i],onSite:[7,2,2][i],numbers:[],quantityOnly:i===1,dispatchHold:false})),issues:[],conflicts:[]};
 const extra={ref:'R2',required:2,quoted:1,additional:1,rate:10,estimate:10,held:false,coverage:[],state:'estimate'};
 return {source,cost,inventory,extra};
}
const run=f=>{const h=H.hire(f.source,f.inventory,f.extra,A);return {h,c:H.project(f.cost,h,A),f:H.forecast(f.extra,h,A)};};
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
test('received hire replaces quote quantities, scope exclusions applied, fixed charges preserved',()=>{
 const x=run(fixture());assert(x.h.complete);assert.equal(x.c.total,41.75);assert.equal(x.c.serviceTotal,4);assert.deepEqual(x.h.rows.map(r=>r.amount),[8.75,5,20]);assert.deepEqual(x.h.excluded.map(r=>r.amount),[0,0]);assert.equal(x.f.estimate,0);assert.equal(x.f.additional,0);
});
test('original source and other service model fields immutable',()=>{
 const f=fixture(),before=JSON.stringify(f);run(f);assert.equal(JSON.stringify(f),before);
});
test('current ex-GST projection cannot expose stale original tax or gross totals',()=>{const f=fixture();f.cost.quotes[0].gst=4.65;f.cost.quotes[0].total_amount=51.15;const q=run(f).c.quotes[0];assert.equal(q.gst,null);assert.equal(q.total_amount,null);assert.equal(q.quotedGross1094,51.15);assert.equal(q.quotedGST1094,4.65);});
test('six numbered panels replace quantity-only identity without adding quantity',()=>{
 const f=fixture();f.inventory.inventory[1].received=f.inventory.inventory[1].onSite=6;const before=run(f);
 f.inventory.inventory[1].numbers=['PP01','PP02','PP03','PP04','PP05','PP06'];f.inventory.inventory[1].quantityOnly=false;
 const after=run(f);assert.equal(after.c.total,before.c.total);assert.equal(after.h.rows[1].quantity,6);
});
test('demob collection does not erase received hire',()=>{
 const f=fixture(),before=run(f);f.inventory.inventory.forEach(r=>{r.collected=r.received;r.onSite=0;});assert.equal(run(f).c.total,before.c.total);
});
test('missing receipt cannot silently zero a hire line',()=>{const f=fixture();f.inventory.inventory[0].received=0;const x=run(f);assert(!x.c.complete);assert.equal(x.c.total,null);assert.equal(x.h.rows[0].amount,null);});
test('absent inventory holds complete cost',()=>{const f=fixture();f.inventory=null;assert.equal(run(f).c.total,null);});
test('conflicting identity holds complete cost',()=>{const f=fixture();f.inventory.conflicts=[{number:'X'}];assert.equal(run(f).c.total,null);});
test('receipt issue holds complete cost',()=>{const f=fixture();f.inventory.issues=[{reason:'unclear'}];assert.equal(run(f).c.total,null);});
test('duplicate rows cannot double-charge',()=>{const f=fixture();f.inventory.inventory.push(f.inventory.inventory[0]);assert.equal(run(f).c.total,null);});
test('pending dispatch identity holds affected line',()=>{const f=fixture();f.inventory.inventory[0].dispatchHold=true;assert.equal(run(f).c.total,null);});
test('fractional physical quantity holds affected line',()=>{const f=fixture();f.inventory.inventory[0].received=1.5;assert.equal(run(f).c.total,null);});
test('missing unit rate holds affected line',()=>{const f=fixture();delete f.source.quotes[0].groups[0].lines[0].unit_price;assert.equal(run(f).c.total,null);});
test('duplicated source quotation cannot double-charge',()=>{const f=fixture();f.source.quotes.push(structuredClone(f.source.quotes[0]));assert.equal(run(f).c.total,null);});
test('duplicated source hire line holds complete cost',()=>{const f=fixture();f.source.quotes[0].groups[0].lines.push(f.source.quotes[0].groups[0].lines[0]);assert.equal(run(f).c.total,null);});
test('unapproved source cannot claim complete',()=>{const f=fixture();f.source.authorisation.state='pending';assert.equal(run(f).c.total,null);});
test('source amount mismatch holds affected line',()=>{const f=fixture();f.source.quotes[0].groups[0].lines[0].total_price=1;assert.equal(run(f).c.total,null);});
test('actual additional block invoice stays separate and is not absorbed twice',()=>{const f=fixture();f.extra.state='recorded-variation';f.extra.estimate=0;const x=run(f);assert.equal(x.c.total,31.75);assert.equal(x.h.rows[2].quantity,1);assert.equal(x.h.rows[2].received,2);assert.equal(x.f.state,'recorded-variation');});
test('unclear partial additional block cost holds instead of double-charging',()=>{const f=fixture();f.extra.held=true;f.extra.state='held';const x=run(f);assert.equal(x.c.total,null);assert(x.f.held);});
test('partly received required blocks retain only uncovered forecast',()=>{const f=fixture();f.extra.required=3;f.extra.additional=2;f.extra.estimate=20;const x=run(f);assert.equal(x.c.total,41.75);assert.equal(x.f.additional,1);assert.equal(x.f.estimate,10);});
test('first block received does not erase the second required block forecast',()=>{const f=fixture();f.inventory.inventory[2].received=1;const x=run(f);assert.equal(x.f.additional,1);assert.equal(x.f.estimate,10);});
test('received blocks beyond recorded variation coverage are held',()=>{const f=fixture();f.extra.state='recorded-variation';f.extra.estimate=0;f.inventory.inventory[2].received=3;assert.equal(run(f).c.total,null);});
test('a received block elsewhere does not erase an unreceived required block',()=>{const f=fixture();f.inventory.inventory[2].received=1;f.inventory.inventory.push({...f.inventory.inventory[2],ref:'ELSEWHERE'});const x=run(f);assert.equal(x.h.rows[2].quantity,2);assert.equal(x.f.additional,1);assert.equal(x.f.estimate,10);});
test('another reference cannot borrow a scoped recorded variation',()=>{const f=fixture();f.extra.state='recorded-variation';f.extra.estimate=0;f.inventory.inventory[2].received=1;f.inventory.inventory.push({...f.inventory.inventory[2],ref:'ELSEWHERE'});assert.equal(run(f).c.total,null);});
test('null source group is held, not a page exception',()=>{const f=fixture();f.source.quotes[0].groups.push(null);assert.equal(run(f).c.total,null);});
test('null source line is held, not a page exception',()=>{const f=fixture();f.source.quotes[0].groups[0].lines.push(null);assert.equal(run(f).c.total,null);});
test('new accessible receipts conflict with prior quote-only exclusion',()=>{const f=fixture();f.inventory.inventory.push({ref:'R5',item:'Accessible Toilet',received:1,numbers:['A']});assert.equal(run(f).c.total,null);});
test('new VIP receipts conflict with prior quote-only exclusion',()=>{const f=fixture();f.inventory.inventory.push({ref:'R6',item:'VIP 5 Star Combo Toilet Block',received:1,numbers:['B']});assert.equal(run(f).c.total,null);});
test('missing excluded line evidence cannot silently remove guessed amount',()=>{const f=fixture();f.source.quotes[0].groups[0].lines.pop();assert.equal(run(f).c.total,null);});
test('singular panel label is same quantity, not a second category',()=>{const f=fixture();f.inventory.inventory[1].item='Pee Panel';assert.equal(run(f).c.total,41.75);});
test('sub-cent established rate rounds once to cents',()=>{const f=fixture();const l=f.source.quotes[0].groups[0].lines[0];l.unit_price=1.005;l.total_price=.01*A.multiply(l.qty,l.unit_price);const x=run(f);assert.equal(x.h.rows[0].amount,7.04);});
test('incomplete servicing never becomes complete from hire correction',()=>{const f=fixture();f.cost.complete=false;f.cost.issues=['Servicing mapping missing'];assert.equal(run(f).c.total,null);});
console.log(JSON.stringify({pass:true,tests:n}));
