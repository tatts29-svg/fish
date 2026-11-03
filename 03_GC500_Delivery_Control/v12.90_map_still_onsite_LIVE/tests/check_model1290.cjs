/* Author: Andrew Fisher. Synthetic-only checks of the actual read-model adapter.
 * No page, service, operational record, customer or financial data is used.
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../still_onsite1290_src.js'),'utf8');
const start=source.indexOf(' function read(){'),end=source.indexOf('\n const row=',start);
assert(start>=0&&end>start,'Cannot locate actual read adapter');
const eligibility=source.split('\n').find(line=>line.includes(' const eligible='));
assert(eligibility,'Cannot locate actual eligibility predicate');
const build=new Function('parent','ITEMS',"const N=s=>String(s||'').toUpperCase().replace(/\\s+/g,'');const key=it=>N(it?.reg?.sourceRequest1017?it.reg.sourceKey1017:it?.code);"+eligibility+source.slice(start,end)+';return read();');
let checked=0;
const check=(name,fn)=>{fn();checked++;};
const row=(key,extra={})=>({key,arrival:true,collected:0,remaining:1,unknown:false,complete:false,issues:[],items:[{type:'Building',n:1}],...extra});
const item=(code,extra={})=>({code,cat:{host:'trade'},places:[[1,2,3,4]],...extra});
const board=(key,extra={})=>({key,on:true,received:true,done:false,delivery:null,positions:[{pos:'P1'}],...extra});
function run({rows=[],boards=[],items=[],ready=true,plan={},pins={}}={}){
 const input={rows,boards,items,ready,plan,pins},before=JSON.stringify(input);
 const parent={gc500MapStatus1009:()=>({available:ready}),Departure1211:{all:()=>rows},VmsEquipment1103:{model:()=>({boards})},VMS1024:{board:pos=>plan[pos]||{pos},label:p=>'VMS '+p.pos,position:p=>pins[p.pos]||{lat:1,lon:2,by:null,at:null}}};
 const result=build(parent,items);assert.equal(JSON.stringify(input),before,'Adapter changed its source input');return result;
}
check('Never-collected arrival, partial quantity and unmapped stay visible',()=>{
 const actual=run({rows:[row('A',{remaining:3}),row('B',{remaining:2,collected:1}),row('C')],items:[item('A'),item('B')]});
 assert.deepEqual(actual.map(r=>r.key),['A','B','C']);assert.equal(actual[1].remaining,2);assert.equal(actual[1].partial,true);assert.equal(actual[2].mapped,false);assert.equal(actual[2].code,'C');
});
check('No arrival and completed departure do not appear',()=>{
 assert.deepEqual(run({rows:[row('PLANNED',{arrival:false}),row('GONE',{complete:true,remaining:0,collected:1})],items:[item('PLANNED'),item('GONE')]}),[]);
});
check('Zero with unknown or review never disappears as known empty',()=>{
 const actual=run({rows:[row('UNKNOWN',{remaining:0,unknown:true}),row('REVIEW',{remaining:0,issues:['synthetic scope mismatch']})]});
 assert.equal(actual.length,2);assert.equal(actual[0].unknown,true);assert.equal(actual[1].review,true);
});
check('Cancelled or superseded plan leftovers are not added without a native row',()=>{
 assert.deepEqual(run({items:[item('CANCELLED'),item('SUPERSEDED')]}),[]);
});
check('Native readiness must be true before claiming empty',()=>{
 assert.equal(run({ready:false}),null);assert.equal(run({rows:[row('A')],ready:false}),null);
});
check('Reader failure is unavailable, never empty',()=>{
 assert.equal(build({gc500MapStatus1009:()=>({available:true}),Departure1211:{all:()=>{throw new Error('fixture unavailable');}}},[]),null);
});
check('An on-site physical VMS is counted once across duplicate source rows',()=>{
 const b=board('BOARD');const actual=run({boards:[b,b],items:[item('VMS P1',{location1210:{kind:'vms'}})]});
 assert.equal(actual.length,1);assert.equal(actual[0].remaining,1);assert.equal(actual[0].mapped,true);assert.deepEqual(actual[0].codes,['VMS P1']);
});
check('Historic receipt, installation and remaining-to-arrive cannot prove VMS on site',()=>{
 const actual=run({boards:[board('PAST',{on:false,received:true,remaining:0,done:true}),board('FUTURE',{on:false,received:false,remaining:1}),board('DEPARTED',{departure1211:{at:'synthetic'}})]});assert.deepEqual(actual,[]);
});
check('An installed-complete board still physically on site remains included',()=>{
 const actual=run({boards:[board('COMPLETE_WORK',{done:true})]});assert.equal(actual.length,1);assert.equal(actual[0].remaining,1);
});
check('Linked physical boards do not double count an existing delivery reference',()=>{
 const actual=run({rows:[row('LOAD',{remaining:2,items:[{type:'VMS',n:2}]})],boards:[board('B1',{delivery:'LOAD'}),board('B2',{delivery:'LOAD',positions:[{pos:'P2'}]})],items:[item('LOAD'),item('VMS P1',{location1210:{kind:'vms'}}),item('VMS P2',{location1210:{kind:'vms'}})]});
 assert.equal(actual.length,1);assert.equal(actual[0].remaining,2);assert.deepEqual(actual[0].codes,['VMS P1','VMS P2']);
});
check('Ambiguous old/new VMS positions remain reviewable without a false pin',()=>{
 const actual=run({rows:[row('LOAD',{items:[{type:'VMS',n:1}]})],boards:[board('B',{delivery:'LOAD',positions:[{pos:'P1'},{pos:'P2'}]})],items:[item('LOAD'),item('VMS P1',{location1210:{kind:'vms'}}),item('VMS P2',{location1210:{kind:'vms'}})]});
 assert.equal(actual.length,1);assert.equal(actual[0].locationReview,true);assert.equal(actual[0].mapped,false);assert.deepEqual(actual[0].codes,[]);
});
check('Mixed delivery retains its non-VMS source map while VMS position needs review',()=>{
 const actual=run({rows:[row('MIXED',{remaining:3,items:[{type:'VMS',n:1},{type:'Generator',n:2}]})],boards:[board('B',{delivery:'MIXED',positions:[{pos:'P1'},{pos:'P2'}]})],items:[item('MIXED')]});
 assert.equal(actual.length,1);assert.equal(actual[0].remaining,3);assert.equal(actual[0].locationReview,true);assert.deepEqual(actual[0].codes,['MIXED']);
});
check('Session/moving board without authored current pin cannot use old plan position',()=>{
 for(const flag of ['session','moves_to']){const actual=run({boards:[board('B')],items:[item('VMS P1',{location1210:{kind:'vms'}})],plan:{P1:{pos:'P1',[flag]:true}}});assert.equal(actual[0].mapped,false);assert.equal(actual[0].locationReview,true);}
});
check('Unique current authored VMS position retains the existing map item',()=>{
 const actual=run({boards:[board('B')],items:[item('VMS P1',{location1210:{kind:'vms'}})],plan:{P1:{pos:'P1',session:true}},pins:{P1:{lat:1,lon:2,by:'Synthetic tester',at:'2026-11-03T01:00:00Z'}}});assert.equal(actual[0].mapped,true);assert.deepEqual(actual[0].codes,['VMS P1']);
});
check('Missing canonical position is listed without fabricated coordinates',()=>{
 const actual=run({boards:[board('B',{positions:[]})]});assert.equal(actual[0].mapped,false);assert.equal(actual[0].locationReview,true);assert.deepEqual(actual[0].items,[]);
});
console.log(JSON.stringify({suite:'onsite1290-model',passed:true,checks:checked,operationalWrites:0}));
