/* Author: Andrew Fisher. Adversarial attribution tests. */
const assert=require('node:assert/strict'),F=require('../finance928.js');let n=0;
function check(name,f){f();n++;console.log('PASS '+name);}
const lines=[{item:'Accessible Toilet',qty:1,transport_cost:325},{item:'16Pan Block',qty:2,transport_cost:329}];
check('accessible-only demand excludes blocks',()=>assert.equal(F.demand({item:'Accessible Toilet',quantity_display:'1'},lines).amount,325));
check('blocks demand uses only block count',()=>assert.equal(F.demand({item:'16Pan Block',quantity_raw:2},lines).amount,658));
check('unknown block rate never borrows FWF rate',()=>assert.equal(F.demand({item:'Toilet Block 6m',quantity_raw:2},[{item:'FWF',qty:4,transport_cost:35},{item:'Toilet Block 6m',qty:2,transport_cost:null}]).known,false));
for(const raw of [null,'blank','2 blocks',-1,Infinity])check('quantity refuses '+raw,()=>assert.equal(F.demand({item:'16Pan Block',quantity_raw:raw},lines).known,false));
check('excess quantity held',()=>assert.equal(F.demand({item:'16Pan Block',quantity_raw:3},lines).known,false));
check('explicit zero rate is known',()=>assert.deepEqual(F.demand({item:'X',quantity_raw:1},[{item:'X',qty:1,transport_cost:0}]).known,true));
check('duplicate item prices held',()=>assert.equal(F.demand({item:'X',quantity_raw:1},[{item:'X',transport_cost:2},{item:'X',transport_cost:3}]).known,false));
const row={asset_no:'12',asset_no_is_plant_number:true,match:{key:'WC31'}};
check('plant number removes blanket EP label',()=>assert.equal(F.owner(row,[]).owner,'coates'));
check('explicit physical supplier wins',()=>assert.equal(F.owner(row,[{ref:'WC31',assetNo:'12',owner:'event-portables',physical:true}]).rehire,true));
check('cross-owner ambiguity held',()=>assert.equal(F.owner(row,[{ref:'WC31',assetNo:'12',owner:'coates',physical:true},{ref:'WC31',assetNo:'12',owner:'event-portables',physical:true}]).owner,'unknown'));
check('other reference cannot transfer ownership',()=>assert.equal(F.owner(row,[{ref:'WC09',assetNo:'12',owner:'event-portables',physical:true}]).owner,'coates'));
check('placeholder supplier is not confirmation',()=>assert.equal(F.owner({asset_no:'12'},[{assetNo:'12',owner:'other:supplier-not-named',physical:true}]).owner,'unknown'));
check('explicit SUB supplier preserved',()=>assert.equal(F.owner({subhired:true,supplier_sub_rental:'Supplier A'},[]).rehire,true));
check('unidentified toilet is not assumed supplier',()=>assert.equal(F.owner({},[]).owner,'unknown'));
check('repeated same-leg quantities cannot double the reference demand',()=>assert(F.loadDemands([{leg:'inbound',e:{item:'Accessible Toilet',quantity_raw:1}},{leg:'inbound',e:{item:'Accessible Toilet',quantity_raw:1}}],lines).every(x=>!x.known)));
check('different transport legs retain their own demand',()=>assert(F.loadDemands([{leg:'inbound',e:{item:'Accessible Toilet',quantity_raw:1}},{leg:'demob',e:{item:'Accessible Toilet',quantity_raw:1}}],lines).every(x=>x.known)));
console.log(n+' meaningful assertions passed');
