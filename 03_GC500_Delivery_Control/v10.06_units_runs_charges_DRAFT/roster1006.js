/* Author: Andrew Fisher. Native roster confirmations replace stale event-return assumptions; no hours inferred. */
(function(root){'use strict';
const NIGHT_NOTE='Night shift confirmed by Andrew Fisher, 13 Oct 2026.';
const note=row=>String(row?.note||'');
const isNight=row=>!!row&&row.kind==='labour'&&note(row).startsWith(NIGHT_NOTE);
function confirmedNights(spec,rows){
 const days=spec?.dates||[],result=[];
 for(const person of spec?.unconfirmed||[]){
  const shifts=days.map(date=>rows.find(row=>row.kind==='labour'&&row.person===person.name&&row.date===date));
  if(days.length&&shifts.every(isNight))result.push({name:person.name,dates:days.slice(),shiftIds:shifts.map(row=>row.id),hoursKnown:shifts.every(row=>row.start&&row.finish||row.hours!=null&&row.hours!=='')});
 }
 return result;
}
const api={NIGHT_NOTE,isNight,confirmedNights};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.Roster1006=api;
if(typeof document==='undefined')return;
const priorModel=eventStaffingModel833;
eventStaffingModel833=function(){
 const m=priorModel.apply(this,arguments),confirmed=confirmedNights(DATA.event_staffing833,ourCosts());
 m.confirmedNights=confirmed;m.unconfirmed=m.unconfirmed.filter(person=>!confirmed.some(row=>row.name===person.name));return m;
};
const priorRole=eventStaffingRole833;
eventStaffingRole833=function(name,date){
 if(date&&ourCosts().some(row=>row.person===name&&row.date===date&&isNight(row)))return 'Night shift';
 return priorRole.apply(this,arguments);
};
const priorQuestions=questionsList;
questionsList=function(){
 const list=priorQuestions.apply(this,arguments),confirmed=confirmedNights(DATA.event_staffing833,ourCosts());
 if(!confirmed.length)return list;
 for(const question of list){if(!Array.isArray(question.rows))continue;question.rows=question.rows.map(text=>{
  const person=confirmed.find(row=>String(text).startsWith(row.name+' ·')&&/event return.*confirm/i.test(text));
  return person?person.name+' · night shift confirmed'+(person.hoursKnown?'':' · shift times not recorded'):text;
 });}
 return list;
};
})(typeof window!=='undefined'?window:globalThis);
