// Author: Andrew Fisher. Restored identity uses the existing rate and honours current completion exclusions.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(process.env.PAGE,'PAGE must identify the patched candidate');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const segment=(from,to)=>{const a=html.indexOf(from),b=html.indexOf(to,a);assert(a>=0&&b>a,from+' source unavailable');return html.slice(a,b);};
let oldAsset=null,moved=false,asset={key:'GN20-A',discipline:'Generators',asset_numbers:['1276701']};
let units=[{physical:true,owner:'coates',assetNo:'1276701',identityReview:''}];
const source={rental_contract:'9961976',line:6,kind:'generator',branch_code:'NVAC',quantity:1,asset_no:'1276701',match:{key:'GN20-A'},charge_line:false,subhired:false};
let rows=[source],labourUnits=[];
const key=(ref,disc,item,line,unit)=>[ref,disc,item,line,...(unit?[unit]:[])].join('|');
const ctx=vm.createContext({console,Number,Set,Map,JSON,assetOf:ref=>ref==='GN20'?oldAsset:ref==='GN20-A'?asset:null,
 gcModel925:(a,opts)=>{assert.equal(opts.loading,false);return {rows:units};},movedAway:()=>moved,ONHIRE_ROWS:rows,
 money:v=>'$'+v.toFixed(2),esc:String,labourKey:key,labourUnits:()=>labourUnits,LAB_REST:'rest',labourRestN:()=>0,
 S:{labour:{[key('GN20-A','Generators','350kva','install')]:true},stamps:{['labour/'+key('GN20-A','Generators','350kva','install')]:'2026-09-30T12:40:02.909Z'}}});
ctx.window={};
vm.runInContext(segment('const GN20_INSTALL746 = Object.freeze({','/* v10.32 - the labour'),ctx);
vm.runInContext(segment('function labourKeep1032(','function labourLinesFor914base('),ctx);
vm.runInContext(segment("(function(root){'use strict';\n const automatic=new Set", "if(typeof window!=='undefined'){\n // The existing generator convention"),ctx);
vm.runInContext(segment(' const priorGn20Basis1006=gn20Install746;',' const manualMoney1006=labourMoney914base;'),ctx);
vm.runInContext(segment(' function takenOff1052(a,l){',' window.takenOff1052='),ctx);
const line={item:'350kva',discipline:'Generators',quantity:1};
const basis=()=>ctx.gn20Install746('GN20-A','Generators','350kva',{lines:[]});
const calc=(received=1,recorded={install:1})=>ctx.window.OnsiteCharges1006.project({ordered:1,received,
 lines:basis().lines.filter(l=>ctx.labourKeep1032('350kva','Generators').has(l.key)),recorded,
 off:ctx.takenOff1052(asset,line),relocation:false});
const nativeState=JSON.stringify(ctx.S);
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
check('restored physical and source identity receives the existing approved install component once',()=>{
 assert.equal(ctx.restoredGeneratorIdentity1224('GN20-A'),true);
 const p=calc();assert.equal(p.total,166.56);assert.equal(p.rows.length,1);assert.equal(p.rows[0].key,'install');
 assert.equal(p.rows[0].qty,1);assert.equal(p.rows[0].rate,166.56);
 assert.equal(JSON.stringify(ctx.S),nativeState);assert.equal(JSON.stringify(rows),JSON.stringify([source]));
});
check('existing old reference behaviour and unrelated generator identities remain unchanged',()=>{
 assert.equal(ctx.gn20Install746Matches('GN20','Generators','350kva'),true);
 for(const ref of ['GN20-B','GN21','GN23'])assert.equal(ctx.gn20Install746Matches(ref,'Generators','350kva'),false);
 for(const args of [['GN20-A','Other','350kva'],['GN20-A','Generators','200kva']])assert.equal(ctx.gn20Install746Matches(...args),false);
});
check('wrong, ambiguous or duplicate physical identities cannot inherit the approved rate',()=>{
 const original=units;
 for(const value of [[],[...original,...original],[{...original[0],physical:false}],[{...original[0],owner:'subhire'}],[{...original[0],assetNo:'OTHER'}],[{...original[0],identityReview:'review'}]]){
  units=value;assert.equal(ctx.restoredGeneratorIdentity1224('GN20-A'),false);assert.equal(calc().total,0);
 }
 units=original;
});
check('changed source allocation cannot inherit the approved identity',()=>{
 for(const change of [{rental_contract:'OTHER'},{line:7},{asset_no:'OTHER'},{branch_code:'KINP'},{quantity:2},{kind:'building'},{match:{key:'GN20'}},{charge_line:true},{subhired:true}]){
  ctx.ONHIRE_ROWS=[{...source,...change}];assert.equal(ctx.restoredGeneratorIdentity1224('GN20-A'),false);
 }
 ctx.ONHIRE_ROWS=[source,source];assert.equal(ctx.restoredGeneratorIdentity1224('GN20-A'),false);ctx.ONHIRE_ROWS=rows;
});
check('cancelled, relocated or duplicated active references cannot count again',()=>{
 const original=asset;
 for(const change of [{_cancelled:true},{rest_of:'GN20'},{relocation:true},{discipline:'Other'}]){
  asset={...original,...change};assert.equal(ctx.restoredGeneratorIdentity1224('GN20-A'),false);
 }
 asset=original;oldAsset={key:'GN20'};assert.equal(ctx.restoredGeneratorIdentity1224('GN20-A'),false);oldAsset=null;
 moved=true;assert.equal(ctx.restoredGeneratorIdentity1224('GN20-A'),false);moved=false;
});
check('an explicit whole-reference untick removes the automatic arrival charge',()=>{
 const original=ctx.S;ctx.S={labour:{},stamps:{['labour/'+key('GN20-A','Generators','350kva','install')]:'later'}};
 const before=JSON.stringify(ctx.S),p=calc(1,{});assert.equal(p.total,0);assert.equal(p.rows[0].forecastValue,0);
 assert.equal(JSON.stringify(ctx.S),before);ctx.S=original;
});
check('an explicit per-unit untick also remains effective',()=>{
 const original=ctx.S;labourUnits=['1276701'];
 ctx.S={labour:{},stamps:{['labour/'+key('GN20-A','Generators','350kva','install','1276701')]:'later'}};
 const p=calc(1,{});assert.equal(p.total,0);assert.equal(p.rows[0].takenOff1052,1);
 ctx.S=original;labourUnits=[];
});
check('unreceived and unrecorded work remains a forecast without recording an arrival',()=>{
 const original=ctx.S;ctx.S={labour:{},stamps:{}};const p=calc(0,{});
 assert.equal(p.total,0);assert.equal(p.rows[0].forecastValue,166.56);assert.equal(p.rows[0].automatic,false);
 ctx.S=original;
});
check('visible approved-rate notice states install only and does not claim completion',()=>{
 const info=basis(),markup=ctx.gn20Install746Notice(asset,line,info),text=markup.replace(/<[^>]*>/g,'');
 assert.match(text,/Install \$166\.56 ex GST/);assert.match(text,/Generator demob labour is not charged/);
 assert(!/Demob \$/.test(text));assert.match(text,/explicit untick control inclusion/);
 assert(!info.lines.some(l=>l.key==='demob'));assert.equal(JSON.stringify(ctx.S),nativeState);
});
console.log(JSON.stringify({passed:checks,failed:0,record_writes:0,network:false}));
