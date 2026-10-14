/* Author: Andrew Fisher. Reuse identity calculations only within one existing render hold.
 * Native saves/hydration invalidate HELD_MEMO; no answer survives a draw.
 * A fresh graph per reader keeps rows/groups aliased correctly without sharing mutations.
 * These projections contain the same JSON-backed native records as model925. */
function copyUnitProjection1018(value,seen=new WeakMap()){
 if(value===null||typeof value!=='object')return value;
 if(seen.has(value))return seen.get(value);
 const out=Array.isArray(value)?[]:Object.create(Object.getPrototypeOf(value));
 seen.set(value,out);
 for(const key of Object.keys(value))out[key]=copyUnitProjection1018(value[key],seen);
 return out;
}
function gcModel925(a,options){
 const read=()=>{const result=model925(a,nativeEnv925(options));return window.VmsAssignment1016?VmsAssignment1016.model(a,result):result;};
 if(!ASSETS_HELD||!a||typeof a!=='object'||Object.keys(options||{}).some(k=>k!=='loading'))return read();
 const cache=heldMemo('unitModels1018',()=>new WeakMap()),key=options?.loading===false?'plain':'loading';
 let entries=cache.get(a);
 if(!entries){entries=new Map();cache.set(a,entries);}
 if(!entries.has(key))entries.set(key,read());
 return copyUnitProjection1018(entries.get(key));
}
