/* Author: Andrew Fisher. Current contents identity, exact matching and history exclusion. */
'use strict';
const assert=require('node:assert/strict'),S=require('./search1016.js');
let count=0;const ck=(name,fn)=>{fn();count++;};
const A={key:'P1',name:'Office',locations:['Current area'],accessories:[{_accId:'a1',asset_no:'00123',type:'Fridge',qty:1}],_accessoriesTakenOff:[{_accId:'old',asset_no:'99999',type:'Fridge'}]};
ck('Current number is a contents result',()=>{const r=S.extend([], [A])[0];assert.equal(r.no,'00123');assert.equal(r.key,'P1');assert.equal(r.accessoryId1016,'a1');});
ck('Removed history never indexed',()=>assert.equal(S.extend([],[A]).some(r=>r.no==='99999'),false));
ck('Leading zero distinguishes numbers',()=>assert.notEqual(S.normal('00123'),S.normal('123')));
ck('Normalisation is whitespace and case only',()=>assert.equal(S.normal(' ab 001 '),'AB001'));
ck('Same reference physical number is not doubled',()=>assert.equal(S.extend([{kind:'unit',key:'P1',no:'00123',unitId1006:'unit'}],[A]).length,1));
ck('Duplicate accessory source row counted once in finder',()=>assert.equal(S.extend([],[{...A,accessories:[A.accessories[0],{...A.accessories[0],_accId:'a2'}]}]).length,1));
ck('Different current references remain visible',()=>assert.equal(S.extend([],[A,{...A,key:'P2'}]).length,2));
ck('Cancelled and moved references excluded',()=>assert.equal(S.extend([],[{...A,_cancelled:true},{...A,_movedTo:'P2'}]).length,0));
ck('Inactive unnumbered and no-ID entries excluded',()=>assert.equal(S.extend([],[{...A,accessories:[{...A.accessories[0],active:false},{_accId:'blank'},{asset_no:'00123'}]}]).length,0));
ck('Exact contents match leads without duplicate parent result',()=>{const unit=S.extend([],[A])[0],asset={kind:'asset',key:'P1'},doc={kind:'doc',key:'doc'};assert.deepEqual(S.exact([asset,doc,unit],'00123'),[unit,doc]);});
ck('Other reference physical matches retained',()=>{const a=S.extend([],[A])[0],other={kind:'unit',key:'P2',no:'00123',unitId1006:'p2'};assert.deepEqual(S.exact([other,a],'00123'),[a,other]);});
ck('Description matching keeps original order',()=>{const rows=[{kind:'asset',key:'P1'},...S.extend([],[A])];assert.deepEqual(S.exact(rows,'Fridge'),rows);});
ck('Pure projection does not edit source or original result list',()=>{const base=[{kind:'doc',key:'d'}],before=JSON.stringify([base,A]);S.extend(base,[A]);assert.equal(JSON.stringify([base,A]),before);});
console.log(JSON.stringify({author:'Andrew Fisher',checks:count,passed:count}));
