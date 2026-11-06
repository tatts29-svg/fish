/* Author: Andrew Fisher. Synthetic refusal controls for harmless collection serialization differences. */
'use strict';
const assert=require('node:assert/strict');
const {normaliseNativeDocuments,assertNativeDocumentsMatch}=require('./native_document_shape.cjs');
const clone=structuredClone,checks=[],test=(name,fn)=>{try{fn();checks.push({name,pass:true})}catch(e){checks.push({name,pass:false,error:e.message})}};
const original={answers:{alpha:{_k:'alpha',v:{empty:{},list:[],nil:null,quantity:3}}},delivery:{unit:{_k:'unit',v:{arrived:true}}}};
test('identical native document maps pass',()=>assert(assertNativeDocumentsMatch(clone(original),original)));
test('native empty top-level collections may be absent from service',()=>assert(assertNativeDocumentsMatch({...clone(original),rates:{},actions:{}},original)));
test('service empty top-level collections may be absent from native',()=>assert(assertNativeDocumentsMatch(original,{...clone(original),rates:{}})));
test('both empty top-level shapes preserve an empty record',()=>assert(assertNativeDocumentsMatch({rates:{},actions:{}},{})));
for(const[name,mutate]of[
 ['new document',d=>d.answers.beta={_k:'beta',v:'new'}],
 ['deleted document',d=>delete d.answers.alpha],
 ['last document replaced by empty collection',d=>d.answers={}],
 ['nonempty collection removed',d=>delete d.answers],
 ['document moved between collections',d=>{d.delivery.alpha=d.answers.alpha;delete d.answers.alpha}],
 ['changed document value',d=>d.answers.alpha.v.quantity=4],
 ['renamed document key',d=>{d.answers.beta=d.answers.alpha;delete d.answers.alpha}],
 ['changed document identity',d=>d.answers.alpha._k='other'],
 ['new nonempty collection',d=>d.newCollection={doc:{}}],
 ['empty document added',d=>d.answers.blank={}],
 ['nested empty object removed',d=>delete d.answers.alpha.v.empty],
 ['nested empty object replaced by array',d=>d.answers.alpha.v.empty=[]],
 ['nested array replaced by null',d=>d.answers.alpha.v.list=null],
 ['nested null replaced by empty object',d=>d.answers.alpha.v.nil={}]
])test(name+' is refused',()=>{const d=clone(original);mutate(d);assert.throws(()=>assertNativeDocumentsMatch(d,original))});
for(const[name,value]of[['null',null],['array',[]],['string',''],['number',0],['boolean',false],['date',new Date(0)],['map',new Map()],['custom prototype',Object.create({})]]){
 test('malformed '+name+' collection is refused',()=>assert.throws(()=>assertNativeDocumentsMatch({...clone(original),broken:value},original)));
 test('malformed '+name+' root is refused',()=>assert.throws(()=>normaliseNativeDocuments(value)));
}
test('unknown nonempty collection cannot disappear',()=>assert.throws(()=>assertNativeDocumentsMatch(original,{...clone(original),unknown:{retained:{}}})));
test('empty document body remains logical data',()=>{assert.deepEqual(normaliseNativeDocuments({col:{doc:{}}}),{col:{doc:{}}});assert.throws(()=>assertNativeDocumentsMatch({col:{}},{col:{doc:{}}}))});
test('reserved collection and document names are ordinary own-key data',()=>{
 const a=JSON.parse('{"__proto__":{"constructor":{"_k":"constructor","v":{}}},"constructor":{"__proto__":{"_k":"__proto__","v":[]}}}');
 const n=normaliseNativeDocuments(a);assert.equal(Object.getPrototypeOf(n),Object.prototype);assert(Object.hasOwn(n,'__proto__'));assert(Object.hasOwn(n.constructor,'__proto__'));assert(assertNativeDocumentsMatch(n,a));
 delete n.constructor.__proto__;assert.throws(()=>assertNativeDocumentsMatch(n,a));
});
test('inputs and nested values remain unchanged and detached',()=>{
 const a=clone(original),b={...clone(original),emptyCollection:{}};assert(assertNativeDocumentsMatch(a,b));assert.deepEqual(a,original);assert.deepEqual(b,{...original,emptyCollection:{}});
 const n=normaliseNativeDocuments(a);n.answers.alpha.v.quantity=99;assert.equal(a.answers.alpha.v.quantity,3);
});
test('non-enumerable and symbol collection keys cannot be silently dropped',()=>{
 const hidden={};Object.defineProperty(hidden,'kept',{value:{doc:{}}});assert.throws(()=>normaliseNativeDocuments(hidden));
 const symbol={[Symbol('kept')]:{doc:{}}};assert.throws(()=>normaliseNativeDocuments(symbol));
});
const passed=checks.filter(c=>c.pass).length;console.log(JSON.stringify({author:'Andrew Fisher',checks,passed,total:checks.length},null,2));if(passed!==checks.length)process.exitCode=1;
