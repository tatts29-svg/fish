/* Author: Andrew Fisher. No browser, no service access, no shared-record mutation. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const F=require('./finance1007.js');let checks=0;
function check(name,fn){fn();checks++;}
const source={hire:672.1677000000001},item={ref:'WC09',item:'Pee Panel',quantity:6,arrived:6};
check('Existing six-panel total is classified actual once',()=>{const p=F.pee([item],[],source);assert.equal(p.amount,4033.01);assert.equal(p.actualAmount,4033.01);assert.equal(p.remainingAmount,0);assert.equal(p.branch,'KINP');assert.equal(p.ledger,'1010');assert.equal(p.supplierCostAdditional,0);});
check('Pending retains the same job total, with zero actual',()=>{const p=F.pee([{...item,arrived:0}],[],source);assert.equal(p.amount,4033.01);assert.equal(p.actualAmount,0);assert.equal(p.remainingAmount,4033.01);assert.equal(p.state,'forecast');});
for(let q=1;q<6;q++)check('Partial '+q+' splits without increasing job total',()=>{const p=F.pee([{...item,arrived:q}],[],source);assert.equal(p.actualAmount,F.cents(source.hire*q));assert.equal(F.cents(p.actualAmount+p.remainingAmount),4033.01);assert.equal(p.state,'part arrived');});
check('A contract for pee hire suppresses fallback, even if still unpriced',()=>{for(const r of [{description:'Pee Panels',rate:null},{register_type:'Pee Panel',amount:4033.01}]){const p=F.pee([item],[r],source);assert.equal(p.amount,0);assert.equal(p.actualAmount,0);assert.equal(p.remainingAmount,0);assert.equal(p.state,'contract coverage needs allocation');}});
check('Transport contract wording does not suppress hire',()=>assert.equal(F.pee([item],[{charge_line:true,description:'Pee panel delivery'}],source).actualAmount,4033.01));
check('Changed or duplicate source scope is held rather than guessed',()=>{for(const items of [[],[item,item],[{...item,quantity:7}],[{...item,arrived:null}],[{...item,arrived:7}],[{...item,arrived:-1}]]){const p=F.pee(items,[],source);assert.equal(p.amount,0);assert.equal(p.remainingAmount,0);assert.equal(p.actualAmount,0);}});
const emptyCard={labour_per_piece:{lines:['install','levelling','cleaning','demob'].map(key=>({key,money:'absent',rate:null}))}};
for(const [ref,type] of [['WC100','FWF Trailer'],['T0258','3.0m Cont'],['WB01','TL2'],['WB02','TL2'],['WB03','TL2']])check(ref+' arrived unmapped work is unknown, not free',()=>{const g=F.workGap({ref,item:type,received:1,card:emptyCard});assert.equal(g.value,null);assert.equal(g.rate,null);assert.equal(g.state,'unpriced');assert.ok(g.why);});
check('Own-use container never gains a customer work hold',()=>assert.equal(F.workGap({ref:'T0023',item:'Event Container',received:1,ownUse:true,card:emptyCard}),null));
check('Pending equipment has no arrived work hold',()=>assert.equal(F.workGap({ref:'WC100',item:'FWF Trailer',received:0,card:emptyCard}),null));
check('Furniture and forklift lines are not guessed applicable',()=>{for(const item of ['Fridge','Forklift 5t','Tables'])assert.equal(F.workGap({item,received:1,card:emptyCard}),null);});
for(const money of ['zero','included','rate'])check('Explicit work evidence '+money+' is retained',()=>assert.equal(F.workGap({item:'FWF Trailer',received:1,card:{labour_per_piece:{lines:[{key:'install',money,rate:money==='rate'?145.74:null}]}}}),null));
check('POA remains unknown',()=>assert.equal(F.workGap({item:'TL2',received:1,card:{labour_per_piece:{lines:[{key:'install',money:'poa',rate:null}]}}}).value,null));
check('Input records remain unchanged',()=>{const data={...item},before=JSON.stringify(data);F.pee([data],[],source);assert.equal(JSON.stringify(data),before);});
// Exercise the exact installed adapter, including its early exits, rather than only the pure helper.
if(process.env.PAGE){
 const html=fs.readFileSync(process.env.PAGE,'utf8'),start=html.indexOf('function peeHireForecast979(){'),end=html.indexOf('\nconst cardBefore979=',start),code=html.slice(start,end);
 assert.ok(start>0&&end>start);
 for(const [name,a,lines] of [['missing asset',null,[]],['cancelled',{_cancelled:true},[]],['moved remainder',{rest_of:'X'},[]],['removed line',{key:'WC09'},[]]])check('Installed adapter '+name+' keeps finite totals',()=>{const ctx={assetOf:()=>a,chargeLines:()=>lines,heldMemo:(_k,fn)=>fn()};vm.createContext(ctx);vm.runInContext(code,ctx);const p=ctx.peeHireForecast979();for(const key of ['amount','actualAmount','remainingAmount'])assert.equal(p[key],0);});
 check('Installed adapter uses confirmed quantity',()=>{const ctx={assetOf:()=>({key:'WC09'}),chargeLines:()=>[{item:'Pee Panel',quantity:6}],heldMemo:(_k,fn)=>fn(),qtyOf:l=>l.quantity,receivedChargeQty1006:()=>2,PeeHire979:{forecast:(items,contracts)=>F.pee(items,contracts,source)},ONHIRE_ROWS:[]};vm.createContext(ctx);vm.runInContext(code,ctx);assert.equal(ctx.peeHireForecast979().actualAmount,1344.34);});
}
console.log(JSON.stringify({author:'Andrew Fisher',checks,failures:0}));
