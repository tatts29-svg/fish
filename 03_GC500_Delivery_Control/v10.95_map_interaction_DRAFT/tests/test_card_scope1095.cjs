/* Author: Andrew Fisher. The existing card text distinguishes a reference destination from unit locations. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.PAGE||process.argv[2],'utf8');
const start=html.indexOf('window.gc500PlanCard = function(key){'),end=html.indexOf('\n/* the explorer, from anywhere',start);
assert(start>0&&end>start);
let approved=true,quantities=[1,1];
const context={window:{gc500MapStatus1009:()=>({states:[{key:'X1',quantity:{items:quantities.map(quantity=>({quantity}))}}]})},
 allAssets:()=>[{key:'X1',name:'Test item',asset_numbers:['001','002']}],deliveryView:()=>({semantic:'on site'}),
 satBoardPins:()=>[{key:'X1',by:'Site recorder'}],andrewPin1084:()=>approved?{place:{lat:-20,lon:120}}:null,
 gate6Revision1021:()=>null,ItemOwnership969:{text:()=>''}};
vm.createContext(context);vm.runInContext(html.slice(start,end),context);
const card=()=>context.window.gc500PlanCard('X1');
assert.equal(card().pinned,'Reference location · individual units may be elsewhere.');
assert.equal(card().assets,'001, 002','All physical identities remain');
quantities=[2];assert.match(card().pinned,/individual units/,'Quantity-only multi-unit scope is covered');
quantities=[1];assert.equal(card().pinned,'Pinned on the ground by Site recorder','Single-unit wording is unchanged');
quantities=[null];assert.equal(card().pinned,'Pinned on the ground by Site recorder','Unknown quantity is not invented');
quantities=[1,1];approved=false;assert.equal(card().pinned,'Pinned on the ground by Site recorder','Legacy ground-pin wording is unchanged');
console.log('PASS approved multi-unit reference note, single-unit/legacy wording and identity preservation');
