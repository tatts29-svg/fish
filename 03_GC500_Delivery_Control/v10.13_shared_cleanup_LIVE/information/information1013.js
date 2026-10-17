/* Author: Andrew Fisher. Display recorded dates without inventing an arrival time. */
(function(root){
 'use strict';
 function day(at){
  const date=new Date(at);if(!at||!Number.isFinite(date.getTime()))return null;
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const part=key=>(parts.find(p=>p.type===key)||{}).value;
  return part('year')+'-'+part('month')+'-'+part('day');
 }
 function dateOnly(at,context){
  if(!at||!context||typeof context!=='object')return null;
  const instant=new Date(at).getTime();if(!Number.isFinite(instant))return null;
  const records=[context,context.d].filter(r=>r&&typeof r==='object');
  for(const record of records){
   const entries=[record,...(Array.isArray(record.history)?record.history:[])];
   for(const entry of entries){
    if(!entry||entry.date_only!==true||!/^\d{4}-\d{2}-\d{2}$/.test(entry.effective_date||''))continue;
    const stored=entry.at||entry.set_at;
    if(stored&&new Date(stored).getTime()===instant&&day(stored)===entry.effective_date)return entry.effective_date;
   }
  }
  return null;
 }
 function receiptDay(at,context){
  const direct=dateOnly(at,context);if(direct)return direct;
  const ref=context&&(context.ref||context.key||context.a&&context.a.key);
  // An explicit reference limits this read to its own record. Matching midnight timestamps alone prove nothing.
  if(ref&&typeof S!=='undefined')return dateOnly(at,(S.delivery||{})[ref]);
  return null;
 }
 function partialWords(scope){
  if(!scope)return '';
  if(Array.isArray(scope.rows)&&scope.rows.length)return scope.rows.map(row=>{
   if(!Number.isFinite(row.quantity)||row.quantity<0)return row.item+': quantity not recorded';
   const received=Number.isFinite(row.arrived)?row.arrived:null,installed=Number.isFinite(row.done)?row.done:null;
   const words=row.complete===true?row.quantity+'/'+row.quantity+' complete':received===null?'receipt not recorded':received<row.quantity?received+'/'+row.quantity+' received':installed===null?'installation not recorded':installed+'/'+row.quantity+' installed';
   return row.item+': '+words+(row.conflict||row.reviewQuantity>0?' · review required':'');
  }).join(' · ');
  return scope.detail||[scope.arrived+'/'+scope.quantity+' received',scope.done+'/'+scope.quantity+' installed'].join(' · ');
 }
 root.Information1013=Object.freeze({day,dateOnly,receiptDay,partialWords});
})(typeof window==='object'?window:globalThis);
