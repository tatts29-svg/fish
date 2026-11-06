/* Author: Andrew Fisher. Synthetic native collection boundaries: no network or real records. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const page=fs.readFileSync(process.env.PAGE,'utf8'),D=path.join(__dirname,'..'),scripts=[...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const source=scripts.find(s=>s.includes('const PARTIAL_ENABLED=true;'));
const coreStart=source.indexOf('(function(root)'),coreEnd=source.indexOf(")(typeof window!=='undefined'?window:globalThis);",coreStart)+")(typeof window!=='undefined'?window:globalThis);".length;
const collStart=source.lastIndexOf("(function(root){'use strict';",source.indexOf('const PARTIAL_ENABLED=true;'));
const collEnd=source.indexOf('})(window);',collStart)+'})(window);'.length;
const now=Date.now(),at=new Date(now-86400000).toISOString(),day=new Date(now+36000000).toISOString().slice(0,10),actual=new Date(now-1000+36000000).toISOString().slice(0,19)+'+10:00';
const rows=[{key:'TEST',a:{key:'TEST'},units:[{type:'FWF',n:3},{type:'Generator',n:1}],portions:[]}];
const physical=[{id:'a',assetNo:'EXAMPLE-A',physical:true,item:'FWF',owner:'coates'},{id:'b',assetNo:'EXAMPLE-B',physical:true,item:'FWF',owner:'event-portables'}];
let record={state:'on site',recorded:true,set_at:at,history:[{state:'on site',at,by:'Example recorder'}],done:true,emptied:true},n=0;
const ctx={window:{},Date,console,crypto:require('crypto').webcrypto,demob816:()=>({refs:rows}),todayIso:()=>day,gcUnits925:()=>physical,esc:String,UNNUMBERED_RX:/Barrier|Trackmat/i,heldMemo:(k,f)=>f(),holdAssets:f=>f(),S:{delivery:{}},deliveryOf:()=>record,bump:()=>{},buzz:()=>{},vms913Boards:()=>[],Units925:{owner:s=>s,company:s=>s}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source.slice(coreStart,coreEnd),ctx);ctx.DemobProgress996.record=()=>record;vm.runInContext(source.slice(collStart,collEnd),ctx);vm.runInContext(fs.readFileSync(path.join(D,'departure1211_parent.js'),'utf8'),ctx);
const C=ctx.DemobCollection996,H=ctx.Departure1211,req=(items=[{type:'FWF',n:1,unitIds:['a']}],extra={})=>({token:C.snapshot('TEST').token,id:'example-'+Math.random(),date:day,departedAt1211:actual,items,...extra});
const test=(name,f)=>{f();n++;console.log('PASS '+name);};
function append(q){const v=C.validate('TEST',q);assert(v.ok,v.message);record.history.push({state:record.state,at:new Date(now).toISOString(),by:'Example recorder',collection996:v.value});return v;}
test('numbered partial collection permitted, actual time retained',()=>{const v=C.validate('TEST',req());assert(v.ok);assert(!v.complete);assert.equal(v.value.departedAt1211,actual);});
test('numbered identity duplicates refused',()=>assert(!C.validate('TEST',req([{type:'FWF',n:2,unitIds:['a','a']}])).ok));
test('foreign identity refused',()=>assert(!C.validate('TEST',req([{type:'FWF',n:1,unitIds:['elsewhere']}])).ok));
test('unidentified partial for individually tracked items refused',()=>assert(!C.validate('TEST',req([{type:'FWF',n:1,unitIds:[]}])).ok));
test('whole typed remainder may include its known unidentified unit',()=>assert(C.validate('TEST',req([{type:'FWF',n:3,unitIds:['a','b']}])).ok));
test('date and exact time required, future and before-arrival refused',()=>{for(const t of ['',day+'T99:00:00+10:00',actual.replace('+10:00','Z'),new Date(now+86400000+36000000).toISOString().slice(0,19)+'+10:00',new Date(now-172800000+36000000).toISOString().slice(0,19)+'+10:00'])assert(!C.validate('TEST',req(undefined,{departedAt1211:t})).ok);});
test('stale record rejected',()=>assert(!C.validate('TEST',req(undefined,{token:'old'})).ok));
test('remaining quantities exclude departed identity',()=>{append(req());assert.equal(C.read('TEST').remaining[0].n,2);assert(!C.snapshot('TEST').pools.fwf.includes('a'));assert.equal(H.status('TEST').collected,1);assert.equal(H.status('TEST').remaining,3);assert(H.unit('TEST','a'));assert(!H.unit('TEST','b'));});
test('same asset cannot be collected again',()=>assert(!C.validate('TEST',req()).ok));
test('inventory identity clone omits departed unit and preserves source',()=>{const m={rows:physical};assert.deepEqual(Array.from(H.remainingModel(rows[0].a,m).rows,r=>r.id),['b']);assert.equal(m.rows.length,2);});
test('unknown scope remains incomplete',()=>{rows[0].units.push({type:'Unknown',n:0,unknown:true});assert(!C.read('TEST').complete);rows[0].units.pop();});
test('changed positive scope requires review',()=>{rows[0].units[0].n=4;assert(C.read('TEST').issues.length);assert(!C.validate('TEST',req()).ok);rows[0].units[0].n=3;});
test('full remainder reaches zero and stamps all units',()=>{append(req([{type:'FWF',n:2,unitIds:['b']},{type:'Generator',n:1,unitIds:[]}]));assert(C.read('TEST').complete);assert.equal(H.status('TEST').remaining,0);assert.equal(H.status('TEST').label,'Left site');});
test('new arrival begins a new collection scope',()=>{record.history.push({state:'on site',at:new Date(now+1000).toISOString(),by:'Example recorder'});record.set_at=new Date(now+1000).toISOString();assert.equal(C.read('TEST').collected[0].n,0);assert(!H.unit('TEST','a'));});
test('legacy date-only evidence never invents departure time',()=>assert(H.stamp({date:day,at:new Date().toISOString()}).includes('departure time not recorded')));
test('quantity-only partial permitted',()=>{rows[0].units=[{type:'CC Barrier',n:10}];record={state:'on site',recorded:true,set_at:at,history:[{state:'on site',at,by:'Example recorder'}]};assert(C.validate('TEST',req([{type:'CC Barrier',n:4,unitIds:[]}])).ok);});
test('VMS uses the selected physical identity rather than the whole reference',()=>{
 rows[0].units=[{type:'VMS',n:2}];physical.splice(0,physical.length,{id:'v1',assetNo:'EXAMPLE-1',physical:true,item:'VMS',owner:'coates'},{id:'v2',assetNo:'EXAMPLE-2',physical:true,item:'VMS',owner:'coates'});
 ctx.vms913Boards=()=>[{key:'BOARD1'},{key:'BOARD2'}];ctx.vms913Of=b=>({co:'coates',fleet:b.key==='BOARD1'?'EXAMPLE-1':'EXAMPLE-2'});
 append(req([{type:'VMS',n:1,unitIds:['v1']}]));const result=H.vms({boards:[{key:'BOARD1',delivery:'TEST',on:true,done:true,installed:true},{key:'BOARD2',delivery:'TEST',on:true,done:true,installed:true}]},day);
 assert.equal(result.on,1);assert(result.boards[0].departure1211);assert(!result.boards[0].on);assert(result.boards[1].on);assert(!result.boards[1].departure1211);
 ctx.VmsEquipment1103={model:()=>({boards:result.boards.map(b=>({...b,positions:[{pos:b.key}]}))})};ctx.VMS1024={board:pos=>({pos}),label:b=>'VMS '+b.pos};assert(H.mapStates().some(r=>r.key==='VMS BOARD1'&&r.complete));assert(!H.mapStates().some(r=>r.key==='VMS BOARD2'));
});
console.log(n+'/'+n);
