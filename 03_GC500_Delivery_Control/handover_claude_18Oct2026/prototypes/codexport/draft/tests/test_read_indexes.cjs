/* Author: Andrew Fisher. Isolated reference tests; no browser, files or network writes. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = process.argv[2] || path.dirname(__dirname);
const python = String.raw`
import importlib.util, json, pathlib, sys
base = pathlib.Path(sys.argv[1])
result = {}
for name in ['metadata', 'scope']:
    spec = importlib.util.spec_from_file_location(name, base / 'patch_v1057.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    result[name] = {'old': getattr(mod, 'OLD_METADATA' if name == 'metadata' else 'OLD_SCOPE'),
                    'new': getattr(mod, 'NEW_METADATA' if name == 'metadata' else 'NEW_SCOPE')}
print(json.dumps(result))
`;
const result = spawnSync('python3', ['-c', python, root], {encoding:'utf8'});
assert.equal(result.status, 0, result.stderr);
const source = JSON.parse(result.stdout);
let checks = 0;
const eq = (a,b) => { assert.deepStrictEqual(a,b); checks++; };
const ok = (v,message) => { assert.ok(v,message); checks++; };
const prefix = 'unit925/', kind = 'unit925-record';
let S = {}, ASSETS_HELD = null, memo = new Map();
function heldMemo(key,read) { if (!ASSETS_HELD) return read(); if (!memo.has(key)) memo.set(key,read()); return memo.get(key); }
const oldMetadata = eval('(' + source.metadata.old + ')');
const newMetadata = eval('(' + source.metadata.new + ')');
const oldScope = eval('(' + source.scope.old + ')');
const newScope = eval('(() => {' + source.scope.new + '; return unitEvidence;})()');

function metadataTests() {
 const nested = {value:1};
 const records = {
  'unit925/z':{kind,ref:'P02',assetNo:'0007',nested},
  'other/unit925/a':{kind,ref:'P01'}, 'unit925/null':null,
  'unit925/a':{kind,ref:'P01',docKey:'explicit',nested},
  'unit925/b':{kind,ref:'P01',active:false},
  'unit925/c':{kind:'other',ref:'P01'},
  'unit925/d':{kind}, 'unit925/e':{kind,ref:NaN},
  'unit925/f':Object.defineProperty({kind},'ref',{value:'P03',enumerable:false}),
  'unit925/g':Object.assign(Object.create({ref:'inherited'}),{kind})
 };
 for (const native of [false,true]) for (const held of [false,true]) {
  S = {loads:native?records:{}}; ASSETS_HELD = held?[]:null; memo.clear();
  eq(newMetadata(records),oldMetadata(records));
  for (const ref of ['P01','P02','P03','inherited','missing',undefined,NaN])
   eq(newMetadata(records,ref),oldMetadata(records).filter(d=>d.ref===ref));
  const a=newMetadata(records,'P01'),b=newMetadata(records,'P01');
  ok(a!==b);ok(a[0]!==b[0]);ok(a[0].nested===nested);
  a[0].assetNo='local';eq(b[0].assetNo,undefined);eq(records['unit925/a'].assetNo,undefined);
 }
 ASSETS_HELD=[];S={loads:records};memo.clear();
 eq(newMetadata(records,'P01'),oldMetadata(records).filter(d=>d.ref==='P01'));
 S.loads={'unit925/replacement':{kind,ref:'P01'}};
 eq(newMetadata(S.loads,'P01'),oldMetadata(S.loads).filter(d=>d.ref==='P01'));
 S.loads['unit925/new']={kind,ref:'P01'};memo.clear();
 eq(newMetadata(S.loads,'P01').length,2);
 delete S.loads['unit925/new'];memo.clear();eq(newMetadata(S.loads,'P01').length,1);
 const foreign={'unit925/a':{kind,ref:'P01'}};
 newMetadata(foreign,'P01');foreign['unit925/b']={kind,ref:'P01'};
 eq(newMetadata(foreign,'P01').length,2);
 // One native full-dictionary enumeration per hold, including multiple refs.
 S={loads:records};memo.clear();let enumerations=0;const entries=Object.entries;
 Object.entries=function(object){if(object===records)enumerations++;return entries(object);};
 try {newMetadata(records,'P01');newMetadata(records,'P02');newMetadata(records);eq(enumerations,1);memo.clear();newMetadata(records,'P01');eq(enumerations,2);}
 finally {Object.entries=entries;}
 for(const value of [null,undefined,'abc',[],{}]){S={loads:value};memo.clear();eq(newMetadata(value),oldMetadata(value));}
}

function scopeTests() {
 const discipline='Toilets & amenities',item='FWF',suffix='|'+discipline+'|'+item+'|install';
 const labour={
  ['P1/u0008'+suffix]:true, ['P10/u0008'+suffix]:true,
  ['P1/urest'+suffix]:true, ['P1/urest-extra'+suffix]:true,
  ['P1/u0008|Other|FWF|install']:true,
  ['P1/u0008|'+discipline+'|Other|install']:true,
  ['P1/u0008|'+discipline+'|FWF|clean']:true,
  ['P1'+suffix]:true, ['P1/u0009'+suffix]:false,
  ['P1/u/sub/u0010'+suffix]:true
 };
 const stamps={
  ['labour/P1/u0008'+suffix]:'2026-10-17T00:00:00Z',
  ['labour/P1/u0009'+suffix]:'2026-10-17T01:00:00Z',
  ['labour/P1/u0011'+suffix]:'2026-10-17T02:00:00Z',
  ['labour/P10/u0012'+suffix]:'2026-10-17T03:00:00Z',
  ['not-labour/P1/u0013'+suffix]:'not a labour stamp'
 };
 for(const native of [false,true])for(const held of [false,true]){
  S={labour:native?labour:{},stamps:native?stamps:{}};ASSETS_HELD=held?[]:null;memo.clear();
  for(const ref of ['P1','P10','P','missing','P1/u/sub',null,undefined,12])
   for(const disc of [discipline,'Other'])for(const desc of [item,'Other'])
    eq(newScope(ref,disc,desc,labour,stamps),oldScope(ref,disc,desc,labour,stamps));
  const a=newScope('P1',discipline,item,labour,stamps),b=newScope('P1',discipline,item,labour,stamps);
  ok(a!==b);ok(a['P1/u0008'+suffix]!==b['P1/u0008'+suffix]);
  a['P1/u0008'+suffix].on=false;eq(b['P1/u0008'+suffix].on,true);
 }
 ASSETS_HELD=[];S={labour:{...labour},stamps:{...stamps}};memo.clear();
 const read=()=>newScope('P1',discipline,item,S.labour,S.stamps);
 read();S.labour['P1/u0008'+suffix]=false;S.stamps['labour/P1/u0008'+suffix]='changed';
 // Cached keys never cache the value/timestamp.
 eq(read()['P1/u0008'+suffix],{on:false,at:'changed'});
 S.labour={['P1/u0099'+suffix]:true};eq(read(),oldScope('P1',discipline,item,S.labour,S.stamps));
 S.stamps={['labour/P1/u0100'+suffix]:'new object'};eq(read(),oldScope('P1',discipline,item,S.labour,S.stamps));
 S.labour['P1/u0101'+suffix]=true;memo.clear();eq(read(),oldScope('P1',discipline,item,S.labour,S.stamps));
 delete S.labour['P1/u0101'+suffix];memo.clear();eq(read(),oldScope('P1',discipline,item,S.labour,S.stamps));
 const foreignLabour={},foreignStamps={};newScope('P1',discipline,item,foreignLabour,foreignStamps);
 foreignStamps['labour/P1/u9999'+suffix]='custom';eq(newScope('P1',discipline,item,foreignLabour,foreignStamps),oldScope('P1',discipline,item,foreignLabour,foreignStamps));
 for(const l of [null,undefined,'abc',[],{}])for(const s of [null,undefined,'abc',[],{}]){
  S={labour:l,stamps:s};memo.clear();eq(newScope('P1',discipline,item,l,s),oldScope('P1',discipline,item,l,s));
 }
 // Scan each exact native object once; references/items use the key index.
 S={labour,stamps};memo.clear();const keys=Object.keys;let enumerations=0;
 Object.keys=function(object){if(object===labour||object===stamps)enumerations++;return keys(object);};
 try {newScope('P1',discipline,item,labour,stamps);newScope('P10',discipline,item,labour,stamps);newScope('P1','Other','Other',labour,stamps);eq(enumerations,2);memo.clear();newScope('P1',discipline,item,labour,stamps);eq(enumerations,4);}
 finally {Object.keys=keys;}
}
metadataTests();scopeTests();
console.log('PASS read-index reference tests: '+checks+' checks; native/custom, ordering, cloning, prefix collisions, invalidation and enumeration counts.');
