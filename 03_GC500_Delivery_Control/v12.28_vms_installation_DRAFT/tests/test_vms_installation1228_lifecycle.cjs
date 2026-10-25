/* Author: Andrew Fisher. Independent synthetic lifecycle and identity regression.
 * Pass the verified base or built HTML as argv[2]; no network or record writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../vms_installation1228_src.js'),'utf8');
const html=fs.readFileSync(process.argv[2],'utf8');
const open='<script id="charge1006-script">',start=html.indexOf(open);
assert(start>=0,'Native charge projection is required');
const nativeContext={module:{exports:{}},Set,Number,Math};
vm.createContext(nativeContext);vm.runInContext(html.slice(start+open.length,html.indexOf('</script>',start)),nativeContext);
const native=nativeContext.module.exports;assert.equal(typeof native.project,'function');
const context={module:{exports:{}},Set,Map,Number,Math};vm.createContext(context);vm.runInContext(source,context);
const api=context.module.exports,plain=v=>JSON.parse(JSON.stringify(v));
let checks=0;function test(name,body){try{body();checks++;}catch(e){e.message=name+': '+e.message;throw e;}}
const line={key:'install',name:'Install',rate:10.005,money:'rate',ticked:false};
const board=(key='EXAMPLE-A',changes={})=>({key,name:key,co:'example-supplier',fleet:key,contract:'EXAMPLE-CONTRACT',line:key,branch:'EXAMPLE',received:true,installLine:{...line},...changes});
const run=(boards,covered=[])=>plain(api.project({boards,covered},native.project));
test('received work prices independently of physical completion',()=>{const p=run([board('A',{on:true,installed:false,done:false,recorded:false})]);assert.equal(p.total,10.01);assert.equal(p.slots.length,1);assert.equal(p.slots[0].recordedQty1006,0);assert.equal(p.slots[0].key,'install');});
test('earlier receipt retains earned charge after departure',()=>{assert.equal(run([board('A',{on:false,installed:false,done:false,departure:{date:'2030-03-03'}})]).total,10.01);});
test('offsite without receipt is not billable',()=>assert.equal(run([board('A',{received:false,on:false})]).total,0));
test('receipt corrected to not confirmed is not billable',()=>assert.equal(run([board('A',{received:false,on:false,evidence:{state:'not confirmed'}})]).total,0));
test('future planned arrival is not billable',()=>assert.equal(run([board('A',{received:false,due:'2035-01-01',done:false})]).slots.length,0));
test('explicit untick overrides arrival and saved completion',()=>{const p=run([board('A',{off:true,done:true,recorded:true})]);assert.equal(p.total,0);assert.equal(p.slots.length,0);});
test('explicit zero rate stays zero',()=>{const p=run([board('A',{installLine:{...line,rate:0}})]);assert.equal(p.total,0);assert.equal(p.unknown,0);assert.equal(p.rows[0].charge.rate,0);});
test('missing rate remains unknown',()=>{const p=run([board('A',{installLine:null})]);assert.equal(p.total,0);assert.equal(p.unknown,1);assert.equal(p.issues.length,1);assert.equal(p.slots[0].value,null);});
test('excluded or unresolved scope stays out',()=>{for(const flag of ['excluded','unresolved'])assert.equal(run([board('A',{[flag]:true})]).slots.length,0);});
test('partial native groups are not topped up by inference',()=>{assert.equal(run([board('A',{delivery:'EXAMPLE-PARTIAL-GROUP',received:true})]).slots.length,0);});
test('exact native reference coverage suppresses addition',()=>assert.equal(run([board('A')],[{key:'A'}]).slots.length,0));
test('canonical native physical coverage suppresses addition',()=>assert.equal(run([board('A')],[{co:'EXAMPLE-SUPPLIER',fleet:'a'}]).slots.length,0));
test('source contract line already covered suppresses addition',()=>assert.equal(run([board('A')],[{contract:'EXAMPLE-CONTRACT',line:'A'}]).slots.length,0));
test('duplicate canonical board input adds once',()=>assert.equal(run([board('A'),board('A')]).total,10.01));
test('two references claiming one physical unit are held',()=>{const p=run([board('A',{fleet:'SHARED'}),board('B',{fleet:'SHARED'})]);assert.equal(p.total,0);assert.equal(p.issues.length,2);});
test('identical fleet labels at different companies are distinct',()=>{const p=run([board('A',{fleet:'SHARED',co:'one'}),board('B',{fleet:'SHARED',co:'two'})]);assert.equal(p.total,20.02);});
test('per reference cents are retained and no demob is created',()=>{const p=run([board('A'),board('B'),board('C')]);assert.equal(p.total,30.03);assert(p.slots.every(s=>s.key==='install'&&s.branch==='EXAMPLE'));});
test('repeated reads are pure and do not accumulate charges',()=>{const boards=[board('A'),board('B')],before=JSON.stringify(boards);const first=run(boards);for(let i=0;i<20;i++)assert.deepEqual(run(boards),first);assert.equal(JSON.stringify(boards),before);});
const key=(ref,disc,item,kind,unit)=>[ref+(unit?'/u'+unit:''),disc,item,kind].join('|');
const rk=key('A','D','VMS','install'),uk=key('A','D','VMS','install','F');
test('native explicit reference untick suppresses work',()=>assert.equal(api.unticked('A','D','VMS','F',{}, {['labour/'+rk]:'time'},key),true));
test('native unit tick takes precedence over reference untick',()=>assert.equal(api.unticked('A','D','VMS','F',{[uk]:true},{['labour/'+rk]:'old',['labour/'+uk]:'new'},key),false));
test('native unit untick takes precedence over reference tick',()=>assert.equal(api.unticked('A','D','VMS','F',{[rk]:true},{['labour/'+rk]:'old',['labour/'+uk]:'new'},key),true));
// Exercise the real adapter: display company names and native owner codes use
// the same canonical owner reader before financial deduplication.
const runtime={module:{exports:{}},Set,Map,Number,Math};runtime.window=runtime;
Object.assign(runtime,{
 vms913Boards:()=>[{key:'OVERLAY',contract:'EXAMPLE-CONTRACT',line:'ONE',branch:'EXAMPLE'}],
 VmsEquipment1103:{model:()=>({boards:[board('OVERLAY',{co:'Example Supplier',fleet:'EX-UNIT',contract:'EXAMPLE-CONTRACT',line:'ONE'})]})},
 FinanceRequest996:{assets:()=>[{key:'GROUP'}]},chargeLines:()=>[{item:'VMS'}],
 gcModel925:()=>({rows:[{physical:true,source:'native',item:'VMS',owner:'example-supplier',assetNo:'EX-UNIT'}]}),
 Units925:{owner:s=>String(s).trim().toLowerCase().replace(/\s+/g,'-')},
 vms913OnOf:()=>({on:null}),rowOff:()=>false,movedAway:()=>false,
 NotChargedHere1152:{why:()=>null},labourLinesFor:()=>({lines:[{...line}]}),branchOf:()=>({code:'EXAMPLE'}),
 S:{labour:{},stamps:{}},labourKey:key,OnsiteCharges1006:native,heldMemo:(_key,fn)=>fn()
});vm.createContext(runtime);vm.runInContext(source,runtime);
test('runtime canonical owner alias prevents duplicate native coverage',()=>assert.equal(runtime.module.exports.model().total,0));
runtime.FinanceRequest996.assets=()=>[];
test('runtime standalone route reaches native charge calculation',()=>{const p=runtime.module.exports.model();assert.equal(p.total,10.01);assert.equal(p.slots[0].branch,'EXAMPLE');});
test('runtime cancelled reference stays out',()=>{runtime.rowOff=()=>true;assert.equal(runtime.module.exports.model().total,0);runtime.rowOff=()=>false;});
test('runtime moved reference stays out',()=>{runtime.movedAway=()=>({to:'OTHER'});assert.equal(runtime.module.exports.model().total,0);runtime.movedAway=()=>false;});
test('runtime separate-contract exclusion stays out',()=>{runtime.NotChargedHere1152.why=()=> 'On another contract';assert.equal(runtime.module.exports.model().total,0);runtime.NotChargedHere1152.why=()=>null;});
test('runtime unresolved group assignment stays out',()=>{runtime.vms913OnOf=()=>({bad:'MISSING-GROUP'});assert.equal(runtime.module.exports.model().total,0);runtime.vms913OnOf=()=>({on:null});});
test('runtime grouped overlay never adds a second work line',()=>{runtime.vms913OnOf=()=>({on:'PARTIAL-GROUP'});assert.equal(runtime.module.exports.model().slots.length,0);runtime.vms913OnOf=()=>({on:null});});
test('runtime exact source branch remains the fallback',()=>{runtime.branchOf=()=>null;assert.equal(runtime.module.exports.model().slots[0].branch,'EXAMPLE');});
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:checks,recordWrites:0}));
