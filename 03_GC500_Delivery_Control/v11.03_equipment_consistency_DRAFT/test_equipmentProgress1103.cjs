/* Author: Andrew Fisher. Synthetic read-only completion projection regression tests. */
'use strict';
const assert=require('node:assert/strict');
const api=require('./equipmentProgress1103_src.js');let checks=0;
const check=(value,expected,label)=>{assert.deepEqual(value,expected,label);checks++;};
const row=(key,quantity,done,more={})=>({key,quantity,knownQuantity:quantity,done,complete:done===quantity,...more});
let m=api.project([row('A',2,2),row('B',8,0)]);
check(m.pct,20,'quantities, not reference average');check(m.total,10);check(m.done,2);check(m.complete,false);
check(api.summary(m),'2 of 10 units confirmed complete · 20%');
check(api.project([row('A',2,2),row('A',2,2)]).total,2,'identity deduplication');
check(api.project([]).pct,null);check(api.project([]).complete,false);check(api.summary(api.project([])),'No completion scope in this view');
check(api.project([row('A',0,0)]).pct,null);check(api.project([row('A',0,0)]).complete,false);
check(api.project([row('A',null,0)],{canonical:{total:null,done:0,pct:100}}).pct,null,'unknown denominator cannot retain stale percentage');
m=api.project([row('A',null,0,{knownQuantity:3})]);check(m.total,null);check(m.knownTotal,3);check(m.pct,null);check(m.complete,false);
check(api.project([row('A',2,0,{recordedComplete:true,complete:false,conflict:true})]).lowerBound,true);
m=api.project([row('A',2,2)],{health:{ready:false,loading:true}});check(m.done,null);check(m.total,null);check(m.pct,null);check(api.summary(m),'Loading completion');
m=api.project([row('A',100000,99999)]);check(m.complete,false);check(api.displayPct(m),'99.99','rounding never manufactures completion');
m=api.project([row('A',3,1)],{canonical:{total:3,done:1,pct:100/3,pctKind:'lower-bound'}});check(api.displayPct(m),'33.33');check(api.summary(m).startsWith('At least'),true);
check(api.html(api.project([row('A',1,1)],{scopeNote:'<script>&"',received:1,installed:0})).includes('<script>'),false,'escaped source text');
const assets=[{key:'A'},{key:'B'},{key:'ALIAS',alias:true},{key:'OMIT',excluded:true},{key:'CANCEL',_cancelled:true},{key:'MOVE',moved:true},{key:'RELOC',relocation:true}];
let daySeen=[],nativeDone=2;
const env={day:()=> '2026-01-12',health:()=>({ready:true}),physical:list=>list.filter(a=>!a.alias),includes:a=>!a.excluded,moved:key=>assets.find(a=>a.key===key)?.moved,
 metrics:day=>{daySeen.push(day);return {areas:[{id:'synthetic',groupName:'Synthetic',unit:'machines',rows:[row('A',2,nativeDone),row('B',8,0)]}],summary:{byId:{synthetic:{total:10,done:nativeDone,pct:nativeDone*10,pctKind:'confirmed',scope:'Native completion scope'}}}};},
 lines:a=>a.lines||[{item:'Machine',quantity:1}],quantity:l=>l.quantity,delivery:(key,day)=>{daySeen.push(day);return {recorded:true,state:'on site',done:key==='A'};},shorts:()=>[],
 boardCount:()=>({boards:[{key:'BOARD-A',delivery:'A',on:true,installed:true,done:false},{key:'BOARD-B',delivery:null,on:true,installed:true,done:true},{key:'BOARD-C',delivery:null,on:false,installed:false,done:false}]})};
