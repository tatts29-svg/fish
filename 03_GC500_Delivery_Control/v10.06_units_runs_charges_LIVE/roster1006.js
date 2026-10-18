/* Author: Andrew Fisher. Native roster confirmations replace stale event-return assumptions; no hours inferred. */
(function(root){'use strict';
const NIGHT_NOTE='Night shift confirmed 13 Oct 2026.';
const note=row=>String(row?.note||'');
const isNight=row=>!!row&&row.kind==='labour'&&/^Night shift confirmed(?: by [^,\r\n]+,)? 13 Oct 2026\.(?:\s|$)/.test(note(row));
function confirmedNights(spec,rows){
 const days=spec?.dates||[],result=[];
 for(const person of spec?.unconfirmed||[]){
  const shifts=days.map(date=>rows.find(row=>row.kind==='labour'&&row.person===person.name&&row.date===date));
  if(days.length&&shifts.every(isNight))result.push({name:person.name,dates:days.slice(),shiftIds:shifts.map(row=>row.id),hoursKnown:shifts.every(row=>row.start&&row.finish||row.hours!=null&&row.hours!=='')});
 }
 return result;
}
function missingHours(rows,helpers){
 const seen=new Set();return (rows||[]).filter(row=>{
  if(row.kind!=='labour'||!row.id||!String(row.person||'').trim()||!helpers.date(row.date)||!helpers.includes(row)||seen.has(row.id))return false;
  seen.add(row.id);return !Number.isFinite(helpers.worked(row))||!Number.isFinite(helpers.hours(row));
 }).map(row=>({id:row.id,person:row.person,date:row.date}));
}
const api={NIGHT_NOTE,isNight,confirmedNights,missingHours};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.Roster1006=api;
if(typeof document==='undefined')return;
api.missing=function(month){return missingHours(ourCosts(),{date:fin745Date,includes:rosterIncludes858,worked:runWorked,hours:runHours}).filter(row=>!month||row.date.slice(0,7)===month);};
const priorSummary=fin745Summary;
fin745Summary=function(month){const m=priorSummary.apply(this,arguments),missing=api.missing(month);return {...m,missingHours:missing,missingHoursCount:missing.length,complete:m.complete&&!missing.length};};
const priorCosts=cj764Model;
cj764Model=function(){
 const m=priorCosts.apply(this,arguments),missing=api.missing(),count=missing.length;if(!count)return m;
 const names=[...new Set(missing.map(row=>row.person))].join(', '),note=count+' labour records have no hours ('+names+'). Cost is not yet calculable.';
 return {...m,missingHours:missing,wages:{...m.wages,missingHoursCount:count},gaps:m.gaps.concat({what:count+' labour records missing hours',why:note,owner:'Running sheet — record shift hours'}),rows:m.rows.map(row=>row.stream==='Labour — wages (the running sheet)'?{...row,note:(row.note==='all hours priced'?'':row.note+' · ')+note}:row)};
};
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
 const missing=api.missing(),labour=list.find(q=>q.id==='lb-rates');
 if(missing.length&&labour){labour.st=QH_OPEN;labour.q='Labour costs — hours and rates to review';labour.why=missing.length+' labour records have no hours. Their cost cannot be calculated.';labour.need='Record shift hours on the Running sheet.';labour.rows=[...new Set([...(labour.rows||[]),...[...new Set(missing.map(row=>row.person))].map(name=>name+' · '+missing.filter(row=>row.person===name).length+' records missing hours')])];labour.go='runsheet';}
 if(!confirmed.length)return list;
 for(const question of list){if(!Array.isArray(question.rows))continue;question.rows=question.rows.map(text=>{
  const person=confirmed.find(row=>String(text).startsWith(row.name+' ·')&&/event return.*confirm/i.test(text));
  return person?person.name+' · night shift confirmed'+(person.hoursKnown?'':' · shift times not recorded'):text;
 });}
 return list;
};
})(typeof window!=='undefined'?window:globalThis);
