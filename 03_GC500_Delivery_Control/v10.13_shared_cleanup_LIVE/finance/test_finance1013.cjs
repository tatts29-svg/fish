/* Author: Andrew Fisher. Current-scope allocation and source integrity controls. */
'use strict';const assert=require('node:assert/strict'),F=require('./finance1013.js');let count=0;const test=(name,fn)=>{fn();count++;};
const rows=[],scopes=[];
for(const b of F.revisions){rows.push({rental_contract:b.contract,line:b.retiredLine,kind:'building',quantity:1,register_type:b.item,rate_1:1426.07,status_as_written:'Pending',start_date:null,asset_no:b.asset,asset_no_is_plant_number:true,description:b.retiredRef+' Portable Building'});rows.push({rental_contract:b.contract,line:b.currentLine,kind:'building',quantity:1,register_type:b.item,rate_1:1426.07,status_as_written:'Pending',start_date:null,asset_no:b.ref==='P65'?'1189412':null,asset_no_is_plant_number:b.ref==='P65',description:b.ref+' Portable Building'});scopes.push({ref:b.ref,item:b.item,quantity:1,arrived:1,branch:'KINP',units:[{physical:true,item:b.item,owner:'coates',assetNo:b.asset}]});}
const copy=x=>structuredClone(x),baseJSON=JSON.stringify({rows,scopes});
test('exact two reconciliations',()=>assert.equal(F.replacements(rows,scopes).size,4));
for(const b of F.revisions){test(b.ref+' retains current source line',()=>{const d=F.replacements(rows,scopes).get(b.contract+'|'+b.currentLine);assert.equal(d.actualAmount,1426.07);assert.equal(d.remainingAmount,0);assert.equal(d.state,'current-scope-confirmed');});test(b.ref+' excludes old physical source once',()=>{const d=F.replacements(rows,scopes).get(b.contract+'|'+b.retiredLine);assert.equal(d.actualAmount,0);assert.equal(d.remainingAmount,0);assert.equal(d.state,'duplicate-removed');});}
test('raw source and current records unchanged',()=>{F.replacements(rows,scopes);assert.equal(JSON.stringify({rows,scopes}),baseJSON);});
for(const [name,edit]of [
 ['partial receipt',s=>s.arrived=0],['changed scope quantity',s=>s.quantity=2],['cancelled scope',s=>s.cancelled=true],['relocated scope',s=>s.relocation=true],['unknown physical identity',s=>s.units=[]],['different asset',s=>s.units[0].assetNo='1234567'],['different owner',s=>s.units[0].owner='event-portables'],['two physical units',s=>s.units.push({...s.units[0],assetNo:'1327219'})]
])test(name+' restores earlier allocation',()=>{const ss=copy(scopes);edit(ss[0]);assert.equal(F.replacements(rows,ss).size,2);});
test('another active ref with same number blocks transfer',()=>{const ss=copy(scopes);ss.push({...ss[0],ref:'P99'});assert.equal(F.replacements(rows,ss).size,2);});
test('retired reference becoming active blocks transfer',()=>{const ss=copy(scopes);ss.push({ref:'P47',cancelled:false,units:[]});assert.equal(F.replacements(rows,ss).size,2);});
for(const [name,edit]of [['new delivered hire period',r=>r.start_date='2026-10-14'],['changed source type',r=>r.register_type='Building 12m'],['new contract scope',r=>r.quantity=2],['missing price',r=>r.rate_1=null],['unknown source status',r=>r.status_as_written='Returned']])test(name+' not silently removed',()=>{const rr=copy(rows);edit(rr[0]);assert.equal(F.replacements(rr,scopes).size,2);});
test('source rates remain live',()=>{const rr=copy(rows);rr[1].rate_1=1234.56;assert.equal(F.replacements(rr,scopes).get('9968862|110').actualAmount,1234.56);});
const b=F.bindings[0],cr={rental_contract:b.contract,line:b.line,...b.source,rate_1:1428},cs={ref:b.ref,item:b.item,quantity:1,arrived:1,units:[{physical:true,item:b.item,owner:b.owner,assetNo:b.asset}]};
test('one existing container source link',()=>assert.equal(F.links([cr],[cs]).length,1));
for(const [name,edit]of [['changed supplier',r=>r.supplier_sub_rental='OTHER'],['wrong size',r=>r.description='Container 3m'],['two containers',r=>r.quantity=2],['new branch',r=>r.branch_code='NVAC']])test(name+' keeps allocation held',()=>{const r=copy(cr);edit(r);assert.equal(F.links([r],[cs]).length,0);});
test('source rates not hardcoded',()=>assert.equal(F.links([{...cr,rate_1:1555}],[cs])[0].row.rate_1,1555));
test('duplicate source line held',()=>assert.equal(F.links([cr,copy(cr)],[cs]).length,0));
test('container changed number held',()=>{const s=copy(cs);s.units[0].assetNo='920585';assert.equal(F.links([cr],[s]).length,0);});
test('container shared physical identity held',()=>assert.equal(F.links([cr],[cs,{...copy(cs),ref:'T0999'}]).length,0));
test('container no arrival held',()=>assert.equal(F.links([cr],[{...cs,arrived:0}]).length,0));
test('included transport source word',()=>assert.equal(F.includedTransport({transport:{cost:'Included',charge:null,state:'sheet says Included'}}),true));
test('POA not included',()=>assert.equal(F.includedTransport({transport:{cost:'POA',charge:null,state:'POA'}}),false));
test('priced transport not discarded',()=>assert.equal(F.includedTransport({transport:{cost:'Included',charge:50,state:'sheet says Included'}}),false));
test('4 fridges source precision',()=>assert.equal(F.cents(46.8350064*4),187.34));
const fs={ref:'T0265',item:'Fridge',branch:'KINP',quantity:4,arrived:4,units:['1318501','1260164','1283996','1311992'].map(assetNo=>({physical:true,owner:'coates',item:'Fridge',assetNo}))},price={unit:46.8350064,basis:'source card'};
test('uncovered4 exact card charge',()=>{const p=F.fridgeSupplement(fs,[],[],price);assert.equal(p.amount,187.34);assert.equal(p.actualAmount,187.34);assert.equal(p.remainingAmount,0);});
test('one future contract absorbs one unit',()=>{const r={rental_contract:'1234567',line:1,quantity:1};const p=F.fridgeSupplement(fs,[r],[r],price);assert.equal(p.quantity,3);assert.equal(p.amount,140.51);});
test('complete future contract absorbs supplement',()=>{const r={rental_contract:'1234567',line:1,quantity:4};const p=F.fridgeSupplement(fs,[r],[r],price);assert.equal(p.amount,0);assert.equal(p.state,'covered by source contract');});
test('unknown unallocated fridge contract holds extra',()=>assert.equal(F.fridgeSupplement(fs,[{rental_contract:'1234567',line:2,description:'Refrigerator',register_type:'Fridge Lge',quantity:4}],[],price).state,'existing fridge coverage needs allocation'));
test('another named reference does not absorb4',()=>assert.equal(F.fridgeSupplement(fs,[{rental_contract:'1234567',line:2,description:'P01 Refrigerator',register_type:'Fridge Lge',quantity:1}],[],price).amount,187.34));
test('overlapping coverage held',()=>assert.equal(F.fridgeSupplement(fs,[],[{quantity:5}],price).state,'overlapping contract coverage needs review'));
test('recorded rate changes once',()=>assert.equal(F.fridgeSupplement(fs,[],[],{unit:50,basis:'typed'}).amount,200));
test('two received only actual subset',()=>{const p=F.fridgeSupplement({...fs,arrived:2},[],[],price);assert.equal(p.actualAmount,93.67);assert.equal(p.remainingAmount,93.67);});
test('unconfirmed arrival remains forecast',()=>{const p=F.fridgeSupplement({...fs,arrived:0},[],[],price);assert.equal(p.actualAmount,0);assert.equal(p.remainingAmount,187.34);});
test('new unsupported fifth unit held',()=>assert.equal(F.fridgeSupplement({...fs,quantity:5},[],[],price).amount,0));
test('duplicate fridge identity held',()=>{const s=copy(fs);s.units[1].assetNo=s.units[0].assetNo;assert.equal(F.fridgeSupplement(s,[],[],price).amount,0);});
test('unknown branch is held',()=>assert.equal(F.fridgeSupplement({...fs,branch:null},[],[],price).state,'costing branch needs review'));
test('not free when rate missing',()=>assert.equal(F.fridgeSupplement(fs,[],[],{unit:null}).state,'rate or receipt needs review'));
const source=[{rental_contract:'9968862',line:96,description:'P46 Refrigerator - Large',register_type:'Fridge Lge',quantity:1,rate_1:46.84,asset_no:null,asset_no_is_plant_number:false},{rental_contract:'9968862',line:102,description:'P51 Refrigerator - Large',quantity:1,rate_1:46.84,asset_no:null,asset_no_is_plant_number:false}];
test('source adds exact one new fridge line',()=>{const p=F.sourceRows(source);assert.equal(p.length,3);assert.equal(p.find(r=>r.line===132).asset_no,'1272751');assert.equal(p.find(r=>r.line===132).rate_1,46.84);assert.equal(p.find(r=>r.line===96).asset_no,'1328959');assert.equal(p.find(r=>r.line===102).asset_no,'1328957');});
test('source projected idempotently',()=>assert.deepEqual(F.sourceRows(F.sourceRows(source)),F.sourceRows(source)));
test('newer source numbers retained',()=>{const s=copy(source);s[0].asset_no='OTHER';s[0].asset_no_is_plant_number=true;assert.equal(F.sourceRows(s)[0].asset_no,'OTHER');});
test('new source row never added twice',()=>assert.equal(F.sourceRows([...source,{rental_contract:'9968862',line:132,asset_no:'NEW'}]).length,3));
test('original source metadata unchanged',()=>{const old=JSON.stringify(source);F.sourceRows(source);assert.equal(JSON.stringify(source),old);});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:count}));
