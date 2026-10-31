/* Author: Andrew Fisher. Synthetic fixtures only; no service or browser writes. */
'use strict';
const assert=require('node:assert/strict'),G=require('./equipmentGroups1103_src.js');
let checks=0;function check(name,fn){fn();checks++;}
const freeze=o=>{Object.freeze(o);Object.values(o).forEach(v=>v&&typeof v==='object'&&!Object.isFrozen(v)&&freeze(v));return o;};
const asset=(key,item,other={})=>({key,discipline:'Other',product:null,item_types:[item],...other});
for(const item of ['Forklift 5T','Forklift5T','Forklift 2.5T','2.5T Forklift STD','3.5T Forklift Std','Forklift Rough Terrain 2.5t With Switchable 2WD to 4WD','Scissor Lift43ft/13m Diesel','Knuckle Boom61ft','Straight Boom60ft','Knuckleboom 61ft/18.6m diesel','Straightboom 60ft diesel','Telehandler','EWP','Access platform','Cherry picker','SUPPLY-Forklift 3.5t Diesel','COATES-Forklift 2.5t'])check(item,()=>{assert.equal(G.group(freeze(asset('X',item))),G.ACCESS);assert.equal(G.isMachine(item),true);});
for(const item of ['Fork Extensions2.4m','Fork Extensions 2.4m','Forklift Tyne Rotator','Forklift forks','Tyne rotator','Fork rotator','Forklift attachment','Forklift battery','Harness','Forklift charger','Slippers'])check('accessory '+item,()=>{assert.equal(G.isMachine(item),false);assert.equal(G.isAccessory(item),true);assert.equal(G.group(asset('X',item)),'Other');});
for(const item of ['Toilet Block 6m','Boom gate','Speaker boom','Diesel generator','Fork extension trolley','Portable building'])check('non-machine '+item,()=>assert.equal(G.isMachine(item),false));
check('explicit product wins',()=>assert.equal(G.group(asset('X','Forklift 5T',{product:'Generator'})),'Generators'));
check('explicit discipline wins',()=>assert.equal(G.group(asset('X','Forklift 5T',{discipline:'Generators'})),'Generators'));
check('canonical access discipline aliases presentation',()=>assert.equal(G.group(asset('X','Forklift 5T',{discipline:'Access & plant'})),G.ACCESS));
check('no name inference',()=>assert.equal(G.group({...asset('X',''),name:'Forklift 5T'}),'Other'));
check('mixed equipment stays recorded',()=>assert.equal(G.group({...asset('X','Forklift 5T'),item_types:['Forklift 5T','Toilet']}),'Other'));
check('machine plus explicitly named attachment groups together',()=>assert.equal(G.group({...asset('X','Forklift 5T'),item_types:['Forklift 5T','Fork Extensions2.4m']}),G.ACCESS));
check('machine with attachment description',()=>assert.equal(G.isMachine('Forklift 5T with slippers'),true));
const assets=freeze([asset('A','Forklift 5T'),asset('B','Knuckle Boom61ft'),asset('C','Forklift 5T',{product:'Generator'}),asset('D','Toilet'),asset('E','Forklift 2.5T',{discipline:'Access & plant'})]);
const line=(key,asked,on,coates,cos={})=>({key,asked,on,coates,sub:Object.values(cos).reduce((a,b)=>a+b,0),cos,nonum:0,received1017:on,remaining1017:asked-on,onsite:!!on});
const inventory=freeze({td:'2026-10-21',list:[
 {type:'Other|Forklift 5T',disc:'Other',item:'Forklift 5T',asked:2,on:1,coates:1,sub:{},nonum:0,received1017:1,remaining1017:1,spares:0,spareC:0,spareSub:{},refs:{A:line('A',1,1,1),C:line('C',1,0,0)}},
 {type:'Other|Knuckle Boom61ft',disc:'Other',item:'Knuckle Boom61ft',asked:1,on:0,coates:0,sub:{},nonum:0,received1017:0,remaining1017:1,spares:0,spareC:0,spareSub:{},refs:{B:line('B',1,0,0)}},
 {type:'Access & plant|Forklift 2.5T',disc:'Access & plant',item:'Forklift 2.5T',asked:1,on:1,coates:0,sub:{Supplier:1},nonum:0,received1017:1,remaining1017:0,spares:1,spareC:1,spareSub:{},refs:{E:line('E',1,1,0,{Supplier:1})}},
 {type:'Other|Toilet',disc:'Other',item:'Toilet',asked:1,on:1,coates:1,sub:{},nonum:0,received1017:1,remaining1017:0,spares:0,spareC:0,spareSub:{},refs:{D:line('D',1,1,1)}}],
spares:[{id:'sp1',type:'Access & plant|Forklift 2.5T',co:'Coates',no:'test1'},{id:'sp2',type:'Other|Toilet',co:'Coates',no:'test2'}],cos:{Supplier:{at:1,spare:0}},twice:[],offOn:[],quantityIssues1012:[{ref:'A'},{ref:'D'}]});
const before=JSON.stringify({assets,inventory}),view=G.inventoryView(inventory,{tab:'plant',group:G.ACCESS,assets});
check('all display groups preserve source object',()=>assert.equal(JSON.stringify({assets,inventory}),before));
check('other tabs retain inventory identity',()=>assert.equal(G.inventoryView(inventory,{tab:'pricing',group:G.ACCESS,assets}),inventory));
check('other groups retain inventory identity',()=>assert.equal(G.inventoryView(inventory,{tab:'plant',group:'Generators',assets}),inventory));
check('focused refs exact no other group leakage',()=>assert.deepEqual(view.list.flatMap(r=>Object.keys(r.refs)).sort(),['A','B','E']));
check('subset row sums match selected refs',()=>assert.deepEqual([view.list[0].asked,view.list[0].on,view.list[0].remaining1017],[1,1,0]));
check('business inventory keys unchanged',()=>assert.deepEqual(view.list.map(r=>[r.type,r.disc]),inventory.list.slice(0,3).map(r=>[r.type,r.disc])));
check('subhire remains attributed',()=>assert.deepEqual(view.cos,{Supplier:{at:1,spare:0}}));
check('spares correctly scoped',()=>assert.deepEqual(view.spares.map(s=>s.id),['sp1']));
check('quantity issues correctly scoped',()=>assert.deepEqual(view.quantityIssues1012,[{ref:'A'}]));
check('query and light intersect group scope',()=>assert.deepEqual(G.inventoryView(inventory,{tab:'plant',group:G.ACCESS,assets,matches:a=>a.key!=='A',light:a=>a.key!=='E'}).list.flatMap(r=>Object.keys(r.refs)),['B']));
// Financial projections deliberately consume untouched discipline and item keys.
const charge=a=>a.item_types.map(item=>({item,discipline:a.discipline}));
const moneyProjection=a=>({lines:charge(a),rateKeys:charge(a).map(l=>l.discipline+'|'+l.item),labourKeys:charge(a).map(l=>a.key+'|'+l.discipline+'|'+l.item+'|install'),basis:a.discipline==='Access & plant'?'from_delivery':'event_only',identity:a.key,product:a.product});
const financeBefore=assets.map(moneyProjection);assets.forEach(G.group);G.inventoryView(inventory,{tab:'plant',group:G.ACCESS,assets});
check('financial and identity projections unchanged',()=>assert.deepEqual(assets.map(moneyProjection),financeBefore));
global.Inventory1017={outstanding:()=>[{key:'A'},{key:'B'},{key:'C'},{key:'D'},{key:'E'}]};
check('native outstanding fallback cannot leak other groups',()=>assert.deepEqual(G.outstanding(view,'*').map(x=>x.key),['A','B','E']));
check('unfocused pending behavior unchanged',()=>assert.equal(G.outstanding(inventory,'*').length,5));
check('unknown count is excluded with explicit native correction issue, never changed into a zero row',()=>{
 const unknown=structuredClone(inventory);unknown.list[0].refs.A.asked=null;
 const result=G.inventoryView(unknown,{tab:'plant',group:G.ACCESS,assets});
 assert.equal(result.list.some(r=>Object.hasOwn(r.refs,'A')),false);
 assert.ok(result.quantityIssues1012.some(r=>r.ref==='A'&&r.item==='Forklift 5T'));
 assert.equal(unknown.list[0].refs.A.asked,null);
});
check('native noFallback argument preserved',()=>{let seen;global.Inventory1017={outstanding:(I,d,n)=>{seen=n;return [];}};G.outstanding(view,'*',true);assert.equal(seen,true);});
console.log(JSON.stringify({pass:true,checks}));
