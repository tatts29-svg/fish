/* Author: Andrew Fisher. Test baseline equivalence only; never a write-plan normalizer.
 * Native toDocs emits empty registered collections that the service may omit.
 * Only those top-level empty maps are omitted. Every document/nested value remains.
 */
'use strict';
const assert=require('node:assert/strict');
function recordMap(value,label){
 assert(value&&typeof value==='object'&&!Array.isArray(value),label+' must be a record map');
 const proto=Object.getPrototypeOf(value);assert(proto===Object.prototype||proto===null,label+' must be a plain record map');
 assert(Reflect.ownKeys(value).every(key=>typeof key==='string'&&Object.prototype.propertyIsEnumerable.call(value,key)),label+' must contain only enumerable string keys');
 return value;
}
function normaliseNativeDocuments(docs){
 recordMap(docs,'Native collections');
 return Object.fromEntries(Object.entries(docs).flatMap(([name,collection])=>{
  recordMap(collection,'Native collection '+name);
  return Object.keys(collection).length?[[name,structuredClone(collection)]]:[];
 }));
}
function assertNativeDocumentsMatch(observed,frozen){
 assert.deepEqual(normaliseNativeDocuments(observed),normaliseNativeDocuments(frozen),'Loaded native documents differ from the pinned snapshot (only absent/empty top-level collections are equivalent)');
 return true;
}
module.exports={normaliseNativeDocuments,assertNativeDocumentsMatch};
