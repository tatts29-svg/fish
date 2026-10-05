// Author: Andrew Fisher. Real native Complete setter, isolated in-memory record only.
// The save/render boundary is captured; all state and hooks are restored in finally.
'use strict';
async function capturedCompletion844(page){return page.evaluate(()=>{
 const original={delivery:S.delivery,state:{...state},bump,mayWrite,whoAmI,flash,buzz};
 const before=JSON.stringify(Object.fromEntries(Object.entries(SYNC_COLLS).map(([k,c])=>[k,c.get()]))),day=todayIso();
 const types=todayTypeMetrics843(day).instruments.filter(t=>t.kind==='asset-type');
 const keys=[...new Set(types.flatMap(t=>t.keys))].filter(key=>{const a=assetOf(key);return a&&!a._cancelled&&!a.relocation&&!a.rest_of&&!movedAway(key)&&!(shortOf(a)||[]).length&&types.some(t=>t.keys.includes(key)&&t.rows.some(r=>r.key===key&&Number.isInteger(r.quantity)&&r.quantity>0));});
 keys.sort((a,b)=>types.filter(t=>t.keys.includes(b)).length-types.filter(t=>t.keys.includes(a)).length);
 const key=keys[0];if(!key)throw Error('No native non-conflicted reference for isolated Complete proof');
 const memberIds=types.filter(t=>t.keys.includes(key)).map(t=>t.id),calls=[];let result,buttonHost;
 const reading=()=>{const model=todayTypeMetrics843(day),a=assetOf(key),d=deliveryOf(key),p=document.createElement('div');p.innerHTML=doneBtn(key,false);const eq=document.createElement('div');eq.innerHTML=equipmentCard(a);return {key,done:d.done,where:d.where,state:d.state,stage:timeline841State(a).stage,buttonPressed:p.querySelector('[data-done]')?.getAttribute('aria-pressed'),equipment:{key:eq.querySelector('[data-eq]')?.dataset.eq,complete:!!eq.querySelector('.eqstat .tick[aria-label^="Complete"]')},types:model.instruments.filter(t=>t.kind==='asset-type').map(t=>({id:t.id,displayDone:[...document.querySelectorAll('[data-tw843-type-id]')].find(n=>n.dataset.tw843TypeId===t.id)?.querySelector('[data-tw843-quantity=done] strong')?.textContent,unitKnown:t.unitKnown,total:t.total,done:t.done,left:t.left,rows:t.rows.map(r=>({key:r.key,quantity:r.quantity,knownQuantity:r.knownQuantity,done:r.done,left:r.left,complete:r.complete,recordedComplete:r.recordedComplete,conflict:r.conflict}))})),linked:typeof todayLinkedReferences844==='function'?todayLinkedReferences844([key],{asOf:day}):null};};
 try{
  S.delivery=structuredClone(S.delivery);state.asOf=day;
  mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via isolated test';flash=()=>{};buzz=()=>{};
  bump=()=>{calls.push({key,done:deliveryOf(key).done});renderToday();return true;};
  // Native setter establishes a known off baseline without saving or sending it.
  if(!setDone(key,false))throw Error('Native Complete off rejected in isolated test');
  const off=reading();
  buttonHost=document.createElement('div');buttonHost.hidden=true;buttonHost.innerHTML=doneBtn(key,false);document.body.appendChild(buttonHost);
  buttonHost.querySelector('[data-done]').click();
  const on=reading();
  buttonHost.innerHTML=doneBtn(key,false);buttonHost.querySelector('[data-done]').click();
  const offAgain=reading();
  result={key,day,memberIds,calls,off,on,offAgain,recordKeys:Object.keys(S.delivery).filter(k=>JSON.stringify(S.delivery[k])!==JSON.stringify(original.delivery[k]))};
 }finally{
  buttonHost?.remove();S.delivery=original.delivery;Object.assign(state,original.state);bump=original.bump;mayWrite=original.mayWrite;whoAmI=original.whoAmI;flash=original.flash;buzz=original.buzz;renderToday();
 }
 result.restored=before===JSON.stringify(Object.fromEntries(Object.entries(SYNC_COLLS).map(([k,c])=>[k,c.get()])));
 return result;
 });}
function assertCompletion844(check,label,r){
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),finite=n=>typeof n==='number'&&Number.isFinite(n);
 check(label+' captured native Complete actions use exactly one existing reference and never persist',r.restored&&r.recordKeys.length===1&&r.recordKeys[0]===r.key&&same(r.calls.map(x=>x.done),[false,true,false]),{key:r.key,recordKeys:r.recordKeys,calls:r.calls,restored:r.restored});
 check(label+' native Timeline Equipment and Complete button read the same current record',!r.off.done&&r.off.stage<5&&r.off.buttonPressed==='false'&&!r.off.equipment.complete&&r.on.done&&r.on.stage===5&&r.on.buttonPressed==='true'&&r.on.equipment.complete&&r.on.equipment.key===r.key&&r.on.state==='on site'&&!r.offAgain.done&&r.offAgain.stage<5,{off:r.off,on:r.on,offAgain:r.offAgain});
 check(label+' linked current status follows captured completion on and off',[r.off,r.on,r.offAgain].every(x=>x.linked.rowsByKey[r.key].current.done===x.done&&x.linked.rowsByKey[r.key].current.stage===x.stage),{off:r.off.linked,on:r.on.linked,offAgain:r.offAgain.linked});
 const errors=[];for(const off of r.off.types){const on=r.on.types.find(t=>t.id===off.id),again=r.offAgain.types.find(t=>t.id===off.id),row=off.rows.find(x=>x.key===r.key),next=on.rows.find(x=>x.key===r.key);if(!row){if(!same(off,on)||!same(off,again))errors.push({id:off.id,reason:'unrelated type changed'});continue;}if(on.displayDone!==(finite(on.done)?on.done.toLocaleString('en-AU',{maximumFractionDigits:2}):'—')||!next.recordedComplete||!next.complete||next.conflict||finite(row.knownQuantity)&&next.done!==row.knownQuantity||row.knownQuantity===null&&next.done!==null||finite(row.quantity)&&next.left!==0||!same(off,again))errors.push({id:off.id,off,on,again});if(finite(off.done)&&finite(row.knownQuantity)&&on.done-off.done!==row.knownQuantity)errors.push({id:off.id,reason:'wrong type completion delta'});}
 check(label+' one native reference Complete update propagates only to every matching type quantity',!errors.length&&r.memberIds.length>0,{memberIds:r.memberIds,errors});
}
module.exports={capturedCompletion844,assertCompletion844};