m=api.model('Synthetic',assets,{},env);check(m.total,10);check(m.done,2);check(m.pct,20);check(m.excluded,['OMIT']);check(m.refs,['A','B']);check(m.scopeNote,'Native completion scope');
m=api.model('Synthetic',assets.filter(a=>a.key==='A'),{filtered:true},env);check(m.total,2);check(m.done,2);check(m.pct,100,'filtered scope follows displayed rows');
check(api.model('Synthetic',[],{},env).total,0,'empty supplied view is not whole trade');
m=api.model('Other',[{key:'A',lines:[{item:'Trackmat',quantity:20}]},{key:'B',lines:[{item:'Trackmat',quantity:10}]}],{day:'2026-01-09'},env);check(m.total,30);check(m.done,20);check(m.received,null,'on site is not invented as received quantity');check(m.installed,null,'on site is not installation');check(m.complete,false);check(daySeen.includes('2026-01-09'),true);
m=api.model('Other',[{key:'A',lines:[{item:'Machine',quantity:null}]}],{},env);check(m.total,null);check(m.pct,null);
m=api.model('Other',[{key:'A',lines:[{item:'Machine',quantity:2}]}],{}, {...env,shorts:()=>[{item:'Machine'}]});check(m.done,0);check(m.lowerBound,true,'short-delivery conflict is not complete');
// Incoming equipment and subsequent completion are distinct native reads; no duplicated rows or optimistic status.
m=api.model('Synthetic',assets,{},env);nativeDone=0;const incoming=api.model('Synthetic',assets,{},env);check(incoming.pct,0);check(incoming.done,0);check(m.done,2,'previous projection remains immutable');nativeDone=10;check(api.model('Synthetic',assets,{},env).pct,100,'next native projection reflects completion');
m=api.model('VMS boards',assets,{},env);check(m.total,3);check(m.received,2);check(m.installed,2);check(m.done,1);check(m.complete,false);check(Math.abs(m.pct-100/3)<1e-10,true);
m=api.model('VMS boards',[{key:'A'}],{filtered:true},env);check(m.total,1);check(m.done,0);check(m.received,1);check(m.installed,1);
m=api.model('VMS boards',[],{filtered:true,boards:[{key:'BOARD-B',on:true,installed:true,done:true}]},env);check(m.total,1);check(m.done,1);check(m.complete,true,'standalone board subset supplied by native filter');
check(api.model('VMS boards',[],{}, {...env,boardCount:()=>null}).health.ready,false);
check(api.model('VMS boards',[],{boards:[]},env).total,0);
m=api.model('VMS boards',[],{boards:[{key:'LEFT',on:false,received:true,installed:false,done:false}]},env);check(m.received,1,'previous receipt remains distinct from currently on site');check(m.installed,0);check(m.done,0);
m=api.model('VMS boards',[],{boards:[{key:'CORRECTED',on:false,received:false,installed:false,done:false}]},env);check(m.received,0,'explicit receipt correction wins');
// New non-VMS equipment enters the quantity scope immediately; receipt/installation do not finish it.
const incomingAssets=[{key:'NEW-A',lines:[{item:'Machine',quantity:1}]}],arrival={};
const incomingEnv={...env,delivery:(key,day)=>({recorded:!!arrival[key],state:arrival[key]?.state||'not on site',installed:arrival[key]?.installed||false,done:!!arrival[key]?.done&&day>='2026-01-12'})};
check(api.model('Incoming machines',incomingAssets,{},incomingEnv).total,1);
incomingAssets.push({key:'NEW-B',lines:[{item:'Machine',quantity:2}]});
check(api.model('Incoming machines',incomingAssets,{},incomingEnv).total,3);
arrival['NEW-B']={state:'on site',installed:false,done:false};
check(api.model('Incoming machines',incomingAssets,{},incomingEnv).done,0,'received equipment is not complete');
arrival['NEW-B'].installed=true;
check(api.model('Incoming machines',incomingAssets,{},incomingEnv).done,0,'installation and final completion are separate');
arrival['NEW-B'].done=true;
m=api.model('Incoming machines',incomingAssets,{},incomingEnv);check(m.done,2);check(m.left,1);check(m.complete,false);
check(api.model('Incoming machines',incomingAssets,{day:'2026-01-11'},incomingEnv).done,0,'historical day does not inherit later completion');
check(api.model('Incoming machines',[incomingAssets[1]],{filtered:true},incomingEnv).complete,true);
arrival['NEW-B'].done=false;
check(api.model('Incoming machines',incomingAssets,{},incomingEnv).done,0,'undo recomputes rather than retaining previous complete value');
// A schedule number is not proof of its physical unit: preserve native type uncertainty.
const uncertainEnv={...env,metrics:()=>({areas:[],types:{byCard:{equipment:[{id:'type-mat',name:'Mat',rows:[{key:'A',quantity:null,knownQuantity:null,done:null,complete:true,recordedComplete:true}]}]}}})};
m=api.model('Track material',[{key:'A',lines:[{item:'Mat',quantity:20}]}],{},uncertainEnv);check(m.total,null);check(m.pct,null);check(m.complete,false,'unresolved physical unit cannot become100%');
const multipleEnv={...env,metrics:()=>({areas:[],types:{byCard:{equipment:[{id:'one',name:'Part one',rows:[row('A',2,2)]},{id:'two',name:'Part two',rows:[row('A',3,0)]}]}}})};
m=api.model('Other',[{key:'A'}],{},multipleEnv);check(m.total,5);check(m.done,2);check(m.pct,40,'multiple types retain quantity weighting once per type/reference');
// Canonical plan scope may deliberately exclude an additional physical unit; retain its source note.
m=api.project([row('A',4,4)],{canonical:{total:3,done:3,pct:100,pctKind:'confirmed'},scopeNote:'Plan scope; additional recorded equipment is separate'});check(m.total,3);check(m.done,3);check(m.complete,true);check(m.scopeNote.includes('Plan scope'),true);
const t=api.html(api.model('VMS boards',assets,{},env));check(t.includes('data-equipment-progress1103'),true);check(t.includes('2 received · 2 installed'),true);check(t.includes('confirmed complete'),true);check(t.includes('supplied-description'),false);
console.log(JSON.stringify({status:'passed',checks,syntheticOnly:true,mutationFunctionsCalled:0}));
