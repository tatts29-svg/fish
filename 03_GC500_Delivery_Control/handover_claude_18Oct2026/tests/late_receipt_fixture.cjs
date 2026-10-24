/* Author: Andrew Fisher. Test-only pre-entry state for the native v10.59 arrival transition.
   The published record now includes the day-only entries that the original test added.
   Stop synchronization, then remove only those entries from this disposable browser's
   local and committed read copies. Keep every light, original timestamp, other history,
   quantity and unrelated reference intact. Nothing is persisted or sent by this helper. */
'use strict';
function prepareLateReceiptFixture(){
 syncStop('isolated late-receipt fixture');
 const keys=['P26','P28','P34'],day='2026-10-14',at='2026-10-13T14:00:00.000Z';
 const removed={local:0,committed:0};
 function withoutEntry(record,copy){
  if(!record)return record;
  const history=Array.isArray(record.history)?record.history:[];
  const kept=history.filter(h=>!(h&&h.state==='on site'&&h.date_only===true&&h.effective_date===day&&h.at===at));
  removed[copy]+=history.length-kept.length;
  return Object.assign({},record,{history:kept});
 }
 S.delivery=Object.assign({},S.delivery);
 for(const key of keys){
  if(!S.delivery[key]||S.delivery[key].state!=='on site')throw new Error('Late-receipt fixture requires an existing reference-owned on-site light');
  S.delivery[key]=withoutEntry(S.delivery[key],'local');
  const committed=CROW.get(key);
  if(committed&&committed.delivery)CROW.set(key,Object.assign({},committed,{delivery:withoutEntry(committed.delivery,'committed')}));
 }
 sharedCache975();
 Idle1006.redraw();
 return {method:'isolated-pre-entry-v1',removed};
}
module.exports={prepareLateReceiptFixture};
