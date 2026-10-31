/* Author: Andrew Fisher. Read-only review of recorded pins outside the drawing. */
(function (W, factory) {
 'use strict';
 if (typeof module !== 'undefined' && module.exports) { module.exports = factory; return; }
 const core = factory(__PLAN1257__);
 function offSheet() {
  const read = () => core.collect(W.gc500PlanItems(), key => !!assetOf(key));
  return typeof holdAssets === 'function' ? holdAssets(read) : read();
 }
 W.MapClarity1257 = Object.freeze({...core, offSheet});
 const before = W.questionsList;
 if (typeof before !== 'function') throw new Error('Map location review requires the existing Questions reader');
 const id = 'map-offsheet1257';
 const wrapped = function () {
  const Q = before.apply(this, arguments);
  if (typeof SYNC !== 'undefined' && (SYNC.status !== 'live' || SYNC.first.size !== Object.keys(SYNC_COLLS).length)) return Q;
  try {
   const rows = offSheet();
   if (!rows.length) return Q; // The native reader retains any saved note in history.
   const at = Q.findIndex(q => q.id === id);
   const question = {
    ...(at >= 0 ? Q[at] : {}), id, group: 'Schedule & plant', st: QH_OPEN,
    q: 'Recorded pins outside the site drawing',
    why: 'These recorded pins fall outside the drawing and are listed separately on the map.',
    need: 'Confirm whether these are intended off-site pins or need a site position. No location has been changed.',
    rows: rows.map(row => row.key + ' · pinned off the drawing'), go: 'map'
   };
   delete question.archived754;
   if (at >= 0) Q[at] = question; else Q.push(question);
  } catch (error) {
   Q.fails = [...new Set([...(Q.fails || []), 'recorded map positions'])];
  }
  return Q;
 };
 W.questionsList = wrapped;
 try { questionsList = wrapped; } catch (_) {}
})(typeof window === 'undefined' ? null : window, function (plan) {
 'use strict';
 const inverse = m => {
  const [[a,b,c],[d,e,f]] = m, det = a*e-b*d;
  if (!Number.isFinite(det) || !det) throw new Error('Invalid drawing registration');
  return [[e/det,-b/det,(b*f-c*e)/det],[-d/det,a/det,(c*d-a*f)/det]];
 };
 const apply = (m,p) => [m[0][0]*p[0]+m[0][1]*p[1]+m[0][2], m[1][0]*p[0]+m[1][1]*p[1]+m[1][2]];
 const inside = (p,r) => !!p && p[0]>=r[0] && p[0]<=r[2] && p[1]>=r[1] && p[1]<=r[3];
 const main = inverse(plan.main), inset = inverse(plan.inset);
 const width = plan.w/plan.k, height = plan.h/plan.k;
 if (!(width>0 && height>0)) throw new Error('Invalid drawing dimensions');
 function sheetPoint(ll) {
  if (!Array.isArray(ll) || ll.length<2 || !ll.every(Number.isFinite) || Math.abs(ll[0])>=90 || Math.abs(ll[1])>180) return null;
  const [lat,lon]=ll, n=134217728, sin=Math.sin(lat*Math.PI/180);
  const z=[(lon+180)/360*n,(0.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*n];
  let p=apply(main,z);
  // Same inset precedence as the explorer's native sheetOfLL function.
  if (inside(p,plan.insetRect)) {
   const q=apply(inset,z);
   if (!inside(q,plan.insetRect)) return null;
   p=q;
  }
  return p.every(Number.isFinite) ? [p[0]/width,p[1]/height] : null;
 }
 const onSheet = p => Array.isArray(p) && p.length>=2 && p.every(Number.isFinite) && inside(p,[0,0,1,1]);
 function collect(model, isReference) {
  if (!model || !Array.isArray(model.items) || !Array.isArray(model.placed)) throw new Error('Current map positions unavailable');
  const onMaster=new Set(model.items.filter(row=>onSheet(row.pt)).map(row=>String(row.key)));
  const found=new Map();
  for (const row of model.placed) {
   const key=String(row.key || '');
   if (!key || onMaster.has(key) || row._supplier996MapRequest || row.sourceRequest1017 || !isReference(key)) continue;
   const point=sheetPoint(row.ll);
   if (point && !onSheet(point)) found.set(key,{key});
  }
  return [...found.values()].sort((a,b)=>a.key.localeCompare(b.key,'en',{numeric:true}));
 }
 return Object.freeze({sheetPoint,onSheet,collect});
});
