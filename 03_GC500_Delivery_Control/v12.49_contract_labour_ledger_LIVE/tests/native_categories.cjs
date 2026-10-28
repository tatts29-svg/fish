/* Author: Andrew Fisher. Extract actual source functions; all rows/prices below are synthetic. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
assert(process.env.BASE&&process.env.PAGE,'BASE and PAGE required');
const api=require('../contract_labour1249.js');
function extract(text,name){const start=text.indexOf('function '+name+'(');assert(start>=0,name+' present');let b=text.indexOf('{',start),depth=1,quote=null,escape=false,comment=null;for(let i=b+1;i<text.length;i++){const c=text[i],n=text[i+1];if(comment==='line'){if(c==='\n')comment=null;continue;}if(comment==='block'){if(c==='*'&&n==='/'){comment=null;i++;}continue;}if(quote){if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c===quote)quote=null;continue;}if(c==='/'&&n==='/'){comment='line';i++;continue;}if(c==='/'&&n==='*'){comment='block';i++;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;if(c==='}'&&!--depth)return text.slice(start,i+1);}throw Error('Unclosed '+name);}
const rows=[
 {rental_contract:'9961265',line:40,item:'LABOUR',item_type_code:2,branch_code:'STPS',sales_analysis_code:'STPS-INS',charge_line:false,quantity:1.5,rate_1:null,price:12.34,kind:'other',family:'other',description:'Synthetic reviewed labour',days:3},
 {rental_contract:'SYNTHETIC',line:1,item:'LABOUR',item_type_code:2,branch_code:'STPS',sales_analysis_code:'STPS-INS',charge_line:true,quantity:1,rate_1:11.11,price:11.11,kind:'other',family:'other',description:'Synthetic existing installation',days:1},
 {rental_contract:'SYNTHETIC',line:2,item:'PLANT',item_type_code:1,branch_code:'STPS',sales_analysis_code:'STPS-HIR',charge_line:false,quantity:2,rate_1:3.5,price:7,kind:'generator',family:'other',description:'Synthetic hire',days:1},
 {rental_contract:'SYNTHETIC',line:3,item:'LABOUR',item_type_code:2,branch_code:'KINP',sales_analysis_code:'KINP-INS',charge_line:false,quantity:1,rate_1:null,price:9.87,kind:'other',family:'other',description:'Synthetic outside reviewed scope',days:1},
 {rental_contract:'9961976',line:51,item:'LABOUR',item_type_code:2,branch_code:'NVAC',sales_analysis_code:'NVAC-INS',charge_line:false,quantity:1,rate_1:null,price:17.29,kind:'generator',family:'generator',description:'Synthetic generator installation',days:4}
];
const frozen=JSON.stringify(rows);let count=0;const check=(name,fn)=>{fn();count++;};
const results={};for(const [tag,p]of [['base',process.env.BASE],['candidate',process.env.PAGE]]){
 const page=fs.readFileSync(p,'utf8'),context={ONHIRE_ROWS:rows,ContractLabour1249:api,PLATE_OF_KIND:{generator:'Generators'},dollarSplit:xs=>xs.map(Math.round),contractCharge:r=>({amount:r.price,days:r.days,how:'per day',basis:'Synthetic source'}),contractBillingQuantity1010:r=>r.quantity,generatorBranch1004:r=>r.branch_code,finance928ContractOwner:()=>({rehire:false})};
 vm.createContext(context);for(const name of ['contractChargeCategory1224','contractFigures','pl752Rows','tradeCharges'])vm.runInContext(extract(page,name),context);
 results[tag]=JSON.parse(JSON.stringify({figures:context.contractFigures(rows),branches:context.pl752Rows(),categories:rows.map(r=>context.contractChargeCategory1224(r)),trades:[...context.tradeCharges()]}));
}
const b=results.base,a=results.candidate;
check('source untouched',()=>assert.equal(JSON.stringify(rows),frozen));
check('total charge unchanged',()=>assert.equal(a.figures.charge,b.figures.charge));
check('reviewed labour enters Installation',()=>assert.deepEqual(a.categories,['installation','installation',null,null,'installation']));
check('source installation amount counted once',()=>assert.equal(a.figures.installation.charge,40.74));
check('source labour removed from equipment subtotal only',()=>assert.equal(a.figures.plant.charge,16.87));
check('line count preserved',()=>assert.equal(a.figures.lines,b.figures.lines));
check('unknown count preserved',()=>assert.equal(a.figures.unknown,b.figures.unknown));
check('contract total preserved',()=>assert.deepEqual(a.figures.contracts,b.figures.contracts));
check('branch totals preserved',()=>assert.deepEqual(a.branches.map(x=>[x.code,x.total]),b.branches.map(x=>[x.code,x.total])));
check('branch installation carries same correction',()=>assert.equal(a.branches.find(x=>x.code==='STPS').installation1224,23.45));
check('unrelated branch exact',()=>assert.deepEqual(a.branches.find(x=>x.code==='KINP'),b.branches.find(x=>x.code==='KINP')));
check('labour summary has no invented hire period',()=>{const r=a.figures.installation.items.find(x=>x.contract==='9961265');assert.equal(r.how,'charge line');assert.equal(r.days,null);assert.equal(r.qty,1.5);});
check('native equipment summary excludes reviewed labour only',()=>{assert.equal(b.trades[0][1].charge,24.29);assert.equal(a.trades[0][1].charge,7);});
check('native equipment summary retains hire source count',()=>{assert.equal(b.trades[0][1].lines,2);assert.equal(a.trades[0][1].lines,1);});
check('job-level installation remains in contract total',()=>assert.equal(a.figures.installation.charge+a.figures.plant.charge,a.figures.charge));
console.log(count+' actual native category assertions PASS');
