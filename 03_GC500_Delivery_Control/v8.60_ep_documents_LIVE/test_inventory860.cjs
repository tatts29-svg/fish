// Author: Andrew Fisher. Synthetic supplier identities and location semantics; no network or record writes.
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const A=[{key:'WC01'},{key:'WC02'},{key:'WC03'},{key:'WC04'},{key:'WC05'},{key:'WC06'},{key:'WC07',_cancelled:true}];
const U={WC01:[['Event Portables','0004'],['Event Portables','0005']],WC02:[['Event Portables Australia','0004']],WC03:[['Event Portables','0010']],WC04:[['Event Portables','0020']],WC05:[['Another supplier','0004']],WC06:[],WC07:[['Event Portables','0099']]};
const ctx={Map,Set,Number,String,Math,Object,Array,Date,JSON,console,S:{units:{}},CROW:new Map(),todayIso:()=> '2026-10-05',allAssets:()=>A,
 subOf:k=>(U[k]||[]).map(([co,no])=>({co,no,u:{asset_no:no,label:'Sub-hire: '+co}})),subhireCo:k=>k==='WC06'?'Event Portables':'',
 chargeLines:a=>a.key==='WC04'?[{item:'Accessible Toilet',qty:1},{item:'16Pan Block',qty:2}]:[{item:'FWF',qty:2}],qtyOf:l=>l.qty,itemNumbersOf:()=>null,
 itemRows:a=>a.key==='WC04'?[{asked:'Accessible Toilet',qty_supplied:0},{asked:'16Pan Block',qty_supplied:1}]:[],
 whereText:a=>({main:'Recorded location '+a.key,also:'master plan: beside a recorded landmark'}),dest782:a=>({kind:a.key==='WC03'?'report':'master',ll:{lat:-27,lon:153}}),navUrl:ll=>'https://www.google.com/maps/dir/?api=1&destination='+ll.lat+','+ll.lon,
 deliveryView:()=>({short:'On site'}),invOnSite:()=>true,spareList:()=>[{id:'one',no:'0030',co:'Event Portables',type:'Toilets|FWF',note:'Pit Lane'}],invTypeWord:s=>s.split('|')[1],
 EP819:{prepared:'2026-10-03',quote:{quote:'Qtest',rows:[{item:'FWF',no_wc_allocation:3,note:'planned only'}]}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/ep860_inventory.js','utf8'),ctx);const before=JSON.stringify({A,U});const model=ctx.epInventory860();
assert.equal(model.summary.numbered,6);assert.equal(model.summary.locationConflicts,1);assert.equal(model.summary.scopeGaps,1);assert.equal(model.summary.spares,1);assert.equal(model.summary.planning.unallocated[0].qty,3);
assert.equal(model.rows.find(r=>r.assetNo==='0004').qty,1);assert.equal(model.rows.find(r=>r.assetNo==='0004').url,'');assert.equal(model.rows.filter(r=>r.assetNo==='0004').length,1);
assert.equal(model.rows.find(r=>r.assetNo==='0010').url,'');assert(model.rows.find(r=>r.assetNo==='0010').warning.includes('reporting point'));
assert.equal(model.rows.find(r=>r.assetNo==='0020').description,'16Pan Block');assert.equal(model.rows.find(r=>r.assetNo==='0030').url,'');assert(!model.rows.some(r=>r.ref==='WC05'));
assert.equal(model.rows.find(r=>r.ref==='WC06').qty,null);assert(model.rows.find(r=>r.ref==='WC07').status.includes('Cancelled'));
assert(model.rows.find(r=>r.assetNo==='0005').location.includes('beside a recorded landmark'));assert(model.rows.find(r=>r.assetNo==='0005').location.includes('-27.000000, 153.000000'));assert(!model.rows.find(r=>r.assetNo==='0010').location.includes('beside a recorded landmark'));
assert.equal(model.summary.units,6);assert.equal(model.summary.onSite,4);assert.equal(JSON.stringify({A,U}),before);assert(model.rows.every(r=>!Object.keys(r).some(k=>k.startsWith('_'))));
// A missing schedule reference and individually recorded unnumbered units remain visible.
U.ORPHAN=[['Event Portables','0900']];ctx.CROW.set('ORPHAN',{units:[{asset_no:'0900'}]});
A.push({key:'WC08'});U.WC08=[['Event Portables',''],['Event Portables','']];
let extra=ctx.epInventory860();assert.equal(extra.rows.filter(r=>r.ref==='WC08').length,2);assert.equal(extra.summary.unnumbered,2);
assert.equal(extra.rows.find(r=>r.ref==='ORPHAN').url,'');assert.equal(extra.rows.find(r=>r.ref==='ORPHAN').status,'Reference needs review');
// One spare number at two different recorded locations is a conflict, never a chosen location.
ctx.spareList=()=>[{id:'first',no:'0077',co:'Event Portables',type:'Toilets|FWF',note:'North compound'},
{id:'second',no:'0077',co:'Event Portables Australia',type:'Toilets|FWF',note:'South compound'},
{id:'other-owner',no:'0077',co:'Another supplier',type:'Toilets|FWF',note:'Other compound'}];
extra=ctx.epInventory860();const conflict=extra.rows.filter(r=>r.assetNo==='0077');assert.equal(conflict.length,1);assert.equal(conflict[0].qty,1);
assert.equal(conflict[0].status,'Location conflict — check record');assert.equal(conflict[0].url,'');assert(conflict[0].location.includes('North compound'));assert(conflict[0].location.includes('South compound'));assert(!conflict[0].location.includes('Other compound'));
assert.equal(extra.summary.locationConflicts,2);assert.equal(extra.summary.spares,0);
// Printed grouping preserves individual fleet numbers and unknown scope quantities.
ctx.document={addEventListener(){}};
vm.runInContext(fs.readFileSync(__dirname+'/ep860_documents.js','utf8'),ctx);
const grouped=ctx.epInventoryGroups860({rows:[
 {ref:'WC01',assetNo:'0005',description:'FWF',location:'A',status:'On site',url:'https://example.com/a',locationBasis:'Master',warning:'',qty:1},
 {ref:'WC01',assetNo:'0004',description:'FWF',location:'A',status:'On site',url:'https://example.com/a',locationBasis:'Master',warning:'',qty:1},
 {ref:'WC06',assetNo:'',description:'Scope',location:'B',status:'Unconfirmed',url:'',locationBasis:'Unconfirmed',warning:'',qty:null}
]});
assert.equal(grouped.length,2);assert.equal(grouped[0].qty,2);assert.equal(grouped[0].assetNo,'0004, 0005');assert.equal(grouped[1].qty,null);
console.log('PASS Event Portables inventory identities, leading zeros, duplicate references/spares, type evidence, supplier filtering, orphan/unnumbered scope, QR semantics, print grouping and source preservation');
