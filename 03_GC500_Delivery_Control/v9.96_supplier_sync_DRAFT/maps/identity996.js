/* Author: Andrew Fisher. Map search reads the same physical identities and stated quantities as the item cards. */
const MapIdentity996 = (() => {
 'use strict';
 function project(a, units, ownership, destination) {
  const numbers = [...new Set((units || []).filter(u => u && u.physical && u.ref === a.key && u.assetNo).map(u => String(u.assetNo).trim()).filter(Boolean))];
  const groups = ownership && ownership.rows || [];
  const owners = [...new Set((units || []).filter(u => u && u.physical && u.ref === a.key).map(u => u.owner).concat(groups.map(g => g.owner)).filter(o => o && o !== 'unknown'))];
  const company = owner => typeof Units925 !== 'undefined' ? Units925.company(owner) : owner;
  const labels = owners.map(owner => (owner === 'coates' ? '' : 'SUB-HIRED · ') + company(owner));
  groups.filter(g => g.quantityOnly).forEach(g => labels.push(g.item + ' · quantity ' + g.quantity + ' · no fleet numbers'));
  return {assets:numbers.join(', '), ownership:labels.join(' | '), location:destination && destination.known ? String(destination.text || '') : ''};
 }
 function read(a) {
  if (!a || a._cancelled || movedAway(a.key)) return {assets:'',ownership:'',location:''};
  return heldMemo('map-identity996/' + a.key, () => project(a, gcUnits925(a,{loading:false}), ItemOwnership969.read(a), destinationOf(a)));
 }
 return {project,read};
})();
const planItems996 = window.gc500PlanItems;
window.gc500PlanItems = function () {
 return holdAssets(() => {
  const model = planItems996.apply(this, arguments); if (!model) return model;
  for (const key of ['items','unplaced','placed']) model[key] = (model[key] || []).map(row => {
   const a = assetOf(row.key); return a ? Object.assign({}, row, MapIdentity996.read(a)) : row;
  });
  return model;
 });
};
// A visible header search also follows a remote record refresh, without reopening a closed search.
const mapRender996 = render;
render = function () {
 const result = mapRender996.apply(this, arguments), input = document.getElementById('q'), box = document.getElementById('finder');
 if (input && box && !box.hidden && input.value.trim()) holdAssets(() => {
  const identity = row => row && JSON.stringify([row.kind,row.key,row.id,row.sheetKey,row.label,row.no,row.date,row.page]);
  const previous = identity(FINDER.list[FINDER.at]);
  FINDER.list = finderMatches(input.value);
  const at = FINDER.list.findIndex(row => identity(row) === previous);
  FINDER.at = at >= 0 ? at : FINDER.list.length ? 0 : -1;
  finderDraw();
 });
 return result;
};
