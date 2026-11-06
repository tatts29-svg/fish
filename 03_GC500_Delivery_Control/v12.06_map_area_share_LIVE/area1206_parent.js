/* Author: Andrew Fisher. Existing read-only map symbols and loading-side records. */
(function(W){
 'use strict';
 __CORE1206__
 function metadata(ref){
  const a=typeof assetOf==='function'?assetOf(ref):null;
  if(!a)return {loading:[]};
  const loading=typeof loading872Rows==='function'?loading872Rows(a).map(r=>({item:String(r.item||''),asset:String(r.no||''),side:loading872Side(a,r.id)||''})):[];
  return {loading};
 }
 W.MapArea1206=Object.freeze({version:'v12.06',core:areaCore1206(),metadata});
})(window);
