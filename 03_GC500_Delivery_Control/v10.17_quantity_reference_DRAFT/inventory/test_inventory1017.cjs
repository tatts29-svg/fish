/* Author: Andrew Fisher. Receipt, movement and read-only request fixtures. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.PAGE,'utf8'),start=html.indexOf('function inventory(){'),end=html.indexOf('/* where else a number sits:',start),core=html.slice(start,end);
if(!core.includes('remaining1017'))throw Error('Patched candidate required');
const currentStart=html.indexOf('const CurrentStock996 = (() => {'),currentEnd=html.indexOf('\n})();',currentStart)+6;
const actualStock=html.slice(currentStart,currentEnd)+';globalThis.CurrentStock996=CurrentStock996;';
const checks=[];
function run(name,test){test();checks.push(name);}
function fixture(assets,readings={}){
 const c={todayIso:()=> '2026-10-14',allAssets:()=>assets,physicalCountAssets963:a=>({assets:a}),movedAway:()=>false,rowOff:()=>false,invTypeDisc:t=>t.split('|')[0],invTypeWord:t=>t.split('|')[1],
 chargeLines:a=>a.lines,qtyOf:l=>l.qty,invTypeKey:l=>'Trade|'+l.item,invOnSite:a=>!!a.on,itemRows:a=>a.lines.map(l=>({asked:l.item,qty_supplied:l.supplied})),restArrived:()=>0,
 toiletArrival962:(a,item,day,n)=>a.received?.[item]??n,invCountNums:()=>[],subOf:()=>[],itemNumbersOf:()=>null,unnumbered:()=>true,spareList:()=>[],INV_COATES:'Coates',
 DemobCollection996:{read:k=>readings[k]||null},assetOf:k=>assets.find(a=>a.key===k),inPlace782:k=>!!assets.find(a=>a.key===k)?.on,effectiveDates:a=>({in:a.date}),invTypeOf:a=>'Trade|'+a.lines[0]?.item,
 waterBarrierPlacement1017:a=>a.repeat?{item:'TL2'}:null};
 vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/inventory1017.js','utf8'),c);vm.runInContext(actualStock,c);vm.runInContext(core,c);return c;
}
const make=(key,qty,extra={})=>({key,lines:[{item:'VMS',qty}],...extra}),ref=(c,k)=>c.inventory().list[0].refs[k];
run('Partial receipt leaves only the undelivered units',()=>{const c=fixture([make('A',8,{on:true,lines:[{item:'VMS',qty:8,supplied:3}]})]);assert.equal(ref(c,'A').remaining1017,5);});
run('A confirmed move changes current stock without creating new demand',()=>{const c=fixture([make('A',8,{on:true})]);const old=c.CurrentStock996.quantity;c.CurrentStock996.quantity=(a,i,d,n)=>old(a,i,d,n)-1;assert.equal(ref(c,'A').on,7);assert.equal(ref(c,'A').received1017,8);assert.equal(ref(c,'A').remaining1017,0);});
run('Full typed collection retains the receipt when current light is off',()=>{const c=fixture([make('A',8)],{A:{recorded:true,issues:[],collected:[{type:'VMS',n:8}]}});assert.equal(ref(c,'A').on,0);assert.equal(ref(c,'A').received1017,8);assert.equal(ref(c,'A').remaining1017,0);assert.equal(c.Inventory1017.outstanding(c.inventory(),'*').length,0);});
run('Partial collection leaves current stock and receipt history distinct',()=>{const c=fixture([make('A',8,{on:true})],{A:{recorded:true,issues:[],collected:[{type:'VMS',n:3}]}});assert.equal(ref(c,'A').on,5);assert.equal(ref(c,'A').received1017,8);assert.equal(ref(c,'A').remaining1017,0);});
run('Unresolved collection does not manufacture receipt evidence',()=>{const c=fixture([make('A',8)],{A:{recorded:true,issues:['scope changed'],collected:[{type:'VMS',n:8}]}});assert.equal(ref(c,'A').received1017,0);assert.equal(ref(c,'A').remaining1017,8);});
run('Overdelivery at one reference never offsets another request',()=>{const c=fixture([make('A',1,{on:true,received:{VMS:3}}),make('B',2)]);assert.equal(c.inventory().list[0].remaining1017,2);});
run('Verified reinstatement excludes new supply but retains future actual receipt',()=>{const c=fixture([make('A',34,{repeat:true,on:true,lines:[{item:'TL2',qty:34}]})]);assert.equal(ref(c,'A').asked,0);assert.equal(ref(c,'A').on,34);assert.equal(ref(c,'A').received1017,34);assert.equal(ref(c,'A').remaining1017,0);});
run('Unrecorded planned work does not establish a receipt',()=>{const c=fixture([make('A',8)]);assert.equal(ref(c,'A').on,0);assert.equal(ref(c,'A').received1017,0);assert.equal(ref(c,'A').remaining1017,8);});
const request={ref:'R1',name:'Team',item:'FWF',quantity:1,received:0,sourceOnly:true,sourceRequest:{id:'R1',row:49,source:{file:'Programme',sheet:'Week'}}},typeOf=r=>({type:'Trade|'+r.item,disc:'Trade',item:r.item});
run('Source-only request has one ordered unit and current capacity date',()=>{const c=fixture([]),I={list:[]};c.Inventory1017.addRequests(I,{rows:[request],remaining:[{ref:'R1',date:'2026-10-16'}]},typeOf);const r=I.list[0].refs.R1;assert.equal(r.asked,1);assert.equal(r.on,0);assert.equal(r.remaining1017,1);assert.equal(r.due1017,'2026-10-16');});
run('Duplicate source projection is counted once',()=>{const c=fixture([]),I={list:[]},M={rows:[request,request]};c.Inventory1017.addRequests(I,M,typeOf);c.Inventory1017.addRequests(I,M,typeOf);assert.equal(I.list[0].asked,1);});
run('Linked native source requests are not added again',()=>{const c=fixture([]),I={list:[]};c.Inventory1017.addRequests(I,{rows:[{...request,sourceOnly:false,ref:'WC1'}]},typeOf);assert.equal(I.list.length,0);});
run('Cancelled or ambiguous requests absent from supplier model stay absent',()=>{const c=fixture([]),I={list:[]};c.Inventory1017.addRequests(I,{rows:[],issues:[{ref:'R1',reason:'Cancelled'}]},typeOf);assert.equal(I.list.length,0);});
run('Request projection never mutates supplier source',()=>{const c=fixture([]),M={rows:[request],remaining:[]},before=JSON.stringify(M);c.Inventory1017.addRequests({list:[]},M,typeOf);assert.equal(JSON.stringify(M),before);});
run('Offsite fully represented references are not revived by fallback',()=>{const c=fixture([make('A',8)],{A:{recorded:true,issues:[],collected:[{type:'VMS',n:8}]}});assert.equal(c.Inventory1017.outstanding(c.inventory(),'*').length,0);});
run('Supplier split dates preserve each quantity rather than reschedule',()=>{const c=fixture([]),p=c.Inventory1017.allocations('A','FWF',30,[{ref:'A',item:'FWF',remaining:24,date:'2026-10-15'},{ref:'A',item:'FWF',remaining:6,date:'2026-10-16'}],'2026-10-19');assert.equal(JSON.stringify(p),JSON.stringify([{date:'2026-10-15',quantity:24},{date:'2026-10-16',quantity:6}]));});
run('Split days are two delivery stops at one location, retaining all30 units',()=>{const c=fixture([make('A',30,{lines:[{item:'FWF',qty:30}],date:'2026-10-19'})]),I=c.inventory();I.supplierRemaining1017=[{ref:'A',item:'FWF',remaining:24,date:'2026-10-15'},{ref:'A',item:'FWF',remaining:6,date:'2026-10-16'}];const stops=c.Inventory1017.outstanding(I,'*');assert.equal(stops.length,2);assert.equal(c.Inventory1017.locationCount(stops),1);assert.equal(stops.flatMap(x=>x.allocations1017).reduce((n,x)=>n+x.quantity,0),30);});
run('Unmatched supplier quantity cannot date another owner’s delivery',()=>{const c=fixture([]),p=c.Inventory1017.allocations('A','FWF',3,[{ref:'A',item:'FWF',remaining:2,date:'2026-10-15'}],'2026-10-19');assert.equal(JSON.stringify(p),JSON.stringify([{date:'2026-10-19',quantity:3}]));});
run('Non-supplier dates remain the native delivery date',()=>{const c=fixture([]),p=c.Inventory1017.allocations('A','Building',1,[],'2026-10-19');assert.equal(p[0].date,'2026-10-19');});
console.log(JSON.stringify({author:'Andrew Fisher',checks:checks.length,passed:checks}));
