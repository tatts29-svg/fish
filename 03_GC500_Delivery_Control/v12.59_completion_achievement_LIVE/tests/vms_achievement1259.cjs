/* Author: Andrew Fisher. Synthetic dated VMS completion/presence regression cases.
 * BASE and PAGE are private local artifacts. Nothing is sent or written to the service. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const name of ['BASE','PAGE'])assert(process.env[name],name+' required');
const before=fs.readFileSync(process.env.BASE,'utf8'),after=fs.readFileSync(process.env.PAGE,'utf8');
let checks=0;
function same(a,b,why){assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),why);checks++;}
function equal(a,b,why){assert.equal(a,b,why);checks++;}
function fn(text,name){
 const start=text.indexOf('function '+name+'(');assert(start>=0,name+' exists');
 const open=text.indexOf('{',start);let depth=0,quote='',escape=false;
 for(let i=open;i<text.length;i++){
  const c=text[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;else if(c==='}'&&!--depth)return text.slice(start,i+1);
 }throw Error('unclosed '+name);
}
function env(text){
 const ctx={console,Date,Map,Set,WeakSet,Number,Object,Array,String,Math,JSON};ctx.window=ctx;vm.createContext(ctx);
 const script=text.match(/<script id="vms-completion1101-script">([\s\S]*?)<\/script>/);assert(script);vm.runInContext(script[1],ctx);
 const start=text.indexOf('/* Author: Andrew Fisher. Read-only physical VMS board projection for Equipment and inventory. */');
 const end=text.indexOf("})(typeof window==='undefined'?globalThis:window);",start)+"})(typeof window==='undefined'?globalThis:window);".length;
 vm.runInContext(text.slice(start,end),ctx);return ctx;
}
const old=env(before),next=env(after);
same(fn(before,'prepare'),fn(after,'prepare'),'native operational writer is byte-identical');
const day='2026-10-23',early='2026-10-21',completeDay='2026-10-22',late='2026-10-29';
const event=(done,date=completeDay,seq=1)=>({done,effective_date:date,recorded_at:date+'T00:00:00.000Z',by:'Fixture author',sequence1101:seq});
const arrival=(state,date=completeDay,seq=1)=>({state,effective_date:date,recorded_at:date+'T00:00:00.000Z',by:'Fixture author',sequence1101:seq,inPlace:state==='on site'});
const completed={events1098:[arrival('on site')],completionEvents1101:[event(true)]};
const row=record=>({key:'board-a',name:'Fixture board',delivery:'delivery-a',due:completeDay,phase:'complete',on:false,done:false,record});
function project(ctx,r,d=day){return ctx.VMSArrival1098.project([r],d,'2026-11-01');}
function physical(m){return m.boards.map(b=>({key:b.key,on:b.on,installed:b.installed,evidence:b.evidence}));}
for(const d of [early,completeDay,day,late]){
 const record=structuredClone(completed);record.events1098.push(arrival('off site',day,2));
 const a=project(old,row(record),d),b=project(next,row(record),d);
 equal(b.done,d<completeDay?0:1,'completion follows its own date '+d);
 same(physical(b),physical(a),'physical readings stay unchanged '+d);
 equal(b.boards[0].on,d===completeDay,'physical presence follows arrival/departure '+d);
 if(d>=completeDay){equal(b.left,0);equal(b.toCome.length,0,'completed board is not still due');}
}
// A later explicit correction really reopens work; an automatic off-site reset does not.
const explicit={events1098:[arrival('on site'),arrival('off site',day,2)],completionEvents1101:[event(true),event(false,'2026-10-24',3)]};
equal(project(next,row(explicit),day).done,1);equal(project(next,row(explicit),late).done,0,'explicit completion undo is honoured');
const auto={events1098:[arrival('on site'),arrival('off site',day,2)],completionEvents1101:[event(true),event(false,day,2)]};
equal(project(next,row(auto),day).done,1,'corroborated automatic off-site reset retains achievement');
same(physical(project(next,row(auto))),physical(project(old,row(auto))));
const unknown={events1098:[arrival('on site'),arrival('not confirmed',day,2)],completionEvents1101:[event(true),event(false,day,2)]};
equal(project(next,row(unknown),day).done,0,'not-confirmed correction stays unconfirmed');
const unproven=structuredClone(auto);unproven.events1098[1].sequence1101=99;
equal(project(next,row(unproven),day).done,0,'unmatched false event cannot be ignored');
const invalid=structuredClone(auto);invalid.events1098[1].effective_date='2026-02-30';
equal(project(next,row(invalid),day).done,0,'invalid departure event cannot explain a false tick');
const never={events1098:[arrival('off site',day,2)],completionEvents1101:[event(false,day,2)]};
equal(project(next,row(never),day).done,0,'departure alone cannot create completion');
equal(project(next,{...row(null),on:true,done:false}).done,0,'on-site alone cannot create completion');
equal(project(next,{...row(null),on:false,done:true,nativeDone1259:false}).installed,0,'completion restoration does not install absent equipment');
const original=JSON.stringify(auto);project(next,row(auto),late);equal(JSON.stringify(auto),original,'projection never edits evidence');
// Duplicate plan rows do not multiply a physical board.
equal(next.VMSArrival1098.project([row(completed),row(completed)],day,late).total,1);
// Use the actual departure function with synthetic typed evidence.
function departure(ctx,text,complete){
 ctx.read=()=>({recorded:true,issues:[],complete,events:[{date:day,items:[{type:'VMS',physicalUnits:[{owner:'coates',number:'asset-a'}]}]}]});
 ctx.normal=x=>String(x??'').trim().toLowerCase();ctx.list=x=>Array.isArray(x)?x:[];ctx.stamp=e=>e.date;
 ctx.vms913Boards=()=>[{key:'board-a'},{key:'board-b'}];ctx.vms913Of=b=>({co:'Coates',fleet:b.key==='board-a'?'asset-a':'asset-b'});ctx.W=ctx;ctx.Units925={owner:()=> 'coates'};
 const native=text.match(/<script id="demob1211-script">([\s\S]*?)<\/script>/);assert(native);
 vm.runInContext(fn(native[1],'vms'),ctx);return ctx.vms;
}
const model={boards:[{key:'board-a',delivery:'delivery-a',on:true,done:true,installed:true},{key:'board-b',delivery:'delivery-a',on:true,done:true,installed:true}],total:2};
const departed=departure(next,after,false)(structuredClone(model),day);
equal(departed.done,2,'partial departure keeps both achieved boards');equal(departed.on,1);equal(departed.installed,1);
equal(departed.boards[1].departure1211,undefined,'uncollected board unchanged');
const allGone=departure(next,after,true)(structuredClone(model),day);equal(allGone.done,2);equal(allGone.on,0);
same(allGone.boards.map(b=>({on:b.on,installed:b.installed,received:b.received,departure:b.departure1211})),departure(old,before,true)(structuredClone(model),day).boards.map(b=>({on:b.on,installed:b.installed,received:b.received,departure:b.departure1211})));
// The equipment projection, detail text and plan all share the preserved result.
const equipment=next.VmsEquipment1103.project({boards:[{key:'board-a',name:'Fixture board'}],statuses:[{key:'board-a',due:completeDay,on:false,done:true,installed:false,received:true,departure1211:{label:'Left site',at:'23 Oct 2026, 12:00 AEST'}}]},day);
equal(equipment.done,1);equal(equipment.on,0);equal(equipment.installed,0);equal(equipment.remaining,0);
equal(equipment.boards[0].status,'Completed · left site 23 Oct 2026, 12:00 AEST');
const plan=next.VmsEquipment1103.plan(day,equipment);equal(plan.behind,0);equal(plan.actual,0);equal(plan.actualLabel,'Due boards on site');equal(plan.overdueRefs.length,0);assert(plan.label.includes('completed and left site'));checks++;
equal(plan.issues.length,1,'one dated departure explanation');
// Linked delivery history drives achievement, while the native source drives presence/installation.
next.todayIso=()=>late;next.addDays=()=> '2026-11-01';next.PROG_NEXT_DAYS=7;next.Departure1211=undefined;
next.vms913Boards=()=>[{key:'board-a',name:'Fixture board',start:completeDay}];next.vms913OnOf=()=>({on:'delivery-a'});
next.assetOf=()=>({key:'delivery-a'});next.assetStatusAsOf=()=>({in:completeDay,inPhase:'overdue',d:{recorded:true,state:'in transit',done:false}});
next.CompletionAchievement1259={delivery:()=>({done:true})};next.VMS1024={boards:()=>[]};
const count=next.VMSArrival1098.count(late);equal(count.done,1);equal(count.on,0);equal(count.installed,0);equal(count.toCome.length,0);equal(count.boards[0].nativeDone1259,undefined,'internal physical input stays private');
console.log(JSON.stringify({author:'Andrew Fisher',passed:true,checks}));
