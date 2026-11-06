/* Author: Andrew Fisher. Item-level toilet receipts and recorded installation.
 * An assigned number is not a receipt. A receipt is not installation.
 * Dates are native AEST record stamps; no records or charges are changed. */
function toiletItem962(a, item, d, day, nativeOn) {
 if (!a || !(a.product === 'Toilet' || a.discipline === 'Toilets & amenities') || !item) return null;
 const lines = chargeLines(a).filter(l => l.item === item), qs = lines.map(qtyOf);
 if (!lines.length || qs.some(q => !Number.isInteger(q) || q < 0)) return null;
 const quantity = qs.reduce((n,q) => n+q,0), stamps = S.stamps || {};
 const dated = stamp => { const x = stamp ? isoIn(stamp) : ''; return /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : ''; };
 const receiptRows = ((S.supplied || {})[a.key]?.items || []).filter(r => r.asked === item);
 const receipt = receiptRows.length === 1 ? receiptRows[0] : null;
 const value = receipt && receipt.qty_supplied;
 const receiptQty = value != null && String(value).trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
 const receiptStamp = stamps['supplied/'+a.key+'/'+item], receiptDay = dated(receiptStamp);
 const receiptCurrent = receiptQty != null && (receiptDay ? receiptDay <= day : !receiptStamp && day >= todayIso());
 const historicalReceipt = receiptQty != null && receiptDay && receiptDay > day;
 const split = typeof split900 === 'function' ? split900(a, d.done ? d : {...d,done:true,done_at:d.set_at}, lines) : null;
 const held = split?.items.get(item) || 0;
 const on = !!(d.recorded && (d.state === 'on site' || d.done));
 const baseOn = nativeOn == null ? (on ? quantity : 0) : nativeOn;
 let arrived = Math.max(0, Math.min(baseOn,quantity-held));
 if (receiptCurrent) arrived = Math.min(quantity,receiptQty + (typeof restArrived==='function' ? restArrived(a,item) : 0));
 if (historicalReceipt && held) arrived = 0;
 const shorts = typeof shortOf === 'function' ? shortOf(a) : [];
 const referenceShort = !!d.done && shorts.length > 0;
 const itemShort = !!d.done && shorts.some(s => s.item === item);
 const itemKey = a.key+'|'+lines[0].discipline+'|'+item+'|install';
 const installStamp = stamps['labour/'+itemKey], installDay = dated(installStamp);
 const explicitInstall = !!(S.labour || {})[itemKey] && !!installDay && installDay <= day &&
   receiptCurrent && !!receiptDay && Date.parse(installStamp) >= Date.parse(receiptStamp);
 if (historicalReceipt && (held || installDay && installDay > day && Date.parse(installStamp) >= Date.parse(receiptStamp))) arrived=0;
 // Once mixed-reference work is recorded by item, a later item receipt cannot borrow its old whole-reference tick.
 const itemWorkAfterTick = chargeLines(a).some(l => {
  const k = a.key+'|'+l.discipline+'|'+l.item+'|install', t = stamps['labour/'+k];
  return !!(S.labour || {})[k] && dated(t) && dated(t) <= day && d.done_at && Date.parse(t) > Date.parse(d.done_at);
 });
 const laterReceipt = receiptCurrent && receiptDay && d.done_at && Date.parse(receiptStamp) > Date.parse(d.done_at) && itemWorkAfterTick;
 // A shortage in a later item does not erase work covered by an earlier dated split.
 const scopeDone = Math.max(0,quantity-held);
 const wholeSplit = referenceShort && d.done && typeof split900==='function' ? split900(a,d,chargeLines(a)) : null;
 const scopeEvents=(a.events||[]).filter(e=>e.movement!=='remove'&&e.item===item);
 const eventQty=e=>e.quantity_raw!=null&&String(e.quantity_raw).trim()!==''&&Number.isInteger(Number(e.quantity_raw))&&Number(e.quantity_raw)>=0?Number(e.quantity_raw):null;
 const eventKey=e=>e.task_id?'task:'+e.task_id:JSON.stringify([e.date,e.movement,eventQty(e)]);
 const scopeReconciled=!!wholeSplit&&scopeEvents.length>0&&scopeEvents.every(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')&&eventQty(e)!=null)&&
   new Set(scopeEvents.map(eventKey)).size===scopeEvents.length&&scopeEvents.reduce((n,e)=>n+eventQty(e),0)===quantity;
 const datedScope=scopeReconciled?scopeEvents.filter(e=>e.date<=wholeSplit.by).reduce((n,e)=>n+eventQty(e),0):0;
 const priorReceipt = receiptCurrent && receiptDay && d.done_at && Date.parse(receiptStamp)<=Date.parse(d.done_at);
 const supportedScope = !referenceShort ? scopeDone : Math.min(scopeDone,Math.max(datedScope,priorReceipt?arrived:0),itemShort?arrived:quantity);
 let done = d.done ? supportedScope : 0;
 if (laterReceipt) done = 0;
 if (explicitInstall) done = arrived;
 done = Math.min(quantity, Math.max(0,done));
 const conflict = !!d.done && (itemShort && (scopeDone>arrived || explicitInstall) || referenceShort && !scopeReconciled && !priorReceipt && !explicitInstall && done<quantity);
 const reviewScope=scopeReconciled&&!explicitInstall?scopeDone:quantity;
 const reviewQuantity = conflict ? Math.max(0,reviewScope-done) : 0;
 const complete = done === quantity && quantity > 0;
 const status = complete ? 'Recorded installed' : arrived > 0 ? arrived+' of '+quantity+' received · '+done+' installed'
   : itemShort ? 'Not received · recorded shortage' : held ? 'Arrival not recorded for this item' : 'Arrival and installation not recorded';
 return {item, quantity, arrived, done, complete, conflict, reviewQuantity, held,
  recordedComplete: !!d.done && !held, receiptDay: receiptDay || null, installDay: installDay || null,
  explicitInstall, status, basis: explicitInstall ? 'Dated item installation and supplied quantity.'
   : done ? 'Reference completion for this item’s recorded scope.' : 'Receipt, allocation and installation remain separate.'};
}
function toiletRows962(a, d, lines, day, onBy) {
 if (!a || !(a.product === 'Toilet' || a.discipline === 'Toilets & amenities')) return null;
 const items = [...new Set((lines || []).map(l=>l.item))], rows = items.map(item=>toiletItem962(a,item,d,day,onBy?.get(item)));
 if (!rows.length || rows.some(r=>!r)) return null;
 const sum = key => rows.reduce((n,r)=>n+r[key],0);
 return {rows, quantity:sum('quantity'), done:sum('done'), arrived:sum('arrived'), reviewQuantity:sum('reviewQuantity'),
  conflict:rows.some(r=>r.conflict), complete:rows.every(r=>r.complete),
  status:sum('done')+' of '+sum('quantity')+' installed · '+sum('arrived')+' received',
  detail:rows.map(r=>r.item+': '+r.status+'. '+r.basis).join(' ')};
}
function toiletArrival962(a,item,day,nativeOn) {
 const r=toiletItem962(a,item,deliveryAsOf(a.key,day),day,nativeOn);return r?r.arrived:nativeOn;
}
function toiletSupplierArrived962(a,item,day) {
 if (!a || a._cancelled) return false;
 const r=toiletItem962(a,item,deliveryAsOf(a.key,day),day);
 // A partial quantity cannot identify which supplier fleet numbers arrived.
 return r ? r.arrived===r.quantity && r.quantity>0 : invOnSite(a,day);
}
function toiletDeliveryEntry962(r,day) {
 if (!r?.a || !(r.a.product==='Toilet'||r.a.discipline==='Toilets & amenities')) return null;
 const events=(r.events||[]).filter(e=>e.movement!=='remove');
 const items=[...new Set(events.map(e=>e.item).filter(Boolean))];
 const lines=items.length?chargeLines(r.a).filter(l=>items.includes(l.item)):chargeLines(r.a);
 const x=toiletRows962(r.a,deliveryAsOf(r.a.key,day),lines,day);
 return x ? x.rows.every(i=>{
  const own=events.filter(e=>e.item===i.item), latest=own.map(e=>e.date).filter(v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')).sort().pop();
  const all=(r.a.events||[]).filter(e=>e.movement!=='remove'&&e.item===i.item);
  const q=e=>e.quantity_raw!=null&&String(e.quantity_raw).trim()!==''&&Number.isInteger(Number(e.quantity_raw))&&Number(e.quantity_raw)>=0?Number(e.quantity_raw):null;
  const full=all.length&&all.every(e=>q(e)!=null)&&all.reduce((n,e)=>n+q(e),0)===i.quantity;
  const required=latest&&full?all.filter(e=>e.date<=latest).reduce((n,e)=>n+q(e),0):i.quantity;
  return i.arrived>=required;
 }) : null;
}
function toiletSupplierStatus962(a,item,day,fallback) {
 const r=a?toiletItem962(a,item,deliveryAsOf(a.key,day),day):null;
 return !r || a._cancelled ? fallback : r.arrived===r.quantity ? (r.complete?fallback:r.status) : r.arrived>0 ? r.arrived+' of '+r.quantity+' received · these fleet numbers not confirmed' : 'Assigned · arrival not recorded';
}
function toiletProgressView962(a,d,v) {
 if (v.blocked || a._cancelled || d.moved) return v;
 const x=toiletRows962(a,d,chargeLines(a),todayIso());
 if (!x || x.quantity<=0 || x.complete || !(d.done || v.arrived || x.done>0)) return v;
 const part=x.arrived<x.quantity;
 return {...v,nativeStage962:v.stage,stage:2,tone:'amber',arrived:!part,partial962:true,
  label:(part?'Part received':'Received')+' · '+x.done+'/'+x.quantity+' installed',
  why:x.status+'. '+x.detail,conflict:x.conflict};
}
function toiletScopeHtml962(a) {
 const x=toiletRows962(a,deliveryAsOf(a.key,todayIso()),chargeLines(a),todayIso());
 return x ? '<p class="units925-note" data-toilet962-scope><b>'+esc(x.status)+'</b><br>'+esc(x.detail)+'</p>' : '';
}
function toiletPresentation962(a,d,day) {
 if (!a || a._cancelled || d.moved) return null;
 const x=toiletRows962(a,d,chargeLines(a),day||todayIso());
 return x&&!x.complete&&x.quantity>0&&(d.done||d.recorded&&d.state==='on site'||x.arrived>0) ? x : null;
}
