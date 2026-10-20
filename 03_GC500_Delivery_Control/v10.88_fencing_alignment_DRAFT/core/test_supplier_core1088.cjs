/* Author: Andrew Fisher. Synthetic values only; no operational supplier invoices. */
'use strict';
const assert=require('node:assert/strict'),S=require('./supplier_core1088');
const Previous=require('../../v10.14_purchase_order_values_LIVE/pricing1014/supplier_core1014');
let count=0;
const check=(name,f)=>{f();count++;console.log('PASS '+name);};
const source={file:'approved-example.pdf',sha256:'a'.repeat(64),date:'2026-10-01'};
const rec=(id,book='red')=>({id,number:id,book,date:'2026-10-01',usable:true});
const line=(qty=2,rate=7.25,column='clean')=>({column,name:'Example',qty,rate,unit:'m'});
const spec=()=>({schema:1,currency:'AUD',basis:'ex GST',supplier_code:'EXAMPLE',branch:'TEST',source,records:[{...rec('D1'),lines:[line()]}],extras:[],total:14.5});
const po=s=>({number:'10001',branch:'TEST',supplier_code:'EXAMPLE',amount:14.5,supplier_pricing:s});
const calc=s=>S.calculate([po(s)],[rec('D1')]);
check('exact decimal multiplication and symmetric half cents',()=>{assert.equal(S.productCents(1.005,1),101);assert.equal(S.productCents(-1.005,1),-101);assert.equal(S.productCents(0.1,0.2),2);assert.equal(S.cents(1.001),null);});
check('valid source allocation uses derived cents without mutating inputs',()=>{const s=spec(),copy=JSON.stringify(s),m=calc(s);assert.equal(m.orders[0].valid,true);assert.equal(m.records.get('red|D1').amount,14.5);assert.equal(m.orders[0].difference,0);assert.equal(JSON.stringify(s),copy);});
check('PO value mismatch stays visible and never scales supplier prices',()=>{const p=po(spec());p.amount=100;const m=S.calculate([p],[rec('D1')]);assert.equal(m.orders[0].valid,true);assert.equal(m.orders[0].difference,-85.5);assert.equal(m.records.get('red|D1').amount,14.5);});
check('source total mismatch fails closed',()=>{const s=spec();s.total=99;const m=calc(s);assert.equal(m.orders[0].valid,false);assert.equal(m.records.size,0);});
check('source line claimed amount must match quantity times rate',()=>{const s=spec();s.records[0].lines[0].amount=14.49;assert.equal(calc(s).orders[0].valid,false);});
check('missing and ambiguous identities fail closed',()=>{for(const rows of [[],[rec('D1'),rec('D1')],[{...rec('D1'),number:'other'}]])assert.equal(S.calculate([po(spec())],rows).records.size,0);});
check('date and usability changes invalidate source allocation',()=>{for(const change of [{date:'2026-10-02'},{usable:false}])assert.equal(S.calculate([po(spec())],[{...rec('D1'),...change}]).orders[0].valid,false);});
check('same record in two POs is never billed twice',()=>{const p=po(spec()),m=S.calculate([p,{...p,number:'10002'}],[rec('D1')]);assert.equal(m.records.size,0);assert.equal(m.orders.every(o=>!o.valid),true);});
check('duplicate within one source invalidates that source',()=>{const s=spec();s.records.push({...s.records[0]});s.total=29;assert.equal(calc(s).orders[0].valid,false);});
check('clean credit remains separate billed quantity without touching physical truth',()=>{const s=spec();s.records[0].lines=[line(3,10),line(-1,10)];s.total=20;const m=calc(s);assert.equal(m.orders[0].red,20);assert.equal(m.orders[0].valid,true);assert.equal(m.records.get('red|D1').lines[1].paid,-10);});
check('negative unrelated categories and rates are refused',()=>{for(const l of [line(-1,10,'scrim'),line(1,-10)]){const s=spec();s.records[0].lines=[l];s.total=-10;assert.equal(calc(s).orders[0].valid,false);}});
check('green service pricing and dated extras feed distinct categories once',()=>{const s=spec();s.records.push({...rec('N1','green'),lines:[{...line(0.5,40,'labour'),unit:'hr'}]});s.extras=[{id:'E1',date:'2026-10-01',column:'team_leader',name:'Supervisor',qty:2,unit:'day',rate:30}];s.total=94.5;const m=S.calculate([po(s)],[rec('D1'),rec('N1','green')]);assert.equal(m.orders[0].valid,true);assert.equal(m.orders[0].green,20);assert.equal(m.orders[0].extrasTotal,60);assert.equal(m.extras.length,1);});
check('duplicate extras fail closed across POs',()=>{const a=spec();a.extras=[{id:'E1',date:'2026-10-01',column:'team_leader',qty:1,unit:'day',rate:1}];a.total=15.5;const b=structuredClone(a);b.records[0]={...b.records[0],id:'D2',number:'D2'};const m=S.calculate([po(a),{...po(b),number:'10002'}],[rec('D1'),rec('D2')]);assert.equal(m.extras.length,0);assert.equal(m.orders.every(o=>!o.valid),true);});
check('blue counts-only zero is explicit without inferred removal credit',()=>{const s=spec();s.records.push({...rec('C1','blue'),lines:[]});const m=S.calculate([po(s)],[rec('D1'),rec('C1','blue')]);assert.equal(m.orders[0].valid,true);assert.equal(m.records.get('blue|C1').amount,0);s.records[1].lines=[line()];s.total=29;assert.equal(S.calculate([po(s)],[rec('D1'),rec('C1','blue')]).orders[0].valid,false);});
check('unknown PO amount is not converted to zero',()=>{for(const amount of [null,undefined,'']){const p={...po(spec()),amount};assert.equal(S.calculate([p],[rec('D1')]).orders[0].difference,null);}});
check('zero PO amount remains a known difference',()=>{const p={...po(spec()),amount:0};assert.equal(S.calculate([p],[rec('D1')]).orders[0].difference,14.5);});
check('supplier, branch, stream and source identity are checked',()=>{for(const patch of [{supplier_code:'OTHER'},{branch:'OTHER'},{stream:'toilets'}])assert.equal(S.calculate([{...po(spec()),...patch}],[rec('D1')]).orders[0].valid,false);assert.equal(S.calculate([po(spec())],[rec('D1')],{supplier_code:'OTHER',branch:'TEST'}).orders[0].valid,false);const s=spec();s.source={...source,sha256:'missing'};assert.equal(calc(s).orders[0].valid,false);});
check('malformed shared data produces review issues without crashing',()=>{for(const s of [false,4,'bad',[],{...spec(),records:[null]},{...spec(),extras:[null]},{...spec(),records:[{...rec('D1'),lines:[null]}]}])assert.doesNotThrow(()=>{const m=calc(s);assert.equal(m.orders[0].valid,false);});});
check('current area and reference follow the linked record without repricing',()=>{const p=po(spec()),a=S.calculate([p],[{...rec('D1'),location:'North gate',map_ref:'REF-A'}]),b=S.calculate([p],[{...rec('D1'),location:'South gate',map_ref:'REF-B'}]);assert.equal(a.records.get('red|D1').current_location,'North gate');assert.equal(b.records.get('red|D1').current_location,'South gate');assert.equal(b.records.get('red|D1').current_reference,'REF-B');assert.equal(a.orders[0].total,b.orders[0].total);});
const material=()=>({
 id:'material-example-line-a',date:'2026-10-01',column:'misc',name:'Example roll',
 qty:3,unit:'roll',rate:12.35,
 source:{file:'example-materials-paper.pdf',sha256:'b'.repeat(64),page:2,reference:'MATERIAL-EXAMPLE'},
 evidence:{billing:'supplier programme',invoice:'not supplied'}
});
const snapshot=result=>({
 orders:result.orders,records:[...result.records.entries()],extras:result.extras,issues:result.issues
});
check('previous approved allocation remains byte-identical with credits, all books and daily leaders',()=>{
 const s=spec();
 s.records[0].lines=[line(8,7.25),line(-1,7.25),line(1,3,'scrim')];
 s.records.push({...rec('N1','green'),lines:[{...line(0.5,20,'labour'),unit:'hr'}]});
 s.records.push({...rec('C1','blue'),lines:[]});
 s.extras=[{id:'E1',date:'2026-10-01',column:'team_leader',name:'Leader',qty:1,unit:'day',rate:30}];
 s.total=93.75;
 const orders=[{...po(s),amount:s.total}],current=[rec('D1'),rec('N1','green'),rec('C1','blue')];
 const previous=Previous.calculate(orders,current);
 assert.equal(previous.orders[0].valid,true);
 assert.deepEqual(snapshot(S.calculate(orders,current)),snapshot(previous));
});
check('bases use an existing components-only red record without inventing site or customer quantities',()=>{
 const s=spec(),current=[{...rec('D1'),quantities:{},components:{base:15}}];
 s.records[0].lines=[{column:'bases',name:'Bases supplied',qty:15,unit:'each',rate:1.35}];
 s.total=20.25;
 const before=JSON.stringify({s,current}),m=S.calculate([{...po(s),amount:s.total}],current);
 assert.equal(m.orders[0].valid,true);
 assert.equal(m.records.get('red|D1').amount,20.25);
 assert.equal(m.records.get('red|D1').lines[0].column,'bases');
 assert.equal(JSON.stringify({s,current}),before);
});
check('misc may be linked to an existing red paper with explicit measured billing units',()=>{
 const s=spec();s.records[0].lines=[{...material(),qty:2,rate:8.125}];s.total=16.25;
 const m=calc(s);assert.equal(m.orders[0].valid,true);
 assert.equal(m.records.get('red|D1').amount,16.25);
 assert.deepEqual(m.records.get('red|D1').lines[0].source,material().source);
});
check('source-linked materials extras are distinct from existing team-leader labour',()=>{
 const s=spec();s.extras=[material(),{id:'E1',date:'2026-10-01',column:'team_leader',qty:1,unit:'day',rate:20}];s.total=71.55;
 const before=JSON.stringify(s),m=calc(s);
 assert.equal(m.orders[0].valid,true);
 assert.equal(m.orders[0].extrasTotal,57.05);
 assert.equal(m.extras.filter(x=>S.GEAR.includes(x.column)).reduce((n,x)=>n+x.cents,0),3705);
 assert.equal(m.extras.filter(x=>S.LABOUR.includes(x.column)).reduce((n,x)=>n+x.cents,0),2000);
 assert.equal(m.orders[0].red,14.5);
 assert.equal(m.records.size,1);
 assert.equal(JSON.stringify(s),before);
});
check('materials provenance and evidence survive projection at source, record, line and extra level',()=>{
 const s=spec();
 s.source.evidence={taxBasisPrinted:false,accountingBasis:'project convention'};
 s.records[0].evidence={page:4,review:'literal paper retained'};
 s.records[0].lines[0].evidence={page:1,row:3};
 s.extras=[material()];s.total=51.55;
 const m=calc(s);
 assert.equal(m.orders[0].valid,true);
 assert.deepEqual(m.orders[0].source.evidence,s.source.evidence);
 assert.deepEqual(m.records.get('red|D1').evidence,s.records[0].evidence);
 assert.deepEqual(m.records.get('red|D1').lines[0].evidence,s.records[0].lines[0].evidence);
 assert.deepEqual(m.extras[0].source,material().source);
 assert.deepEqual(m.extras[0].evidence,material().evidence);
});
check('materials extras require original file fingerprint page and reference',()=>{
 for(const change of [
  {source:null},{source:[]},{source:{...material().source,file:''}},
  {source:{...material().source,sha256:'not-a-fingerprint'}},
  {source:{...material().source,sha256:['b'.repeat(64)]}},
  {source:{...material().source,page:0}},{source:{...material().source,page:1.5}},
  {source:{...material().source,page:'2'}},{source:{...material().source,reference:''}},
  {source:{...material().source,reference:42}}
 ]){
  const s=spec();s.extras=[{...material(),...change}];s.total=51.55;
  const m=calc(s);assert.equal(m.orders[0].valid,false);
  assert.equal(m.records.size,0);assert.equal(m.extras.length,0);
 }
});
check('materials extras refuse missing identity or date and nonpositive quantities or rates',()=>{
 for(const change of [
  {id:''},{date:'2026-02-30'},{qty:0},{qty:-1},{qty:'3'},
  {rate:0},{rate:-1},{rate:'12.35'},{unit:''},{unit:null}
 ]){
  const s=spec();s.extras=[{...material(),...change}];s.total=51.55;
  const m=calc(s);assert.equal(m.orders[0].valid,false);assert.equal(m.extras.length,0);
 }
});
check('materials source does not weaken dated team-leader or unsupported-extra rules',()=>{
 for(const change of [
  {column:'bases'},{column:'labour'},{column:'anything'},
  {column:'team_leader',unit:'roll'}
 ]){
  const s=spec();s.extras=[{...material(),...change}];s.total=51.55;
  assert.equal(calc(s).orders[0].valid,false);
 }
});
check('bases and misc stay outside green labour and blue collections',()=>{
 for(const book of ['green','blue'])for(const column of ['bases','misc']){
  const s=spec();s.records=[{...rec('D1',book),lines:[line(2,7.25,column)]}];
  assert.equal(S.calculate([po(s)],[rec('D1',book)]).orders[0].valid,false);
 }
});
check('new gear rejects negative or zero billing quantities rather than changing physical counts',()=>{
 for(const column of ['bases','misc'])for(const qty of [-1,0]){
  const s=spec();s.records[0].lines=[line(qty,1,column)];s.total=qty;
  assert.equal(calc(s).orders[0].valid,false);
 }
});
check('duplicated materials identity fails closed even when every total matches',()=>{
 const s=spec();s.extras=[material(),material()];s.total=88.6;
 const m=calc(s);assert.equal(m.orders[0].valid,false);assert.equal(m.extras.length,0);
 const a=spec();a.extras=[material()];a.total=51.55;
 const b=structuredClone(a);b.records[0]={...b.records[0],id:'D2',number:'D2'};
 const both=S.calculate([po(a),{...po(b),number:'10002'}],[rec('D1'),rec('D2')]);
 assert.equal(both.orders.every(o=>!o.valid),true);assert.equal(both.extras.length,0);
});
check('new gear preserves unique native identity matching and source date gates',()=>{
 const s=spec();s.records[0].lines=[line(2,7.25,'bases')];
 for(const current of [[],[rec('D1'),rec('D1')],[{...rec('D1'),date:'2026-10-02'}]]){
  const m=S.calculate([po(s)],current);assert.equal(m.orders[0].valid,false);assert.equal(m.records.size,0);
 }
});
check('new materials lines use exact cents and reject inconsistent asserted amounts',()=>{
 const s=spec();s.extras=[{...material(),qty:3,rate:0.335,amount:1.01}];s.total=15.51;
 assert.equal(calc(s).orders[0].valid,true);
 assert.equal(calc(s).extras[0].paid,1.01);
 s.extras[0].amount=1;s.total=15.5;
 assert.equal(calc(s).orders[0].valid,false);
});
check('blank green billing is not converted to zero or hidden in a supplier allocation',()=>{
 const s=spec();s.records.push({...rec('N1','green'),lines:[]});
 const m=S.calculate([po(s)],[rec('D1'),{...rec('N1','green'),labour_hours:0.5}]);
 assert.equal(m.orders[0].valid,false);
 assert.equal(m.records.has('green|N1'),false);
});
check('adding a new source allocation leaves an independent prior order unchanged',()=>{
 const old=spec(),fresh=spec();fresh.records=[{...rec('D2'),lines:[line(4,2.75,'bases')]}];
 fresh.extras=[material()];fresh.total=48.05;
 const current=[rec('D1'),rec('D2')],first=S.calculate([po(old)],current).orders[0];
 const combined=S.calculate([po(old),{...po(fresh),number:'10002',amount:fresh.total}],current);
 assert.equal(combined.orders.every(o=>o.valid),true);
 assert.deepEqual(combined.orders[0],first);
 assert.equal(combined.orders[1].total,48.05);
 assert.equal(combined.orders[1].difference,0);
});
console.log(count+' supplier pricing core checks passed');
