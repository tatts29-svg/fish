// Author: Andrew Fisher. Quantity, overrides, source preservation and customer/supplier separation.
'use strict';const assert=require('assert/strict'),W=require('./workforce1010');let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const person={id:W.GROUP_ID,kind:'person',person:W.GROUP,type:'External',pay_rate:88.49,branch:'STPS',usable:true};
const shifts=W.DATES.map((date,i)=>({id:'W-L-fencing-crew-6-'+date.replace(/-/g,''),kind:'labour',person:W.GROUP,crew_count:6,date,roster_basis:'forecast',start:i?null:'06:00',finish:i?null:'18:00',hours:i?null:12,usable:!i}));
const source=[person,...shifts],before=JSON.stringify(source),rows=W.expand(source);
eq(JSON.stringify(source),before);eq(rows.filter(r=>r.kind==='person').length,6);eq(rows.filter(r=>r.kind==='labour').length,18);eq(rows.some(r=>r.person===W.GROUP),false);eq(rows.every(r=>r._k===r.id),true);
eq(rows.filter(r=>r.kind==='person').every(r=>r.pay_rate===142&&r.workforce1010.sourcePayRate===88.49&&r.branch==='STPS'),true);
eq(rows.filter(r=>r.date===W.DATES[0]).reduce((n,r)=>n+W.supplierHours(r,12)*142,0),10224);
eq(rows.filter(r=>r.date!==W.DATES[0]&&r.kind==='labour').every(r=>r.hours===null),true);
for(const [worked,break_min,want] of [[2,null,4],[12,null,12],[12,30,11.5],[0,null,0],[null,null,null]])eq(W.supplierHours({kind:'labour',person:'Fencing 1',date:W.DATES[0],break_min},worked),want);
const override={...rows.find(r=>r.kind==='labour'),hours:8,start:'07:00',finish:'15:00'};
const pOverride={...rows.find(r=>r.kind==='person'),pay_rate:150};const changed=W.expand([...source,override,pOverride]);
eq(changed.filter(r=>r.id===override.id).length,1);eq(changed.find(r=>r.id===override.id).hours,8);eq(changed.find(r=>r.id===pOverride.id).pay_rate,150);
eq(W.expand([...source,override],id=>id===override.id).find(r=>r.id===override.id)?.hours,8); // caller native list already honours its own tombstones
const deleted=W.expand(source,id=>id===W.shiftId('Fencing 1',W.DATES[0]));eq(deleted.filter(r=>r.date===W.DATES[0]).length,5);
eq(W.expand(source,id=>id===W.personId('Fencing 1')).filter(r=>r.person==='Fencing 1').length,0);
const night={id:'night',kind:'labour',person:'Night person — TBC',date:W.DATES[0],start:null,finish:null,hours:null};
const kyle={id:'kyle',kind:'labour',person:'Kyle Gover',date:W.DATES[0],note:'Night shift confirmed by Andrew Fisher, 13 Oct 2026. Start, finish and paid hours have not been supplied.'};
eq(W.expand([night,kyle]).map(r=>r.person),['Kyle Gover']);eq(W.expand([night,{...kyle,note:''}]).length,2);eq(W.expand([{...night,start:'18:00',finish:'06:00'},kyle]).length,2);eq(W.expand([night,{...kyle,date:W.DATES[1]}]).length,2);
eq(W.overlaps(W.DATES[0],[{id:'green',date:W.DATES[0],labour_hours:72,cost:10224}]),['green']);eq(W.overlaps(W.DATES[0],[{id:'green',date:'2026-10-22',labour_hours:72,cost:10224}]),[]);eq(W.overlaps(W.DATES[0],[{id:'green',date:W.DATES[0],labour_hours:72,cost:10224,usable:false}]),[]);
eq(W.overlaps(W.DATES[0],[{id:'red',date:W.DATES[0],labour_hours:12,paid_total:1704}]),['red']);
eq(W.overlaps(W.DATES[0],[{id:'unpriced',date:W.DATES[0],labour_hours:12,cost:null,paid_total:null}]),[]);
const scope={key:'fence',rate:88.49,days:W.DATES.map((date,i)=>({date,people:6,per:[10,11,11.5][i],hours:[60,66,69][i]}))};
const units=W.scopePeople(scope);eq(units.length,6);eq(units.reduce((sum,r)=>sum+r.hours,0),195);eq(units.reduce((sum,r)=>sum+r.hours*scope.rate,0).toFixed(2),'17255.55');eq(scope.rate,88.49);eq(units[0].hours,32.5);
console.log(JSON.stringify({author:'Andrew Fisher',checks,pass:true}));
