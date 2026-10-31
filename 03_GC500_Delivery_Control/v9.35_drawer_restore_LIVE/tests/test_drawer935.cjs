/* Author: Andrew Fisher. The native non-VMS lookup returns null, not an empty array. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const file=process.env.PAGE||'/workspace/private-bughunt935/candidate935.html',s=fs.readFileSync(file,'utf8'),start=s.indexOf('function assetSummary('),end=s.indexOf('function signature(',start),source=s.slice(start,end);let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
function run(value,missing=false){const c={Units925:{owner:c=>c==='Coates'?'coates':'prem-air-hire',company:()=> 'PremAir Hire'},vms913Of:b=>b.facts};if(!missing)c.vms913BoardsOn=()=>value;vm.createContext(c);vm.runInContext(source,c);return c.assetSummary({discipline:'Toilets & amenities'},['1268858','1311146'],'KINP');}
for(const value of [null,undefined,[]])test('normal header survives '+String(value),()=>assert.equal(run(value),'Toilets & amenities · KINP · asset 1268858, 1311146'));
test('missing optional VMS helper keeps the native header',()=>assert.equal(run(null,true),'Toilets & amenities · KINP · asset 1268858, 1311146'));
test('VMS preserves both effective physical identities and supplier',()=>assert.equal(run([{facts:{co:'Coates',fleet:'1211404'}},{facts:{co:'PremAir Hire',fleet:'120T'}}]),'Coates 1211404 · SUB-HIRED — PremAir Hire 120T'));
test('null result reproduces the previous failure before normalization',()=>{const old=source.replace('(vms913BoardsOn(a)||[])','vms913BoardsOn(a)'),c={vms913BoardsOn:()=>null};vm.createContext(c);vm.runInContext(old,c);assert.throws(()=>c.assetSummary({discipline:'Building'},['123'],'BR'),/length/);});
console.log(count+' checks passed');
const groups=require('../drawer935.js');
test('legacy/canonical presentation groups merge only for one unambiguous physical asset',()=>assert.deepEqual(groups.aliases([{id:'a',assetNo:'12',physical:true},{id:'b',assetNo:'13',physical:true}]),[{id:'a',legacy:'12'},{id:'b',legacy:'13'}]));
test('history or cross-owner numeric collisions never consolidate photo homes',()=>assert.deepEqual(groups.aliases([{id:'a',assetNo:'12',physical:true},{id:'old',assetNo:'12',physical:false}]),[]));
test('unnumbered and unverified identities keep their existing group',()=>assert.deepEqual(groups.aliases([{id:'slot',assetNo:'',physical:true},{id:'draft',assetNo:'15',physical:false}]),[]));
console.log(count+' total checks passed');
