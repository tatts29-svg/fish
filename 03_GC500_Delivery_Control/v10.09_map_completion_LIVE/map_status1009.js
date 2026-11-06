/* Author: Andrew Fisher. Read-only map status from the shared work-progress model. */
function mapStatus1009Classify(a, d, v, verified) {
 const key = String(a.key);
 const status = (state, label) => ({key, state, label});
 if (a._cancelled) return status('cancelled', 'CANCELLED');
 if (d.moved) return status('moved', 'MOVED');
 if (!v) return status('unknown', 'STATUS UNAVAILABLE');
 if (v.conflict || v.blocked) return status('review', 'REVIEW REQUIRED');
 if (v.partial962) return status('partial', 'PARTIAL');
 if (verified && d.done && v.stage === 5) return status('complete', 'COMPLETE');
 if (!d.recorded || d.where === 'rental') return status('unknown', 'NO DELIVERY RECORD');
 return status('incomplete', 'NOT COMPLETE');
}
window.gc500MapStatus1009 = function (keys) {
 const unavailable = () => ({available:false, states:[]});
 try {
  const health = todayWorkHealth840();
  const hosted = typeof DATA !== 'undefined' && DATA.edition === 'hosted';
  if (!health.ready || (hosted && ['subhire', 'loads'].some(k => !SYNC.first.has(k)))) return unavailable();
  const read = () => {
   const verified = window.gc500CompleteKeys897();
   if (!Array.isArray(verified)) return unavailable();
   const done = new Set(verified), wanted = Array.isArray(keys) ? new Set(keys.map(String)) : null;
   const states = allAssets().filter(a => a && a.key && (!wanted || wanted.has(String(a.key)))).map(a => {
    try { return mapStatus1009Classify(a, deliveryOf(a.key), timeline841State(a), done.has(a.key)); }
    catch (_) { return {key:String(a.key), state:'unknown', label:'STATUS UNAVAILABLE'}; }
   });
   return {available:true, states};
  };
  return typeof holdAssets === 'function' ? holdAssets(read) : read();
 } catch (_) { return unavailable(); }
};
