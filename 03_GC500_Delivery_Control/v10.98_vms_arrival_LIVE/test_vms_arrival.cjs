/* Author: Andrew Fisher. Pure source tests: no service writes or private operational data. */
'use strict';
const assert=require('node:assert/strict');
const A=require('./vms_arrival1098_src.js');
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
const who='Andrew Fisher via Codex',now='2026-10-21T06:00:00.000Z';
const arrived={state:'on site',effective_date:'2026-10-21',recorded_at:now,by:who};
const base={key:'board-a',name:'Board A',on:false,done:false,due:'2026-10-22',delivery:null};
const read=(rows,day='2026-10-21')=>A.project(rows,day,'2026-10-25');
const patch=A.prepare({inPlace:true,arrival1098:arrived},who,now,{});
test('date-only arrival does not claim a time of installation',()=>{assert.equal(patch.arrival1098.effective_date,'2026-10-21');assert.equal(patch.arrival1098.recorded_at,now);});
test('installed board arrives once and does not become Finished',()=>{const r=read([{...base,record:patch}]);assert.equal(r.total,1);assert.equal(r.on,1);assert.equal(r.installed,1);assert.equal(r.done,0);assert.equal(r.left,1);assert.equal(r.toCome.length,0);});
test('duplicate register input does not double count',()=>assert.equal(read([{...base,record:patch},{...base,record:patch}]).on,1));
test('history before effective day excludes the later arrival',()=>assert.equal(read([{...base,record:patch}],'2026-10-20').on,0));
test('invalid date and future effective date fail without throwing',()=>{for(const date of ['2026-13-01','2026-02-30','bad','2026-10-22'])assert.equal(A.prepare({inPlace:true,arrival1098:{...arrived,effective_date:date}},who,now,{}),null);});
test('precise coordinates remain precise',()=>{const p=A.prepare({lat:-27.123456789123,lon:153.987654321987},who,now,{});assert.equal(p.lat,-27.123456789123);assert.equal(p.lon,153.987654321987);});
test('placement untick keeps confirmed arrival and clears installed',()=>{const p=A.prepare({inPlace:false},who,'2026-10-22T06:00:00.000Z',patch),r={...patch,...p};assert.equal(read([{...base,record:r}],'2026-10-22').on,1);assert.equal(read([{...base,record:r}],'2026-10-22').installed,0);assert.equal(read([{...base,record:r}],'2026-10-21').installed,1);assert.equal(r.events1098.length,2);});
test('placement untick does not remove a delivery-confirmed board',()=>{const p=A.prepare({inPlace:false},who,now,{});const r=read([{...base,delivery:'existing-ref',on:true,done:true,record:p}]);assert.equal(r.on,1);assert.equal(r.done,1);assert.equal(r.installed,0);});
test('explicit departure clears current on-site and preserves earlier history',()=>{const off={state:'off site',effective_date:'2026-10-22',recorded_at:'2026-10-22T06:00:00.000Z',by:who};const r={...patch,...A.prepare({inPlace:false,arrival1098:off},who,off.recorded_at,patch)};assert.equal(read([{...base,record:r}],'2026-10-22').on,0);assert.equal(read([{...base,record:r}],'2026-10-21').on,1);});
test('all former phase metrics retain their no-evidence meanings',()=>{
 const cases=[['complete',true,true],['on site',true,false],['overdue',false,false],['no record',false,false],['next',false,false],['later',false,false],['next',true,false]];
 for(const[phase,on,done]of cases){const c=read([{...base,delivery:'existing-ref',phase,on,done,due:'2026-10-20'}]);assert.equal(c.on,+on);assert.equal(c.done,+(on&&done));assert.equal(c.due,+['complete','on site','overdue','no record'].includes(phase));assert.equal(c.overdue,+(phase==='overdue'));assert.equal(c.norecord,+(phase==='no record'));assert.equal(c.next,+(phase==='next'));assert.equal(c.nextNotOn,+(phase==='next'&&!on));}
});
test('other pending board and Finished facts are unchanged',()=>{const c=read([{...base,record:patch},{...base,key:'board-b',name:'Board B'},{...base,key:'board-c',name:'Board C',delivery:'existing-ref',on:true,done:true,phase:'complete'}]);assert.equal(c.total,3);assert.equal(c.on,2);assert.equal(c.done,1);assert.equal(c.installed,2);assert.deepEqual(c.toCome.map(x=>x.key),['board-b']);});
test('events-only placement records are read for a registered board',()=>{global.VMS1024={boards:()=>[{pos:'a',board:'board-a'}],rec:()=>A.prepare({inPlace:false},who,now,{})};const e=A.evidence(A.recordFor('board-a'),'2026-10-21');assert.equal(e.inPlace,false);assert.equal(e.on,null);});
test('inventory with no native evidence remains byte-for-byte unchanged',()=>{const I={list:[{item:'VMS',asked:24,on:21,coates:15,sub:{Supplier:6},spares:2}],cos:{Supplier:{at:6,spare:0}}};assert.equal(A.inventoryProjection(I,read([base])),I);assert.equal(JSON.stringify(I),JSON.stringify({list:[{item:'VMS',asked:24,on:21,coates:15,sub:{Supplier:6},spares:2}],cos:{Supplier:{at:6,spare:0}}}));});
console.log(JSON.stringify({status:'passed',tests:n}));
