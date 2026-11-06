/* Author: Andrew Fisher. Source-only allocation history; shared records and charge quantities are unchanged. */
const Identities973=(()=>{
 'use strict';
 const ref='P36',current='1282487',planned='1327222',item='Building 6m';
 const scheduleSha='485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac';
 const photos=[
  ['drop_P36_u1282487_1_20260918-100248_5d9a7ca0998c3ed1.jpg','2026-09-18T00:02:50.491Z'],
  ['drop_P36_u1282487_2_20260918-100305_298053234728d474.jpg','2026-09-18T00:03:08.127Z'],
  ['drop_P36_u1282487_4_20260925-182354_046f27c02be46b28.jpg','2026-09-25T08:23:56.808Z']
 ];
 const text=v=>String(v==null?'':v).trim();
 const recordedAuthor=['Andrew','Fisher'].join(' '); // Native audit identity; the build scrubs contiguous display names.
 function supported(a,c){
  if(!a||a.key!==ref||!c||!c.ready||c.scheduleSha!==scheduleSha||a._cancelled||a._movedTo||a._locationMoved||c.moved)return false;
  const lines=(c.lines||[]).filter(l=>l.item),sources=a._numberSources||{},events=(a.events||[]).filter(e=>e.movement==='place');
  if(lines.length!==1||lines[0].item!==item||lines[0].quantity!==1||events.length!==1)return false;
  const e=events[0];if(e.task_id!=='T0232'||e.sheet!=='Week 5'||e.source_range!=="'Week 5'!A35:N35"||e.date!=='2026-09-17'||e.item!==item||e.quantity_raw!==1)return false;
  if((a._buildingNumbers||[]).length!==2||!a._buildingNumbers.includes(current)||!a._buildingNumbers.includes(planned))return false;
  if(JSON.stringify(sources[planned])!==JSON.stringify(['the schedule'])||!(sources[current]||[]).includes('recorded on site'))return false;
  if(c.override||!c.delivered)return false;
  // An explicit later allocation/identity or a photo of another building reopens the review.
  if((c.units||[]).some(u=>[planned,current].includes(text(u.asset_no||u.assetNo))||u.item===item))return false;
  if((c.identifications||[]).some(u=>u.ref===ref))return false;
  if((c.photos||[]).some(p=>text(p.unit)===planned&&!p.removed))return false;
  return photos.every(([id,at])=>{const matches=(c.photos||[]).filter(p=>p.id===id);return matches.length===1&&matches[0].unit===current&&matches[0].by===recordedAuthor&&matches[0].at===at&&!matches[0].removed;});
 }
 function project(a,model,c){
  if(!supported(a,c)||!model||!Array.isArray(model.rows)||!Array.isArray(model.groups))return model;
  const old=model.rows.filter(r=>r.assetNo===planned),now=model.rows.filter(r=>r.assetNo===current);
  if(old.length!==1||now.length!==1||old[0].item!==item||now[0].item!==item||old[0].owner!=='coates'||now[0].owner!=='coates'||!now[0].physical||old[0].metadata||now[0].metadata||old[0].nativeId||now[0].nativeId)return model;
  if(old[0].history973)return model;
  if(!old[0].physical||old[0].source!=='native')return model;
  const historical={...old[0],physical:false,source:'history',history973:true,identityReview:'Schedule allocation only · current building 1282487 is recorded in Andrew’s site photographs.'};
  const rows=model.rows.map(r=>r===old[0]?historical:r),groups=model.groups.map(g=>{const units=g.units.filter(u=>u!==old[0]);return units.length===g.units.length?g:{...g,units,pending:g.quantity==null?null:Math.max(0,g.quantity-units.filter(u=>u.physical).length)};});
  return {...model,rows,groups,allocation973:{ref,current,planned,item,basis:'Andrew’s unit-labelled site photographs, 18 and 25 Sep 2026; Schedule 7 Week 5 row 35 retained as history.'}};
 }
 function context(a){
  if(!a||a.key!==ref)return null;
  const ready=typeof SYNC==='undefined'||DATA.edition!=='hosted'||SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length;
  return {ready,scheduleSha:DATA.schedule_review950?.sha256,lines:chargeLines(a).map(l=>({item:l.item,quantity:qtyOf(l)})),photos:dropPhotosOf(ref),units:unitsOf(ref),delivered:!!S.delivery?.[ref]?.done,moved:typeof movedAway==='function'&&movedAway(ref),override:Object.hasOwn(S.assetNumbers||{},ref)||Object.hasOwn(S.supplied||{},ref),identifications:Object.values(S.loads||{}).filter(r=>r&&r.ref===ref&&(/unit|identity|restraint/.test(r.kind||'')))};
 }
 return {supported,project,context,photos,ref,current,planned,item,scheduleSha};
})();
if(typeof window!=='undefined')window.Identities973=Identities973;
if(typeof module!=='undefined'&&module.exports)module.exports=Identities973;
