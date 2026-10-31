/* Author: Andrew Fisher. Synthetic identity fixtures only. */
'use strict';
const assert=require('node:assert/strict'),api=require('../read_model1246.js');
const clone=value=>structuredClone(value);
const row={id:'canonical:new',ref:'SYN-A',owner:'coates',assetNo:'123',item:'VMS',nativeId:'vms:synthetic',source:'native',physical:true,slot:false};
const event={id:'synthetic-event',date:'2030-01-02',items:[{type:'VMS',n:1,unitIds:['historic:old'],physicalUnits:[{id:'historic:old',owner:'coates',number:'123',item:'VMS'}]}]};
const reading={recorded:true,issues:[],required:[{type:'VMS',n:2}],remaining:[{type:'VMS',n:1}],events:[event],complete:false};
const rows=[row,{...row,id:'other',nativeId:'vms:other',assetNo:'1234'}];
let checks=0;
const same=(actual,expected,label)=>{assert.strictEqual(actual,expected,label);checks++;};
const run=(r=reading,us=rows,id=row.id,item=row.item,ref=row.ref)=>api.unit(r,ref,id,item,us);
const before=JSON.stringify({reading,rows});
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
freeze(reading);freeze(rows);
same(run(),event,'canonical key change recovers the original event object');
same(JSON.stringify({reading,rows}),before,'source input remains byte-equivalent JSON');
same(run(reading,rows,'removed-id'),null,'removed current ID has no inferred identity');
same(run(reading,[{...row,assetNo:'replacement'}]),null,'replacement physical unit is not the departed unit');
same(run(reading,rows,'other'),null,'123 does not match 1234');
same(run(reading,[{...row,assetNo:'0123'}]),null,'leading zero is meaningful');
same(run(reading,[{...row,ref:'SYN-B'}]),null,'another reference is not current evidence');
same(run(reading,rows,row.id,'Generator'),null,'requested type must agree');
same(run({...reading,issues:['review required']}),null,'native evidence issues block recovery');
same(run(null),null,'missing reading has no evidence');
same(run({...reading,required:[]}),null,'unrecognised required type is not inferred');
for(const [name,patch]of [['nonphysical',{physical:false}],['unknown owner',{owner:'unknown'}],['empty owner',{owner:''}],['no number',{assetNo:''}],['no type',{item:''}],['anonymous slot',{slot:true}],['product/count row',{source:'asset'}],['no native identity',{nativeId:''}]]){
 same(run(reading,[{...row,...patch}]),null,name+' cannot recover identity');
}
same(run(reading,[row,{...row}]),null,'duplicate current ID rejected');
same(run(reading,[row,{...row,id:'duplicate'}]),null,'duplicate current typed identity rejected');
same(run(reading,[row,{...row,id:'conflict',owner:'supplier'}]),null,'conflicting current owner rejected');
same(run(reading,[row,{...row,id:'conflict',item:'Generator'}]),null,'conflicting current type rejected');
same(run(reading,[row,{...row,id:'elsewhere',ref:'SYN-B'}]),event,'no global restriction across legitimate reference scopes');
same(run({...reading,events:[event,clone(event)]}),null,'duplicate departure events rejected');
const altered=(change)=>{const r=clone(reading);change(r.events[0].items[0],r);return r;};
for(const [name,change]of [
 ['wrong owner',line=>line.physicalUnits[0].owner='supplier'],
 ['unknown owner',line=>line.physicalUnits[0].owner='unknown'],
 ['missing owner',line=>delete line.physicalUnits[0].owner],
 ['wrong physical type',line=>line.physicalUnits[0].item='Generator'],
 ['wrong collection type',line=>line.type='Generator'],
 ['number substring',line=>line.physicalUnits[0].number='1234'],
 ['missing physical number',line=>delete line.physicalUnits[0].number],
 ['missing evidence ID',line=>delete line.physicalUnits[0].id],
 ['ID not listed',line=>line.unitIds=[]],
 ['quantity only',line=>line.physicalUnits=[]],
 ['quantity mismatch',line=>line.n=2],
 ['fractional quantity',line=>line.n=0.5],
 ['duplicate physical evidence',line=>{line.physicalUnits.push(clone(line.physicalUnits[0]));line.unitIds.push('historic:old');line.n=2;}]
])same(run(altered(change)),null,name+' rejected');
const normalised=altered(line=>{line.type='  vms ';line.physicalUnits[0].item='vms';line.physicalUnits[0].owner='COATES';});
same(run(normalised),normalised.events[0],'canonical text normalisation does not change numbers');
const conflict=clone(reading),second=clone(event);
second.id='conflicting-event';second.items[0].physicalUnits[0].owner='supplier';conflict.events.push(second);
same(run(conflict),null,'conflicting historical identity is not ignored');
const unrelated=clone(reading),other=clone(event);
other.id='unrelated-event';other.items[0].physicalUnits[0].number='999';unrelated.events.push(other);
same(run(unrelated),unrelated.events[0],'unrelated event does not block a unique match');
same(run({...reading,events:[null,{items:[null]}]}),null,'malformed empty events do not throw');
same(run({...reading,required:[null]}),null,'malformed empty required entries do not throw');
console.log(checks+' read-model identity checks PASS');
