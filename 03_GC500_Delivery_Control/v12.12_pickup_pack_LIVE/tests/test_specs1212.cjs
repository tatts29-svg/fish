/* Author: Andrew Fisher. Do not turn catalogue limits, stale records or another asset into transport facts. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
let actual={lengthMm:6100,widthMm:2500,heightMm:2900,massKg:3210,model:'Example model',configuration:'Empty transport configuration'},info;
const units=[{id:'a',assetNo:'A-1',physical:true},{id:'b',assetNo:'B-2',physical:true}],context={window:{Loading931:{unitsFor:()=>units,info931:(a,item,u)=>({...info,unit:u})}},assetOf:key=>({key}),holdAssets:f=>f(),DATA:{rental_on_hire:{rows:[]}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../pickup1212_specs.js'),'utf8'),context);const api=context.window.MapPickupSpecs1212,checks=[];
function check(name,value){assert(value,name);checks.push({name,ok:true});}
const verified={unit:units[0],recordCurrent:true,actualVerified:true,record:{actual}};
check('verified transport size and mass retain recorded metric values',api.describe(verified).join(' ').includes('6,100 x 2,500 x 2,900 mm')&&api.describe(verified).join(' ').includes('3,210 kg'));
check('recorded model and transport configuration accompany actual values',api.describe(verified).join(' ').includes(actual.configuration));
check('stale identity cannot supply actual weight',!api.describe({...verified,recordCurrent:false}).join(' ').includes('3,210'));
check('unverified record cannot supply actual weight',!api.describe({...verified,actualVerified:false}).join(' ').includes('3,210'));
check('no physical identity means no actual values',!api.describe({...verified,unit:null}).join(' ').includes('3,210'));
check('catalogue weight and restraint limit are never an actual mass',!api.describe({facts:[{label:'Guide reference',values:['700 kg','12 m x 3 m'] }]}).join(' ').includes('700 kg'));
const nominal=api.describe({facts:[{label:'Contract-listed footprint',values:['6000 x 3000 mm']}]});check('contract footprint remains labelled and missing weight stays explicit',nominal.join(' ').includes('Contract-listed footprint')&&nominal.join(' ').includes('not verified transport size')&&nominal.join(' ').includes('weight per unit: not recorded'));
check('unknown dimensions use question marks and never zero',api.describe(null).join(' ').includes('? x ? x ? mm')&&!api.describe(null).join(' ').includes('0 kg'));
info={recordCurrent:true,actualVerified:true,record:{actual}};const rows=[{key:'EXAMPLE',items:[{type:'Example building',n:1,units:[{id:'a',number:'A-1'}],unidentified:0}]}],read=api.read(rows);
check('only the selected physical asset appears in the specification group',JSON.stringify(read).includes('Asset A-1')&&!JSON.stringify(read).includes('B-2'));
const bad=[{key:'EXAMPLE',items:[{type:'Example building',n:1,units:[{id:'a',number:'B-2'}],unidentified:0}]}];check('mismatched number does not borrow another unit specification',!JSON.stringify(api.read(bad)).includes('3,210'));
const unknown=[{key:'EXAMPLE',items:[{type:'Example building',n:2,units:[],unidentified:2}]}];check('unidentified quantity never receives an actual unit mass',!JSON.stringify(api.read(unknown)).includes('3,210'));
const token=api.fingerprint(read);actual.massKg=3300;check('a changed recorded weight changes the export fingerprint',api.fingerprint(api.read(rows))!==token);
check('projection does not add fields to the original selection',!rows[0].items[0].specs);
console.log(JSON.stringify({passed:checks.length,total:checks.length,checks},null,2));
