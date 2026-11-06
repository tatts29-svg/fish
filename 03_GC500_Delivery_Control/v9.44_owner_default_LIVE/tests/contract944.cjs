/* Author: Andrew Fisher. Source-backed contract ownership boundary checks. */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),Ownership944=require('../ownership944.js');
assert(process.env.PAGE,'Provide the exact patched candidate');
const html=fs.readFileSync(process.env.PAGE,'utf8'),start=html.indexOf('function finance928Owner('),end=html.indexOf('function finance928ContractOwner(',start);
assert(start>=0&&end>start,'Native contract ownership functions exist');
const owner=Function('Ownership944',html.slice(start,end)+';return finance928Owner;')(Ownership944);
const cases=[
 {row:{subhired:true},wanted:'coates',rehire:false},
 {row:{subhired:true,supplier_sub_rental:'Supplier not named'},wanted:'coates',rehire:false},
 {row:{subhired:true,supplier_sub_rental:'PRE808'},wanted:'PRE808',rehire:true},
 {row:{subhired_machine:true},wanted:'coates',rehire:false},
 {row:{subhired_machine:true,supplier_sub_rental:'Named company'},wanted:'Named company',rehire:true},
 {row:{asset_no:'TEST1',match:{key:'X01'}},units:[{ref:'X01',assetNo:'TEST1',physical:true,owner:'event-portables'}],wanted:'event-portables',rehire:true},
 {row:{asset_no:'1234567',asset_no_is_plant_number:true},wanted:'coates',rehire:false}
];
for(const c of cases){const actual=owner(c.row,c.units||[]);assert.equal(actual.owner,c.wanted);assert.equal(actual.rehire,c.rehire);}
console.log(JSON.stringify({author:'Andrew Fisher',passed:true,contractOwnershipChecks:cases.length}));
