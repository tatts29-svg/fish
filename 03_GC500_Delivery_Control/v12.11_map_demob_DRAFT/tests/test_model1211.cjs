/* Author: Andrew Fisher. Quantity, identity, owner and stale-source boundaries, using synthetic data. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');let n=0;
const assets=[{key:'TEST1'},{key:'TEST2'},{key:'TEST3'},{key:'REMOVED'}],units={TEST1:[{id:'a',owner:'coates',item:'FWF',physical:true,assetNo:'EXAMPLE-A'},{id:'b',owner:'event-portables',item:'FWF',physical:true,assetNo:'EXAMPLE-B'},{id:'c',owner:'coates',item:'Generator',physical:true,assetNo:'EXAMPLE-C'}],TEST2:[{id:'d',owner:'coates',item:'FWF',physical:true,assetNo:''}],TEST3:[{id:'used',owner:'coates',item:'FWF',physical:true,assetNo:'EXAMPLE-D'}],REMOVED:[{id:'z',owner:'coates',item:'FWF',physical:true,assetNo:'EXAMPLE-Z'}]};
const snapshots={};for(const a of assets)snapshots[a.key]={key:a.key,r:{a,empty:true,emptied:false},reading:{arrival:{at:'example'},remaining:[{type:'FWF',n:4}],issues:[],unknown:false,events:a.key==='TEST3'?[{items:[{unitIds:['used']}]}]:[]},record:{state:'on site'},pools:{fwf:units[a.key].filter(u=>u.item==='FWF'&&u.assetNo).map(u=>u.id)},identities:Object.fromEntries(units[a.key].map(u=>[u.id,{id:u.id,number:u.assetNo,owner:u.owner,item:u.item}])),token:'original'};
const noop=()=>{},ctx={window:{MapArea1206:{metadata:()=>({loading:[]})},DemobCollection996:{snapshot:k=>snapshots[k]}},document:{querySelector:()=>null},setTimeout:noop,allAssets:()=>assets,rowOff:k=>k==='REMOVED',movedAway:()=>false,gcUnits925:a=>units[a.key],holdAssets:f=>f()};ctx.window.window=ctx.window;
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../demob1211_parent.js'),'utf8'),ctx);const H=ctx.window.MapDemob1211;
function test(name,f){f();console.log('PASS '+name);n++;}
const pick=(over={})=>{const r=H.reference('TEST1');return [{key:r.key,token:r.token,items:[{type:'FWF',ids:['a'],unidentified:1}],...over}];};
test('mixed-owner reference retains each physical owner',()=>assert.deepEqual(Array.from(H.reference('TEST1').items[0].units,u=>u.owner),['coates','event-portables']));
test('only Coates FWFs remain, including unnumbered; removed and collected excluded',()=>assert.deepEqual(Array.from(H.coatesFWF(),r=>r.key),['TEST1','TEST2']));
test('pump-out hold accompanies pickup selection',()=>assert(H.validate(pick())[0].hold.some(x=>x.includes('Pump-out'))));
test('quantity equals numbered plus selected unidentified units',()=>assert.equal(H.validate(pick())[0].items[0].n,2));
test('unidentified quantity cannot exceed remaining numberless pool',()=>assert.throws(()=>H.validate(pick({items:[{type:'FWF',ids:[],unidentified:3}]}))));
test('cannot duplicate an asset identity',()=>assert.throws(()=>H.validate(pick({items:[{type:'FWF',ids:['a','a']}]}))));
test('cannot borrow an asset from another reference',()=>assert.throws(()=>H.validate(pick({items:[{type:'FWF',ids:['d']}]}))));
test('negative and fractional quantities rejected',()=>{for(const q of [-1,.5,Infinity])assert.throws(()=>H.validate(pick({items:[{type:'FWF',ids:[],unidentified:q}]})));});
test('duplicate item categories rejected',()=>assert.throws(()=>H.validate(pick({items:[{type:'FWF',ids:['a']},{type:'FWF',ids:['b']}]}))));
test('duplicate references rejected',()=>{const a=pick();assert.throws(()=>H.validate(a.concat(a)));});
test('empty selection rejected',()=>assert.throws(()=>H.validate(pick({items:[]}))));
test('changed source token rejects prepared selection',()=>{const a=pick();snapshots.TEST1.token='new';assert.throws(()=>H.validate(a));});
test('cleared hold also invalidates old export',()=>{const a=pick();snapshots.TEST1.r.emptied=true;assert.throws(()=>H.validate(a));});
test('unknown quantities and missing arrival remain explicit',()=>{snapshots.TEST1.reading.unknown=true;snapshots.TEST1.reading.arrival=null;assert.equal(H.reference('TEST1').hold.length,2);});
console.log(n+'/'+n);
