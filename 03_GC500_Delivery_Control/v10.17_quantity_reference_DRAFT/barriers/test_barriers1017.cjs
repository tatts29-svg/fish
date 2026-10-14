// Author: Andrew Fisher. Reinstatement classification fixtures; no live writes.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'barriers1017.js'),'utf8'),ctx);
const assets=[
 {key:'WB02',events:[{task_id:'T0045',activity:'Install',item:'TL2',quantity_raw:34}]},
 {key:'WB03',events:[{task_id:'T0040',activity:'Install',item:'TL2',quantity_raw:30}]},
 {key:'WB19',events:[{task_id:'T0217',activity:'Reinstate',item:'TL2',quantity_raw:34}],lines:[{item:'TL2',qty:34}],date:'2026-11-02'},
 {key:'WB20',events:[{task_id:'T0178',activity:'Reinstate',item:'TL2',quantity_raw:30}],lines:[{item:'TL2',qty:30}],date:'2026-10-26'}
];
ctx.assetOf=key=>assets.find(a=>a.key===key);ctx.allAssets=()=>assets;ctx.chargeLines=a=>a.lines||[];ctx.qtyOf=l=>l.qty;ctx.effectiveDates=a=>({in:a.date});ctx.esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');ctx.fmtDate=v=>v;
let count=0;const check=(label,fn)=>{fn();count++;};const clone=v=>JSON.parse(JSON.stringify(v));
check('Both verified original Reinstate operations classify',()=>assert.equal(ctx.waterBarrierPlacements1017().length,2));
check('Current source total is64',()=>assert.equal(ctx.waterBarrierPlacements1017().reduce((s,r)=>s+r.quantity,0),64));
check('WB19 maps to original WB02 workfront',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2]).sourceRef,'WB02'));
check('WB20 maps to original WB03 workfront',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[3]).sourceRef,'WB03'));
check('Model retains both original refs and repeat refs',()=>assert.equal(assets.length,4));
check('Initial supply is not reinstatement',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[0]),null));
check('No generic fuzzy matching of keys',()=>assert.equal(ctx.waterBarrierPlacement1017({...assets[2],key:'WB21'}),null));
check('Cancelled work is excluded',()=>assert.equal(ctx.waterBarrierPlacement1017({...assets[2],_cancelled:true}),null));
check('Already recorded relocation remains separately managed',()=>assert.equal(ctx.waterBarrierPlacement1017({...assets[2],relocation:true}),null));
for (const [field,value] of [['task_id','T9999'],['activity','Install'],['item','Generator'],['quantity_raw',35]]) {
 check('Changed source '+field+' is not silently reused',()=>{const a=clone(assets[2]);a.events[0][field]=value;assert.equal(ctx.waterBarrierPlacement1017(a),null);});
}
check('Duplicate source operations are rejected',()=>{const a=clone(assets[2]);a.events.push({...a.events[0]});assert.equal(ctx.waterBarrierPlacement1017(a),null);});
check('Missing original supply does not invent lineage',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{sourceAsset:{events:[]}}),null));
check('Changed original source is rejected',()=>{const source=clone(assets[0]);source.events[0].quantity_raw=33;assert.equal(ctx.waterBarrierPlacement1017(assets[2],{sourceAsset:source}),null);});
check('Current quantity edits feed placement model',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{lines:[{item:'TL2',qty:35}]}).quantity,35));
check('Current date edits feed placement model',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{dates:{in:'2026-11-03'}}).date,'2026-11-03'));
check('Multiple same-item current lines sum once',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{lines:[{item:'TL2',qty:30},{item:'TL2',qty:4}]}).quantity,34));
for(const quantity of [-1,NaN,Infinity,1.5,null])check('Invalid unit quantity is not silently counted '+quantity,()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{lines:[{item:'TL2',qty:quantity}]}),null));
check('Mixed equipment never converted to barriers',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{lines:[{item:'TL2',qty:34},{item:'Building',qty:1}]}),null));
check('Zero means no units, not one',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{lines:[{item:'TL2',qty:0}]}).quantity,0));
check('Empty current quantity lines excluded',()=>assert.equal(ctx.waterBarrierPlacement1017(assets[2],{lines:[]}),null));
check('All input records remain byte-identical',()=>{const before=JSON.stringify(assets);ctx.waterBarrierPlacements1017();assert.equal(JSON.stringify(assets),before);});
check('Note links current workfront and original ref',()=>{const html=ctx.waterBarrierPlacementsNote1017();assert.match(html,/data-open="WB19"/);assert.match(html,/data-open="WB02"/);assert.match(html,/Reinstatement work · 64 barriers/);assert.match(html,/<details><summary>More info/);});
check('Print does not contain unusable app buttons',()=>assert.doesNotMatch(ctx.waterBarrierPlacementsNote1017(undefined,true),/<button/));
check('No receipt or cost fields invented',()=>{const r=ctx.waterBarrierPlacement1017(assets[2]);for(const key of ['onsite','done','received','cost','hire','rate','transfer'])assert.equal(Object.hasOwn(r,key),false);});
console.log(JSON.stringify({author:'Andrew Fisher',checksPassed:count}));
