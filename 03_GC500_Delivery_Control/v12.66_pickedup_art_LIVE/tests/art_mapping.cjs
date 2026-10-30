/* Author: Andrew Fisher. A reference description must not assign unrelated artwork. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const box={};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../pickedup1266_src.js'),'utf8'),box);
const cases=[
 [null,false],
 [{icon:'tower',item:'Light Tower'},true],
 [{icon:'tower',item:'LIGHT-TOWERS'},true],
 [{icon:'tower',item:'  Lighting   tower '},true],
 [{icon:'tower',item:'Tower lights'},true],
 [{icon:'tower',item:'Lighting cable',what:'Light towers and cable'},false],
 [{icon:'tower',item:'Equipment',what:'Light towers'},false],
 [{icon:'tower',item:'Light Tower cable'},false],
 [{icon:'tower',item:'Light tower lamp'},false],
 [{icon:'tower',what:'Light tower'},false],
 [{icon:'gen',item:'Light Tower'},false],
 [{icon:'other',item:'Light Tower'},false],
 [{icon:'tower',item:'Generator'},false]
];
for(const [card,want] of cases){
 const before=JSON.stringify(card),html=box.pickedupArt1266(card);
 assert.equal(Boolean(html),want);
 assert.equal(JSON.stringify(card),before,'artwork lookup must not mutate a card');
 if(want){assert(html.includes('alt="" aria-hidden="true"'));assert(html.includes('data:image/webp;base64,'));}
}
console.log(JSON.stringify({pass:true,mappingCases:cases.length}));
