/* Author: Andrew Fisher. Quantity scope travels atomically with its numeric native document.
   Decoding is pure; local receipt metadata changes only when a decoded record is applied. */
(function(root){
'use strict';
const KIND='quantityScope1017',META=Symbol('quantity-scope1017'),key=ref=>KIND+'/'+ref;
const clone=x=>JSON.parse(JSON.stringify(x)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const value=(record,ref)=>record?.qtys?.[ref]??null;
const integer=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
function valid(r,ref,typed){
 return !!(r&&r.kind===KIND&&typeof ref==='string'&&ref&&r.ref===ref&&(typed==null||integer(typed)&&typed>0)&&(r.typed??null)===(typed??null)&&typeof r.at==='string'&&Number.isFinite(Date.parse(r.at))&&
  Array.isArray(r.items)&&r.items.length&&new Set(r.items.map(i=>i?.item)).size===r.items.length&&r.items.every(i=>i&&typeof i.item==='string'&&i.item.trim()&&
   integer(i.quantity)&&integer(i.received)&&integer(i.installed)&&i.installed<=i.received&&
   (!i.receipts||Array.isArray(i.receipts)&&i.receipts.every(p=>p&&integer(p.quantity)&&typeof p.at==='string'&&Number.isFinite(Date.parse(p.at))))));
}
function scopes(record){
 const out={};for(const r of Object.values(record?.loads||{}))if(valid(r,r?.ref,value(record,r?.ref)))out[key(r.ref)]=clone(r);
 return out;
}
function without(loads){return Object.fromEntries(Object.entries(loads||{}).filter(([,r])=>r?.kind!==KIND));}
function canonical(v){return JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);}
function decode(docs){
 const out={};for(const d of Object.values(docs||{}))if(d&&typeof d._k==='string'&&valid(d.scope1017,d._k,d.v))out[key(d._k)]=clone(d.scope1017);
 return out;
}
function rebind(r,typed){return {...clone(r),typed:typed??null};}
function carried(incoming,previous,qtys){
 const out={...incoming};
 // A legacy client can send only a numeric quantity. That is not evidence that
 // previously received units disappeared or that every newly planned unit arrived.
 for(const r of Object.values(previous||{}))if(!own(out,key(r.ref)))out[key(r.ref)]=rebind(r,qtys?.[r.ref]??null);
 return out;
}
function incoming(decoded,record){return carried(decoded?.[META]||{},scopes(record),decoded);}
const api={kind:KIND,key,valid,scopes,decode,canonical};root.ScopeSync1017=api;
api.same=(decoded,record)=>canonical(incoming(decoded,record))===canonical(scopes(record));
api.attach=function(record){
 const meta=record?.qtys?.[META];if(meta)record.loads={...without(record.loads),...clone(meta)};
 return record;
};
// Match the native quantity merge rule, then select metadata from the same side.
// Equal quantity values use the latest quantity stamp; equal stamps use a stable
// baseline ordering, so importing A+B or B+A cannot switch the preserved actuals.
function chooseSide(a,b,ref){
 const av=value(a,ref),bv=value(b,ref),aa=a?.stamps?.['qtys/'+ref]||'',ba=b?.stamps?.['qtys/'+ref]||'';
 if(av==null&&bv!=null&&!aa)return 'b';if(bv==null&&av!=null&&!ba)return 'a';
 if(aa!==ba)return aa>ba?'a':'b';
 if(canonical(av)!==canonical(bv))return canonical(av)>canonical(bv)?'a':'b';
 return null;
}
api.mergeScopes=function(a,b,merged){
 const am=scopes(a),bm=scopes(b),out={};
 for(const k of new Set([...Object.keys(am),...Object.keys(bm)])){
  const ref=(am[k]||bm[k]).ref,side=chooseSide(a,b,ref),first=side==='a'?am[k]:side==='b'?bm[k]:null;
  let selected=first;
  if(!selected){const choices=[am[k],bm[k]].filter(Boolean);choices.sort((x,y)=>String(x.at).localeCompare(String(y.at))||canonical(x).localeCompare(canonical(y)));selected=choices.at(-1);}
  if(selected)out[k]=rebind(selected,value(merged,ref));
 }
 return out;
};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const docs0=toDocs,from0=fromDocs,qtySet0=SYNC_COLLS.qtys.set,loadsSet0=SYNC_COLLS.loads.set,merge0=mergeRecords;
toDocs=function(name){
 const out=docs0.apply(this,arguments);
 if(name==='loads')for(const id of Object.keys(out))if(out[id]?.kind===KIND)delete out[id];
 if(name==='qtys')for(const r of Object.values(scopes(S))){const id=docIdOf(r.ref);out[id]={...(out[id]||{_k:r.ref,v:null}),scope1017:clone(r)};}
 return out;
};
fromDocs=function(name,docs){
 const out=from0.apply(this,arguments);
 if(name==='qtys')Object.defineProperty(out,META,{value:decode(docs),enumerable:false});
 return out;
};
SYNC_COLLS.qtys.set=function(v){
 const cache=incoming(v,S);qtySet0({...v});
 S.loads={...without(S.loads),...cache};
};
SYNC_COLLS.loads.set=function(v){return loadsSet0({...without(v),...scopes(S)});};
mergeRecords=function(mine,theirs){
 // Avoid reporting this private cache as a second, conflicting truck-load record.
 const a=api.attach({...mine,loads:{...(mine?.loads||{})}}),b=api.attach({...theirs,loads:{...(theirs?.loads||{})}});
 const result=merge0({...a,loads:without(a.loads)},{...b,loads:without(b.loads)});
 result.merged.loads={...without(result.merged.loads),...api.mergeScopes(a,b,result.merged)};
 return result;
};
})(typeof window!=='undefined'?window:globalThis);
