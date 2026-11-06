/* Author: Andrew Fisher. Generator charging boundaries, allocation and recalculation; no network or writes. */
'use strict';
const assert=require('assert'),F=require('../generator_finance1004.js');
let checks=0;const eq=(a,b,label)=>{assert.deepStrictEqual(a,b,label);checks++;};
const env={lineRate:()=>null,weeklyRate:()=>null,rehire:()=>false};
const contract=(line=1,more={})=>({rental_contract:'9961976',line,quantity:1,kind:'generator',family:'generator',rate_1:null,rate_type:'W',...more});
const input=(more={})=>({id:'ref:GN01',ref:'GN01',refLabel:'GN01',item:'60kva',qty:1,branch:'NVAC',assetNumbers:[],actualIsConfirmed:true,actualQuantity:1,deliveredDate:'2026-09-28',plannedDate:'2026-09-28',contractRows:[contract()],contractDeliveries:[],issues:[],...more});
for(const [date,standby,event] of [['2026-09-28',25,3],['2026-10-01',22,3],['2026-10-07',16,3],['2026-10-12',11,3],['2026-10-20',3,3],['2026-10-22',1,3],['2026-10-23',0,3],['2026-10-24',0,2],['2026-10-25',0,1],['2026-10-26',0,0]]){const w=F.windowOf(date);eq(w.standdownDays,standby,date);eq(w.eventDays,event,date);eq(w.offhire,'2026-10-25');}
for(const d of [null,'','2026-02-30','2026-10-12T00:00:00Z','banana'])eq(F.windowOf(d).equivalentDays,null);
eq(F.rate(input({item:'200kva'}),contract(),env).standdownRate,182.2791);
eq(F.rate(input({item:'40kva'}),contract(),env).standdownRate,79.3512);
let m=F.project([input()],env);eq(m.actual,2991.52);eq(m.remaining,0);eq(m.forecast,2991.52);eq(m.contracts.get('9961976:1').amount,2991.52);eq(m.byBranch[0].actual,m.actual);
m=F.project([input({actualIsConfirmed:false,actualQuantity:0,deliveredDate:null,plannedDate:'2026-10-20'})],env);eq(m.actual,0);eq(m.remaining,868.51);eq(m.forecast,868.51);eq(m.contracts.get('9961976:1').amount,0);
m=F.project([input({qty:2,actualQuantity:2,item:'200kva & cables',deliveredDate:'2026-10-12',contractRows:[contract(42),contract(43)]})],env);eq(m.rows.length,1);eq(m.rows[0].qty,2);eq(m.actual,6197.48);eq(m.standdown,4010.14);eq(F.cents(m.race+m.standdown),m.forecast);eq(m.contracts.get('9961976:42').amount,3098.74);eq(m.actual,F.cents([...m.contracts.values()].reduce((n,r)=>n+r.amount,0)));
m=F.project([input({qty:2,actualQuantity:1,contractRows:[contract(42),contract(43)],contractDeliveries:[{id:'9961976:42',actualIsConfirmed:true,deliveredDate:'2026-10-12'},{id:'9961976:43',actualIsConfirmed:false}],plannedDate:'2026-10-20'})],env);eq(m.rows.length,2);eq(m.actual,1640.51);eq(m.remaining,868.51);eq(m.forecast,F.cents(m.actual+m.remaining));
// Two confirmed units delivered on different days retain their own dates and confirmed numbers.
m=F.project([input({qty:2,actualQuantity:2,assetNumbers:['1111111','2222222'],contractRows:[contract(42,{asset_no:'1111111'}),contract(43,{asset_no:'2222222'})],contractDeliveries:[{id:'9961976:42',actualIsConfirmed:true,deliveredDate:'2026-10-12'},{id:'9961976:43',actualIsConfirmed:true,deliveredDate:'2026-10-20'}]})],env);eq(m.rows.length,2);eq(m.actual,2509.02);eq(m.rows[1].deliveredDate,'2026-10-20');eq(m.rows[1].assetNumbers,['2222222']);
// Native quantity disagreement stays a visible hold, never two full-ref charges.
m=F.project([input({qty:2})],env);eq(m.actual,0);eq(m.unpriced.length,1);eq(m.contracts.get('9961976:1').amount,null);
m=F.project([input({deliveredDate:null})],env);eq(m.rows[0].actual,null);eq(m.unpriced.length,1);
m=F.project([input({cancelled:true})],env);eq(m.rows.length,0);eq(m.contracts.get('9961976:1').amount,0);
// Larger supplied machines retain requested size; missing sizes use next lower published card size.
eq(F.rate(input({item:'350kva'}),contract(),env).dailyRate,471.7812);eq(F.rate(input({item:'300kva'}),contract(),env).dailyRate,418.1697);eq(F.rate(input({item:'45kva'}),contract(1,{what:'60kVA'}),env).dailyRate,175.8416);
eq(F.project([input({item:'40kva',deliveredDate:'2026-10-22'})],env).actual,553.67);
// Stored line override was always whole event, not per day; retain its meaning.
m=F.project([input()],{...env,lineRate:()=>600});eq(m.rows[0].dailyRate,200);eq(m.actual,3100);
m=F.project([input()],{...env,weeklyRate:()=>1400});eq(m.rows[0].dailyRate,200);eq(m.actual,3100);
m=F.project([input({contractRows:[contract(1,{rate_1:900})]})],env);eq(m.rows[0].dailyRate,300);eq(m.actual,4650);
m=F.project([input({contractRows:[contract(1,{rate_1:300,rate_type:'D'})]})],env);eq(m.rows[0].dailyRate,300);eq(m.actual,4650);
m=F.project([input({actualIsConfirmed:false,actualQuantity:0,branch:'MEAD'})],{...env,rehire:()=>true});eq(m.byBranch[0].branch,'MEAD');eq(m.hireRemaining,0);eq(m.rehireRemaining,2991.52);
eq(F.rate(input({item:'450kva'}),contract(),env).dailyRate,null);eq(F.rate(input({item:'650kva'}),contract(),env).dailyRate,null);
const original=input(),snapshot=JSON.stringify(original);F.project([original],env);eq(JSON.stringify(original),snapshot);eq(m.invoiceMonth,'2026-10');
console.log(JSON.stringify({author:'Andrew Fisher',checks,pass:true}));
