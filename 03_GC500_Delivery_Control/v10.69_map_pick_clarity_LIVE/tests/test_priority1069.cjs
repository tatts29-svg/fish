/* Author: Andrew Fisher. Execute the actual patched hit wrapper against independent screen fixtures.
   PAGE points at a locally built candidate. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const page=fs.readFileSync(process.env.PAGE,'utf8'),helpers=fs.readFileSync(path.join(__dirname,'../map_pick1069_src.js'),'utf8');
const runtime=page.slice(page.indexOf('  function keptInk1069('),page.indexOf('window.itemAt887 = function',page.indexOf('  function keptInk1069(')));
assert(runtime.length>100,'actual patched runtime found');
let n=0;
function test(name,run){const c={console,Math,Map,Set,SNAP:{},selected:null,marks:[],labelBounds1010:[],doneShaped:[],keptDone1069:[],sw:390,sh:844,activeFence:false};c.window=c;
 Object.assign(c,{fencing:()=>c.activeFence,currentView:()=>({scale:1}),sheetToDevice:()=>null,toGeo:(x,y)=>({x,y}),applyM:(_,x,y)=>({x,y}),shapeFor:it=>it?.shape||null,mapStatus1009:it=>it.status||{shape:'circle'},labelHit1010:(x,y)=>{const b=[...c.labelBounds1010].reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);return b?{it:b.it}:null;},hit:(x,y,list)=>{const m=list.find(m=>m.it.shape&&x>=m.it.shape.x&&x<=m.it.shape.x+m.it.shape.w&&y>=m.it.shape.y&&y<=m.it.shape.y+m.it.shape.h);return m||null;},nativeMarkAt:(x,y)=>{const m=c.marks.find(m=>Math.hypot(x-(m.it.places[0][0]+m.it.places[0][2])/2,y-(m.it.places[0][1]+m.it.places[0][3])/2)<=16.8);return m||c.labelHit1010(x,y);}});
 vm.createContext(c);vm.runInContext(helpers+'\n'+runtime,c);run(c);n++;console.log('PASS '+name)}
const keep={code:'K',places:[[0,0,0,0]],cat:{c:'#fff'}};
const shape={code:'S',places:[[16,0,16,0]],cat:{c:'#fff'},shape:{x:10,y:-6,w:12,h:12}};
test('visible shape defeats another marker’s 20% padding',c=>{c.marks=[{it:keep},{it:shape}];assert.equal(c.markAt(16,0).it.code,'S')});
test('actual kept badge wins when it visibly covers a shape',c=>{c.marks=[{it:keep},{it:shape}];assert.equal(c.markAt(10.5,0).it.code,'K')});
test('actual marker ring wins over underlying shape',c=>{c.marks=[{it:keep},{it:shape}];assert.equal(c.markAt(14,0).it.code,'K')});
test('transparent gap inside circle ring lets visible shape win',c=>{c.marks=[{it:keep},{it:shape}];assert.equal(c.markAt(12.4,0).it.code,'S')});
test('Done-only shape is checked before active badge padding',c=>{c.marks=[{it:keep}];c.doneShaped=[[{it:shape,done:true},{}]];assert.equal(c.markAt(16,0).it.code,'S')});
test('Done-only shape remains selected through its visible geometry',c=>{c.marks=[];c.doneShaped=[[{it:shape,done:true},{}]];c.selected=shape;assert.equal(c.markAt(16,0).it.code,'S')});
test('stale selected but hidden shape is not an invisible tap target',c=>{c.marks=[];c.selected=shape;assert.equal(c.markAt(16,0),null)});
test('finger padding remains useful where there is no visible shape',c=>{c.marks=[{it:keep}];assert.equal(c.markAt(16,0).it.code,'K')});
test('visible kept label keeps a tap target',c=>{c.marks=[{it:keep}];c.labelBounds1010=[{it:keep,x:30,y:30,w:20,h:10}];assert.equal(c.markAt(35,35).it.code,'K')});
test('topmost painted kept marker wins actual ink overlap',c=>{const other={...keep,code:'K2'};c.marks=[{it:keep},{it:other}];assert.equal(c.markAt(0,0).it.code,'K2')});
test('kept Done badge remains selectable at its unscaled boundary',c=>{c.keptDone1069=[keep];assert.equal(c.markAt(16,0).it.code,'K')});
test('native fencing hit behaviour is unchanged',c=>{c.activeFence=true;c.marks=[{it:keep},{it:shape}];assert.equal(c.markAt(16,0).it.code,'K')});
test('mark and label arrays are retained after hit evaluation',c=>{const marks=c.marks=[{it:keep},{it:shape}],labels=c.labelBounds1010=[{it:keep,x:30,y:30,w:20,h:10}];c.markAt(16,0);assert.equal(c.marks,marks);assert.equal(c.labelBounds1010,labels)});
console.log(`${n}/${n} priority regressions passed`);
