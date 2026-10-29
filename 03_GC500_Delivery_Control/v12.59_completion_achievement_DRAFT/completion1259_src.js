/* Author: Andrew Fisher. Progress achievement is separate from current physical availability. */
(function(root){
 'use strict';
 const list=value=>Array.isArray(value)?value:[];
 const stamp=value=>typeof value==='string'&&value.trim()?Date.parse(value):NaN;
 const isDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
 function project(options){
  const o=options||{},native=o.native||{},out={...native};
  if(!isDay(o.day))return out;
  const cut=Date.parse(o.day+'T23:59:59.999+10:00'),current=isDay(o.today)&&o.day>=o.today;
  const lights=list(o.lightHistory),events=list(o.doneHistory).filter(h=>h&&typeof h.done==='boolean'&&Number.isFinite(stamp(h.at))).map(h=>({...h}));
  const at=stamp(native.done_at);
  // Retain legacy dated ticks, but do not erase the reason already carried by a matching history event.
  if(typeof native.done==='boolean'&&Number.isFinite(at)&&!events.some(h=>stamp(h.at)===at&&h.done===native.done))events.push({done:native.done,at:native.done_at,by:native.done_by,date_only:native.done_date_only,effective_date:native.done_effective_date,recorded_at:native.done_recorded_at});
  const movement=h=>h.done===false&&['in transit','not on site'].includes(h.because)&&lights.some(l=>l&&l.state===h.because&&Number.isFinite(stamp(l.at))&&stamp(l.at)===stamp(h.at));
  const eligible=events.filter(h=>stamp(h.at)<=cut&&!movement(h)).sort((a,b)=>stamp(a.at)-stamp(b.at)||(a.done===b.done?0:a.done?-1:1));
  const last=eligible.at(-1);
  // An undated current clear is still a correction; it cannot be backdated into a historical view.
  const undatedClear=current&&native.done===false&&!Number.isFinite(at);
  const done=!undatedClear&&(last?last.done:current&&native.done===true&&!Number.isFinite(at));
  out.done=!!done;
  out.done_at=last?last.at:done?native.done_at||null:null;
  out.done_by=last?last.by||null:done?native.done_by||null:null;
  out.done_date_only=!!(last?last.date_only:done&&native.done_date_only);
  out.done_effective_date=last?last.effective_date||null:done?native.done_effective_date||null:null;
  out.done_recorded_at=last?last.recorded_at||null:done?native.done_recorded_at||null:null;
  return out;
 }
 function delivery(ref,day,native){
  const selected=isDay(day)?day:todayIso(),d=native||deliveryAsOf(ref,selected);
  return project({native:d,doneHistory:histOf(ref,'done_history'),lightHistory:histOf(ref,'history'),day:selected,today:todayIso()});
 }
 function words(ref,day,complete,base){
  if(!complete||/left site/i.test(String(base||''))||!root||!root.Departure1211)return base;
  const r=root.Departure1211.read(ref,day);
  if(!r||r.issues?.length||!r.complete||!list(r.events).length)return base;
  const last=r.events.at(-1);
  return String(base||'Completed')+' · left site '+root.Departure1211.stamp(last);
 }
 function referenceComplete(rows){
  return list(rows).length>0&&rows.every(r=>r&&r.complete===true&&!r.conflict&&typeof r.quantity==='number'&&Number.isFinite(r.quantity)&&r.quantity>=0&&typeof r.done==='number'&&Number.isFinite(r.done)&&r.done>=r.quantity);
 }
 function aliasRow(alias,source,options){
  const o=options||{};
  // Only the native alias resolver can establish this relationship. Keep its item and quantity exact.
  if(!alias||!source||!alias.ref||!alias.source||source.key!==alias.source||alias.item!==o.item||alias.quantity!==1||source.quantity!==1||o.quantity!==1||o.included!==true||o.conflict||o.held)return null;
  return {...source,key:alias.ref,done:o.done===true?source.done:0,complete:o.done===true&&source.complete===true};
 }
 const api=Object.freeze({project,delivery,read:delivery,words,referenceComplete,aliasRow});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.CompletionAchievement1259=api;
})(typeof window==='undefined'?null:window);
